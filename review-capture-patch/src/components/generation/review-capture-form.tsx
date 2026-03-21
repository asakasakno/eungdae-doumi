"use client";

import { useMemo, useState } from "react";
import type { AppProfile, GeneratedAnswer, Tone, UsageSummary } from "@/types/app";
import { CopyButton } from "@/components/copy-button";

interface ReviewCaptureFormProps {
  profile: AppProfile;
  initialUsage: UsageSummary;
}

interface BatchItem {
  index: number;
  review_text: string;
  rating: number;
  selected_answer: GeneratedAnswer;
  answers: GeneratedAnswer[];
  generation_id: string;
}

const toneOptions: Array<{ value: Tone; label: string }> = [
  { value: "friendly", label: "친절형" },
  { value: "formal", label: "정중형" },
  { value: "plain", label: "담백형" },
  { value: "firm", label: "단호형" },
];

const strategyOptions = [
  { value: "warm", label: "따뜻형만 뽑기" },
  { value: "balanced", label: "균형형만 뽑기" },
  { value: "principle", label: "원칙형만 뽑기" },
] as const;

export function ReviewCaptureForm({ profile, initialUsage }: ReviewCaptureFormProps) {
  const [tone, setTone] = useState<Tone>(profile.default_tone);
  const [fallbackRating, setFallbackRating] = useState(5);
  const [maxReviews, setMaxReviews] = useState(10);
  const [strategy, setStrategy] = useState<(typeof strategyOptions)[number]["value"]>("balanced");
  const [file, setFile] = useState<File | null>(null);
  const [usage, setUsage] = useState(initialUsage);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [items, setItems] = useState<BatchItem[]>([]);

  const bulkCopyText = useMemo(() => {
    if (items.length === 0) return "";

    return items
      .map(
        (item) =>
          [`[리뷰 ${item.index}]`, item.review_text, "", `[답변 ${item.index}]`, item.selected_answer.text].join("\n"),
      )
      .join("\n\n--------------------\n\n");
  }, [items]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setErrorMessage("리뷰 화면 캡처 이미지를 먼저 선택하세요.");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const body = new FormData();
      body.append("image", file);
      body.append("tone", tone);
      body.append("fallback_rating", String(fallbackRating));
      body.append("max_reviews", String(maxReviews));
      body.append("strategy", strategy);

      const response = await fetch("/api/generate/review-capture", {
        method: "POST",
        body,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setErrorMessage(data.message ?? "리뷰 캡처 처리에 실패했습니다.");
        return;
      }

      setItems((data.items ?? []) as BatchItem[]);
      if (data.usage) {
        setUsage(data.usage as UsageSummary);
      }

      const reviewCount = Number(data.extracted_count ?? 0);
      const truncated = Boolean(data.truncated);
      setSuccessMessage(
        truncated
          ? `${reviewCount}개 리뷰를 처리했습니다. 화면에 더 많은 리뷰가 있었지만 현재 제한 수까지만 처리했습니다.`
          : `${reviewCount}개 리뷰를 순서대로 처리했습니다.`,
      );
    } catch {
      setErrorMessage("네트워크 오류가 발생했습니다. 잠시 후 다시 시도하세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card stack">
      <div className="stack-sm">
        <span className="badge">리뷰 캡처 일괄 처리</span>
        <h2>리뷰 화면 캡처 업로드</h2>
        <p className="muted">
          스마트스토어/쿠팡 관리자 화면을 캡처해서 올리면 보이는 리뷰를 위에서 아래 순서대로 읽고, 선택한 전략의 답변을 한 번에 생성합니다.
        </p>
        <p className="muted">
          현재 플랜: {usage.plan === "pro" ? "프로" : "무료"} / 오늘 남은 횟수: {usage.remaining_count ?? "무제한"}
        </p>
      </div>

      <form className="grid grid-2" onSubmit={handleSubmit}>
        <label className="field">
          <span className="label">리뷰 캡처 이미지</span>
          <input
            className="input"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
        </label>

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

        <label className="field">
          <span className="label">별점이 안 보일 때 기본값</span>
          <select className="input" value={fallbackRating} onChange={(event) => setFallbackRating(Number(event.target.value))}>
            {[5, 4, 3, 2, 1].map((score) => (
              <option key={score} value={score}>
                {score}점
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span className="label">자동 선택 전략</span>
          <select className="input" value={strategy} onChange={(event) => setStrategy(event.target.value as typeof strategy)}>
            {strategyOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span className="label">한 번에 처리할 최대 리뷰 수</span>
          <select className="input" value={maxReviews} onChange={(event) => setMaxReviews(Number(event.target.value))}>
            {[5, 10, 15, 20].map((value) => (
              <option key={value} value={value}>
                {value}개
              </option>
            ))}
          </select>
        </label>

        <div className="field stack-sm">
          <span className="label">현재 선택 파일</span>
          <div className="notice">{file ? `${file.name} (${Math.round(file.size / 1024)}KB)` : "선택된 파일이 없습니다."}</div>
        </div>

        {errorMessage ? <div className="notice error" style={{ gridColumn: "1 / -1" }}>{errorMessage}</div> : null}
        {successMessage ? <div className="notice success" style={{ gridColumn: "1 / -1" }}>{successMessage}</div> : null}

        <div className="stack-sm" style={{ gridColumn: "1 / -1" }}>
          <button className="button primary" type="submit" disabled={loading}>
            {loading ? "캡처 분석 및 답변 생성 중..." : "캡처 업로드 후 순서대로 처리"}
          </button>
          <p className="muted">한 리뷰당 기존 단일 생성 1회가 차감됩니다. OCR 오인식 가능성이 있어 업로드 후 결과를 한 번 확인하세요.</p>
        </div>
      </form>

      <div className="stack">
        <div className="answer-header">
          <div className="stack-xs">
            <h3 style={{ margin: 0 }}>일괄 처리 결과</h3>
            <span className="muted">업로드한 화면 순서대로 결과를 묶어서 보여줍니다.</span>
          </div>
          {items.length > 0 ? <CopyButton text={bulkCopyText} label="전체 복사" /> : null}
        </div>

        {items.length === 0 ? (
          <div className="empty-state">아직 일괄 처리 결과가 없습니다. 리뷰 관리자 화면을 캡처해서 업로드하세요.</div>
        ) : (
          <div className="stack">
            {items.map((item) => (
              <article className="answer-card" key={`${item.generation_id}-${item.index}`}>
                <div className="answer-header">
                  <div className="stack-xs">
                    <strong>{item.index}번 리뷰 · {item.rating}점</strong>
                    <span className="muted">선택 전략: {item.selected_answer.label}</span>
                  </div>
                  <CopyButton text={item.selected_answer.text} />
                </div>

                <p className="answer-reason">
                  <strong>원문 리뷰:</strong> {item.review_text}
                </p>
                <p className="answer-text">{item.selected_answer.text}</p>
                <p className="answer-reason">
                  <strong>선택 이유:</strong> {item.selected_answer.reason}
                </p>

                <details>
                  <summary className="muted">다른 후보 2개 같이 보기</summary>
                  <div className="stack" style={{ marginTop: "0.75rem" }}>
                    {item.answers.map((answer, index) => (
                      <div className="feature-item" key={`${item.generation_id}-${answer.label}-${index}`}>
                        <div className="answer-header">
                          <div className="stack-xs">
                            <strong>{answer.label}</strong>
                            <span className="muted">{answer.when_to_use}</span>
                          </div>
                          <CopyButton text={answer.text} />
                        </div>
                        <p className="answer-text">{answer.text}</p>
                      </div>
                    ))}
                  </div>
                </details>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
