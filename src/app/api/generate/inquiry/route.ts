import { executeGeneration } from "@/lib/generation-service";
import { getAuthedApiContext, handleRouteError, ok } from "@/app/api/_helpers";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const context = await getAuthedApiContext();
    if ("response" in context) return context.response;

    const body = await request.json();

    const result = await executeGeneration(
      context.supabase,
      context.user.id,
      context.profile,
      "inquiry",
      body,
    );

    return ok({
      generation_id: result.generationId,
      results: result.bundle.answers,
      usage: result.usage,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
