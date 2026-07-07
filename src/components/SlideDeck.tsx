"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Tag, CalendarDays, Sparkles } from "lucide-react";
import { Markdown } from "./Markdown";
import { ActionItems } from "./ActionItems";
import { Attachments } from "./Attachments";
import { formatKoreanDate } from "@/lib/format";
import type { Meeting } from "@/lib/types";

type Slide =
  | { kind: "title" }
  | { kind: "content"; md: string }
  | { kind: "actions" }
  | { kind: "attachments" };

// 본문을 슬라이드로 분할: 1) '---' 구분선 우선, 2) 없으면 ## 제목 단위, 3) 둘 다 없으면 한 장
function splitBody(body: string): string[] {
  const t = body.trim();
  if (!t) return [];
  const ruleRe = /^\s*(?:---|\*\*\*|___)\s*$/m;
  if (ruleRe.test(t)) {
    return t
      .split(/^\s*(?:---|\*\*\*|___)\s*$/m)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (/^##\s+/m.test(t)) {
    return t
      .split(/(?=^##\s+)/m)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [t];
}

function buildSlides(meeting: Meeting): Slide[] {
  const slides: Slide[] = [{ kind: "title" }];
  for (const md of splitBody(meeting.body)) slides.push({ kind: "content", md });
  if (meeting.actionItems.length) slides.push({ kind: "actions" });
  if (meeting.attachments.length) slides.push({ kind: "attachments" });
  return slides;
}

export function SlideDeck({
  meeting,
  canEdit,
}: {
  meeting: Meeting;
  canEdit: boolean;
}) {
  const slides = useMemo(() => buildSlides(meeting), [meeting]);
  const total = slides.length;
  const [i, setI] = useState(0);

  // 회의록이 바뀌면 첫 슬라이드로
  useEffect(() => {
    setI(0);
  }, [meeting.id]);

  // 인덱스가 범위를 벗어나면 보정 (실시간 편집으로 슬라이드 수가 줄어드는 경우)
  useEffect(() => {
    if (i > total - 1) setI(Math.max(0, total - 1));
  }, [i, total]);

  // 키보드 내비게이션 — document 전역 바인딩 + preventDefault(Safari 히스토리 스와이프 방지)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const tag = el?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || el?.isContentEditable) return;
      if (e.key === "ArrowRight" || e.key === "PageDown") {
        e.preventDefault();
        setI((p) => Math.min(total - 1, p + 1));
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        setI((p) => Math.max(0, p - 1));
      } else if (e.key === "Home") {
        e.preventDefault();
        setI(0);
      } else if (e.key === "End") {
        e.preventDefault();
        setI(total - 1);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [total]);

  const slide = slides[Math.min(i, total - 1)];
  const atFirst = i <= 0;
  const atLast = i >= total - 1;

  return (
    <div className="flex h-full flex-col">
      {/* 슬라이드 영역 */}
      <div className="relative flex-1 min-h-0">
        <div className="h-full overflow-y-auto">
          <div className="mx-auto flex min-h-full max-w-3xl flex-col justify-center px-6 py-10 sm:px-10">
            {slide?.kind === "title" && <TitleSlide meeting={meeting} />}
            {slide?.kind === "content" && (
              <div className="prose prose-lg">
                <Markdown>{slide.md}</Markdown>
              </div>
            )}
            {slide?.kind === "actions" && (
              <ActionItems meeting={meeting} canEdit={canEdit} />
            )}
            {slide?.kind === "attachments" && (
              <Attachments attachments={meeting.attachments} />
            )}
          </div>
        </div>

        {/* 좌우 이동 버튼 (데스크톱) */}
        {!atFirst && (
          <button
            onClick={() => setI((p) => Math.max(0, p - 1))}
            aria-label="이전 슬라이드"
            className="absolute left-2 top-1/2 hidden -translate-y-1/2 rounded-full border border-border bg-surface/80 p-2 text-muted backdrop-blur hover:text-foreground sm:block"
          >
            <ChevronLeft size={22} />
          </button>
        )}
        {!atLast && (
          <button
            onClick={() => setI((p) => Math.min(total - 1, p + 1))}
            aria-label="다음 슬라이드"
            className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-full border border-border bg-surface/80 p-2 text-muted backdrop-blur hover:text-foreground sm:block"
          >
            <ChevronRight size={22} />
          </button>
        )}
      </div>

      {/* 하단 내비게이션 */}
      <nav className="flex shrink-0 items-center gap-3 border-t border-border bg-surface px-4 py-2.5">
        <button
          onClick={() => setI((p) => Math.max(0, p - 1))}
          disabled={atFirst}
          className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-sm hover:bg-hover disabled:opacity-40"
        >
          <ChevronLeft size={15} /> 이전
        </button>

        {/* 점 인디케이터 */}
        <div className="flex flex-1 items-center justify-center gap-1.5 overflow-hidden">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setI(idx)}
              aria-label={`${idx + 1}번 슬라이드`}
              className={`h-1.5 rounded-full transition-all ${
                idx === i ? "w-5 bg-accent" : "w-1.5 bg-border-strong hover:bg-muted"
              }`}
            />
          ))}
        </div>

        <span className="shrink-0 text-xs tabular-nums text-muted">
          {i + 1} / {total}
        </span>
        <button
          onClick={() => setI((p) => Math.min(total - 1, p + 1))}
          disabled={atLast}
          className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-sm hover:bg-hover disabled:opacity-40"
        >
          다음 <ChevronRight size={15} />
        </button>
      </nav>
    </div>
  );
}

function TitleSlide({ meeting }: { meeting: Meeting }) {
  return (
    <div className="text-center">
      <p className="mb-3 flex items-center justify-center gap-1.5 text-sm text-muted">
        <CalendarDays size={15} />
        {formatKoreanDate(meeting.meetingDate)}
      </p>
      <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
        {meeting.title}
      </h1>
      {meeting.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
          <Tag size={14} className="text-muted" />
          {meeting.tags.map((t) => (
            <span
              key={t}
              className="rounded-full bg-hover px-2.5 py-0.5 text-xs text-foreground/80"
            >
              {t}
            </span>
          ))}
        </div>
      )}
      {meeting.summary && (
        <div className="mx-auto mt-8 max-w-xl rounded-xl border border-accent/30 bg-accent-soft px-5 py-4 text-left">
          <div className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-accent">
            <Sparkles size={15} /> AI 요약
          </div>
          <div className="prose prose-sm">
            <Markdown>{meeting.summary}</Markdown>
          </div>
        </div>
      )}
    </div>
  );
}
