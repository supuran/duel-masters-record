import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import LogoutButton from "../mypage/logout-button";
import DeckSearchForm from "./deck-search-form";
import { createClient } from "@/utils/supabase/server";

const VALID_CIVILIZATIONS = ["光", "水", "闇", "火", "自然"];

function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, (character) => `\\${character}`);
}

export default async function DeckSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ name?: string; type?: string; civilization?: string | string[]; key_card?: string }>;
}) {
  const params = await searchParams;
  const name = (params.name ?? "").trim().slice(0, 40);
  const type = params.type === "competitive" || params.type === "casual" ? params.type : "";
  const requestedCivilizations = Array.isArray(params.civilization) ? params.civilization : params.civilization ? [params.civilization] : [];
  const civilizations = requestedCivilizations.filter((value) => VALID_CIVILIZATIONS.includes(value));
  const keyCard = (params.key_card ?? "").trim().slice(0, 60);
  const hasSearch = Boolean(name || type || civilizations.length || keyCard);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  let query = supabase.from("decks")
    .select("id, user_id, name, format, deck_type, civilizations, key_cards, image_path, created_at")
    .order("created_at", { ascending: false })
    .limit(60);
  if (name) query = query.ilike("name", `%${escapeLike(name)}%`);
  if (type) query = query.eq("deck_type", type);
  if (civilizations.length) query = query.overlaps("civilizations", civilizations);
  if (keyCard) query = query.ilike("key_cards", `%${escapeLike(keyCard)}%`);
  const { data: foundDecks, error } = hasSearch ? await query : { data: [], error: null };
  const decks = foundDecks ?? [];

  const ownerIds = [...new Set(decks.map((deck) => deck.user_id))];
  const { data: owners } = ownerIds.length
    ? await supabase.from("profiles").select("id, username").in("id", ownerIds)
    : { data: [] as { id: string; username: string }[] };
  const ownerNames = new Map((owners ?? []).map((owner) => [owner.id, owner.username]));
  const deckCards = await Promise.all(decks.map(async (deck) => {
    const { data } = deck.image_path
      ? await supabase.storage.from("deck-images").createSignedUrl(deck.image_path, 3600)
      : { data: null };
    return { ...deck, imageUrl: data?.signedUrl ?? null };
  }));

  return (
    <main className="deck-page-shell">
      <header className="dashboard-header">
        <Link className="dashboard-brand" href="/menu"><span className="dashboard-brand-mark">D</span><span>DUEL LOG<small>戦績管理</small></span></Link>
        <div className="dashboard-user"><Link className="back-to-dashboard" href="/menu">メインメニュー</Link><LogoutButton /></div>
      </header>
      <div className="deck-page-content">
        <Link className="deck-back-link" href="/menu">← メインメニューへ戻る</Link>
        <div className="deck-page-title-row"><div><p className="eyebrow">DECK SEARCH</p><h1>デッキ検索</h1><p>文明、キーカード、ガチ／カジュアルからデッキを探せます。</p></div></div>
        <DeckSearchForm initialName={name} initialType={type} initialCivilizations={civilizations} initialKeyCard={keyCard} />
        {error ? <section className="deck-page-message" role="alert">デッキ検索を読み込めません。Supabase SQL Editorで <code>supabase/profile-deck-search.sql</code> を実行してください。</section>
          : !hasSearch ? <section className="deck-empty-card"><h2>検索条件を入力してください</h2><p>条件を指定すると、自分のデッキとフレンドに公開されているデッキを検索できます。</p></section>
            : !decks.length ? <section className="deck-empty-card"><h2>デッキが見つかりません</h2><p>検索条件を変えてもう一度お試しください。</p></section>
              : <section className="deck-search-results"><div className="player-section-heading"><h2>検索結果</h2><span>{decks.length}件</span></div><div className="deck-card-grid">
                {deckCards.map((deck) => <article className="deck-item-card" key={deck.id}>
                  <div className="deck-item-image">{deck.imageUrl ? <Image alt={`${deck.name}の画像`} fill sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 33vw" src={deck.imageUrl} unoptimized /> : <span aria-hidden="true">DP</span>}</div>
                  <div className="deck-item-details"><div><p className="deck-item-label">{deck.format} · {deck.deck_type === "competitive" ? "ガチデッキ" : "カジュアルデッキ"}</p><h2>{deck.name}</h2>
                    <p className="deck-meta-line">文明: {deck.civilizations?.length ? deck.civilizations.join("・") : "未設定"}</p>
                    {deck.key_cards && <p className="deck-meta-line">キーカード: {deck.key_cards}</p>}
                    <Link className="deck-owner-link" href={`/players/${deck.user_id}`}>{ownerNames.get(deck.user_id) ?? "プレイヤー"} さんのデッキ →</Link>
                  </div></div>
                </article>)}
              </div></section>}
      </div>
    </main>
  );
}
