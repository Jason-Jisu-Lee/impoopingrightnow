"use client";

import { useEffect, useState } from "react";

import {
  buildSessionStats,
  formatDurationMs,
  parseStoredSessionHistory,
  sessionHistoryStorageKey,
  type SessionStatsSnapshot,
} from "@impoopingrightnow/shared";

import {
  PageBackControl,
  PageChromeControls,
} from "../_components/page-chrome-controls";
import { ShellNav } from "../_components/shell-nav";

function readStatsSnapshot(): SessionStatsSnapshot | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return buildSessionStats(
      parseStoredSessionHistory(
        window.localStorage.getItem(sessionHistoryStorageKey),
      ),
    );
  } catch {
    return null;
  }
}

export default function MyStatsPage() {
  const [statsSnapshot, setStatsSnapshot] = useState<
    SessionStatsSnapshot | null | undefined
  >(undefined);

  useEffect(() => {
    function syncStats() {
      setStatsSnapshot(readStatsSnapshot());
    }

    syncStats();
    window.addEventListener("storage", syncStats);

    return () => {
      window.removeEventListener("storage", syncStats);
    };
  }, []);

  const isStatsLoading = statsSnapshot === undefined;
  const hasStats = statsSnapshot !== undefined && statsSnapshot !== null;
  const totalSessions = statsSnapshot?.totalSessions ?? 0;

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
            Your poop calendar, streaks, personal records, and the weekly summary are now
            derived from sessions completed in this browser. Nothing here is
            faked.
          </p>
        </section>

        <section className="shell-main">
          <PageBackControl />

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
                      {statsSnapshot.heatmap.map((cell) => (
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
                        {formatDurationMs(
                          statsSnapshot.records.fastest.durationMs,
                        )}
                      </strong>
                      <p>
                        Logged by {statsSnapshot.records.fastest.username} with{" "}
                        {statsSnapshot.records.fastest.pushCount} log
                        {statsSnapshot.records.fastest.pushCount === 1
                          ? ""
                          : "s"}
                        .
                      </p>
                    </article>

                    <article className="stats-record-card">
                      <span className="stats-record-label">Longest poop</span>
                      <strong>
                        {formatDurationMs(
                          statsSnapshot.records.longest.durationMs,
                        )}
                      </strong>
                      <p>
                        Total push time:{" "}
                        {formatDurationMs(
                          statsSnapshot.records.longest.totalPushMs,
                        )}
                        .
                      </p>
                    </article>

                    <article className="stats-record-card">
                      <span className="stats-record-label">Most logs</span>
                      <strong>
                        {statsSnapshot.records.mostLogs.pushCount}
                      </strong>
                      <p>
                        Completed over{" "}
                        {formatDurationMs(
                          statsSnapshot.records.mostLogs.durationMs,
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
                    ? statsSnapshot.weeklySummary.summaryText
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
                      {hasStats ? statsSnapshot.streaks.current : 0}{" "}
                      {(hasStats ? statsSnapshot.streaks.current : 0) === 1
                        ? "day"
                        : "days"}
                    </strong>
                  </div>
                  <div>
                    <span className="stats-record-label">Best</span>
                    <strong>
                      {hasStats ? statsSnapshot.streaks.best : 0}{" "}
                      {(hasStats ? statsSnapshot.streaks.best : 0) === 1
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
