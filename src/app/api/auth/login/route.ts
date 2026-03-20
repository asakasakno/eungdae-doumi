import { ok, fail, handleRouteError } from "@/app/api/_helpers";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateProfile, getRedirectAfterLogin } from "@/lib/auth";
import { isValidEmail } from "@/lib/utils";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (!isValidEmail(email)) {
      return fail("올바른 이메일 주소를 입력하세요.", 400, "INVALID_EMAIL");
    }

    if (!password) {
      return fail("비밀번호를 입력하세요.", 400, "MISSING_PASSWORD");
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      return fail(error?.message ?? "로그인에 실패했습니다.", 400, "LOGIN_FAILED");
    }

    const profile = await getOrCreateProfile(supabase, data.user.id);
    const redirectTo = getRedirectAfterLogin(profile);

    return ok({
      message: "로그인되었습니다.",
      redirectTo,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
