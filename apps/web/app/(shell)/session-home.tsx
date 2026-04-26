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
  completeSession,
  createUserLiveFeedMessage,
  createSessionActivityState,
  createSessionFlowState,
  ensureAnonymousProfile,
  formatDurationMs,
  getDailyPoopCounterSeed,
  getCurrentPushElapsedMs,
  getEncouragementMessage,
  getHoldButtonLabel,
  getSimulatedCounterSeed,
  getSeededLiveFeedMessage,
  getSessionElapsedMs,
  getWebPublicSupabaseEnv,
  parseStoredSessionHistory,
  sessionHistoryStorageKey,
  shouldShowEmailCapturePrompt,
  type LiveFeedMessage,
  type StoredSessionRecord,
  recordCompletedSession,
  releasePush,
  simulateCounterTick,
  startPush,
  startLiveSession,
  updateAnonymousProfile,
  validateEmailAddress,
  type AnonymousProfile,
  type SessionActivityState,
  type SessionCertificate,
  type SessionFlowState,
  validateLiveFeedInput,
} from "@impoopingrightnow/shared";

const navItems = [
  { href: "/my-stats", label: "Records", title: "My Stats" },
  { href: "/global", label: "Browse", title: "World Board" },
  { href: "/settings", label: "Identity", title: "Settings" },
];

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
    return "Release when done to record this push and fire a mini confetti burst.";
  }

  if (sessionActivity.lastPushMs !== null) {
    return `Last log recorded: ${formatDurationMs(sessionActivity.lastPushMs)}. Hold again for another push.`;
  }

  return "Hold the button while pushing. Release to record your first log.";
}

function createFallbackUsername(): string {
  return "FiledWitness_00";
}

function readCompletedSessionCount(): number {
  return readStoredSessionHistory().length;
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

function formatAverageCutNumber(value: number | null): string {
  if (value === null) {
    return "--";
  }

  return Number.isInteger(value) ? value.toString() : value.toFixed(1);
}

function formatCounterCopy(counter: number): string {
  return `${counter.toLocaleString()} humans pooping right now`;
}

function createInitialLiveFeedMessages(sessionStart: Date): LiveFeedMessage[] {
  const firstSeedTime = new Date(sessionStart.getTime() - 4_000);
  const secondSeedTime = new Date(sessionStart.getTime() - 1_500);
  const firstMessage = getSeededLiveFeedMessage({
    sessionElapsedMs: 0,
    pushCount: 0,
    isHolding: false,
    now: firstSeedTime,
  });
  const secondMessage = getSeededLiveFeedMessage({
    sessionElapsedMs: 45_000,
    pushCount: 0,
    isHolding: false,
    now: secondSeedTime,
  });

  return appendLiveFeedMessage([firstMessage], secondMessage);
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
    { topStart: 10, topRange: 12, leftStart: 7, leftRange: 16 },
    { topStart: 12, topRange: 10, leftStart: 71, leftRange: 12 },
    { topStart: 34, topRange: 14, leftStart: 4, leftRange: 14 },
    { topStart: 36, topRange: 14, leftStart: 74, leftRange: 10 },
    { topStart: 69, topRange: 9, leftStart: 15, leftRange: 18 },
    { topStart: 71, topRange: 9, leftStart: 58, leftRange: 18 },
  ] as const;
  const lane = lanes[hash % lanes.length];
  const top = lane.topStart + ((hash >>> 6) % lane.topRange);
  const left = lane.leftStart + ((hash >>> 12) % lane.leftRange);
  const driftX = -16 + ((hash >>> 18) % 33);
  const driftY = -14 - ((hash >>> 24) % 26);
  const durationMs = 3800 + (hash % 1801);

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
      (message) => now.getTime() - new Date(message.createdAt).getTime() < 5600,
    )
    .slice(-4);

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
            &quot;{message.message}&quot;
          </p>
          <span className="session-feed-username">- {message.username}</span>
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
    </div>
  );
}

function LandingView({ onStart }: { onStart: () => void }) {
  return (
    <section className="session-home-panel">
      <header className="session-home-head">
        <div className="session-home-head-row">
          <p className="eyebrow">Ready</p>
          <Link
            href="/i-pooped"
            className="session-secondary-action session-secondary-action-compact"
          >
            I Pooped
          </Link>
        </div>
      </header>

      <div className="session-home-actions">
        <button
          type="button"
          className="session-primary-action"
          onClick={onStart}
        >
          I&apos;m Pooping Right Now
        </button>
      </div>
    </section>
  );
}

function ProtectHistoryBanner({
  sessionCount,
  emailDraft,
  notice,
  onEmailDraftChange,
  onSubmit,
  onDismiss,
}: {
  sessionCount: number;
  emailDraft: string;
  notice: InlineNoticeState;
  onEmailDraftChange: (nextDraft: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onDismiss: () => void;
}) {
  return (
    <section className="profile-banner" aria-live="polite">
      <div className="profile-banner-copy">
        <p className="eyebrow">Save your history</p>
        <h2>Protect your poop history - add an email.</h2>
        <p>
          {sessionCount.toLocaleString()} completed sessions are now saved on
          this device. Add one email for recovery later, or skip it and keep
          going.
        </p>
      </div>

      <form className="profile-banner-form" onSubmit={onSubmit}>
        <input
          className="profile-input"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={emailDraft}
          onChange={(event) => onEmailDraftChange(event.target.value)}
          aria-label="Recovery email"
        />
        <div className="profile-banner-actions">
          <button type="submit" className="profile-button">
            Save Email
          </button>
          <button
            type="button"
            className="profile-button is-secondary"
            onClick={onDismiss}
          >
            Dismiss
          </button>
        </div>
      </form>

      {notice ? (
        <p className={`profile-notice is-${notice.tone}`}>{notice.text}</p>
      ) : null}
    </section>
  );
}

function ActiveSessionView({
  sessionActivity,
  now,
  confettiToken,
  encouragementMessage,
  liveFeedMessages,
  isDiarrhea,
  feedDraft,
  feedNotice,
  onHoldStart,
  onHoldEnd,
  onDiarrheaToggle,
  onFeedDraftChange,
  onFeedSubmit,
  onFlush,
}: {
  sessionActivity: SessionActivityState;
  now: Date;
  confettiToken: number;
  encouragementMessage: string;
  liveFeedMessages: LiveFeedMessage[];
  isDiarrhea: boolean;
  feedDraft: string;
  feedNotice: InlineNoticeState;
  onHoldStart: (event: PointerEvent<HTMLButtonElement>) => void;
  onHoldEnd: (event: PointerEvent<HTMLButtonElement>) => void;
  onDiarrheaToggle: () => void;
  onFeedDraftChange: (nextDraft: string) => void;
  onFeedSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onFlush: () => void;
}) {
  const sessionElapsedLabel = formatDurationMs(
    getSessionElapsedMs(sessionActivity, now),
  );
  const pushElapsedLabel = formatDurationMs(
    getCurrentPushElapsedMs(sessionActivity, now),
  );
  const totalPushLabel = formatDurationMs(sessionActivity.totalPushMs);
  const isHolding = Boolean(sessionActivity.activePushStartedAt);

  return (
    <section className="session-home-panel session-live-shell">
      <FloatingFeedOverlay messages={liveFeedMessages} now={now} />

      <div className="session-live-topline">
        <span className="eyebrow">In progress</span>
        <span className="session-live-stamp">
          Started {formatStartTime(sessionActivity.startedAt)}
        </span>
      </div>

      <div className="session-timer-wrap">
        <span className="session-timer-label">Poop timer</span>
        <strong className="session-timer-value">{sessionElapsedLabel}</strong>
        <p className="session-timer-note">
          The timer is running. Flush when you are done to save this session.
        </p>
      </div>

      <div className="session-metric-grid">
        <div className="session-metric-card">
          <span className="session-metric-label">Logs</span>
          <strong className="session-metric-value">
            {sessionActivity.pushCount}
          </strong>
        </div>
        <div className="session-metric-card">
          <span className="session-metric-label">Push timer</span>
          <strong className="session-metric-value">{pushElapsedLabel}</strong>
        </div>
        <div className="session-metric-card">
          <span className="session-metric-label">Total push time</span>
          <strong className="session-metric-value">{totalPushLabel}</strong>
        </div>
      </div>

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

        <button
          type="button"
          className={`session-hold-button${isHolding ? " is-holding" : ""}`}
          aria-pressed={isHolding}
          onPointerDown={onHoldStart}
          onPointerUp={onHoldEnd}
          onPointerCancel={onHoldEnd}
        >
          {getHoldButtonLabel(sessionActivity.pushCount)}
        </button>
      </div>
      <p className="session-push-helper">
        {createPushHelperText(sessionActivity)}
      </p>
      <p className="session-encouragement">{encouragementMessage}</p>

      <div className="session-live-footer">
        <button
          type="button"
          className={`session-secondary-action session-diarrhea-toggle${isDiarrhea ? " is-selected" : ""}`}
          aria-pressed={isDiarrhea}
          onClick={onDiarrheaToggle}
        >
          This was a diarrhea
        </button>
        <button
          type="button"
          className="session-flush-button"
          onClick={onFlush}
        >
          Flush
        </button>
        <p>Flush ends the session and saves it to your local history.</p>
      </div>

      <div className="session-feed-placeholder">
        <form className="session-feed-form" onSubmit={onFeedSubmit}>
          <input
            value={feedDraft}
            onChange={(event) => onFeedDraftChange(event.target.value)}
            maxLength={60}
            placeholder="drop a note..."
            aria-label="Send a floating feed message"
          />
          <button type="submit">Send</button>
        </form>

        {feedNotice ? (
          <p className={`session-feed-notice is-${feedNotice.tone}`}>
            {feedNotice.text}
          </p>
        ) : (
          <p className="session-feed-notice">
            Notes drift through the room for a few seconds.
          </p>
        )}
      </div>
    </section>
  );
}

function CertificateView({
  certificate,
  onStartAnotherSession,
}: {
  certificate: SessionCertificate;
  onStartAnotherSession: () => void;
}) {
  return (
    <section className="session-home-panel session-certificate-panel">
      <div className="certificate-topline">
        <span className="eyebrow">Session ended</span>
        <span className="session-live-stamp">
          Issued {certificate.issuedAtLabel}
        </span>
      </div>

      <div className="certificate-paper">
        <p className="eyebrow">Official record</p>
        <h2 className="certificate-title">Certificate of Completed Movement</h2>
        <p className="certificate-body">
          This document certifies that the undersigned citizen completed a live
          bathroom session and is hereby cleared for re-entry into polite
          society.
        </p>

        <div className="certificate-grid">
          <div className="certificate-stat-card">
            <span className="session-metric-label">Username</span>
            <strong className="certificate-stat-value">
              {certificate.username}
            </strong>
          </div>
          <div className="certificate-stat-card">
            <span className="session-metric-label">Total poop time</span>
            <strong className="certificate-stat-value">
              {certificate.durationLabel}
            </strong>
          </div>
          <div className="certificate-stat-card">
            <span className="session-metric-label">Logs</span>
            <strong className="certificate-stat-value">
              {certificate.pushCount}
            </strong>
          </div>
          <div className="certificate-stat-card">
            <span className="session-metric-label">Total push time</span>
            <strong className="certificate-stat-value">
              {certificate.totalPushLabel}
            </strong>
          </div>
        </div>

        <div className="certificate-rank-card">
          <span className="session-metric-label">Global rank</span>
          <strong className="certificate-rank-value">
            {certificate.rankLabel}
          </strong>
          <p>Live ranking can come later.</p>
        </div>

        <div className="certificate-footer-row">
          <div className="certificate-issued-card">
            <span className="session-metric-label">Filed at</span>
            <strong className="certificate-issued-value">
              {certificate.issuedAtLabel}
            </strong>
          </div>
          <div className="certificate-seal">{certificate.sealLabel}</div>
        </div>
      </div>

      <div className="certificate-actions">
        <button
          type="button"
          className="session-primary-action"
          onClick={onStartAnotherSession}
        >
          Start Another Session
        </button>
        <button type="button" className="certificate-share-button" disabled>
          Share Image · later slice
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
  const [timerNow, setTimerNow] = useState<Date>(() => new Date());
  const [confettiToken, setConfettiToken] = useState(0);
  const [flushConfettiToken, setFlushConfettiToken] = useState(0);
  const [simulatedCounter, setSimulatedCounter] = useState(() =>
    getSimulatedCounterSeed(),
  );
  const [dailyPoopCounter, setDailyPoopCounter] = useState(() =>
    getDailyPoopCounterSeed(),
  );
  const [isRealtimeStatsActive, setIsRealtimeStatsActive] = useState(
    typeof navigator === "undefined" ? true : navigator.onLine,
  );
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
  const [emailPromptDraft, setEmailPromptDraft] = useState("");
  const [emailPromptNotice, setEmailPromptNotice] =
    useState<InlineNoticeState>(null);
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
  const isEmailPromptVisible =
    !isActiveSession &&
    identityProfile !== null &&
    shouldShowEmailCapturePrompt(identityProfile, completedSessionCount);

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
      setEmailPromptDraft(localIdentity.profile.email ?? "");
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
    function syncRealtimeStatus() {
      setIsRealtimeStatsActive(navigator.onLine);
    }

    syncRealtimeStatus();
    window.addEventListener("online", syncRealtimeStatus);
    window.addEventListener("offline", syncRealtimeStatus);

    return () => {
      window.removeEventListener("online", syncRealtimeStatus);
      window.removeEventListener("offline", syncRealtimeStatus);
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

  useEffect(() => {
    if (!isActiveSession || !sessionActivity) {
      return;
    }

    const delayMs = 1600 + Math.floor(Math.random() * 1801);
    const timeoutId = window.setTimeout(() => {
      const seededMessage = getSeededLiveFeedMessage({
        sessionElapsedMs: getSessionElapsedMs(sessionActivity, new Date()),
        pushCount: sessionActivity.pushCount,
        isHolding: Boolean(sessionActivity.activePushStartedAt),
      });

      setLiveFeedMessages((current) =>
        appendLiveFeedMessage(current, seededMessage),
      );
    }, delayMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    isActiveSession,
    lastFeedMessageId,
    sessionActivity?.activePushStartedAt,
    sessionActivity?.pushCount,
    sessionActivity?.startedAt,
  ]);
  const encouragementMessage = sessionActivity
    ? getEncouragementMessage(getSessionElapsedMs(sessionActivity, timerNow))
    : null;

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
    setLiveFeedMessages(createInitialLiveFeedMessages(sessionStart));
    setIsDiarrheaSession(false);
    setFeedDraft("");
    setFeedNotice(null);
  }

  function handleFlushSession() {
    if (!sessionActivity) {
      return;
    }

    const endedAt = new Date();
    const { certificate: nextCertificate } = completeSession(
      sessionActivity,
      identityUsername ?? createFallbackUsername(),
      endedAt,
    );

    void recordCompletedSession(browserIdentityStorage, nextCertificate, undefined, {
      wasDiarrhea: isDiarrheaSession,
    })
      .then((nextRecords) => {
        setSessionHistoryRecords(nextRecords);
        setCompletedSessionCount(nextRecords.length);
      })
      .catch(() => {
        const existingRecords = readStoredSessionHistory();
        setSessionHistoryRecords(existingRecords);
        setCompletedSessionCount(existingRecords.length);
      });

    setTimerNow(endedAt);
    setSessionActivity(null);
    setFlowState(createSessionFlowState());
    setCertificate(nextCertificate);
    setFlushConfettiToken((current) => current + 1);
    setIsDiarrheaSession(false);
    setFeedNotice(null);
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
    setSessionActivity(nextState);
    setConfettiToken((current) => current + 1);
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

  function handleEmailPromptSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationResult = validateEmailAddress(emailPromptDraft);

    if (validationResult.status === "invalid") {
      setEmailPromptNotice({
        tone: "error",
        text: validationResult.errorMessage,
      });
      return;
    }

    const submittedAt =
      identityProfile?.emailPromptSubmittedAt ?? new Date().toISOString();

    void updateAnonymousProfile(browserIdentityStorage, {
      email: validationResult.normalizedEmail,
      emailPromptSubmittedAt: submittedAt,
    })
      .then((nextProfile) => {
        setIdentityProfile(nextProfile);
        setIdentityUsername(nextProfile.username);
        setEmailPromptDraft(nextProfile.email ?? "");
        setEmailPromptNotice({
          tone: "success",
          text: "Recovery email saved.",
        });
        setIdentityCard(
          createIdentityCardState(
            nextProfile.username,
            Boolean(getWebPublicSupabaseEnv()),
            nextProfile.email,
          ),
        );
      })
      .catch(() => {
        setEmailPromptNotice({
          tone: "error",
          text: "Email could not be saved because local storage is unavailable.",
        });
      });
  }

  function handleEmailPromptDismiss() {
    const dismissedAt =
      identityProfile?.emailPromptDismissedAt ?? new Date().toISOString();

    void updateAnonymousProfile(browserIdentityStorage, {
      emailPromptDismissedAt: dismissedAt,
    })
      .then((nextProfile) => {
        setIdentityProfile(nextProfile);
        setIdentityCard(
          createIdentityCardState(
            nextProfile.username,
            Boolean(getWebPublicSupabaseEnv()),
            nextProfile.email,
          ),
        );
        setEmailPromptNotice(null);
      })
      .catch(() => {
        setEmailPromptNotice({
          tone: "error",
          text: "Could not save that choice on this device.",
        });
      });
  }

  const activeChecklist = sessionActivity
    ? [
        `Session timer is live at ${formatDurationMs(getSessionElapsedMs(sessionActivity, timerNow))}.`,
        `${sessionActivity.pushCount} logs recorded with ${formatDurationMs(sessionActivity.totalPushMs)} of total push time.`,
        `Counter currently displays ${simulatedCounter.toLocaleString()} live humans.`,
        `Encouragement line: “${encouragementMessage}”`,
        `${liveFeedMessages.length} notes have been dropped into this session so far.`,
      ]
    : [];

  const certificateChecklist = certificate
    ? [
        `${certificate.pushCount} logs certified across ${certificate.durationLabel}.`,
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
  const averageSessionDurationMs =
    totalPoops > 0 ? Math.round(totalSessionDurationMs / totalPoops) : null;
  const averageActivePushDurationMs =
    totalPoops > 0 ? Math.round(totalActivePushMs / totalPoops) : null;
  const averageCutNumber =
    totalPoops > 0 ? totalCutCount / totalPoops : null;

  return (
    <main className="shell-page shell-home-page">
      <FlushConfettiOverlay token={flushConfettiToken} />
      <div className="shell-daily-poop-counter" aria-live="polite">
        Daily Poop Counter: {dailyPoopCounter.toLocaleString()}
      </div>

      <div className="shell-frame">
        <section className="shell-banner shell-banner-home">
          <div className="shell-banner-row is-centered">
            <span className="banner-counter">
              {formatCounterCopy(simulatedCounter)}
            </span>
          </div>
          <div className="shell-banner-row is-centered">
            <p className="banner-domain">IMPOOPINGRIGHTNOW.COM</p>
          </div>
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

          {isEmailPromptVisible ? (
            <ProtectHistoryBanner
              sessionCount={completedSessionCount}
              emailDraft={emailPromptDraft}
              notice={emailPromptNotice}
              onEmailDraftChange={(nextDraft) => {
                setEmailPromptDraft(nextDraft);

                if (emailPromptNotice?.tone === "error") {
                  setEmailPromptNotice(null);
                }
              }}
              onSubmit={handleEmailPromptSubmit}
              onDismiss={handleEmailPromptDismiss}
            />
          ) : null}

          <div
            className={`shell-content-grid${isLandingState ? " is-landing-layout" : ""}`}
          >
            {isCertificateVisible && certificate ? (
              <CertificateView
                certificate={certificate}
                onStartAnotherSession={handleStartSession}
              />
            ) : isActiveSession && sessionActivity ? (
              <ActiveSessionView
                sessionActivity={sessionActivity}
                now={timerNow}
                confettiToken={confettiToken}
                encouragementMessage={
                  encouragementMessage ?? "hang in there, champ"
                }
                liveFeedMessages={liveFeedMessages}
                isDiarrhea={isDiarrheaSession}
                feedDraft={feedDraft}
                feedNotice={feedNotice}
                onHoldStart={handleHoldStart}
                onHoldEnd={handleHoldEnd}
                onDiarrheaToggle={() => {
                  setIsDiarrheaSession((current) => !current);
                }}
                onFeedDraftChange={(nextDraft) => {
                  setFeedDraft(nextDraft);

                  if (feedNotice?.tone === "error") {
                    setFeedNotice(null);
                  }
                }}
                onFeedSubmit={handleFeedSubmit}
                onFlush={handleFlushSession}
              />
            ) : (
              <LandingView onStart={handleStartSession} />
            )}

            <aside
              className={`shell-aside${isLandingState ? " is-landing-layout" : ""}`}
            >
              {identityProfile ? (
                <section className="shell-aside-card shell-user-stats-card">
                  <p className="session-user-stats-line">
                    <span className="session-user-stats-label">username:</span>{" "}
                    <strong className="session-user-stats-value">
                      {identityProfile.username}
                    </strong>
                  </p>
                  <p className="session-user-stats-line">
                    <span className="session-user-stats-label">
                      started pooping:
                    </span>{" "}
                    <strong className="session-user-stats-value">
                      {formatLocalSlashDate(identityProfile.createdAt)}
                    </strong>
                  </p>
                  <p className="session-user-stats-line">
                    <span className="session-user-stats-label">pooped:</span>{" "}
                    <strong className="session-user-stats-value">
                      {totalPoops.toLocaleString()} {totalPoops === 1 ? "time" : "times"}
                    </strong>
                  </p>
                  <p className="session-user-stats-line">
                    <span className="session-user-stats-label">
                      average poop session time:
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
                      {formatOptionalDuration(averageActivePushDurationMs)}
                    </strong>
                  </p>
                  <p className="session-user-stats-line">
                    <span className="session-user-stats-label">
                      average poop cut number:
                    </span>{" "}
                    <strong className="session-user-stats-value">
                      {formatAverageCutNumber(averageCutNumber)}
                    </strong>
                  </p>
                  <p className="session-user-stats-line">
                    <span className="session-user-stats-label">
                      diarrhea rate:
                    </span>{" "}
                    <strong className="session-user-stats-value">
                      {diarrheaCount}/{totalPoops}
                    </strong>
                  </p>
                </section>
              ) : (
                <section className="shell-aside-card">
                  <h3>{identityCard.title}</h3>
                  {identityCard.body ? <p>{identityCard.body}</p> : null}
                </section>
              )}

              {isCertificateVisible || isActiveSession ? (
                <>
                  <section className="shell-aside-card">
                    <h3>
                      {isCertificateVisible
                        ? "Certificate notes"
                        : "Session notes"}
                    </h3>
                    <ul className="shell-checklist">
                      {(isCertificateVisible
                        ? certificateChecklist
                        : activeChecklist
                      ).map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </section>

                  <section className="shell-aside-card">
                    <div className="shell-stamp">
                      {isCertificateVisible
                        ? "Certificate placeholder"
                        : "Live room"}
                    </div>
                  </section>
                </>
              ) : null}
            </aside>
          </div>
        </section>

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
      </div>
    </main>
  );
}
