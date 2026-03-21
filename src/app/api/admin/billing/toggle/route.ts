import { NextRequest, NextResponse } from "next/server";
import { assertAdmin } from "@/lib/admin";
import { setBillingFlag } from "@/lib/billing";

export async function POST(request: NextRequest) {
  try {
    const { supabase } = await assertAdmin();
    const body = await request.json();
    const enabled = Boolean(body?.enabled);
    const nextEnabled = await setBillingFlag(supabase, enabled);
    return NextResponse.json({ ok: true, enabled: nextEnabled });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "결제 스위치 변경에 실패했습니다." },
      { status: 403 },
    );
  }
}
