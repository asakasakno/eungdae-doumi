import { HistoryList } from "@/components/history/history-list";
import { requireUserPage } from "@/lib/auth";
import type { GenerationRecord } from "@/types/app";

export default async function HistoryPage() {
  const { supabase, user } = await requireUserPage();

  const { data } = await supabase
    .from("generations")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(30);

  return (
    <div className="stack">
      <div className="topbar">
        <div className="stack-xs">
          <h1 className="page-title">생성 이력</h1>
          <p className="muted">최근 생성 결과를 다시 열어 복사할 수 있습니다.</p>
        </div>
      </div>

      <HistoryList items={(data ?? []) as GenerationRecord[]} />
    </div>
  );
}
