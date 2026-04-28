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
  PageBackControl,
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
  return `${value.toFixed(1)}x / day`;
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
        <section className="shell-banner">
          <div className="shell-banner-row">
            <span className="eyebrow">My Stats</span>
            <span className="banner-counter">
              {totalSessions.toLocaleString()} sessions on this device
            </span>
          </div>
          <div className="shell-banner-row">
            <div>
              <h1 className="banner-title">Your local stool ledger.</h1>
            </div>
          </div>
          <p className="banner-subtitle">
            Your poop calendar, streaks, personal records, and the weekly
            summary are now derived from sessions completed in this browser.
            Nothing here is faked.
          </p>
        </section>

        <section className="shell-main">
          <PageBackControl />

          {username !== null || hasStats ? (
            <section className="shell-aside-card stats-profile-card">
              <div className="stats-profile-row">
                {username !== null ? (
                  <div className="stats-profile-item">
                    <span className="stats-record-label">Username</span>
                    <strong>{username}</strong>
                  </div>
                ) : null}
                <div className="stats-profile-item">
                  <span className="stats-record-label">Total sessions</span>
                  <strong>{totalSessions.toLocaleString()}</strong>
                </div>
                {averages.avgDurationMs !== null ? (
                  <div className="stats-profile-item">
                    <span className="stats-record-label">Avg session</span>
                    <strong>{formatDurationMs(averages.avgDurationMs)}</strong>
                  </div>
                ) : null}
                {averages.avgPushMs !== null ? (
                  <div className="stats-profile-item">
                    <span className="stats-record-label">Avg push time</span>
                    <strong>{formatDurationMs(averages.avgPushMs)}</strong>
                  </div>
                ) : null}
                {averages.avgStartMinutes !== null ? (
                  <div className="stats-profile-item">
                    <span className="stats-record-label">Avg start time</span>
                    <strong>{formatTimeOfDay(averages.avgStartMinutes)}</strong>
                  </div>
                ) : null}
                {averages.avgPerDay !== null ? (
                  <div className="stats-profile-item">
                    <span className="stats-record-label">Per day</span>
                    <strong>{formatPerDay(averages.avgPerDay)}</strong>
                  </div>
                ) : null}
              </div>
            </section>
          ) : null}

          <div className="shell-content-grid">
            <section className="stats-panel">
              <header className="shell-panel-head">
                <p className="eyebrow">Retention surfaces</p>
                <h2 className="shell-panel-title">
                  Your poop calendar, streaks, and records now have real data.
                </h2>
                <p className="shell-panel-body">
                  This slice stays local-first: completed sessions are stored on
                  this device, then turned into a GitHub-style activity grid,
                  streak tracking, and personal records.
                </p>
              </header>

              {hasStats ? (
                <>
                  <section className="stats-heatmap-card">
                    <div className="stats-section-head">
                      <h3>Poop Calendar</h3>
                      <p>Last 12 weeks of completed sessions.</p>
                    </div>

                    <div
                      className="stats-heatmap-grid"
                      role="img"
                      aria-label="Poop calendar"
                    >
                      {snapshot?.heatmap.map((cell) => (
                        <span
                          key={cell.dateKey}
                          className={`stats-heatmap-cell level-${cell.level}`}
                          title={`${cell.dateKey}: ${cell.count} session${cell.count === 1 ? "" : "s"}`}
                        />
                      ))}
                    </div>

                    <div className="stats-heatmap-legend">
                      <span>Less</span>
                      <div className="stats-heatmap-legend-scale">
                        <span className="stats-heatmap-cell level-0" />
                        <span className="stats-heatmap-cell level-1" />
                        <span className="stats-heatmap-cell level-2" />
                        <span className="stats-heatmap-cell level-3" />
                        <span className="stats-heatmap-cell level-4" />
                      </div>
                      <span>More</span>
                    </div>
                  </section>

                  <section className="stats-records-grid">
                    <article className="stats-record-card">
                      <span className="stats-record-label">Fastest poop</span>
                      <strong>
                        {formatDurationMs(snapshot!.records.fastest.durationMs)}
                      </strong>
                      <p>
                        Logged by {snapshot!.records.fastest.username} with{" "}
                        {snapshot!.records.fastest.pushCount} log
                        {snapshot!.records.fastest.pushCount === 1 ? "" : "s"}.
                      </p>
                    </article>

                    <article className="stats-record-card">
                      <span className="stats-record-label">Longest poop</span>
                      <strong>
                        {formatDurationMs(snapshot!.records.longest.durationMs)}
                      </strong>
                      <p>
                        Total push time:{" "}
                        {formatDurationMs(
                          snapshot!.records.longest.totalPushMs,
                        )}
                        .
                      </p>
                    </article>

                    <article className="stats-record-card">
                      <span className="stats-record-label">Most logs</span>
                      <strong>{snapshot!.records.mostLogs.pushCount}</strong>
                      <p>
                        Completed over{" "}
                        {formatDurationMs(
                          snapshot!.records.mostLogs.durationMs,
                        )}
                        .
                      </p>
                    </article>
                  </section>
                </>
              ) : (
                <section className="shell-aside-card stats-summary-card">
                  <h3>
                    {isStatsLoading ? "Loading your records" : "No records yet"}
                  </h3>
                  <p className="stats-summary-text">
                    {isStatsLoading
                      ? "Reading saved sessions from this browser."
                      : "Finish at least one session and flush it to populate your poop calendar, streaks, and personal records."}
                  </p>
                </section>
              )}
            </section>

            <aside className="shell-aside">
              <section className="shell-aside-card stats-summary-card">
                <h3>Weekly Summary</h3>
                <p className="stats-summary-text">
                  {hasStats
                    ? snapshot!.weeklySummary.summaryText
                    : isStatsLoading
                      ? "Loading local session history."
                      : "No weekly summary yet because this browser has no completed flushed sessions."}
                </p>
                <button
                  type="button"
                  className="certificate-share-button"
                  disabled
                >
                  Share Summary · later slice
                </button>
              </section>

              <section className="shell-aside-card stats-streak-card">
                <h3>Streaks</h3>
                <div className="stats-streak-grid">
                  <div>
                    <span className="stats-record-label">Current</span>
                    <strong>
                      {hasStats ? snapshot!.streaks.current : 0}{" "}
                      {(hasStats ? snapshot!.streaks.current : 0) === 1
                        ? "day"
                        : "days"}
                    </strong>
                  </div>
                  <div>
                    <span className="stats-record-label">Best</span>
                    <strong>
                      {hasStats ? snapshot!.streaks.best : 0}{" "}
                      {(hasStats ? snapshot!.streaks.best : 0) === 1
                        ? "day"
                        : "days"}
                    </strong>
                  </div>
                </div>
              </section>

              <section className="shell-aside-card">
                <h3>Local Mode</h3>
                <p>
                  These stats come from completed sessions saved in browser
                  storage. Cross-device history and Supabase-backed stats land
                  in later slices.
                </p>
              </section>
            </aside>
          </div>
        </section>

        <ShellNav />

        <footer className="shell-footer">
          <span>
            <strong>Status:</strong> web stats surfaces are wired to real local
            session data.
          </span>
          <span>Global preview and local settings are now both available.</span>
        </footer>
      </div>
    </main>
  );
}
