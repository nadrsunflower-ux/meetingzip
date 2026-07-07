"use client";

import { useState } from "react";
import { Markdown } from "./Markdown";

export function MarkdownEditor({
  value,
  onChange,
  placeholder,
  rows = 16,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  const [tab, setTab] = useState<"write" | "preview">("write");

  return (
    <div className="rounded-lg border border-border bg-surface">
      <div className="flex items-center border-b border-border">
        <TabButton active={tab === "write"} onClick={() => setTab("write")}>
          작성
        </TabButton>
        <TabButton active={tab === "preview"} onClick={() => setTab("preview")}>
          미리보기
        </TabButton>
        <span className="ml-auto px-3 text-xs text-muted">마크다운 지원</span>
      </div>
      {tab === "write" ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          placeholder={placeholder}
          className="w-full resize-y bg-transparent px-3 py-3 font-mono text-sm leading-relaxed outline-none"
        />
      ) : (
        <div className="min-h-[16rem] px-4 py-3">
          {value.trim() ? (
            <Markdown>{value}</Markdown>
          ) : (
            <p className="text-sm text-muted">미리볼 내용이 없습니다.</p>
          )}
        </div>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border-b-2 px-4 py-2 text-sm transition ${
        active
          ? "border-accent font-medium text-foreground"
          : "border-transparent text-muted hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
