export type SimulatedCounterSnapshot = {
  count: number;
  nextDelayMs: number;
};

type SimulatedCounterAnchor = {
  minutes: number;
  count: number;
  volatility: number;
};

const rotatingEncouragementMessages = [
  "hang in there, champ",
  "official business is underway",
  "steady breathing. steady purpose.",
  "gravity is doing its part.",
] as const;

const milestoneMessages = [
  { thresholdMs: 2 * 60 * 1000, message: "Still going?" },
  { thresholdMs: 5 * 60 * 1000, message: "You okay in there?" },
  { thresholdMs: 10 * 60 * 1000, message: "Try squatting. Seriously." },
  { thresholdMs: 15 * 60 * 1000, message: "You should call someone." },
  { thresholdMs: 20 * 60 * 1000, message: "This is a medical situation." },
] as const;

const encouragementRotationBucketMs = 20 * 1000;

const easternTimeZone = "America/New_York";
const easternClockFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: easternTimeZone,
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

const averageSessionDurationMinutes = 8;

const simulatedCounterAnchors: SimulatedCounterAnchor[] = [
  { minutes: 0, count: 7, volatility: 0.24 },
  { minutes: 60, count: 5, volatility: 0.18 },
  { minutes: 180, count: 4, volatility: 0.12 },
  { minutes: 285, count: 3, volatility: 0.08 },
  { minutes: 360, count: 4, volatility: 0.14 },
  { minutes: 420, count: 7, volatility: 0.22 },
  { minutes: 480, count: 16, volatility: 0.62 },
  { minutes: 510, count: 21, volatility: 0.82 },
  { minutes: 600, count: 17, volatility: 0.58 },
  { minutes: 720, count: 11, volatility: 0.34 },
  { minutes: 795, count: 16, volatility: 0.66 },
  { minutes: 870, count: 13, volatility: 0.48 },
  { minutes: 1020, count: 10, volatility: 0.28 },
  { minutes: 1140, count: 12, volatility: 0.36 },
  { minutes: 1260, count: 14, volatility: 0.42 },
  { minutes: 1380, count: 9, volatility: 0.24 },
  { minutes: 1440, count: 7, volatility: 0.24 },
];

export const simulatedCounterFloor = 3;
const simulatedCounterCeiling = 21;

function clampCounterCount(count: number): number {
  return Math.min(
    simulatedCounterCeiling,
    Math.max(simulatedCounterFloor, Math.round(count)),
  );
}

function getEasternClockMinutesFloat(now: Date): number {
  const parts = easternClockFormatter.formatToParts(now);
  let hour = 0;
  let minute = 0;
  let second = 0;

  for (const part of parts) {
    if (part.type === "hour") {
      hour = Number(part.value);
    }

    if (part.type === "minute") {
      minute = Number(part.value);
    }

    if (part.type === "second") {
      second = Number(part.value);
    }
  }

  return hour * 60 + minute + second / 60;
}

function getSimulatedCounterProfile(now: Date): {
  targetCount: number;
  volatility: number;
} {
  const currentMinutes = getEasternClockMinutesFloat(now);

  for (let index = 0; index < simulatedCounterAnchors.length - 1; index += 1) {
    const currentAnchor = simulatedCounterAnchors[index];
    const nextAnchor = simulatedCounterAnchors[index + 1];

    if (!currentAnchor || !nextAnchor) {
      continue;
    }

    if (
      currentMinutes < currentAnchor.minutes ||
      currentMinutes > nextAnchor.minutes
    ) {
      continue;
    }

    const spanMinutes = nextAnchor.minutes - currentAnchor.minutes;
    const progress =
      spanMinutes === 0
        ? 0
        : (currentMinutes - currentAnchor.minutes) / spanMinutes;

    return {
      targetCount:
        currentAnchor.count +
        (nextAnchor.count - currentAnchor.count) * progress,
      volatility:
        currentAnchor.volatility +
        (nextAnchor.volatility - currentAnchor.volatility) * progress,
    };
  }

  const fallbackAnchor = simulatedCounterAnchors[0];

  return {
    targetCount: fallbackAnchor?.count ?? simulatedCounterFloor,
    volatility: fallbackAnchor?.volatility ?? 0.2,
  };
}

export function getSimulatedCounterSeed(now: Date = new Date()): number {
  return clampCounterCount(getSimulatedCounterProfile(now).targetCount);
}

function getCounterLocalVariance(now: Date, volatility: number): number {
  const currentMinutes = getEasternClockMinutesFloat(now);
  const longWave =
    Math.sin((currentMinutes / 3.5) * Math.PI * 2) * (6 + volatility * 16);
  const mediumWave =
    Math.sin((currentMinutes / 0.9 + 1.4) * Math.PI * 2) * (3 + volatility * 9);

  return longWave + mediumWave;
}

function integrateCounterArea(minutes: number): number {
  const boundedMinutes = Math.max(0, Math.min(1440, minutes));
  let area = 0;

  for (let index = 0; index < simulatedCounterAnchors.length - 1; index += 1) {
    const currentAnchor = simulatedCounterAnchors[index];
    const nextAnchor = simulatedCounterAnchors[index + 1];

    if (!currentAnchor || !nextAnchor) {
      continue;
    }

    if (boundedMinutes <= currentAnchor.minutes) {
      break;
    }

    const segmentStart = currentAnchor.minutes;
    const segmentEnd = Math.min(boundedMinutes, nextAnchor.minutes);

    if (segmentEnd <= segmentStart) {
      continue;
    }

    const segmentSpan = nextAnchor.minutes - currentAnchor.minutes;
    const progress =
      segmentSpan === 0 ? 0 : (segmentEnd - segmentStart) / segmentSpan;
    const endingCount =
      currentAnchor.count + (nextAnchor.count - currentAnchor.count) * progress;

    area +=
      ((currentAnchor.count + endingCount) * (segmentEnd - segmentStart)) / 2;

    if (boundedMinutes <= nextAnchor.minutes) {
      break;
    }
  }

  return area;
}

export function getDailyPoopCounterSeed(now: Date = new Date()): number {
  return Math.max(
    0,
    Math.round(
      integrateCounterArea(getEasternClockMinutesFloat(now)) /
        averageSessionDurationMinutes,
    ),
  );
}

export function getEncouragementMessage(sessionElapsedMs: number): string {
  const safeElapsedMs = Math.max(0, sessionElapsedMs);
  let activeMilestoneMessage: string | null = null;

  for (const milestone of milestoneMessages) {
    if (safeElapsedMs >= milestone.thresholdMs) {
      activeMilestoneMessage = milestone.message;
    }
  }

  if (activeMilestoneMessage) {
    return activeMilestoneMessage;
  }

  const encouragementIndex =
    Math.floor(safeElapsedMs / encouragementRotationBucketMs) %
    rotatingEncouragementMessages.length;

  return (
    rotatingEncouragementMessages[encouragementIndex] ??
    rotatingEncouragementMessages[0]
  );
}

export function simulateCounterTick(
  currentCount: number,
  now: Date = new Date(),
  random: () => number = Math.random,
): SimulatedCounterSnapshot {
  const safeCurrentCount = Number.isFinite(currentCount)
    ? clampCounterCount(currentCount)
    : getSimulatedCounterSeed(now);
  const { targetCount, volatility } = getSimulatedCounterProfile(now);
  const localVariance = getCounterLocalVariance(now, volatility);
  const randomVariance = (random() - 0.5) * (8 + volatility * 20);
  const noisyTarget = clampCounterCount(
    targetCount + localVariance + randomVariance,
  );
  const distance = noisyTarget - safeCurrentCount;
  const wrongWayThreshold = 0.08 + volatility * 0.16;
  const direction =
    distance === 0
      ? random() < 0.5
        ? -1
        : 1
      : random() < wrongWayThreshold
        ? -Math.sign(distance)
        : Math.sign(distance);
  const pressure = Math.min(1, Math.abs(distance) / (10 + volatility * 12));
  const tempoRoll = random();
  const tempoJitterRoll = random();
  const burstThreshold = 0.1 + pressure * 0.14 + volatility * 0.1;
  const pauseThreshold = 0.76 - pressure * 0.06;
  let nextDelayMs =
    520 + Math.floor(tempoJitterRoll * (680 + (1 - volatility) * 520));

  if (tempoRoll < burstThreshold) {
    nextDelayMs = 140 + Math.floor(tempoJitterRoll * 280);
  } else if (tempoRoll > pauseThreshold) {
    nextDelayMs = 1500 + Math.floor(tempoJitterRoll * 2200);
  }

  return {
    count: clampCounterCount(safeCurrentCount + direction),
    nextDelayMs,
  };
}
