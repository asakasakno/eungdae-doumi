"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import type { AppProfile, BusinessType, Tone } from "@/types/app";

interface ProfileFormProps {
  initialProfile: AppProfile;
  mode: "onboarding" | "settings";
}

const businessTypeOptions: Array<{ value: BusinessType; label: string }> = [
  { value: "smartstore", label: "스마트스토어" },
  { value: "delivery", label: "배달/음식점" },
  { value: "cafe", label: "카페" },
  { value: "offline", label: "오프라인 매장" },
  { value: "etc", label: "기타" },
];

const toneOptions: Array<{ value: Tone; label: string }> = [
  { value: "friendly", label: "친절형" },
  { value: "formal", label: "정중형" },
  { value: "plain", label: "담백형" },
  { value: "firm", label: "단호형" },
];

export function ProfileForm({ initialProfile, mode }: ProfileFormProps) {
  const router = useRouter();
  const [businessType, setBusinessType] = useState<BusinessType>(
    initialProfile.business_type ?? "smartstore",
  );
  const [brandName, setBrandName] = useState(initialProfile.brand_name ?? "");
  const [defaultTone, setDefaultTone] = useState<Tone>(initialProfile.default_tone ?? "formal");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setErrorMessage("");

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          business_type: businessType,
          brand_name: brandName,
          default_tone: defaultTone,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setErrorMessage(data.message ?? "저장에 실패했습니다.");
        return;
      }

      setMessage(data.message ?? "저장되었습니다.");

      if (mode === "onboarding") {
        router.push("/dashboard");
      } else {
        router.refresh();
      }
    } catch {
      setErrorMessage("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="card stack" onSubmit={handleSubmit}>
      <div className="stack-sm">
        <h2>{mode === "onboarding" ? "기본 설정" : "프로필 설정"}</h2>
        <p className="muted">
          업종과 기본 톤을 먼저 정해야 생성 품질이 안정적으로 나옵니다.
        </p>
      </div>

      <label className="field">
        <span className="label">업종</span>
        <select className="input" value={businessType} onChange={(event) => setBusinessType(event.target.value as BusinessType)}>
          {businessTypeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span className="label">브랜드명 (선택)</span>
        <input
          className="input"
          value={brandName}
          onChange={(event) => setBrandName(event.target.value)}
          placeholder="예: 늘품스토어"
        />
      </label>

      <label className="field">
        <span className="label">기본 말투</span>
        <select className="input" value={defaultTone} onChange={(event) => setDefaultTone(event.target.value as Tone)}>
          {toneOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      {errorMessage ? <div className="notice error">{errorMessage}</div> : null}
      {message ? <div className="notice success">{message}</div> : null}

      <button className="button primary" type="submit" disabled={loading}>
        {loading ? "저장 중..." : mode === "onboarding" ? "설정 저장 후 시작하기" : "설정 저장"}
      </button>
    </form>
  );
}
