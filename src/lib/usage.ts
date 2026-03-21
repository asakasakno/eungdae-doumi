import type { SupabaseClient } from "@supabase/supabase-js";
import type { UsageSummary } from "@/types/app";
import { getOrCreateSubscription } from "@/lib/auth";
import { getKstDateString } from "@/lib/utils";
import { env } from "@/lib/env";
import { calculateRemainingCredits, consumeReviewCredits, ensureCreditWallet } from "@/lib/billing";
import { getPlanDefinition } from "@/lib/plans";

export async function getUsageSummary(supabase: SupabaseClient, userId: string): Promise<UsageSummary> {
  const { data: authData } = await supabase.auth.getUser();
  const email = authData.user?.email?.toLowerCase() || "";

  if (env.adminEmails.includes(email)) {
    return {
      date: getKstDateString(),
      used_count: 0,
      daily_limit: 999999,
      remaining_count: 999999,
      plan: "pro",
    };
  }

  const subscription = await getOrCreateSubscription(supabase, userId);
  const plan = subscription.plan || "free";
  const wallet = await ensureCreditWallet(supabase, userId, plan);
  const remaining = calculateRemainingCredits(wallet);
  const totalQuota = Number(wallet.monthly_included ?? 0) + Number(wallet.purchased_total ?? 0);
  const totalUsed = Number(wallet.monthly_used ?? 0) + Number(wallet.purchased_used ?? 0);

  return {
    date: getKstDateString(),
    used_count: totalUsed,
    daily_limit: totalQuota,
    remaining_count: remaining.totalRemaining,
    plan,
  };
}

export async function incrementUsageCount(supabase: SupabaseClient, userId: string) {
  return incrementUsageCountBy(supabase, userId, 1);
}

export async function incrementUsageCountBy(supabase: SupabaseClient, userId: string, count: number) {
  const { data: authData } = await supabase.auth.getUser();
  const email = authData.user?.email?.toLowerCase() || "";
  const date = getKstDateString();

  if (!env.adminEmails.includes(email)) {
    const subscription = await getOrCreateSubscription(supabase, userId);
    await consumeReviewCredits(supabase, userId, count, subscription.plan || "free");
  }

  const { data } = await supabase
    .from("usage_logs")
    .select("count")
    .eq("user_id", userId)
    .eq("usage_date", date)
    .maybeSingle();

  const nextCount = Number(data?.count ?? 0) + count;

  await supabase.from("usage_logs").upsert(
    {
      user_id: userId,
      usage_date: date,
      count: nextCount,
    },
    { onConflict: "user_id,usage_date" },
  );

  return nextCount;
}

export async function getBatchCaptureLimit(supabase: SupabaseClient, userId: string) {
  const { data: authData } = await supabase.auth.getUser();
  const email = authData.user?.email?.toLowerCase() || "";
  if (env.adminEmails.includes(email)) return 999;

  const subscription = await getOrCreateSubscription(supabase, userId);
  const definition = getPlanDefinition(subscription.plan || "free");
  return definition.captureBatchLimit;
}
