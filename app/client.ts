import path from 'path';
import { DefaultApi } from 'gen/sample';
import * as dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '../.env') });

import config from 'app/config';

(async () => {
  const oauthToken = process.argv[2];
  const oauthVerifier = process.argv[3];
  if (!oauthToken) {
    console.error('You need oauthToken!');
  }
  if (!oauthVerifier) {
    console.error('You need oauthVerifier!');
  }
  const client = new DefaultApi({
    basePath: config.apiBasePath
  } as any);
  const res = await client.tokenGet(oauthToken, oauthVerifier);
  console.log(res.data);
})();
