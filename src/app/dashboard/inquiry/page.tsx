import { GenerationForm } from "@/components/generation/generation-form";
import { getOrCreateProfile, requireUserPage } from "@/lib/auth";
import { getUsageSummary } from "@/lib/usage";

export default async function InquiryPage() {
  const { supabase, user } = await requireUserPage();
  const profile = await getOrCreateProfile(supabase, user.id);
  const usage = await getUsageSummary(supabase, user.id);

  return (
    <div className="stack">
      <div className="topbar">
        <div className="stack-xs">
          <h1 className="page-title">문의 답변 생성</h1>
          <p className="muted">배송/재입고/교환 문의에 바로 복붙 가능한 문장을 생성합니다.</p>
        </div>
      </div>

      <GenerationForm mode="inquiry" profile={profile} initialUsage={usage} />
    </div>
  );
}
