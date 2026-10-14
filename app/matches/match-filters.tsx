import Link from "next/link";

type DeckOption = { id: string; name: string };

export default function MatchFilters({
  decks,
  values,
}: {
  decks: DeckOption[];
  values: { from?: string; to?: string; result?: string; deck_id?: string };
}) {
  return (
    <form action="/matches" className="match-filter-form">
      <label className="match-filter-field match-date-field">開始日<input defaultValue={values.from ?? ""} name="from" type="date" /></label>
      <label className="match-filter-field match-date-field">終了日<input defaultValue={values.to ?? ""} name="to" type="date" /></label>
      <label className="match-filter-field">勝敗<select defaultValue={values.result ?? ""} name="result"><option value="">すべて</option><option value="win">勝ちのみ</option><option value="loss">負けのみ</option></select></label>
      <label className="match-filter-field">使用デッキ<select defaultValue={values.deck_id ?? ""} name="deck_id"><option value="">すべて</option>{decks.map((deck) => <option key={deck.id} value={deck.id}>{deck.name}</option>)}</select></label>
      <div className="match-filter-actions"><button className="submit-button" type="submit">検索</button><Link href="/matches">リセット</Link></div>
    </form>
  );
}
