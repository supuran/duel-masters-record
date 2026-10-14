import AuthForm from "./auth-form";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

type HomeProps = { searchParams: Promise<{ error?: string }> };

export default async function Home({ searchParams }: HomeProps) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/menu");
  const initialError = error === "confirmation"
    ? "メール認証を完了できませんでした。確認メールのリンクを開き直してください。"
    : undefined;

  return <AuthForm mode="login" initialError={initialError} />;
}
