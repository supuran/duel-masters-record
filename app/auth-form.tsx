"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

type AuthFormProps = { mode: "login" | "signup" };

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const isSignup = mode === "signup";
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("error") === "confirmation") {
      setError("メール認証を完了できませんでした。確認メールのリンクを開き直してください。");
    }
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    const normalizedUsername = username.trim();
    if (isSignup && (normalizedUsername.length < 2 || normalizedUsername.length > 20)) {
      setError("ユーザー名は2〜20文字で入力してください。");
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
        setError(
          signUpError.message.toLowerCase().includes("already registered")
            ? "このメールアドレスはすでに登録されています。"
            : signUpError.message.toLowerCase().includes("duplicate")
              ? "このユーザー名はすでに使われています。"
              : "登録できませんでした。入力内容を確認して、もう一度お試しください。"
        );
        return;
      }

      if (data.session) {
        router.replace("/mypage");
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

    router.replace("/mypage");
    router.refresh();
  }

  return (
    <main className="auth-shell">
      <section className="auth-art" aria-label="デュエマ戦績管理">
        <div className="brand-mark" aria-hidden="true">D</div>
        <div className="art-copy">
          <p className="eyebrow">DUEL MASTERS · MATCH LOG</p>
          <h1>勝ちも、学びも、<br />ここに記録。</h1>
          <p className="art-description">対戦を記録して、自分のデュエマをもっと楽しもう。</p>
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
          <h2>{isSignup ? "アカウントを作成" : "おかえりなさい"}</h2>
          <p className="form-intro">
            {isSignup ? "対戦記録をつけて、デッキの歩みを残しましょう。" : "ログインして、あなたの対戦記録を確認しましょう。"}
          </p>

          <form className="auth-form" onSubmit={handleSubmit}>
            {isSignup && (
              <label className="field-label">
                ユーザー名
                <input
                  autoComplete="username"
                  maxLength={20}
                  minLength={2}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="例：duel_player"
                  required
                  value={username}
                />
                <span className="field-hint">アプリ内で表示されます（2〜20文字）</span>
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
          </form>

          <p className="auth-switch">
            {isSignup ? "すでにアカウントをお持ちですか？" : "はじめてご利用ですか？"}{" "}
            <Link href={isSignup ? "/" : "/signup"}>{isSignup ? "ログイン" : "新規登録"}</Link>
          </p>
          <p className="auth-note">パスワードは8文字以上で設定してください。</p>
        </div>
        <p className="panel-footer">© 2026 DUEL MASTERS RECORD</p>
      </section>
    </main>
  );
}
