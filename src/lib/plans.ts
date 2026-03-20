import { env } from "@/lib/env";
import type { AppSubscription, Plan } from "@/types/app";

export function getDailyLimit(plan: Plan) {
  return plan === "pro" ? env.proDailyLimit : env.freeDailyLimit;
}

export function getPlanLabel(plan: Plan) {
  return plan === "pro" ? "프로" : "무료";
}

export function isSubscriptionActive(subscription: AppSubscription | null | undefined) {
  if (!subscription) return false;
  if (!["active", "trialing"].includes(subscription.status)) return false;
  if (!subscription.expires_at) return true;
  return new Date(subscription.expires_at).getTime() > Date.now();
}
