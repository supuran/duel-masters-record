import AuthForm from "./auth-form";

type HomeProps = { searchParams: Promise<{ error?: string }> };

export default async function Home({ searchParams }: HomeProps) {
  const { error } = await searchParams;
  const initialError = error === "confirmation"
    ? "メール認証を完了できませんでした。確認メールのリンクを開き直してください。"
    : undefined;

  return <AuthForm mode="login" initialError={initialError} />;
}
