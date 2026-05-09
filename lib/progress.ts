import type { ProgressSnapshot } from "@/types/orion";

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function getLocalDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function shiftDateKey(dateKey: string, dayDelta: number): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + dayDelta);

  return getLocalDateKey(date);
}

export function normalizeActivityDates(activityDates: readonly string[] = []): string[] {
  return Array.from(new Set(activityDates.filter((date) => DATE_KEY_PATTERN.test(date)))).sort();
}

export function calculateStreakDays(
  activityDates: readonly string[] = [],
  todayKey = getLocalDateKey()
): number {
  const dates = new Set(normalizeActivityDates(activityDates));
  if (dates.size === 0) return 0;

  const startKey = dates.has(todayKey) ? todayKey : shiftDateKey(todayKey, -1);
  if (!dates.has(startKey)) return 0;

  let streakDays = 0;
  let cursor = startKey;
  while (dates.has(cursor)) {
    streakDays += 1;
    cursor = shiftDateKey(cursor, -1);
  }

  return streakDays;
}

export function withLessonActivityDates(
  progress: ProgressSnapshot,
  activityDates: readonly string[],
  todayKey = getLocalDateKey()
): ProgressSnapshot {
  const normalizedDates = normalizeActivityDates(activityDates);

  return {
    ...progress,
    lessonActivityDates: normalizedDates,
    streakDays: calculateStreakDays(normalizedDates, todayKey)
  };
}

export function markLessonActivity(progress: ProgressSnapshot, date = new Date()): ProgressSnapshot {
  const activityDate = getLocalDateKey(date);
  return withLessonActivityDates(progress, [...(progress.lessonActivityDates ?? []), activityDate], activityDate);
}
