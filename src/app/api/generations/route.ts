import { getAuthedApiContext, handleRouteError, ok } from "@/app/api/_helpers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const context = await getAuthedApiContext();
    if ("response" in context) return context.response;

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const page = Number(searchParams.get("page") ?? "1");
    const limit = Math.min(Number(searchParams.get("limit") ?? "20"), 50);
    const from = (Math.max(page, 1) - 1) * limit;
    const to = from + limit - 1;

    let query = context.supabase
      .from("generations")
      .select("*", { count: "exact" })
      .eq("user_id", context.user.id)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (type && ["review", "inquiry", "complaint"].includes(type)) {
      query = query.eq("type", type);
    }

    const { data, count, error } = await query;

    if (error) {
      throw error;
    }

    return ok({
      items: data ?? [],
      page: Math.max(page, 1),
      total: count ?? 0,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
