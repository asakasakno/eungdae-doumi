import { NextRequest, NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/lib/supabase/server";
import { createCreditPackOrder, createPlanOrder, getBillingFlag } from "@/lib/billing";
import type { AppPlanCode, CreditPackCode } from "@/lib/plans";

export async function POST(request: NextRequest) {
  const supabase = await getServerSupabaseClient();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData.user) {
    return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  }

  const billingEnabled = await getBillingFlag(supabase);
  if (!billingEnabled) {
    return NextResponse.json({ message: "결제가 일시 중지되었습니다." }, { status: 403 });
  }

  const body = await request.json();
  const mode = String(body?.mode || "");

  try {
    if (mode === "subscription") {
      const planCode = String(body?.planCode || "") as AppPlanCode;
      const order = await createPlanOrder(supabase, authData.user.id, planCode);
      return NextResponse.json({
        ok: true,
        order,
        message: "현재는 수동 승인 모드입니다. 관리자 승인 후 즉시 반영됩니다.",
      });
    }

    if (mode === "credit_pack") {
      const packCode = String(body?.packCode || "") as CreditPackCode;
      const order = await createCreditPackOrder(supabase, authData.user.id, packCode);
      return NextResponse.json({
        ok: true,
        order,
        message: "현재는 수동 승인 모드입니다. 관리자 승인 후 크레딧이 지급됩니다.",
      });
    }

    return NextResponse.json({ message: "잘못된 결제 요청입니다." }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "결제 주문 생성에 실패했습니다." },
      { status: 500 },
    );
  }
}
