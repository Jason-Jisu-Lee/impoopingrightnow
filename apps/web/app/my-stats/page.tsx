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

import {
  PageChromeControls,
} from "../_components/page-chrome-controls";
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
  return `${value.toFixed(10)} / day`;
}

export default function MyStatsPage() {
  const [pageData, setPageData] = useState<StatsPageData | undefined>(
    undefined,
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

  return (
    <main className="shell-page stats-page">
      <PageChromeControls />

      <div className="shell-frame">
        <section className="shell-main">
          <div className="my-stats-desktop-uc">Under Construction . . .</div>

          <section className="shell-aside-card shell-user-stats-card">
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
                  <p className="session-user-stats-line">
                    <span className="session-user-stats-label">
                      best streak:
                    </span>{" "}
                    <strong className="session-user-stats-value">
                      {snapshot?.streaks.best ?? 0}{" "}
                      {(snapshot?.streaks.best ?? 0) === 1 ? "day" : "days"}
                    </strong>
                  </p>
                </div>
              </div>
            </div>
          </section>
        </section>

        <ShellNav />
      </div>
    </main>
  );
}
