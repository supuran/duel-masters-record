import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import LogoutButton from "../mypage/logout-button";
import { createClient } from "@/utils/supabase/server";

const MENU_ITEMS = [
  { href: "/decks", icon: "▤", title: "デッキ管理", description: "使用デッキを登録・整理する", className: "" },
  { href: "/deck-search", icon: "⌕", title: "デッキ検索", description: "文明・キーカード・タイプから探す", className: "" },
  { href: "/players", icon: "⌕", title: "ユーザー検索", description: "ユーザーを探してプロフィールを見る", className: "" },
  { href: "/friends", icon: "♧", title: "フレンド", description: "申請やフレンド一覧を管理する", className: "" },
  { href: "/matches", icon: "≡", title: "対戦履歴", description: "過去の記録を検索・編集する", className: "" },
  { href: "/mypage", icon: "◉", title: "マイページ", description: "勝率や使用デッキの統計を見る", className: "" },
  { href: "/settings/profile", icon: "⚙", title: "プロフィール設定", description: "ユーザー名・自己紹介・アイコンを変更する", className: "" },
];

export default async function MainMenuPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  const { data: profile } = await supabase.from("profiles").select("username, avatar_path").eq("id", user.id).maybeSingle();
  const username = profile?.username ?? (typeof user.user_metadata.username === "string" ? user.user_metadata.username : "プレイヤー");
  const initial = username.trim().charAt(0).toUpperCase() || "D";
  let avatarUrl: string | null = null;
  if (profile?.avatar_path) {
    const { data } = await supabase.storage.from("user-avatars").createSignedUrl(profile.avatar_path, 3600);
    avatarUrl = data?.signedUrl ?? null;
  }

  return (
    <main className="menu-shell">
      <header className="dashboard-header">
        <Link className="dashboard-brand" href="/menu"><span className="dashboard-brand-mark">D</span><span>DUEL LOG<small>戦績管理</small></span></Link>
        <div className="dashboard-user">
          <Link aria-label="プロフィール設定" className="user-avatar-link" href="/settings/profile">{avatarUrl ? <Image alt="ユーザーアイコン" className="user-avatar" height={34} src={avatarUrl} unoptimized width={34} /> : <span className="user-avatar" aria-hidden="true">{initial}</span>}</Link>
          <span className="dashboard-username">{username}</span>
          <LogoutButton />
        </div>
      </header>
      <div className="menu-content">
        <section className="menu-welcome"><p className="eyebrow">MAIN MENU</p><h1>{username} さん、ようこそ</h1><p>使いたい機能を選んでください。</p><Link className="menu-record-button" href="/matches/new"><span aria-hidden="true">＋</span><span><strong>対戦を記録</strong><small>新しい試合を登録する</small></span><b aria-hidden="true">→</b></Link></section>
        <section className="menu-grid" aria-label="機能メニュー">
          {MENU_ITEMS.map((item) => <Link className={`menu-card ${item.className}`} href={item.href} key={item.href}><span className="menu-card-icon" aria-hidden="true">{item.icon}</span><span className="menu-card-copy"><strong>{item.title}</strong><small>{item.description}</small></span><span className="menu-card-arrow" aria-hidden="true">↗</span></Link>)}
        </section>
      </div>
    </main>
  );
}
