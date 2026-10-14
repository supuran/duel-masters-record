import Link from "next/link";
import { redirect } from "next/navigation";
import LogoutButton from "../mypage/logout-button";
import OpponentDeckDeleteButton from "./delete-button";
import OpponentDeckForm from "./opponent-deck-form";
import DeckVisibilityButton from "../decks/visibility-button";
import { createClient } from "@/utils/supabase/server";

export default async function OpponentDecksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: decks, error } = await supabase
    .from("opponent_decks")
    .select("id, name, format, is_hidden")
    .order("name", { ascending: true });

  return (
    <main className="deck-page-shell">
      <header className="dashboard-header">
        <Link className="dashboard-brand" href="/mypage">
          <span className="dashboard-brand-mark">D</span>
          <span>DUEL LOG<small>戦績管理</small></span>
        </Link>
        <div className="dashboard-user">
          <Link className="back-to-dashboard" href="/matches/new">対戦を記録</Link>
          <LogoutButton />
        </div>
      </header>
      <div className="deck-form-page-content opponent-deck-page-content">
        <Link className="deck-back-link" href="/matches/new">← 対戦登録へ戻る</Link>
        <section className="deck-form-card">
          <p className="eyebrow">OPPONENT DECKS</p>
          <h1>相手デッキ候補を管理</h1>
          <p className="deck-form-intro">ここで登録した名前が、対戦記録のプルダウンに表示されます。</p>
          <OpponentDeckForm />
          <div className="opponent-deck-list-heading"><h2>登録済み候補</h2><span>{decks?.length ?? 0}件</span></div>
          {error ? (
            <p className="form-message error-message" role="alert">一覧を読み込めません。Supabase SQL Editorで <code>supabase/opponent-deck-formats.sql</code> を実行してください。</p>
          ) : !decks?.length ? (
            <p className="opponent-deck-empty">候補はまだありません。上の入力欄から登録してください。</p>
          ) : (
            <ul className="opponent-deck-list">
              {decks.map((deck) => (
                <li key={deck.id}>
                  <span>{deck.name}（{deck.format ?? "ND"}）{deck.is_hidden ? "（非表示）" : ""}</span>
                  <span className="opponent-deck-row-controls">
                    <DeckVisibilityButton deckId={deck.id} isHidden={deck.is_hidden} kind="opponent" />
                    <OpponentDeckDeleteButton deckId={deck.id} deckName={deck.name} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
