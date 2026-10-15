"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

export default function LogoutButton() {
  const router = useRouter();

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/");
    router.refresh();
  }

  return (
    <span className="logout-control-group">
      <Link aria-label="マイページへ" className="mypage-shortcut" href="/mypage" title="マイページへ">
        <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
          <circle cx="12" cy="8" r="3.25" />
          <path d="M5.5 20c.55-3.3 2.95-5.1 6.5-5.1s5.95 1.8 6.5 5.1" />
        </svg>
      </Link>
      <button className="logout-button" onClick={logout} type="button">ログアウト</button>
    </span>
  );
}
