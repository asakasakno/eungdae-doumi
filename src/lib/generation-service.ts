import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AppProfile,
  ComplaintPayload,
  GeneratedBundle,
  GenerationType,
  InquiryPayload,
  ReviewPayload,
} from "@/types/app";
import { AppError } from "@/lib/errors";
import { env } from "@/lib/env";
import { getOpenAIClient } from "@/lib/openai";
import { buildInput, buildInstructions, buildPromptCacheKey } from "@/lib/prompts";
import { generationOutputSchema, isGeneratedBundle } from "@/lib/schemas";
import { incrementUsageCount, getUsageSummary } from "@/lib/usage";
import { normalizeBrandName, shouldUseReasoning } from "@/lib/utils";

function assertReviewPayload(value: unknown): ReviewPayload {
  if (!value || typeof value !== "object") {
    throw new AppError("리뷰 입력값이 올바르지 않습니다.", 400, "INVALID_PAYLOAD");
  }

  const payload = value as Record<string, unknown>;
  const reviewText = String(payload.review_text ?? "").trim();
  const rating = Number(payload.rating);

  if (!reviewText) {
    throw new AppError("리뷰 내용을 입력하세요.", 400, "MISSING_REVIEW_TEXT");
  }

  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    throw new AppError("별점은 1~5 사이여야 합니다.", 400, "INVALID_RATING");
  }

  return {
    review_text: reviewText,
    rating,
    tone: payload.tone ? (String(payload.tone) as ReviewPayload["tone"]) : undefined,
  };
}

function assertInquiryPayload(value: unknown): InquiryPayload {
  if (!value || typeof value !== "object") {
    throw new AppError("문의 입력값이 올바르지 않습니다.", 400, "INVALID_PAYLOAD");
  }

  const payload = value as Record<string, unknown>;
  const inquiryText = String(payload.inquiry_text ?? "").trim();
  const category = String(payload.category ?? "").trim() as InquiryPayload["category"];

  if (!inquiryText) {
    throw new AppError("문의 내용을 입력하세요.", 400, "MISSING_INQUIRY_TEXT");
  }

  const allowed = ["delivery", "restock", "exchange_refund", "product_detail", "order_change", "etc"];
  if (!allowed.includes(category)) {
    throw new AppError("문의 유형이 올바르지 않습니다.", 400, "INVALID_CATEGORY");
  }

  return {
    inquiry_text: inquiryText,
    category,
    tone: payload.tone ? (String(payload.tone) as InquiryPayload["tone"]) : undefined,
  };
}

function assertComplaintPayload(value: unknown): ComplaintPayload {
  if (!value || typeof value !== "object") {
    throw new AppError("클레임 입력값이 올바르지 않습니다.", 400, "INVALID_PAYLOAD");
  }

  const payload = value as Record<string, unknown>;
  const complaintText = String(payload.complaint_text ?? "").trim();
  const liability = String(payload.liability ?? "").trim() as ComplaintPayload["liability"];
  const compensation = String(payload.compensation ?? "").trim() as ComplaintPayload["compensation"];

  if (!complaintText) {
    throw new AppError("클레임 내용을 입력하세요.", 400, "MISSING_COMPLAINT_TEXT");
  }

  if (!["none", "partial", "full"].includes(liability)) {
    throw new AppError("책임 여부 값이 올바르지 않습니다.", 400, "INVALID_LIABILITY");
  }

  if (!["refund_possible", "exchange_possible", "partial_compensation", "difficult"].includes(compensation)) {
    throw new AppError("보상 가능 여부 값이 올바르지 않습니다.", 400, "INVALID_COMPENSATION");
  }

  return {
    complaint_text: complaintText,
    liability,
    compensation,
    tone: payload.tone ? (String(payload.tone) as ComplaintPayload["tone"]) : undefined,
  };
}

function validatePayload(type: "review", payload: unknown): ReviewPayload;
function validatePayload(type: "inquiry", payload: unknown): InquiryPayload;
function validatePayload(type: "complaint", payload: unknown): ComplaintPayload;
function validatePayload(type: GenerationType, payload: unknown) {
  if (type === "review") return assertReviewPayload(payload);
  if (type === "inquiry") return assertInquiryPayload(payload);
  return assertComplaintPayload(payload);
}

function parseGeneratedBundle(rawText: string): GeneratedBundle {
  let parsed: unknown;

  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new AppError("모델 응답을 JSON으로 해석하지 못했습니다.", 500, "INVALID_MODEL_JSON");
  }

  if (!isGeneratedBundle(parsed)) {
    throw new AppError("모델 응답 구조가 예상과 다릅니다.", 500, "INVALID_MODEL_SCHEMA");
  }

  return parsed;
}

function normalizeForCompare(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function jaccardSimilarity(a: string, b: string) {
  const aTokens = new Set(normalizeForCompare(a).split(" ").filter(Boolean));
  const bTokens = new Set(normalizeForCompare(b).split(" ").filter(Boolean));

  if (aTokens.size === 0 || bTokens.size === 0) return 0;

  let intersection = 0;
  for (const token of aTokens) {
    if (bTokens.has(token)) intersection += 1;
  }

  const union = new Set([...aTokens, ...bTokens]).size;
  return union === 0 ? 0 : intersection / union;
}

function areTooSimilar(a: string, b: string) {
  const normalizedA = normalizeForCompare(a);
  const normalizedB = normalizeForCompare(b);

  if (!normalizedA || !normalizedB) return true;
  if (normalizedA === normalizedB) return true;
  if (normalizedA.slice(0, 18) === normalizedB.slice(0, 18)) return true;
  return jaccardSimilarity(a, b) >= 0.72;
}

function getBundleQualityIssues(bundle: GeneratedBundle) {
  const issues: string[] = [];
  const labels = bundle.answers.map((answer) => normalizeForCompare(answer.label));
  const texts = bundle.answers.map((answer) => answer.text.trim());

  if (new Set(labels).size < labels.length) {
    issues.push("라벨이 중복됨");
  }

  if (new Set(texts.map(normalizeForCompare)).size < texts.length) {
    issues.push("답변 문장이 사실상 동일함");
  }

  for (let i = 0; i < texts.length; i += 1) {
    for (let j = i + 1; j < texts.length; j += 1) {
      if (areTooSimilar(texts[i], texts[j])) {
        issues.push(`답변 ${i + 1}과 답변 ${j + 1}이 지나치게 유사함`);
      }
    }
  }

  return [...new Set(issues)];
}

async function callModel(
  type: GenerationType,
  profile: AppProfile,
  userId: string,
  payload: ReviewPayload | InquiryPayload | ComplaintPayload,
  retryDirective?: string,
): Promise<GeneratedBundle> {
  const openai = getOpenAIClient();
  const model = env.openAIModel;

  const response = await openai.responses.create({
  model,
  instructions: buildInstructions(type, retryDirective),
  input: buildInput(type, profile, payload as never),
  max_output_tokens: 700,
});

  if (response.status === "incomplete") {
    throw new AppError("모델 응답이 중간에 끊겼습니다. 다시 시도해 주세요.", 502, "MODEL_INCOMPLETE");
  }

  const primaryOutput = response.output?.[0]?.content?.[0];
  if (primaryOutput && primaryOutput.type === "refusal") {
    throw new AppError("모델이 요청을 거절했습니다. 입력 내용을 조금 바꿔 다시 시도해 주세요.", 400, "MODEL_REFUSAL");
  }

  const rawText = String(response.output_text ?? "").trim();

if (!rawText) {
  throw new AppError("모델이 비어 있는 응답을 반환했습니다.", 502, "EMPTY_MODEL_OUTPUT");
}

let parsed: unknown;

try {
  parsed = JSON.parse(rawText);
} catch {
  throw new AppError(
    `모델 응답을 JSON으로 해석하지 못했습니다. 원문: ${rawText}`,
    500,
    "INVALID_MODEL_JSON"
  );
}

if (!isGeneratedBundle(parsed)) {
  throw new AppError(
    `모델 응답 구조가 예상과 다릅니다. 원문: ${rawText}`,
    500,
    "INVALID_MODEL_SCHEMA"
  );
}

return parsed;
}

async function generateBundleWithQualityGuard(
  type: GenerationType,
  profile: AppProfile,
  userId: string,
  payload: ReviewPayload | InquiryPayload | ComplaintPayload,
) {
  const firstBundle = await callModel(type, profile, userId, payload);
  const firstIssues = getBundleQualityIssues(firstBundle);

  if (firstIssues.length === 0) {
    return firstBundle;
  }

  const retryDirective = `직전 결과 품질 이슈: ${firstIssues.join(", ")}. 세 답변을 전략적으로 더 분리하고, 첫 문장과 정보 배열이 겹치지 않게 다시 작성하라.`;

  const secondBundle = await callModel(type, profile, userId, payload, retryDirective);
  return secondBundle;
}

export async function executeGeneration(
  supabase: SupabaseClient,
  userId: string,
  profile: AppProfile,
  type: GenerationType,
  rawPayload: unknown,
) {
  const usage = await getUsageSummary(supabase, userId);

  if (usage.daily_limit !== null && usage.used_count >= usage.daily_limit) {
    throw new AppError("오늘 사용 가능한 생성 횟수를 모두 사용했습니다.", 403, "DAILY_LIMIT_EXCEEDED");
  }

  const payload = validatePayload(type as never, rawPayload as never) as
    | ReviewPayload
    | InquiryPayload
    | ComplaintPayload;

  const normalizedProfile: AppProfile = {
    ...profile,
    brand_name: normalizeBrandName(profile.brand_name),
  };

  const bundle = await generateBundleWithQualityGuard(type, normalizedProfile, userId, payload);

  const outputs = bundle.answers.map((answer) => answer.text);

  const { data: inserted, error } = await supabase
    .from("generations")
    .insert({
      user_id: userId,
      type,
      input_text:
        type === "review"
          ? (payload as ReviewPayload).review_text
          : type === "inquiry"
            ? (payload as InquiryPayload).inquiry_text
            : (payload as ComplaintPayload).complaint_text,
      options_json: {
        ...payload,
        answer_meta: bundle.answers.map(({ label, reason, when_to_use }) => ({
          label,
          reason,
          when_to_use,
        })),
      },
      output_1: outputs[0],
      output_2: outputs[1],
      output_3: outputs[2],
    })
    .select("id")
    .single();

  if (error) {
    throw new AppError("생성 결과를 저장하지 못했습니다.", 500, "SAVE_FAILED");
  }

  await incrementUsageCount(supabase, userId);
  const updatedUsage = await getUsageSummary(supabase, userId);

  return {
    generationId: inserted?.id as string,
    bundle,
    usage: updatedUsage,
  };
}
