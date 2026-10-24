import Link from "next/link";
import HeaderAvatarLink from "@/app/header-avatar-link";
import { redirect } from "next/navigation";
import LogoutButton from "../../mypage/logout-button";
import AvatarForm from "./avatar-form";
import { createClient } from "@/utils/supabase/server";

export default async function ProfileSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  const { data: profile, error } = await supabase.from("profiles").select("username, bio, avatar_path").eq("id", user.id).maybeSingle();
  if (error || !profile) return <main className="deck-page-shell"><section className="deck-page-message">プロフィールを読み込めません。Supabase SQL Editorでプロフィール設定を確認してください。</section></main>;
  let avatarUrl: string | null = null;
  if (profile.avatar_path) {
    const { data } = await supabase.storage.from("user-avatars").createSignedUrl(profile.avatar_path, 3600);
    avatarUrl = data?.signedUrl ?? null;
  }
  return (
    <main className="deck-page-shell">
      <header className="dashboard-header"><Link className="dashboard-brand" href="/mypage"><span className="dashboard-brand-mark">D</span><span>DUEL LOG<small>戦績管理</small></span></Link><div className="dashboard-user"><HeaderAvatarLink />
          <LogoutButton /></div></header>
      <div className="deck-form-page-content"><Link className="deck-back-link" href="/mypage">← マイページへ戻る</Link><section className="deck-form-card avatar-settings-card"><p className="eyebrow">PROFILE SETTINGS</p><h1>プロフィール設定</h1><p className="deck-form-intro">ユーザー名、自己紹介、アイコン画像を設定できます。</p><AvatarForm avatarPath={profile.avatar_path} avatarUrl={avatarUrl} bio={profile.bio} username={profile.username} /></section></div>
    </main>
  );
}
