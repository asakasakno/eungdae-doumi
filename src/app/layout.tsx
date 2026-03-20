import type { Metadata } from "next";
import { env } from "@/lib/env";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: `${env.appName} | 고객응대 자동화`,
  description: "리뷰 답변, 고객 문의, 클레임 대응 문장을 10초 만에 생성하는 소상공인용 응대 도우미",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
