"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

type PageChromeControlsProps = {
  onHome?: () => void;
};

type PageBackControlProps = {
  onBack?: () => void;
};

function BackArrowIcon() {
  return (
    <svg
      className="shell-top-icon"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path d="M11.25 6.5 5.5 12l5.75 5.5" />
      <path d="M6.25 12H19" />
    </svg>
  );
}

function PoopLogoIcon() {
  return (
    <svg
      className="shell-top-logo-mark"
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <path d="M31.5 10.5c2-4 4.8-6.8 8.6-8.5-.8 3-.1 5.8 1.9 8.3 6.4 1.6 10.8 6.3 10.8 12.6 0 1-.1 1.9-.3 2.8 4 2 6.5 6 6.5 10.8 0 7.7-6 13.5-13.8 13.5H21.1C12 50 5 43.8 5 35.9c0-6.6 4.7-11.9 11.3-13.3 1.2-5.2 5.4-9.4 11-10.9l4.2-1.2Z" />
      <path d="M24.7 28.8c2.5-1.7 5.4-2.5 8.5-2.5 4.3 0 8.2 1.5 11.4 4.4" />
      <path d="M21.6 39.8c3.2-2.4 7.1-3.7 11.4-3.7 4.7 0 9 1.6 12.4 4.7" />
    </svg>
  );
}

export function PageChromeControls({ onHome }: PageChromeControlsProps) {
  const router = useRouter();

  function handleHome() {
    if (onHome) {
      onHome();
      return;
    }

    router.push("/");
  }

  return (
    <div className="shell-top-controls-wrap">
      {onHome ? (
        <button
          type="button"
          className="shell-home-logo"
          onClick={handleHome}
          aria-label="Go home"
          title="Go home"
        >
          <PoopLogoIcon />
          <span className="sr-only">Go home</span>
        </button>
      ) : (
        <Link
          href="/"
          className="shell-home-logo"
          aria-label="Go home"
          title="Go home"
        >
          <PoopLogoIcon />
          <span className="sr-only">Go home</span>
        </Link>
      )}
    </div>
  );
}

export function PageBackControl({ onBack }: PageBackControlProps) {
  const pathname = usePathname();
  const router = useRouter();

  function handleBack() {
    if (onBack) {
      onBack();
      return;
    }

    if (pathname === "/" || window.history.length <= 1) {
      router.push("/");
      return;
    }

    router.back();
  }

  return (
    <div className="shell-main-back-anchor">
      <button
        type="button"
        className="shell-back-button"
        onClick={handleBack}
        aria-label="Go back"
        title="Go back"
      >
        <BackArrowIcon />
        <span className="sr-only">Go back</span>
      </button>
    </div>
  );
}

export { PoopLogoIcon };
