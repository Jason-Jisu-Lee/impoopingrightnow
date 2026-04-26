"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  buildGlobalAnalyticsSnapshot,
  parseStoredSessionHistory,
  sessionHistoryStorageKey,
} from "@impoopingrightnow/shared";

const navItems = [
  { href: "/", label: "Primary", title: "Home / Session" },
  { href: "/my-stats", label: "Records", title: "My Stats" },
  { href: "/global", label: "Browse", title: "World Board" },
  { href: "/settings", label: "Identity", title: "Settings" },
];

const globalAnalytics = buildGlobalAnalyticsSnapshot();

function readLocalSessionCount(): number {
  if (typeof window === "undefined") {
    return 0;
  }

  try {
    return parseStoredSessionHistory(
      window.localStorage.getItem(sessionHistoryStorageKey),
    ).length;
  } catch {
    return 0;
  }
}

function formatAverageLogs(value: number): string {
  return value.toFixed(1);
}

export default function GlobalPage() {
  const [localSessionCount, setLocalSessionCount] = useState(0);

  useEffect(() => {
    function syncLocalSessionCount() {
      setLocalSessionCount(readLocalSessionCount());
    }

    syncLocalSessionCount();
    window.addEventListener("storage", syncLocalSessionCount);

    return () => {
      window.removeEventListener("storage", syncLocalSessionCount);
    };
  }, []);

  return (
    <main className="shell-page global-page">
      <div className="shell-frame">
        <section className="shell-banner">
          <div className="shell-banner-row">
            <span className="eyebrow">World Board</span>
            <span className="banner-counter">
              Preview board · {globalAnalytics.countryLeaderboard.length}{" "}
              countries / {globalAnalytics.regionalStats.length} regions
            </span>
          </div>
          <div className="shell-banner-row">
            <div>
              <p className="eyebrow">impoopingrightnow.com</p>
              <h1 className="banner-title">Something to read while you sit.</h1>
            </div>
          </div>
          <p className="banner-subtitle">
            This page is just for browsing. The numbers are still preview data
            for now.
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
            <section className="global-panel">
              <header className="shell-panel-head">
                <p className="eyebrow">Read-only preview</p>
                <h2 className="shell-panel-title">
                  A simple world board for now.
                </h2>
                <p className="shell-panel-body">
                  These country and region cards are still preview data. Real
                  location-based totals can come later.
                </p>
              </header>

              <section className="global-summary-grid">
                <article className="global-summary-card">
                  <span className="stats-record-label">This Device</span>
                  <strong>{localSessionCount.toLocaleString()}</strong>
                  <p className="global-summary-copy">
                    Completed sessions saved in this browser. They show up in My
                    Stats, not on this preview board.
                  </p>
                </article>

                <article className="global-summary-card">
                  <span className="stats-record-label">Threshold</span>
                  <strong>{globalAnalytics.minimumSessions} sessions</strong>
                  <p className="global-summary-copy">
                    Countries and regions stay off the board until they clear
                    the minimum session count.
                  </p>
                </article>

                <article className="global-summary-card">
                  <span className="stats-record-label">Mode</span>
                  <strong>Preview-only</strong>
                  <p className="global-summary-copy">
                    {globalAnalytics.previewNotice}
                  </p>
                </article>
              </section>

              <section className="global-leaderboard-card">
                <div className="stats-section-head">
                  <h3>Countries</h3>
                  <p>
                    Average time, peak hour, log rate, and push time are all in
                    one place.
                  </p>
                </div>

                <div className="global-leaderboard-list">
                  {globalAnalytics.countryLeaderboard.map((row, index) => (
                    <article key={row.name} className="global-leaderboard-row">
                      <div className="global-row-head">
                        <span className="global-rank-badge">
                          #{String(index + 1).padStart(2, "0")}
                        </span>
                        <div className="global-row-title">
                          <h3>{row.name}</h3>
                          <p>
                            {row.sessionCount.toLocaleString()} counted sessions
                          </p>
                        </div>
                      </div>

                      <dl className="global-metric-grid">
                        <div>
                          <dt>Avg total time</dt>
                          <dd>{row.averageDurationLabel}</dd>
                        </div>
                        <div>
                          <dt>Peak hour</dt>
                          <dd>{row.averagePeakHourLabel}</dd>
                        </div>
                        <div>
                          <dt>Avg logs</dt>
                          <dd>
                            {formatAverageLogs(row.averageLogsPerSession)}
                          </dd>
                        </div>
                        <div>
                          <dt>Avg push time</dt>
                          <dd>{row.averagePushLabel}</dd>
                        </div>
                      </dl>
                    </article>
                  ))}
                </div>
              </section>

              <section className="global-leaderboard-card">
                <div className="stats-section-head">
                  <h3>Regions</h3>
                  <p>
                    Same preview rules, plus placeholder food profiles for each
                    region.
                  </p>
                </div>

                <div className="global-region-grid">
                  {globalAnalytics.regionalStats.map((row, index) => (
                    <article key={row.name} className="global-region-card">
                      <div className="global-row-head">
                        <span className="global-rank-badge">
                          R{String(index + 1).padStart(2, "0")}
                        </span>
                        <div className="global-row-title">
                          <h3>{row.name}</h3>
                          <p>
                            {row.sessionCount.toLocaleString()} counted sessions
                          </p>
                        </div>
                      </div>

                      <p className="global-region-food">{row.foodProfile}</p>

                      <dl className="global-metric-grid">
                        <div>
                          <dt>Avg total time</dt>
                          <dd>{row.averageDurationLabel}</dd>
                        </div>
                        <div>
                          <dt>Peak hour</dt>
                          <dd>{row.averagePeakHourLabel}</dd>
                        </div>
                        <div>
                          <dt>Avg logs</dt>
                          <dd>
                            {formatAverageLogs(row.averageLogsPerSession)}
                          </dd>
                        </div>
                        <div>
                          <dt>Avg push time</dt>
                          <dd>{row.averagePushLabel}</dd>
                        </div>
                      </dl>
                    </article>
                  ))}
                </div>
              </section>
            </section>

            <aside className="shell-aside">
              <section className="shell-aside-card">
                <h3>Preview only</h3>
                <p>{globalAnalytics.previewNotice}</p>
              </section>

              <section className="shell-aside-card">
                <h3>Just for browsing</h3>
                <p>
                  No settings live here. It is just a page of numbers to scroll
                  through.
                </p>
              </section>

              <section className="shell-aside-card">
                <h3>Later</h3>
                <p>
                  Real location-based totals and live updates can come later.
                </p>
              </section>
            </aside>
          </div>
        </section>

        <footer className="shell-footer">
          <span>
            <strong>Status:</strong> the world board is live in preview mode.
          </span>
          <span>Real location data and live totals come later.</span>
        </footer>
      </div>
    </main>
  );
}
