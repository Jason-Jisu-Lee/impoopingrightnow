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
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.png"
      alt=""
      className="shell-top-logo-mark"
      aria-hidden="true"
    />
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
