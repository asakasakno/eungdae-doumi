import type { GeneratedAnswer, Tone } from "@/types/app";
import { executeGeneration } from "@/lib/generation-service";
import { extractReviewsFromImage } from "@/lib/review-capture-service";
import { AppError } from "@/lib/errors";
import { getUsageSummary } from "@/lib/usage";
import { getAuthedApiContext, handleRouteError, ok } from "@/app/api/_helpers";

export const runtime = "nodejs";

const VALID_TONES = new Set(["friendly", "formal", "plain", "firm"]);
const VALID_STRATEGIES = new Set(["warm", "balanced", "principle"]);
const STRATEGY_LABEL: Record<string, string> = {
  warm: "따뜻형",
  balanced: "균형형",
  principle: "원칙형",
};

function toSafeNumber(value: FormDataEntryValue | null, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function pickSelectedAnswer(answers: GeneratedAnswer[], strategy: string) {
  const targetLabel = STRATEGY_LABEL[strategy] ?? STRATEGY_LABEL.balanced;
  return answers.find((answer) => answer.label === targetLabel) ?? answers[0];
}

export async function POST(request: Request) {
  try {
    const context = await getAuthedApiContext();
    if ("response" in context) return context.response;

    const formData = await request.formData();
    const image = formData.get("image");

    if (!(image instanceof File)) {
      throw new AppError("리뷰 캡처 이미지를 업로드하세요.", 400, "MISSING_IMAGE");
    }

    const toneValue = String(formData.get("tone") ?? context.profile.default_tone);
    if (!VALID_TONES.has(toneValue)) {
      throw new AppError("말투 값이 올바르지 않습니다.", 400, "INVALID_TONE");
    }

    const strategyValue = String(formData.get("strategy") ?? "balanced");
    if (!VALID_STRATEGIES.has(strategyValue)) {
      throw new AppError("답변 전략 값이 올바르지 않습니다.", 400, "INVALID_STRATEGY");
    }

    const fallbackRating = Math.min(Math.max(toSafeNumber(formData.get("fallback_rating"), 5), 1), 5);
    const maxReviews = Math.min(Math.max(toSafeNumber(formData.get("max_reviews"), 10), 1), 20);

    const extracted = await extractReviewsFromImage(image, maxReviews);

    if (extracted.reviews.length === 0) {
      throw new AppError("캡처 이미지에서 처리할 리뷰를 찾지 못했습니다.", 400, "NO_REVIEWS_FOUND");
    }

    const usageBefore = await getUsageSummary(context.supabase, context.user.id);
    if (usageBefore.remaining_count !== null && usageBefore.remaining_count < extracted.reviews.length) {
      throw new AppError(
        `이번 캡처에서 ${extracted.reviews.length}개 리뷰가 감지되었습니다. 현재 남은 횟수는 ${usageBefore.remaining_count}회입니다.`,
        403,
        "INSUFFICIENT_USAGE_FOR_BATCH",
      );
    }

    const items: Array<{
      index: number;
      review_text: string;
      rating: number;
      selected_answer: GeneratedAnswer;
      answers: GeneratedAnswer[];
      generation_id: string;
    }> = [];

    let latestUsage = usageBefore;

    for (const review of extracted.reviews) {
      const result = await executeGeneration(
        context.supabase,
        context.user.id,
        context.profile,
        "review",
        {
          review_text: review.text,
          rating: review.rating ?? fallbackRating,
          tone: toneValue as Tone,
        },
      );

      latestUsage = result.usage;

      items.push({
        index: review.index,
        review_text: review.text,
        rating: review.rating ?? fallbackRating,
        selected_answer: pickSelectedAnswer(result.bundle.answers, strategyValue),
        answers: result.bundle.answers,
        generation_id: result.generationId,
      });
    }

    return ok({
      items,
      extracted_count: extracted.reviews.length,
      truncated: extracted.truncated,
      usage: latestUsage,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
