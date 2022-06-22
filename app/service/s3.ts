import { S3 } from 'aws-sdk';

export const putObject = async (bucket: string, objectKey: string, body: any): Promise<void> => {
  const client = new S3();
  await client.putObject({
    Bucket: bucket,
    Key: objectKey,
    Body: body
  }).promise();
};

export const getObject = async (bucket: string, objectKey: string): Promise<any> => {
  const client = new S3();
  const response = await client.getObject({
    Bucket: bucket,
    Key: objectKey,
  }).promise();
  return response.Body;
};

