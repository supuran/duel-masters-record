"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createMatchAction, type MatchActionState } from "../actions";

type DeckOption = { id: string; name: string };

export default function MatchForm({ decks, today }: { decks: DeckOption[]; today: string }) {
  const initialState: MatchActionState = { error: "" };
  const [state, formAction, isPending] = useActionState(createMatchAction, initialState);

  return (
    <form action={formAction} className="deck-form match-form">
      <label className="field-label">
        対戦日
        <input defaultValue={today} name="played_at" required type="date" />
      </label>

      <label className="field-label">
        使用デッキ
        <select defaultValue="" name="deck_id" required>
          <option disabled value="">デッキを選択してください</option>
          {decks.map((deck) => <option key={deck.id} value={deck.id}>{deck.name}</option>)}
        </select>
      </label>

      <fieldset className="match-choice-fieldset">
        <legend>勝敗</legend>
        <div className="match-choice-row">
          <label className="match-choice"><input defaultChecked name="result" required type="radio" value="win" /><span>勝ち</span></label>
          <label className="match-choice"><input name="result" type="radio" value="loss" /><span>負け</span></label>
          <label className="match-choice"><input name="result" type="radio" value="draw" /><span>引き分け</span></label>
        </div>
      </fieldset>

      <fieldset className="match-choice-fieldset">
        <legend>先攻・後攻</legend>
        <div className="match-choice-row">
          <label className="match-choice"><input defaultChecked name="turn_order" required type="radio" value="first" /><span>先攻</span></label>
          <label className="match-choice"><input name="turn_order" type="radio" value="second" /><span>後攻</span></label>
        </div>
      </fieldset>

      <div className="match-opponent-grid">
        <label className="field-label">
          対戦相手 <span className="optional-label">任意</span>
          <input autoComplete="off" maxLength={40} name="opponent_name" placeholder="プレイヤー名" />
        </label>
        <label className="field-label">
          相手のデッキ <span className="optional-label">任意</span>
          <input autoComplete="off" maxLength={40} name="opponent_deck" placeholder="デッキ名" />
        </label>
      </div>

      <label className="field-label">
        メモ <span className="optional-label">任意</span>
        <textarea maxLength={500} name="memo" placeholder="プレイの振り返りなど" rows={4} />
        <span className="field-hint">500文字まで</span>
      </label>

      {state.error && <p className="form-message error-message" role="alert">{state.error}</p>}
      <div className="deck-form-actions">
        <Link className="deck-cancel-button" href="/matches">キャンセル</Link>
        <button className="submit-button" disabled={isPending} type="submit">{isPending ? "登録中…" : "対戦を登録"}</button>
      </div>
    </form>
  );
}
