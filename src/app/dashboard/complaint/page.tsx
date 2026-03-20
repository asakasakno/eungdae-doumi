import { GenerationForm } from "@/components/generation/generation-form";
import { getOrCreateProfile, requireUserPage } from "@/lib/auth";
import { getUsageSummary } from "@/lib/usage";

export default async function ComplaintPage() {
  const { supabase, user } = await requireUserPage();
  const profile = await getOrCreateProfile(supabase, user.id);
  const usage = await getUsageSummary(supabase, user.id);

  return (
    <div className="stack">
      <div className="topbar">
        <div className="stack-xs">
          <h1 className="page-title">클레임 대응 생성</h1>
          <p className="muted">감정 완화, 책임 범위, 보상 가능 여부를 고려한 응대 문장을 생성합니다.</p>
        </div>
      </div>

      <GenerationForm mode="complaint" profile={profile} initialUsage={usage} />
    </div>
  );
}
