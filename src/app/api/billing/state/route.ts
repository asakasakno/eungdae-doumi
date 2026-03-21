import { NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/lib/supabase/server";
import { getBillingFlag } from "@/lib/billing";
import { getCreditPack, CREDIT_PACKS, PLAN_DEFINITIONS } from "@/lib/plans";
import { getUsageSummary } from "@/lib/usage";

export async function GET() {
  const supabase = await getServerSupabaseClient();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData.user) {
    return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  }

  const billingEnabled = await getBillingFlag(supabase);
  const usage = await getUsageSummary(supabase, authData.user.id);

  return NextResponse.json({
    billingEnabled,
    usage,
    plans: Object.values(PLAN_DEFINITIONS),
    packs: Object.values(CREDIT_PACKS),
  });
}
