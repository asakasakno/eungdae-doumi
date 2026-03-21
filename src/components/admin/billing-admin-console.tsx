"use client";

import { useEffect, useState } from "react";

type OverviewResponse = {
  billingEnabled: boolean;
  summary: {
    grossSettlementKrw: number;
    paidCount: number;
    pendingCount: number;
    totalRemainingCredits: number;
  };
  recentOrders: Array<{
    id: string;
    amount_krw: number;
    status: string;
    order_type: string;
    created_at: string;
    paid_at: string | null;
    user_id: string;
    plan_code: string | null;
    pack_code: string | null;
  }>;
};

const money = (value: number) => `${value.toLocaleString("ko-KR")}원`;

export function BillingAdminConsole() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);

    const response = await fetch("/api/admin/billing/overview", { cache: "no-store" });
    const json = await response.json();

    if (!response.ok) {
      setError(json.message || "관리자 개요를 불러오지 못했습니다.");
      setLoading(false);
      return;
    }

    setData(json);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleToggle() {
    if (!data) return;
    setSaving(true);

    const response = await fetch("/api/admin/billing/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !data.billingEnabled }),
    });

    setSaving(false);

    if (!response.ok) {
      const json = await response.json();
      setError(json.message || "결제 스위치 변경에 실패했습니다.");
      return;
    }

    await load();
  }

  async function handleApprove(orderId: string) {
    setSaving(true);
    const response = await fetch(`/api/admin/billing/orders/${orderId}/approve`, {
      method: "POST",
    });
    setSaving(false);

    if (!response.ok) {
      const json = await response.json();
      setError(json.message || "주문 승인에 실패했습니다.");
      return;
    }

    await load();
  }

  if (loading) return <div className="p-6">관리자 데이터를 불러오는 중입니다...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!data) return null;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between rounded-2xl border p-4">
        <div>
          <h1 className="text-2xl font-bold">운영 콘솔</h1>
          <p className="text-sm text-gray-600">결제 On/Off, 주문 승인, 정산 확인을 한 화면에서 관리합니다.</p>
        </div>
        <button
          onClick={handleToggle}
          disabled={saving}
          className="rounded-xl border px-4 py-2 font-medium"
        >
          {data.billingEnabled ? "결제 중지" : "결제 재개"}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border p-4"><div className="text-sm text-gray-500">결제 상태</div><div className="mt-2 text-xl font-semibold">{data.billingEnabled ? "켜짐" : "꺼짐"}</div></div>
        <div className="rounded-2xl border p-4"><div className="text-sm text-gray-500">누적 정산액</div><div className="mt-2 text-xl font-semibold">{money(data.summary.grossSettlementKrw)}</div></div>
        <div className="rounded-2xl border p-4"><div className="text-sm text-gray-500">승인 대기</div><div className="mt-2 text-xl font-semibold">{data.summary.pendingCount}건</div></div>
        <div className="rounded-2xl border p-4"><div className="text-sm text-gray-500">총 남은 크레딧</div><div className="mt-2 text-xl font-semibold">{data.summary.totalRemainingCredits.toLocaleString("ko-KR")}개</div></div>
      </div>

      <div className="rounded-2xl border p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">최근 주문</h2>
          <button className="rounded-xl border px-3 py-1 text-sm" onClick={() => void load()}>새로고침</button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="py-2 pr-4">주문유형</th>
                <th className="py-2 pr-4">상품</th>
                <th className="py-2 pr-4">금액</th>
                <th className="py-2 pr-4">상태</th>
                <th className="py-2 pr-4">생성일</th>
                <th className="py-2 pr-4">처리</th>
              </tr>
            </thead>
            <tbody>
              {data.recentOrders.map((order) => (
                <tr key={order.id} className="border-b align-top">
                  <td className="py-3 pr-4">{order.order_type === "subscription" ? "구독" : "추가구매"}</td>
                  <td className="py-3 pr-4">{order.plan_code || order.pack_code || "-"}</td>
                  <td className="py-3 pr-4">{money(Number(order.amount_krw || 0))}</td>
                  <td className="py-3 pr-4">{order.status}</td>
                  <td className="py-3 pr-4">{new Date(order.created_at).toLocaleString("ko-KR")}</td>
                  <td className="py-3 pr-4">
                    {order.status === "pending" ? (
                      <button
                        onClick={() => void handleApprove(order.id)}
                        disabled={saving}
                        className="rounded-lg border px-3 py-1"
                      >
                        승인
                      </button>
                    ) : (
                      <span className="text-gray-400">완료</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
