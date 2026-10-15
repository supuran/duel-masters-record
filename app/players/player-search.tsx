"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type PlayerSuggestion = { id: string; username: string };

export default function PlayerSearch({ initialQuery }: { initialQuery: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<PlayerSuggestion[]>([]);

  useEffect(() => {
    const normalized = query.trim();
    if (!normalized) return;
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/search/players?q=${encodeURIComponent(normalized)}`, { signal: controller.signal });
        if (!response.ok) { setSuggestions([]); return; }
        const result = await response.json() as { suggestions?: PlayerSuggestion[] };
        setSuggestions(result.suggestions ?? []);
      } catch {
        if (!controller.signal.aborted) setSuggestions([]);
      }
    }, 220);
    return () => { window.clearTimeout(timeout); controller.abort(); };
  }, [query]);

  return (
    <form action="/players" className="player-search-form">
      <label htmlFor="player-search">ユーザー名</label>
      <div className="search-autocomplete-wrap">
        <input autoComplete="off" id="player-search" maxLength={20} minLength={1} name="q" onChange={(event) => { setQuery(event.target.value); if (!event.target.value.trim()) setSuggestions([]); }} placeholder="ユーザー名を入力" value={query} />
        {suggestions.length > 0 && <ul className="search-suggestions" aria-label="ユーザー名の候補">
          {suggestions.map((player) => <li key={player.id}><Link href={`/players/${player.id}`}><strong>{player.username}</strong><small>プロフィールを見る →</small></Link></li>)}
        </ul>}
      </div>
      <button className="submit-button" type="submit">検索</button>
      <small>1〜20文字で検索できます。入力中に候補を表示します。</small>
    </form>
  );
}
