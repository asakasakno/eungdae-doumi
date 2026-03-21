import type { SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import { getCreditPack, getPlanDefinition, type AppPlanCode, type CreditPackCode } from "@/lib/plans";

export async function getBillingFlag(supabase: SupabaseClient) {
  const { data } = await supabase
    .from("feature_flags")
    .select("value_json")
    .eq("key", "billing_enabled")
    .maybeSingle();

  const dbValue = data?.value_json?.enabled;

  if (typeof dbValue === "boolean") {
    return dbValue;
  }

  return env.enableBilling;
}

export async function setBillingFlag(supabase: SupabaseClient, enabled: boolean) {
  const payload = {
    key: "billing_enabled",
    value_json: { enabled },
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("feature_flags").upsert(payload, { onConflict: "key" });
  if (error) throw error;
  return enabled;
}

export async function ensureCreditWallet(supabase: SupabaseClient, userId: string, planCode: string) {
  const today = new Date();
  const cycleStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
  const cycleEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10);
  const plan = getPlanDefinition(planCode);

  const { data: wallet } = await supabase
    .from("credit_wallets")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (!wallet) {
    const { error } = await supabase.from("credit_wallets").insert({
      user_id: userId,
      monthly_plan_code: plan.code,
      monthly_included: plan.monthlyIncludedReviews,
      monthly_used: 0,
      purchased_total: 0,
      purchased_used: 0,
      cycle_start: cycleStart,
      cycle_end: cycleEnd,
    });
    if (error) throw error;
    return {
      monthly_plan_code: plan.code,
      monthly_included: plan.monthlyIncludedReviews,
      monthly_used: 0,
      purchased_total: 0,
      purchased_used: 0,
      cycle_start: cycleStart,
      cycle_end: cycleEnd,
    };
  }

  const needsReset = wallet.cycle_start !== cycleStart || wallet.monthly_plan_code !== plan.code;
  if (needsReset) {
    const { error } = await supabase
      .from("credit_wallets")
      .update({
        monthly_plan_code: plan.code,
        monthly_included: plan.monthlyIncludedReviews,
        monthly_used: 0,
        cycle_start: cycleStart,
        cycle_end: cycleEnd,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (error) throw error;

    return {
      ...wallet,
      monthly_plan_code: plan.code,
      monthly_included: plan.monthlyIncludedReviews,
      monthly_used: 0,
      cycle_start: cycleStart,
      cycle_end: cycleEnd,
    };
  }

  return wallet;
}

export function calculateRemainingCredits(wallet: {
  monthly_included: number;
  monthly_used: number;
  purchased_total: number;
  purchased_used: number;
}) {
  const includedRemaining = Math.max(Number(wallet.monthly_included ?? 0) - Number(wallet.monthly_used ?? 0), 0);
  const purchasedRemaining = Math.max(Number(wallet.purchased_total ?? 0) - Number(wallet.purchased_used ?? 0), 0);
  return {
    includedRemaining,
    purchasedRemaining,
    totalRemaining: includedRemaining + purchasedRemaining,
  };
}

export async function consumeReviewCredits(supabase: SupabaseClient, userId: string, count: number, planCode: string) {
  const wallet = await ensureCreditWallet(supabase, userId, planCode);
  const remaining = calculateRemainingCredits(wallet);

  if (remaining.totalRemaining < count) {
    throw new Error("리뷰 처리 가능 개수가 부족합니다.");
  }

  const includedAvailable = remaining.includedRemaining;
  const useIncluded = Math.min(includedAvailable, count);
  const usePurchased = Math.max(count - useIncluded, 0);

  const { error } = await supabase
    .from("credit_wallets")
    .update({
      monthly_used: Number(wallet.monthly_used ?? 0) + useIncluded,
      purchased_used: Number(wallet.purchased_used ?? 0) + usePurchased,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (error) throw error;

  await supabase.from("credit_ledger").insert({
    user_id: userId,
    delta: -count,
    kind: "consume",
    memo: `리뷰 ${count}개 처리`,
  });
}

export async function createPlanOrder(
  supabase: SupabaseClient,
  userId: string,
  planCode: AppPlanCode,
) {
  const plan = getPlanDefinition(planCode);
  const { data, error } = await supabase
    .from("billing_orders")
    .insert({
      user_id: userId,
      order_type: "subscription",
      plan_code: plan.code,
      amount_krw: plan.monthlyPriceKrw,
      status: "pending",
      provider: env.paymentProvider,
      meta_json: {
        plan_name: plan.name,
        monthly_included_reviews: plan.monthlyIncludedReviews,
      },
    })
    .select("id, amount_krw, plan_code, status")
    .single();

  if (error) throw error;
  return data;
}

export async function createCreditPackOrder(
  supabase: SupabaseClient,
  userId: string,
  packCode: CreditPackCode,
) {
  const pack = getCreditPack(packCode);
  if (!pack) throw new Error("존재하지 않는 추가 구매 상품입니다.");

  const { data, error } = await supabase
    .from("billing_orders")
    .insert({
      user_id: userId,
      order_type: "credit_pack",
      pack_code: pack.code,
      amount_krw: pack.priceKrw,
      status: "pending",
      provider: env.paymentProvider,
      meta_json: {
        credits: pack.credits,
        unit_price_krw: pack.unitPriceKrw,
      },
    })
    .select("id, amount_krw, pack_code, status")
    .single();

  if (error) throw error;
  return data;
}

export async function approveOrder(supabase: SupabaseClient, orderId: string) {
  const { data: order, error: orderError } = await supabase
    .from("billing_orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (orderError || !order) throw orderError || new Error("주문을 찾을 수 없습니다.");
  if (order.status === "paid") return order;

  if (order.order_type === "subscription") {
    const plan = getPlanDefinition(order.plan_code || "free");

    const { error } = await supabase
      .from("subscriptions")
      .upsert({
        user_id: order.user_id,
        plan: plan.code,
        status: "active",
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

    if (error) throw error;

    await ensureCreditWallet(supabase, order.user_id, plan.code);
  }

  if (order.order_type === "credit_pack") {
    const pack = getCreditPack(order.pack_code);
    if (!pack) throw new Error("추가 구매 정보를 찾을 수 없습니다.");

    const { data: wallet } = await supabase
      .from("credit_wallets")
      .select("purchased_total")
      .eq("user_id", order.user_id)
      .maybeSingle();

    const nextTotal = Number(wallet?.purchased_total ?? 0) + pack.credits;

    const { error } = await supabase
      .from("credit_wallets")
      .upsert({
        user_id: order.user_id,
        purchased_total: nextTotal,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

    if (error) throw error;

    await supabase.from("credit_ledger").insert({
      user_id: order.user_id,
      order_id: order.id,
      delta: pack.credits,
      kind: "purchase",
      memo: `${pack.label} 결제 승인`,
    });
  }

  const { error: updateError } = await supabase
    .from("billing_orders")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  if (updateError) throw updateError;

  const { data: updated } = await supabase
    .from("billing_orders")
    .select("*")
    .eq("id", orderId)
    .single();

  return updated;
}

export async function getBillingOverview(supabase: SupabaseClient) {
  const billingEnabled = await getBillingFlag(supabase);

  const { data: orders } = await supabase
    .from("billing_orders")
    .select("id, amount_krw, status, order_type, created_at, paid_at, user_id, plan_code, pack_code")
    .order("created_at", { ascending: false })
    .limit(50);

  const paidOrders = (orders || []).filter((item) => item.status === "paid");
  const pendingOrders = (orders || []).filter((item) => item.status === "pending");
  const grossSettlementKrw = paidOrders.reduce((sum, item) => sum + Number(item.amount_krw ?? 0), 0);

  const { data: wallets } = await supabase
    .from("credit_wallets")
    .select("monthly_included, monthly_used, purchased_total, purchased_used");

  const totalRemainingCredits = (wallets || []).reduce((sum, wallet) => {
    const current = calculateRemainingCredits(wallet).totalRemaining;
    return sum + current;
  }, 0);

  return {
    billingEnabled,
    summary: {
      grossSettlementKrw,
      paidCount: paidOrders.length,
      pendingCount: pendingOrders.length,
      totalRemainingCredits,
    },
    recentOrders: orders || [],
  };
}
