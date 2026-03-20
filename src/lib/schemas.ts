import type { GeneratedBundle } from "@/types/app";

export const generationOutputSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    answers: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      description: "서로 전략이 다른 3개의 복붙용 답변",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          label: {
            type: "string",
            minLength: 2,
            maxLength: 16,
            description: "짧은 라벨. 예: 따뜻한형, 균형형, 원칙형",
          },
          text: {
            type: "string",
            minLength: 20,
            maxLength: 220,
            description: "고객에게 바로 붙여넣어 보낼 수 있는 최종 한국어 답변",
          },
          reason: {
            type: "string",
            minLength: 8,
            maxLength: 80,
            description: "이 답변이 왜 적절한지 한 문장 설명",
          },
          when_to_use: {
            type: "string",
            minLength: 4,
            maxLength: 60,
            description: "이 답변을 쓰기 좋은 상황을 짧게 설명",
          },
        },
        required: ["label", "text", "reason", "when_to_use"],
      },
    },
  },
  required: ["answers"],
} as const;

export function isGeneratedBundle(value: unknown): value is GeneratedBundle {
  if (!value || typeof value !== "object") return false;
  const answers = (value as { answers?: unknown }).answers;
  if (!Array.isArray(answers) || answers.length !== 3) return false;

  return answers.every((item) => {
    if (!item || typeof item !== "object") return false;
    const candidate = item as Record<string, unknown>;
    return (
      typeof candidate.label === "string" &&
      typeof candidate.text === "string" &&
      typeof candidate.reason === "string" &&
      typeof candidate.when_to_use === "string"
    );
  });
}
