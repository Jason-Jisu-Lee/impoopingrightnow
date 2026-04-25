import type { IdentityStorage } from "./identity";
import { formatDurationMs, type SessionCertificate } from "./session-runtime";

export type StoredSessionRecord = {
  id: string;
  username: string;
  durationMs: number;
  pushCount: number;
  totalPushMs: number;
  completedAt: string;
};

export type SessionHeatmapCell = {
  dateKey: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
};

export type WeeklySummary = {
  sessionCount: number;
  averageDurationMs: number;
  averageDurationLabel: string;
  personalRecordCount: number;
  summaryText: string;
};

export type SessionStatsSnapshot = {
  totalSessions: number;
  heatmap: SessionHeatmapCell[];
  streaks: {
    current: number;
    best: number;
  };
  records: {
    fastest: StoredSessionRecord;
    longest: StoredSessionRecord;
    mostLogs: StoredSessionRecord;
  };
  weeklySummary: WeeklySummary;
};

export const sessionHistoryStorageKey = "impoopingrightnow.completed-sessions";

function padNumber(value: number): string {
  return value.toString().padStart(2, "0");
}

function toLocalDateKey(date: Date): string {
  return `${date.getFullYear()}-${padNumber(date.getMonth() + 1)}-${padNumber(
    date.getDate(),
  )}`;
}

function addDays(date: Date, days: number): Date {
  const nextDate = new Date(date);

  nextDate.setDate(nextDate.getDate() + days);

  return nextDate;
}

function startOfWeek(date: Date): Date {
  const weekStart = new Date(date);
  const normalizedDay = (weekStart.getDay() + 6) % 7;

  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - normalizedDay);

  return weekStart;
}

function getHeatmapLevel(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0) {
    return 0;
  }

  if (count === 1) {
    return 1;
  }

  if (count === 2) {
    return 2;
  }

  if (count <= 4) {
    return 3;
  }

  return 4;
}

function countRecordCategoriesInWeek(
  recordsThisWeek: StoredSessionRecord[],
  allTimeRecords: SessionStatsSnapshot["records"],
): number {
  return [
    allTimeRecords.fastest.id,
    allTimeRecords.longest.id,
    allTimeRecords.mostLogs.id,
  ].filter((recordId) =>
    recordsThisWeek.some((record) => record.id === recordId),
  ).length;
}

export function createStoredSessionRecord(
  certificate: SessionCertificate,
  random: () => number = Math.random,
): StoredSessionRecord {
  return {
    id: `${Date.parse(certificate.endedAt)}-${Math.floor(random() * 1_000_000)}`,
    username: certificate.username,
    durationMs: certificate.durationMs,
    pushCount: certificate.pushCount,
    totalPushMs: certificate.totalPushMs,
    completedAt: certificate.endedAt,
  };
}

export function parseStoredSessionHistory(
  rawValue: string | null,
): StoredSessionRecord[] {
  if (!rawValue) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(rawValue) as unknown;

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue.filter(
      (item): item is StoredSessionRecord =>
        typeof item === "object" &&
        item !== null &&
        typeof item.id === "string" &&
        typeof item.username === "string" &&
        typeof item.durationMs === "number" &&
        typeof item.pushCount === "number" &&
        typeof item.totalPushMs === "number" &&
        typeof item.completedAt === "string",
    );
  } catch {
    return [];
  }
}

export function appendStoredSessionRecord(
  records: StoredSessionRecord[],
  nextRecord: StoredSessionRecord,
  maxEntries = 365,
): StoredSessionRecord[] {
  return [...records, nextRecord]
    .sort(
      (leftRecord, rightRecord) =>
        new Date(leftRecord.completedAt).getTime() -
        new Date(rightRecord.completedAt).getTime(),
    )
    .slice(-maxEntries);
}

export async function recordCompletedSession(
  storage: IdentityStorage,
  certificate: SessionCertificate,
  random: () => number = Math.random,
): Promise<StoredSessionRecord[]> {
  const existingRecords = parseStoredSessionHistory(
    await storage.getItem(sessionHistoryStorageKey),
  );
  const nextRecords = appendStoredSessionRecord(
    existingRecords,
    createStoredSessionRecord(certificate, random),
  );

  await storage.setItem(sessionHistoryStorageKey, JSON.stringify(nextRecords));

  return nextRecords;
}

export function buildSessionStats(
  records: StoredSessionRecord[],
  now: Date = new Date(),
): SessionStatsSnapshot | null {
  if (records.length === 0) {
    return null;
  }

  const sortedRecords = [...records].sort(
    (leftRecord, rightRecord) =>
      new Date(leftRecord.completedAt).getTime() -
      new Date(rightRecord.completedAt).getTime(),
  );
  const dayCounts = new Map<string, number>();

  for (const record of sortedRecords) {
    const dateKey = toLocalDateKey(new Date(record.completedAt));

    dayCounts.set(dateKey, (dayCounts.get(dateKey) ?? 0) + 1);
  }

  const uniqueDays = [...dayCounts.keys()].sort();
  let bestStreak = 0;
  let activeRun = 0;
  let previousDay: Date | null = null;

  for (const dayKey of uniqueDays) {
    const [year, month, day] = dayKey.split("-").map(Number);
    const currentDay = new Date(year, (month ?? 1) - 1, day ?? 1);

    if (
      previousDay &&
      toLocalDateKey(addDays(previousDay, 1)) === toLocalDateKey(currentDay)
    ) {
      activeRun += 1;
    } else {
      activeRun = 1;
    }

    bestStreak = Math.max(bestStreak, activeRun);
    previousDay = currentDay;
  }

  let currentStreak = 0;
  let streakCursor = new Date(now);

  streakCursor.setHours(0, 0, 0, 0);

  while (dayCounts.has(toLocalDateKey(streakCursor))) {
    currentStreak += 1;
    streakCursor = addDays(streakCursor, -1);
  }

  const heatmap: SessionHeatmapCell[] = [];

  for (let offset = 83; offset >= 0; offset -= 1) {
    const day = addDays(now, -offset);

    day.setHours(0, 0, 0, 0);

    const dateKey = toLocalDateKey(day);
    const count = dayCounts.get(dateKey) ?? 0;

    heatmap.push({
      dateKey,
      count,
      level: getHeatmapLevel(count),
    });
  }

  const fastest = sortedRecords.reduce((currentFastest, record) =>
    record.durationMs < currentFastest.durationMs ? record : currentFastest,
  );
  const longest = sortedRecords.reduce((currentLongest, record) =>
    record.durationMs > currentLongest.durationMs ? record : currentLongest,
  );
  const mostLogs = sortedRecords.reduce((currentMostLogs, record) =>
    record.pushCount > currentMostLogs.pushCount ? record : currentMostLogs,
  );

  const weekStart = startOfWeek(now);
  const weekEnd = addDays(weekStart, 7);
  const recordsThisWeek = sortedRecords.filter((record) => {
    const completedAt = new Date(record.completedAt);

    return completedAt >= weekStart && completedAt < weekEnd;
  });
  const averageDurationMs =
    recordsThisWeek.length > 0
      ? Math.round(
          recordsThisWeek.reduce(
            (totalDuration, record) => totalDuration + record.durationMs,
            0,
          ) / recordsThisWeek.length,
        )
      : 0;
  const allTimeRecords = {
    fastest,
    longest,
    mostLogs,
  };
  const personalRecordCount = countRecordCategoriesInWeek(
    recordsThisWeek,
    allTimeRecords,
  );
  const weeklySummary: WeeklySummary = {
    sessionCount: recordsThisWeek.length,
    averageDurationMs,
    averageDurationLabel: formatDurationMs(averageDurationMs),
    personalRecordCount,
    summaryText: `This week: ${recordsThisWeek.length} poops, avg ${formatDurationMs(
      averageDurationMs,
    )}, ${personalRecordCount} personal records.`,
  };

  return {
    totalSessions: sortedRecords.length,
    heatmap,
    streaks: {
      current: currentStreak,
      best: bestStreak,
    },
    records: allTimeRecords,
    weeklySummary,
  };
}
