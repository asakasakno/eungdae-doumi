import { getAuthedApiContext, handleRouteError, ok } from "@/app/api/_helpers";
import { getUsageSummary } from "@/lib/usage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const context = await getAuthedApiContext();
    if ("response" in context) return context.response;

    const usage = await getUsageSummary(context.supabase, context.user.id);

    return ok({
      usage,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
