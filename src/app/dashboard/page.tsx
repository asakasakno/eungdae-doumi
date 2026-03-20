import Link from "next/link";
import { getOrCreateProfile, getOrCreateSubscription, requireUserPage } from "@/lib/auth";
import { getUsageSummary } from "@/lib/usage";
import { formatBusinessType, formatTone, formatGenerationType, formatDateTime } from "@/lib/utils";

export default async function DashboardHomePage() {
  const { supabase, user } = await requireUserPage();
  const profile = await getOrCreateProfile(supabase, user.id);
  const usage = await getUsageSummary(supabase, user.id);
  const subscription = await getOrCreateSubscription(supabase, user.id);

  const [{ count }, { data: recentItems }] = await Promise.all([
    supabase.from("generations").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    supabase
      .from("generations")
      .select("id,type,input_text,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  return (
    <div className="stack">
      <div className="topbar">
        <div className="stack-xs">
          <h1 className="page-title">대시보드</h1>
          <p className="muted">현재 계정 상태와 최근 생성 이력을 한 번에 확인합니다.</p>
        </div>
        <Link href="/dashboard/review" className="button primary">
          바로 생성 시작
        </Link>
      </div>

      <div className="grid grid-3">
        <div className="card metric-card stack-sm">
          <span className="muted">현재 플랜</span>
          <strong>{subscription.plan === "pro" ? "프로" : "무료"}</strong>
          <span className="muted">{usage.daily_limit ? `하루 ${usage.daily_limit}회` : "무제한"}</span>
        </div>

        <div className="card metric-card stack-sm">
          <span className="muted">오늘 사용량</span>
          <strong>{usage.used_count}회</strong>
          <span className="muted">
            {usage.remaining_count !== null ? `남은 횟수 ${usage.remaining_count}회` : "무제한 사용"}
          </span>
        </div>

        <div className="card metric-card stack-sm">
          <span className="muted">누적 생성 수</span>
          <strong>{count ?? 0}건</strong>
          <span className="muted">저장된 응대 결과 기준</span>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card stack">
          <h2>현재 프로필</h2>
          <div className="stack-sm muted">
            <div>브랜드명: {profile.brand_name || "미설정"}</div>
            <div>업종: {formatBusinessType(profile.business_type)}</div>
            <div>기본 말투: {formatTone(profile.default_tone)}</div>
          </div>
          <Link href="/dashboard/settings" className="button secondary">
            설정 수정
          </Link>
        </div>

        <div className="card stack">
          <h2>빠른 실행</h2>
          <div className="grid grid-2">
            <Link href="/dashboard/review" className="feature-item quick-link-card">
              <strong>리뷰 답변</strong>
              <span className="muted">별점과 리뷰 내용을 넣으면 답변 3개 생성</span>
            </Link>
            <Link href="/dashboard/inquiry" className="feature-item quick-link-card">
              <strong>문의 답변</strong>
              <span className="muted">배송/재입고/교환 문의 응대 문장 생성</span>
            </Link>
            <Link href="/dashboard/complaint" className="feature-item quick-link-card">
              <strong>클레임 대응</strong>
              <span className="muted">감정 완화와 원칙 설명을 함께 고려</span>
            </Link>
            <Link href="/dashboard/history" className="feature-item quick-link-card">
              <strong>생성 이력</strong>
              <span className="muted">복붙했던 문장을 다시 꺼내 사용</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="card stack">
        <div className="stack-sm">
          <h2>최근 생성 이력</h2>
          <p className="muted">최근 5건만 보여줍니다.</p>
        </div>

        {!recentItems || recentItems.length === 0 ? (
          <div className="empty-state">아직 생성 기록이 없습니다. 리뷰 답변 생성부터 시작하세요.</div>
        ) : (
          <div className="stack">
            {recentItems.map((item) => (
              <article key={item.id} className="history-item">
                <div className="history-meta">
                  <span className="badge">{formatGenerationType(item.type)}</span>
                  <span>{formatDateTime(item.created_at)}</span>
                </div>
                <p className="answer-text">{item.input_text}</p>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
