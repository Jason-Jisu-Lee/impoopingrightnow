import Link from "next/link";

const shellNavItems = [
  { href: "/my-stats", label: "Records", title: "My Stats" },
  { href: "/global", label: "Browse", title: "World Board" },
  { href: "/settings", label: "Identity", title: "Settings" },
];

export function ShellNav() {
  return (
    <nav className="shell-nav" aria-label="Site navigation">
      {shellNavItems.map((item) => (
        <Link key={item.href} href={item.href} className="shell-nav-link">
          <span className="shell-nav-label">{item.label}</span>
          <span className="shell-nav-title">{item.title}</span>
        </Link>
      ))}
    </nav>
  );
}
