"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ChangeEvent, type FormEvent, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

const MIME_EXTENSIONS: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const MAX_SIZE = 3 * 1024 * 1024;

export default function AvatarForm({ username, avatarPath, avatarUrl }: { username: string; avatarPath: string | null; avatarUrl: string | null }) {
  const router = useRouter();
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
    if (!file) { setError("設定する画像を選んでください。"); return; }
    setPending(true);
    setError("");
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (!user || authError) { setPending(false); setError("ログイン状態を確認できません。もう一度ログインしてください。"); return; }
    const path = `${user.id}/${crypto.randomUUID()}.${MIME_EXTENSIONS[file.type]}`;
    const { error: uploadError } = await supabase.storage.from("user-avatars").upload(path, file, { contentType: file.type, upsert: false });
    if (uploadError) { setPending(false); setError(`画像をアップロードできませんでした。Supabase SQL Editorで supabase/avatars.sql を実行済みか確認してください。 (${uploadError.message})`); return; }
    const { error: updateError } = await supabase.from("profiles").update({ avatar_path: path }).eq("id", user.id);
    if (updateError) {
      await supabase.storage.from("user-avatars").remove([path]);
      setPending(false);
      setError(`プロフィールを更新できませんでした。${updateError.message}`);
      return;
    }
    if (avatarPath?.startsWith(`${user.id}/`)) await supabase.storage.from("user-avatars").remove([avatarPath]);
    router.push("/mypage?profileUpdated=1");
    router.refresh();
  }

  const imageUrl = preview ?? avatarUrl;
  const initial = username.trim().charAt(0).toUpperCase() || "D";
  return (
    <form className="avatar-settings-form" onSubmit={handleSubmit}>
      <div className="avatar-settings-preview">{imageUrl ? <Image alt="ユーザーアイコン" className="avatar-preview-image" height={112} src={imageUrl} unoptimized width={112} /> : <span>{initial}</span>}</div>
      <label className="field-label">アイコン画像<input accept="image/jpeg,image/png,image/webp" onChange={handleChange} type="file" /><span className="field-hint">JPEG・PNG・WebP、3MBまで</span></label>
      {error && <p className="form-message error-message" role="alert">{error}</p>}
      <div className="deck-form-actions"><Link className="deck-cancel-button" href="/mypage">キャンセル</Link><button className="submit-button" disabled={pending || !file} type="submit">{pending ? "保存中…" : "アイコンを保存"}</button></div>
    </form>
  );
}
