"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import {
  ChevronRight,
  Folder,
  FolderOpen,
  FileText,
  Plus,
  X,
  Archive,
} from "lucide-react";
import { useMeetings } from "@/lib/useMeetings";
import { useAuth } from "@/lib/useAuth";
import { groupByYearMonth } from "@/lib/format";

export function Sidebar({
  mobileOpen,
  onClose,
}: {
  mobileOpen: boolean;
  onClose: () => void;
}) {
  const { meetings, loading } = useMeetings();
  const { isAdmin } = useAuth();
  const params = useParams<{ id?: string }>();
  const activeId = params?.id;

  const groups = useMemo(() => groupByYearMonth(meetings), [meetings]);
  const activeMeeting = useMemo(
    () => meetings.find((m) => m.id === activeId),
    [meetings, activeId]
  );

  const [expandedYears, setExpandedYears] = useState<Set<number>>(new Set());
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

  // 최신(또는 지금 보고 있는) 폴더를 펼침. 다른 달의 회의록으로 이동하면 그 폴더도 자동으로 펼쳐짐.
  useEffect(() => {
    if (groups.length === 0) return;
    const y = activeMeeting?.year ?? groups[0].year;
    const mo = activeMeeting?.month ?? groups[0].months[0]?.month;
    setExpandedYears((prev) => (prev.has(y) ? prev : new Set(prev).add(y)));
    if (mo) {
      const key = `${y}-${mo}`;
      setExpandedMonths((prev) =>
        prev.has(key) ? prev : new Set(prev).add(key)
      );
    }
  }, [groups, activeMeeting]);

  const toggleYear = (y: number) =>
    setExpandedYears((prev) => {
      const next = new Set(prev);
      next.has(y) ? next.delete(y) : next.add(y);
      return next;
    });

  const toggleMonth = (key: string) =>
    setExpandedMonths((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  return (
    <>
      {/* 모바일 오버레이 */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-border bg-surface transition-transform md:static md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* 브랜드 */}
        <div className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border px-4">
          <Link
            href="/"
            onClick={onClose}
            className="flex items-center gap-2 font-semibold"
          >
            <Archive size={18} className="text-accent" />
            <span>회의록 아카이브</span>
          </Link>
          <button
            className="rounded-md p-1 hover:bg-hover md:hidden"
            onClick={onClose}
            aria-label="닫기"
          >
            <X size={18} />
          </button>
        </div>

        {/* 새 회의록 (관리자) */}
        {isAdmin && (
          <div className="px-3 pt-3">
            <Link
              href="/meetings/new"
              onClick={onClose}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-fg transition hover:opacity-90"
            >
              <Plus size={16} />새 회의록
            </Link>
          </div>
        )}

        {/* 폴더 트리 */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 text-sm">
          {loading ? (
            <p className="px-3 py-2 text-muted">불러오는 중…</p>
          ) : groups.length === 0 ? (
            <p className="px-3 py-6 text-center text-xs text-muted">
              아직 회의록이 없습니다.
            </p>
          ) : (
            groups.map((yg) => {
              const yearOpen = expandedYears.has(yg.year);
              return (
                <div key={yg.year} className="mb-0.5">
                  <button
                    onClick={() => toggleYear(yg.year)}
                    className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left font-medium hover:bg-hover"
                  >
                    <ChevronRight
                      size={14}
                      className={`shrink-0 text-muted transition-transform ${
                        yearOpen ? "rotate-90" : ""
                      }`}
                    />
                    {yearOpen ? (
                      <FolderOpen size={16} className="shrink-0 text-accent" />
                    ) : (
                      <Folder size={16} className="shrink-0 text-muted" />
                    )}
                    <span>{yg.year}년</span>
                    <span className="ml-auto text-xs text-muted">{yg.count}</span>
                  </button>

                  {yearOpen &&
                    yg.months.map((mg) => {
                      const key = `${yg.year}-${mg.month}`;
                      const monthOpen = expandedMonths.has(key);
                      return (
                        <div key={key} className="ml-3">
                          <button
                            onClick={() => toggleMonth(key)}
                            className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left hover:bg-hover"
                          >
                            <ChevronRight
                              size={14}
                              className={`shrink-0 text-muted transition-transform ${
                                monthOpen ? "rotate-90" : ""
                              }`}
                            />
                            {monthOpen ? (
                              <FolderOpen size={15} className="shrink-0 text-accent/80" />
                            ) : (
                              <Folder size={15} className="shrink-0 text-muted" />
                            )}
                            <span>{mg.month}월</span>
                            <span className="ml-auto text-xs text-muted">
                              {mg.meetings.length}
                            </span>
                          </button>

                          {monthOpen && (
                            <ul className="ml-4 border-l border-border">
                              {mg.meetings.map((m) => {
                                const active = m.id === activeId;
                                return (
                                  <li key={m.id}>
                                    <Link
                                      href={`/meetings/${m.id}`}
                                      onClick={onClose}
                                      className={`flex items-center gap-1.5 rounded-md py-1.5 pl-3 pr-2 ${
                                        active
                                          ? "bg-accent-soft font-medium text-accent"
                                          : "text-foreground/90 hover:bg-hover"
                                      }`}
                                    >
                                      <FileText
                                        size={14}
                                        className="shrink-0 opacity-70"
                                      />
                                      <span className="truncate">{m.title}</span>
                                    </Link>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </div>
                      );
                    })}
                </div>
              );
            })
          )}
        </nav>
      </aside>
    </>
  );
}
