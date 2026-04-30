import type { SessionStatsSnapshot } from "@impoopingrightnow/shared";

export type ShareMode = "brag" | "challenge";

export type PublicShareSnapshot = {
  version: 1;
  mode: ShareMode;
  sharedAt: string;
  username: string | null;
  totalSessions: number;
  currentStreak: number;
  bestStreak: number;
  averagePerDay: number | null;
  recentHeatmap: string;
};

type SerializedShareSnapshot = {
  v: 1;
  m: ShareMode;
  t: string;
  u: string | null;
  ts: number;
  cs: number;
  bs: number;
  apd: number | null;
  h: string;
};

type ShareCopy = {
  shareLabel: string;
  badgeLabel: string;
  heading: string;
  body: string;
  ctaLabel: string;
  shareText: string;
};

export function buildPublicShareSnapshot(options: {
  mode: ShareMode;
  username: string | null;
  snapshot: SessionStatsSnapshot | null;
  averagePerDay: number | null;
}): PublicShareSnapshot {
  const { mode, username, snapshot, averagePerDay } = options;

  return {
    version: 1,
    mode,
    sharedAt: new Date().toISOString(),
    username,
    totalSessions: snapshot?.totalSessions ?? 0,
    currentStreak: snapshot?.streaks.current ?? 0,
    bestStreak: snapshot?.streaks.best ?? 0,
    averagePerDay:
      averagePerDay !== null && Number.isFinite(averagePerDay)
        ? Number(averagePerDay.toFixed(1))
        : null,
    recentHeatmap: (snapshot?.heatmap ?? [])
      .slice(-28)
      .map((cell) => String(cell.level))
      .join("")
      .padStart(28, "0")
      .slice(-28),
  };
}

export function serializePublicShareSnapshot(
  snapshot: PublicShareSnapshot,
): string {
  const serialized: SerializedShareSnapshot = {
    v: snapshot.version,
    m: snapshot.mode,
    t: snapshot.sharedAt,
    u: snapshot.username,
    ts: snapshot.totalSessions,
    cs: snapshot.currentStreak,
    bs: snapshot.bestStreak,
    apd: snapshot.averagePerDay,
    h: snapshot.recentHeatmap,
  };

  return JSON.stringify(serialized);
}

export function parsePublicShareSnapshot(
  rawValue: string | null | undefined,
): PublicShareSnapshot | null {
  if (!rawValue) {
    return null;
  }

  try {
    const parsedValue = JSON.parse(
      rawValue,
    ) as Partial<SerializedShareSnapshot>;

    if (
      parsedValue.v !== 1 ||
      (parsedValue.m !== "brag" && parsedValue.m !== "challenge") ||
      typeof parsedValue.t !== "string" ||
      (parsedValue.u !== null && typeof parsedValue.u !== "string") ||
      typeof parsedValue.ts !== "number" ||
      typeof parsedValue.cs !== "number" ||
      typeof parsedValue.bs !== "number" ||
      (parsedValue.apd !== null && typeof parsedValue.apd !== "number") ||
      typeof parsedValue.h !== "string" ||
      !/^[0-4]{28}$/.test(parsedValue.h)
    ) {
      return null;
    }

    return {
      version: 1,
      mode: parsedValue.m,
      sharedAt: parsedValue.t,
      username: parsedValue.u,
      totalSessions: parsedValue.ts,
      currentStreak: parsedValue.cs,
      bestStreak: parsedValue.bs,
      averagePerDay: parsedValue.apd,
      recentHeatmap: parsedValue.h,
    };
  } catch {
    return null;
  }
}

export function buildPublicShareUrl(options: {
  snapshot: PublicShareSnapshot;
  origin: string;
}): string {
  const params = new URLSearchParams({
    data: serializePublicShareSnapshot(options.snapshot),
  });

  return `${options.origin}/share?${params.toString()}`;
}

export function getShareCopy(snapshot: PublicShareSnapshot): ShareCopy {
  const handle = snapshot.username ? `@${snapshot.username}` : "Someone";
  const sessionWord = snapshot.totalSessions === 1 ? "time" : "times";
  const streakText =
    snapshot.currentStreak > 0
      ? ` ${handle} is on a ${snapshot.currentStreak}-day streak.`
      : "";

  if (snapshot.mode === "challenge") {
    return {
      shareLabel: "Challenge",
      badgeLabel: "Challenge",
      heading: `${handle} says beat this.`,
      body: "Public snapshot only. Not a live profile.",
      ctaLabel: "Beat this",
      shareText: `${handle} says beat this on impoopingrightnow.com. ${snapshot.totalSessions} ${sessionWord} logged.${streakText}`,
    };
  }

  return {
    shareLabel: "Brag",
    badgeLabel: "Brag",
    heading: `${handle} logged ${snapshot.totalSessions} ${sessionWord}.`,
    body: "Public snapshot only. Not a live profile.",
    ctaLabel: "Start my streak",
    shareText: `${handle} has pooped ${snapshot.totalSessions} ${sessionWord} on impoopingrightnow.com.${streakText}`,
  };
}

export function parseRecentHeatmapLevels(
  snapshot: PublicShareSnapshot,
): number[] {
  return snapshot.recentHeatmap.split("").map((level) => Number(level));
}
