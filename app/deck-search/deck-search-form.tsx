"use client";

import { useEffect, useState } from "react";

const CIVILIZATIONS = ["光", "水", "闇", "火", "自然"] as const;
type DeckSuggestion = { id: string; name: string; format: string; deck_type: string; civilizations: string[]; ownerName: string };

export default function DeckSearchForm({
  initialName,
  initialType,
  initialCivilizations,
  initialKeyCard,
}: {
  initialName: string;
  initialType: string;
  initialCivilizations: string[];
  initialKeyCard: string;
}) {
  const [name, setName] = useState(initialName);
  const [suggestions, setSuggestions] = useState<DeckSuggestion[]>([]);

  useEffect(() => {
    const normalized = name.trim();
    if (!normalized) return;
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/search/decks?q=${encodeURIComponent(normalized)}`, { signal: controller.signal });
        if (!response.ok) { setSuggestions([]); return; }
        const result = await response.json() as { suggestions?: DeckSuggestion[] };
        setSuggestions(result.suggestions ?? []);
      } catch {
        if (!controller.signal.aborted) setSuggestions([]);
      }
    }, 220);
    return () => { window.clearTimeout(timeout); controller.abort(); };
  }, [name]);

  return (
    <form action="/deck-search" className="deck-search-form" method="get">
      <div className="field-label">
        <label htmlFor="deck-search-name">デッキ名</label>
        <div className="search-autocomplete-wrap">
          <input autoComplete="off" id="deck-search-name" maxLength={40} name="name" onChange={(event) => { setName(event.target.value); if (!event.target.value.trim()) setSuggestions([]); }} placeholder="デッキ名を入力" value={name} />
          {suggestions.length > 0 && <ul className="search-suggestions" aria-label="デッキ名の候補">
            {suggestions.map((deck) => <li key={deck.id}>
              <button onClick={() => { setName(deck.name); setSuggestions([]); }} type="button">
                <strong>{deck.name}</strong>
                <small>{deck.ownerName} さん · {deck.format} · {deck.deck_type === "competitive" ? "ガチ" : "カジュアル"}{deck.civilizations?.length ? ` · ${deck.civilizations.join("・")}` : ""}</small>
              </button>
            </li>)}
          </ul>}
        </div>
      </div>

      <fieldset className="deck-civilization-fieldset search-civilization-fieldset">
        <legend>文明（複数選択可）</legend>
        <div className="deck-civilization-options">
          {CIVILIZATIONS.map((civilization) => <label key={civilization}>
            <input defaultChecked={initialCivilizations.includes(civilization)} name="civilization" type="checkbox" value={civilization} />
            <span>{civilization}</span>
          </label>)}
        </div>
        <span className="field-hint">選んだ文明を1つ以上含むデッキを検索します。</span>
      </fieldset>

      <div className="deck-search-filter-row">
        <label className="field-label" htmlFor="deck-search-type">デッキタイプ
          <select defaultValue={initialType} id="deck-search-type" name="type">
            <option value="">すべて</option>
            <option value="competitive">ガチデッキ</option>
            <option value="casual">カジュアルデッキ</option>
          </select>
        </label>
        <label className="field-label" htmlFor="deck-search-card">キーカード
          <input autoComplete="off" defaultValue={initialKeyCard} id="deck-search-card" maxLength={60} name="key_card" placeholder="カード名で検索" />
        </label>
      </div>
      <div className="deck-form-actions">
        <a className="deck-cancel-button" href="/deck-search">条件をリセット</a>
        <button className="submit-button" type="submit">デッキを検索</button>
      </div>
    </form>
  );
}
