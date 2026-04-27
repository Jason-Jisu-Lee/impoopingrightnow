"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type ShellNavItem = {
  href: string;
  label: string;
  title: string;
  glyph: string;
};

const shellNavItems: ShellNavItem[] = [
  { href: "/my-stats", label: "Records", title: "My Stats", glyph: "R" },
  { href: "/global", label: "World", title: "World Board", glyph: "W" },
  { href: "/settings", label: "Settings", title: "Settings", glyph: "S" },
];

function RecordsIcon() {
  return (
    <svg className="shell-nav-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 7.5h12" />
      <path d="M6 12h12" />
      <path d="M6 16.5h8" />
    </svg>
  );
}

function WorldBoardIcon() {
  return (
    <svg className="shell-nav-icon" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="7" />
      <path d="M5 12h14" />
      <path d="M12 5c2 2 3 4.4 3 7s-1 5-3 7c-2-2-3-4.4-3-7s1-5 3-7Z" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg className="shell-nav-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 7.5h10" />
      <path d="M7 16.5h10" />
      <circle cx="10" cy="7.5" r="1.75" />
      <circle cx="14" cy="16.5" r="1.75" />
    </svg>
  );
}

function NavIcon({ href, glyph }: Pick<ShellNavItem, "href" | "glyph">) {
  if (href === "/my-stats") {
    return <RecordsIcon />;
  }

  if (href === "/global") {
    return <WorldBoardIcon />;
  }

  if (href === "/settings") {
    return <SettingsIcon />;
  }

  return <span className="shell-nav-glyph-fallback">{glyph}</span>;
}

export function ShellNav() {
  const pathname = usePathname();

  return (
    <nav className="shell-nav" aria-label="Site navigation">
      {shellNavItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`shell-nav-link${pathname === item.href ? " is-active" : ""}`}
          aria-current={pathname === item.href ? "page" : undefined}
        >
          <span className="shell-nav-glyph" aria-hidden="true">
            <NavIcon href={item.href} glyph={item.glyph} />
          </span>
          <span className="shell-nav-copy">
            <span className="shell-nav-label">{item.label}</span>
            <span className="shell-nav-title">{item.title}</span>
          </span>
        </Link>
      ))}
    </nav>
  );
}
