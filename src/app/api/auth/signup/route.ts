import { ok, fail, handleRouteError } from "@/app/api/_helpers";
import { createClient } from "@/lib/supabase/server";
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

    if (password.length < 8) {
      return fail("비밀번호는 8자 이상이어야 합니다.", 400, "WEAK_PASSWORD");
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      return fail(error.message, 400, "SIGNUP_FAILED");
    }

    if (!data.session) {
      return ok(
        {
          requiresEmailConfirmation: true,
          message: "회원가입은 완료되었습니다. 이메일 인증이 켜져 있다면 인증 메일을 확인한 뒤 로그인하세요.",
        },
        201,
      );
    }

    return ok(
      {
        message: "회원가입이 완료되었습니다.",
        redirectTo: "/onboarding",
      },
      201,
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
