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
        <section className="shell-main">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "calc(100svh - 170px)",
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
      </div>
    </main>
  );
}
