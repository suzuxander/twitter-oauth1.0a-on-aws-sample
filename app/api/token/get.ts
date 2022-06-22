import { APIGatewayEvent, Callback } from 'aws-lambda';
import config from 'app/config';
import { GetAccessTokenRequest } from 'gen/sample';
import * as s3client from 'app/service/s3';
import { getAccessToken } from 'app/service/twitter';

const main = async (oauthToken: string, oauthVerifier: string): Promise<any> => {
  // request_token取得時にs3に保管していたoauth_token_secretを取得する
  const oauthTokenSecret = await s3client.getObject(config.bucket, oauthToken);

  const response = await getAccessToken(
    oauthToken, oauthTokenSecret.toString(), oauthVerifier);

  return {
    userId: response.user_id,
    userName: response.screen_name,
  };
};

export const handler = async (event: APIGatewayEvent, context: any, callback: Callback): Promise<void> => {
  try {
    const query = event.queryStringParameters as any as GetAccessTokenRequest;
    const data = await main(query.oauthToken, query.oauthVerifier);
    return callback(null, {
      statusCode: 200 ,
      body: JSON.stringify(data)
    });
  } catch (e: any) {
    console.log(e);
    return callback(null, {
      statusCode: e.response.status ?? 500 ,
      body: JSON.stringify(e.response.data)
    });
  }
};