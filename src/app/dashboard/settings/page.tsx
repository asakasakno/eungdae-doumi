import Link from "next/link";
import { ProfileForm } from "@/components/profile/profile-form";
import { env } from "@/lib/env";
import { getOrCreateProfile, getOrCreateSubscription, requireUserPage } from "@/lib/auth";

export default async function SettingsPage() {
  const { supabase, user } = await requireUserPage();
  const profile = await getOrCreateProfile(supabase, user.id);
  const subscription = await getOrCreateSubscription(supabase, user.id);

  return (
    <div className="stack">
      <div className="topbar">
        <div className="stack-xs">
          <h1 className="page-title">설정</h1>
          <p className="muted">브랜드 정보, 기본 톤, 플랜 상태를 관리합니다.</p>
        </div>
      </div>

      <div className="grid grid-2">
        <ProfileForm initialProfile={profile} mode="settings" />

        <div className="card stack">
          <h2>플랜 상태</h2>
          <div className="stack-sm muted">
            <div>현재 플랜: {subscription.plan === "pro" ? "프로" : "무료"}</div>
            <div>상태: {subscription.status}</div>
            <div>결제 활성화: {env.publicEnableBilling ? "켜짐" : "꺼짐"}</div>
          </div>

          <Link href="/pricing" className="button secondary">
            요금제 보기
          </Link>
        </div>
      </div>

      <div className="card stack">
        <h2>프롬프트 품질 튜닝 위치</h2>
        <div className="code-block">
          <pre>{`src/lib/prompts.ts
src/lib/generation-service.ts
docs/PROMPT_GUIDE_KO.md`}</pre>
        </div>
        <p className="muted">
          프롬프트 규칙, few-shot 예시, 품질 guard는 위 파일에서 조정합니다.
        </p>
      </div>
    </div>
  );
}
