import Link from "next/link";
import HeaderAvatarLink from "@/app/header-avatar-link";
import { redirect } from "next/navigation";
import LogoutButton from "../../mypage/logout-button";
import MatchForm from "./match-form";
import { createClient } from "@/utils/supabase/server";

function tokyoToday() {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export default async function NewMatchPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const [{ data: allDecks, error: decksError }, { data: allOpponentDecks, error: opponentsError }] = await Promise.all([
    supabase.from("decks").select("id, name, format, is_hidden").eq("is_hidden", false).order("created_at", { ascending: false }),
    supabase.from("opponent_decks").select("id, name, format, is_hidden").eq("is_hidden", false).order("name", { ascending: true }),
  ]);
  const decks = allDecks ?? [];
  const opponentDecks = allOpponentDecks ?? [];

  return (
    <main className="deck-page-shell">
      <header className="dashboard-header">
        <Link className="dashboard-brand" href="/mypage">
          <span className="dashboard-brand-mark">D</span>
          <span>DUEL LOG<small>戦績管理</small></span>
        </Link>
        <div className="dashboard-user">
          <HeaderAvatarLink />
          <LogoutButton />
        </div>
      </header>
      <div className="deck-form-page-content">
        <Link className="deck-back-link" href="/matches">← 対戦履歴へ戻る</Link>
        <section className="deck-form-card match-form-card">
          <p className="eyebrow">NEW MATCH</p>
          <h1>対戦を記録</h1>
          <p className="deck-form-intro">勝敗や先攻・後攻を記録して、戦績を振り返りましょう。</p>
          {decksError ? (
            <p className="form-message error-message" role="alert">デッキ一覧を読み込めません。Supabase SQL Editorで <code>supabase/decks.sql</code>、<code>supabase/deck-visibility.sql</code>、<code>supabase/duel-formats.sql</code> を実行してください。</p>
          ) : !decks?.length ? (
            <div className="match-no-decks">
              <p>対戦登録に表示するデッキがありません。デッキ管理でデッキを登録するか、非表示設定を解除してください。</p>
              <div className="match-no-decks-actions">
                <Link className="deck-add-button" href="/decks/new">デッキを登録</Link>
                <Link className="panel-link" href="/decks">デッキ管理で表示設定を確認</Link>
              </div>
            </div>
          ) : opponentsError ? (
            <p className="form-message error-message" role="alert">相手デッキ一覧を読み込めません。Supabase SQL Editorで <code>supabase/matches.sql</code>、<code>supabase/deck-visibility.sql</code>、<code>supabase/duel-formats.sql</code>、<code>supabase/opponent-deck-formats.sql</code> を実行してください。</p>
          ) : (
            <MatchForm decks={decks} opponentDecks={opponentDecks ?? []} today={tokyoToday()} />
          )}
        </section>
      </div>
    </main>
  );
}
