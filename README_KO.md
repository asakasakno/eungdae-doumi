# 응대도우미 스타터

스마트스토어/배달/소상공인용 **리뷰 답변 / 문의 응대 / 클레임 대응 문장 생성기**입니다.  
Next.js App Router + Supabase SSR Auth + OpenAI Responses API 기반으로 만들었습니다.

이 저장소는 **바로 뜯어서 실행하고 고치기 쉽게** 구성했습니다.  
처음부터 차근차근 적용하는 순서를 아래에 적었습니다.

---

## 0. 이 프로젝트가 하는 일

이 프로젝트는 아래 3가지를 생성합니다.

1. 리뷰 답변
2. 고객 문의 답변
3. 클레임 대응 답변

핵심 포인트는 다음입니다.

- 업종(스마트스토어/배달/카페/오프라인) 반영
- 브랜드명 반영
- 기본 말투 반영
- 같은 입력에 대해 **전략이 다른 3개 답변** 생성
- 생성 결과 저장
- 무료 플랜 사용량 제한
- 이후 유료 플랜으로 확장 가능한 구조

---

## 1. 실행 전에 필요한 것

### 필수
- Node.js 20.9 이상
- npm
- Supabase 프로젝트 1개
- OpenAI API 키 1개

### 있으면 좋은 것
- Vercel 계정
- Toss Payments 또는 Stripe 계정

---

## 2. 폴더 구조

```text
eungdae-doumi-starter/
├─ .env.example
├─ .gitignore
├─ README_KO.md
├─ next.config.ts
├─ next-env.d.ts
├─ package.json
├─ tsconfig.json
├─ supabase/
│  └─ schema.sql
└─ src/
   ├─ proxy.ts
   ├─ app/
   │  ├─ globals.css
   │  ├─ layout.tsx
   │  ├─ page.tsx
   │  ├─ login/page.tsx
   │  ├─ signup/page.tsx
   │  ├─ onboarding/page.tsx
   │  ├─ pricing/page.tsx
   │  ├─ dashboard/
   │  │  ├─ layout.tsx
   │  │  ├─ page.tsx
   │  │  ├─ review/page.tsx
   │  │  ├─ inquiry/page.tsx
   │  │  ├─ complaint/page.tsx
   │  │  ├─ history/page.tsx
   │  │  └─ settings/page.tsx
   │  └─ api/
   │     ├─ _helpers.ts
   │     ├─ auth/
   │     │  ├─ login/route.ts
   │     │  └─ signup/route.ts
   │     ├─ profile/route.ts
   │     ├─ usage/route.ts
   │     ├─ generations/route.ts
   │     ├─ billing/
   │     │  ├─ checkout/route.ts
   │     │  └─ status/route.ts
   │     └─ generate/
   │        ├─ review/route.ts
   │        ├─ inquiry/route.ts
   │        └─ complaint/route.ts
   ├─ components/
   │  ├─ auth/auth-form.tsx
   │  ├─ copy-button.tsx
   │  ├─ logout-button.tsx
   │  ├─ dashboard/sidebar.tsx
   │  ├─ generation/generation-form.tsx
   │  ├─ history/history-list.tsx
   │  └─ profile/profile-form.tsx
   ├─ lib/
   │  ├─ auth.ts
   │  ├─ env.ts
   │  ├─ errors.ts
   │  ├─ generation-service.ts
   │  ├─ openai.ts
   │  ├─ plans.ts
   │  ├─ prompts.ts
   │  ├─ schemas.ts
   │  ├─ usage.ts
   │  ├─ utils.ts
   │  └─ supabase/
   │     ├─ client.ts
   │     ├─ proxy.ts
   │     └─ server.ts
   └─ types/
      └─ app.ts
```

---

## 3. 1단계: 프로젝트 압축 해제

압축을 풀고 폴더로 이동합니다.

```bash
cd eungdae-doumi-starter
```

---

## 4. 2단계: 패키지 설치

```bash
npm install
```

설치가 끝나면 아직 실행하지 마세요.  
먼저 Supabase를 붙여야 합니다.

---

## 5. 3단계: Supabase 프로젝트 만들기

### 5-1. Supabase 새 프로젝트 생성
Supabase에서 새 프로젝트를 만듭니다.

### 5-2. URL / Publishable Key 복사
프로젝트의 API 설정에서 아래 2개를 복사합니다.

- Project URL
- Publishable key

이 값은 `.env.local`에 넣습니다.

---

## 6. 4단계: DB 스키마 적용

`supabase/schema.sql` 파일 내용을 Supabase SQL Editor에 그대로 붙여넣고 실행합니다.

이 SQL은 아래 테이블을 만듭니다.

- `profiles`
- `subscriptions`
- `usage_logs`
- `generations`

그리고 다음도 같이 설정합니다.

- updated_at 트리거
- RLS(Row Level Security)
- 본인 데이터만 읽고 쓰는 정책

---

## 7. 5단계: 환경변수 파일 만들기

프로젝트 루트에서 `.env.example`을 복사해 `.env.local`을 만듭니다.

```bash
cp .env.example .env.local
```

그 다음 `.env.local`을 열고 값을 채웁니다.

### 최소 필수값
```env
NEXT_PUBLIC_SUPABASE_URL=여기에_프로젝트_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=여기에_퍼블리셔블_키
OPENAI_API_KEY=여기에_OpenAI_API_키
OPENAI_MODEL=gpt-5.4
OPENAI_REASONING_EFFORT=low
```

### 권장 기본값
```env
NEXT_PUBLIC_APP_NAME=응대도우미
NEXT_PUBLIC_APP_URL=http://localhost:3000
FREE_DAILY_LIMIT=5
PRO_DAILY_LIMIT=9999
ENABLE_BILLING=false
NEXT_PUBLIC_ENABLE_BILLING=false
```

---

## 8. 6단계: 로컬 실행

```bash
npm run dev
```

브라우저에서 아래 주소로 접속합니다.

```text
http://localhost:3000
```

---

## 9. 7단계: 첫 사용 흐름

1. 회원가입
2. 업종 설정
3. 브랜드명 설정
4. 기본 말투 설정
5. 리뷰/문의/클레임 생성기 사용

처음에는 아래 순서로 테스트하세요.

### 테스트 1: 리뷰 답변
- 별점 5
- 리뷰: `배송이 빠르고 포장도 깔끔해서 만족했어요`

### 테스트 2: 문의 답변
- 문의 유형: 재입고
- 문의: `이 상품 재입고 언제 되나요?`

### 테스트 3: 클레임 대응
- 책임 여부: 일부 책임 있음
- 보상: 교환 가능
- 클레임: `포장이 찌그러져서 기분이 안 좋네요`

---

## 10. 각 파일이 무슨 역할인지

### `src/proxy.ts`
Next.js 요청 앞단에서 세션을 유지합니다.  
로그인 안 된 사용자가 `/dashboard`로 들어오면 `/login`으로 보냅니다.

### `src/lib/supabase/server.ts`
Server Component / Route Handler에서 쓸 Supabase 클라이언트입니다.

### `src/lib/supabase/client.ts`
브라우저에서 쓸 Supabase 클라이언트입니다.

### `src/lib/prompts.ts`
출력 품질 핵심 파일입니다.  
**실제로 답변 품질을 가장 많이 좌우하는 파일**입니다.

### `src/lib/generation-service.ts`
- 입력 검증
- 사용량 체크
- OpenAI 호출
- 품질 재검사
- DB 저장

이 흐름이 한 곳에 모여 있습니다.

### `supabase/schema.sql`
DB 스키마와 RLS 정책입니다.

---

## 11. 출력 품질을 높이는 핵심 지점

이 프로젝트에서 품질에 직접 영향을 주는 건 아래 6개입니다.

### 1) `OPENAI_MODEL`
좋은 모델일수록 결과가 안정적입니다.  
비용과 품질을 같이 보세요.

### 2) `OPENAI_REASONING_EFFORT`
`low` → 빠르고 저렴  
`medium` → 조금 더 안정적  
`high` → 비용과 속도는 불리하지만 더 신중한 답변

### 3) `src/lib/prompts.ts`
가장 중요한 파일입니다.  
여기서:
- 금지 표현
- 톤 규칙
- 업종별 규칙
- few-shot 예시
- 클레임 리스크 제어

를 만집니다.

### 4) `generationOutputSchema`
JSON 구조를 강제해서 결과가 무너지지 않게 합니다.

### 5) `quality guard`
`src/lib/generation-service.ts` 안에서  
서로 너무 비슷한 답변이 나오면 한 번 더 다시 생성하도록 해두었습니다.

### 6) 업종별 예시 추가
지금은 범용 예시입니다.  
실전에서는 네가 타겟 업종을 좁힐수록 품질이 올라갑니다.

예:
- 건강식품
- 패션 쇼핑몰
- 배달 카페
- 반찬가게
- 꽃집

---

## 12. 프롬프트를 어떻게 고쳐야 하나

### 가장 먼저 해야 할 일
`src/lib/prompts.ts`에서 **네가 실제로 타겟할 업종 1개**를 정하세요.

예를 들어 스마트스토어만 먼저 노리면:

- 배송지연
- 재입고
- 단순변심 환불
- 포장 불만
- 상품불량
- 오배송

이 6가지 상황 few-shot을 더 넣는 게 우선입니다.

### 좋지 않은 수정 방식
- 규칙만 계속 늘리기
- 예시는 적고 추상 규칙만 넣기
- 모든 업종을 한 프롬프트로 커버하려고 하기

### 좋은 수정 방식
- 업종을 좁힌다
- 실제 자주 나오는 고객 문장 예시를 모은다
- 각 상황마다 “좋은 답변 예시”를 2~3개 넣는다
- 금지해야 할 표현을 구체적으로 넣는다

예:
- `절대 "무조건", "항상", "100%" 같은 표현 금지`
- `확인되지 않은 환불 가능 여부 임의 확정 금지`
- `고객 탓하는 문장 금지`

---

## 13. 무료/유료 제한 구조

현재는 예시용으로 아래처럼 넣었습니다.

- 무료: 하루 5회
- 프로: 하루 9999회

실제로는 아래처럼 바꾸는 게 낫습니다.

- 무료: 하루 3회
- 베이직: 하루 50회
- 프로: 무제한 또는 300회

---

## 14. 결제 붙이기

현재 결제는 **stub 상태**입니다.

즉:
- `/api/billing/checkout`
- `/api/billing/status`

는 뼈대만 있고, 실제 결제사 연동은 안 되어 있습니다.

### 추천 순서
1. 먼저 결제 없이 MVP 검증
2. 실제 사용자가 반복 사용하면 결제 붙이기
3. 그 다음 subscription 테이블 갱신

### 결제 붙일 때 해야 할 것
- 결제 시작 API
- 성공/실패 콜백
- 웹훅
- `subscriptions.plan`, `status`, `expires_at` 업데이트

---

## 15. 배포 순서

### Vercel 배포 권장
1. GitHub에 업로드
2. Vercel import
3. Environment Variables 넣기
4. 배포
5. Supabase Auth Redirect URL 설정 추가

---

## 16. 실행이 안 될 때 체크리스트

### 1) 로그인은 되는데 dashboard가 안 열림
- `src/proxy.ts`가 있는지 확인
- env 값이 맞는지 확인
- Supabase URL / key 오타 확인

### 2) 회원가입은 되는데 데이터 저장이 안 됨
- `supabase/schema.sql` 실행했는지 확인
- RLS 정책이 생성됐는지 확인

### 3) 생성 버튼 누르면 500 에러
- `OPENAI_API_KEY` 확인
- `OPENAI_MODEL` 확인
- 서버 콘솔 로그 확인

### 4) 결과가 너무 뻔함
- `src/lib/prompts.ts` 수정
- few-shot 보강
- 타겟 업종 좁히기

---

## 17. 가장 먼저 손봐야 할 파일 우선순위

1. `.env.local`
2. `supabase/schema.sql`
3. `src/lib/prompts.ts`
4. `src/lib/generation-service.ts`
5. `src/components/generation/generation-form.tsx`

---

## 18. 실전적으로 더 좋게 바꾸는 다음 작업

### 1단계
- 스마트스토어 한 업종만 집중
- 부정 리뷰/문의/클레임 로그 수집

### 2단계
- 자주 나오는 문장 템플릿 저장 기능
- 브랜드 톤 저장 기능

### 3단계
- 네이버 스마트스토어 리뷰 복붙 워크플로우 최적화
- 생성 결과를 1클릭으로 다시 짧게/더 단호하게/더 부드럽게 변형

### 4단계
- 팀 계정
- 응대 이력 검색
- 실제 FAQ 템플릿 축적

---

## 19. 내가 추천하는 검증 순서

1. 일단 네가 직접 써본다
2. 실제 판매자 3명에게 써보게 한다
3. “좋다” 말고 “매일 쓸 것 같다”를 확인한다
4. 돈 내겠다는 사람 나올 때 결제 붙인다

---

## 20. 마지막 조언

이 프로젝트는 **UI보다 프롬프트와 실제 업종 데이터**가 더 중요합니다.  
초반에는 기능 추가보다 아래를 먼저 하세요.

- 실제 고객 문의 30개 모으기
- 실제 저별점 리뷰 30개 모으기
- 실제 클레임 30개 모으기
- 그걸 프롬프트 예시로 바꾸기

이 작업이 품질을 진짜 끌어올립니다.
