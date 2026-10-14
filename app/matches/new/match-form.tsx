"use client";

import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import { createMatchAction, registerOpponentDeckInline, type MatchActionState } from "../actions";

type DeckOption = { id: string; name: string; format?: string };

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
  initial?: { id: string; deck_id: string | null; opponent_deck_id: string | null; opponent_name: string | null; result: string; turn_order: string; played_at: string | null; memo: string | null; format: string | null };
}) {
  const initialState: MatchActionState = { error: "" };
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [availableOpponentDecks, setAvailableOpponentDecks] = useState(opponentDecks);
  const [selectedOpponentDeckId, setSelectedOpponentDeckId] = useState(initial?.opponent_deck_id ?? "");
  const [showNewOpponentDeck, setShowNewOpponentDeck] = useState(false);
  const [newOpponentDeckName, setNewOpponentDeckName] = useState("");
  const [inlineDeckError, setInlineDeckError] = useState("");
  const [inlineDeckSuccess, setInlineDeckSuccess] = useState("");
  const [isAddingOpponentDeck, startAddingOpponentDeck] = useTransition();

  function addOpponentDeck() {
    setInlineDeckError("");
    setInlineDeckSuccess("");
    startAddingOpponentDeck(async () => {
      const result = await registerOpponentDeckInline(newOpponentDeckName);
      if (result.error || !result.deck) {
        setInlineDeckError(result.error || "相手デッキを登録できませんでした。");
        return;
      }
      const deck = result.deck;
      setAvailableOpponentDecks((current) => current.some((item) => item.id === deck.id) ? current : [...current, deck].sort((a, b) => a.name.localeCompare(b.name, "ja")));
      setSelectedOpponentDeckId(deck.id);
      setNewOpponentDeckName("");
      setShowNewOpponentDeck(false);
      setInlineDeckSuccess(`「${deck.name}」を登録して選択しました。`);
    });
  }

  return (
    <form action={formAction} className="deck-form match-form">
      {initial && <input name="match_id" type="hidden" value={initial.id} />}
      <label className="field-label">
        対戦日
        <input defaultValue={initial?.played_at?.slice(0, 10) ?? today} name="played_at" required type="date" />
      </label>

      <label className="field-label">
        フォーマット
        <select defaultValue={initial?.format ?? "ND"} name="format" required>
          <option value="ND">ND（New Division）</option>
          <option value="AD">AD（All Division）</option>
        </select>
      </label>

      <label className="field-label">
        使用デッキ
        <select defaultValue={initial?.deck_id ?? ""} name="deck_id" required>
          <option disabled value="">デッキを選択してください</option>
          {decks.map((deck) => <option key={deck.id} value={deck.id}>{deck.name}（{deck.format ?? "ND"}）</option>)}
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
          <select className="match-opponent-select" onChange={(event) => setSelectedOpponentDeckId(event.target.value)} value={selectedOpponentDeckId} id="opponent-deck-select" name="opponent_deck_id">
            <option value="">未選択・不明</option>
            {availableOpponentDecks.map((deck) => <option key={deck.id} value={deck.id}>{deck.name}</option>)}
          </select>
          {!showNewOpponentDeck ? (
            <button className="match-add-opponent-deck-toggle" onClick={() => { setInlineDeckError(""); setShowNewOpponentDeck(true); }} type="button">＋ 新しい相手デッキを登録</button>
          ) : (
            <div className="match-inline-opponent-deck">
              <input autoComplete="off" maxLength={40} onChange={(event) => setNewOpponentDeckName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addOpponentDeck(); } }} placeholder="相手デッキ名（1〜40文字）" value={newOpponentDeckName} />
              <div>
                <button className="submit-button" disabled={isAddingOpponentDeck || !newOpponentDeckName.trim()} onClick={addOpponentDeck} type="button">{isAddingOpponentDeck ? "登録中…" : "登録して選択"}</button>
                <button className="match-inline-cancel" onClick={() => { setShowNewOpponentDeck(false); setInlineDeckError(""); }} type="button">キャンセル</button>
              </div>
            </div>
          )}
          {inlineDeckError && <span className="match-inline-feedback error-message" role="alert">{inlineDeckError}</span>}
          {inlineDeckSuccess && <span className="match-inline-feedback success-message" role="status">{inlineDeckSuccess}</span>}
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
