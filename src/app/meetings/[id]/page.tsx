"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FileQuestion } from "lucide-react";
import { useMeeting } from "@/lib/useMeetings";
import { MeetingView } from "@/components/MeetingView";

export default function MeetingPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const { meeting, loading, error } = useMeeting(id);

  if (loading) {
    return <div className="p-8 text-sm text-muted">불러오는 중…</div>;
  }
  if (error) {
    return <div className="p-8 text-sm text-danger">오류: {error}</div>;
  }
  if (!meeting) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <FileQuestion size={40} className="mx-auto mb-4 text-muted" />
        <h1 className="mb-1 font-medium">회의록을 찾을 수 없습니다</h1>
        <p className="mb-5 text-sm text-muted">
          삭제되었거나 잘못된 주소일 수 있습니다.
        </p>
        <Link
          href="/"
          className="inline-flex rounded-lg border border-border px-4 py-2 text-sm hover:bg-hover"
        >
          홈으로
        </Link>
      </div>
    );
  }

  return <MeetingView meeting={meeting} />;
}
