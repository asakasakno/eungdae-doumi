import Link from "next/link";

export default function PricingPage() {
  return (
    <main className="container section">
      <div className="stack">
        <div className="stack-sm">
          <span className="badge">요금제</span>
          <h1>먼저 무료로 검증하고, 반복 사용이 확인되면 결제를 붙이세요.</h1>
          <p className="muted">
            현재 예제 코드는 무료/프로 구조와 사용량 제한까지 포함하고 있습니다.
            실제 결제사는 이후에 붙이면 됩니다.
          </p>
        </div>

        <div className="grid grid-2">
          <article className="card stack">
            <h2>무료</h2>
            <strong>₩0</strong>
            <ul className="list-reset stack-sm muted">
              <li>• 하루 5회 생성</li>
              <li>• 리뷰/문의/클레임 생성</li>
              <li>• 기본 이력 저장</li>
            </ul>
            <Link href="/signup" className="button secondary">
              무료로 시작
            </Link>
          </article>

          <article className="card stack">
            <h2>프로</h2>
            <strong>₩9,900 / 월</strong>
            <ul className="list-reset stack-sm muted">
              <li>• 사실상 무제한 생성</li>
              <li>• 브랜드 톤 고정</li>
              <li>• 템플릿 확장 가능</li>
            </ul>
            <Link href="/signup" className="button primary">
              구조 확인 후 결제 붙이기
            </Link>
          </article>
        </div>
      </div>
    </main>
  );
}
