# twitter-oauth1.0a-on-aws-sample
## 概要
TwitterのOAuth1.0aを使用するプロジェクトのサンプル。  
API Gateway + Lambda関数を使用して認可等を行う。実装言語はTypescript。  
AWSリソースのデプロイはCDKにより行う。

## 前提
- Twitter Developerの登録が完了している
- 以下はインストール済みとする
   - NodeJS 16くらい
   - Java 8くらい (openapi-generatorを実行する際に必要)

## セットアップ
### 1. Twitter Developer Portalの設定
Twitterの[Developer Portal](https://developer.twitter.com/en/portal/dashboard)にてProject or Appを追加し、以下設定を行う。
- `OAuth1.0a`を有効化する
- `Callback URI / Redirect URL`はこの時点では適当な値を設定しておく
- 保存した際に生成される`API Key`、`API Key Secret`などのクレデンシャル情報は必ずメモしておく

### 2. 必要なライブラリのインストール
```bash
$ npm run init
```
### 3. CDKデプロイ用の環境変数を設定
```bash
$ vim .env
ACCOUNT_ID={ACCOUNT_ID}          # AWSのアカウントID
REGION={REGION}                  # AWSリソースをデプロイするリージョン
BUCKET={BUCKET}                  # oauth_token_secretを保存するバケット
API_KEY={API_KEY}                # Twitter Developer Portalで設定を行った際に取得したAPI Key
API_KEY_SECRET={API_KEY_SECRET}  # Twitter Developer Portalで設定を行った際に取得したAPI Key Secret
CALLBACK_URL={CALLBACK_URL}      # 一旦適当な値を設定
API_BASE_PATH={API_BASE_PATH}    # 一旦適当な値を設定
```
### 4. CDKデプロイ
```bash
$ npm run deploy

twitter-oauth1a-sample: creating CloudFormation changeset...

 ✅  twitter-oauth1a-sample

✨  Deployment time: 38.67s

Outputs:
twitter-oauth1a-sample.ApiEndpoint00000000 = https://xxxxxxxxxx.execute-api.ap-northeast-1.amazonaws.com/dev/

```
### 5. コールバックURLの変更
Twitterの[Developer Portal](https://developer.twitter.com/en/portal/dashboard)で`Callback URI / Redirect URL`の値をデプロイで生成されたAPIのエンドポイント + `callback`に変更する。  
```
https://xxxxxxxxxx.execute-api.ap-northeast-1.amazonaws.com/dev/callback
```
### 6. CDKデプロイ用の環境変数を再設定
適当な値を入れていたコールバックURLをデプロイで生成されたAPIのエンドポイント + `callback`に変更する。
```bash
$ vim .env
CALLBACK_URL=https://xxxxxxxxxx.execute-api.ap-northeast-1.amazonaws.com/dev/callback 
```
### 7. CDKデプロイ
コールバックURLの変更を反映させるために再度デプロイを実行する。
```bash
$ npm run deploy
```

## 動作確認
### 1. 認証ページにアクセス
デプロイで生成されたAPIの以下エンドポイントにブラウザからアクセスする。
```
https://xxxxxxxxxx.execute-api.ap-northeast-1.amazonaws.com/dev/
```
### 2. アカウントへのアクセスに許可
「◯◯◯にアカウントへのアクセスを許可しますか？」という画面が表示されるので、「アプリにアクセスを許可」をクリックする。  
以下のようにレスポンスの内容が表示されれば、Twitterの認証ページからのコールバックが受け取れている。
```json
{"oauth_token":"{OAUTH_TOKEN}","oauth_verifier":"{OAUTH_VERIFIER}"}
```

### 3. アクセストークンの取得
以下のURLにブラウザからアクセスする。 (curlなどでもOK)  
`oauth_token`、`oauth_verifier`はコールバックで受け取った値を入れる。
```
https://xxxxxxxxxx.execute-api.ap-northeast-1.amazonaws.com/dev/token?oauth_token={OAUTH_TOKEN}&oauth_verifier={OAUTH_VERIFIER}
```
以下のようにレスポンスが表示されればアクセストークンの取得が成功している。
```json
{"oauth_token":"{OAUTH_TOKEN}","oauth_token_secret":"{OAUTH_TOKEN_SECRET}","user_id":"{USER_ID}","screen_name":"{SCREEN_NAME}"}
```

## APIの説明
### [GET /](./app/api/auth/get.ts)  
Twitterの認証ページのURLを生成し、リダイレクトさせるエンドポイント。  
認証ページのパラメータとしていくつかの情報が必要であるため、それらをこのAPI内で生成している。  
  
### [GET /callback](./app/api/callback/get.ts) 
Twitterの認証ページでアクセス許可が行われた際にリダイレクトされるエンドポイント。  
Twitterの認証ページから受け取ったパラメータを返却しているだけ。
  
### [GET /token](./app/api/token/get.ts)
access_tokenを取得するためのエンドポイント。  
callbackで受け取ったoauth_tokenとoauth_verifierをパラメータで付与してリクエストをくることでaccess_tokenを取得する。
  
## Twitter OAuth1.0a
プロセスや詳細な手順については[こちら](https://developer.twitter.com/ja/docs/authentication/oauth-1-0a/obtaining-user-access-tokens)を参照。  
本プロジェクトでの実装は[こちら](./app/service/twitter.ts)。
