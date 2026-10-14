import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import LogoutButton from "../../../mypage/logout-button";
import MatchForm from "../../new/match-form";
import { updateMatchAction } from "../../actions";
import DeleteMatchButton from "../../delete-match-button";
import { createClient } from "@/utils/supabase/server";

function tokyoToday() {
  const parts = new Intl.DateTimeFormat("en", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export default async function EditMatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  const [{ data: match }, { data: allDecks, error: decksError }, { data: allOpponentDecks, error: opponentsError }] = await Promise.all([
    supabase.from("matches").select("id, deck_id, opponent_deck_id, opponent_name, result, turn_order, played_at, memo").eq("id", id).eq("user_id", user.id).maybeSingle(),
    supabase.from("decks").select("id, name, is_hidden").order("created_at", { ascending: false }),
    supabase.from("opponent_decks").select("id, name, is_hidden").order("name", { ascending: true }),
  ]);
  if (!match) notFound();
  const decks = (allDecks ?? []).filter((deck) => !deck.is_hidden || deck.id === match.deck_id);
  const opponentDecks = (allOpponentDecks ?? []).filter((deck) => !deck.is_hidden || deck.id === match.opponent_deck_id);
  return (
    <main className="deck-page-shell">
      <header className="dashboard-header">
        <Link className="dashboard-brand" href="/mypage"><span className="dashboard-brand-mark">D</span><span>DUEL LOG<small>戦績管理</small></span></Link>
        <div className="dashboard-user"><Link className="back-to-dashboard" href="/matches">対戦履歴</Link><LogoutButton /></div>
      </header>
      <div className="deck-form-page-content">
        <Link className="deck-back-link" href="/matches">← 対戦履歴へ戻る</Link>
        <section className="deck-form-card match-form-card">
          <p className="eyebrow">EDIT MATCH</p><h1>対戦履歴を編集</h1><p className="deck-form-intro">内容を変更して保存してください。</p>
          {decksError || opponentsError ? <p className="form-message error-message" role="alert">デッキ一覧を読み込めません。画面を更新してください。</p>
            : <>
              <MatchForm action={updateMatchAction} decks={decks ?? []} initial={match} opponentDecks={opponentDecks ?? []} today={tokyoToday()} />
              <div className="match-edit-delete"><span>この対戦履歴を削除する</span><DeleteMatchButton id={match.id} /></div>
            </>}
        </section>
      </div>
    </main>
  );
}
