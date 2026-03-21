1) 아래 파일 4개를 기존 프로젝트의 같은 경로에 덮어쓰기/추가하세요.
- src/lib/review-capture-service.ts (신규)
- src/app/api/generate/review-capture/route.ts (신규)
- src/components/generation/review-capture-form.tsx (신규)
- src/app/dashboard/review/page.tsx (덮어쓰기)

2) 추가 패키지 설치는 필요 없습니다.
3) 이 기능은 기존 /api/generate/review 로직을 그대로 재사용합니다.
4) OCR/비전 모델은 env.openAIModel이 gpt-4o 계열이면 그대로 쓰고, 아니면 자동으로 gpt-4o-mini를 사용합니다.
5) 배포 전후로 이미지를 업로드해서 테스트하세요.
