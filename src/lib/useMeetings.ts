"use client";

import { useEffect, useState } from "react";
import { subscribeMeetings, subscribeMeeting } from "./meetings";
import type { Meeting } from "./types";

export function useMeetings() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return subscribeMeetings(
      (m) => {
        setMeetings(m);
        setLoading(false);
      },
      (e) => {
        setError(e.message);
        setLoading(false);
      }
    );
  }, []);

  return { meetings, loading, error };
}

export function useMeeting(id: string) {
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trackedId, setTrackedId] = useState(id);

  // id가 바뀌면 렌더 도중 즉시 리셋 → 이전 회의록이 한 프레임 비치는 문제 제거
  if (id !== trackedId) {
    setTrackedId(id);
    setMeeting(null);
    setLoading(true);
    setError(null);
  }

  useEffect(() => {
    if (!id) return;
    return subscribeMeeting(
      id,
      (m) => {
        setMeeting(m);
        setLoading(false);
      },
      (e) => {
        setError(e.message);
        setLoading(false);
      }
    );
  }, [id]);

  return { meeting, loading, error };
}
