import { ProfileForm } from "@/components/profile/profile-form";
import { requireUserPage } from "@/lib/auth";
import { getOrCreateProfile } from "@/lib/auth";

export default async function OnboardingPage() {
  const { supabase, user } = await requireUserPage();
  const profile = await getOrCreateProfile(supabase, user.id);

  return (
    <main className="container section">
      <div className="grid grid-2">
        <div className="card stack">
          <span className="badge">처음 설정</span>
          <h1>업종과 기본 말투를 먼저 정하세요</h1>
          <p className="muted">
            이 값들이 프롬프트에 들어가서 생성 품질에 직접 영향을 줍니다.
            정확한 업종과 브랜드명을 넣을수록 더 자연스럽게 나옵니다.
          </p>
        </div>

        <ProfileForm initialProfile={profile} mode="onboarding" />
      </div>
    </main>
  );
}
