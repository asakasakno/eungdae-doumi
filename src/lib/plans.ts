export type AppPlanCode = "free" | "basic" | "pro" | "premium";
export type CreditPackCode = "pack_10" | "pack_100" | "pack_300" | "pack_1000";

export type PlanDefinition = {
  code: AppPlanCode;
  name: string;
  monthlyPriceKrw: number;
  monthlyIncludedReviews: number;
  captureBatchLimit: number;
};

export type CreditPackDefinition = {
  code: CreditPackCode;
  label: string;
  credits: number;
  priceKrw: number;
  unitPriceKrw: number;
};

export const PLAN_DEFINITIONS: Record<AppPlanCode, PlanDefinition> = {
  free: {
    code: "free",
    name: "Free",
    monthlyPriceKrw: 0,
    monthlyIncludedReviews: 30,
    captureBatchLimit: 0,
  },
  basic: {
    code: "basic",
    name: "Basic",
    monthlyPriceKrw: 9900,
    monthlyIncludedReviews: 300,
    captureBatchLimit: 10,
  },
  pro: {
    code: "pro",
    name: "Pro",
    monthlyPriceKrw: 19900,
    monthlyIncludedReviews: 1000,
    captureBatchLimit: 30,
  },
  premium: {
    code: "premium",
    name: "Premium",
    monthlyPriceKrw: 39000,
    monthlyIncludedReviews: 3000,
    captureBatchLimit: 100,
  },
};

export const CREDIT_PACKS: Record<CreditPackCode, CreditPackDefinition> = {
  pack_10: {
    code: "pack_10",
    label: "10개 추가",
    credits: 10,
    priceKrw: 1000,
    unitPriceKrw: 100,
  },
  pack_100: {
    code: "pack_100",
    label: "100개 추가",
    credits: 100,
    priceKrw: 3000,
    unitPriceKrw: 30,
  },
  pack_300: {
    code: "pack_300",
    label: "300개 추가",
    credits: 300,
    priceKrw: 7000,
    unitPriceKrw: 23.33,
  },
  pack_1000: {
    code: "pack_1000",
    label: "1000개 추가",
    credits: 1000,
    priceKrw: 19000,
    unitPriceKrw: 19,
  },
};

export function getPlanDefinition(plan: string | null | undefined): PlanDefinition {
  const key = (plan || "free") as AppPlanCode;
  return PLAN_DEFINITIONS[key] ?? PLAN_DEFINITIONS.free;
}

export function getCreditPack(packCode: string | null | undefined): CreditPackDefinition | null {
  if (!packCode) return null;
  return CREDIT_PACKS[packCode as CreditPackCode] ?? null;
}

export function getDailyLimit(plan: string | null | undefined): number {
  const definition = getPlanDefinition(plan);
  if (definition.code === "free") return 5;
  return 9999;
}
