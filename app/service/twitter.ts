import { DefaultApi, ParsedAccessTokenResponse, ParsedPostRequestTokenResponse } from 'gen/twitter';
import * as uuid from 'uuid';
import config from 'app/config';
import crypto from 'crypto';

const TWITTER_API_REQUEST_TOKEN = 'https://api.twitter.com/oauth/request_token';
const TWITTER_API_ACCESS_TOKEN = 'https://api.twitter.com/oauth/access_token';

const encode = (toEncode: string) => {
  return encodeURIComponent(toEncode).replace(/\!/g, "%21")
    .replace(/\'/g, "%27")
    .replace(/\(/g, "%28")
    .replace(/\)/g, "%29")
    .replace(/\*/g, "%2A");
};

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

const generateSignature = (method: string, url: string, parameters: string, tokenSecret = ''): string => {
  const encodedUrl = encode(url);
  const encodedParameters = encode(parameters);
  const signatureBase = method.toUpperCase() + "&" + encodedUrl + "&" + encodedParameters;
  const key = encode(config.apiKeySecret) + '&' + encode(tokenSecret);
  return crypto.createHmac("sha1", key).update(signatureBase).digest("base64");
};

const generateAuthorizationHeader = (method: string, url: string, parameters: { [p: string]: string }, tokenSecret = ''): string => {
  const params: { [p: string]: string } = {
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_nonce: uuid.v4(),
    oauth_version: '1.0',
    oauth_signature_method: 'HMAC-SHA1',
    oauth_consumer_key: config.apiKey,
  };
  Object.keys(parameters).map(key => {
    params[key] = parameters[key];
  })
  const signature = generateSignature(
    method,
    url,
    encodeRequestParams(params),
    tokenSecret
  );

  return 'OAuth ' + Object.keys(params)
    .sort((a, b) => a > b ? 1 : -1)
    .map(key => `${encode(key)}="${encode(params[key])}"`)
    .concat(`oauth_signature="${encode(signature)}"`)
    .join(',');
};

export const getRequestToken = async (): Promise<ParsedPostRequestTokenResponse> => {
  const oauthParameters: { [p: string]: string } = {
    oauth_callback: config.callbackUrl,
  };

  const authorization =　generateAuthorizationHeader('post', TWITTER_API_REQUEST_TOKEN, oauthParameters);
  const client = new DefaultApi();
  const response = await client.oauthRequestTokenPost(authorization);
  const data: { [p: string]: string } = {};

  (response.data).split('&').forEach(item => {
    const ary = item.split('=');
    data[ary[0]] = ary[1];
  });

  return data as any as ParsedPostRequestTokenResponse;
};

export const getAccessToken = async (oauthToken: string, oauthTokenSecret: string, oauthVerifier: string): Promise<ParsedAccessTokenResponse> => {
  const oauthParameters: { [p: string]: string } = {
    oauth_token: oauthToken,
    oauth_verifier: oauthVerifier
  };

  const authorization = generateAuthorizationHeader(
    'post',
    TWITTER_API_ACCESS_TOKEN,
    oauthParameters,
    oauthTokenSecret.toString()
  );
  const client = new DefaultApi();
  const response = await client.oauthAccessTokenPost(authorization);

  const data: { [p: string]: string } = {};
  (response.data).split('&').forEach(item => {
    const ary = item.split('=');
    data[ary[0]] = ary[1];
  });
  return data as any as ParsedAccessTokenResponse;
};