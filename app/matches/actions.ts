"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export type MatchActionState = { error: string };
export type OpponentDeckActionState = { error: string; success: string };

export async function createMatchAction(
  _previousState: MatchActionState,
  formData: FormData,
): Promise<MatchActionState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "ログイン状態を確認できません。再度ログインしてください。" };

  const deckId = String(formData.get("deck_id") ?? "");
  const opponentDeckId = String(formData.get("opponent_deck_id") ?? "");
  const result = String(formData.get("result") ?? "");
  const turnOrder = String(formData.get("turn_order") ?? "");
  const playedAt = String(formData.get("played_at") ?? "");
  const opponentName = String(formData.get("opponent_name") ?? "").trim();
  const memo = String(formData.get("memo") ?? "").trim();

  if (!deckId) return { error: "使用デッキを選択してください。" };
  if (!["win", "loss"].includes(result)) return { error: "勝ちまたは負けを選択してください。" };
  if (!["first", "second"].includes(turnOrder)) return { error: "先攻・後攻を選択してください。" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(playedAt) || Number.isNaN(Date.parse(`${playedAt}T00:00:00Z`))) {
    return { error: "対戦日を入力してください。" };
  }
  if (opponentName.length > 40 || memo.length > 500) {
    return { error: "対戦相手は40文字以内、メモは500文字以内で入力してください。" };
  }

  const { data: deck, error: deckError } = await supabase
    .from("decks")
    .select("id, name")
    .eq("id", deckId)
    .eq("user_id", user.id)
    .single();
  if (deckError || !deck) return { error: "選択したデッキを確認できません。デッキ一覧を更新してください。" };

  let opponentDeck: { id: string; name: string } | null = null;
  if (opponentDeckId) {
    const { data, error } = await supabase
      .from("opponent_decks")
      .select("id, name")
      .eq("id", opponentDeckId)
      .eq("user_id", user.id)
      .single();
    if (error || !data) return { error: "選択した相手デッキを確認できません。候補一覧を更新してください。" };
    opponentDeck = data;
  }

  const { error: insertError } = await supabase.from("matches").insert({
    user_id: user.id,
    deck_id: deck.id,
    deck_name: deck.name,
    opponent_deck_id: opponentDeck?.id ?? null,
    opponent_name: opponentName || null,
    opponent_deck: opponentDeck?.name ?? null,
    result,
    turn_order: turnOrder,
    played_at: playedAt,
    memo: memo || null,
  });

  if (insertError) return { error: `登録エラー [${insertError.code ?? "unknown"}]: ${insertError.message}` };

  revalidatePath("/mypage");
  revalidatePath("/matches");
  redirect("/matches?created=1");
}

export async function createOpponentDeckAction(
  _previousState: OpponentDeckActionState,
  formData: FormData,
): Promise<OpponentDeckActionState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "ログイン状態を確認できません。再度ログインしてください。", success: "" };

  const name = String(formData.get("name") ?? "").trim();
  if (!name || name.length > 40) return { error: "相手デッキ名は1〜40文字で入力してください。", success: "" };

  const { error } = await supabase.from("opponent_decks").insert({ user_id: user.id, name });
  if (error?.code === "23505") return { error: "この相手デッキ名はすでに登録されています。", success: "" };
  if (error) return { error: `登録エラー [${error.code ?? "unknown"}]: ${error.message}`, success: "" };

  revalidatePath("/opponent-decks");
  revalidatePath("/matches/new");
  return { error: "", success: "相手デッキを登録しました。" };
}

export async function deleteOpponentDeckAction(id: string): Promise<{ error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "ログイン状態を確認できません。再度ログインしてください。" };

  const { data, error } = await supabase
    .from("opponent_decks")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();
  if (error) return { error: `削除エラー [${error.code ?? "unknown"}]: ${error.message}` };
  if (!data) return { error: "相手デッキが見つかりません。画面を更新してください。" };

  revalidatePath("/opponent-decks");
  revalidatePath("/matches/new");
  revalidatePath("/matches");
  return { error: "" };
}
