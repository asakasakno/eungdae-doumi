import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/admin";
import { getBillingOverview } from "@/lib/billing";

export async function GET() {
  try {
    const { supabase } = await assertAdmin();
    const overview = await getBillingOverview(supabase);
    return NextResponse.json(overview);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "관리자 개요 조회에 실패했습니다." },
      { status: 403 },
    );
  }
}
