export type SessionActivityState = {
  startedAt: string;
  pushCount: number;
  totalPushMs: number;
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
    activePushStartedAt: null,
    lastPushMs: pushDurationMs,
  };
}

export function getHoldButtonLabel(pushCount: number): string {
  return pushCount > 0 ? "IT'S COMING OUT AGAIN" : "IT'S COMING OUT";
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

export function completeSession(
  state: SessionActivityState,
  username: string,
  endedAt: Date = new Date(),
): {
  finalActivity: SessionActivityState;
  certificate: SessionCertificate;
} {
  const finalActivity = state.activePushStartedAt
    ? releasePush(state, endedAt)
    : state;
  const durationMs = getSessionElapsedMs(finalActivity, endedAt);

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
      sealLabel: "Provisional Bathroom Authority",
    },
  };
}
