export type LiveFeedPhase = "early" | "middle" | "push" | "victory";

export type LiveFeedMessage = {
  id: string;
  username: string;
  message: string;
  createdAt: string;
  source: "seed" | "user";
};

export type LiveFeedValidationResult =
  | {
      status: "valid";
      normalizedMessage: string;
    }
  | {
      status: "invalid";
      errorMessage: string;
    };

const maxLiveFeedMessageLength = 60;

const profanityBlocklist = ["fuck", "shit", "bitch", "asshole"];

const seededUsernames = [
  "SteadyPlunger_08",
  "SilentComet_14",
  "RoyalLogger_22",
  "NobleFlush_31",
  "SneakyPebble_44",
] as const;

const seededMessagesByPhase: Record<LiveFeedPhase, readonly string[]> = {
  early: ["seat's still cold", "stall check-in", "phone at 12%"],
  middle: ["false alarm", "we're negotiating", "this is all paperwork"],
  push: ["LOCK IN", "OH WOW", "THIS IS IT"],
  victory: ["light as air", "worth the wait", "goodbye old self"],
};

function createFeedId(now: Date, random: () => number): string {
  return `${now.getTime()}-${Math.floor(random() * 1_000_000)}`;
}

function pickRandomItem<T>(items: readonly T[], random: () => number): T {
  const index = Math.floor(random() * items.length);

  return items[index] ?? items[0];
}

export function getLiveFeedPhase(options: {
  sessionElapsedMs: number;
  pushCount: number;
  isHolding: boolean;
}): LiveFeedPhase {
  if (options.isHolding) {
    return "push";
  }

  if (options.pushCount >= 2) {
    return "victory";
  }

  if (options.sessionElapsedMs >= 2 * 60 * 1000 || options.pushCount > 0) {
    return "middle";
  }

  return "early";
}

export function getSeededLiveFeedMessage(options: {
  sessionElapsedMs: number;
  pushCount: number;
  isHolding: boolean;
  now?: Date;
  random?: () => number;
}): LiveFeedMessage {
  const random = options.random ?? Math.random;
  const now = options.now ?? new Date();
  const phase = getLiveFeedPhase(options);

  return {
    id: createFeedId(now, random),
    username: pickRandomItem(seededUsernames, random),
    message: pickRandomItem(seededMessagesByPhase[phase], random),
    createdAt: now.toISOString(),
    source: "seed",
  };
}

export function validateLiveFeedInput(
  message: string,
): LiveFeedValidationResult {
  const normalizedMessage = message.trim().replace(/\s+/g, " ");

  if (!normalizedMessage) {
    return {
      status: "invalid",
      errorMessage: "Say something first.",
    };
  }

  if (normalizedMessage.length > maxLiveFeedMessageLength) {
    return {
      status: "invalid",
      errorMessage: "Keep it to 60 characters or less.",
    };
  }

  const lowercaseMessage = normalizedMessage.toLowerCase();

  if (
    profanityBlocklist.some((blockedWord) =>
      lowercaseMessage.includes(blockedWord),
    )
  ) {
    return {
      status: "invalid",
      errorMessage: "That message is blocked by the v1 word filter.",
    };
  }

  return {
    status: "valid",
    normalizedMessage,
  };
}

export function createUserLiveFeedMessage(options: {
  username: string;
  message: string;
  now?: Date;
  random?: () => number;
}): LiveFeedMessage {
  const random = options.random ?? Math.random;
  const now = options.now ?? new Date();

  return {
    id: createFeedId(now, random),
    username: options.username,
    message: options.message,
    createdAt: now.toISOString(),
    source: "user",
  };
}

export function appendLiveFeedMessage(
  messages: LiveFeedMessage[],
  nextMessage: LiveFeedMessage,
  maxMessages = 5,
): LiveFeedMessage[] {
  return [...messages, nextMessage].slice(-maxMessages);
}
