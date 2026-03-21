import { NextRequest, NextResponse } from "next/server";
import { assertAdmin } from "@/lib/admin";
import { approveOrder } from "@/lib/billing";

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ orderId: string }> },
) {
  try {
    const { supabase } = await assertAdmin();
    const { orderId } = await context.params;
    const order = await approveOrder(supabase, orderId);
    return NextResponse.json({ ok: true, order });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "주문 승인에 실패했습니다." },
      { status: 403 },
    );
  }
}
