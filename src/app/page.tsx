import Link from "next/link";
import { env } from "@/lib/env";

export default function HomePage() {
  return (
    <main>
      <section className="container hero">
        <div className="card stack">
          <span className="badge">소상공인 고객응대 자동화</span>
          <h1 className="hero-title">리뷰 답변, 문의 응대, 클레임 대응을 10초 안에 정리합니다.</h1>
          <p className="hero-subtitle">
            {env.appName}는 스마트스토어·배달·카페·오프라인 매장을 위한 응대 문장 생성기입니다.
            업종, 브랜드명, 기본 말투를 반영해 바로 복붙 가능한 문장을 3가지 전략으로 생성합니다.
          </p>

          <div className="hero-actions">
            <Link href="/signup" className="button primary">
              무료로 시작하기
            </Link>
            <Link href="/pricing" className="button secondary">
              요금 보기
            </Link>
          </div>

          <div className="grid grid-3">
            <div className="feature-item">
              <strong>리뷰 답변</strong>
              <p className="muted">별점과 리뷰 내용을 넣으면 상황별 답변 3개를 생성합니다.</p>
            </div>
            <div className="feature-item">
              <strong>문의 응대</strong>
              <p className="muted">배송, 재입고, 교환/환불 문의에 바로 붙여넣을 답변을 만듭니다.</p>
            </div>
            <div className="feature-item">
              <strong>클레임 대응</strong>
              <p className="muted">감정 완화와 운영 리스크를 동시에 고려한 문장을 생성합니다.</p>
            </div>
          </div>
        </div>

        <div className="card stack">
          <div className="stack-sm">
            <span className="badge">예시 결과</span>
            <h2>실제로 이렇게 나옵니다</h2>
          </div>

          <div className="feature-list">
            <article className="answer-card">
              <div className="stack-xs">
                <strong>따뜻한형</strong>
                <span className="muted">긍정 리뷰</span>
              </div>
              <p className="answer-text">
                빠른 배송과 포장까지 좋게 봐주셔서 감사합니다. 만족하셨다니 저희도 기쁩니다.
                다음 주문 때도 기분 좋게 받아보실 수 있도록 잘 준비하겠습니다.
              </p>
            </article>

            <article className="answer-card">
              <div className="stack-xs">
                <strong>균형형</strong>
                <span className="muted">문의 응대</span>
              </div>
              <p className="answer-text">
                문의 주신 상품의 재입고 일정은 현재 확인 중입니다. 확정되는 내용이 있으면 바로 안내드리겠습니다.
              </p>
            </article>

            <article className="answer-card">
              <div className="stack-xs">
                <strong>원칙형</strong>
                <span className="muted">클레임 대응</span>
              </div>
              <p className="answer-text">
                포장 상태로 불편을 드린 점 죄송합니다. 해당 건은 교환 가능 절차 기준에 따라 안내드리겠습니다.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="container section">
        <div className="grid grid-2">
          <div className="card stack">
            <h2>이 프로젝트가 맞는 경우</h2>
            <ul className="list-reset stack-sm muted">
              <li>• 리뷰 답변을 매번 비슷하게 복붙하고 있다</li>
              <li>• 문의 답변 문구를 만들 때 시간이 아깝다</li>
              <li>• 클레임 문장을 어떻게 써야 할지 망설여진다</li>
              <li>• ChatGPT를 직접 쓰기보다 버튼형 도구가 필요하다</li>
            </ul>
          </div>

          <div className="card stack">
            <h2>이 스타터의 범위</h2>
            <ul className="list-reset stack-sm muted">
              <li>• 인증 / 온보딩 / 대시보드</li>
              <li>• 리뷰 / 문의 / 클레임 생성 API</li>
              <li>• 생성 이력 저장</li>
              <li>• 사용량 제한</li>
              <li>• 결제 확장용 stub</li>
            </ul>
            <Link href="/signup" className="button primary">
              지금 바로 사용 시작
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
