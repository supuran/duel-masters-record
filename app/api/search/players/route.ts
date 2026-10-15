import { createClient } from "@/utils/supabase/server";

function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, (character) => `\\${character}`);
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ suggestions: [] }, { status: 401 });

  const query = new URL(request.url).searchParams.get("q")?.trim().slice(0, 20) ?? "";
  if (!query) return Response.json({ suggestions: [] });

  const { data, error } = await supabase.from("profiles")
    .select("id, username")
    .ilike("username", `${escapeLike(query)}%`)
    .neq("id", user.id)
    .order("username", { ascending: true })
    .limit(8);

  if (error) return Response.json({ suggestions: [] }, { status: 500 });
  return Response.json({ suggestions: data ?? [] });
}
