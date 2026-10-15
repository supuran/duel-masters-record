"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { setDeckHiddenAction, setDeckHiddenFromFriendsAction, setOpponentDeckHiddenAction } from "./actions";

export default function DeckVisibilityButton({
  deckId,
  isHidden,
  kind,
}: {
  deckId: string;
  isHidden: boolean;
  kind: "own" | "opponent" | "friends";
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function toggleVisibility() {
    setError("");
    startTransition(async () => {
      const action = kind === "own" ? setDeckHiddenAction : kind === "friends" ? setDeckHiddenFromFriendsAction : setOpponentDeckHiddenAction;
      const result = await action(deckId, !isHidden);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <span className="deck-visibility-wrap">
      <button className="deck-visibility-button" disabled={isPending} onClick={toggleVisibility} type="button">
        {isPending ? "保存中…" : kind === "friends"
          ? isHidden ? "フレンドに公開" : "フレンドから非表示"
          : isHidden ? "対戦登録に表示" : "プルダウンから非表示"}
      </button>
      {error && <span className="deck-visibility-error" role="alert">{error}</span>}
    </span>
  );
}
