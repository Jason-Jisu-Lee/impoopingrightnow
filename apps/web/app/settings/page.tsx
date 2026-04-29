"use client";

import { useEffect, useState, type FormEvent } from "react";

import {
  anonymousIdentityStorageKey,
  ensureAnonymousProfile,
  getWebPublicSupabaseEnv,
  parseStoredAnonymousProfile,
  parseStoredSessionHistory,
  sessionHistoryStorageKey,
  shouldShowEmailCapturePrompt,
  updateAnonymousProfile,
  validateAnonymousUsername,
  validateEmailAddress,
  type AnonymousProfile,
} from "@impoopingrightnow/shared";

import {
  PageBackControl,
  PageChromeControls,
} from "../_components/page-chrome-controls";
import { ShellNav } from "../_components/shell-nav";

type SettingsNoticeState = {
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
      // Ignore blocked storage and continue with a best-effort local settings surface.
    }
  },
};

function readLocalProfileSnapshot(): {
  profile: AnonymousProfile | null;
  sessionCount: number;
} {
  if (typeof window === "undefined") {
    return {
      profile: null,
      sessionCount: 0,
    };
  }

  try {
    return {
      profile: parseStoredAnonymousProfile(
        window.localStorage.getItem(anonymousIdentityStorageKey),
      ),
      sessionCount: parseStoredSessionHistory(
        window.localStorage.getItem(sessionHistoryStorageKey),
      ).length,
    };
  } catch {
    return {
      profile: null,
      sessionCount: 0,
    };
  }
}

function PassiveRecoveryBanner({
  emailDraft,
  notice,
  sessionCount,
  onEmailDraftChange,
  onSubmit,
  onDismiss,
}: {
  emailDraft: string;
  notice: SettingsNoticeState;
  sessionCount: number;
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
          Exactly three completed sessions is the threshold for the quiet
          prompt. You can add one email here or dismiss it forever without
          creating an account.
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

      <p className="profile-notice">
        {sessionCount.toLocaleString()} completed sessions are already stored on
        this device.
      </p>

      {notice ? (
        <p className={`profile-notice is-${notice.tone}`}>{notice.text}</p>
      ) : null}
    </section>
  );
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<AnonymousProfile | null | undefined>(
    undefined,
  );
  const [sessionCount, setSessionCount] = useState(0);
  const [usernameDraft, setUsernameDraft] = useState("");
  const [emailDraft, setEmailDraft] = useState("");
  const [usernameNotice, setUsernameNotice] =
    useState<SettingsNoticeState>(null);
  const [emailNotice, setEmailNotice] = useState<SettingsNoticeState>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadSettings() {
      const { profile: ensuredProfile } = await ensureAnonymousProfile(
        browserIdentityStorage,
      );
      const snapshot = readLocalProfileSnapshot();
      const resolvedProfile = snapshot.profile ?? ensuredProfile;

      if (!isMounted) {
        return;
      }

      setProfile(resolvedProfile);
      setSessionCount(snapshot.sessionCount);
      setUsernameDraft(resolvedProfile.username);
      setEmailDraft(resolvedProfile.email ?? "");
    }

    function syncFromStorage() {
      const snapshot = readLocalProfileSnapshot();

      setProfile(snapshot.profile);
      setSessionCount(snapshot.sessionCount);

      if (snapshot.profile) {
        setUsernameDraft(snapshot.profile.username);
        setEmailDraft(snapshot.profile.email ?? "");
      }
    }

    loadSettings().catch(() => {
      if (!isMounted) {
        return;
      }

      const snapshot = readLocalProfileSnapshot();

      setProfile(snapshot.profile);
      setSessionCount(snapshot.sessionCount);
    });

    window.addEventListener("storage", syncFromStorage);

    return () => {
      isMounted = false;
      window.removeEventListener("storage", syncFromStorage);
    };
  }, []);

  const isSupabaseConfigured = Boolean(getWebPublicSupabaseEnv());
  const showPassivePrompt =
    profile !== null &&
    profile !== undefined &&
    shouldShowEmailCapturePrompt(profile, sessionCount);
  const isProfileLoading = profile === undefined;

  function handleUsernameSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationResult = validateAnonymousUsername(usernameDraft);

    if (validationResult.status === "invalid") {
      setUsernameNotice({
        tone: "error",
        text: validationResult.errorMessage,
      });
      return;
    }

    void updateAnonymousProfile(browserIdentityStorage, {
      username: validationResult.normalizedUsername,
    })
      .then((nextProfile) => {
        setProfile(nextProfile);
        setUsernameDraft(nextProfile.username);
        setUsernameNotice({
          tone: "success",
          text: "Username saved locally.",
        });
      })
      .catch(() => {
        setUsernameNotice({
          tone: "error",
          text: "Username could not be saved because local storage is unavailable.",
        });
      });
  }

  function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationResult = validateEmailAddress(emailDraft);

    if (validationResult.status === "invalid") {
      setEmailNotice({
        tone: "error",
        text: validationResult.errorMessage,
      });
      return;
    }

    const submittedAt =
      profile?.emailPromptSubmittedAt ?? new Date().toISOString();

    void updateAnonymousProfile(browserIdentityStorage, {
      email: validationResult.normalizedEmail,
      emailPromptSubmittedAt: submittedAt,
    })
      .then((nextProfile) => {
        setProfile(nextProfile);
        setEmailDraft(nextProfile.email ?? "");
        setEmailNotice({
          tone: "success",
          text: "Recovery email saved locally.",
        });
      })
      .catch(() => {
        setEmailNotice({
          tone: "error",
          text: "Email could not be saved because local storage is unavailable.",
        });
      });
  }

  function handleDismissPrompt() {
    const dismissedAt =
      profile?.emailPromptDismissedAt ?? new Date().toISOString();

    void updateAnonymousProfile(browserIdentityStorage, {
      emailPromptDismissedAt: dismissedAt,
    })
      .then((nextProfile) => {
        setProfile(nextProfile);
        setEmailNotice(null);
      })
      .catch(() => {
        setEmailNotice({
          tone: "error",
          text: "Prompt dismissal could not be saved locally.",
        });
      });
  }

  return (
    <main className="shell-page settings-page">
      <PageChromeControls />

      <div className="shell-frame">
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
            Under Construction . . .
          </div>
        </section>

        <ShellNav />
      </div>
    </main>
  );
}
