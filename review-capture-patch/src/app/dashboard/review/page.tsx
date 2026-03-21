import { GenerationForm } from "@/components/generation/generation-form";
import { ReviewCaptureForm } from "@/components/generation/review-capture-form";
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
          <p className="muted">
            단일 리뷰 답변 생성은 그대로 유지하고, 리뷰 화면 캡처 업로드로 여러 개를 순서대로 한 번에 처리할 수 있게 확장했습니다.
          </p>
        </div>
      </div>

      <ReviewCaptureForm profile={profile} initialUsage={usage} />
      <GenerationForm mode="review" profile={profile} initialUsage={usage} />
    </div>
  );
}
