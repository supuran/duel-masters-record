import Link from "next/link";
import { redirect } from "next/navigation";
import LogoutButton from "../mypage/logout-button";
import { createClient } from "@/utils/supabase/server";
import MatchFilters from "./match-filters";

const RESULT_LABELS: Record<string, string> = { win: "勝ち", loss: "負け", draw: "引き分け（旧記録）" };
const TURN_LABELS: Record<string, string> = { first: "先攻", second: "後攻" };

function formatDate(value: string | null) {
  if (!value) return "日付未設定";
  const dateOnly = value.slice(0, 10);
  const [year, month, day] = dateOnly.split("-");
  return year && month && day ? `${year}/${month}/${day}` : dateOnly;
}

export default async function MatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; updated?: string; deleted?: string; from?: string; to?: string; result?: string; deck_id?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const [{ data: decks }, { data: matches, error }] = await Promise.all([
    supabase.from("decks").select("id, name").order("name", { ascending: true }),
    (async () => {
      let query = supabase.from("matches")
        .select("id, deck_id, deck_name, opponent_name, opponent_deck, opponent_deck_name, result, turn_order, played_at, memo")
        .order("played_at", { ascending: false })
        .order("created_at", { ascending: false });
      if (params.from && /^\d{4}-\d{2}-\d{2}$/.test(params.from)) query = query.gte("played_at", `${params.from}T00:00:00+00:00`);
      if (params.to && /^\d{4}-\d{2}-\d{2}$/.test(params.to)) {
        const next = new Date(`${params.to}T00:00:00Z`);
        next.setUTCDate(next.getUTCDate() + 1);
        query = query.lt("played_at", next.toISOString());
      }
      if (params.result === "win" || params.result === "loss") query = query.eq("result", params.result);
      if (params.deck_id && /^[0-9a-f-]{36}$/i.test(params.deck_id)) query = query.eq("deck_id", params.deck_id);
      return query;
    })(),
  ]);

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
          <div><p className="eyebrow">MATCH HISTORY</p><h1>対戦履歴</h1><p>記録した試合を振り返りましょう。</p></div>
          <Link className="deck-add-button" href="/matches/new"><span aria-hidden="true">＋</span> 対戦を記録</Link>
        </div>

        {params.created === "1" && <p className="match-success-message" role="status">対戦を登録しました。</p>}
        {params.updated === "1" && <p className="match-success-message" role="status">対戦履歴を更新しました。</p>}
        {params.deleted === "1" && <p className="match-success-message" role="status">対戦履歴を削除しました。</p>}
        <MatchFilters decks={decks ?? []} values={params} />
        {error ? (
          <section className="deck-page-message" role="alert">履歴を読み込めません。SupabaseのSQL Editorで <code>supabase/matches.sql</code> を実行してください。</section>
        ) : !matches?.length ? (
          <section className="deck-empty-card">
            <div className="deck-empty-illustration" aria-hidden="true"><span>VS</span></div>
            <h2>{params.from || params.to || params.result || params.deck_id ? "条件に一致する履歴はありません" : "対戦記録はまだありません"}</h2>
            <p>{params.from || params.to || params.result || params.deck_id ? "検索条件を変更するか、条件をリセットしてください。" : "最初の試合を記録して、勝率や先攻・後攻の成績を確認しましょう。"}</p>
            {params.from || params.to || params.result || params.deck_id
              ? <Link className="deck-add-button secondary" href="/matches">検索条件をリセット</Link>
              : <Link className="deck-add-button secondary" href="/matches/new">対戦を記録する</Link>}
          </section>
        ) : (
          <section className="match-history-list" aria-label="対戦履歴">
            {matches.map((match) => (
              <article className="match-history-card" key={match.id}>
                <div className="match-history-date">{formatDate(match.played_at)}<span>{TURN_LABELS[match.turn_order] ?? match.turn_order}</span></div>
                <div className="match-history-main">
                  <h2>{match.deck_name || "デッキ名未設定"}</h2>
                  <p>{match.opponent_name || "対戦相手未設定"}{(match.opponent_deck || match.opponent_deck_name) ? ` · ${match.opponent_deck || match.opponent_deck_name}` : ""}</p>
                  {match.memo && <p className="match-history-memo">{match.memo}</p>}
                </div>
                <div className="match-history-actions">
                  <span className={`match-result-badge ${match.result}`}>{RESULT_LABELS[match.result] ?? match.result}</span>
                  <Link className="match-edit-link" href={`/matches/${match.id}/edit`}>編集</Link>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
