import { env } from "@/lib/env";
import { getServerSupabaseClient } from "@/lib/supabase/server";

export async function getAdminContext() {
  const supabase = await getServerSupabaseClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    throw new Error("로그인이 필요합니다.");
  }

  const email = data.user.email?.toLowerCase() || "";
  const isAdmin = env.adminEmails.includes(email);

  return {
    supabase,
    user: data.user,
    email,
    isAdmin,
  };
}

export async function assertAdmin() {
  const context = await getAdminContext();
  if (!context.isAdmin) {
    throw new Error("관리자 권한이 없습니다.");
  }
  return context;
}
