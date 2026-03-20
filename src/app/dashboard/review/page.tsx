import { GenerationForm } from "@/components/generation/generation-form";
import { getOrCreateProfile, requireUserPage } from "@/lib/auth";
import { getUsageSummary } from "@/lib/usage";

export default async function ReviewPage() {
  const { supabase, user } = await requireUserPage();
  const profile = await getOrCreateProfile(supabase, user.id);
  const usage = await getUsageSummary(supabase, user.id);

  return (
    <div className="stack">
      <div className="topbar">
        <div className="stack-xs">
          <h1 className="page-title">리뷰 답변 생성</h1>
          <p className="muted">별점과 리뷰 내용을 바탕으로 서로 다른 전략의 답변 3개를 생성합니다.</p>
        </div>
      </div>

      <GenerationForm mode="review" profile={profile} initialUsage={usage} />
    </div>
  );
}
