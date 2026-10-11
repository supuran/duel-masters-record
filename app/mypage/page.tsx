import Link from "next/link";
import { redirect } from "next/navigation";
import LogoutButton from "./logout-button";
import { createClient } from "@/utils/supabase/server";

export default async function MyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const username = typeof user.user_metadata.username === "string"
    ? user.user_metadata.username
    : "プレイヤー";
  const avatarLabel = username.trim().charAt(0).toUpperCase() || "D";

  return (
    <main className="dashboard-shell">
      <header className="dashboard-header">
        <Link className="dashboard-brand" href="/">
          <span className="dashboard-brand-mark">D</span>
          <span>DUEL LOG<small>戦績管理</small></span>
        </Link>
        <Link className="dashboard-decks-link" href="/decks">デッキ管理 <span aria-hidden="true">↗</span></Link>
        <div className="dashboard-user">
          <span className="user-avatar" aria-hidden="true">{avatarLabel}</span>
          <span className="dashboard-username">{username}</span>
          <LogoutButton />
        </div>
      </header>

      <div className="dashboard-content">
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
            <strong>0<small> 試合</small></strong>
            <span className="stat-footnote">これまでの対戦記録</span>
          </article>
          <article className="dashboard-stat">
            <span className="stat-icon" aria-hidden="true">％</span>
            <p>勝率</p>
            <strong>—<small> %</small></strong>
            <span className="stat-footnote">試合を記録すると表示されます</span>
          </article>
          <article className="dashboard-stat">
            <span className="stat-icon" aria-hidden="true">先</span>
            <p>先攻勝率</p>
            <strong>—<small> %</small></strong>
            <span className="stat-footnote">先攻での勝率</span>
          </article>
          <article className="dashboard-stat">
            <span className="stat-icon" aria-hidden="true">後</span>
            <p>後攻勝率</p>
            <strong>—<small> %</small></strong>
            <span className="stat-footnote">後攻での勝率</span>
          </article>
        </section>

        <div className="dashboard-lower-grid">
          <section className="dashboard-panel deck-panel">
            <div className="panel-heading">
              <div><p className="eyebrow">DECK INSIGHTS</p><h2>デッキ使用割合</h2></div>
              <span className="panel-period">全期間</span>
            </div>
            <div className="deck-empty-state">
              <div className="empty-donut" aria-hidden="true"><span>0<small> DECKS</small></span></div>
              <div><h3>デッキデータはまだありません</h3><p>デッキを登録して対戦で使うと、使用割合を確認できます。</p></div>
            </div>
          </section>

          <section className="dashboard-panel recent-panel">
            <div className="panel-heading">
              <div><p className="eyebrow">RECENT MATCHES</p><h2>最近の対戦</h2></div>
              <span className="panel-count">0件</span>
            </div>
            <div className="match-empty-state">
              <span className="empty-spark" aria-hidden="true">✦</span>
              <h3>対戦記録をつけてみましょう</h3>
              <p>勝敗や先攻・後攻を記録すると、ここに最近の対戦が表示されます。</p>
            </div>
          </section>
        </div>

        <p className="dashboard-footnote">戦績は対戦記録の登録後に集計されます。</p>
      </div>
    </main>
  );
}
