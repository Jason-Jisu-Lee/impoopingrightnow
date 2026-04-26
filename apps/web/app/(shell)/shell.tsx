"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  ensureAnonymousIdentity,
  getWebPublicSupabaseEnv,
} from "@impoopingrightnow/shared";

type ShellScreenProps = {
  eyebrow: string;
  title: string;
  description: string;
  statuses: Array<{
    label: string;
    value: string;
  }>;
  checklist: string[];
  asideTitle: string;
  asideBody: string;
};

const navItems = [
  { href: "/", label: "Primary", title: "Home / Session" },
  { href: "/my-stats", label: "Records", title: "My Stats" },
  { href: "/global", label: "Browse", title: "World Board" },
  { href: "/settings", label: "Identity", title: "Settings" },
];

type IdentityCardState = {
  title: string;
  body: string;
};

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
): IdentityCardState {
  if (!username) {
    return {
      title: "Provisioning anonymous record",
      body: "Creating the local UUID and username that future session-start sync will use.",
    };
  }

  if (isSupabaseConfigured) {
    return {
      title: `Anonymous record: ${username}`,
      body: "Saved locally. Supabase public env is configured, so session start can upsert this user in the next step.",
    };
  }

  return {
    title: `Anonymous record: ${username}`,
    body: "Saved locally. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable session-start upserts.",
  };
}

export function ShellScreen({
  eyebrow,
  title,
  description,
  statuses,
  checklist,
  asideTitle,
  asideBody,
}: ShellScreenProps) {
  const [identityCard, setIdentityCard] = useState<IdentityCardState>(
    createIdentityCardState(null, false),
  );

  useEffect(() => {
    let isMounted = true;

    async function provisionIdentity() {
      const localIdentity = await ensureAnonymousIdentity(
        browserIdentityStorage,
      );

      if (!isMounted) {
        return;
      }

      setIdentityCard(
        createIdentityCardState(
          localIdentity.identity.username,
          Boolean(getWebPublicSupabaseEnv()),
        ),
      );
    }

    provisionIdentity().catch(() => {
      if (!isMounted) {
        return;
      }

      setIdentityCard({
        title: "Anonymous record unavailable",
        body: "Local storage is unavailable, so identity will be recreated until storage access succeeds.",
      });
    });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main className="shell-page">
      <div className="shell-frame">
        <section className="shell-banner">
          <div className="shell-banner-row">
            <span className="eyebrow">V1 structural shell</span>
            <span className="banner-counter">847 people pooping right now</span>
          </div>
          <div className="shell-banner-row">
            <div>
              <p className="eyebrow">impoopingrightnow.com</p>
              <h1 className="banner-title">
                Deadpan infrastructure for an absurd product.
              </h1>
            </div>
          </div>
          <p className="banner-subtitle">
            This slice keeps the structural shell intact while adding anonymous
            identity bootstrapping and the Supabase foundation the session flow
            will need next.
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

          <div className="shell-content-grid">
            <section className="shell-panel">
              <header className="shell-panel-head">
                <p className="eyebrow">{eyebrow}</p>
                <h2 className="shell-panel-title">{title}</h2>
                <p className="shell-panel-body">{description}</p>
              </header>

              <ul className="shell-status-list">
                {statuses.map((status) => (
                  <li key={status.label} className="shell-status-item">
                    <span className="shell-status-kicker">§</span>
                    <div className="shell-status-text">
                      <span className="shell-status-label">{status.label}</span>
                      <span className="shell-status-value">{status.value}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <aside className="shell-aside">
              <section className="shell-aside-card">
                <h3>{asideTitle}</h3>
                <p>{asideBody}</p>
              </section>

              <section className="shell-aside-card">
                <h3>{identityCard.title}</h3>
                <p>{identityCard.body}</p>
              </section>

              <section className="shell-aside-card">
                <h3>What this step covers</h3>
                <ul className="shell-checklist">
                  {checklist.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>

              <section className="shell-aside-card">
                <div className="shell-stamp">Foundational shell only</div>
              </section>
            </aside>
          </div>
        </section>

        <footer className="shell-footer">
          <span>
            <strong>Status:</strong> shell surfaces and anonymous identity are
            wired.
          </span>
          <span>
            Session-start upserts, timers, feed activity, and certificate logic
            land in later steps.
          </span>
        </footer>
      </div>
    </main>
  );
}
