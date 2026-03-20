import type {
  AppProfile,
  ComplaintPayload,
  GenerationType,
  InquiryPayload,
  ReviewPayload,
} from "@/types/app";

type SupportedPayload = ReviewPayload | InquiryPayload | ComplaintPayload;

function clean(value?: string | null) {
  return String(value ?? "").trim();
}

function businessTypeLabel(value?: string | null) {
  const normalized = clean(value);
  if (!normalized) return "미설정";

  const map: Record<string, string> = {
    smartstore: "스마트스토어",
    delivery: "배달",
    cafe: "카페",
    offline: "오프라인 매장",
    retail: "소매점",
  };

  return map[normalized] ?? normalized;
}

function toneLabel(value?: string | null) {
  const normalized = clean(value);
  if (!normalized) return "기본";

  const map: Record<string, string> = {
    friendly: "친절형",
    formal: "정중형",
    concise: "담백형",
    firm: "단호형",
    warm: "따뜻형",
    balanced: "균형형",
    principle: "원칙형",
  };

  return map[normalized] ?? normalized;
}

function escapeBlock(value: string) {
  return value.replace(/```/g, "'''").trim();
}

function buildCommonInstructions() {
  return [
    "너는 한국어 고객응대 문장 작성 전문가다.",
    "목표는 자영업자/판매자가 고객에게 바로 복붙해서 보낼 수 있는 자연스러운 문장을 만드는 것이다.",
    "항상 존댓말을 사용한다.",
    "JSON 외 텍스트를 절대 출력하지 않는다.",
    "답변은 실제 사람이 쓴 것처럼 자연스럽고 매끄러워야 한다.",
    "과장, 허세, 광고 문구, 오글거리는 표현을 금지한다.",
    "'앞으로도 노력하겠습니다', '만족스러운 경험', '최선을 다하겠습니다' 같은 상투 문구를 남발하지 않는다.",
    "브랜드명은 꼭 필요할 때만 0~1회 자연스럽게 넣는다. 억지로 반복하지 않는다.",
    "각 답변은 첫 문장 구조, 정보 순서, 마무리 방식이 명확히 달라야 한다.",
    "세 답변은 말만 다른 버전이 아니라 전략이 실제로 달라야 한다.",
    "답변 1은 감정/인상 중심, 답변 2는 가장 무난한 실무형, 답변 3은 짧고 기준 있는 마무리형으로 작성한다.",
    "세 답변 모두 고객 입장에서 읽어도 어색하지 않아야 하며, 판매자가 바로 쓰기 편해야 한다.",
    "사실이 확인되지 않은 내용은 단정하지 않는다.",
    "고객 탓으로 돌리거나 방어적으로 들리는 표현을 금지한다.",
    "문장 길이는 불필요하게 길지 않게 유지한다.",
    "출력 JSON 스키마의 answers는 반드시 3개다.",
    "각 answer.label은 각각 '따뜻형', '균형형', '원칙형'만 사용한다.",
    "각 answer.reason은 내부 의도를 설명하는 한 문장으로 짧게 작성한다.",
    "각 answer.when_to_use는 그 버전을 언제 쓰면 좋은지 짧게 작성한다.",
  ].join("\n");
}

function buildReviewInstructions() {
  return [
    "[리뷰 답변 규칙]",
    "리뷰 답변은 60~110자 정도를 우선 목표로 한다.",
    "리뷰에 언급된 만족 포인트를 구체적으로 반영한다. 예: 빠른 배송, 포장, 맛, 상태, 친절함.",
    "좋은 리뷰라고 해서 과하게 들뜨지 않는다.",
    "리뷰 내용을 그대로 복사한 수준으로 반복하지 않는다.",
    "답변 1(따뜻형): 고객의 만족 포인트를 부드럽게 받아주고 기분 좋은 인상을 남긴다.",
    "답변 2(균형형): 가장 무난하고 실무적으로 쓰기 좋은 기본형이다.",
    "답변 3(원칙형): 짧고 깔끔하게 마무리하며 기준 있는 인상을 준다.",
    "리뷰가 1~3점이면 사과/개선 의지를 먼저 두고, 변명이나 방어적 태도를 금지한다.",
    "'소중한', '정성스러운' 같은 표현은 필요할 때만 제한적으로 사용한다.",
    "부정 리뷰에서 '오해', '착오', '규정상'만 앞세우지 않는다.",
    "재구매 유도 문구는 억지스럽지 않을 때만 짧게 넣는다.",
    "아래 같은 흔한 표현은 피한다: '앞으로도 더 좋은 서비스로 보답하겠습니다', '항상 최선을 다하겠습니다'.",
    "같은 감사 표현으로 세 답변을 시작하지 않는다.",
    "세 답변은 문장 구조와 시작 문장이 겹치지 않도록 작성하라",
    "리뷰에서 언급된 요소를 더 구체적으로 확장하라",
    "예시 전략 차이:",
    "- 따뜻형: 만족 포인트를 감정적으로 받아주기",
    "- 균형형: 감사 + 핵심 포인트 + 안정적 마무리",
    "- 원칙형: 짧고 담백하게 신뢰감 있게 마무리",
  ].join("\n");
}

function buildInquiryInstructions() {
  return [
    "[문의 답변 규칙]",
    "문의 답변은 45~100자 정도를 우선 목표로 한다.",
    "핵심 정보가 먼저 보여야 한다.",
    "답변 1(따뜻형): 정중하고 부드럽게 응답한다.",
    "답변 2(균형형): 가장 표준적인 안내형으로 작성한다.",
    "답변 3(원칙형): 짧고 분명하게 기준 중심으로 안내한다.",
    "재입고, 배송, 교환/환불, 옵션 변경, 상품 상세 등 문의 카테고리에 맞게 문장을 조정한다.",
    "확인 중인 내용은 '확인 중'이라고만 말하고 확정 표현을 쓰지 않는다.",
    "답변이 지나치게 길어지면 현업에서 안 쓰므로 짧게 쓴다.",
    "문의자가 불편하지 않도록 정중함은 유지하되 군더더기는 줄인다.",
    "세 답변이 같은 순서로 정보 전달하지 않도록 한다.",
  ].join("\n");
}

function buildComplaintInstructions() {
  return [
    "[클레임 대응 규칙]",
    "클레임 답변은 70~130자 정도를 우선 목표로 한다.",
    "감정 완화가 먼저다. 단, 법적 책임을 성급히 인정하지 않는다.",
    "답변 1(따뜻형): 불편감 공감과 진정성 있는 사과를 먼저 둔다.",
    "답변 2(균형형): 공감 + 현재 조치/안내를 가장 실무적으로 담는다.",
    "답변 3(원칙형): 과장 없이 짧고 분명하게 처리 기준을 말한다.",
    "고객 탓, 오해, 변명처럼 들리는 표현을 금지한다.",
    "책임이 일부/불명확한 경우에도 상대 감정을 거스르지 않게 표현한다.",
    "교환 가능, 환불 가능, 부분 보상 가능, 보상 어려움 여부를 반영한다.",
    "'규정상 불가합니다'처럼 차갑게 끊지 말고 예의 있는 설명으로 마무리한다.",
    "세 답변이 모두 똑같이 사과만 반복하지 않도록 한다.",
  ].join("\n");
}

function buildFewShotExamples(type: GenerationType) {
  if (type === "review") {
    return [
      "[좋은 리뷰 답변 예시]",
      "입력: 배송이 빠르고 포장도 깔끔해서 만족했어요 / 5점",
      "따뜻형 예시: 빠른 배송과 꼼꼼한 포장까지 만족하셨다니 정말 기쁩니다. 기분 좋게 받아보셨다니 저희도 보람을 느낍니다.",
      "균형형 예시: 좋은 리뷰 감사합니다. 배송과 포장 상태 모두 만족하셨다니 다행입니다. 다음에도 깔끔하게 받아보실 수 있게 준비하겠습니다.",
      "원칙형 예시: 후기 감사합니다. 빠른 배송과 깔끔한 상태로 만족을 드릴 수 있어 다행입니다. 다음 주문도 안정적으로 준비하겠습니다.",
      "입력: 상품은 좋은데 생각보다 배송이 늦었어요 / 3점",
      "따뜻형 예시: 기다리게 해드려 죄송합니다. 상품은 괜찮게 보셨다니 다행이고, 배송 부분은 더 신경 써서 불편을 줄이겠습니다.",
      "균형형 예시: 리뷰 남겨주셔서 감사합니다. 배송이 늦어 불편하셨을 텐데 너그럽게 말씀 주셔서 감사합니다. 이후에는 더 빠르게 받아보실 수 있게 챙기겠습니다.",
      "원칙형 예시: 배송 지연으로 불편을 드려 죄송합니다. 상품 만족도와 별개로 배송 과정은 더 안정적으로 관리하겠습니다.",
    ].join("\n");
  }

  if (type === "inquiry") {
    return [
      "[좋은 문의 답변 예시]",
      "입력: 이 상품 재입고 언제 되나요? / restock",
      "따뜻형 예시: 문의 감사합니다. 현재 재입고 일정을 확인 중이며, 일정이 정리되는 대로 바로 안내드리겠습니다.",
      "균형형 예시: 문의 주신 상품은 현재 재입고 일정 확인 중입니다. 확정되는 내용이 있으면 빠르게 안내드리겠습니다.",
      "원칙형 예시: 해당 상품은 재입고 일정 확인 중입니다. 일정 확정 후 순차적으로 안내드리겠습니다.",
      "입력: 오늘 출고되나요? / delivery",
      "따뜻형 예시: 문의 감사합니다. 출고 여부는 주문 순서와 마감 시간 기준으로 확인 후 안내드리겠습니다.",
      "균형형 예시: 오늘 출고 가능 여부는 주문 상태 확인 후 정확히 안내드리겠습니다.",
      "원칙형 예시: 출고 가능 여부는 주문 상태 확인 후 안내 가능합니다.",
    ].join("\n");
  }

  return [
    "[좋은 클레임 대응 예시]",
    "입력: 포장이 찌그러져서 왔어요 / partial / exchange_possible",
    "따뜻형 예시: 받아보시는 과정에서 불편을 드려 죄송합니다. 포장 상태로 기분 상하셨을 텐데, 교환 가능 여부와 절차를 바로 안내드리겠습니다.",
    "균형형 예시: 포장 상태로 불편을 드려 죄송합니다. 현재 교환 가능 기준에 따라 빠르게 확인 후 안내드리겠습니다.",
    "원칙형 예시: 포장 문제로 불편을 드려 죄송합니다. 확인 후 교환 가능 절차 기준으로 안내드리겠습니다.",
    "입력: 생각보다 너무 늦게 와서 필요할 때 못 썼어요 / partial / partial_compensation",
    "따뜻형 예시: 필요한 시점에 사용하지 못하셨다니 정말 불편하셨을 것 같습니다. 상황 확인 후 가능한 보상 방향을 함께 안내드리겠습니다.",
    "균형형 예시: 배송 지연으로 사용 시점에 차질을 드려 죄송합니다. 확인 후 가능한 처리 방향을 안내드리겠습니다.",
    "원칙형 예시: 배송 지연으로 불편을 드려 죄송합니다. 주문 및 배송 내역 확인 후 처리 기준에 맞게 안내드리겠습니다.",
  ].join("\n");
}

export function buildInstructions(type: GenerationType, retryDirective?: string) {
  const sections = [buildCommonInstructions()];

  if (type === "review") sections.push(buildReviewInstructions());
  if (type === "inquiry") sections.push(buildInquiryInstructions());
  if (type === "complaint") sections.push(buildComplaintInstructions());

  sections.push(buildFewShotExamples(type));

  sections.push(
    [
      "[출력 스키마 의도]",
      "answers[0]은 따뜻형, answers[1]은 균형형, answers[2]는 원칙형으로 고정한다.",
      "세 답변은 서로 시작 문장, 핵심 포인트 배치, 마무리 톤이 달라야 한다.",
      "label / when_to_use / reason / text 모두 빈 값 없이 채운다.",
      "text는 현업 복붙용 문장만 넣는다.",
    ].join("\n"),
  );

  if (retryDirective) {
    sections.push(`[재작성 지시]\n${retryDirective}`);
  }

  return sections.join("\n\n");
}

function buildProfileBlock(profile: AppProfile) {
  return [
    "[판매자 프로필]",
    `업종: ${businessTypeLabel(profile.business_type)}`,
    `브랜드명: ${clean(profile.brand_name) || "미사용"}`,
    `기본 말투: ${toneLabel(profile.default_tone)}`,
  ].join("\n");
}

function buildReviewInput(profile: AppProfile, payload: ReviewPayload) {
  return [
    buildProfileBlock(profile),
    "[현재 요청]",
    `요청 말투: ${toneLabel(payload.tone || profile.default_tone)}`,
    `별점: ${payload.rating}점`,
    `리뷰 내용: ${escapeBlock(payload.review_text)}`,
    "중요 포인트: 리뷰에 언급된 만족/불만 포인트를 답변에 자연스럽게 녹여라.",
  ].join("\n\n");
}

function inquiryCategoryLabel(category: InquiryPayload["category"]) {
  const map: Record<InquiryPayload["category"], string> = {
    delivery: "배송 문의",
    restock: "재입고 문의",
    exchange_refund: "교환/환불 문의",
    product_detail: "상품 상세 문의",
    order_change: "주문 변경 문의",
    etc: "기타 문의",
  };

  return map[category] ?? category;
}

function buildInquiryInput(profile: AppProfile, payload: InquiryPayload) {
  return [
    buildProfileBlock(profile),
    "[현재 요청]",
    `요청 말투: ${toneLabel(payload.tone || profile.default_tone)}`,
    `문의 유형: ${inquiryCategoryLabel(payload.category)}`,
    `문의 내용: ${escapeBlock(payload.inquiry_text)}`,
    "중요 포인트: 확정되지 않은 것은 확인 중이라고 말하고, 고객이 바로 이해할 수 있게 핵심부터 답하라.",
  ].join("\n\n");
}

function complaintLiabilityLabel(liability: ComplaintPayload["liability"]) {
  const map: Record<ComplaintPayload["liability"], string> = {
    none: "판매자 책임 불명확/없음",
    partial: "일부 책임 있음",
    full: "판매자 책임 큼",
  };

  return map[liability] ?? liability;
}

function complaintCompensationLabel(compensation: ComplaintPayload["compensation"]) {
  const map: Record<ComplaintPayload["compensation"], string> = {
    refund_possible: "환불 가능",
    exchange_possible: "교환 가능",
    partial_compensation: "부분 보상 가능",
    difficult: "보상 어려움",
  };

  return map[compensation] ?? compensation;
}

function buildComplaintInput(profile: AppProfile, payload: ComplaintPayload) {
  return [
    buildProfileBlock(profile),
    "[현재 요청]",
    `요청 말투: ${toneLabel(payload.tone || profile.default_tone)}`,
    `책임 판단: ${complaintLiabilityLabel(payload.liability)}`,
    `보상 가능 여부: ${complaintCompensationLabel(payload.compensation)}`,
    `클레임 내용: ${escapeBlock(payload.complaint_text)}`,
    "중요 포인트: 고객 감정 완화를 먼저 하고, 가능한 조치나 확인 절차를 예의 있게 연결하라.",
  ].join("\n\n");
}

export function buildInput(type: GenerationType, profile: AppProfile, payload: SupportedPayload) {
  if (type === "review") return buildReviewInput(profile, payload as ReviewPayload);
  if (type === "inquiry") return buildInquiryInput(profile, payload as InquiryPayload);
  return buildComplaintInput(profile, payload as ComplaintPayload);
}

export function buildPromptCacheKey(type: GenerationType, profile: AppProfile) {
  return [
    "eungdae-doumi",
    "v2",
    type,
    clean(profile.business_type) || "unset-business",
    toneLabel(profile.default_tone),
    clean(profile.brand_name) ? "brand" : "no-brand",
  ].join(":");
}
