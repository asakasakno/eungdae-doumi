export type Plan = "free" | "pro";

export type BusinessType = "smartstore" | "delivery" | "cafe" | "offline" | "etc";

export type Tone = "friendly" | "formal" | "plain" | "firm";

export type GenerationType = "review" | "inquiry" | "complaint";

export interface AppProfile {
  user_id: string;
  business_type: BusinessType | null;
  brand_name: string | null;
  default_tone: Tone;
  created_at?: string;
  updated_at?: string;
}

export interface AppSubscription {
  user_id: string;
  plan: Plan;
  status: "active" | "trialing" | "canceled" | "past_due" | "incomplete";
  started_at: string | null;
  expires_at: string | null;
  payment_provider: string | null;
  provider_subscription_id: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface UsageSummary {
  date: string;
  used_count: number;
  daily_limit: number | null;
  remaining_count: number | null;
  plan: Plan;
}

export interface GeneratedAnswer {
  label: string;
  text: string;
  reason: string;
  when_to_use: string;
}

export interface GeneratedBundle {
  answers: GeneratedAnswer[];
}

export interface GenerationRecord {
  id: string;
  type: GenerationType;
  input_text: string;
  options_json: Record<string, unknown>;
  output_1: string;
  output_2: string;
  output_3: string;
  created_at: string;
}

export interface ReviewPayload {
  review_text: string;
  rating: number;
  tone?: Tone;
}

export interface InquiryPayload {
  inquiry_text: string;
  category: "delivery" | "restock" | "exchange_refund" | "product_detail" | "order_change" | "etc";
  tone?: Tone;
}

export interface ComplaintPayload {
  complaint_text: string;
  liability: "none" | "partial" | "full";
  compensation: "refund_possible" | "exchange_possible" | "partial_compensation" | "difficult";
  tone?: Tone;
}
