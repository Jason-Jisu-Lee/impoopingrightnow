"use client";

import { useEffect, useRef, useState } from "react";

import {
  getDailyPoopCounterSeed,
  getSimulatedCounterSeed,
  simulateCounterTick,
} from "@impoopingrightnow/shared";

import {
  PageBackControl,
  PageChromeControls,
} from "../_components/page-chrome-controls";
import { ShellNav } from "../_components/shell-nav";

const easternDayFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function getEasternDayKey(now: Date): string {
  const parts = easternDayFormatter.formatToParts(now);
  let year = "0000";
  let month = "00";
  let day = "00";
  for (const part of parts) {
    if (part.type === "year") year = part.value;
    if (part.type === "month") month = part.value;
    if (part.type === "day") day = part.value;
  }
  return `${year}-${month}-${day}`;
}

export default function UnderConstructionPage() {
  const [simulatedCounter, setSimulatedCounter] = useState(() =>
    getSimulatedCounterSeed(),
  );
  const [dailyPoopCounter, setDailyPoopCounter] = useState(() =>
    getDailyPoopCounterSeed(),
  );
  const simulatedCounterRef = useRef(simulatedCounter);
  const dailyPoopCounterDayRef = useRef(getEasternDayKey(new Date()));

  useEffect(() => {
    let isActive = true;
    let timeoutId = 0;

    function scheduleNextTick(delayMs: number) {
      timeoutId = window.setTimeout(() => {
        if (!isActive) return;
        const nextSnapshot = simulateCounterTick(
          simulatedCounterRef.current,
          new Date(),
        );
        const nextTickTime = new Date();
        const nextDayKey = getEasternDayKey(nextTickTime);
        const didCounterDecrease =
          nextSnapshot.count < simulatedCounterRef.current;
        if (nextDayKey !== dailyPoopCounterDayRef.current) {
          dailyPoopCounterDayRef.current = nextDayKey;
          setDailyPoopCounter(didCounterDecrease ? 1 : 0);
        } else if (didCounterDecrease) {
          setDailyPoopCounter((current) => current + 1);
        }
        simulatedCounterRef.current = nextSnapshot.count;
        setSimulatedCounter(nextSnapshot.count);
        scheduleNextTick(nextSnapshot.nextDelayMs);
      }, delayMs);
    }

    scheduleNextTick(
      simulateCounterTick(simulatedCounterRef.current, new Date()).nextDelayMs,
    );

    return () => {
      isActive = false;
      window.clearTimeout(timeoutId);
    };
  }, []);

  return (
    <main className="shell-page shell-home-page">
      <PageChromeControls />

      <div className="shell-daily-poop-counter" aria-live="polite">
        Daily Poop Counter: {dailyPoopCounter.toLocaleString()}
      </div>

      <ShellNav />

      <div className="shell-frame">
        <section className="shell-banner shell-banner-home">
          <div className="shell-banner-row is-centered">
            <span className="banner-counter">
              {simulatedCounter.toLocaleString()} people{" "}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt=""
                className="banner-counter-figure"
                aria-hidden="true"
              />
              ing right now
            </span>
          </div>
        </section>

        <section className="shell-main">
          <PageBackControl />

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
      </div>
    </main>
  );
}
