import { APIGatewayEvent, Callback } from 'aws-lambda';

export const handler = async (event: APIGatewayEvent, context: any, callback: Callback): Promise<void> => {
  try {
    return callback(null, {
      statusCode: 200 ,
      body: JSON.stringify(event.queryStringParameters ?? {})
    });
  } catch (e: any) {
    console.log(e);
    return callback(null, {
      statusCode: e.response.status ?? 500 ,
      body: JSON.stringify(e.response.data)
    });
  }
};