type MaybePromise<T> = T | Promise<T>;

export type AnonymousIdentity = {
  id: string;
  username: string;
  createdAt: string;
};

export type AnonymousProfile = AnonymousIdentity & {
  email: string | null;
  emailPromptDismissedAt: string | null;
  emailPromptSubmittedAt: string | null;
};

export type AnonymousUserUpsertPayload = Pick<
  AnonymousIdentity,
  "id" | "username"
>;

export type UpsertAnonymousUserResult =
  | {
      status: "synced";
    }
  | {
      status: "failed";
      errorMessage: string;
    };

export interface IdentityStorage {
  getItem(key: string): MaybePromise<string | null>;
  setItem(key: string, value: string): MaybePromise<void>;
}

export interface AnonymousUsersClient {
  from(table: "users"): {
    upsert(
      values: AnonymousUserUpsertPayload,
      options?: {
        onConflict?: string;
      },
    ): Promise<{
      error: {
        message: string;
      } | null;
    }>;
  };
}

type StoredAnonymousIdentity = AnonymousIdentity & {
  version: 1;
};

type StoredAnonymousProfile = AnonymousProfile & {
  version: 2;
};

export type UsernameValidationResult =
  | {
      status: "valid";
      normalizedUsername: string;
    }
  | {
      status: "invalid";
      errorMessage: string;
    };

export type EmailValidationResult =
  | {
      status: "valid";
      normalizedEmail: string;
    }
  | {
      status: "invalid";
      errorMessage: string;
    };

const adjectives = [
  "Steady",
  "Silent",
  "Noble",
  "Wobbly",
  "Brazen",
  "Clever",
  "Dusty",
  "Royal",
  "Sneaky",
  "Sturdy",
] as const;

const poopNouns = [
  "Butt",
  "Turd",
  "Comet",
  "Plunger",
  "Bomber",
  "Pebble",
  "Logger",
  "Flush",
  "Squatter",
  "Stinker",
] as const;

export const anonymousIdentityStorageKey = "impoopingrightnow.anonymous-user";

function createAnonymousProfile(identity: AnonymousIdentity): AnonymousProfile {
  return {
    ...identity,
    email: null,
    emailPromptDismissedAt: null,
    emailPromptSubmittedAt: null,
  };
}

function isStoredAnonymousIdentity(
  parsedValue: unknown,
): parsedValue is StoredAnonymousIdentity {
  const candidate = parsedValue as Partial<StoredAnonymousIdentity> | null;

  return Boolean(
    candidate &&
    candidate.version === 1 &&
    typeof candidate.id === "string" &&
    typeof candidate.username === "string" &&
    typeof candidate.createdAt === "string",
  );
}

function isStoredAnonymousProfile(
  parsedValue: unknown,
): parsedValue is StoredAnonymousProfile {
  const candidate = parsedValue as Partial<StoredAnonymousProfile> | null;

  return Boolean(
    candidate &&
    candidate.version === 2 &&
    typeof candidate.id === "string" &&
    typeof candidate.username === "string" &&
    typeof candidate.createdAt === "string" &&
    (typeof candidate.email === "string" || candidate.email === null) &&
    (typeof candidate.emailPromptDismissedAt === "string" ||
      candidate.emailPromptDismissedAt === null) &&
    (typeof candidate.emailPromptSubmittedAt === "string" ||
      candidate.emailPromptSubmittedAt === null),
  );
}

async function storeAnonymousProfile(
  storage: IdentityStorage,
  profile: AnonymousProfile,
): Promise<void> {
  const storedValue: StoredAnonymousProfile = {
    version: 2,
    ...profile,
  };

  await storage.setItem(
    anonymousIdentityStorageKey,
    JSON.stringify(storedValue),
  );
}

function selectRandom<T>(items: readonly T[], random: () => number): T {
  const index = Math.floor(random() * items.length);

  return items[index] ?? items[0];
}

function createRandomByte(random: () => number): number {
  return Math.floor(random() * 256) % 256;
}

function createUuidFallback(random: () => number): string {
  const bytes = Array.from({ length: 16 }, () => createRandomByte(random));

  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = bytes.map((value) => value.toString(16).padStart(2, "0"));

  return [
    hex.slice(0, 4).join(""),
    hex.slice(4, 6).join(""),
    hex.slice(6, 8).join(""),
    hex.slice(8, 10).join(""),
    hex.slice(10, 16).join(""),
  ].join("-");
}

export function createFunnyUsername(
  random: () => number = Math.random,
): string {
  const adjective = selectRandom(adjectives, random);
  const poopNoun = selectRandom(poopNouns, random);
  const suffix = Math.floor(random() * 100)
    .toString()
    .padStart(2, "0");

  return `${adjective}${poopNoun}_${suffix}`;
}

export function createAnonymousIdentity(options?: {
  now?: Date;
  random?: () => number;
}): AnonymousIdentity {
  const random = options?.random ?? Math.random;
  const now = options?.now ?? new Date();
  const uuid =
    typeof globalThis.crypto !== "undefined" &&
    typeof globalThis.crypto.randomUUID === "function"
      ? globalThis.crypto.randomUUID()
      : createUuidFallback(random);

  return {
    id: uuid,
    username: createFunnyUsername(random),
    createdAt: now.toISOString(),
  };
}

export function parseStoredAnonymousIdentity(
  rawValue: string | null,
): AnonymousIdentity | null {
  const profile = parseStoredAnonymousProfile(rawValue);

  if (!profile) {
    return null;
  }

  return {
    id: profile.id,
    username: profile.username,
    createdAt: profile.createdAt,
  };
}

export function parseStoredAnonymousProfile(
  rawValue: string | null,
): AnonymousProfile | null {
  if (!rawValue) {
    return null;
  }

  try {
    const parsedValue = JSON.parse(rawValue) as Partial<
      StoredAnonymousIdentity | StoredAnonymousProfile
    > | null;

    if (isStoredAnonymousProfile(parsedValue)) {
      return {
        id: parsedValue.id,
        username: parsedValue.username,
        createdAt: parsedValue.createdAt,
        email: parsedValue.email,
        emailPromptDismissedAt: parsedValue.emailPromptDismissedAt,
        emailPromptSubmittedAt: parsedValue.emailPromptSubmittedAt,
      };
    }

    if (!isStoredAnonymousIdentity(parsedValue)) {
      return null;
    }

    return createAnonymousProfile({
      id: parsedValue.id,
      username: parsedValue.username,
      createdAt: parsedValue.createdAt,
    });
  } catch {
    return null;
  }
}

export async function ensureAnonymousProfile(
  storage: IdentityStorage,
  options?: {
    now?: Date;
    random?: () => number;
  },
): Promise<{
  profile: AnonymousProfile;
  isNewIdentity: boolean;
}> {
  const storedProfile = parseStoredAnonymousProfile(
    await storage.getItem(anonymousIdentityStorageKey),
  );

  if (storedProfile) {
    return {
      profile: storedProfile,
      isNewIdentity: false,
    };
  }

  const profile = createAnonymousProfile(createAnonymousIdentity(options));

  await storeAnonymousProfile(storage, profile);

  return {
    profile,
    isNewIdentity: true,
  };
}

export async function ensureAnonymousIdentity(
  storage: IdentityStorage,
  options?: {
    now?: Date;
    random?: () => number;
  },
): Promise<{
  identity: AnonymousIdentity;
  isNewIdentity: boolean;
}> {
  const { profile, isNewIdentity } = await ensureAnonymousProfile(
    storage,
    options,
  );

  return {
    identity: {
      id: profile.id,
      username: profile.username,
      createdAt: profile.createdAt,
    },
    isNewIdentity,
  };
}

export async function updateAnonymousProfile(
  storage: IdentityStorage,
  updates: Partial<
    Pick<
      AnonymousProfile,
      "username" | "email" | "emailPromptDismissedAt" | "emailPromptSubmittedAt"
    >
  >,
  options?: {
    now?: Date;
    random?: () => number;
  },
): Promise<AnonymousProfile> {
  const { profile } = await ensureAnonymousProfile(storage, options);
  const nextProfile: AnonymousProfile = {
    ...profile,
    ...updates,
  };

  await storeAnonymousProfile(storage, nextProfile);

  return nextProfile;
}

export function validateAnonymousUsername(
  rawValue: string,
): UsernameValidationResult {
  const normalizedUsername = rawValue.trim();

  if (normalizedUsername.length < 3 || normalizedUsername.length > 24) {
    return {
      status: "invalid",
      errorMessage: "Keep the username between 3 and 24 characters.",
    };
  }

  return {
    status: "valid",
    normalizedUsername,
  };
}

export function validateEmailAddress(rawValue: string): EmailValidationResult {
  const normalizedEmail = rawValue.trim().toLowerCase();

  if (!normalizedEmail) {
    return {
      status: "invalid",
      errorMessage: "Enter an email address first.",
    };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return {
      status: "invalid",
      errorMessage: "Enter a valid email address.",
    };
  }

  return {
    status: "valid",
    normalizedEmail,
  };
}

export function shouldShowEmailCapturePrompt(
  profile: AnonymousProfile,
  completedSessionCount: number,
): boolean {
  return (
    completedSessionCount >= 3 &&
    profile.email === null &&
    profile.emailPromptDismissedAt === null &&
    profile.emailPromptSubmittedAt === null
  );
}

export async function upsertAnonymousUser(
  client: AnonymousUsersClient,
  identity: AnonymousIdentity,
): Promise<UpsertAnonymousUserResult> {
  const { error } = await client.from("users").upsert(
    {
      id: identity.id,
      username: identity.username,
    },
    {
      onConflict: "id",
    },
  );

  if (error) {
    return {
      status: "failed",
      errorMessage: error.message,
    };
  }

  return {
    status: "synced",
  };
}

export function createMemoryIdentityStorage(
  seed: Record<string, string> = {},
): IdentityStorage {
  const values = new Map(Object.entries(seed));

  return {
    getItem(key) {
      return values.has(key) ? (values.get(key) ?? null) : null;
    },
    setItem(key, value) {
      values.set(key, value);
    },
  };
}
