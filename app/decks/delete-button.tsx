"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

type DeleteDeckButtonProps = { deckId: string; imagePath: string | null };

export default function DeleteDeckButton({ deckId, imagePath }: DeleteDeckButtonProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);

  async function removeDeck() {
    if (!window.confirm("このデッキを削除しますか？")) return;
    setIsPending(true);
    setError("");
    const supabase = createClient();

    const { error: deleteError } = await supabase.from("decks").delete().eq("id", deckId);
    if (deleteError) {
      setIsPending(false);
      setError("デッキを削除できませんでした。もう一度お試しください。");
      return;
    }

    if (imagePath) await supabase.storage.from("deck-images").remove([imagePath]);
    router.refresh();
  }

  return (
    <div className="deck-delete-wrap">
      {error && <span className="deck-delete-error" role="alert">{error}</span>}
      <button className="deck-delete-button" disabled={isPending} onClick={removeDeck} type="button">{isPending ? "削除中…" : "削除"}</button>
    </div>
  );
}
