"use client";

import Link from "next/link";
import { useMemo } from "react";
import { FileText, CalendarDays, Plus, ArrowRight, Inbox } from "lucide-react";
import { useMeetings } from "@/lib/useMeetings";
import { useAuth } from "@/lib/useAuth";
import { formatKoreanDate } from "@/lib/format";

export default function HomePage() {
  const { meetings, loading, error } = useMeetings();
  const { isAdmin } = useAuth();
  const thisYear = new Date().getFullYear();

  const stats = useMemo(() => {
    const thisYearCount = meetings.filter((m) => m.year === thisYear).length;
    return { total: meetings.length, thisYearCount };
  }, [meetings, thisYear]);

  const recent = meetings.slice(0, 8);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">회의록 아카이브</h1>
        <p className="mt-1 text-sm text-muted">
          주간 회의록을 연도 · 월 폴더로 정리합니다. 왼쪽 폴더에서 회의록을
          선택하세요.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          데이터를 불러오지 못했습니다: {error}
          <br />
          Firebase 설정과 Firestore 보안 규칙을 확인하세요.
        </div>
      )}

      {/* 통계 */}
      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <StatCard
          icon={<FileText size={18} />}
          label="전체 회의록"
          value={stats.total}
        />
        <StatCard
          icon={<CalendarDays size={18} />}
          label={`${thisYear}년 회의록`}
          value={stats.thisYearCount}
        />
      </div>

      {loading ? (
        <p className="text-sm text-muted">불러오는 중…</p>
      ) : meetings.length === 0 ? (
        <EmptyHome isAdmin={isAdmin} />
      ) : (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-muted">최근 회의록</h2>
          <ul className="space-y-2">
            {recent.map((m) => (
              <li key={m.id}>
                <Link
                  href={`/meetings/${m.id}`}
                  className="group flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3 transition hover:border-border-strong"
                >
                  <FileText size={16} className="shrink-0 text-muted" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{m.title}</p>
                    <p className="text-xs text-muted">
                      {formatKoreanDate(m.meetingDate)}
                    </p>
                  </div>
                  <ArrowRight
                    size={16}
                    className="shrink-0 text-muted opacity-0 transition group-hover:opacity-100"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface px-4 py-4">
      <div className="mb-2 flex items-center gap-2 text-muted">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  );
}

function EmptyHome({ isAdmin }: { isAdmin: boolean }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-surface px-6 py-14 text-center">
      <Inbox size={40} className="mx-auto mb-4 text-muted" />
      <h2 className="mb-1 font-medium">아직 회의록이 없습니다</h2>
      <p className="mb-5 text-sm text-muted">
        {isAdmin
          ? "첫 회의록을 업로드해 아카이브를 시작하세요."
          : "관리자로 로그인하면 회의록을 업로드할 수 있습니다."}
      </p>
      {isAdmin ? (
        <Link
          href="/meetings/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-fg hover:opacity-90"
        >
          <Plus size={16} />첫 회의록 작성
        </Link>
      ) : (
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm hover:bg-hover"
        >
          관리자 로그인
        </Link>
      )}
    </div>
  );
}
