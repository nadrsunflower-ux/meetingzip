"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Plus,
  X,
  Upload,
  Save,
  Paperclip,
  Loader2,
  ListChecks,
} from "lucide-react";
import { MarkdownEditor } from "./MarkdownEditor";
import {
  createMeeting,
  updateMeeting,
  uploadAttachment,
  removeAttachment,
} from "@/lib/meetings";
import { formatBytes } from "@/lib/format";
import { useAuth } from "@/lib/useAuth";
import { auth } from "@/lib/firebase";
import type { ActionItem, Attachment, Meeting, MeetingInput } from "@/lib/types";

function todayYMD(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function MeetingForm({ meeting }: { meeting?: Meeting }) {
  const { isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState(meeting?.title ?? "");
  const [meetingDate, setMeetingDate] = useState(
    meeting?.meetingDate ?? todayYMD()
  );
  const [body, setBody] = useState(meeting?.body ?? "");
  const [summary, setSummary] = useState(meeting?.summary ?? "");
  const [tags, setTags] = useState<string[]>(meeting?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [actionItems, setActionItems] = useState<ActionItem[]>(
    meeting?.actionItems ?? []
  );
  const [newAction, setNewAction] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>(
    meeting?.attachments ?? []
  );

  const [summarizing, setSummarizing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 첨부파일 삭제를 "저장 시점"으로 지연하기 위한 추적값
  const originalPaths = useMemo(
    () => new Set((meeting?.attachments ?? []).map((a) => a.path)),
    [meeting]
  );
  const pendingUploadsRef = useRef<Attachment[]>([]); // 이번 세션에 올렸고 아직 저장 안 됨
  const removedExistingRef = useRef<Attachment[]>([]); // 기존 파일인데 제거됨(저장 성공 시 삭제)
  const savedRef = useRef(false);

  // 관리자가 아니면 로그인으로
  useEffect(() => {
    if (!authLoading && !isAdmin) router.replace("/login");
  }, [authLoading, isAdmin, router]);

  // 저장하지 않고 폼을 떠나면, 이번 세션에 올린(참조 안 된) 파일을 정리
  useEffect(() => {
    return () => {
      if (!savedRef.current) {
        pendingUploadsRef.current.forEach((a) => {
          void removeAttachment(a);
        });
      }
    };
  }, []);

  if (authLoading)
    return <div className="p-8 text-sm text-muted">확인 중…</div>;
  if (!isAdmin) return null;

  // ── 태그 ──
  const addTag = (raw: string) => {
    const t = raw.trim().replace(/,$/, "");
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t]);
    setTagInput("");
  };
  const onTagKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(tagInput);
    } else if (e.key === "Backspace" && !tagInput && tags.length) {
      setTags((prev) => prev.slice(0, -1));
    }
  };

  // ── 액션 아이템 ──
  const addAction = () => {
    const c = newAction.trim();
    if (!c) return;
    setActionItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), content: c, done: false },
    ]);
    setNewAction("");
  };
  const updateAction = (id: string, content: string) =>
    setActionItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, content } : it))
    );
  const removeAction = (id: string) =>
    setActionItems((prev) => prev.filter((it) => it.id !== id));

  // ── AI 요약 ──
  const summarize = async () => {
    if (!body.trim()) {
      setError("본문을 먼저 입력한 뒤 요약하세요.");
      return;
    }
    setSummarizing(true);
    setError(null);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "요약에 실패했습니다.");
      if (typeof data.summary === "string") setSummary(data.summary);
      if (Array.isArray(data.actionItems) && data.actionItems.length) {
        setActionItems((prev) => {
          const existing = new Set(prev.map((it) => it.content.trim()));
          const additions = (data.actionItems as string[])
            .map((c) => String(c).trim())
            .filter((c) => c && !existing.has(c))
            .map((c) => ({ id: crypto.randomUUID(), content: c, done: false }));
          return [...prev, ...additions];
        });
      }
    } catch (e) {
      setError("AI 요약 실패: " + (e as Error).message);
    } finally {
      setSummarizing(false);
    }
  };

  // ── 첨부 ──
  const onFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        const att = await uploadAttachment(file);
        pendingUploadsRef.current.push(att);
        setAttachments((prev) => [...prev, att]);
      }
    } catch (e) {
      setError("업로드 실패: " + (e as Error).message);
    } finally {
      setUploading(false);
    }
  };
  const onRemoveAttachment = (a: Attachment) => {
    setAttachments((prev) => prev.filter((x) => x.path !== a.path));
    if (originalPaths.has(a.path)) {
      // 저장돼 있던 파일 → 저장에 성공할 때만 실제 삭제 (취소 시 원복 가능)
      removedExistingRef.current.push(a);
    } else {
      // 이번 세션에 올렸다가 뺀 파일 → 아무 데도 참조 안 되므로 즉시 삭제
      pendingUploadsRef.current = pendingUploadsRef.current.filter(
        (x) => x.path !== a.path
      );
      void removeAttachment(a);
    }
  };

  // ── 저장 ──
  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return setError("제목을 입력하세요.");
    if (!meetingDate) return setError("회의 날짜를 선택하세요.");
    setSaving(true);
    setError(null);
    const input: MeetingInput = {
      title: title.trim(),
      meetingDate,
      body,
      summary: summary.trim() || null,
      tags,
      actionItems: actionItems
        .filter((a) => a.content.trim())
        .map((a) => ({ ...a, content: a.content.trim() })),
      attachments,
    };
    try {
      let targetId: string;
      if (meeting) {
        await updateMeeting(meeting.id, input);
        targetId = meeting.id;
      } else {
        targetId = await createMeeting(input);
      }

      // 저장 성공 → 제거된 기존 파일을 이제 실제 삭제, 세션 업로드는 참조됐으니 정리 제외
      savedRef.current = true;
      removedExistingRef.current.forEach((a) => void removeAttachment(a));
      removedExistingRef.current = [];
      pendingUploadsRef.current = [];

      router.push(`/meetings/${targetId}`);
    } catch (e) {
      setError("저장 실패: " + (e as Error).message);
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10"
    >
      <h1 className="mb-6 text-xl font-semibold">
        {meeting ? "회의록 편집" : "새 회의록"}
      </h1>

      {error && (
        <div className="mb-5 rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {/* 제목 · 날짜 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto]">
        <Field label="제목">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: 3주차 주간회의"
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </Field>
        <Field label="회의 날짜">
          <input
            type="date"
            value={meetingDate}
            onChange={(e) => setMeetingDate(e.target.value)}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </Field>
      </div>

      {/* 태그 */}
      <Field label="태그" className="mt-4">
        <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-border bg-surface px-2 py-1.5">
          {tags.map((t) => (
            <span
              key={t}
              className="flex items-center gap-1 rounded-full bg-hover px-2 py-0.5 text-xs"
            >
              {t}
              <button
                type="button"
                onClick={() => setTags((prev) => prev.filter((x) => x !== t))}
                className="text-muted hover:text-danger"
              >
                <X size={12} />
              </button>
            </span>
          ))}
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={onTagKey}
            onBlur={() => tagInput && addTag(tagInput)}
            placeholder={tags.length ? "" : "Enter 로 태그 추가"}
            className="min-w-[8rem] flex-1 bg-transparent px-1 py-1 text-sm outline-none"
          />
        </div>
      </Field>

      {/* 본문 + AI 요약 버튼 */}
      <Field label="본문" className="mt-4">
        <div className="mb-2 flex justify-end">
          <button
            type="button"
            onClick={summarize}
            disabled={summarizing}
            className="flex items-center gap-1.5 rounded-lg border border-accent/40 bg-accent-soft px-3 py-1.5 text-sm font-medium text-accent transition hover:opacity-90 disabled:opacity-50"
          >
            {summarizing ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Sparkles size={14} />
            )}
            {summarizing ? "요약 중…" : "AI 요약 · 액션아이템 추출"}
          </button>
        </div>
        <MarkdownEditor
          value={body}
          onChange={setBody}
          placeholder={
            "## 안건\n- ...\n\n---\n\n## 논의\n- ...\n\n---\n\n## 결정사항\n- ..."
          }
        />
        <p className="mt-1.5 text-xs text-muted">
          슬라이드 구분: 줄에 <code className="rounded bg-hover px-1">---</code> 를
          넣으면 그 지점에서 새 슬라이드로 나뉩니다. (없으면 <code className="rounded bg-hover px-1">##</code>{" "}
          제목 단위로 자동 분할)
        </p>
      </Field>

      {/* 요약 (AI 생성 or 직접 작성) */}
      <Field label="요약" className="mt-4">
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={3}
          placeholder="회의 핵심 요약 (AI 버튼으로 자동 생성하거나 직접 작성)"
          className="w-full resize-y rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </Field>

      {/* 액션 아이템 */}
      <Field label="액션 아이템" className="mt-4">
        <div className="space-y-2">
          {actionItems.map((it) => (
            <div key={it.id} className="flex items-center gap-2">
              <ListChecks size={15} className="shrink-0 text-muted" />
              <input
                value={it.content}
                onChange={(e) => updateAction(it.id, e.target.value)}
                className="flex-1 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm outline-none focus:border-accent"
              />
              <button
                type="button"
                onClick={() => removeAction(it.id)}
                className="rounded-md p-1.5 text-muted hover:bg-hover hover:text-danger"
              >
                <X size={15} />
              </button>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <Plus size={15} className="shrink-0 text-muted" />
            <input
              value={newAction}
              onChange={(e) => setNewAction(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addAction();
                }
              }}
              placeholder="할 일 추가 후 Enter"
              className="flex-1 rounded-lg border border-dashed border-border bg-surface px-3 py-1.5 text-sm outline-none focus:border-accent"
            />
          </div>
        </div>
      </Field>

      {/* 첨부파일 */}
      <Field label="첨부파일" className="mt-4">
        <div className="space-y-2">
          {attachments.map((a) => (
            <div
              key={a.path}
              className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            >
              <Paperclip size={15} className="shrink-0 text-muted" />
              <span className="min-w-0 flex-1 truncate">{a.name}</span>
              <span className="shrink-0 text-xs text-muted">
                {formatBytes(a.size)}
              </span>
              <button
                type="button"
                onClick={() => onRemoveAttachment(a)}
                className="rounded-md p-1 text-muted hover:bg-hover hover:text-danger"
              >
                <X size={15} />
              </button>
            </div>
          ))}
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-surface px-3 py-3 text-sm text-muted hover:border-border-strong">
            {uploading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Upload size={16} />
            )}
            {uploading ? "업로드 중…" : "파일 선택 (PDF · 이미지 등)"}
            <input
              type="file"
              multiple
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                onFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
        </div>
      </Field>

      {/* 저장 */}
      <div className="mt-8 flex items-center gap-2 border-t border-border pt-5">
        <button
          type="submit"
          disabled={saving || uploading}
          className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition hover:opacity-90 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Save size={15} />
          )}
          {saving ? "저장 중…" : meeting ? "변경사항 저장" : "회의록 저장"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-hover"
        >
          취소
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`block ${className}`}>
      <span className="mb-1.5 block text-sm font-medium text-foreground/90">
        {label}
      </span>
      {children}
    </div>
  );
}
