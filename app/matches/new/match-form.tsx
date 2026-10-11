"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createMatchAction, type MatchActionState } from "../actions";

type DeckOption = { id: string; name: string };

export default function MatchForm({
  decks,
  opponentDecks,
  today,
  action = createMatchAction,
  initial,
}: {
  decks: DeckOption[];
  opponentDecks: DeckOption[];
  today: string;
  action?: typeof createMatchAction;
  initial?: { id: string; deck_id: string | null; opponent_deck_id: string | null; opponent_name: string | null; result: string; turn_order: string; played_at: string | null; memo: string | null };
}) {
  const initialState: MatchActionState = { error: "" };
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="deck-form match-form">
      {initial && <input name="match_id" type="hidden" value={initial.id} />}
      <label className="field-label">
        対戦日
        <input defaultValue={initial?.played_at?.slice(0, 10) ?? today} name="played_at" required type="date" />
      </label>

      <label className="field-label">
        使用デッキ
        <select defaultValue={initial?.deck_id ?? ""} name="deck_id" required>
          <option disabled value="">デッキを選択してください</option>
          {decks.map((deck) => <option key={deck.id} value={deck.id}>{deck.name}</option>)}
        </select>
      </label>

      <fieldset className="match-choice-fieldset">
        <legend>勝敗</legend>
        <div className="match-choice-row">
          <label className="match-choice"><input defaultChecked={!initial || initial.result === "win"} name="result" required type="radio" value="win" /><span>勝ち</span></label>
          <label className="match-choice"><input defaultChecked={initial?.result === "loss"} name="result" type="radio" value="loss" /><span>負け</span></label>
        </div>
      </fieldset>

      <fieldset className="match-choice-fieldset">
        <legend>先攻・後攻</legend>
        <div className="match-choice-row">
          <label className="match-choice"><input defaultChecked={!initial || initial.turn_order === "first"} name="turn_order" required type="radio" value="first" /><span>先攻</span></label>
          <label className="match-choice"><input defaultChecked={initial?.turn_order === "second"} name="turn_order" type="radio" value="second" /><span>後攻</span></label>
        </div>
      </fieldset>

      <div className="match-opponent-grid">
        <div className="field-label">
          <div className="match-field-heading"><label htmlFor="opponent-name-input">対戦相手</label><span className="optional-label">任意</span></div>
          <input autoComplete="off" defaultValue={initial?.opponent_name ?? ""} id="opponent-name-input" maxLength={40} name="opponent_name" placeholder="プレイヤー名" />
        </div>
        <div className="field-label">
          <div className="match-field-heading"><label htmlFor="opponent-deck-select">相手のデッキ</label><span className="optional-label">任意</span></div>
          <select className="match-opponent-select" defaultValue={initial?.opponent_deck_id ?? ""} id="opponent-deck-select" name="opponent_deck_id">
            <option value="">未選択・不明</option>
            {opponentDecks.map((deck) => <option key={deck.id} value={deck.id}>{deck.name}</option>)}
          </select>
          <Link className="manage-opponent-decks-link" href="/opponent-decks">候補を登録・管理する →</Link>
        </div>
      </div>

      <label className="field-label">
        メモ <span className="optional-label">任意</span>
        <textarea defaultValue={initial?.memo ?? ""} maxLength={500} name="memo" placeholder="プレイの振り返りなど" rows={4} />
        <span className="field-hint">500文字まで</span>
      </label>

      {state.error && <p className="form-message error-message" role="alert">{state.error}</p>}
      <div className="deck-form-actions">
        <Link className="deck-cancel-button" href="/matches">キャンセル</Link>
        <button className="submit-button" disabled={isPending} type="submit">{isPending ? "保存中…" : initial ? "変更を保存" : "対戦を登録"}</button>
      </div>
    </form>
  );
}
