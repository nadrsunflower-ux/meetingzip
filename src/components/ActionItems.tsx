"use client";

import { useState } from "react";
import { Check, ListChecks } from "lucide-react";
import { toggleActionItem } from "@/lib/meetings";
import type { Meeting } from "@/lib/types";

export function ActionItems({
  meeting,
  canEdit,
}: {
  meeting: Meeting;
  canEdit: boolean;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  if (meeting.actionItems.length === 0) return null;

  const doneCount = meeting.actionItems.filter((a) => a.done).length;

  const onToggle = async (id: string) => {
    if (!canEdit || busy) return;
    setBusy(id);
    try {
      await toggleActionItem(meeting, id);
    } catch {
      // 실시간 구독이 최신 상태를 되돌려줌
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="mt-8">
      <div className="mb-3 flex items-center gap-2">
        <ListChecks size={16} className="text-accent" />
        <h2 className="text-sm font-semibold">
          액션 아이템
          <span className="ml-2 font-normal text-muted">
            {doneCount}/{meeting.actionItems.length} 완료
          </span>
        </h2>
      </div>
      <ul className="space-y-1.5">
        {meeting.actionItems.map((it) => (
          <li key={it.id}>
            <button
              type="button"
              disabled={!canEdit || busy === it.id}
              onClick={() => onToggle(it.id)}
              className={`flex w-full items-start gap-2.5 rounded-lg border border-border bg-surface px-3 py-2.5 text-left transition ${
                canEdit ? "hover:border-border-strong" : "cursor-default"
              }`}
            >
              <span
                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                  it.done
                    ? "border-accent bg-accent text-accent-fg"
                    : "border-border-strong"
                }`}
              >
                {it.done && <Check size={12} strokeWidth={3} />}
              </span>
              <span
                className={`text-sm ${
                  it.done ? "text-muted line-through" : ""
                }`}
              >
                {it.content}
              </span>
            </button>
          </li>
        ))}
      </ul>
      {!canEdit && (
        <p className="mt-2 text-xs text-muted">
          체크 상태 변경은 관리자 로그인 후 가능합니다.
        </p>
      )}
    </section>
  );
}
