"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function UpdatePasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("パスワードは8文字以上で入力してください。");
      return;
    }
    if (password !== confirmPassword) {
      setError("確認用パスワードが一致しません。");
      return;
    }

    setIsPending(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setIsPending(false);
    if (updateError) {
      setError("パスワードを更新できませんでした。再設定メールのリンクが期限切れでないか確認してください。");
      return;
    }

    router.replace("/menu");
    router.refresh();
  }

  return (
    <main className="auth-shell">
      <section className="auth-panel update-password-panel">
        <div className="auth-content">
          <p className="eyebrow form-eyebrow">DUEL MASTERS RECORD</p>
          <h2>新しいパスワード</h2>
          <p className="form-intro">新しく使用するパスワードを設定してください。</p>
          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="field-label">
              新しいパスワード
              <input autoComplete="new-password" minLength={8} onChange={(event) => setPassword(event.target.value)} required type="password" value={password} />
            </label>
            <label className="field-label">
              パスワード（確認）
              <input autoComplete="new-password" minLength={8} onChange={(event) => setConfirmPassword(event.target.value)} required type="password" value={confirmPassword} />
            </label>
            {error && <p className="form-message error-message" role="alert">{error}</p>}
            <button className="submit-button" disabled={isPending} type="submit">{isPending ? "更新中…" : "パスワードを更新"}</button>
          </form>
        </div>
      </section>
    </main>
  );
}
