"use client";

import { useEffect, useState } from "react";

import {
  anonymousIdentityStorageKey,
  buildSessionStats,
  formatDurationMs,
  parseStoredSessionHistory,
  sessionHistoryStorageKey,
  type SessionStatsSnapshot,
  type StoredSessionRecord,
} from "@impoopingrightnow/shared";

import { PageChromeControls } from "../_components/page-chrome-controls";
import {
  buildStoredShareUrl,
  createStoredShareId,
} from "../_lib/share-store";
import {
  buildPublicShareSnapshot,
  buildPublicShareUrl,
  getShareCopy,
  type ShareMode,
} from "../_lib/share-snapshot";
import { ShellNav } from "../_components/shell-nav";

type StatsPageData = {
  snapshot: SessionStatsSnapshot | null;
  records: StoredSessionRecord[];
  username: string | null;
};

function readPageData(): StatsPageData {
  if (typeof window === "undefined") {
    return { snapshot: null, records: [], username: null };
  }

  try {
    const records = parseStoredSessionHistory(
      window.localStorage.getItem(sessionHistoryStorageKey),
    );
    const snapshot = buildSessionStats(records);
    let username: string | null = null;
    try {
      const raw = window.localStorage.getItem(anonymousIdentityStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as { username?: string };
        username = typeof parsed.username === "string" ? parsed.username : null;
      }
    } catch {
      // ignore
    }
    return { snapshot, records, username };
  } catch {
    return { snapshot: null, records: [], username: null };
  }
}

function computeAverages(records: StoredSessionRecord[]) {
  const total = records.length;
  if (total === 0) {
    return {
      avgDurationMs: null as number | null,
      avgPushMs: null as number | null,
      avgStartMinutes: null as number | null,
      avgPerDay: null as number | null,
    };
  }
  const avgDurationMs = Math.round(
    records.reduce((s, r) => s + r.durationMs, 0) / total,
  );
  const avgPushMs = Math.round(
    records.reduce((s, r) => s + r.totalPushMs, 0) / total,
  );
  const startMins = records.map((r) => {
    const d = new Date(new Date(r.completedAt).getTime() - r.durationMs);
    return d.getHours() * 60 + d.getMinutes();
  });
  const avgStartMinutes =
    startMins.reduce((s, v) => s + v, 0) / startMins.length;
  const uniqueDays = new Set(
    records.map((r) => {
      const d = new Date(r.completedAt);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    }),
  ).size;
  const avgPerDay = uniqueDays > 0 ? total / uniqueDays : null;
  return { avgDurationMs, avgPushMs, avgStartMinutes, avgPerDay };
}

function formatTimeOfDay(minutes: number | null): string {
  if (minutes === null) return "--";
  const safe = ((Math.round(minutes) % 1440) + 1440) % 1440;
  const h = Math.floor(safe / 60);
  const m = safe % 60;
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

function formatPerDay(value: number | null): string {
  if (value === null) return "--";
  const fixed = value.toFixed(1);
  return `${fixed} / day`;
}

function toLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getHeatmapLevelLocal(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count === 3) return 3;
  return 4;
}

type YearHeatmapCell = {
  dateKey: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
  weekday: number;
};

function buildYearHeatmap(
  records: StoredSessionRecord[],
  now: Date,
): YearHeatmapCell[] {
  const dayCounts = new Map<string, number>();
  for (const record of records) {
    const key = toLocalDateKey(new Date(record.completedAt));
    dayCounts.set(key, (dayCounts.get(key) ?? 0) + 1);
  }
  const year = now.getFullYear();
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);
  const cells: YearHeatmapCell[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    const key = toLocalDateKey(cursor);
    const count = dayCounts.get(key) ?? 0;
    cells.push({
      dateKey: key,
      count,
      level: getHeatmapLevelLocal(count),
      weekday: cursor.getDay(),
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return cells;
}

export default function MyStatsPage() {
  const [pageData, setPageData] = useState<StatsPageData | undefined>(
    undefined,
  );
  const [isYearHeatmapOpen, setIsYearHeatmapOpen] = useState(false);
  const [copiedShareMode, setCopiedShareMode] = useState<ShareMode | null>(
    null,
  );

  useEffect(() => {
    function syncStats() {
      setPageData(readPageData());
    }

    syncStats();
    window.addEventListener("storage", syncStats);

    return () => {
      window.removeEventListener("storage", syncStats);
    };
  }, []);

  const statsSnapshot =
    pageData?.snapshot ?? (pageData === undefined ? undefined : null);
  const isStatsLoading = pageData === undefined;
  const hasStats = pageData !== undefined && pageData.snapshot !== null;
  const snapshot = hasStats ? pageData!.snapshot! : null;
  const totalSessions = pageData?.snapshot?.totalSessions ?? 0;
  const username = pageData?.username ?? null;
  const averages = computeAverages(pageData?.records ?? []);
  const userStatsHeatmap =
    snapshot?.heatmap.slice(-63) ??
    Array.from({ length: 63 }, (_, index) => ({
      dateKey: `empty-${index}`,
      count: 0,
      level: 0 as const,
    }));
  const yearHeatmapNow = new Date();
  const yearHeatmap = buildYearHeatmap(
    pageData?.records ?? [],
    yearHeatmapNow,
  );
  const yearLabel = yearHeatmapNow.getFullYear();

  async function handleShare(mode: ShareMode) {
    if (typeof window === "undefined") {
      return;
    }

    const shareSnapshot = buildPublicShareSnapshot({
      mode,
      username,
      snapshot,
      averagePerDay: averages.avgPerDay,
    });
    let shareUrl = buildPublicShareUrl({
      snapshot: shareSnapshot,
      origin: window.location.origin,
    });
    const storedShareId = await createStoredShareId(shareSnapshot);

    if (storedShareId) {
      shareUrl = buildStoredShareUrl({
        origin: window.location.origin,
        shareId: storedShareId,
      });
    }

    const shareCopy = getShareCopy(shareSnapshot);
    const fallbackText = `${shareCopy.shareText}\n\n${shareUrl}`;

    if (typeof navigator !== "undefined" && navigator.share) {
      navigator
        .share({
          title: `${shareCopy.shareLabel} | impoopingrightnow`,
          text: shareCopy.shareText,
          url: shareUrl,
        })
        .catch(() => {
          // user cancelled or share failed — do nothing
        });
      return;
    }

    navigator.clipboard?.writeText(fallbackText).then(() => {
      setCopiedShareMode(mode);
      window.setTimeout(() => setCopiedShareMode(null), 2000);
    }).catch(() => {});
  }

  return (
    <main className="shell-page stats-page">
      <PageChromeControls />

      <div className="shell-frame">
        <section className="shell-main">
          <div className="my-stats-desktop-uc">Under Construction . . .</div>

          <section className="shell-aside-card shell-user-stats-card">
            <div className="stats-share-actions">
              <button
                type="button"
                className="stats-share-button"
                onClick={() => handleShare("brag")}
              >
                {copiedShareMode === "brag" ? "Copied!" : "Brag"}
              </button>
              <button
                type="button"
                className="stats-share-button"
                onClick={() => handleShare("challenge")}
              >
                {copiedShareMode === "challenge" ? "Copied!" : "Challenge"}
              </button>
            </div>
            <div className="shell-user-stats-layout">
              <div className="shell-user-stats-text-cols">
                <div className="shell-user-stats-col">
                  {username !== null ? (
                    <p className="session-user-stats-line">
                      <span className="session-user-stats-label">
                        username:
                      </span>{" "}
                      <strong className="session-user-stats-value">
                        {username}
                      </strong>
                    </p>
                  ) : null}
                  <p className="session-user-stats-line">
                    <span className="session-user-stats-label">pooped:</span>{" "}
                    <strong className="session-user-stats-value">
                      {totalSessions.toLocaleString()}{" "}
                      {totalSessions === 1 ? "time" : "times"}
                    </strong>
                  </p>
                  <p className="session-user-stats-line">
                    <span className="session-user-stats-label">
                      average session time:
                    </span>{" "}
                    <strong className="session-user-stats-value">
                      {averages.avgDurationMs !== null
                        ? formatDurationMs(averages.avgDurationMs)
                        : "--"}
                    </strong>
                  </p>
                  <p className="session-user-stats-line">
                    <span className="session-user-stats-label">
                      average poop time:
                    </span>{" "}
                    <strong className="session-user-stats-value">
                      {averages.avgPushMs !== null
                        ? formatDurationMs(averages.avgPushMs)
                        : "--"}
                    </strong>
                  </p>
                </div>
                <div className="shell-user-stats-col">
                  <p className="session-user-stats-line">
                    <span className="session-user-stats-label">
                      average session start time:
                    </span>{" "}
                    <strong className="session-user-stats-value">
                      {formatTimeOfDay(averages.avgStartMinutes)}
                    </strong>
                  </p>
                  <p className="session-user-stats-line">
                    <span className="session-user-stats-label">
                      average poop a day:
                    </span>{" "}
                    <strong className="session-user-stats-value">
                      {formatPerDay(averages.avgPerDay)}
                    </strong>
                  </p>
                  <p className="session-user-stats-line">
                    <span className="session-user-stats-label">
                      current streak:
                    </span>{" "}
                    <strong className="session-user-stats-value">
                      {snapshot?.streaks.current ?? 0}{" "}
                      {(snapshot?.streaks.current ?? 0) === 1 ? "day" : "days"}
                    </strong>
                  </p>
                </div>
              </div>

              <div className="shell-user-stats-side">
                <div className="shell-user-stats-heatmap-wrap">
                  <div className="shell-user-stats-heatmap-head">
                    <button
                      type="button"
                      className="shell-user-stats-heatmap-trigger"
                      onClick={() => setIsYearHeatmapOpen(true)}
                    >
                      Poop Calendar
                    </button>
                  </div>
                  <div
                    className="shell-user-stats-heatmap"
                    role="img"
                    aria-label="Recent poop calendar"
                  >
                    {userStatsHeatmap.map((cell) => (
                      <span
                        key={cell.dateKey}
                        className={`stats-heatmap-cell level-${cell.level}`}
                        data-tip={`${cell.dateKey.replace(/-/g, "/")} · ${cell.count} ${
                          cell.count === 1 ? "time" : "times"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {isYearHeatmapOpen ? (
              <div className="shell-year-heatmap-overlay">
                <div className="shell-year-heatmap-head">
                  <h3 className="shell-year-heatmap-title">
                    {yearLabel} Poop Calendar
                  </h3>
                  <button
                    type="button"
                    className="shell-year-heatmap-close"
                    onClick={() => setIsYearHeatmapOpen(false)}
                    aria-label="Close poop calendar"
                  >
                    ×
                  </button>
                </div>
                <div
                  className="shell-year-heatmap-grid"
                  role="img"
                  aria-label={`${yearLabel} poop calendar`}
                >
                  {yearHeatmap.map((cell, index) => (
                    <span
                      key={cell.dateKey}
                      className={`stats-heatmap-cell level-${cell.level}`}
                      style={
                        index === 0
                          ? { gridRowStart: cell.weekday + 1 }
                          : undefined
                      }
                      title={`${cell.dateKey.replace(/-/g, "/")}: ${cell.count} ${
                        cell.count === 1 ? "time" : "times"
                      }`}
                    />
                  ))}
                </div>
                <div className="shell-year-heatmap-legend">
                  <span className="shell-year-heatmap-legend-label">Less</span>
                  <span className="stats-heatmap-cell level-0" />
                  <span className="stats-heatmap-cell level-1" />
                  <span className="stats-heatmap-cell level-2" />
                  <span className="stats-heatmap-cell level-3" />
                  <span className="stats-heatmap-cell level-4" />
                  <span className="shell-year-heatmap-legend-label">More</span>
                </div>
              </div>
            ) : null}
          </section>
        </section>

        <ShellNav />
      </div>
    </main>
  );
}
