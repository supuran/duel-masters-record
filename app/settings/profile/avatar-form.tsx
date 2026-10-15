"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ChangeEvent, type FormEvent, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

const MIME_EXTENSIONS: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const MAX_SIZE = 3 * 1024 * 1024;

export default function AvatarForm({ username, bio, avatarPath, avatarUrl }: { username: string; bio: string | null; avatarPath: string | null; avatarUrl: string | null }) {
  const router = useRouter();
  const [usernameValue, setUsernameValue] = useState(username);
  const [bioValue, setBioValue] = useState(bio ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null;
    setError("");
    if (!selected) { setFile(null); setPreview(null); return; }
    if (!MIME_EXTENSIONS[selected.type]) { setError("JPEG、PNG、WebP形式の画像を選んでください。"); event.target.value = ""; return; }
    if (selected.size > MAX_SIZE) { setError("画像サイズは3MB以下にしてください。"); event.target.value = ""; return; }
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedUsername = usernameValue.trim();
    const normalizedBio = bioValue.trim();
    if (Array.from(normalizedUsername).length < 1 || Array.from(normalizedUsername).length > 20) { setError("ユーザー名は1〜20文字で入力してください。"); return; }
    if (Array.from(normalizedBio).length > 100) { setError("自己紹介は100文字以内で入力してください。"); return; }
    setPending(true);
    setError("");
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (!user || authError) { setPending(false); setError("ログイン状態を確認できません。もう一度ログインしてください。"); return; }
    let newAvatarPath: string | null = null;
    if (file) {
      newAvatarPath = `${user.id}/${crypto.randomUUID()}.${MIME_EXTENSIONS[file.type]}`;
      const { error: uploadError } = await supabase.storage.from("user-avatars").upload(newAvatarPath, file, { contentType: file.type, upsert: false });
      if (uploadError) { setPending(false); setError(`画像をアップロードできませんでした。Supabase SQL Editorで supabase/avatars.sql を実行済みか確認してください。 (${uploadError.message})`); return; }
    }
    const { error: updateError } = await supabase.from("profiles").update({
      username: normalizedUsername,
      bio: normalizedBio || null,
      ...(newAvatarPath ? { avatar_path: newAvatarPath } : {}),
    }).eq("id", user.id);
    if (updateError) {
      if (newAvatarPath) await supabase.storage.from("user-avatars").remove([newAvatarPath]);
      setPending(false);
      setError(`プロフィールを更新できませんでした。${updateError.message}`);
      return;
    }
    if (newAvatarPath && avatarPath?.startsWith(`${user.id}/`)) await supabase.storage.from("user-avatars").remove([avatarPath]);
    router.push("/mypage?profileUpdated=1");
    router.refresh();
  }

  const imageUrl = preview ?? avatarUrl;
  const initial = username.trim().charAt(0).toUpperCase() || "D";
  return (
    <form className="avatar-settings-form" onSubmit={handleSubmit}>
      <div className="avatar-settings-preview">{imageUrl ? <Image alt="ユーザーアイコン" className="avatar-preview-image" height={112} src={imageUrl} unoptimized width={112} /> : <span>{initial}</span>}</div>
      <label className="field-label">ユーザー名<input autoComplete="nickname" maxLength={20} minLength={1} onChange={(event) => setUsernameValue(event.target.value)} required value={usernameValue} /><span className="field-hint">1〜20文字。他のユーザーにも表示されます。同じ名前を使う人がいても登録できます。</span></label>
      <label className="field-label">自己紹介<textarea maxLength={100} onChange={(event) => setBioValue(event.target.value)} placeholder="デュエプレの好きなデッキなど" rows={4} value={bioValue} /><span className="field-hint">{Array.from(bioValue).length}/100文字</span></label>
      <label className="field-label">アイコン画像<input accept="image/jpeg,image/png,image/webp" onChange={handleChange} type="file" /><span className="field-hint">JPEG・PNG・WebP、3MBまで</span></label>
      {error && <p className="form-message error-message" role="alert">{error}</p>}
      <div className="deck-form-actions"><Link className="deck-cancel-button" href="/mypage">キャンセル</Link><button className="submit-button" disabled={pending} type="submit">{pending ? "保存中…" : "プロフィールを保存"}</button></div>
    </form>
  );
}
