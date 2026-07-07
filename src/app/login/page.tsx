"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogIn, Loader2, Archive } from "lucide-react";
import { useAuth } from "@/lib/useAuth";

function mapAuthError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? "";
  switch (code) {
    case "auth/invalid-email":
      return "이메일 형식이 올바르지 않습니다.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "이메일 또는 비밀번호가 올바르지 않습니다.";
    case "auth/too-many-requests":
      return "시도가 너무 많습니다. 잠시 후 다시 시도하세요.";
    case "auth/network-request-failed":
      return "네트워크 오류입니다. 연결을 확인하세요.";
    default:
      return "로그인에 실패했습니다. " + (code || (err as Error)?.message || "");
  }
}

export default function LoginPage() {
  const { signIn, isAdmin, loading } = useAuth();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && isAdmin) router.replace("/");
  }, [loading, isAdmin, router]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await signIn(password);
      router.replace("/");
    } catch (err) {
      setError(mapAuthError(err));
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      <div className="mb-6 flex flex-col items-center gap-2 text-center">
        <Archive size={28} className="text-accent" />
        <h1 className="text-lg font-semibold">관리자 로그인</h1>
        <p className="text-sm text-muted">
          회의록 업로드 · 편집은 관리자만 가능합니다.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="rounded-xl border border-border bg-surface p-5"
      >
        {error && (
          <div className="mb-4 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </div>
        )}
        <label className="mb-4 block">
          <span className="mb-1 block text-sm font-medium">비밀번호</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoFocus
            autoComplete="current-password"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <LogIn size={15} />
          )}
          로그인
        </button>
      </form>

      <div className="mt-4 text-center">
        <Link href="/" className="text-sm text-muted hover:text-foreground">
          ← 회의록 둘러보기
        </Link>
      </div>
    </div>
  );
}
