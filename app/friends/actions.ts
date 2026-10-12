"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

export async function sendFriendRequestAction(targetId: string): Promise<{ error: string; success: boolean }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "ログインしてください。", success: false };
  if (!/^[0-9a-f-]{36}$/i.test(targetId)) return { error: "ユーザーを確認できません。", success: false };
  const { error } = await supabase.rpc("request_friend", { target_user_id: targetId });
  if (error) return { error: error.message, success: false };
  revalidatePath("/players");
  revalidatePath(`/players/${targetId}`);
  revalidatePath("/friends");
  return { error: "", success: true };
}

export async function respondFriendAction(requestId: string, decision: "accepted" | "rejected"): Promise<{ error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "ログインしてください。" };
  if (!/^[0-9a-f-]{36}$/i.test(requestId) || !["accepted", "rejected"].includes(decision)) return { error: "申請内容を確認できません。" };
  const { error } = await supabase.rpc("respond_friend", { request_id: requestId, decision });
  if (error) return { error: error.message };
  revalidatePath("/friends");
  revalidatePath("/players");
  return { error: "" };
}
