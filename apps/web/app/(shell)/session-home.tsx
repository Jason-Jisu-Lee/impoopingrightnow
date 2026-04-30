"use client";

import Link from "next/link";
import {
  type CSSProperties,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type PointerEvent,
} from "react";

import {
  appendLiveFeedMessage,
  buildSessionStats,
  completeSession,
  createUserLiveFeedMessage,
  createSessionActivityState,
  createSessionFlowState,
  ensureAnonymousProfile,
  formatDurationMs,
  getDailyPoopCounterSeed,
  getCurrentPushElapsedMs,
  getHoldButtonLabel,
  getSimulatedCounterSeed,
  getSeededLiveFeedMessage,
  getSessionElapsedMs,
  getWebPublicSupabaseEnv,
  parseStoredSessionHistory,
  sessionHistoryStorageKey,
  type LiveFeedMessage,
  type StoredSessionRecord,
  recordCompletedSession,
  releasePush,
  simulateCounterTick,
  startPush,
  startLiveSession,
  updateAnonymousProfile,
  type AnonymousProfile,
  type SessionActivityState,
  type SessionCertificate,
  type SessionFlowState,
  validateLiveFeedInput,
} from "@impoopingrightnow/shared";

import {
  PageBackControl,
  PageChromeControls,
  PoopLogoIcon,
} from "../_components/page-chrome-controls";
import {
  buildCompletedSessionSyncPayload,
  syncCompletedSessionToBackend,
} from "../_lib/session-sync";
import { ShellNav } from "../_components/shell-nav";

type IdentityCardState = {
  title: string;
  body: string;
};

type InlineNoticeState = {
  tone: "error" | "success";
  text: string;
} | null;

const browserIdentityStorage = {
  getItem(key: string) {
    if (typeof window === "undefined") {
      return null;
    }

    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem(key: string, value: string) {
    if (typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(key, value);
    } catch {
      // Ignore blocked storage and continue with a best-effort bootstrap.
    }
  },
};

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
    if (part.type === "year") {
      year = part.value;
    }

    if (part.type === "month") {
      month = part.value;
    }

    if (part.type === "day") {
      day = part.value;
    }
  }

  return `${year}-${month}-${day}`;
}

function createIdentityCardState(
  username: string | null,
  isSupabaseConfigured: boolean,
  email: string | null = null,
): IdentityCardState {
  if (!username) {
    return {
      title: "Getting Your Poop Data . . .",
      body: "",
    };
  }

  if (email) {
    return {
      title: `You are ${username}`,
      body: `Saved on this device with ${email} as your recovery email.`,
    };
  }

  if (isSupabaseConfigured) {
    return {
      title: `You are ${username}`,
      body: "Saved on this device and ready to go.",
    };
  }

  return {
    title: `You are ${username}`,
    body: "Saved on this device and ready to go.",
  };
}

function formatStartTime(startedAt: string | null): string {
  if (!startedAt) {
    return "Ready to start immediately.";
  }

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(startedAt));
}

function createPushHelperText(sessionActivity: SessionActivityState): string {
  if (sessionActivity.activePushStartedAt) {
    return "";
  }

  if (sessionActivity.lastPushMs !== null) {
    return ``;
  }

  return "";
}

function createFallbackUsername(): string {
  return "FiledWitness_00";
}

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

// Computes the current daily streak treating `now` (today) as already logged.
// Used to feed milestone selectors with the streak value reflecting the session
// that is about to be completed.
function computeStreakIncludingNow(
  records: readonly StoredSessionRecord[],
  now: Date,
): number {
  const dayKeys = new Set<string>();

  for (const record of records) {
    dayKeys.add(dayKey(new Date(record.completedAt)));
  }

  const today = new Date(now);

  today.setHours(0, 0, 0, 0);
  dayKeys.add(dayKey(today));

  let streak = 0;
  const cursor = new Date(today);

  while (dayKeys.has(dayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function readStoredSessionHistory(): StoredSessionRecord[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    return parseStoredSessionHistory(
      window.localStorage.getItem(sessionHistoryStorageKey),
    );
  } catch {
    return [];
  }
}

function formatLocalSlashDate(dateString: string | null): string {
  if (!dateString) {
    return "--/--/--";
  }

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "--/--/--";
  }

  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`;
}

function formatOptionalDuration(durationMs: number | null): string {
  return durationMs === null ? "--:--" : formatDurationMs(durationMs);
}

function formatTimerSMs(ms: number): string {
  const safe = Number.isFinite(ms) ? Math.max(0, ms) : 0;
  return (safe / 1000).toFixed(1);
}

function formatAverageCutNumber(value: number | null): string {
  if (value === null) {
    return "--";
  }

  return Number.isInteger(value) ? value.toString() : value.toFixed(1);
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
  return `${value.toFixed(1)} times / day`;
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
  weekday: number; // 0 = Sun
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

function formatCounterCopyPrefix(counter: number): string {
  return `${counter.toLocaleString()} people `;
}

function formatCounterCopySuffix(): string {
  return `ing right now`;
}

function SquattingPooperIcon() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.png"
      alt=""
      className="banner-counter-figure"
      aria-hidden="true"
    />
  );
}

type FloatingFeedStyle = CSSProperties & {
  "--floating-note-drift-x": string;
  "--floating-note-drift-y": string;
  "--floating-note-color": string;
};

function hashTextToUint(input: string): number {
  let hash = 2166136261;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function createFloatingFeedStyle(message: LiveFeedMessage): FloatingFeedStyle {
  const hash = hashTextToUint(message.id);
  const palette = [
    "#a03f1a",
    "#2f6d8c",
    "#6a2f83",
    "#2e6b4e",
    "#8a4c12",
    "#8f3058",
  ] as const;
  const lanes = [
    { topStart: 4, topRange: 14, leftStart: 30, leftRange: 8 },
    { topStart: 4, topRange: 14, leftStart: 68, leftRange: 6 },
    { topStart: 22, topRange: 14, leftStart: 28, leftRange: 8 },
    { topStart: 22, topRange: 14, leftStart: 66, leftRange: 6 },
    { topStart: 44, topRange: 14, leftStart: 30, leftRange: 6 },
    { topStart: 44, topRange: 14, leftStart: 70, leftRange: 6 },
    { topStart: 64, topRange: 14, leftStart: 28, leftRange: 8 },
    { topStart: 64, topRange: 14, leftStart: 66, leftRange: 6 },
  ] as const;
  const lane = lanes[hash % lanes.length];
  const top = lane.topStart + ((hash >>> 6) % lane.topRange);
  const left = lane.leftStart + ((hash >>> 12) % lane.leftRange);
  const driftX = -16 + ((hash >>> 18) % 33);
  const driftY = -14 - ((hash >>> 24) % 26);
  const durationMs = 6000 + (hash % 1801);

  return {
    top: `${top}%`,
    left: `${left}%`,
    animationDuration: `${durationMs}ms`,
    "--floating-note-drift-x": `${driftX}px`,
    "--floating-note-drift-y": `${driftY}px`,
    "--floating-note-color": palette[hash % palette.length] ?? palette[0],
  };
}

function FloatingFeedOverlay({
  messages,
  now,
}: {
  messages: LiveFeedMessage[];
  now: Date;
}) {
  const visibleMessages = messages
    .filter(
      (message) => now.getTime() - new Date(message.createdAt).getTime() < 7800,
    )
    .slice(-5);

  if (visibleMessages.length === 0) {
    return null;
  }

  return (
    <div className="session-floating-feed-layer" aria-hidden="true">
      {visibleMessages.map((message) => (
        <article
          key={message.id}
          className={`session-floating-feed-note${message.source === "user" ? " is-user" : ""}`}
          style={createFloatingFeedStyle(message)}
        >
          <p className="session-floating-feed-message">
            {message.message}{" "}
            <span className="session-feed-username">@{message.username}</span>
          </p>
        </article>
      ))}
    </div>
  );
}

function FlushConfettiOverlay({ token }: { token: number }) {
  if (token === 0) {
    return null;
  }

  return (
    <div key={token} className="session-flush-confetti" aria-hidden="true">
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
    </div>
  );
}

function LandingView({ onStart }: { onStart: () => void }) {
  return (
    <section className="session-home-panel session-landing-panel">
      <div className="session-home-actions">
        <p className="session-home-start-label">Ready to poop?</p>
        <button
          type="button"
          className="session-primary-action session-landing-action"
          onClick={onStart}
          aria-label="Start pooping session"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt=""
            className="session-hero-logo"
            aria-hidden="true"
          />
        </button>
      </div>
    </section>
  );
}

// ---- Live stat computation helpers ----

const VELOCITY_MAX_IN_PER_S = 0.42;
const PUSH_CAP_MS = 8_000;
const CONSTIPATION_PUSH_MS = 45_000;
const MASS_OZ_PER_PUSH_S = 0.022;

function computeFlowRawScore(
  completedPushes: number[],
  currentPushMs: number,
): number {
  const allPushes =
    currentPushMs > 0 ? [...completedPushes, currentPushMs] : completedPushes;

  if (allPushes.length === 0) return 0;

  const effortTotal = allPushes.reduce(
    (sum, d) => sum + Math.min(d, PUSH_CAP_MS) / PUSH_CAP_MS,
    0,
  );
  const normalizedEffort = 1 - Math.exp(-effortTotal * 0.5);

  let consistency = 0.5;
  if (allPushes.length >= 2) {
    const mean = allPushes.reduce((a, b) => a + b, 0) / allPushes.length;
    const variance =
      allPushes.reduce((sum, d) => sum + (d - mean) ** 2, 0) / allPushes.length;
    const cv = mean > 0 ? Math.sqrt(variance) / mean : 1;
    consistency = Math.max(0, 1 - cv * 0.5);
  }

  const avgPushMs = allPushes.reduce((a, b) => a + b, 0) / allPushes.length;
  const fragPenalty = avgPushMs < 1_000 ? 0.4 : avgPushMs < 2_500 ? 0.2 : 0;

  let fatigueFactor = 1.0;
  if (completedPushes.length >= 4) {
    const half = Math.floor(completedPushes.length / 2);
    const firstAvg =
      completedPushes.slice(0, half).reduce((a, b) => a + b, 0) / half;
    const secondAvg =
      completedPushes.slice(half).reduce((a, b) => a + b, 0) /
      (completedPushes.length - half);
    fatigueFactor = firstAvg > 0 ? Math.min(1.2, secondAvg / firstAvg) : 1.0;
  }

  const constipationFactor =
    currentPushMs > CONSTIPATION_PUSH_MS
      ? Math.max(0.2, 1 - (currentPushMs - CONSTIPATION_PUSH_MS) / 60_000)
      : 1.0;

  const raw =
    normalizedEffort *
    consistency *
    (1 - fragPenalty) *
    fatigueFactor *
    constipationFactor;

  return Math.min(100, raw * 100);
}

function formatVelocity(score: number): string {
  return ((score / 100) * VELOCITY_MAX_IN_PER_S * 60).toFixed(2);
}

function computeIntestinalPressure(
  totalPushMs: number,
  currentPushMs: number,
  isHolding: boolean,
): number {
  const base = 2.1 + (totalPushMs / 60_000) * 1.2;
  const active = isHolding
    ? base + (Math.min(currentPushMs, 8_000) / 8_000) * 4.5
    : base * 0.88;
  return Math.min(12.0, Math.max(1.2, active));
}

function computeMassEjectedOz(
  totalPushMs: number,
  currentPushMs: number,
): number {
  return ((totalPushMs + currentPushMs) / 1_000) * MASS_OZ_PER_PUSH_S;
}

function computeStrainEfficiency(
  totalPushMs: number,
  currentPushMs: number,
  totalElapsedMs: number,
): number {
  if (totalElapsedMs <= 0) return 0;
  return Math.min(100, ((totalPushMs + currentPushMs) / totalElapsedMs) * 100);
}

function getStructuralIntegrity(totalElapsedMs: number): string {
  const min = totalElapsedMs / 60_000;
  if (min < 3) return "NOMINAL";
  if (min < 8) return "STRAINED";
  if (min < 15) return "COMPROMISED";
  return "CRITICAL";
}

// ---- Active session view ----

function ActiveSessionView({
  sessionActivity,
  now,
  confettiToken,
  onHoldStart,
  onHoldEnd,
}: {
  sessionActivity: SessionActivityState;
  now: Date;
  confettiToken: number;
  onHoldStart: (event: PointerEvent<HTMLButtonElement>) => void;
  onHoldEnd: (event: PointerEvent<HTMLButtonElement>) => void;
}) {
  const sessionElapsedLabel = formatDurationMs(
    getSessionElapsedMs(sessionActivity, now),
  );
  const pushElapsedLabel = formatTimerSMs(
    getCurrentPushElapsedMs(sessionActivity, now),
  );
  const isHolding = Boolean(sessionActivity.activePushStartedAt);

  const [pushHistory, setPushHistory] = useState<number[]>([]);
  const smoothedFlowScoreRef = useRef(0);
  const [liveVelocity, setLiveVelocity] = useState(0);
  const [livePushMs, setLivePushMs] = useState(0);
  const rafRef = useRef(0);

  useEffect(() => {
    function tick() {
      const currentMs = getCurrentPushElapsedMs(sessionActivity, new Date());
      const raw = computeFlowRawScore(pushHistory, currentMs);
      smoothedFlowScoreRef.current =
        smoothedFlowScoreRef.current * 0.85 + raw * 0.15;
      setLiveVelocity(smoothedFlowScoreRef.current);
      setLivePushMs(currentMs);
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pushHistory, sessionActivity.activePushStartedAt]);

  useEffect(() => {
    if (sessionActivity.lastPushMs != null) {
      setPushHistory((prev) => [...prev, sessionActivity.lastPushMs!]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionActivity.pushCount]);

  const currentPushMs = getCurrentPushElapsedMs(sessionActivity, now);
  const rawFlowScore = computeFlowRawScore(pushHistory, currentPushMs);
  smoothedFlowScoreRef.current =
    smoothedFlowScoreRef.current * 0.85 + rawFlowScore * 0.15;
  const smoothedFlowScore = liveVelocity;

  const totalElapsedMs = getSessionElapsedMs(sessionActivity, now);
  const pressure = computeIntestinalPressure(
    sessionActivity.totalPushMs,
    currentPushMs,
    isHolding,
  );
  const massOz = computeMassEjectedOz(
    sessionActivity.totalPushMs,
    currentPushMs,
  );
  const efficiency = computeStrainEfficiency(
    sessionActivity.totalPushMs,
    currentPushMs,
    totalElapsedMs,
  );
  const integrity = getStructuralIntegrity(totalElapsedMs);
  const isConstipated = currentPushMs > CONSTIPATION_PUSH_MS;

  return (
    <section className="session-home-panel session-live-shell">
      <div className="session-elapsed-overlay" aria-hidden="true">
        {sessionElapsedLabel}
      </div>
      <div className="session-hold-spacer" aria-hidden="true" />
      <div className="session-hold-wrap">
        {confettiToken > 0 ? (
          <div
            key={confettiToken}
            className="session-mini-confetti"
            aria-hidden="true"
          >
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
        ) : null}

        <p
          className="session-home-start-label"
          style={{ textTransform: "none" }}
        >
          PRESS, HOLD, AND FOCUS
        </p>
        <button
          type="button"
          className={`session-hold-button session-primary-action${isHolding ? " is-holding" : ""}`}
          aria-pressed={isHolding}
          onPointerDown={onHoldStart}
          onPointerUp={onHoldEnd}
          onPointerCancel={onHoldEnd}
          onContextMenu={(e) => e.preventDefault()}
          onTouchStart={(e) => e.preventDefault()}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={
              isHolding
                ? livePushMs < 2000
                  ? "/logo-push-1.png"
                  : "/logo-push-2.png"
                : "/logo.png"
            }
            alt=""
            className={`session-hero-logo${isHolding ? " session-hero-logo--push" : ""}${isHolding && livePushMs >= 2000 ? " session-hero-logo--push-2" : ""}`}
            aria-hidden="true"
          />
        </button>
      </div>
      <p className="session-push-helper">
        {createPushHelperText(sessionActivity)}
      </p>

      <div className="session-live-stats">
        <div className="session-live-stat">
          <span className="session-live-stat-label">Started time</span>
          <span className="session-live-stat-value">
            {formatStartTime(sessionActivity.startedAt)}
          </span>
        </div>
        <div className="session-live-stat">
          <span className="session-live-stat-label">Push timer</span>
          <span className="session-live-stat-value">
            {formatTimerSMs(livePushMs)}{" "}
            s
          </span>
        </div>
        <div className="session-live-stat">
          <span className="session-live-stat-label">Poop Cut Count</span>
          <span className="session-live-stat-value">
            {sessionActivity.pushCount}
          </span>
        </div>
        <div className="session-live-stat">
          <span className="session-live-stat-label">Estimated velocity</span>
          <span className="session-live-stat-value">
            {formatVelocity(smoothedFlowScore)} in/min
          </span>
        </div>
      </div>

      <div className="session-bottom-controls"></div>
    </section>
  );
}

function CertificateView({
  certificate,
  onGoAgain,
  onDone,
}: {
  certificate: SessionCertificate;
  onGoAgain: () => void;
  onDone: () => void;
}) {
  return (
    <section className="session-home-panel session-certificate-panel">
      <div className="certificate-topline">
        <span className="session-live-stamp">{certificate.issuedAtLabel}</span>
      </div>

      <div className="certificate-paper">
        <h2 className="certificate-title">{certificate.certHeadline}</h2>
        <div className="certificate-key-stat">
          <span className="certificate-key-stat-label">{certificate.certKeyStatLabel}</span>
          <span className="certificate-key-stat-value">{certificate.certKeyStatValue}</span>
        </div>
        <p className="certificate-body">{certificate.certSubline}</p>

        <div className="session-live-stats">
          <div className="session-live-stat">
            <span className="session-live-stat-label">Started</span>
            <span className="session-live-stat-value">
              {formatStartTime(certificate.startedAt)}
            </span>
          </div>
          <div className="session-live-stat">
            <span className="session-live-stat-label">Duration</span>
            <span className="session-live-stat-value">
              {certificate.durationLabel}
            </span>
          </div>
          <div className="session-live-stat">
            <span className="session-live-stat-label">Cuts</span>
            <span className="session-live-stat-value">
              {certificate.pushCount}
            </span>
          </div>
          <div className="session-live-stat">
            <span className="session-live-stat-label">Push time</span>
            <span className="session-live-stat-value">
              {certificate.totalPushLabel}
            </span>
          </div>
        </div>

        <div className="certificate-seal-row">
          <span className="certificate-seal">{certificate.sealLabel}</span>
        </div>
      </div>

      <div className="certificate-poop-thoughts">
        <p className="certificate-poop-thoughts-prompt">
          Someone out there is pooping <em>right now</em>. Drop them a poop
          thought — they deserve it.
        </p>
        <button type="button" className="certificate-poop-thought-btn" disabled>
          Send a Poop Thought · coming soon
        </button>
      </div>

      <div className="certificate-actions">
        <button
          type="button"
          className="session-primary-action"
          onClick={onGoAgain}
        >
          IT&apos;S COMING OUT AGAIN
        </button>
        <button type="button" className="certificate-done-btn" onClick={onDone}>
          I&apos;m Done
        </button>
      </div>
    </section>
  );
}

export function SessionHome() {
  const [identityCard, setIdentityCard] = useState<IdentityCardState>(
    createIdentityCardState(null, false),
  );
  const [identityProfile, setIdentityProfile] =
    useState<AnonymousProfile | null>(null);
  const [identityUsername, setIdentityUsername] = useState<string | null>(null);
  const [completedSessionCount, setCompletedSessionCount] = useState(0);
  const [flowState, setFlowState] = useState<SessionFlowState>(() =>
    createSessionFlowState(),
  );
  const [sessionActivity, setSessionActivity] =
    useState<SessionActivityState | null>(null);
  const [certificate, setCertificate] = useState<SessionCertificate | null>(
    null,
  );
  const immediateGenEnabled = true;
  const [isYearHeatmapOpen, setIsYearHeatmapOpen] = useState(false);
  const [timerNow, setTimerNow] = useState<Date>(() => new Date());
  const [confettiToken, setConfettiToken] = useState(0);
  const [flushConfettiToken, setFlushConfettiToken] = useState(0);
  const [simulatedCounter, setSimulatedCounter] = useState(() =>
    getSimulatedCounterSeed(),
  );
  const [dailyPoopCounter, setDailyPoopCounter] = useState(() =>
    getDailyPoopCounterSeed(),
  );
  const [isRealtimeStatsActive, setIsRealtimeStatsActive] = useState(true);
  const isRealtimeStatsActiveRef = useRef(isRealtimeStatsActive);
  useEffect(() => {
    isRealtimeStatsActiveRef.current = isRealtimeStatsActive;
  }, [isRealtimeStatsActive]);
  const [hasLoadedPreviousLocalData, setHasLoadedPreviousLocalData] =
    useState(false);
  const [sessionHistoryRecords, setSessionHistoryRecords] = useState<
    StoredSessionRecord[]
  >([]);
  const [liveFeedMessages, setLiveFeedMessages] = useState<LiveFeedMessage[]>(
    [],
  );
  const [feedDraft, setFeedDraft] = useState("");
  const [feedNotice, setFeedNotice] = useState<InlineNoticeState>(null);
  const [isDiarrheaSession, setIsDiarrheaSession] = useState(false);
  const simulatedCounterRef = useRef(simulatedCounter);
  const dailyPoopCounterDayRef = useRef(getEasternDayKey(new Date()));
  const lastFeedMessageId =
    liveFeedMessages[liveFeedMessages.length - 1]?.id ?? null;
  const isCertificateVisible = certificate !== null;
  const isActiveSession =
    !isCertificateVisible &&
    flowState.stage === "active" &&
    sessionActivity !== null;
  const isLandingState = !isCertificateVisible && !isActiveSession;

  useEffect(() => {
    let isMounted = true;

    async function provisionIdentity() {
      const localIdentity = await ensureAnonymousProfile(
        browserIdentityStorage,
      );
      const existingRecords = readStoredSessionHistory();

      if (!isMounted) {
        return;
      }

      setIdentityProfile(localIdentity.profile);
      setIdentityUsername(localIdentity.profile.username);
      setSessionHistoryRecords(existingRecords);
      setHasLoadedPreviousLocalData(existingRecords.length > 0);
      setCompletedSessionCount(existingRecords.length);
      setIdentityCard(
        createIdentityCardState(
          localIdentity.profile.username,
          Boolean(getWebPublicSupabaseEnv()),
          localIdentity.profile.email,
        ),
      );
    }

    provisionIdentity().catch(() => {
      if (!isMounted) {
        return;
      }

      setIdentityUsername(null);
      setIdentityProfile(null);
      const existingRecords = readStoredSessionHistory();
      setSessionHistoryRecords(existingRecords);
      setHasLoadedPreviousLocalData(existingRecords.length > 0);
      setCompletedSessionCount(existingRecords.length);
      setIdentityCard({
        title: "Anonymous record unavailable",
        body: "Local storage is unavailable, so identity will be recreated until storage access succeeds.",
      });
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    function handleOnline() {
      setIsRealtimeStatsActive(true);
    }

    function handleOffline() {
      setIsRealtimeStatsActive(false);
    }

    setIsRealtimeStatsActive(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!sessionActivity?.startedAt) {
      return;
    }

    setTimerNow(new Date());

    const intervalId = window.setInterval(() => {
      setTimerNow(new Date());
    }, 250);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [sessionActivity?.startedAt]);

  useEffect(() => {
    let isActive = true;
    let timeoutId = 0;

    function scheduleNextTick(delayMs: number) {
      timeoutId = window.setTimeout(() => {
        if (!isActive) {
          return;
        }

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

        if (didCounterDecrease) {
          const sessionDurationMs =
            30_000 + Math.floor(Math.random() * 270_001);
          const messageCount = Math.floor(Math.random() * 3); // 0, 1, or 2
          for (let msgIndex = 0; msgIndex < messageCount; msgIndex += 1) {
            const msgDelayMs = Math.floor(Math.random() * sessionDurationMs);
            window.setTimeout(() => {
              if (!isActive) return;
              const msg = getSeededLiveFeedMessage({});
              setLiveFeedMessages((current) => {
                const last = current[current.length - 1];
                const lastTime = last ? new Date(last.createdAt).getTime() : 0;
                const now2 = new Date();
                const safeTime = new Date(
                  Math.max(now2.getTime(), lastTime + 150),
                );
                return appendLiveFeedMessage(current, {
                  ...msg,
                  createdAt: safeTime.toISOString(),
                });
              });
            }, msgDelayMs);
          }
        }

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

  function handleStartSession() {
    const sessionStart = new Date();
    const nextFlowState = startLiveSession(sessionStart);

    setCertificate(null);
    setFlowState(nextFlowState);
    setSessionActivity(
      createSessionActivityState(
        nextFlowState.startedAt ?? sessionStart.toISOString(),
      ),
    );
    setTimerNow(sessionStart);
    setConfettiToken(0);
    setIsDiarrheaSession(false);
    setFeedDraft("");
    setFeedNotice(null);
  }

  function handleReturnHome() {
    setFlowState(createSessionFlowState());
    setSessionActivity(null);
    setCertificate(null);
    setTimerNow(new Date());
    setConfettiToken(0);
    setFlushConfettiToken(0);
    setFeedDraft("");
    setFeedNotice(null);
    setIsDiarrheaSession(false);
  }

  function persistCompletedSession(nextCertificate: SessionCertificate) {
    void recordCompletedSession(browserIdentityStorage, nextCertificate)
      .then((nextRecords) => {
        setSessionHistoryRecords(nextRecords);
        setCompletedSessionCount(nextRecords.length);
      })
      .catch(() => {
        const existingRecords = readStoredSessionHistory();
        setSessionHistoryRecords(existingRecords);
        setCompletedSessionCount(existingRecords.length);
      });

    if (!identityProfile) {
      return;
    }

    void syncCompletedSessionToBackend(
      buildCompletedSessionSyncPayload(identityProfile, nextCertificate),
    ).catch(() => {
      // Keep the local-first flow intact if backend sync fails.
    });
  }

  function handleFlush() {
    if (!sessionActivity) {
      return;
    }

    const endedAt = new Date();
    const { certificate: nextCertificate } = completeSession(
      sessionActivity,
      identityUsername ?? createFallbackUsername(),
      endedAt,
      {
        poopedCountIncludingThis: sessionHistoryRecords.length + 1,
        streakIncludingThis: computeStreakIncludingNow(
          sessionHistoryRecords,
          endedAt,
        ),
      },
    );

    persistCompletedSession(nextCertificate);

    setTimerNow(endedAt);
    setCertificate(nextCertificate);
    setSessionActivity(null);
    setFlowState(createSessionFlowState());
    setFlushConfettiToken((current) => current + 1);
    setConfettiToken(0);
  }

  function handleHoldStart(event: PointerEvent<HTMLButtonElement>) {
    if (!sessionActivity || sessionActivity.activePushStartedAt) {
      return;
    }

    if (typeof event.currentTarget.setPointerCapture === "function") {
      event.currentTarget.setPointerCapture(event.pointerId);
    }

    const pushStartedAt = new Date();
    const nextState = startPush(sessionActivity, pushStartedAt);

    if (nextState === sessionActivity) {
      return;
    }

    setTimerNow(pushStartedAt);
    setSessionActivity(nextState);
  }

  function handleHoldEnd(event: PointerEvent<HTMLButtonElement>) {
    if (
      typeof event.currentTarget.hasPointerCapture === "function" &&
      event.currentTarget.hasPointerCapture(event.pointerId)
    ) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (!sessionActivity) {
      return;
    }

    const pushReleasedAt = new Date();
    const nextState = releasePush(sessionActivity, pushReleasedAt);

    if (nextState === sessionActivity) {
      return;
    }

    setTimerNow(pushReleasedAt);

    if (immediateGenEnabled) {
      const { certificate: nextCertificate } = completeSession(
        nextState,
        identityUsername ?? createFallbackUsername(),
        pushReleasedAt,
        {
          poopedCountIncludingThis: sessionHistoryRecords.length + 1,
          streakIncludingThis: computeStreakIncludingNow(
            sessionHistoryRecords,
            pushReleasedAt,
          ),
        },
      );

      persistCompletedSession(nextCertificate);

      setCertificate(nextCertificate);
      setSessionActivity(null);
      setFlowState(createSessionFlowState());
      setFlushConfettiToken((current) => current + 1);
      setConfettiToken(0);
    } else {
      // Keep session alive — user must press Flush to generate cert
      setSessionActivity(nextState);
      setConfettiToken(0);
    }
  }

  function handleFeedSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationResult = validateLiveFeedInput(feedDraft);

    if (validationResult.status === "invalid") {
      setFeedNotice({
        tone: "error",
        text: validationResult.errorMessage,
      });
      return;
    }

    const nextMessage = createUserLiveFeedMessage({
      username: identityUsername ?? createFallbackUsername(),
      message: validationResult.normalizedMessage,
    });

    setLiveFeedMessages((current) =>
      appendLiveFeedMessage(current, nextMessage),
    );
    setFeedDraft("");
    setFeedNotice({
      tone: "success",
      text: "Note dropped into the room.",
    });
  }

  const certificateChecklist = certificate
    ? [
        `${certificate.pushCount} cuts certified across ${certificate.durationLabel}.`,
        `${certificate.totalPushLabel} of total push time recorded on the certificate.`,
        "Sharing and live ranking can come later.",
      ]
    : [];

  const totalPoops = sessionHistoryRecords.length;
  const totalSessionDurationMs = sessionHistoryRecords.reduce(
    (sum, record) => sum + record.durationMs,
    0,
  );
  const totalActivePushMs = sessionHistoryRecords.reduce(
    (sum, record) => sum + record.totalPushMs,
    0,
  );
  const totalCutCount = sessionHistoryRecords.reduce(
    (sum, record) => sum + record.pushCount,
    0,
  );
  const diarrheaCount = sessionHistoryRecords.filter(
    (record) => record.wasDiarrhea,
  ).length;
  const sessionStatsSnapshot = buildSessionStats(sessionHistoryRecords);
  const userStatsHeatmap =
    sessionStatsSnapshot?.heatmap.slice(-63) ??
    Array.from({ length: 63 }, (_, index) => ({
      dateKey: `empty-${index}`,
      count: 0,
      level: 0 as const,
    }));
  const averageSessionDurationMs =
    totalPoops > 0 ? Math.round(totalSessionDurationMs / totalPoops) : null;
  const averageActivePushDurationMs =
    totalPoops > 0 ? Math.round(totalActivePushMs / totalPoops) : null;
  const averageCutNumber = totalPoops > 0 ? totalCutCount / totalPoops : null;

  const uniqueDayKeys = new Set(
    sessionHistoryRecords.map((record) =>
      toLocalDateKey(new Date(record.completedAt)),
    ),
  );
  const uniqueDayCount = uniqueDayKeys.size;
  const averagePoopsPerDay =
    uniqueDayCount > 0 ? totalPoops / uniqueDayCount : null;

  const startMinuteValues = sessionHistoryRecords.map((record) => {
    const start = new Date(
      new Date(record.completedAt).getTime() - record.durationMs,
    );
    return start.getHours() * 60 + start.getMinutes();
  });
  const averageStartMinutes =
    startMinuteValues.length > 0
      ? startMinuteValues.reduce((sum, value) => sum + value, 0) /
        startMinuteValues.length
      : null;

  const yearHeatmapNow = new Date();
  const yearHeatmap = buildYearHeatmap(sessionHistoryRecords, yearHeatmapNow);
  const yearLabel = yearHeatmapNow.getFullYear();

  return (
    <main className="shell-page shell-home-page">
      <PageChromeControls onHome={handleReturnHome} />

      <FlushConfettiOverlay token={flushConfettiToken} />
      <div className="shell-daily-poop-counter" aria-live="polite">
        Daily Poop Counter: {dailyPoopCounter.toLocaleString()}
      </div>

      <div className="shell-frame">
        <section
          className={`shell-banner shell-banner-home${isActiveSession ? " is-session-active" : ""}`}
        >
          <div className="shell-banner-row is-centered">
            <span className="banner-counter">
              {formatCounterCopyPrefix(simulatedCounter)}
              <SquattingPooperIcon />
              {formatCounterCopySuffix()}
            </span>
          </div>
        </section>

        <section className="shell-main">
          {!isLandingState ? (
            <PageBackControl onBack={handleReturnHome} />
          ) : null}

          {!isCertificateVisible ? (
            <FloatingFeedOverlay messages={liveFeedMessages} now={timerNow} />
          ) : null}

          <div
            className={`shell-content-grid${isLandingState || isActiveSession || isCertificateVisible ? " is-landing-layout" : ""}`}
          >
            <div className="session-panel-stack">
              {isActiveSession && sessionActivity ? (
                <ActiveSessionView
                  sessionActivity={sessionActivity}
                  now={timerNow}
                  confettiToken={confettiToken}
                  onHoldStart={handleHoldStart}
                  onHoldEnd={handleHoldEnd}
                />
              ) : !isCertificateVisible ? (
                <LandingView onStart={handleStartSession} />
              ) : null}

              {isCertificateVisible && certificate ? (
                <CertificateView
                  certificate={certificate}
                  onGoAgain={handleStartSession}
                  onDone={handleReturnHome}
                />
              ) : null}
            </div>

            {!isActiveSession && !isCertificateVisible ? (
              <aside
                className={`shell-aside${isLandingState ? " is-landing-layout" : ""}`}
              >
                {identityProfile ? (
                  <section className="shell-aside-card shell-user-stats-card">
                    <div className="shell-user-stats-layout">
                      <div className="shell-user-stats-text-cols">
                        <div className="shell-user-stats-col">
                          <p className="session-user-stats-line">
                            <span className="session-user-stats-label">
                              username:
                            </span>{" "}
                            <strong className="session-user-stats-value">
                              {identityProfile.username}
                            </strong>
                          </p>
                          <p className="session-user-stats-line">
                            <span className="session-user-stats-label">
                              pooped:
                            </span>{" "}
                            <strong className="session-user-stats-value">
                              {totalPoops.toLocaleString()}{" "}
                              {totalPoops === 1 ? "time" : "times"}
                            </strong>
                          </p>
                          <p className="session-user-stats-line">
                            <span className="session-user-stats-label">
                              average session time:
                            </span>{" "}
                            <strong className="session-user-stats-value">
                              {formatOptionalDuration(averageSessionDurationMs)}
                            </strong>
                          </p>
                          <p className="session-user-stats-line">
                            <span className="session-user-stats-label">
                              average poop time:
                            </span>{" "}
                            <strong className="session-user-stats-value">
                              {formatOptionalDuration(
                                averageActivePushDurationMs,
                              )}
                            </strong>
                          </p>
                        </div>
                        <div className="shell-user-stats-col">
                          <p className="session-user-stats-line">
                            <span className="session-user-stats-label">
                              average session start time:
                            </span>{" "}
                            <strong className="session-user-stats-value">
                              {formatTimeOfDay(averageStartMinutes)}
                            </strong>
                          </p>
                          <p className="session-user-stats-line">
                            <span className="session-user-stats-label">
                              average poop a day:
                            </span>{" "}
                            <strong className="session-user-stats-value">
                              {formatPerDay(averagePoopsPerDay)}
                            </strong>
                          </p>
                          <p className="session-user-stats-line">
                            <span className="session-user-stats-label">
                              current streak:
                            </span>{" "}
                            <strong className="session-user-stats-value">
                              {sessionStatsSnapshot?.streaks.current ?? 0}{" "}
                              {(sessionStatsSnapshot?.streaks.current ?? 0) ===
                              1
                                ? "day"
                                : "days"}
                            </strong>
                          </p>
                          <p className="session-user-stats-line">
                            <span className="session-user-stats-label">
                              best streak:
                            </span>{" "}
                            <strong className="session-user-stats-value">
                              {sessionStatsSnapshot?.streaks.best ?? 0}{" "}
                              {(sessionStatsSnapshot?.streaks.best ?? 0) === 1
                                ? "day"
                                : "days"}
                            </strong>
                          </p>
                        </div>
                      </div>

                      <div className="shell-user-stats-side">
                        <div className="shell-user-stats-streak-grid"></div>

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
                                data-tip={`${cell.dateKey.replace(/-/g, "/")} · ${cell.count} ${cell.count === 1 ? "time" : "times"}`}
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
                              title={`${cell.dateKey.replace(/-/g, "/")}: ${cell.count} ${cell.count === 1 ? "time" : "times"}`}
                            />
                          ))}
                        </div>
                        <div className="shell-year-heatmap-legend">
                          <span className="shell-year-heatmap-legend-label">
                            Less
                          </span>
                          <span className="stats-heatmap-cell level-0" />
                          <span className="stats-heatmap-cell level-1" />
                          <span className="stats-heatmap-cell level-2" />
                          <span className="stats-heatmap-cell level-3" />
                          <span className="stats-heatmap-cell level-4" />
                          <span className="shell-year-heatmap-legend-label">
                            More
                          </span>
                        </div>
                      </div>
                    ) : null}
                  </section>
                ) : (
                  <section className="shell-aside-card">
                    <h3>{identityCard.title}</h3>
                    {identityCard.body ? <p>{identityCard.body}</p> : null}
                  </section>
                )}

                {isCertificateVisible ? (
                  <>
                    <section className="shell-aside-card">
                      <h3>Certificate notes</h3>
                      <ul className="shell-checklist">
                        {certificateChecklist.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </section>

                    <section className="shell-aside-card">
                      <div className="shell-stamp">Certificate placeholder</div>
                    </section>
                  </>
                ) : null}
              </aside>
            ) : null}
          </div>
        </section>

        <ShellNav />
      </div>

      <footer className="shell-footer">
        <p className="session-status-line" aria-live="polite">
          <strong>Status:</strong>
          <span className="session-status-item-inline">
            real-time stats
            <span
              className={`session-status-dot${isRealtimeStatsActive ? " is-active" : " is-inactive"}`}
              aria-label={isRealtimeStatsActive ? "active" : "inactive"}
              title={isRealtimeStatsActive ? "active" : "inactive"}
            />
          </span>
          <span className="session-status-item-inline">
            local data loaded
            <span
              className={`session-status-dot${hasLoadedPreviousLocalData ? " is-active" : " is-inactive"}`}
              aria-label={hasLoadedPreviousLocalData ? "active" : "inactive"}
              title={hasLoadedPreviousLocalData ? "active" : "inactive"}
            />
          </span>
        </p>
      </footer>
    </main>
  );
}
