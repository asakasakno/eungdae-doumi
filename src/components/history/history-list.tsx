"use client";

import type { GenerationRecord } from "@/types/app";
import { CopyButton } from "@/components/copy-button";
import { formatDateTime, formatGenerationType } from "@/lib/utils";

interface HistoryListProps {
  items: GenerationRecord[];
}

export function HistoryList({ items }: HistoryListProps) {
  if (items.length === 0) {
    return <div className="empty-state">아직 저장된 생성 결과가 없습니다.</div>;
  }

  return (
    <div className="stack">
      {items.map((item) => (
        <article className="history-item" key={item.id}>
          <div className="history-meta">
            <span className="badge">{formatGenerationType(item.type)}</span>
            <span>{formatDateTime(item.created_at)}</span>
          </div>

          <div className="stack-xs">
            <strong>입력</strong>
            <p className="answer-text">{item.input_text}</p>
          </div>

          <div className="stack-xs">
            <strong>답변 1</strong>
            <p className="answer-text">{item.output_1}</p>
            <CopyButton text={item.output_1} />
          </div>

          <div className="stack-xs">
            <strong>답변 2</strong>
            <p className="answer-text">{item.output_2}</p>
            <CopyButton text={item.output_2} />
          </div>

          <div className="stack-xs">
            <strong>답변 3</strong>
            <p className="answer-text">{item.output_3}</p>
            <CopyButton text={item.output_3} />
          </div>
        </article>
      ))}
    </div>
  );
}
