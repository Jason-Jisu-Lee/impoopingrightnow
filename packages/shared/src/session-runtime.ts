import { masterWordBank } from "./word-bank";

export type SessionActivityState = {
  startedAt: string;
  pushCount: number;
  totalPushMs: number;
  longestPushMs: number;
  activePushStartedAt: string | null;
  lastPushMs: number | null;
};

export type SessionCertificate = {
  username: string;
  durationMs: number;
  durationLabel: string;
  pushCount: number;
  totalPushMs: number;
  totalPushLabel: string;
  startedAt: string;
  endedAt: string;
  issuedAtLabel: string;
  rankLabel: string;
  sealLabel: string;
  certHeadline: string;
  certSubline: string;
};

function getSafeElapsedMs(startedAt: string, now: Date): number {
  const startedAtMs = new Date(startedAt).getTime();
  const nowMs = now.getTime();

  if (Number.isNaN(startedAtMs) || Number.isNaN(nowMs)) {
    return 0;
  }

  return Math.max(0, nowMs - startedAtMs);
}

export function createSessionActivityState(
  startedAt: string,
): SessionActivityState {
  return {
    startedAt,
    pushCount: 0,
    totalPushMs: 0,
    longestPushMs: 0,
    activePushStartedAt: null,
    lastPushMs: null,
  };
}

export function getSessionElapsedMs(
  state: SessionActivityState,
  now: Date = new Date(),
): number {
  return getSafeElapsedMs(state.startedAt, now);
}

export function getCurrentPushElapsedMs(
  state: SessionActivityState,
  now: Date = new Date(),
): number {
  if (!state.activePushStartedAt) {
    return 0;
  }

  return getSafeElapsedMs(state.activePushStartedAt, now);
}

export function startPush(
  state: SessionActivityState,
  now: Date = new Date(),
): SessionActivityState {
  if (state.activePushStartedAt) {
    return state;
  }

  return {
    ...state,
    activePushStartedAt: now.toISOString(),
  };
}

export function releasePush(
  state: SessionActivityState,
  now: Date = new Date(),
): SessionActivityState {
  if (!state.activePushStartedAt) {
    return state;
  }

  const pushDurationMs = getSafeElapsedMs(state.activePushStartedAt, now);

  return {
    ...state,
    pushCount: state.pushCount + 1,
    totalPushMs: state.totalPushMs + pushDurationMs,
    longestPushMs: Math.max(state.longestPushMs ?? 0, pushDurationMs),
    activePushStartedAt: null,
    lastPushMs: pushDurationMs,
  };
}

export function getHoldButtonLabel(
  pushCount: number,
  isHolding: boolean,
): string {
  if (pushCount > 0 && isHolding) return "IT'S COMING OUT AGAIN";
  if (pushCount > 0) return "IT'S COMING OUT AGAIN";
  return "IT'S COMING OUT";
}

export function formatDurationMs(durationMs: number): string {
  const safeDurationMs = Number.isFinite(durationMs)
    ? Math.max(0, durationMs)
    : 0;
  const totalSeconds = Math.floor(safeDurationMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }

  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
}

function formatIssuedAt(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

type CertResult = {
  certHeadline: string;
  certSubline: string;
  sealLabel: string;
};

type CertHeadlineEntry = {
  headline: string;
  sealLabels: readonly string[];
  sublines: readonly string[];
};

type CertSubBucket = Record<string, readonly CertHeadlineEntry[] | undefined>;

type CertCategoryMatch = {
  /** Lower priority number = higher priority. */
  priority: number;
  pool: readonly CertHeadlineEntry[];
  /** Optional 0-based index into pool when range maps to a specific tier. */
  tierIndex?: number;
};

export type CertSelectorInput = {
  durationMs: number;
  pushCount: number;
  totalPushMs: number;
  longestPushMs: number;
  startedAt: string;
  /** Total pooped count INCLUDING the session being completed. */
  poopedCountIncludingThis?: number;
  /** Current streak INCLUDING the session being completed. */
  streakIncludingThis?: number;
  /** Optional Bristol stool type 1–7. */
  bristolType?: number;
};

function interpolate(
  template: string,
  vars: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (_match, key) => {
    const value = vars[key];
    return value == null ? `{${key}}` : String(value);
  });
}

function pickFromPool<T>(pool: readonly T[]): T {
  return pool[Math.floor(Math.random() * pool.length)];
}

/* ---- Velocity & integrity formulas (used for cert binning) ---- */

function computeCertVelocity(
  pushCount: number,
  totalPushMs: number,
  durationMs: number,
): number {
  if (durationMs <= 0) return 0;
  const baseRate = pushCount / (durationMs / 1000);
  const pushRatio = totalPushMs / durationMs;
  const strainEff = pushRatio; // strain efficiency 0–1
  const raw = baseRate * pushRatio * strainEff;
  const K = 30;
  return K * Math.log(1 + raw);
}

function computeCertIntegrityLabel(
  pushCount: number,
  totalPushMs: number,
  durationMs: number,
  bristolType?: number,
): "NOMINAL" | "STABLE" | "FRAGMENTING" | "UNSTABLE" | "CRITICAL FAILURE" {
  if (durationMs <= 0) return "NOMINAL";
  const fragmentation = pushCount / (durationMs / 1000);
  const fragmentScore = 1 / (1 + 3 * fragmentation);
  const continuityBonus = totalPushMs / durationMs;
  let bristolFactor = 1;
  if (bristolType != null) {
    if (bristolType <= 2) bristolFactor = 0.3;
    else if (bristolType <= 4) bristolFactor = 1.0;
    else if (bristolType === 5) bristolFactor = 0.7;
    else if (bristolType === 6) bristolFactor = 0.4;
    else bristolFactor = 0.2;
  }
  const score = fragmentScore * continuityBonus * bristolFactor;
  if (score >= 0.8) return "NOMINAL";
  if (score >= 0.6) return "STABLE";
  if (score >= 0.4) return "FRAGMENTING";
  if (score >= 0.2) return "UNSTABLE";
  return "CRITICAL FAILURE";
}

/* ---- Category matchers (return priority + matching pool, or null) ----
   Priority order (lower = higher priority):
     1. milestone_pooped, milestone_streak (user-stat milestones)
     2. push_timer, total_session_timer (tied)
     3. started_time, expulsion_count (tied)
     4. estimated_velocity, strain_efficiency (tied)
     5. structural_integrity
     6. fallback
   When two categories tie, we collect both matches and pick one at random. */

function matchMilestonePooped(
  input: CertSelectorInput,
): CertCategoryMatch | null {
  const c = masterWordBank.certificate_results
    .milestone_pooped as CertSubBucket;
  if (!c || !input.poopedCountIncludingThis) return null;
  const n = input.poopedCountIncludingThis;
  if (n === 3 && c.three) return { priority: 1, pool: c.three };
  if (n === 10 && c.ten) return { priority: 1, pool: c.ten };
  if (n === 50 && c.fifty) return { priority: 1, pool: c.fifty };
  if (n === 100 && c.hundred) return { priority: 1, pool: c.hundred };
  return null;
}

function matchMilestoneStreak(
  input: CertSelectorInput,
): CertCategoryMatch | null {
  const c = masterWordBank.certificate_results
    .milestone_streak as CertSubBucket;
  if (!c || !input.streakIncludingThis) return null;
  const s = input.streakIncludingThis;
  if (s === 5 && c.five) return { priority: 1, pool: c.five };
  if (s === 10 && c.ten) return { priority: 1, pool: c.ten };
  if (s === 20 && c.twenty) return { priority: 1, pool: c.twenty };
  if (s === 30 && c.thirty) return { priority: 1, pool: c.thirty };
  if (s === 50 && c.fifty) return { priority: 1, pool: c.fifty };
  if (s === 100 && c.hundred) return { priority: 1, pool: c.hundred };
  return null;
}

function matchPushTimer(input: CertSelectorInput): CertCategoryMatch | null {
  const c = masterWordBank.certificate_results.push_timer as CertSubBucket;
  if (!c || input.pushCount === 0) return null;
  const longestPushSec = input.longestPushMs / 1000;
  if (longestPushSec < 4 && c.under_4s)
    return { priority: 2, pool: c.under_4s };
  if (longestPushSec >= 10 && longestPushSec < 15 && c.s10_15)
    return { priority: 2, pool: c.s10_15 };
  if (longestPushSec >= 15 && longestPushSec < 20 && c.s15_20)
    return { priority: 2, pool: c.s15_20 };
  if (longestPushSec >= 20 && longestPushSec < 25 && c.s20_25)
    return { priority: 2, pool: c.s20_25 };
  if (longestPushSec >= 25 && longestPushSec < 30 && c.s25_30)
    return { priority: 2, pool: c.s25_30 };
  if (longestPushSec >= 30 && longestPushSec < 40 && c.s30_40)
    return { priority: 2, pool: c.s30_40 };
  if (longestPushSec >= 40 && c.over_40s)
    return { priority: 2, pool: c.over_40s };
  return null;
}

function matchSessionTimer(input: CertSelectorInput): CertCategoryMatch | null {
  const c = masterWordBank.certificate_results.session_timer as CertSubBucket;
  if (!c) return null;
  const sec = input.durationMs / 1000;
  const min = sec / 60;
  if (sec < 10 && c.under_10s) return { priority: 2, pool: c.under_10s };
  if (sec >= 10 && sec < 30 && c.s10_30) return { priority: 2, pool: c.s10_30 };
  if (sec >= 30 && min < 1 && c.s30_to_1min)
    return { priority: 2, pool: c.s30_to_1min };
  if (min >= 1 && min < 5 && c.m1_5) return { priority: 2, pool: c.m1_5 };
  if (min >= 7 && min < 12 && c.m7_12) return { priority: 2, pool: c.m7_12 };
  if (min >= 12 && c.over_12m) return { priority: 2, pool: c.over_12m };
  return null;
}

function matchStartedTime(input: CertSelectorInput): CertCategoryMatch | null {
  const c = masterWordBank.certificate_results.started_time as CertSubBucket;
  if (!c) return null;
  const hour = new Date(input.startedAt).getHours();
  if (hour >= 2 && hour < 4 && c.h2_4) return { priority: 3, pool: c.h2_4 };
  if (hour >= 4 && hour < 6 && c.h4_6) return { priority: 3, pool: c.h4_6 };
  if (hour >= 6 && hour < 8 && c.h6_8) return { priority: 3, pool: c.h6_8 };
  if (hour >= 12 && hour < 14 && c.h12_14)
    return { priority: 3, pool: c.h12_14 };
  if (hour >= 22 && hour < 24 && c.h22_24)
    return { priority: 3, pool: c.h22_24 };
  if (hour >= 0 && hour < 2 && c.h0_2) return { priority: 3, pool: c.h0_2 };
  return null;
}

function matchExpulsionCount(
  input: CertSelectorInput,
): CertCategoryMatch | null {
  const c = masterWordBank.certificate_results.expulsion_count as CertSubBucket;
  if (!c) return null;
  const n = input.pushCount;
  if (n === 1 && c.one) return { priority: 3, pool: c.one };
  if (n === 2 && c.two) return { priority: 3, pool: c.two };
  if (n === 3 && c.three) return { priority: 3, pool: c.three };
  if (n === 4 && c.four) return { priority: 3, pool: c.four };
  if (n === 5 && c.five) return { priority: 3, pool: c.five };
  if (n > 5 && c.over_5) return { priority: 3, pool: c.over_5 };
  return null;
}

function matchEstimatedVelocity(
  input: CertSelectorInput,
): CertCategoryMatch | null {
  const c = masterWordBank.certificate_results
    .estimated_velocity as CertSubBucket;
  if (!c) return null;
  const v = computeCertVelocity(
    input.pushCount,
    input.totalPushMs,
    input.durationMs,
  );
  if (v < 1 && c.low) return { priority: 4, pool: c.low };
  if (v >= 5 && c.high) return { priority: 4, pool: c.high };
  return null;
}

function matchStrainEfficiency(
  input: CertSelectorInput,
): CertCategoryMatch | null {
  const c = masterWordBank.certificate_results
    .strain_efficiency as CertSubBucket;
  if (!c || input.durationMs <= 0) return null;
  const pct = (input.totalPushMs / input.durationMs) * 100;
  if (pct < 15 && c.under_15) return { priority: 4, pool: c.under_15 };
  if (pct >= 15 && pct < 30 && c.p15_30) return { priority: 4, pool: c.p15_30 };
  if (pct >= 90 && c.p90_100) return { priority: 4, pool: c.p90_100 };
  return null;
}

function matchStructuralIntegrity(
  input: CertSelectorInput,
): CertCategoryMatch | null {
  const c = masterWordBank.certificate_results
    .structural_integrity as CertSubBucket;
  if (!c) return null;
  const label = computeCertIntegrityLabel(
    input.pushCount,
    input.totalPushMs,
    input.durationMs,
    input.bristolType,
  );
  if (label === "NOMINAL" && c.nominal) return { priority: 5, pool: c.nominal };
  if (label === "CRITICAL FAILURE" && c.critical)
    return { priority: 5, pool: c.critical };
  return null;
}

function selectCertEntry(input: CertSelectorInput): CertResult {
  const matchers = [
    matchMilestonePooped,
    matchMilestoneStreak,
    matchPushTimer,
    matchSessionTimer,
    matchStartedTime,
    matchExpulsionCount,
    matchEstimatedVelocity,
    matchStrainEfficiency,
    matchStructuralIntegrity,
  ];

  const matches = matchers
    .map((fn) => fn(input))
    .filter((m): m is CertCategoryMatch => m !== null);

  let chosen: CertCategoryMatch | null = null;
  if (matches.length > 0) {
    const best = matches.reduce(
      (min, m) => (m.priority < min ? m.priority : min),
      matches[0].priority,
    );
    const tied = matches.filter((m) => m.priority === best);
    chosen = pickFromPool(tied);
  }

  const fallbackPool = masterWordBank.certificate_results.fallback ?? [];
  const pool = chosen ? chosen.pool : fallbackPool;
  const entry = pickFromPool(pool);

  const vars = {
    pushCount: input.pushCount,
    durationMin: Math.round(input.durationMs / 60_000),
    durationSec: Math.round(input.durationMs / 1000),
    totalPushSec: Math.round(input.totalPushMs / 1000),
    longestPushSec: Math.round(input.longestPushMs / 1000),
    streak: input.streakIncludingThis ?? 0,
    poopedCount: input.poopedCountIncludingThis ?? 0,
  };

  return {
    certHeadline: interpolate(entry.headline, vars),
    certSubline: interpolate(pickFromPool(entry.sublines), vars),
    sealLabel: interpolate(pickFromPool(entry.sealLabels), vars),
  };
}

export function completeSession(
  state: SessionActivityState,
  username: string,
  endedAt: Date = new Date(),
  selectorExtras: Pick<
    CertSelectorInput,
    "poopedCountIncludingThis" | "streakIncludingThis" | "bristolType"
  > = {},
): {
  finalActivity: SessionActivityState;
  certificate: SessionCertificate;
} {
  const finalActivity = state.activePushStartedAt
    ? releasePush(state, endedAt)
    : state;
  const durationMs = getSessionElapsedMs(finalActivity, endedAt);
  const { certHeadline, certSubline, sealLabel } = selectCertEntry({
    durationMs,
    pushCount: finalActivity.pushCount,
    totalPushMs: finalActivity.totalPushMs,
    longestPushMs: finalActivity.longestPushMs,
    startedAt: finalActivity.startedAt,
    ...selectorExtras,
  });

  return {
    finalActivity,
    certificate: {
      username,
      durationMs,
      durationLabel: formatDurationMs(durationMs),
      pushCount: finalActivity.pushCount,
      totalPushMs: finalActivity.totalPushMs,
      totalPushLabel: formatDurationMs(finalActivity.totalPushMs),
      startedAt: finalActivity.startedAt,
      endedAt: endedAt.toISOString(),
      issuedAtLabel: formatIssuedAt(endedAt),
      rankLabel: "Faster than --% of today's poopers",
      sealLabel,
      certHeadline,
      certSubline,
    },
  };
}
