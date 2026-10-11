"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteMatchAction } from "./actions";

export default function DeleteMatchButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  function remove() {
    if (!window.confirm("この対戦履歴を削除しますか？")) return;
    setError("");
    startTransition(async () => {
      const result = await deleteMatchAction(id);
      if (result.error) setError(result.error);
      else router.push("/matches?deleted=1");
    });
  }
  return <span className="match-delete-wrap"><button className="match-delete-button" disabled={pending} onClick={remove} type="button">{pending ? "削除中…" : "この履歴を削除"}</button>{error && <span className="match-delete-error" role="alert">{error}</span>}</span>;
}
