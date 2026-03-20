"use client";

import { useMemo, useState } from "react";
import type {
  AppProfile,
  GeneratedAnswer,
  GenerationType,
  Tone,
  UsageSummary,
} from "@/types/app";
import { CopyButton } from "@/components/copy-button";

interface GenerationFormProps {
  mode: GenerationType;
  profile: AppProfile;
  initialUsage: UsageSummary;
}

const toneOptions: Array<{ value: Tone; label: string }> = [
  { value: "friendly", label: "친절형" },
  { value: "formal", label: "정중형" },
  { value: "plain", label: "담백형" },
  { value: "firm", label: "단호형" },
];

export function GenerationForm({ mode, profile, initialUsage }: GenerationFormProps) {
  const [tone, setTone] = useState<Tone>(profile.default_tone);
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(5);
  const [inquiryText, setInquiryText] = useState("");
  const [inquiryCategory, setInquiryCategory] = useState("delivery");
  const [complaintText, setComplaintText] = useState("");
  const [liability, setLiability] = useState("partial");
  const [compensation, setCompensation] = useState("exchange_possible");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [usage, setUsage] = useState(initialUsage);
  const [results, setResults] = useState<GeneratedAnswer[]>([]);

  const endpoint = useMemo(() => `/api/generate/${mode}`, [mode]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setErrorMessage("");

    const body =
      mode === "review"
        ? {
            review_text: reviewText,
            rating,
            tone,
          }
        : mode === "inquiry"
          ? {
              inquiry_text: inquiryText,
              category: inquiryCategory,
              tone,
            }
          : {
              complaint_text: complaintText,
              liability,
              compensation,
              tone,
            };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setErrorMessage(data.message ?? "생성에 실패했습니다.");
        return;
      }

      setResults(data.results ?? []);
      if (data.usage) {
        setUsage(data.usage as UsageSummary);
      }
    } catch {
      setErrorMessage("네트워크 오류가 발생했습니다. 잠시 후 다시 시도하세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid page-grid">
      <form className="card stack" onSubmit={handleSubmit}>
        <div className="stack-sm">
          <span className="badge">
            {usage.plan === "pro" ? "프로" : "무료"} / 오늘 {usage.used_count}
            {usage.daily_limit ? `회 사용` : ""}
          </span>
          <h2>
            {mode === "review"
              ? "리뷰 답변 생성"
              : mode === "inquiry"
                ? "문의 답변 생성"
                : "클레임 대응 생성"}
          </h2>
          <p className="muted">
            {usage.remaining_count !== null
              ? `오늘 남은 횟수: ${usage.remaining_count}회`
              : "무제한 사용 중"}
          </p>
        </div>

        <label className="field">
          <span className="label">말투</span>
          <select className="input" value={tone} onChange={(event) => setTone(event.target.value as Tone)}>
            {toneOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        {mode === "review" ? (
          <>
            <label className="field">
              <span className="label">별점</span>
              <select className="input" value={rating} onChange={(event) => setRating(Number(event.target.value))}>
                {[5, 4, 3, 2, 1].map((score) => (
                  <option key={score} value={score}>
                    {score}점
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span className="label">리뷰 내용</span>
              <textarea
                className="input textarea"
                rows={8}
                value={reviewText}
                onChange={(event) => setReviewText(event.target.value)}
                placeholder="예: 배송이 빠르고 포장도 깔끔해서 만족했어요."
                required
              />
            </label>
          </>
        ) : null}

        {mode === "inquiry" ? (
          <>
            <label className="field">
              <span className="label">문의 유형</span>
              <select className="input" value={inquiryCategory} onChange={(event) => setInquiryCategory(event.target.value)}>
                <option value="delivery">배송 문의</option>
                <option value="restock">재입고 문의</option>
                <option value="exchange_refund">교환/환불 문의</option>
                <option value="product_detail">상품 상세 문의</option>
                <option value="order_change">주문 변경 문의</option>
                <option value="etc">기타 문의</option>
              </select>
            </label>

            <label className="field">
              <span className="label">문의 내용</span>
              <textarea
                className="input textarea"
                rows={8}
                value={inquiryText}
                onChange={(event) => setInquiryText(event.target.value)}
                placeholder="예: 이 상품 재입고 언제 되나요?"
                required
              />
            </label>
          </>
        ) : null}

        {mode === "complaint" ? (
          <>
            <label className="field">
              <span className="label">책임 여부</span>
              <select className="input" value={liability} onChange={(event) => setLiability(event.target.value)}>
                <option value="none">우리 책임 없음</option>
                <option value="partial">일부 책임 있음</option>
                <option value="full">우리 책임 있음</option>
              </select>
            </label>

            <label className="field">
              <span className="label">보상 가능 여부</span>
              <select className="input" value={compensation} onChange={(event) => setCompensation(event.target.value)}>
                <option value="refund_possible">환불 가능</option>
                <option value="exchange_possible">교환 가능</option>
                <option value="partial_compensation">부분 보상 가능</option>
                <option value="difficult">보상 어려움</option>
              </select>
            </label>

            <label className="field">
              <span className="label">클레임 내용</span>
              <textarea
                className="input textarea"
                rows={8}
                value={complaintText}
                onChange={(event) => setComplaintText(event.target.value)}
                placeholder="예: 상품이 늦게 왔고 포장도 찌그러져서 기분이 안 좋네요."
                required
              />
            </label>
          </>
        ) : null}

        {errorMessage ? <div className="notice error">{errorMessage}</div> : null}

        <button className="button primary" type="submit" disabled={loading}>
          {loading ? "생성 중..." : "답변 생성하기"}
        </button>
      </form>

      <div className="card stack">
        <div className="stack-sm">
          <h3>생성 결과</h3>
          <p className="muted">세 가지 전략으로 나눈 답변이 저장되고, 복사 버튼으로 바로 사용할 수 있습니다.</p>
        </div>

        {results.length === 0 ? (
          <div className="empty-state">
            아직 생성된 결과가 없습니다. 왼쪽 입력 폼을 채워서 시작하세요.
          </div>
        ) : (
          <div className="stack">
            {results.map((answer, index) => (
              <article className="answer-card" key={`${answer.label}-${index}`}>
                <div className="answer-header">
                  <div className="stack-xs">
                    <strong>{answer.label}</strong>
                    <span className="muted">{answer.when_to_use}</span>
                  </div>
                  <CopyButton text={answer.text} />
                </div>

                <p className="answer-text">{answer.text}</p>
                <p className="answer-reason">
                  <strong>의도:</strong> {answer.reason}
                </p>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
