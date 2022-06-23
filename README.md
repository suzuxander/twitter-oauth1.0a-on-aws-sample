# twitter-oauth1a-on-aws-sample
## 概要
TwitterのOAuth1.0aを使用するプロジェクトのサンプル。  
API Gateway + Lambda関数を使用して認可等を行う。実装言語はTypescript。  
AWSリソースのデプロイはCDKにより行う。

## 前提
以下はインストール済みとする。
- NodeJS 16くらい
- Java 8くらい (openapi-generatorを実行する際に必要)

## セットアップ
### Twitter Developer Portalの設定
Twitterの[Developer Portal](https://developer.twitter.com/en/portal/dashboard)にてProject or Appを追加し、以下設定を行う。
- `OAuth1.0a`を有効化する
- `Callback URI / Redirect URL`はこの時点では適当な値を設定しておく
- 保存した際に生成される`API Key`、`API Key Secret`などのクレデンシャル情報は必ずメモしておく

### 必要なライブラリのインストール
```
$ npm run init
```
### CDKデプロイ用の環境変数を設定
```
$ vim .env
ACCOUNT_ID={ACCOUNT_ID}          # AWSのアカウントID
REGION={REGION}                  # AWSリソースをデプロイするリージョン
BUCKET={BUCKET}                  # code_verifierを保存するバケット
API_KEY={API_KEY}                # "Twitterの設定 1"でメモした値
API_KEY_SECRET={API_KEY_SECRET}  # "Twitterの設定 1"でメモした値
CALLBACK_URL={CALLBACK_URL}      # "Twitterの設定 1"でメモした値
API_BASE_PATH={API_BASE_PATH}    # 
```
### CDKデプロイ
```
$ npm run deploy

twitter-oauth1a-sample: creating CloudFormation changeset...

 ✅  twitter-oauth1a-sample

✨  Deployment time: 38.67s

Outputs:
twitter-oauth1a-sample.ApiEndpoint00000000 = https://xxxxxxxxxx.execute-api.ap-northeast-1.amazonaws.com/dev/

```
### リダイレクトURLの変更
Twitterの[Developer Portal](https://developer.twitter.com/en/portal/dashboard)で`Callback URI / Redirect URL`の値をデプロイで生成されたAPIのエンドポイント + `callback`に変更する。  
```
https://xxxxxxxxxx.execute-api.ap-northeast-1.amazonaws.com/dev/callback
```

### 動作確認
1. デプロイで生成されたAPIの以下エンドポイントにブラウザからアクセスする
   ```
   https://xxxxxxxxxx.execute-api.ap-northeast-1.amazonaws.com/dev/
   ```
1. 「◯◯◯にアカウントへのアクセスを許可しますか？」という画面が表示されるので、「アプリにアクセスを許可」をクリックする
1. 以下のようにレスポンスの内容が表示されれば、Twitterの認証ページからのコールバックが受け取れている
   ```json
   {"oauth_token":"{OAUTH_TOKEN}","oauth_verifier":"{OAUTH_VERIFIER}"}
   ```
1. 以下のURLにブラウザからアクセスする (curlでもOK)
   `oauth_token`、`oauth_verifier`はコールバックで受け取った値を入れる
   ```
   https://xxxxxxxxxx.execute-api.ap-northeast-1.amazonaws.com/dev/token?oauth_token={OAUTH_TOKEN}&oauth_verifier={OAUTH_VERIFIER}
   ```
   以下のようにレスポンスが表示されればアクセストークンの取得が成功している
   ```json
   {"userId":"{TWITTER_USER_ID}","userName":"{TWITTER_USER_NAME}"}
   ```
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
callbackで受け取ったstateとcodeをパラメータで付与してリクエストをくることでaccess_tokenを取得する。
  
## Twitter OAuth2.0
https://developer.twitter.com/en/docs/authentication/oauth-1-0a
