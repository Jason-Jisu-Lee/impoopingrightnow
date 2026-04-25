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
  { href: "/global", label: "Census", title: "Global" },
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
            <span className="eyebrow">Global Analytics</span>
            <span className="banner-counter">
              Preview census · {globalAnalytics.countryLeaderboard.length}{" "}
              countries / {globalAnalytics.regionalStats.length} regions
            </span>
          </div>
          <div className="shell-banner-row">
            <div>
              <p className="eyebrow">impoopingrightnow.com</p>
              <h1 className="banner-title">
                A public leaderboard for bowel geopolitics.
              </h1>
            </div>
          </div>
          <p className="banner-subtitle">
            This page is browseable and read-only now, but still honest about
            the data source: the leaderboard is preview analytics until
            geolocation and real aggregation land in a later slice.
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
                <p className="eyebrow">Browsable public census</p>
                <h2 className="shell-panel-title">
                  Thresholded leaderboard copy without pretending the geo
                  pipeline exists yet.
                </h2>
                <p className="shell-panel-body">
                  Countries and regions only appear once the preview dataset
                  clears the minimum session threshold. Food profiles stay
                  hardcoded and intentionally absurd for v1.
                </p>
              </header>

              <section className="global-summary-grid">
                <article className="global-summary-card">
                  <span className="stats-record-label">This Device</span>
                  <strong>{localSessionCount.toLocaleString()}</strong>
                  <p className="global-summary-copy">
                    Completed sessions saved locally in this browser. They
                    inform My Stats, not the preview world board.
                  </p>
                </article>

                <article className="global-summary-card">
                  <span className="stats-record-label">Threshold</span>
                  <strong>{globalAnalytics.minimumSessions} sessions</strong>
                  <p className="global-summary-copy">
                    Any country or region stays off the board until it clears
                    the minimum qualifying volume.
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
                  <h3>Country Leaderboard</h3>
                  <p>
                    Ranked by average total poop time. Peak hour, log rate, and
                    push time sit beside it so the nonsense looks properly
                    bureaucratic.
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
                            {row.sessionCount.toLocaleString()} qualifying
                            sessions
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
                  <h3>Regional Stats</h3>
                  <p>
                    Same threshold rule, same deadpan presentation, plus
                    hardcoded placeholder food profiles for each qualifying
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
                            {row.sessionCount.toLocaleString()} qualifying
                            sessions
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
                <h3>Preview Mode</h3>
                <p>{globalAnalytics.previewNotice}</p>
              </section>

              <section className="shell-aside-card">
                <h3>Read-Only Rule</h3>
                <p>
                  This route is meant to be browsed while pooping, not
                  configured. No inputs, no settings, no user-supplied food
                  data.
                </p>
              </section>

              <section className="shell-aside-card">
                <h3>Later Data Slice</h3>
                <p>
                  Real country rankings and region buckets depend on
                  session-save geolocation and aggregated Supabase queries,
                  which are still deferred.
                </p>
              </section>
            </aside>
          </div>
        </section>

        <footer className="shell-footer">
          <span>
            <strong>Status:</strong> global analytics is browseable on web in
            clearly labeled preview mode.
          </span>
          <span>
            Real geo buckets and live aggregates remain a later slice.
          </span>
        </footer>
      </div>
    </main>
  );
}
