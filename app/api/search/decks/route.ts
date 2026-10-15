import { createClient } from "@/utils/supabase/server";

function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, (character) => `\\${character}`);
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ suggestions: [] }, { status: 401 });

  const query = new URL(request.url).searchParams.get("q")?.trim().slice(0, 40) ?? "";
  if (!query) return Response.json({ suggestions: [] });

  const { data, error } = await supabase.from("decks")
    .select("id, name, format, deck_type, user_id")
    .ilike("name", `${escapeLike(query)}%`)
    .order("name", { ascending: true })
    .limit(8);

  if (error) return Response.json({ suggestions: [] }, { status: 500 });
  const rows = data ?? [];
  const ownerIds = [...new Set(rows.map((deck) => deck.user_id))];
  const { data: owners } = ownerIds.length
    ? await supabase.from("profiles").select("id, username").in("id", ownerIds)
    : { data: [] as { id: string; username: string }[] };
  const ownerNames = new Map((owners ?? []).map((owner) => [owner.id, owner.username]));
  return Response.json({ suggestions: rows.map((deck) => ({ ...deck, ownerName: ownerNames.get(deck.user_id) ?? "プレイヤー" })) });
}
