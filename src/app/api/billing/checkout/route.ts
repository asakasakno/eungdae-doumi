import { env } from "@/lib/env";
import { getAuthedApiContext, fail, handleRouteError } from "@/app/api/_helpers";

export const runtime = "nodejs";

export async function POST() {
  try {
    const context = await getAuthedApiContext();
    if ("response" in context) return context.response;

    if (!env.enableBilling) {
      return fail(
        "현재 예제 코드에는 실제 결제 연동이 꺼져 있습니다. README_KO.md의 '결제 붙이기' 섹션을 따라 결제사와 웹훅을 연결하세요.",
        501,
        "BILLING_NOT_ENABLED",
      );
    }

    return fail(
      "결제 세션 생성 로직은 아직 구현되지 않았습니다. checkout route에 실제 결제사 SDK 연동을 추가하세요.",
      501,
      "BILLING_NOT_IMPLEMENTED",
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
