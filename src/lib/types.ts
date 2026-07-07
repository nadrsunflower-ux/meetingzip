// 회의에서 나온 할 일 항목 (문서 내 배열로 저장)
export type ActionItem = {
  id: string;
  content: string;
  done: boolean;
};

// 첨부파일 메타데이터 (실파일은 Firebase Storage, 메타는 문서 내 배열)
export type Attachment = {
  name: string;
  url: string; // 다운로드 URL
  path: string; // Storage 경로 (삭제용)
  size: number; // bytes
  type: string; // MIME
};

// 회의록 문서
export type Meeting = {
  id: string;
  title: string;
  meetingDate: string; // 'YYYY-MM-DD'
  year: number;
  month: number; // 1~12
  body: string; // 마크다운 본문
  summary: string | null; // AI 요약
  tags: string[];
  actionItems: ActionItem[];
  attachments: Attachment[];
  createdAt: number; // epoch ms
  updatedAt: number; // epoch ms
};

// 새 회의록 작성/수정 시 폼에서 다루는 필드
export type MeetingInput = {
  title: string;
  meetingDate: string; // 'YYYY-MM-DD'
  body: string;
  summary: string | null;
  tags: string[];
  actionItems: ActionItem[];
  attachments: Attachment[];
};
