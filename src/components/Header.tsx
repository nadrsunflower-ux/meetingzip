"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Menu, Search, LogIn, LogOut } from "lucide-react";
import { useAuth } from "@/lib/useAuth";

export function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const { isAdmin, logout, loading } = useAuth();
  const router = useRouter();
  const [q, setQ] = useState("");

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    if (term) router.push(`/search?q=${encodeURIComponent(term)}`);
  };

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-surface px-3 sm:px-4">
      <button
        className="rounded-md p-2 hover:bg-hover md:hidden"
        onClick={onMenuClick}
        aria-label="메뉴 열기"
      >
        <Menu size={20} />
      </button>

      <form onSubmit={onSubmit} className="relative w-full max-w-md">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
        />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          type="search"
          placeholder="회의록 검색…"
          className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-accent"
        />
      </form>

      <div className="ml-auto">
        {loading ? (
          <div className="h-8 w-16" />
        ) : isAdmin ? (
          <button
            onClick={() => logout()}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-hover"
          >
            <LogOut size={15} />
            <span className="hidden sm:inline">로그아웃</span>
          </button>
        ) : (
          <Link
            href="/login"
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-hover"
          >
            <LogIn size={15} />
            <span className="hidden sm:inline">관리자 로그인</span>
          </Link>
        )}
      </div>
    </header>
  );
}
