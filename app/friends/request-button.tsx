"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { sendFriendRequestAction } from "./actions";

export default function FriendRequestButton({ userId, state }: { userId: string; state: "none" | "outgoing" | "incoming" | "friend" }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const label = state === "friend" ? "フレンド" : state === "outgoing" ? "申請中" : state === "incoming" ? "申請が届いています" : "フレンド申請";
  function send() {
    setMessage("");
    startTransition(async () => {
      const result = await sendFriendRequestAction(userId);
      if (result.error) setMessage(result.error);
      else router.refresh();
    });
  }
  return <div className="friend-request-control"><button className="friend-request-button" disabled={pending || state !== "none"} onClick={send} type="button">{pending ? "送信中…" : label}</button>{message && <small role="alert">{message}</small>}</div>;
}
