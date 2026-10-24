import Image from "next/image";
import HeaderAvatarLink from "@/app/header-avatar-link";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import LogoutButton from "../../mypage/logout-button";
import FriendRequestButton from "../../friends/request-button";
import { createClient } from "@/utils/supabase/server";

function percent(wins: number, total: number) { return total ? `${Math.round((wins / total) * 100)}%` : "—"; }

export default async function PlayerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  if (id === user.id) redirect("/mypage");
  const [{ data: profile }, { data: relations }] = await Promise.all([
    supabase.from("profiles").select("id, username, bio, avatar_path").eq("id", id).maybeSingle(),
    supabase.from("friend_requests").select("id, requester_id, recipient_id, status").or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`),
  ]);
  if (!profile) notFound();
  let profileAvatarUrl: string | null = null;
  if (profile.avatar_path) {
    const { data } = await supabase.storage.from("user-avatars").createSignedUrl(profile.avatar_path, 3600);
    profileAvatarUrl = data?.signedUrl ?? null;
  }
  const relation = (relations ?? []).find((item) => item.requester_id === id || item.recipient_id === id);
  const isFriend = relation?.status === "accepted";
  const requestState = isFriend ? "friend" : relation?.status === "pending" ? (relation.requester_id === user.id ? "outgoing" : "incoming") : "none";
  let decks: { id: string; name: string; image_path: string | null }[] = [];
  let matches: { id: string; deck_id: string | null; deck_name: string; opponent_name: string | null; opponent_deck: string | null; result: string; played_at: string | null; memo: string | null }[] = [];
  let totalMatches = 0;
  let totalWins = 0;
  if (isFriend) {
    const [deckResult, matchResult, totalResult, winsResult] = await Promise.all([
      supabase.from("decks").select("id, name, image_path").eq("user_id", id).order("created_at", { ascending: false }),
      supabase.from("matches").select("id, deck_id, deck_name, opponent_name, opponent_deck, result, played_at, memo").eq("user_id", id).order("played_at", { ascending: false }).order("created_at", { ascending: false }).limit(30),
      supabase.from("matches").select("id", { count: "exact", head: true }).eq("user_id", id),
      supabase.from("matches").select("id", { count: "exact", head: true }).eq("user_id", id).eq("result", "win"),
    ]);
    decks = deckResult.data ?? [];
    matches = matchResult.data ?? [];
    const visibleDeckIds = new Set(decks.map((deck) => deck.id));
    matches = matches.map((match) => match.deck_id && !visibleDeckIds.has(match.deck_id)
      ? { ...match, deck_name: "フレンド非公開デッキ" }
      : match);
    totalMatches = totalResult.count ?? 0;
    totalWins = winsResult.count ?? 0;
  }
  const deckCards = await Promise.all(decks.map(async (deck) => {
    if (!deck.image_path) return { ...deck, imageUrl: null as string | null };
    const { data } = await supabase.storage.from("deck-images").createSignedUrl(deck.image_path, 3600);
    return { ...deck, imageUrl: data?.signedUrl ?? null };
  }));
  const state = requestState as "none" | "outgoing" | "incoming" | "friend";

  return (
    <main className="deck-page-shell">
      <header className="dashboard-header"><Link className="dashboard-brand" href="/mypage"><span className="dashboard-brand-mark">D</span><span>DUEL LOG<small>戦績管理</small></span></Link><div className="dashboard-user"><HeaderAvatarLink />
          <LogoutButton /></div></header>
      <div className="deck-page-content player-page-content">
        <Link className="deck-back-link" href="/players">← ユーザー検索へ戻る</Link>
        <section className="player-profile-heading">{profileAvatarUrl ? <Image alt="" className="player-avatar-image large" height={60} src={profileAvatarUrl} unoptimized width={60} /> : <span className="player-avatar large">{profile.username.slice(0, 1).toUpperCase()}</span>}<div><p className="eyebrow">PLAYER PROFILE</p><h1>{profile.username}</h1>{profile.bio && <p className="player-bio">{profile.bio}</p>}</div><FriendRequestButton state={state} userId={id} /></section>
        {!isFriend ? <section className="player-private-notice"><h2>フレンド限定プロフィール</h2><p>フレンドになると、登録デッキと対戦履歴を閲覧できます。フレンド申請が承認されるとここに表示されます。</p></section> : <>
          <section className="player-stats"><article><span>試合数</span><strong>{totalMatches}</strong></article><article><span>勝率</span><strong>{percent(totalWins, totalMatches)}</strong></article><article><span>登録デッキ</span><strong>{decks.length}</strong></article></section>
          <section className="player-section"><div className="player-section-heading"><div><p className="eyebrow">DECKS</p><h2>登録デッキ</h2></div><span>{deckCards.length}件</span></div>
            {!deckCards.length ? <p className="player-empty">登録デッキはありません。</p> : <div className="deck-card-grid">{deckCards.map((deck) => <article className="deck-item-card" key={deck.id}><div className="deck-item-image">{deck.imageUrl ? <Image alt={`${deck.name}の画像`} fill sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 33vw" src={deck.imageUrl} unoptimized /> : <span aria-hidden="true">DM</span>}</div><div className="deck-item-details"><div><p className="deck-item-label">DECK</p><h2>{deck.name}</h2></div></div></article>)}</div>}
          </section>
          <section className="player-section"><div className="player-section-heading"><div><p className="eyebrow">MATCH HISTORY</p><h2>対戦履歴</h2></div><span>最新{matches.length}件</span></div>
            {!matches.length ? <p className="player-empty">対戦履歴はありません。</p> : <div className="player-match-list">{matches.map((match) => <article className="player-match-card" key={match.id}><div><strong>{match.deck_name}</strong><small>{match.played_at?.slice(0, 10).replaceAll("-", "/")}</small><p>{match.opponent_name || "対戦相手未設定"}{match.opponent_deck ? ` · ${match.opponent_deck}` : ""}</p>{match.memo && <p>{match.memo}</p>}</div><span className={`match-result-badge ${match.result}`}>{match.result === "win" ? "勝ち" : "負け"}</span></article>)}</div>}
          </section>
        </>}
      </div>
    </main>
  );
}
