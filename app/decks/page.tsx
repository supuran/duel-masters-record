import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import LogoutButton from "../mypage/logout-button";
import DeleteDeckButton from "./delete-button";
import DeckVisibilityButton from "./visibility-button";
import { createClient } from "@/utils/supabase/server";

export default async function DecksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: decks, error } = await supabase
    .from("decks")
    .select("id, name, format, deck_type, image_path, created_at, is_hidden, is_hidden_from_friends")
    .order("created_at", { ascending: false });

  const deckCards = await Promise.all((decks ?? []).map(async (deck) => {
    let imageUrl: string | null = null;
    if (deck.image_path) {
      const { data } = await supabase.storage.from("deck-images").createSignedUrl(deck.image_path, 3600);
      imageUrl = data?.signedUrl ?? null;
    }
    return { ...deck, imageUrl };
  }));

  return (
    <main className="deck-page-shell">
      <header className="dashboard-header">
        <Link className="dashboard-brand" href="/mypage">
          <span className="dashboard-brand-mark">D</span>
          <span>DUEL LOG<small>戦績管理</small></span>
        </Link>
        <div className="dashboard-user">
          <Link className="back-to-dashboard" href="/mypage">マイページ</Link>
          <LogoutButton />
        </div>
      </header>

      <div className="deck-page-content">
        <Link className="deck-back-link" href="/menu">← メインメニューへ戻る</Link>
        <div className="deck-page-title-row">
          <div><p className="eyebrow">MY COLLECTION</p><h1>デッキ管理</h1><p>使用するフォーマットとデッキタイプを設定できます。</p></div>
          <Link className="deck-add-button" href="/decks/new"><span aria-hidden="true">＋</span> デッキを登録</Link>
        </div>

        {error ? (
          <section className="deck-page-message" role="alert">
            デッキ一覧を読み込めませんでした。Supabase SQL Editorで <code>supabase/decks.sql</code>、<code>supabase/deck-visibility.sql</code>、<code>supabase/duel-formats.sql</code> を実行してください。
          </section>
        ) : deckCards.length === 0 ? (
          <section className="deck-empty-card">
            <div className="deck-empty-illustration" aria-hidden="true"><span>DM</span></div>
            <h2>デッキはまだ登録されていません</h2>
            <p>デッキ名と画像を登録すると、対戦記録をつけるときに選べるようになります。</p>
            <Link className="deck-add-button secondary" href="/decks/new">最初のデッキを登録する</Link>
          </section>
        ) : (
          <section className="deck-card-grid" aria-label="登録済みデッキ">
            {deckCards.map((deck) => (
              <article className="deck-item-card" key={deck.id}>
                <div className="deck-item-image">
                  {deck.imageUrl ? (
                    <Image alt={`${deck.name}の画像`} fill sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 33vw" src={deck.imageUrl} unoptimized />
                  ) : <span aria-hidden="true">DM</span>}
                </div>
                <div className="deck-item-details">
                  <div>
                    <p className="deck-item-label">{deck.format} · {deck.deck_type === "competitive" ? "ガチ" : "カジュアル"}{deck.is_hidden ? " · 対戦登録非表示" : ""}{deck.is_hidden_from_friends ? " · フレンド非表示" : ""}</p>
                    <h2>{deck.name}</h2>
                  </div>
                  <div className="deck-item-controls">
                    <DeckVisibilityButton deckId={deck.id} isHidden={deck.is_hidden} kind="own" />
                    <DeckVisibilityButton deckId={deck.id} isHidden={deck.is_hidden_from_friends} kind="friends" />
                    <DeleteDeckButton deckId={deck.id} imagePath={deck.image_path} />
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
