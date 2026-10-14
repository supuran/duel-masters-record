import Link from "next/link";
import { redirect } from "next/navigation";
import LogoutButton from "../../mypage/logout-button";
import DeckForm from "../deck-form";
import { createClient } from "@/utils/supabase/server";

export default async function NewDeckPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  return (
    <main className="deck-page-shell">
      <header className="dashboard-header">
        <Link className="dashboard-brand" href="/mypage">
          <span className="dashboard-brand-mark">D</span>
          <span>DUEL LOG<small>戦績管理</small></span>
        </Link>
        <div className="dashboard-user"><Link className="back-to-dashboard" href="/decks">デッキ一覧</Link><LogoutButton /></div>
      </header>
      <div className="deck-form-page-content">
        <Link className="deck-back-link" href="/decks">← デッキ一覧へ戻る</Link>
        <section className="deck-form-card">
          <p className="eyebrow">NEW DECK</p>
          <h1>デッキを登録</h1>
          <p className="deck-form-intro">デッキ名、ND／ADのフォーマット、画像を登録します。</p>
          <DeckForm />
        </section>
      </div>
    </main>
  );
}
