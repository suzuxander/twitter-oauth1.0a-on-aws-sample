import { APIGatewayEvent, Callback } from 'aws-lambda';
import * as uuid from 'uuid';
import config from 'app/config';
import crypto from 'crypto';
import { DefaultApi } from 'gen/twitter';

const TWITTER_API_REQUEST_TOKEN = 'https://api.twitter.com/oauth/request_token';
const TWITTER_API_AUTHORIZE = 'https://api.twitter.com/oauth/authorize';

const encodeRequestParams = (args: { [p: string]: string }): string => {
  return Object.keys(args)
      .map(key => [ encode(key), encode(args[key]) ])
      .sort((a: any, b: any) => {
        if (a[0] == b[0]) {
          return a[1] < b[1] ? -1 : 1;
        }
        return a[0] < b[0] ? -1 : 1;
      })
    .map(arg => arg[0] + '=' + arg[1]).join('&');
};

const encode = (toEncode: string) => {
  return encodeURIComponent(toEncode).replace(/\!/g, "%21")
      .replace(/\'/g, "%27")
      .replace(/\(/g, "%28")
      .replace(/\)/g, "%29")
      .replace(/\*/g, "%2A");
};

const generateSignature = (method: string, url: string, parameters: string, tokenSecret = ''): string => {
  const encodedUrl = encode(url);
  const encodedParameters = encode(parameters);
  const signatureBase = method.toUpperCase() + "&" + encodedUrl + "&" + encodedParameters;
  const key = encode(config.apiKeySecret) + '&' + encode(tokenSecret);
  return crypto.createHmac("sha1", key).update(signatureBase).digest("base64");
};

const main = async (): Promise<any> => {
  const oauthParameters: { [p: string]: string } = {
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_nonce: uuid.v4(),
    oauth_version: '1.0A',
    oauth_signature_method: 'HMAC-SHA1',
    oauth_consumer_key: config.apiKey,
    oauth_callback: config.callbackUrl,
  };

  const signature = generateSignature(
    'post',
    TWITTER_API_REQUEST_TOKEN,
    encodeRequestParams(oauthParameters)
  );

  const authorization = 'OAuth ' + Object.keys(oauthParameters)
    .sort((a, b) => a > b ? 1 : -1)
    .map(key => `${encode(key)}="${encode(oauthParameters[key])}"`)
    .concat(`oauth_signature="${encode(signature)}"`)
    .join(',');

  const client = new DefaultApi();
  const response = await client.oauthRequestTokenPost(authorization);
  const data: { [p: string]: string } = {};
  (response.data).split('&').forEach(item => {
    const ary = item.split('=');
    data[ary[0]] = ary[1];
  });
  return TWITTER_API_AUTHORIZE + '?oauth_token=' + data.oauth_token
};

export const handler = async (event: APIGatewayEvent, context: any, callback: Callback): Promise<void> => {
  try {
    const redirectUrl = await main();
    return callback(null, {
      statusCode: 302,
      headers: {
        Location: redirectUrl
      }
    });
  } catch (e: any) {
    return callback(null, {
      statusCode: 500 ,
      body: JSON.stringify(e.response.data)
    });
  }
};