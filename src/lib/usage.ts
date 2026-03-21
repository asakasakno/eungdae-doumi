import type { SupabaseClient } from "@supabase/supabase-js";
import type { UsageSummary } from "@/types/app";
import { getOrCreateSubscription } from "@/lib/auth";
import { getDailyLimit } from "@/lib/plans";
import { getKstDateString } from "@/lib/utils";
import { env } from "@/lib/env";

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
  const plan = subscription.plan;
  const date = getKstDateString();

  const { data } = await supabase
    .from("usage_logs")
    .select("count")
    .eq("user_id", userId)
    .eq("usage_date", date)
    .maybeSingle();

  const usedCount = Number(data?.count ?? 0);
  const dailyLimit = getDailyLimit(plan);
  const remainingCount = Math.max(dailyLimit - usedCount, 0);

  return {
    date,
    used_count: usedCount,
    daily_limit: dailyLimit,
    remaining_count: remainingCount,
    plan,
  };
}

export async function incrementUsageCount(supabase: SupabaseClient, userId: string) {
  const date = getKstDateString();

  const { data } = await supabase
    .from("usage_logs")
    .select("count")
    .eq("user_id", userId)
    .eq("usage_date", date)
    .maybeSingle();

  const nextCount = Number(data?.count ?? 0) + 1;

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
