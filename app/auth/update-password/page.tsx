import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import UpdatePasswordForm from "./update-password-form";

export default async function UpdatePasswordPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/?error=recovery");

  return <UpdatePasswordForm />;
}
