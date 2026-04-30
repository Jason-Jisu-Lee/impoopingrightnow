import Link from "next/link";

import {
  getShareCopy,
  parseRecentHeatmapLevels,
  type PublicShareSnapshot,
} from "../_lib/share-snapshot";

function formatAveragePerDay(value: number | null): string {
  if (value === null) {
    return "--";
  }

  return `${value.toFixed(1)} / day`;
}

function formatSharedAt(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Just shared";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function getSummaryText(snapshot: PublicShareSnapshot): string {
  const base = `${snapshot.totalSessions.toLocaleString()} logs.`;
  const streak =
    snapshot.currentStreak > 0
      ? ` ${snapshot.currentStreak}-day streak.`
      : " Fresh streak ready.";
  const prompt =
    snapshot.mode === "challenge"
      ? " Think you can top it?"
      : " Last 4 weeks below.";

  return `${base}${streak}${prompt}`;
}

export function PublicShareScreen({
  snapshot,
}: {
  snapshot: PublicShareSnapshot | null;
}) {
  const copy = snapshot ? getShareCopy(snapshot) : null;
  const heatmapLevels = snapshot ? parseRecentHeatmapLevels(snapshot) : [];
  const handle = snapshot?.username ? `@${snapshot.username}` : "Anonymous pooper";

  return (
    <div className="shell-frame">
      <section className="shell-banner share-banner">
        <div className="shell-banner-row">
          <span className="eyebrow">{copy?.badgeLabel ?? "Share unavailable"}</span>
        </div>
        <div className="shell-banner-row">
          <div>
            <h1 className="banner-title share-banner-title">
              {copy?.heading ?? "This share link is missing its snapshot."}
            </h1>
          </div>
        </div>
        <p className="banner-subtitle">
          {copy?.body ?? "Ask for a fresh share link, or jump into the homepage yourself."}
        </p>
      </section>

      <section className="shell-main share-main">
        <div className="share-content-grid">
          <section className="shell-aside-card shell-user-stats-card share-card">
            {snapshot ? (
              <>
                <div className="share-card-topline">
                  <span className="shell-stamp">{copy!.shareLabel}</span>
                  <span className="share-shared-at">
                    Shared {formatSharedAt(snapshot.sharedAt)}
                  </span>
                </div>

                <div className="share-card-copy">
                  <h2 className="share-card-handle">{handle}</h2>
                  <p className="share-card-summary">{getSummaryText(snapshot)}</p>
                </div>

                <div className="share-metric-grid">
                  <div className="share-metric-card">
                    <span className="share-metric-label">Pooped</span>
                    <strong className="share-metric-value">
                      {snapshot.totalSessions.toLocaleString()}
                    </strong>
                  </div>
                  <div className="share-metric-card">
                    <span className="share-metric-label">Current streak</span>
                    <strong className="share-metric-value">
                      {snapshot.currentStreak} day
                      {snapshot.currentStreak === 1 ? "" : "s"}
                    </strong>
                  </div>
                  <div className="share-metric-card">
                    <span className="share-metric-label">Average a day</span>
                    <strong className="share-metric-value">
                      {formatAveragePerDay(snapshot.averagePerDay)}
                    </strong>
                  </div>
                </div>

                <div className="share-heatmap-wrap">
                  <div className="share-heatmap-head">
                    <span>Last 4 weeks</span>
                    <span className="share-heatmap-hint">lighter to heavier</span>
                  </div>
                  <div
                    className="share-heatmap"
                    role="img"
                    aria-label={`${handle} recent poop activity`}
                  >
                    {heatmapLevels.map((level, index) => (
                      <span
                        key={`${snapshot.sharedAt}-${index}`}
                        className={`stats-heatmap-cell level-${level}`}
                      />
                    ))}
                  </div>
                </div>

                <Link
                  href={`/?shareMode=${snapshot.mode}`}
                  className="session-primary-action share-cta"
                >
                  {copy!.ctaLabel}
                </Link>

                <p className="share-card-caption">
                  Public snapshot only. Not a live profile.
                </p>
              </>
            ) : (
              <>
                <div className="share-card-copy">
                  <h2 className="share-card-handle">Share unavailable</h2>
                  <p className="share-card-summary">
                    This link does not contain a valid brag or challenge snapshot.
                  </p>
                </div>

                <Link href="/" className="session-primary-action share-cta">
                  Start my streak
                </Link>
              </>
            )}
          </section>
        </div>
      </section>
    </div>
  );
}