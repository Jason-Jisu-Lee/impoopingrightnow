"use client";

import Link from "next/link";
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

const navItems = [
  { href: "/", label: "Primary", title: "Home / Session" },
  { href: "/my-stats", label: "Records", title: "My Stats" },
  { href: "/global", label: "Census", title: "Global" },
  { href: "/settings", label: "Identity", title: "Settings" },
];

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

  if (profile === undefined) {
    return null;
  }

  const isSupabaseConfigured = Boolean(getWebPublicSupabaseEnv());
  const showPassivePrompt =
    profile !== null && shouldShowEmailCapturePrompt(profile, sessionCount);

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
      <div className="shell-frame">
        <section className="shell-banner">
          <div className="shell-banner-row">
            <span className="eyebrow">Settings</span>
            <span className="banner-counter">
              {sessionCount.toLocaleString()} local sessions on file
            </span>
          </div>
          <div className="shell-banner-row">
            <div>
              <p className="eyebrow">impoopingrightnow.com</p>
              <h1 className="banner-title">
                Quiet profile controls for an anonymous-first product.
              </h1>
            </div>
          </div>
          <p className="banner-subtitle">
            Username edits and recovery email capture now live here without
            introducing login screens, passwords, or any mandatory account step.
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

          {showPassivePrompt ? (
            <PassiveRecoveryBanner
              emailDraft={emailDraft}
              notice={emailNotice}
              sessionCount={sessionCount}
              onEmailDraftChange={(nextDraft) => {
                setEmailDraft(nextDraft);

                if (emailNotice?.tone === "error") {
                  setEmailNotice(null);
                }
              }}
              onSubmit={handleEmailSubmit}
              onDismiss={handleDismissPrompt}
            />
          ) : null}

          <div className="shell-content-grid">
            <section className="settings-panel">
              <header className="shell-panel-head">
                <p className="eyebrow">Local profile controls</p>
                <h2 className="shell-panel-title">
                  Optional edits, no coercion.
                </h2>
                <p className="shell-panel-body">
                  These fields stay local-first for now. They support the
                  current anonymous flow without adding any auth ceremony to the
                  app.
                </p>
              </header>

              {profile ? (
                <div className="settings-grid">
                  <article className="settings-card">
                    <h3>Username</h3>
                    <p>
                      Change the auto-generated alias if you want something less
                      assigned by the bathroom state.
                    </p>
                    <form
                      className="settings-form"
                      onSubmit={handleUsernameSubmit}
                    >
                      <label className="settings-field">
                        <span className="stats-record-label">Display name</span>
                        <input
                          className="profile-input"
                          value={usernameDraft}
                          onChange={(event) => {
                            setUsernameDraft(event.target.value);

                            if (usernameNotice?.tone === "error") {
                              setUsernameNotice(null);
                            }
                          }}
                          maxLength={24}
                          aria-label="Username"
                        />
                      </label>
                      <button type="submit" className="profile-button">
                        Save Username
                      </button>
                    </form>
                    {usernameNotice ? (
                      <p className={`profile-notice is-${usernameNotice.tone}`}>
                        {usernameNotice.text}
                      </p>
                    ) : null}
                  </article>

                  <article className="settings-card">
                    <h3>Recovery Email</h3>
                    <p>
                      Optional and passive. It only exists to protect local poop
                      history later without forcing a login flow now.
                    </p>
                    <form
                      className="settings-form"
                      onSubmit={handleEmailSubmit}
                    >
                      <label className="settings-field">
                        <span className="stats-record-label">
                          Email address
                        </span>
                        <input
                          className="profile-input"
                          type="email"
                          inputMode="email"
                          autoComplete="email"
                          value={emailDraft}
                          onChange={(event) => {
                            setEmailDraft(event.target.value);

                            if (emailNotice?.tone === "error") {
                              setEmailNotice(null);
                            }
                          }}
                          placeholder="you@example.com"
                          aria-label="Recovery email"
                        />
                      </label>
                      <button type="submit" className="profile-button">
                        Save Email
                      </button>
                    </form>
                    {emailNotice ? (
                      <p className={`profile-notice is-${emailNotice.tone}`}>
                        {emailNotice.text}
                      </p>
                    ) : null}
                  </article>
                </div>
              ) : (
                <article className="settings-card">
                  <h3>Local profile unavailable</h3>
                  <p>
                    Local storage is blocked right now, so username and email
                    edits cannot persist until browser storage becomes
                    available.
                  </p>
                </article>
              )}
            </section>

            <aside className="shell-aside">
              <section className="shell-aside-card">
                <h3>Anonymous Identity</h3>
                <p>
                  {profile
                    ? `UUID ${profile.id} stays local-first, and ${profile.username} remains usable without account creation.`
                    : "The local anonymous record is currently unavailable."}
                </p>
              </section>

              <section className="shell-aside-card">
                <h3>Prompt State</h3>
                <p>
                  {profile &&
                  shouldShowEmailCapturePrompt(profile, sessionCount)
                    ? "The passive recovery banner is currently eligible because the device has reached three completed sessions without a submitted or dismissed email prompt."
                    : "The passive recovery banner is currently resolved, not yet eligible, or intentionally dismissed."}
                </p>
              </section>

              <section className="shell-aside-card">
                <h3>Environment</h3>
                <p>
                  {isSupabaseConfigured
                    ? "Supabase public env is configured. Local settings remain anonymous-first and optional."
                    : "Supabase public env is still optional here. These settings persist locally either way."}
                </p>
              </section>
            </aside>
          </div>
        </section>

        <footer className="shell-footer">
          <span>
            <strong>Status:</strong> username edits and passive email capture
            are now wired on web.
          </span>
          <span>No login or password flow was introduced.</span>
        </footer>
      </div>
    </main>
  );
}
