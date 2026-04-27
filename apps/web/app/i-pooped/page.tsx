"use client";

import { useEffect, useState } from "react";

import {
  ensureAnonymousProfile,
  masterWordBank,
} from "@impoopingrightnow/shared";

import {
  PageBackControl,
  PageChromeControls,
} from "../_components/page-chrome-controls";
import { ShellNav } from "../_components/shell-nav";

const poopedMessageVisitStorageKey = "impoopingrightnow.pooped-message-visits";

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
      // Ignore blocked storage and keep the page readable.
    }
  },
};

function readPoopedMessageVisitCount(): number {
  if (typeof window === "undefined") {
    return 0;
  }

  try {
    const storedValue = window.localStorage.getItem(
      poopedMessageVisitStorageKey,
    );
    const visitCount = Number(storedValue);

    return Number.isFinite(visitCount) && visitCount >= 0 ? visitCount : 0;
  } catch {
    return 0;
  }
}

function getPoopedHeadline(visitCount: number): string {
  const messages = masterWordBank.pooped_message;

  if (visitCount <= 0) {
    return messages[0] ?? "Good Job";
  }

  const rotatingMessages = messages.slice(1);

  if (rotatingMessages.length === 0) {
    return messages[0] ?? "Good Job";
  }

  return (
    rotatingMessages[(visitCount - 1) % rotatingMessages.length] ??
    messages[0] ??
    "Good Job"
  );
}

export default function IPoopedPage() {
  const [headline, setHeadline] = useState<string>(
    masterWordBank.pooped_message[0] ?? "Good Job",
  );
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const visitCount = readPoopedMessageVisitCount();
    setHeadline(getPoopedHeadline(visitCount));
    browserIdentityStorage.setItem(
      poopedMessageVisitStorageKey,
      String(visitCount + 1),
    );

    void ensureAnonymousProfile(browserIdentityStorage)
      .then(({ profile }) => {
        if (!isMounted) {
          return;
        }

        setUsername(profile.username);
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        setUsername(null);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main className="shell-page">
      <PageChromeControls />

      <div className="shell-frame">
        <section className="shell-main">
          <PageBackControl />
          <ShellNav />

          <section className="shell-panel">
            <div className="shell-panel-head">
              <p className="eyebrow">Logged</p>
            </div>
            <p className="stats-summary-text">{headline}</p>
            <p className="stats-summary-text">Your Poop has been logged.</p>
            {username ? (
              <p className="stats-summary-text">You are {username}</p>
            ) : null}
          </section>
        </section>
      </div>
    </main>
  );
}
