"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export type MatchActionState = { error: string };

export async function createMatchAction(
  _previousState: MatchActionState,
  formData: FormData,
): Promise<MatchActionState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "ログイン状態を確認できません。再度ログインしてください。" };

  const deckId = String(formData.get("deck_id") ?? "");
  const result = String(formData.get("result") ?? "");
  const turnOrder = String(formData.get("turn_order") ?? "");
  const playedAt = String(formData.get("played_at") ?? "");
  const opponentName = String(formData.get("opponent_name") ?? "").trim();
  const opponentDeck = String(formData.get("opponent_deck") ?? "").trim();
  const memo = String(formData.get("memo") ?? "").trim();

  if (!deckId) return { error: "使用デッキを選択してください。" };
  if (!["win", "loss", "draw"].includes(result)) return { error: "勝敗を選択してください。" };
  if (!["first", "second"].includes(turnOrder)) return { error: "先攻・後攻を選択してください。" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(playedAt) || Number.isNaN(Date.parse(`${playedAt}T00:00:00Z`))) {
    return { error: "対戦日を入力してください。" };
  }
  if (opponentName.length > 40 || opponentDeck.length > 40 || memo.length > 500) {
    return { error: "対戦相手・相手デッキは40文字以内、メモは500文字以内で入力してください。" };
  }

  const { data: deck, error: deckError } = await supabase
    .from("decks")
    .select("id, name")
    .eq("id", deckId)
    .eq("user_id", user.id)
    .single();
  if (deckError || !deck) return { error: "選択したデッキを確認できません。デッキ一覧を更新してください。" };

  const { error: insertError } = await supabase.from("matches").insert({
    user_id: user.id,
    deck_id: deck.id,
    deck_name: deck.name,
    opponent_name: opponentName || null,
    opponent_deck: opponentDeck || null,
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
