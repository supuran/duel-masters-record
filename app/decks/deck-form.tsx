"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { type ChangeEvent, type FormEvent, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const CIVILIZATIONS = ["光", "水", "闇", "火", "自然"] as const;
const MIME_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export default function DeckForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [format, setFormat] = useState<"ND" | "AD">("ND");
  const [deckType, setDeckType] = useState<"competitive" | "casual" | "">("");
  const [civilizations, setCivilizations] = useState<string[]>([]);
  const [keyCards, setKeyCards] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setError("");
    if (!file) {
      setImage(null);
      setPreviewUrl(null);
      return;
    }
    if (!MIME_EXTENSIONS[file.type]) {
      setError("画像はJPEG、PNG、WebP形式から選んでください。");
      event.target.value = "";
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setError("画像サイズは5MB以下にしてください。");
      event.target.value = "";
      return;
    }
    setImage(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const normalizedName = name.trim();
    if (normalizedName.length < 1 || normalizedName.length > 40) {
      setError("デッキ名は1〜40文字で入力してください。");
      return;
    }
    if (!deckType) {
      setError("ガチデッキまたはカジュアルデッキを選択してください。");
      return;
    }
    if (keyCards.trim().length > 300) {
      setError("キーカードは300文字以内で入力してください。");
      return;
    }

    setIsPending(true);
    const supabase = createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      setIsPending(false);
      setError("ログイン状態を確認できません。もう一度ログインしてください。");
      return;
    }

    let imagePath: string | null = null;
    if (image) {
      const extension = MIME_EXTENSIONS[image.type];
      imagePath = `${user.id}/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage.from("deck-images").upload(imagePath, image, {
        contentType: image.type,
        upsert: false,
      });
      if (uploadError) {
        setIsPending(false);
        setError("画像を保存できませんでした。Supabaseで supabase/decks.sql を実行済みか確認してください。");
        return;
      }
    }

    const { error: insertError } = await supabase.from("decks").insert({
      user_id: user.id,
      name: normalizedName,
      format,
      deck_type: deckType,
      civilizations,
      key_cards: keyCards.trim(),
      image_path: imagePath,
    });

    if (insertError) {
      if (imagePath) await supabase.storage.from("deck-images").remove([imagePath]);
      setIsPending(false);
      setError(`登録エラー [${insertError.code ?? "unknown"}]: ${insertError.message}`);
      return;
    }

    router.push("/decks");
    router.refresh();
  }

  return (
    <form className="deck-form" onSubmit={handleSubmit}>
      <label className="field-label">
        デッキ名
        <input autoComplete="off" maxLength={40} onChange={(event) => setName(event.target.value)} placeholder="例：火水闇ハデス" required value={name} />
        <span className="field-hint">あとから対戦記録で選ぶための名前です（1〜40文字）</span>
      </label>

      <label className="field-label">
        使用フォーマット
        <select onChange={(event) => setFormat(event.target.value as "ND" | "AD")} value={format}>
          <option value="ND">ND（New Division）</option>
          <option value="AD">AD（All Division）</option>
        </select>
      </label>

      <label className="field-label">
        デッキタイプ
        <select onChange={(event) => setDeckType(event.target.value as "competitive" | "casual" | "")} required value={deckType}>
          <option disabled value="">選択してください</option>
          <option value="competitive">ガチデッキ</option>
          <option value="casual">カジュアルデッキ</option>
        </select>
      </label>

      <fieldset className="deck-civilization-fieldset">
        <legend>文明 <span className="optional-label">任意・複数選択可</span></legend>
        <div className="deck-civilization-options">
          {CIVILIZATIONS.map((civilization) => (
            <label key={civilization}>
              <input
                checked={civilizations.includes(civilization)}
                onChange={(event) => setCivilizations((current) => event.target.checked
                  ? [...current, civilization]
                  : current.filter((item) => item !== civilization))}
                type="checkbox"
                value={civilization}
              />
              <span>{civilization}</span>
            </label>
          ))}
        </div>
        <span className="field-hint">複数文明のデッキは該当する文明をすべて選んでください。</span>
      </fieldset>

      <label className="field-label">
        キーカード <span className="optional-label">任意</span>
        <input autoComplete="off" maxLength={300} onChange={(event) => setKeyCards(event.target.value)} placeholder="カード名をカンマ区切りで入力" value={keyCards} />
        <span className="field-hint">カード名を複数入力できます（300文字まで）。</span>
      </label>

      <label className="field-label">
        デッキ画像 <span className="optional-label">任意</span>
        <span className="deck-image-picker">
          {previewUrl ? <Image alt="選択したデッキ画像のプレビュー" height={72} src={previewUrl} unoptimized width={72} /> : <span className="image-placeholder" aria-hidden="true">＋</span>}
          <span><strong>{image ? image.name : "画像を選択"}</strong><small>JPEG・PNG・WebP、5MBまで</small></span>
          <input accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} type="file" />
        </span>
      </label>

      {error && <p className="form-message error-message" role="alert">{error}</p>}
      <div className="deck-form-actions">
        <Link className="deck-cancel-button" href="/decks">キャンセル</Link>
        <button className="submit-button" disabled={isPending} type="submit">{isPending ? "保存中…" : "デッキを保存"}</button>
      </div>
    </form>
  );
}
