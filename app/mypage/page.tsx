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

  return (
    <main className="home-shell">
      <header className="home-header">
        <Link className="home-brand" href="/">DUEL LOG <span>戦績管理</span></Link>
        <LogoutButton />
      </header>
      <section className="welcome-card">
        <p className="eyebrow">MY PAGE</p>
        <h1>{username} さん、ようこそ！</h1>
        <p>ログインできました。ここに対戦数や勝率などの戦績が表示されます。</p>
        <div className="stats-grid">
          <div><span>試合数</span><strong>—</strong></div>
          <div><span>勝率</span><strong>—</strong></div>
          <div><span>登録デッキ</span><strong>—</strong></div>
        </div>
      </section>
    </main>
  );
}
