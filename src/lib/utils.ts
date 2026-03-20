import type { BusinessType, Tone } from "@/types/app";

export function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function truncateText(value: string, maxLength = 80) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength)}…`;
}

export function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function getKstDateString(date = new Date()) {
  const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

export function formatBusinessType(value: BusinessType | null | undefined) {
  switch (value) {
    case "smartstore":
      return "스마트스토어";
    case "delivery":
      return "배달/음식점";
    case "cafe":
      return "카페";
    case "offline":
      return "오프라인 매장";
    case "etc":
      return "기타";
    default:
      return "미설정";
  }
}

export function formatTone(value: Tone | null | undefined) {
  switch (value) {
    case "friendly":
      return "친절형";
    case "formal":
      return "정중형";
    case "plain":
      return "담백형";
    case "firm":
      return "단호형";
    default:
      return "기본";
  }
}

export function formatGenerationType(value: string) {
  switch (value) {
    case "review":
      return "리뷰";
    case "inquiry":
      return "문의";
    case "complaint":
      return "클레임";
    default:
      return value;
  }
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function normalizeBrandName(value: string | null | undefined) {
  const trimmed = (value || "").trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function shouldUseReasoning(model: string) {
  return model.startsWith("gpt-5") || model.startsWith("o");
}

export function formatDateTime(value: string) {
  try {
    return new Intl.DateTimeFormat("ko-KR", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Seoul",
    }).format(new Date(value));
  } catch {
    return value;
  }
}
