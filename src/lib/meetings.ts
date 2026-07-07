import { db, storage } from "./firebase";
import {
  collection,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
  type DocumentData,
} from "firebase/firestore";
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import type { Meeting, MeetingInput, Attachment } from "./types";

const COL = "meetings";

function toMillis(v: unknown): number {
  if (v instanceof Timestamp) return v.toMillis();
  if (typeof v === "number") return v;
  return 0;
}

function toMeeting(id: string, data: DocumentData): Meeting {
  return {
    id,
    title: data.title ?? "",
    meetingDate: data.meetingDate ?? "",
    year: data.year ?? 0,
    month: data.month ?? 0,
    body: data.body ?? "",
    summary: data.summary ?? null,
    tags: Array.isArray(data.tags) ? data.tags : [],
    actionItems: Array.isArray(data.actionItems) ? data.actionItems : [],
    attachments: Array.isArray(data.attachments) ? data.attachments : [],
    createdAt: toMillis(data.createdAt),
    updatedAt: toMillis(data.updatedAt),
  };
}

function deriveYearMonth(meetingDate: string): { year: number; month: number } {
  const [y, m] = meetingDate.split("-").map(Number);
  return { year: y || 0, month: m || 0 };
}

// ── 실시간 구독 ──────────────────────────────────────────────
export function subscribeMeetings(
  cb: (m: Meeting[]) => void,
  onError?: (e: Error) => void
): () => void {
  const q = query(collection(db, COL), orderBy("meetingDate", "desc"));
  return onSnapshot(
    q,
    (snap) => cb(snap.docs.map((d) => toMeeting(d.id, d.data()))),
    (err) => onError?.(err)
  );
}

export function subscribeMeeting(
  id: string,
  cb: (m: Meeting | null) => void,
  onError?: (e: Error) => void
): () => void {
  return onSnapshot(
    doc(db, COL, id),
    (snap) => cb(snap.exists() ? toMeeting(snap.id, snap.data()) : null),
    (err) => onError?.(err)
  );
}

export async function getMeeting(id: string): Promise<Meeting | null> {
  const snap = await getDoc(doc(db, COL, id));
  return snap.exists() ? toMeeting(snap.id, snap.data()) : null;
}

// ── 쓰기 (로그인 필요 — Firestore 규칙으로 강제) ──────────────
export async function createMeeting(input: MeetingInput): Promise<string> {
  const { year, month } = deriveYearMonth(input.meetingDate);
  const created = await addDoc(collection(db, COL), {
    ...input,
    year,
    month,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return created.id;
}

export async function updateMeeting(
  id: string,
  input: MeetingInput
): Promise<void> {
  const { year, month } = deriveYearMonth(input.meetingDate);
  await updateDoc(doc(db, COL, id), {
    ...input,
    year,
    month,
    updatedAt: serverTimestamp(),
  });
}

export async function toggleActionItem(
  meeting: Meeting,
  itemId: string
): Promise<void> {
  const actionItems = meeting.actionItems.map((it) =>
    it.id === itemId ? { ...it, done: !it.done } : it
  );
  await updateDoc(doc(db, COL, meeting.id), {
    actionItems,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteMeeting(meeting: Meeting): Promise<void> {
  // 문서를 먼저 삭제(성공해야 목록에서 사라짐), 그 다음 첨부 파일 정리(실패해도 무방)
  await deleteDoc(doc(db, COL, meeting.id));
  await Promise.allSettled(
    meeting.attachments.map((a) => deleteObject(storageRef(storage, a.path)))
  );
}

// ── 첨부파일 ────────────────────────────────────────────────
export async function uploadAttachment(file: File): Promise<Attachment> {
  const safeName = file.name.replace(/[^\w.\-가-힣]/g, "_");
  const path = `attachments/${crypto.randomUUID()}-${safeName}`;
  const r = storageRef(storage, path);
  await uploadBytes(r, file, { contentType: file.type || "application/octet-stream" });
  const url = await getDownloadURL(r);
  return {
    name: file.name,
    url,
    path,
    size: file.size,
    type: file.type || "application/octet-stream",
  };
}

export async function removeAttachment(a: Attachment): Promise<void> {
  try {
    await deleteObject(storageRef(storage, a.path));
  } catch {
    // 이미 없거나 권한 문제여도 폼 상태 제거는 진행
  }
}
