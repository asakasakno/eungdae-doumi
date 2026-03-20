const toNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const env = {
  appName: process.env.NEXT_PUBLIC_APP_NAME || "응대도우미",
  appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  openAIModel: process.env.OPENAI_MODEL || "gpt-5.4",
  openAIReasoningEffort: process.env.OPENAI_REASONING_EFFORT || "low",
  freeDailyLimit: toNumber(process.env.FREE_DAILY_LIMIT, 5),
  proDailyLimit: toNumber(process.env.PRO_DAILY_LIMIT, 9999),
  enableBilling: process.env.ENABLE_BILLING === "true",
  publicEnableBilling: process.env.NEXT_PUBLIC_ENABLE_BILLING === "true",
} as const;

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`[env] Missing required environment variable: ${name}`);
  }
  return value;
}
