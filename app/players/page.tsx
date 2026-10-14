import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import LogoutButton from "../mypage/logout-button";
import FriendRequestButton from "../friends/request-button";
import { createClient } from "@/utils/supabase/server";

export default async function PlayersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const term = q.trim().slice(0, 20);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  let profiles: { id: string; username: string; avatar_path: string | null }[] = [];
  let profileError = false;
  if (term.length >= 2) {
    const safeTerm = term.replace(/[\\%_]/g, (value) => `\\${value}`);
    const { data, error } = await supabase.from("profiles").select("id, username, avatar_path").ilike("username", `%${safeTerm}%`).neq("id", user.id).order("username").limit(30);
    profiles = data ?? [];
    profileError = Boolean(error);
  }
  const ids = profiles.map((profile) => profile.id);
  const { data: relations } = ids.length
    ? await supabase.from("friend_requests").select("requester_id, recipient_id, status").or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)
    : { data: [] as { requester_id: string; recipient_id: string; status: string }[] };
  const stateFor = (id: string): "none" | "outgoing" | "incoming" | "friend" => {
    const relation = (relations ?? []).find((item) => item.requester_id === id || item.recipient_id === id);
    if (!relation) return "none";
    if (relation.status === "accepted") return "friend";
    if (relation.status === "pending") return relation.requester_id === user.id ? "outgoing" : "incoming";
    return "none";
  };
  const profilesWithAvatars = await Promise.all(profiles.map(async (profile) => {
    if (!profile.avatar_path) return { ...profile, avatarUrl: null as string | null };
    const { data } = await supabase.storage.from("user-avatars").createSignedUrl(profile.avatar_path, 3600);
    return { ...profile, avatarUrl: data?.signedUrl ?? null };
  }));

  return (
    <main className="deck-page-shell">
      <header className="dashboard-header"><Link className="dashboard-brand" href="/mypage"><span className="dashboard-brand-mark">D</span><span>DUEL LOG<small>戦績管理</small></span></Link><div className="dashboard-user"><Link className="back-to-dashboard" href="/friends">フレンド</Link><LogoutButton /></div></header>
      <div className="deck-page-content"><Link className="deck-back-link" href="/menu">← メインメニューへ戻る</Link>
        <div className="deck-page-title-row"><div><p className="eyebrow">PLAYERS</p><h1>ユーザー検索</h1><p>ユーザー名で検索して、プロフィールを見たりフレンド申請を送れます。</p></div></div>
        <form action="/players" className="player-search-form"><label htmlFor="player-search">ユーザー名</label><div><input autoComplete="off" id="player-search" maxLength={20} minLength={2} name="q" placeholder="ユーザー名を入力" defaultValue={q} /><button className="submit-button" type="submit">検索</button></div><small>2〜20文字で検索できます。</small></form>
        {profileError ? <p className="deck-page-message" role="alert">プロフィールを読み込めません。Supabase SQL Editorで <code>supabase/profiles.sql</code> と <code>supabase/friends.sql</code> を実行してください。</p>
          : term.length < 2 ? <section className="deck-empty-card"><h2>ユーザー名を入力してください</h2><p>2文字以上入力して検索できます。</p></section>
            : !profiles.length ? <section className="deck-empty-card"><h2>ユーザーが見つかりません</h2><p>別のユーザー名で検索してください。</p></section>
              : <section className="player-card-list" aria-label="検索結果">{profilesWithAvatars.map((profile) => <article className="player-card" key={profile.id}><Link href={`/players/${profile.id}`} className="player-profile-link">{profile.avatarUrl ? <Image alt="" className="player-avatar-image" height={38} src={profile.avatarUrl} unoptimized width={38} /> : <span className="player-avatar">{profile.username.slice(0, 1).toUpperCase()}</span>}<span><strong>{profile.username}</strong><small>プロフィールを見る →</small></span></Link><FriendRequestButton state={stateFor(profile.id)} userId={profile.id} /></article>)}</section>}
      </div>
    </main>
  );
}
