"use client";

import { Paperclip, Download, FileText, ImageIcon } from "lucide-react";
import { formatBytes } from "@/lib/format";
import type { Attachment } from "@/lib/types";

export function Attachments({ attachments }: { attachments: Attachment[] }) {
  if (attachments.length === 0) return null;
  return (
    <section className="mt-8">
      <div className="mb-3 flex items-center gap-2">
        <Paperclip size={16} className="text-accent" />
        <h2 className="text-sm font-semibold">첨부파일</h2>
      </div>
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {attachments.map((a) => (
          <li key={a.path}>
            <a
              href={a.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2.5 transition hover:border-border-strong"
            >
              {a.type.startsWith("image/") ? (
                <ImageIcon size={18} className="shrink-0 text-muted" />
              ) : (
                <FileText size={18} className="shrink-0 text-muted" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{a.name}</p>
                <p className="text-xs text-muted">{formatBytes(a.size)}</p>
              </div>
              <Download
                size={16}
                className="shrink-0 text-muted opacity-0 transition group-hover:opacity-100"
              />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
