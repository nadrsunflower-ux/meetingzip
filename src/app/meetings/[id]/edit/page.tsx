"use client";

import { useParams } from "next/navigation";
import { useMeeting } from "@/lib/useMeetings";
import { MeetingForm } from "@/components/MeetingForm";

export default function EditMeetingPage() {
  const params = useParams<{ id: string }>();
  const { meeting, loading } = useMeeting(params?.id ?? "");

  if (loading) {
    return <div className="p-8 text-sm text-muted">불러오는 중…</div>;
  }
  if (!meeting) {
    return (
      <div className="p-8 text-sm text-muted">회의록을 찾을 수 없습니다.</div>
    );
  }
  return <MeetingForm meeting={meeting} />;
}
