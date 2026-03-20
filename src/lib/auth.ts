import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppProfile, AppSubscription } from "@/types/app";
import { createClient } from "@/lib/supabase/server";

export async function getCurrentUserContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user };
}

export async function requireUserPage() {
  const { supabase, user } = await getCurrentUserContext();

  if (!user) {
    redirect("/login");
  }

  return { supabase, user };
}

export async function getOrCreateProfile(supabase: SupabaseClient, userId: string): Promise<AppProfile> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (!error && data) {
    return data as AppProfile;
  }

  const fallback = {
    user_id: userId,
    business_type: null,
    brand_name: null,
    default_tone: "formal",
  };

  const { data: inserted } = await supabase
    .from("profiles")
    .upsert(fallback, { onConflict: "user_id" })
    .select("*")
    .single();

  return (inserted as AppProfile) ?? (fallback as AppProfile);
}

export async function getOrCreateSubscription(
  supabase: SupabaseClient,
  userId: string,
): Promise<AppSubscription> {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (!error && data) {
    return data as AppSubscription;
  }

  const fallback = {
    user_id: userId,
    plan: "free",
    status: "active",
    started_at: new Date().toISOString(),
    expires_at: null,
    payment_provider: null,
    provider_subscription_id: null,
  };

  const { data: inserted } = await supabase
    .from("subscriptions")
    .upsert(fallback, { onConflict: "user_id" })
    .select("*")
    .single();

  return (inserted as AppSubscription) ?? (fallback as AppSubscription);
}

export function isProfileComplete(profile: AppProfile) {
  return Boolean(profile.business_type);
}

export function getRedirectAfterLogin(profile: AppProfile) {
  return isProfileComplete(profile) ? "/dashboard" : "/onboarding";
}
