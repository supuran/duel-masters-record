"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteOpponentDeckAction } from "../matches/actions";

export default function OpponentDeckDeleteButton({ deckId, deckName }: { deckId: string; deckName: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function removeDeck() {
    if (!window.confirm(`「${deckName}」を候補から削除しますか？過去の対戦履歴には名前が残ります。`)) return;
    setError("");
    startTransition(async () => {
      const result = await deleteOpponentDeckAction(deckId);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <span className="opponent-deck-delete-wrap">
      {error && <span className="deck-delete-error" role="alert">{error}</span>}
      <button className="deck-delete-button" disabled={isPending} onClick={removeDeck} type="button">{isPending ? "削除中…" : "削除"}</button>
    </span>
  );
}
