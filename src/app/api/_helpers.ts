import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateProfile } from "@/lib/auth";
import { AppError } from "@/lib/errors";

export function ok(data: Record<string, unknown>, status = 200) {
  return NextResponse.json({ success: true, ...data }, { status });
}

export function fail(message: string, status = 400, errorCode = "BAD_REQUEST") {
  return NextResponse.json(
    {
      success: false,
      message,
      error_code: errorCode,
    },
    { status },
  );
}

export async function getAuthedApiContext() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { response: fail("로그인이 필요합니다.", 401, "UNAUTHORIZED") };
  }

  const profile = await getOrCreateProfile(supabase, user.id);
  return { supabase, user, profile };
}

export function handleRouteError(error: unknown) {
  if (error instanceof AppError) {
    return fail(error.message, error.status, error.code);
  }

  const message = error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";
  return fail(message, 500, "INTERNAL_SERVER_ERROR");
}
