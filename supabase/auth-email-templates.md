# DUEL LOG auth email branding

Supabase sends authentication emails. The application requests the correct callback URLs, while the sender name, subject, and email body are configured in the Supabase Dashboard.

## Confirmation email

In **Authentication → Email Templates → Confirm signup**, set the subject to:

```text
【DUEL LOG】メールアドレスを確認してください
```

Use this HTML body:

```html
<h2>DUEL LOG（デュエプレ戦績管理）へようこそ</h2>
<p>アカウント登録を完了するため、次のボタンからメールアドレスを確認してください。</p>
<p><a href="{{ .ConfirmationURL }}">メールアドレスを確認する</a></p>
<p>このメールに心当たりがない場合は、何もせず削除してください。</p>
<p>DUEL LOG — デュエプレの対戦記録を管理するウェブアプリ</p>
```

## Password recovery email

In **Authentication → Email Templates → Reset Password**, set the subject to:

```text
【DUEL LOG】パスワード再設定のご案内
```

Use this HTML body:

```html
<h2>DUEL LOG（デュエプレ戦績管理）</h2>
<p>パスワード再設定のリクエストを受け付けました。</p>
<p><a href="{{ .ConfirmationURL }}">新しいパスワードを設定する</a></p>
<p>リクエストしていない場合は、このメールを無視してください。パスワードは変更されません。</p>
<p>DUEL LOG — デュエプレの対戦記録を管理するウェブアプリ</p>
```

## Sender identity

To show `DUEL LOG（デュエプレ戦績管理）` as the sender, configure a custom SMTP provider in **Authentication → SMTP Settings** and set its sender name and a verified sender email address. The app cannot change the email sender identity from browser code. Configure the provider's required DNS records (such as SPF/DKIM) before sending production email.

Add the deployed callback URL to **Authentication → URL Configuration → Redirect URLs**:

```text
https://record-rho-flame.vercel.app/auth/callback
```

For local testing, also allow `http://localhost:3000/auth/callback`.
