"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { SearchX, FileText } from "lucide-react";
import { useMeetings } from "@/lib/useMeetings";
import { formatKoreanDate } from "@/lib/format";
import type { Meeting } from "@/lib/types";

export default function SearchPage() {
  return (
    <Suspense
      fallback={<div className="p-8 text-sm text-muted">검색 준비 중…</div>}
    >
      <SearchResults />
    </Suspense>
  );
}

function haystack(m: Meeting): string {
  return [
    m.title,
    m.body,
    m.summary ?? "",
    m.tags.join(" "),
    m.actionItems.map((a) => a.content).join(" "),
  ]
    .join("\n")
    .toLowerCase();
}

// 본문에서 검색어 주변 문맥을 잘라 하이라이트용 조각으로 반환
function snippet(text: string, needle: string): { pre: string; hit: string; post: string } | null {
  const lower = text.toLowerCase();
  const idx = lower.indexOf(needle);
  if (idx === -1) return null;
  const start = Math.max(0, idx - 40);
  const end = Math.min(text.length, idx + needle.length + 80);
  return {
    pre: (start > 0 ? "…" : "") + text.slice(start, idx),
    hit: text.slice(idx, idx + needle.length),
    post: text.slice(idx + needle.length, end) + (end < text.length ? "…" : ""),
  };
}

function SearchResults() {
  const params = useSearchParams();
  const q = (params.get("q") ?? "").trim();
  const needle = q.toLowerCase();
  const { meetings, loading } = useMeetings();

  const results = useMemo(() => {
    if (!needle) return [];
    return meetings.filter((m) => haystack(m).includes(needle));
  }, [meetings, needle]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="mb-1 text-xl font-semibold">검색</h1>
      <p className="mb-6 text-sm text-muted">
        {q ? (
          <>
            “<span className="text-foreground">{q}</span>” 검색 결과 ·{" "}
            {results.length}건
          </>
        ) : (
          "상단 검색창에 키워드를 입력하세요."
        )}
      </p>

      {loading ? (
        <p className="text-sm text-muted">불러오는 중…</p>
      ) : q && results.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-6 py-14 text-center">
          <SearchX size={36} className="mx-auto mb-3 text-muted" />
          <p className="text-sm text-muted">일치하는 회의록이 없습니다.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {results.map((m) => {
            const snip = snippet(m.body || m.summary || "", needle);
            return (
              <li key={m.id}>
                <Link
                  href={`/meetings/${m.id}`}
                  className="block rounded-lg border border-border bg-surface px-4 py-3 transition hover:border-border-strong"
                >
                  <div className="flex items-center gap-2">
                    <FileText size={15} className="shrink-0 text-muted" />
                    <span className="font-medium">{m.title}</span>
                    <span className="ml-auto shrink-0 text-xs text-muted">
                      {formatKoreanDate(m.meetingDate)}
                    </span>
                  </div>
                  {snip && (
                    <p className="mt-1.5 line-clamp-2 pl-6 text-sm text-muted">
                      {snip.pre}
                      <mark className="rounded bg-accent-soft px-0.5 text-accent">
                        {snip.hit}
                      </mark>
                      {snip.post}
                    </p>
                  )}
                  {m.tags.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1 pl-6">
                      {m.tags.map((t) => (
                        <span
                          key={t}
                          className="rounded-full bg-hover px-2 py-0.5 text-xs text-muted"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
