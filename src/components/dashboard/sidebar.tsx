"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AppProfile } from "@/types/app";
import { cx, formatBusinessType, formatTone } from "@/lib/utils";
import { LogoutButton } from "@/components/logout-button";

interface SidebarProps {
  profile: AppProfile;
  appName: string;
}

const links = [
  { href: "/dashboard", label: "대시보드" },
  { href: "/dashboard/review", label: "리뷰 답변 생성" },
  { href: "/dashboard/inquiry", label: "문의 답변 생성" },
  { href: "/dashboard/complaint", label: "클레임 대응 생성" },
  { href: "/dashboard/history", label: "생성 이력" },
  { href: "/dashboard/settings", label: "설정" },
];

export function Sidebar({ profile, appName }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="stack">
        <div className="stack-sm">
          <Link href="/" className="brand-mark">
            {appName}
          </Link>
          <div className="card subtle-card">
            <div className="stack-xs">
              <strong>{profile.brand_name || "브랜드명 미설정"}</strong>
              <span className="muted">{formatBusinessType(profile.business_type)}</span>
              <span className="muted">{formatTone(profile.default_tone)}</span>
            </div>
          </div>
        </div>

        <nav className="stack-xs">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link key={link.href} href={link.href} className={cx("nav-link", active && "active")}>
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-spacer" />

        <LogoutButton />
      </div>
    </aside>
  );
}
