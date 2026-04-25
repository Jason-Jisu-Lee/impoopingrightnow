"use client";

import Link from "next/link";
import {
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
  dismissRetroactiveSessionStub,
  ensureAnonymousProfile,
  formatDurationMs,
  getCurrentPushElapsedMs,
  getEncouragementMessage,
  getHoldButtonLabel,
  getSeededLiveFeedMessage,
  getSessionElapsedMs,
  getWebPublicSupabaseEnv,
  parseStoredSessionHistory,
  sessionHistoryStorageKey,
  shouldShowEmailCapturePrompt,
  type LiveFeedMessage,
  openRetroactiveSessionStub,
  recordCompletedSession,
  releasePush,
  simulateCounterTick,
  simulatedCounterFloor,
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
  { href: "/", label: "Primary", title: "Home / Session" },
  { href: "/my-stats", label: "Records", title: "My Stats" },
  { href: "/global", label: "Census", title: "Global" },
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

function createIdentityCardState(
  username: string | null,
  isSupabaseConfigured: boolean,
  email: string | null = null,
): IdentityCardState {
  if (!username) {
    return {
      title: "Provisioning anonymous record",
      body: "Creating the local UUID and generated username that the active session flow will use.",
    };
  }

  if (email) {
    return {
      title: `Anonymous record: ${username}`,
      body: `Saved locally with ${email} on file for later recovery prompts. Account creation still stays out of the way.`,
    };
  }

  if (isSupabaseConfigured) {
    return {
      title: `Anonymous record: ${username}`,
      body: "Saved locally. Supabase public env is configured, and recovery details can be managed without introducing login flows.",
    };
  }

  return {
    title: `Anonymous record: ${username}`,
    body: "Saved locally. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable session-start sync.",
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

function formatCounterCopy(counter: number): string {
  return `🌍 ${counter.toLocaleString()} people pooping right now`;
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

function LandingView({
  flowState,
  onStart,
  onOpenRetroactiveStub,
  onDismissRetroactiveStub,
}: {
  flowState: SessionFlowState;
  onStart: () => void;
  onOpenRetroactiveStub: () => void;
  onDismissRetroactiveStub: () => void;
}) {
  return (
    <section className="session-home-panel">
      <header className="session-home-head">
        <p className="eyebrow">Landing screen</p>
        <h2 className="session-home-title">
          Start immediately. No login wall. No intake form.
        </h2>
        <p className="session-home-body">
          The primary call to action now drops the user straight into the live
          session shell. Retroactive logging stays stubbed, visible, and out of
          scope for V1.
        </p>
      </header>

      <div className="session-home-actions">
        <button
          type="button"
          className="session-primary-action"
          onClick={onStart}
        >
          I&apos;m Pooping Right Now
        </button>
        <button
          type="button"
          className="session-secondary-action"
          onClick={onOpenRetroactiveStub}
        >
          I Pooped
        </button>
      </div>

      <p className="session-home-caption">
        Primary action starts immediately. Secondary action stays a stub and
        only shows a passive coming-soon notice.
      </p>

      {flowState.retroactiveStub ? (
        <div className="session-stub-card" role="status" aria-live="polite">
          <div>
            <p className="eyebrow">Retroactive logging</p>
            <h3>{flowState.retroactiveStub.title}</h3>
            <p>{flowState.retroactiveStub.body}</p>
          </div>
          <button
            type="button"
            className="session-inline-dismiss"
            onClick={onDismissRetroactiveStub}
          >
            Dismiss
          </button>
        </div>
      ) : null}

      <ul className="session-home-list">
        <li>Top counter stays visible from the first screen onward.</li>
        <li>Home route now switches into active-session mode in place.</li>
        <li>
          Timer, hold mechanic, and flush-to-certificate flow activate after
          start.
        </li>
      </ul>
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
        <p className="eyebrow">Passive recovery prompt</p>
        <h2>Protect your poop history - add an email.</h2>
        <p>
          {sessionCount.toLocaleString()} completed sessions are now saved on
          this device. Add one recovery email or dismiss this quietly; there is
          still no login wall.
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
  feedDraft,
  feedNotice,
  onHoldStart,
  onHoldEnd,
  onFeedDraftChange,
  onFeedSubmit,
  onFlush,
}: {
  sessionActivity: SessionActivityState;
  now: Date;
  confettiToken: number;
  encouragementMessage: string;
  liveFeedMessages: LiveFeedMessage[];
  feedDraft: string;
  feedNotice: InlineNoticeState;
  onHoldStart: (event: PointerEvent<HTMLButtonElement>) => void;
  onHoldEnd: (event: PointerEvent<HTMLButtonElement>) => void;
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
      <div className="session-live-topline">
        <span className="eyebrow">Active session shell</span>
        <span className="session-live-stamp">
          Started {formatStartTime(sessionActivity.startedAt)}
        </span>
      </div>

      <div className="session-timer-wrap">
        <span className="session-timer-label">Poop timer</span>
        <strong className="session-timer-value">{sessionElapsedLabel}</strong>
        <p className="session-timer-note">
          The timer is live. Flush, local history, and the certificate surface
          are already wired; share export and server-backed sync remain later.
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
          className="session-flush-button"
          onClick={onFlush}
        >
          Flush
        </button>
        <p>
          Flush ends the session, updates local history, and refreshes the web
          stats surfaces while share export and realtime sync stay for later.
        </p>
      </div>

      <div className="session-feed-placeholder">
        <div className="session-feed-header">
          <p className="eyebrow">Floating feed corner</p>
          <span className="session-feed-count">
            {liveFeedMessages.length} notes
          </span>
        </div>

        <div className="session-feed-stack" aria-live="polite">
          {liveFeedMessages.map((message) => (
            <article
              key={message.id}
              className={`session-feed-message${message.source === "user" ? " is-user" : ""}`}
            >
              <span className="session-feed-username">{message.username}</span>
              <p>{message.message}</p>
            </article>
          ))}
        </div>

        <form className="session-feed-form" onSubmit={onFeedSubmit}>
          <input
            value={feedDraft}
            onChange={(event) => onFeedDraftChange(event.target.value)}
            maxLength={60}
            placeholder="Say something..."
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
            Seeded until realtime joins later.
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
        <p className="eyebrow">Official stool administration</p>
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
          <p>
            Placeholder until today&apos;s duration distribution query is wired
            to Supabase.
          </p>
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
  const [simulatedCounter, setSimulatedCounter] = useState(
    simulatedCounterFloor,
  );
  const [liveFeedMessages, setLiveFeedMessages] = useState<LiveFeedMessage[]>(
    [],
  );
  const [feedDraft, setFeedDraft] = useState("");
  const [feedNotice, setFeedNotice] = useState<InlineNoticeState>(null);
  const [emailPromptDraft, setEmailPromptDraft] = useState("");
  const [emailPromptNotice, setEmailPromptNotice] =
    useState<InlineNoticeState>(null);
  const simulatedCounterRef = useRef(simulatedCounterFloor);
  const lastFeedMessageId =
    liveFeedMessages[liveFeedMessages.length - 1]?.id ?? null;
  const isCertificateVisible = certificate !== null;
  const isActiveSession =
    !isCertificateVisible &&
    flowState.stage === "active" &&
    sessionActivity !== null;
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

      if (!isMounted) {
        return;
      }

      setIdentityProfile(localIdentity.profile);
      setIdentityUsername(localIdentity.profile.username);
      setEmailPromptDraft(localIdentity.profile.email ?? "");
      setCompletedSessionCount(readCompletedSessionCount());
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
      setCompletedSessionCount(readCompletedSessionCount());
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

    const delayMs = 3200 + Math.floor(Math.random() * 2801);
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

    void recordCompletedSession(browserIdentityStorage, nextCertificate)
      .then((nextRecords) => {
        setCompletedSessionCount(nextRecords.length);
      })
      .catch(() => {
        setCompletedSessionCount(readCompletedSessionCount());
      });

    setTimerNow(endedAt);
    setSessionActivity(null);
    setFlowState(createSessionFlowState());
    setCertificate(nextCertificate);
    setFlushConfettiToken((current) => current + 1);
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
      text: "Sent to the floating feed.",
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
          text: "Recovery email saved locally.",
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
          text: "Prompt dismissal could not be saved locally.",
        });
      });
  }

  const activeChecklist = sessionActivity
    ? [
        `Session timer is live at ${formatDurationMs(getSessionElapsedMs(sessionActivity, timerNow))}.`,
        `${sessionActivity.pushCount} logs recorded with ${formatDurationMs(sessionActivity.totalPushMs)} of total push time.`,
        `Counter currently displays ${simulatedCounter.toLocaleString()} live poopers.`,
        `Encouragement line: “${encouragementMessage}”`,
        `${liveFeedMessages.length} floating feed notes are visible in the session corner.`,
      ]
    : [];

  const certificateChecklist = certificate
    ? [
        `${certificate.pushCount} logs certified across ${certificate.durationLabel}.`,
        `${certificate.totalPushLabel} of total push time recorded on the certificate.`,
        "Share export and live rank calculation remain staged for later slices.",
      ]
    : [];

  return (
    <main className="shell-page">
      <FlushConfettiOverlay token={flushConfettiToken} />

      <div className="shell-frame">
        <section className="shell-banner">
          <div className="shell-banner-row">
            <span className="eyebrow">Live session entrypoint</span>
            <span className="banner-counter">
              {formatCounterCopy(simulatedCounter)}
            </span>
          </div>
          <div className="shell-banner-row">
            <div>
              <p className="eyebrow">impoopingrightnow.com</p>
              <h1 className="banner-title">
                {isCertificateVisible
                  ? "Your certificate is ready."
                  : isActiveSession
                    ? "You are now in the live-session shell."
                    : "Start here. Drop in immediately."}
              </h1>
            </div>
          </div>
          <p className="banner-subtitle">
            {isCertificateVisible
              ? "Flush now ends the session with a full-screen celebration and an instant client-side certificate placeholder, while sharing and live ranking stay staged for later."
              : isActiveSession
                ? "The session surface is now live: the timer is running, the hold button logs pushes on release, and the floating feed is seeded locally while realtime stays staged for later."
                : "The landing screen now behaves like the product brief: immediate primary entry, passive retroactive stub, and a mobile-first session surface ready to take over."}
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

          <div className="shell-content-grid">
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
                feedDraft={feedDraft}
                feedNotice={feedNotice}
                onHoldStart={handleHoldStart}
                onHoldEnd={handleHoldEnd}
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
              <LandingView
                flowState={flowState}
                onStart={handleStartSession}
                onOpenRetroactiveStub={() =>
                  setFlowState((current) => openRetroactiveSessionStub(current))
                }
                onDismissRetroactiveStub={() =>
                  setFlowState((current) =>
                    dismissRetroactiveSessionStub(current),
                  )
                }
              />
            )}

            <aside className="shell-aside">
              <section className="shell-aside-card">
                <h3>{identityCard.title}</h3>
                <p>{identityCard.body}</p>
              </section>

              <section className="shell-aside-card">
                <h3>
                  {isCertificateVisible
                    ? "Certificate status"
                    : isActiveSession
                      ? "Session shell status"
                      : "What this slice covers"}
                </h3>
                <ul className="shell-checklist">
                  {(isCertificateVisible
                    ? certificateChecklist
                    : isActiveSession
                      ? activeChecklist
                      : [
                          "Landing surface now has real CTA behavior.",
                          "Retroactive logging remains a passive stub.",
                          "Home flow is now separate from the other shell pages.",
                        ]
                  ).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>

              <section className="shell-aside-card">
                <div className="shell-stamp">
                  {isCertificateVisible
                    ? "Certificate placeholder"
                    : "Counter and floating feed"}
                </div>
              </section>
            </aside>
          </div>
        </section>

        <footer className="shell-footer">
          <span>
            <strong>Status:</strong> the web session flow, local stats, preview
            analytics, and passive email capture are wired.
          </span>
          <span>
            Share export, geolocation, and realtime persistence remain later.
          </span>
        </footer>
      </div>
    </main>
  );
}
