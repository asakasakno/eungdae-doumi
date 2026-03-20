"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type AuthMode = "login" | "signup";

interface AuthFormProps {
  mode: AuthMode;
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  const isLogin = mode === "login";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setErrorMessage("");
    setInfoMessage("");

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setErrorMessage(data.message ?? "요청 처리에 실패했습니다.");
        return;
      }

      if (data.requiresEmailConfirmation) {
        setInfoMessage(data.message ?? "인증 메일을 확인한 뒤 로그인해 주세요.");
        return;
      }

      router.push(data.redirectTo ?? "/dashboard");
      router.refresh();
    } catch {
      setErrorMessage("네트워크 오류가 발생했습니다. 잠시 후 다시 시도하세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card auth-card">
      <div className="stack-sm">
        <span className="badge">{isLogin ? "로그인" : "회원가입"}</span>
        <h1>{isLogin ? "계정에 로그인" : "새 계정 만들기"}</h1>
        <p className="muted">
          {isLogin
            ? "로그인하면 리뷰/문의/클레임 생성기를 바로 사용할 수 있습니다."
            : "가입 후 업종과 기본 톤을 설정하면 바로 사용할 수 있습니다."}
        </p>
      </div>

      <form className="stack" onSubmit={handleSubmit}>
        <label className="field">
          <span className="label">이메일</span>
          <input
            className="input"
            type="email"
            placeholder="seller@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>

        <label className="field">
          <span className="label">비밀번호</span>
          <input
            className="input"
            type="password"
            placeholder="8자 이상"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={8}
            required
          />
        </label>

        {errorMessage ? <div className="notice error">{errorMessage}</div> : null}
        {infoMessage ? <div className="notice success">{infoMessage}</div> : null}

        <button className="button primary" type="submit" disabled={loading}>
          {loading ? "처리 중..." : isLogin ? "로그인" : "회원가입"}
        </button>
      </form>

      <div className="divider" />

      <p className="muted">
        {isLogin ? "아직 계정이 없나요?" : "이미 계정이 있나요?"}{" "}
        <Link className="text-link" href={isLogin ? "/signup" : "/login"}>
          {isLogin ? "회원가입으로 이동" : "로그인으로 이동"}
        </Link>
      </p>
    </div>
  );
}
