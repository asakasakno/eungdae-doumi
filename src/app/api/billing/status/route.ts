import { env } from "@/lib/env";
import { getAuthedApiContext, handleRouteError, ok } from "@/app/api/_helpers";
import { getOrCreateSubscription } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const context = await getAuthedApiContext();
    if ("response" in context) return context.response;

    const subscription = await getOrCreateSubscription(context.supabase, context.user.id);

    return ok({
      enabled: env.enableBilling,
      plan: subscription.plan,
      status: subscription.status,
      expires_at: subscription.expires_at,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
