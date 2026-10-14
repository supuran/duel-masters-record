import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import LogoutButton from "./logout-button";
import { createClient } from "@/utils/supabase/server";

function percentage(part: number | null, whole: number | null) {
  if (part === null || whole === null || whole === 0) return "—";
  return String(Math.round((part / whole) * 100));
}

export default async function MyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profile } = await supabase.from("profiles").select("username, avatar_path").eq("id", user.id).maybeSingle();
  const username = profile?.username ?? (typeof user.user_metadata.username === "string" ? user.user_metadata.username : "プレイヤー");
  const avatarLabel = username.trim().charAt(0).toUpperCase() || "D";
  let avatarUrl: string | null = null;
  if (profile?.avatar_path) {
    const { data } = await supabase.storage.from("user-avatars").createSignedUrl(profile.avatar_path, 3600);
    avatarUrl = data?.signedUrl ?? null;
  }

  const [totalResult, winsResult, drawsResult, firstTotalResult, firstWinsResult, firstDrawsResult, secondTotalResult, secondWinsResult, secondDrawsResult, recentResult, usageResult] = await Promise.all([
    supabase.from("matches").select("id", { count: "exact", head: true }),
    supabase.from("matches").select("id", { count: "exact", head: true }).eq("result", "win"),
    supabase.from("matches").select("id", { count: "exact", head: true }).eq("result", "draw"),
    supabase.from("matches").select("id", { count: "exact", head: true }).eq("turn_order", "first"),
    supabase.from("matches").select("id", { count: "exact", head: true }).eq("turn_order", "first").eq("result", "win"),
    supabase.from("matches").select("id", { count: "exact", head: true }).eq("turn_order", "first").eq("result", "draw"),
    supabase.from("matches").select("id", { count: "exact", head: true }).eq("turn_order", "second"),
    supabase.from("matches").select("id", { count: "exact", head: true }).eq("turn_order", "second").eq("result", "win"),
    supabase.from("matches").select("id", { count: "exact", head: true }).eq("turn_order", "second").eq("result", "draw"),
    supabase.from("matches").select("id, deck_name, result, played_at").order("played_at", { ascending: false }).order("created_at", { ascending: false }).limit(5),
    supabase.from("matches").select("deck_name"),
  ]);

  const matchCount = totalResult.count ?? 0;
  const totalError = totalResult.error;
  const winMatches = matchCount - (drawsResult.count ?? 0);
  const firstMatches = (firstTotalResult.count ?? 0) - (firstDrawsResult.count ?? 0);
  const secondMatches = (secondTotalResult.count ?? 0) - (secondDrawsResult.count ?? 0);
  const recentMatches = recentResult.data ?? [];
  const deckCounts = new Map<string, number>();
  for (const match of usageResult.data ?? []) deckCounts.set(match.deck_name, (deckCounts.get(match.deck_name) ?? 0) + 1);
  const deckUsage = [...deckCounts.entries()].sort((a, b) => b[1] - a[1]);
  const outcomeLabels: Record<string, string> = { win: "勝ち", loss: "負け", draw: "引き分け（旧記録）" };

  return (
    <main className="dashboard-shell">
      <header className="dashboard-header">
        <Link className="dashboard-brand" href="/">
          <span className="dashboard-brand-mark">D</span>
          <span>DUEL LOG<small>戦績管理</small></span>
        </Link>
        <nav className="dashboard-main-nav" aria-label="メインメニュー">
          <Link href="/settings/profile">プロフィール設定</Link>
          <Link href="/friends">フレンド</Link>
        </nav>
        <div className="dashboard-user">
          <Link aria-label="ユーザーアイコンを設定" className="user-avatar-link" href="/settings/profile">
            {avatarUrl ? <Image alt="ユーザーアイコン" className="user-avatar" height={34} src={avatarUrl} unoptimized width={34} /> : <span className="user-avatar" aria-hidden="true">{avatarLabel}</span>}
          </Link>
          <span className="dashboard-username">{username}</span>
          <LogoutButton />
        </div>
      </header>

      <div className="dashboard-content">
        <Link className="deck-back-link" href="/menu">← メインメニューへ戻る</Link>
        <section className="dashboard-welcome">
          <div>
            <p className="eyebrow">PLAYER DASHBOARD</p>
            <h1>{username} さんの戦績</h1>
            <p>対戦を記録すると、ここにあなたの戦いのデータが集まります。</p>
          </div>
          <div className="welcome-emblem" aria-hidden="true"><span>DM</span><i>RECORD</i></div>
        </section>

        <section className="dashboard-stats" aria-label="戦績サマリー">
          <article className="dashboard-stat stat-primary">
            <span className="stat-icon" aria-hidden="true">▤</span>
            <p>総試合数</p>
            <strong>{totalError ? "—" : matchCount}<small> 試合</small></strong>
            <span className="stat-footnote">これまでの対戦記録</span>
          </article>
          <article className="dashboard-stat">
            <span className="stat-icon" aria-hidden="true">％</span>
            <p>勝率</p>
            <strong>{totalError ? "—" : percentage(winsResult.count, winMatches)}<small> %</small></strong>
            <span className="stat-footnote">引き分けを含む総試合数から算出</span>
          </article>
          <article className="dashboard-stat">
            <span className="stat-icon" aria-hidden="true">先</span>
            <p>先攻勝率</p>
            <strong>{totalError ? "—" : percentage(firstWinsResult.count, firstMatches)}<small> %</small></strong>
            <span className="stat-footnote">先攻での勝率</span>
          </article>
          <article className="dashboard-stat">
            <span className="stat-icon" aria-hidden="true">後</span>
            <p>後攻勝率</p>
            <strong>{totalError ? "—" : percentage(secondWinsResult.count, secondMatches)}<small> %</small></strong>
            <span className="stat-footnote">後攻での勝率</span>
          </article>
        </section>

        <div className="dashboard-lower-grid">
          <section className="dashboard-panel deck-panel">
            <div className="panel-heading">
              <div><p className="eyebrow">DECK INSIGHTS</p><h2>デッキ使用割合</h2></div>
              <Link className="panel-link" href="/decks">デッキ管理</Link>
            </div>
            {totalError ? (
              <div className="dashboard-data-error">対戦記録テーブルを読み込めません。Supabaseで <code>supabase/matches.sql</code> を実行してください。</div>
            ) : deckUsage.length === 0 ? (
              <div className="deck-empty-state">
                <div className="empty-donut" aria-hidden="true"><span>0<small> MATCHES</small></span></div>
                <div><h3>対戦データはまだありません</h3><p>対戦を登録するとデッキの使用割合が表示されます。</p></div>
              </div>
            ) : (
              <div className="deck-usage-list">
                {deckUsage.slice(0, 5).map(([deckName, count]) => (
                  <div className="deck-usage-row" key={deckName}>
                    <div className="deck-usage-caption"><span>{deckName}</span><small>{count}試合 · {Math.round((count / matchCount) * 100)}%</small></div>
                    <div className="deck-usage-track"><span style={{ width: `${Math.round((count / matchCount) * 100)}%` }} /></div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="dashboard-panel recent-panel">
            <div className="panel-heading">
              <div><p className="eyebrow">RECENT MATCHES</p><h2>最近の対戦</h2></div>
              <Link className="panel-link" href="/matches">{matchCount}件すべて →</Link>
            </div>
            {totalError ? (
              <div className="dashboard-data-error">対戦記録テーブルを読み込めません。SQLを実行後に再読み込みしてください。</div>
            ) : recentMatches.length === 0 ? (
              <div className="match-empty-state">
                <span className="empty-spark" aria-hidden="true">✦</span>
                <h3>対戦記録をつけてみましょう</h3>
                <p>勝敗や先攻・後攻を記録すると、ここに最近の対戦が表示されます。</p>
              </div>
            ) : (
              <div className="dashboard-recent-list">
                {recentMatches.map((match) => (
                  <div className="dashboard-recent-row" key={match.id}>
                    <div><strong>{match.deck_name}</strong><small>{match.played_at}</small></div>
                    <span className={`match-result-badge ${match.result}`}>{outcomeLabels[match.result] ?? match.result}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <p className="dashboard-footnote">勝率は勝ち数 ÷ 総試合数で計算しています。</p>
      </div>
    </main>
  );
}
