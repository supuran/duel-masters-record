"use client";

import { useEffect, useState } from "react";

type DeckSuggestion = { id: string; name: string; format: string; deck_type: string; ownerName: string };

export default function DeckSearchForm({
  initialName,
  initialFormat,
  initialType,
}: {
  initialName: string;
  initialFormat: string;
  initialType: string;
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
                <small>{deck.ownerName} さん · {deck.format} · {deck.deck_type === "competitive" ? "ガチ" : "カジュアル"}</small>
              </button>
            </li>)}
          </ul>}
        </div>
      </div>

      <div className="deck-search-filter-row">
        <label className="field-label" htmlFor="deck-search-format">フォーマット
          <select defaultValue={initialFormat} id="deck-search-format" name="format">
            <option value="">ND／ADすべて</option>
            <option value="ND">ND</option>
            <option value="AD">AD</option>
          </select>
        </label>
        <label className="field-label" htmlFor="deck-search-type">デッキタイプ
          <select defaultValue={initialType} id="deck-search-type" name="type">
            <option value="">すべて</option>
            <option value="competitive">ガチデッキ</option>
            <option value="casual">カジュアルデッキ</option>
          </select>
        </label>
      </div>
      <div className="deck-form-actions">
        <a className="deck-cancel-button" href="/deck-search">条件をリセット</a>
        <button className="submit-button" type="submit">デッキを検索</button>
      </div>
    </form>
  );
}
