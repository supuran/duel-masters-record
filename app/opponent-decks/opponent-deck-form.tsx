"use client";

import { useActionState } from "react";
import { createOpponentDeckAction, type OpponentDeckActionState } from "../matches/actions";

export default function OpponentDeckForm() {
  const initialState: OpponentDeckActionState = { error: "", success: "" };
  const [state, formAction, isPending] = useActionState(createOpponentDeckAction, initialState);

  return (
    <form action={formAction} className="opponent-deck-form">
      <label className="field-label" htmlFor="opponent-deck-name">相手デッキ名</label>
      <div className="opponent-deck-form-row">
        <input autoComplete="off" id="opponent-deck-name" maxLength={40} name="name" placeholder="例：火水闇ハデス" required />
        <select aria-label="相手デッキのフォーマット" defaultValue="ND" name="format">
          <option value="ND">ND</option>
          <option value="AD">AD</option>
        </select>
        <button className="submit-button" disabled={isPending} type="submit">{isPending ? "登録中…" : "候補を登録"}</button>
      </div>
      <p className="field-hint">1〜40文字。同じ名前でもNDとADは別々に登録できます。</p>
      {state.error && <p className="form-message error-message" role="alert">{state.error}</p>}
      {state.success && <p className="match-success-message" role="status">{state.success}</p>}
    </form>
  );
}
