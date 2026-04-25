"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  buildSessionStats,
  formatDurationMs,
  parseStoredSessionHistory,
  sessionHistoryStorageKey,
  type SessionStatsSnapshot,
} from "@impoopingrightnow/shared";

const navItems = [
  { href: "/", label: "Primary", title: "Home / Session" },
  { href: "/my-stats", label: "Records", title: "My Stats" },
  { href: "/global", label: "Census", title: "Global" },
  { href: "/settings", label: "Identity", title: "Settings" },
];

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

  if (statsSnapshot === undefined || statsSnapshot === null) {
    return null;
  }

  return (
    <main className="shell-page stats-page">
      <div className="shell-frame">
        <section className="shell-banner">
          <div className="shell-banner-row">
            <span className="eyebrow">My Stats</span>
            <span className="banner-counter">
              {statsSnapshot.totalSessions.toLocaleString()} sessions on this
              device
            </span>
          </div>
          <div className="shell-banner-row">
            <div>
              <p className="eyebrow">impoopingrightnow.com</p>
              <h1 className="banner-title">Your local stool ledger.</h1>
            </div>
          </div>
          <p className="banner-subtitle">
            Heatmap, streaks, personal records, and the weekly summary are now
            derived from sessions completed in this browser. Nothing here is
            faked.
          </p>
        </section>

        <section className="shell-main">
          <nav className="shell-nav" aria-label="Primary navigation">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="shell-nav-link">
                <span className="shell-nav-label">{item.label}</span>
                <span className="shell-nav-title">{item.title}</span>
              </Link>
            ))}
          </nav>

          <div className="shell-content-grid">
            <section className="stats-panel">
              <header className="shell-panel-head">
                <p className="eyebrow">Retention surfaces</p>
                <h2 className="shell-panel-title">
                  Heatmap, streaks, and records now have real data.
                </h2>
                <p className="shell-panel-body">
                  This slice stays local-first: completed sessions are stored on
                  this device, then turned into a GitHub-style activity grid,
                  streak tracking, and personal records.
                </p>
              </header>

              <section className="stats-heatmap-card">
                <div className="stats-section-head">
                  <h3>Heatmap</h3>
                  <p>Last 12 weeks of completed sessions.</p>
                </div>

                <div
                  className="stats-heatmap-grid"
                  role="img"
                  aria-label="Session heatmap"
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
                    {formatDurationMs(statsSnapshot.records.fastest.durationMs)}
                  </strong>
                  <p>
                    Logged by {statsSnapshot.records.fastest.username} with{" "}
                    {statsSnapshot.records.fastest.pushCount} log
                    {statsSnapshot.records.fastest.pushCount === 1 ? "" : "s"}.
                  </p>
                </article>

                <article className="stats-record-card">
                  <span className="stats-record-label">Longest poop</span>
                  <strong>
                    {formatDurationMs(statsSnapshot.records.longest.durationMs)}
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
                  <strong>{statsSnapshot.records.mostLogs.pushCount}</strong>
                  <p>
                    Completed over{" "}
                    {formatDurationMs(
                      statsSnapshot.records.mostLogs.durationMs,
                    )}
                    .
                  </p>
                </article>
              </section>
            </section>

            <aside className="shell-aside">
              <section className="shell-aside-card stats-summary-card">
                <h3>Weekly Summary</h3>
                <p className="stats-summary-text">
                  {statsSnapshot.weeklySummary.summaryText}
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
                    <strong>{statsSnapshot.streaks.current} days</strong>
                  </div>
                  <div>
                    <span className="stats-record-label">Best</span>
                    <strong>{statsSnapshot.streaks.best} days</strong>
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
