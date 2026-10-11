import Link from "next/link";
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

  const { data: decks, error } = await supabase
    .from("decks")
    .select("id, name")
    .order("created_at", { ascending: false });

  return (
    <main className="deck-page-shell">
      <header className="dashboard-header">
        <Link className="dashboard-brand" href="/mypage">
          <span className="dashboard-brand-mark">D</span>
          <span>DUEL LOG<small>戦績管理</small></span>
        </Link>
        <div className="dashboard-user">
          <Link className="back-to-dashboard" href="/matches">対戦履歴</Link>
          <LogoutButton />
        </div>
      </header>
      <div className="deck-form-page-content">
        <Link className="deck-back-link" href="/matches">← 対戦履歴へ戻る</Link>
        <section className="deck-form-card match-form-card">
          <p className="eyebrow">NEW MATCH</p>
          <h1>対戦を記録</h1>
          <p className="deck-form-intro">勝敗や先攻・後攻を記録して、戦績を振り返りましょう。</p>
          {error ? (
            <p className="form-message error-message" role="alert">デッキ一覧を読み込めません。時間をおいて再読み込みしてください。</p>
          ) : !decks?.length ? (
            <div className="match-no-decks">
              <p>対戦記録をつける前に、使用するデッキを登録してください。</p>
              <Link className="deck-add-button" href="/decks/new">デッキを登録</Link>
            </div>
          ) : (
            <MatchForm decks={decks} today={tokyoToday()} />
          )}
        </section>
      </div>
    </main>
  );
}
