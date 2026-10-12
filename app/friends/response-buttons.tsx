"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { respondFriendAction } from "./actions";

export default function FriendResponseButtons({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  function respond(decision: "accepted" | "rejected") {
    setError("");
    startTransition(async () => {
      const result = await respondFriendAction(requestId, decision);
      if (result.error) setError(result.error);
      else router.refresh();
    });
  }
  return <div className="friend-response-control"><button disabled={pending} onClick={() => respond("accepted")} type="button">承認</button><button className="friend-reject-button" disabled={pending} onClick={() => respond("rejected")} type="button">拒否</button>{error && <small role="alert">{error}</small>}</div>;
}
