"use client";

import { useEffect, useState } from "react";

import {
  buildGlobalAnalyticsSnapshot,
  parseStoredSessionHistory,
  sessionHistoryStorageKey,
} from "@impoopingrightnow/shared";

import {
  PageBackControl,
  PageChromeControls,
} from "../_components/page-chrome-controls";
import { ShellNav } from "../_components/shell-nav";

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
      <PageChromeControls />

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
              <h1 className="banner-title">Something to read while you sit.</h1>
            </div>
          </div>
          <p className="banner-subtitle">
            This page is just for browsing. The numbers are still preview data
            for now.
          </p>
        </section>

        <section className="shell-main">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "40vh",
              fontFamily: "Georgia, serif",
              fontSize: "clamp(1.1rem, 3vw, 1.6rem)",
              letterSpacing: "0.04em",
              color: "var(--ink)",
              textAlign: "center",
            }}
          >
            Collecting Data . . .
          </div>
        </section>

        <ShellNav />

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
