import type { Meeting } from "./types";

export const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

// 'YYYY-MM-DD' → 'YYYY년 M월 D일 (요일)'
export function formatKoreanDate(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) return ymd || "";
  const date = new Date(y, m - 1, d);
  return `${y}년 ${m}월 ${d}일 (${WEEKDAYS[date.getDay()]})`;
}

export function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export type MonthGroup = { month: number; meetings: Meeting[] };
export type YearGroup = { year: number; months: MonthGroup[]; count: number };

// 회의록 목록을 연도>월 폴더 트리로 그룹화 (최신 우선)
export function groupByYearMonth(meetings: Meeting[]): YearGroup[] {
  const years = new Map<number, Map<number, Meeting[]>>();
  for (const m of meetings) {
    if (!years.has(m.year)) years.set(m.year, new Map());
    const months = years.get(m.year)!;
    if (!months.has(m.month)) months.set(m.month, []);
    months.get(m.month)!.push(m);
  }
  return [...years.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([year, months]) => {
      const monthGroups = [...months.entries()]
        .sort((a, b) => b[0] - a[0])
        .map(([month, ms]) => ({
          month,
          meetings: ms
            .slice()
            .sort((a, b) => b.meetingDate.localeCompare(a.meetingDate)),
        }));
      const count = monthGroups.reduce((n, g) => n + g.meetings.length, 0);
      return { year, months: monthGroups, count };
    });
}
