"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { createClient } from "@/utils/supabase/client";

type AuthFormProps = { mode: "login" | "signup"; initialError?: string };

function signupErrorMessage(error: { message: string; code?: string; status?: number }) {
  const message = error.message.toLowerCase();
  const code = error.code?.toLowerCase() ?? "";

  if (code === "email_exists" || code === "user_already_exists" || message.includes("already registered") || message.includes("already exists")) {
    return "このメールアドレスはすでに登録されています。ログインをお試しください。";
  }
  if (code === "over_email_send_rate_limit" || message.includes("rate limit")) {
    return "確認メールの送信回数が上限に達しました。少し時間をおいてからお試しください。";
  }
  if (code === "weak_password" || message.includes("password")) {
    return "パスワードの条件を満たしていません。8文字以上で入力してください。";
  }
  if (code === "email_address_invalid" || message.includes("invalid email")) {
    return "メールアドレスの形式を確認してください。";
  }
  if (message.includes("database error") || message.includes("saving new user")) {
    return "プロフィールの作成に失敗しました。SupabaseのSQL Editorで supabase/profiles.sql を実行済みか確認してください。";
  }
  if (process.env.NODE_ENV === "development") {
    return `登録エラー${error.status ? ` (${error.status})` : ""}${error.code ? ` [${error.code}]` : ""}: ${error.message}`;
  }
  return "登録できませんでした。入力内容とSupabaseの設定を確認して、もう一度お試しください。";
}

export default function AuthForm({ mode, initialError }: AuthFormProps) {
  const router = useRouter();
  const isSignup = mode === "signup";
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState(initialError ?? "");
  const [isPending, setIsPending] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  async function handlePasswordReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsPending(true);

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/update-password`,
    });

    setIsPending(false);
    if (resetError) {
      setError("再設定メールを送信できませんでした。時間をおいてから、もう一度お試しください。");
      return;
    }

    setMessage("該当するアカウントがある場合、パスワード再設定メールを送信します。メールをご確認ください。");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    const normalizedUsername = username.trim();
    if (isSignup && (Array.from(normalizedUsername).length < 1 || Array.from(normalizedUsername).length > 20)) {
      setError("ユーザー名は1〜20文字で入力してください。");
      return;
    }
    if (isSignup && password !== confirmPassword) {
      setError("確認用パスワードが一致しません。");
      return;
    }
    if (password.length < 8) {
      setError("パスワードは8文字以上で入力してください。");
      return;
    }

    setIsPending(true);
    const supabase = createClient();

    if (isSignup) {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { username: normalizedUsername },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      setIsPending(false);
      if (signUpError) {
        setError(signupErrorMessage(signUpError));
        return;
      }

      // Supabase hides duplicate confirmed accounts when email confirmation is enabled.
      if (data.user && data.user.identities?.length === 0) {
        setError("このメールアドレスはすでに使用されています。ログインするか、パスワードを再設定してください。");
        return;
      }

      if (data.session) {
        router.replace("/menu");
        router.refresh();
        return;
      }

      setMessage("確認メールを送信しました。メール内のリンクを開くと登録が完了します。");
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setIsPending(false);

    if (signInError) {
      setError("ログインできませんでした。メールアドレスとパスワードを確認してください。");
      return;
    }

    router.replace("/menu");
    router.refresh();
  }

  return (
    <main className="auth-shell">
      <section className="auth-art" aria-label="デュエプレ戦績管理">
        <div className="brand-mark" aria-hidden="true">D</div>
        <div className="art-copy">
          <p className="eyebrow">DUEL MASTERS · MATCH LOG</p>
          <h1>勝ちも、学びも、<br />ここに記録。</h1>
          <p className="art-description">対戦を記録して、デュエプレをもっと楽しもう。</p>
        </div>
        <div className="card-stack" aria-hidden="true">
          <div className="glow-orb" />
          <div className="playing-card card-back"><span>DM</span><i>DUEL</i></div>
          <div className="playing-card card-front"><span>戦績</span><i>RECORD</i></div>
        </div>
        <p className="art-footer">YOUR BATTLES, YOUR STORY.</p>
      </section>

      <section className="auth-panel">
        <div className="mobile-brand"><span className="brand-mark small">D</span><span>DUEL LOG</span></div>
        <div className="auth-content">
          <p className="eyebrow form-eyebrow">DUEL MASTERS RECORD</p>
          <h2>{isSignup ? "アカウントを作成" : "ようこそ"}</h2>
          <p className="form-intro">
            {isSignup ? "対戦記録をつけて、デッキの歩みを残しましょう。" : "ログインして、あなたの対戦記録を確認しましょう。"}
          </p>

          {isResetMode ? (
            <form className="auth-form" onSubmit={handlePasswordReset}>
              <p className="form-intro reset-intro">登録したメールアドレスに、パスワード再設定用のリンクを送ります。</p>
              <label className="field-label">
                メールアドレス
                <input
                  autoComplete="email"
                  onChange={(event) => setResetEmail(event.target.value)}
                  placeholder="you@example.com"
                  required
                  type="email"
                  value={resetEmail}
                />
              </label>
              {error && <p className="form-message error-message" role="alert">{error}</p>}
              {message && <p className="form-message success-message" role="status">{message}</p>}
              <button className="submit-button" disabled={isPending} type="submit">
                {isPending ? "送信中…" : "再設定メールを送信"}
              </button>
              <button className="auth-text-button" onClick={() => { setIsResetMode(false); setError(""); setMessage(""); }} type="button">
                ログインに戻る
              </button>
            </form>
          ) : <form className="auth-form" onSubmit={handleSubmit}>
            {isSignup && (
              <label className="field-label">
                ユーザー名
                <input
                  autoComplete="username"
                  maxLength={20}
                  minLength={1}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="ユーザー名を入力"
                  required
                  value={username}
                />
                  <span className="field-hint">アプリ内で表示されます（1〜20文字）</span>
              </label>
            )}

            <label className="field-label">
              メールアドレス
              <input
                autoComplete="email"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
                type="email"
                value={email}
              />
            </label>

            <label className="field-label">
              パスワード
              <input
                autoComplete={isSignup ? "new-password" : "current-password"}
                minLength={8}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="8文字以上"
                required
                type="password"
                value={password}
              />
            </label>

            {isSignup && (
              <label className="field-label">
                パスワード（確認）
                <input
                  autoComplete="new-password"
                  minLength={8}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="もう一度入力"
                  required
                  type="password"
                  value={confirmPassword}
                />
              </label>
            )}

            {error && <p className="form-message error-message" role="alert">{error}</p>}
            {message && <p className="form-message success-message" role="status">{message}</p>}

            <button className="submit-button" disabled={isPending} type="submit">
              {isPending ? "処理中…" : isSignup ? "アカウントを作成" : "ログイン"}
              <span aria-hidden="true">↗</span>
            </button>
          </form>}

          {!isResetMode && !isSignup && <p className="auth-switch forgot-password">
            <button className="auth-text-button" onClick={() => { setResetEmail(email); setIsResetMode(true); setError(""); setMessage(""); }} type="button">
              パスワードを忘れた方はこちら
            </button>
          </p>}
          {!isResetMode && <p className="auth-switch">
            {isSignup ? "すでにアカウントをお持ちですか？" : "はじめてご利用ですか？"}{" "}
            <Link href={isSignup ? "/" : "/signup"}>{isSignup ? "ログイン" : "新規登録"}</Link>
          </p>}
          {!isResetMode && <p className="auth-note">パスワードは8文字以上で設定してください。</p>}
        </div>
        <p className="panel-footer">© 2026 DUEL MASTERS RECORD</p>
      </section>
    </main>
  );
}
