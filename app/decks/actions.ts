"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

export async function setDeckHiddenAction(deckId: string, isHidden: boolean): Promise<{ error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "ログイン状態を確認できません。再度ログインしてください。" };
  const { data, error } = await supabase.from("decks").update({ is_hidden: isHidden }).eq("id", deckId).eq("user_id", user.id).select("id").maybeSingle();
  if (error) return { error: `設定を保存できません [${error.code ?? "unknown"}]。` };
  if (!data) return { error: "デッキが見つかりません。画面を更新してください。" };
  revalidatePath("/decks");
  revalidatePath("/matches/new");
  revalidatePath("/matches");
  return { error: "" };
}

export async function setDeckHiddenFromFriendsAction(deckId: string, isHidden: boolean): Promise<{ error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "ログイン状態を確認できません。再度ログインしてください。" };
  const { data, error } = await supabase.from("decks").update({ is_hidden_from_friends: isHidden }).eq("id", deckId).eq("user_id", user.id).select("id").maybeSingle();
  if (error) return { error: `設定を保存できません [${error.code ?? "unknown"}]。` };
  if (!data) return { error: "デッキが見つかりません。画面を更新してください。" };
  revalidatePath("/decks");
  revalidatePath("/deck-search");
  return { error: "" };
}

export async function setOpponentDeckHiddenAction(deckId: string, isHidden: boolean): Promise<{ error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "ログイン状態を確認できません。再度ログインしてください。" };
  const { data, error } = await supabase.from("opponent_decks").update({ is_hidden: isHidden }).eq("id", deckId).eq("user_id", user.id).select("id").maybeSingle();
  if (error) return { error: `設定を保存できません [${error.code ?? "unknown"}]。` };
  if (!data) return { error: "相手デッキが見つかりません。画面を更新してください。" };
  revalidatePath("/opponent-decks");
  revalidatePath("/matches/new");
  return { error: "" };
}
