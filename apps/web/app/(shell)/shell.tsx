import Link from "next/link";

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
  { href: "/global", label: "Census", title: "Global" },
  { href: "/settings", label: "Identity", title: "Settings" },
];

export function ShellScreen({
  eyebrow,
  title,
  description,
  statuses,
  checklist,
  asideTitle,
  asideBody,
}: ShellScreenProps) {
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
            This step only defines the surfaces we need for V1: navigation,
            shell layout, placeholder state, and a consistent visual direction.
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
            <strong>Status:</strong> navigation and placeholder surfaces are
            wired.
          </span>
          <span>
            Realtime, identity, persistence, and session logic land in later
            steps.
          </span>
        </footer>
      </div>
    </main>
  );
}
