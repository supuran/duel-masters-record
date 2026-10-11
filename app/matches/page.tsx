import Link from "next/link";
import { redirect } from "next/navigation";
import LogoutButton from "../mypage/logout-button";
import { createClient } from "@/utils/supabase/server";

const RESULT_LABELS: Record<string, string> = { win: "勝ち", loss: "負け", draw: "引き分け（旧記録）" };
const TURN_LABELS: Record<string, string> = { first: "先攻", second: "後攻" };

function formatDate(value: string) {
  const [year, month, day] = value.split("-");
  return `${year}/${month}/${day}`;
}

export default async function MatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string }>;
}) {
  const { created } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: matches, error } = await supabase
    .from("matches")
    .select("id, deck_name, opponent_name, opponent_deck, result, turn_order, played_at, memo")
    .order("played_at", { ascending: false })
    .order("created_at", { ascending: false });

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
        <div className="deck-page-title-row">
          <div><p className="eyebrow">MATCH HISTORY</p><h1>対戦履歴</h1><p>記録した試合を振り返りましょう。</p></div>
          <Link className="deck-add-button" href="/matches/new"><span aria-hidden="true">＋</span> 対戦を記録</Link>
        </div>

        {created === "1" && <p className="match-success-message" role="status">対戦を登録しました。</p>}
        {error ? (
          <section className="deck-page-message" role="alert">履歴を読み込めません。SupabaseのSQL Editorで <code>supabase/matches.sql</code> を実行してください。</section>
        ) : !matches?.length ? (
          <section className="deck-empty-card">
            <div className="deck-empty-illustration" aria-hidden="true"><span>VS</span></div>
            <h2>対戦記録はまだありません</h2>
            <p>最初の試合を記録して、勝率や先攻・後攻の成績を確認しましょう。</p>
            <Link className="deck-add-button secondary" href="/matches/new">対戦を記録する</Link>
          </section>
        ) : (
          <section className="match-history-list" aria-label="対戦履歴">
            {matches.map((match) => (
              <article className="match-history-card" key={match.id}>
                <div className="match-history-date">{formatDate(match.played_at)}<span>{TURN_LABELS[match.turn_order] ?? match.turn_order}</span></div>
                <div className="match-history-main">
                  <h2>{match.deck_name || "デッキ名未設定"}</h2>
                  <p>{match.opponent_name || "対戦相手未設定"}{match.opponent_deck ? ` · ${match.opponent_deck}` : ""}</p>
                  {match.memo && <p className="match-history-memo">{match.memo}</p>}
                </div>
                <span className={`match-result-badge ${match.result}`}>{RESULT_LABELS[match.result] ?? match.result}</span>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
