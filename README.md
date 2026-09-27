# comfortex

comfortable TeX environment for Japanese with CI/CD

## Create TeX Environment for Local

### Requirement

- Make
- Docker
- Docker Compose
- Network connection

### Setup

```
make init
```

### Build TeX Document

```
make build
```

## CI/CD Environment

With GitHub Actions, you can get textlint and Builded PDF File Preview Link.

### Setup
#### 1. Create Dropbox Apps

[Create Dropbox apps](https://www.dropbox.com/developers/apps).

And, get `app key` and `app secret`.

Next, get api request access code.
Access `https://www.dropbox.com/oauth2/authorize?client_id=$APP_KEY&response_type=code&token_access_type=offline`.
Please replace `$APP_KEY` with your actual app key.

Finaly, get api request refresh token.
Run curl command below.
```
curl https://api.dropbox.com/oauth2/token \
    -d code=$AUTHORIZATION_CODE \
    -d grant_type=authorization_code \
    -d client_id=$APP_KEY \
    -d client_secret=$APP_SECRET
```
Please replace `$AUTHORIZATION_CODE`, `$APP_KEY`, and `$APP_SECRET` with your actual values.
You can find refresh token in the response json.

Further documentation can be found at [Dropbox API Documentation](https://www.dropbox.com/developers/documentation/http/documentation).

##### 2. Set Secrets

Set actions secrets and variables.

| Name | Value |
| ---- | ----- |
| DROPBOX_APP_KEY | Your Dropbox App key |
| DROPBOX_APP_SECRET | Your Dropbox App secret |
| DROPBOX_REFRESH_TOKEN | Your Dropbox Refresh Token |

### Customization

Linter settings can be customized in the `.textlintrc` file.
