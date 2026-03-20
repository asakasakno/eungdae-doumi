import { getAuthedApiContext, handleRouteError, ok, fail } from "@/app/api/_helpers";
import type { BusinessType, Tone } from "@/types/app";
import { normalizeBrandName } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const allowedBusinessTypes: BusinessType[] = ["smartstore", "delivery", "cafe", "offline", "etc"];
const allowedTones: Tone[] = ["friendly", "formal", "plain", "firm"];

export async function GET() {
  try {
    const context = await getAuthedApiContext();
    if ("response" in context) return context.response;

    return ok({
      profile: context.profile,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const context = await getAuthedApiContext();
    if ("response" in context) return context.response;

    const body = await request.json();

    const businessType = String(body.business_type ?? "").trim() as BusinessType;
    const defaultTone = String(body.default_tone ?? "").trim() as Tone;
    const brandName = normalizeBrandName(String(body.brand_name ?? ""));

    if (!allowedBusinessTypes.includes(businessType)) {
      return fail("업종 값이 올바르지 않습니다.", 400, "INVALID_BUSINESS_TYPE");
    }

    if (!allowedTones.includes(defaultTone)) {
      return fail("말투 값이 올바르지 않습니다.", 400, "INVALID_TONE");
    }

    const { data, error } = await context.supabase
      .from("profiles")
      .upsert(
        {
          user_id: context.user.id,
          business_type: businessType,
          brand_name: brandName,
          default_tone: defaultTone,
        },
        { onConflict: "user_id" },
      )
      .select("*")
      .single();

    if (error) {
      return fail("프로필 저장에 실패했습니다.", 500, "PROFILE_SAVE_FAILED");
    }

    return ok({
      message: "프로필이 저장되었습니다.",
      profile: data,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
