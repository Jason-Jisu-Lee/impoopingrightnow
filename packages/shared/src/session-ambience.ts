export type SimulatedCounterSnapshot = {
  count: number;
  nextDelayMs: number;
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

export const simulatedCounterFloor = 847;

function isPeakPoopHour(now: Date): boolean {
  const hour = now.getHours();

  return hour === 7 || hour === 8 || hour === 12 || hour === 21 || hour === 22;
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
  const magnitude = 15 + Math.floor(random() * 16);
  const upwardProbability = isPeakPoopHour(now) ? 0.65 : 0.45;
  const direction = random() < upwardProbability ? 1 : -1;
  const nextDelayMs = 8000 + Math.floor(random() * 7001);

  return {
    count: Math.max(
      simulatedCounterFloor,
      currentCount + direction * magnitude,
    ),
    nextDelayMs,
  };
}
