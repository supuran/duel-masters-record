import Link from "next/link";
import HeaderAvatarLink from "@/app/header-avatar-link";
import Image from "next/image";
import { redirect } from "next/navigation";
import LogoutButton from "../mypage/logout-button";
import FriendResponseButtons from "./response-buttons";
import { createClient } from "@/utils/supabase/server";

export default async function FriendsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  const { data: relations, error } = await supabase.from("friend_requests").select("id, requester_id, recipient_id, status, created_at").or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`).order("created_at", { ascending: false });
  const rows = relations ?? [];
  const otherIds = [...new Set(rows.map((row) => row.requester_id === user.id ? row.recipient_id : row.requester_id))];
  const { data: profiles } = otherIds.length ? await supabase.from("profiles").select("id, username, avatar_path").in("id", otherIds) : { data: [] as { id: string; username: string; avatar_path: string | null }[] };
  const names = new Map((profiles ?? []).map((profile) => [profile.id, profile.username]));
  const avatarUrls = new Map<string, string>();
  await Promise.all((profiles ?? []).map(async (profile) => {
    if (!profile.avatar_path) return;
    const { data } = await supabase.storage.from("user-avatars").createSignedUrl(profile.avatar_path, 3600);
    if (data?.signedUrl) avatarUrls.set(profile.id, data.signedUrl);
  }));
  const incoming = rows.filter((row) => row.recipient_id === user.id && row.status === "pending");
  const outgoing = rows.filter((row) => row.requester_id === user.id && row.status === "pending");
  const friends = rows.filter((row) => row.status === "accepted");
  return (
    <main className="deck-page-shell"><header className="dashboard-header"><Link className="dashboard-brand" href="/mypage"><span className="dashboard-brand-mark">D</span><span>DUEL LOG<small>戦績管理</small></span></Link><div className="dashboard-user"><Link className="back-to-dashboard" href="/players">ユーザー検索</Link><HeaderAvatarLink />
          <LogoutButton /></div></header>
      <div className="deck-page-content"><Link className="deck-back-link" href="/menu">← メインメニューへ戻る</Link><div className="deck-page-title-row"><div><p className="eyebrow">FRIENDS</p><h1>フレンド</h1><p>フレンド申請を管理し、相手のデッキや戦績を閲覧できます。</p></div><Link className="deck-add-button" href="/players">ユーザーを検索</Link></div>
        {error ? <p className="deck-page-message" role="alert">フレンド機能を使うには、Supabase SQL Editorで <code>supabase/friends.sql</code> を実行してください。</p> : <>
          <section className="player-section"><div className="player-section-heading"><div><p className="eyebrow">REQUESTS</p><h2>届いた申請</h2></div><span>{incoming.length}件</span></div>
            {!incoming.length ? <p className="player-empty">届いている申請はありません。</p> : <div className="player-card-list">{incoming.map((row) => <article className="player-card" key={row.id}><Link className="player-profile-link" href={`/players/${row.requester_id}`}>{avatarUrls.has(row.requester_id) ? <Image alt="" className="player-avatar-image" height={38} src={avatarUrls.get(row.requester_id)!} unoptimized width={38} /> : <span className="player-avatar">{(names.get(row.requester_id) ?? "?").slice(0, 1)}</span>}<span><strong>{names.get(row.requester_id) ?? "ユーザー"}</strong><small>プロフィールを見る →</small></span></Link><FriendResponseButtons requestId={row.id} /></article>)}</div>}
          </section>
          <section className="player-section"><div className="player-section-heading"><div><p className="eyebrow">MY FRIENDS</p><h2>フレンド一覧</h2></div><span>{friends.length}人</span></div>
            {!friends.length ? <p className="player-empty">フレンドはいません。ユーザーを検索して申請を送ってみましょう。</p> : <div className="player-card-list">{friends.map((row) => { const friendId = row.requester_id === user.id ? row.recipient_id : row.requester_id; const name = names.get(friendId) ?? "ユーザー"; return <article className="player-card" key={row.id}><Link className="player-profile-link" href={`/players/${friendId}`}>{avatarUrls.has(friendId) ? <Image alt="" className="player-avatar-image" height={38} src={avatarUrls.get(friendId)!} unoptimized width={38} /> : <span className="player-avatar">{name.slice(0, 1)}</span>}<span><strong>{name}</strong><small>デッキ・対戦履歴を見る →</small></span></Link><span className="friend-status">フレンド</span></article>; })}</div>}
          </section>
          <section className="player-section"><div className="player-section-heading"><div><p className="eyebrow">SENT</p><h2>送信した申請</h2></div><span>{outgoing.length}件</span></div>
            {!outgoing.length ? <p className="player-empty">送信中の申請はありません。</p> : <div className="player-card-list">{outgoing.map((row) => <article className="player-card" key={row.id}><Link className="player-profile-link" href={`/players/${row.recipient_id}`}>{avatarUrls.has(row.recipient_id) ? <Image alt="" className="player-avatar-image" height={38} src={avatarUrls.get(row.recipient_id)!} unoptimized width={38} /> : <span className="player-avatar">{(names.get(row.recipient_id) ?? "?").slice(0, 1)}</span>}<span><strong>{names.get(row.recipient_id) ?? "ユーザー"}</strong><small>プロフィールを見る →</small></span></Link><span className="friend-status pending">申請中</span></article>)}</div>}
          </section>
        </>}
      </div>
    </main>
  );
}