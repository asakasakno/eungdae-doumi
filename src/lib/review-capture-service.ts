import { AppError } from "@/lib/errors";
import { env } from "@/lib/env";
import { getOpenAIClient } from "@/lib/openai";

const MAX_FILE_SIZE_BYTES = 6 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

export interface ExtractedReviewItem {
  index: number;
  text: string;
  rating: number | null;
}

export interface ExtractedReviewPayload {
  reviews: ExtractedReviewItem[];
  truncated: boolean;
}

function extractJsonText(rawText: string) {
  const trimmed = rawText.trim();
  const withoutFence = trimmed
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  if (withoutFence.startsWith("{") && withoutFence.endsWith("}")) {
    return withoutFence;
  }

  const start = withoutFence.indexOf("{");
  const end = withoutFence.lastIndexOf("}");

  if (start >= 0 && end > start) {
    return withoutFence.slice(start, end + 1);
  }

  return withoutFence;
}

function normalizeRating(value: unknown): number | null {
  const rating = Number(value);
  return Number.isInteger(rating) && rating >= 1 && rating <= 5 ? rating : null;
}

function normalizeReviewText(value: unknown) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseExtractedReviews(rawText: string, maxReviews: number): ExtractedReviewPayload {
  let parsed: unknown;

  try {
    parsed = JSON.parse(extractJsonText(rawText));
  } catch {
    throw new AppError("리뷰 캡처를 분석했지만 JSON 결과를 읽지 못했습니다.", 502, "INVALID_CAPTURE_JSON");
  }

  if (!parsed || typeof parsed !== "object" || !Array.isArray((parsed as { reviews?: unknown[] }).reviews)) {
    throw new AppError("리뷰 캡처 분석 결과 구조가 올바르지 않습니다.", 502, "INVALID_CAPTURE_SCHEMA");
  }

  const rawReviews = (parsed as { reviews: Array<Record<string, unknown>> }).reviews;
  const normalized = rawReviews
    .map((item, index) => ({
      index: index + 1,
      text: normalizeReviewText(item?.text),
      rating: normalizeRating(item?.rating),
    }))
    .filter((item) => item.text.length > 0);

  return {
    reviews: normalized.slice(0, maxReviews),
    truncated: normalized.length > maxReviews,
  };
}

function getVisionModel() {
  return env.openAIModel.startsWith("gpt-4o") ? env.openAIModel : "gpt-4o-mini";
}

export async function extractReviewsFromImage(file: File, maxReviews: number): Promise<ExtractedReviewPayload> {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new AppError("PNG, JPG, WEBP 이미지 파일만 업로드할 수 있습니다.", 400, "UNSUPPORTED_IMAGE_TYPE");
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new AppError("이미지 파일은 6MB 이하만 업로드할 수 있습니다.", 400, "IMAGE_TOO_LARGE");
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const dataUrl = `data:${file.type};base64,${bytes.toString("base64")}`;

  const instruction = [
    "이미지는 쇼핑몰 관리자용 리뷰 목록 캡처일 수 있다.",
    "보이는 고객 리뷰만 위에서 아래 순서대로 추출하라.",
    "판매자 답글, 버튼, 날짜, 닉네임, 주문번호, 상품 옵션, 통계, UI 문구는 모두 무시하라.",
    "한 리뷰가 여러 줄이면 자연스럽게 한 줄 문장으로 합쳐라.",
    "별점이 명확히 보이면 1~5 정수로 넣고, 보이지 않으면 null로 둬라.",
    `최대 ${maxReviews}개까지만 반환하라.`,
    "설명 없이 JSON만 반환하라.",
    '{"reviews":[{"text":"배송이 빠르고 포장도 깔끔해요","rating":5}]}'
  ].join(" ");

  const response = await getOpenAIClient().responses.create({
    model: getVisionModel(),
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: instruction,
          },
          {
            type: "input_image",
            image_url: dataUrl,
            detail: "high",
          },
        ],
      },
    ],
    max_output_tokens: 1200,
  });

  if (response.status === "incomplete") {
    throw new AppError("리뷰 캡처 분석이 중간에 끊겼습니다. 다시 시도해 주세요.", 502, "CAPTURE_INCOMPLETE");
  }

  const rawText = String(response.output_text ?? "").trim();

  if (!rawText) {
    throw new AppError("리뷰 캡처 분석 결과가 비어 있습니다.", 502, "EMPTY_CAPTURE_OUTPUT");
  }

  return parseExtractedReviews(rawText, maxReviews);
}
