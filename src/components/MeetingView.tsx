"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Sparkles, Presentation, FileText } from "lucide-react";
import { Markdown } from "./Markdown";
import { ActionItems } from "./ActionItems";
import { Attachments } from "./Attachments";
import { SlideDeck } from "./SlideDeck";
import { deleteMeeting } from "@/lib/meetings";
import { formatKoreanDate } from "@/lib/format";
import { useAuth } from "@/lib/useAuth";
import type { Meeting } from "@/lib/types";

export function MeetingView({ meeting }: { meeting: Meeting }) {
  const { isAdmin } = useAuth();
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [mode, setMode] = useState<"slides" | "doc">("slides");

  const onDelete = async () => {
    if (!confirm(`"${meeting.title}" 회의록을 삭제할까요? 되돌릴 수 없습니다.`))
      return;
    setDeleting(true);
    try {
      await deleteMeeting(meeting);
      router.push("/");
    } catch (e) {
      alert("삭제 실패: " + (e as Error).message);
      setDeleting(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* 상단 바 */}
      <header className="flex shrink-0 items-center gap-3 border-b border-border bg-surface px-4 py-2.5">
        <div className="min-w-0">
          <h1 className="truncate font-semibold" title={meeting.title}>
            {meeting.title}
          </h1>
          <p className="truncate text-xs text-muted">
            {formatKoreanDate(meeting.meetingDate)}
            {meeting.tags.length > 0 && ` · ${meeting.tags.join(", ")}`}
          </p>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          {/* 보기 전환 */}
          <div className="flex rounded-lg border border-border p-0.5">
            <button
              onClick={() => setMode("slides")}
              className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs ${
                mode === "slides"
                  ? "bg-accent text-accent-fg"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <Presentation size={13} />
              <span className="hidden sm:inline">슬라이드</span>
            </button>
            <button
              onClick={() => setMode("doc")}
              className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs ${
                mode === "doc"
                  ? "bg-accent text-accent-fg"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <FileText size={13} />
              <span className="hidden sm:inline">문서</span>
            </button>
          </div>

          {isAdmin && (
            <>
              <Link
                href={`/meetings/${meeting.id}/edit`}
                className="flex items-center gap-1 rounded-lg border border-border px-2 py-1.5 text-sm hover:bg-hover"
              >
                <Pencil size={14} />
                <span className="hidden md:inline">편집</span>
              </Link>
              <button
                onClick={onDelete}
                disabled={deleting}
                className="flex items-center gap-1 rounded-lg border border-border px-2 py-1.5 text-sm text-danger hover:bg-danger/10 disabled:opacity-50"
              >
                <Trash2 size={14} />
                <span className="hidden md:inline">
                  {deleting ? "삭제 중…" : "삭제"}
                </span>
              </button>
            </>
          )}
        </div>
      </header>

      {/* 본문: 슬라이드 or 문서 */}
      {mode === "slides" ? (
        <div className="flex-1 min-h-0">
          <SlideDeck meeting={meeting} canEdit={isAdmin} />
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto">
          <article className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
            {meeting.summary && (
              <div className="mb-8 rounded-xl border border-accent/30 bg-accent-soft px-4 py-4">
                <div className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-accent">
                  <Sparkles size={15} /> AI 요약
                </div>
                <div className="prose prose-sm">
                  <Markdown>{meeting.summary}</Markdown>
                </div>
              </div>
            )}
            {meeting.body.trim() ? (
              <Markdown>{meeting.body}</Markdown>
            ) : (
              <p className="text-sm text-muted">본문이 없습니다.</p>
            )}
            <ActionItems meeting={meeting} canEdit={isAdmin} />
            <Attachments attachments={meeting.attachments} />
            <footer className="mt-10 border-t border-border pt-4 text-xs text-muted">
              {meeting.updatedAt
                ? `최종 수정: ${new Date(meeting.updatedAt).toLocaleString("ko-KR")}`
                : null}
            </footer>
          </article>
        </div>
      )}
    </div>
  );
}
