import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";

export default async function HeaderAvatarLink() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, avatar_path")
    .eq("id", user.id)
    .maybeSingle();
  const username = profile?.username
    ?? (typeof user.user_metadata.username === "string" ? user.user_metadata.username : "プレイヤー");
  const initial = username.trim().charAt(0).toUpperCase() || "D";

  let avatarUrl: string | null = null;
  if (profile?.avatar_path) {
    const { data } = await supabase.storage.from("user-avatars").createSignedUrl(profile.avatar_path, 3600);
    avatarUrl = data?.signedUrl ?? null;
  }

  return (
    <Link aria-label="マイページへ" className="user-avatar-link" href="/mypage" title="マイページ">
      {avatarUrl
        ? <Image alt="ユーザーアイコン" className="user-avatar" height={34} src={avatarUrl} unoptimized width={34} />
        : <span className="user-avatar" aria-hidden="true">{initial}</span>}
    </Link>
  );
}
