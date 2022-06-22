import { APIGatewayEvent, Callback } from 'aws-lambda';
import * as uuid from 'uuid';
import config from 'app/config';
import * as s3client from 'app/service/s3';
import { getRequestToken } from 'app/service/twitter';

const TWITTER_API_AUTHORIZE = 'https://api.twitter.com/oauth/authorize';

const generateRedirectUrl = async (): Promise<any> => {
  const response = await getRequestToken();

  // access_token取得時にoauth_token_secretが必要になるのでs3に保管しておく
  await s3client.putObject(config.bucket, response.oauth_token, response.oauth_token_secret);

  return TWITTER_API_AUTHORIZE + '?oauth_token=' + response.oauth_token
};

export const handler = async (event: APIGatewayEvent, context: any, callback: Callback): Promise<void> => {
  try {
    const redirectUrl = await generateRedirectUrl();
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