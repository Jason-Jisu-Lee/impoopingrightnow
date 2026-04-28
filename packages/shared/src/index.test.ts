import { describe, expect, it, vi } from "vitest";

import {
  appendLiveFeedMessage,
  appendStoredSessionRecord,
  anonymousIdentityStorageKey,
  appName,
  buildGlobalAnalyticsSnapshot,
  buildSessionStats,
  completeSession,
  createUserLiveFeedMessage,
  createSessionActivityState,
  createSessionFlowState,
  createFunnyUsername,
  createMemoryIdentityStorage,
  createStoredSessionRecord,
  dismissRetroactiveSessionStub,
  ensureAnonymousProfile,
  ensureAnonymousIdentity,
  formatDurationMs,
  getDailyPoopCounterSeed,
  getCurrentPushElapsedMs,
  getEncouragementMessage,
  getLiveFeedPhase,
  getHoldButtonLabel,
  getSimulatedCounterSeed,
  getSeededLiveFeedMessage,
  getSessionElapsedMs,
  getWebPublicSupabaseEnv,
  openRetroactiveSessionStub,
  parseStoredSessionHistory,
  recordCompletedSession,
  releasePush,
  sessionHistoryStorageKey,
  shouldShowEmailCapturePrompt,
  simulateCounterTick,
  simulatedCounterFloor,
  startPush,
  startLiveSession,
  updateAnonymousProfile,
  upsertAnonymousUser,
  validateAnonymousUsername,
  validateEmailAddress,
  validateLiveFeedInput,
} from "./index";

describe("shared bootstrap", () => {
  it("exports the application name", () => {
    expect(appName).toBe("impoopingrightnow");
  });
});

describe("anonymous identity", () => {
  it("creates funny usernames in the expected format", () => {
    expect(createFunnyUsername(() => 0)).toBe("SteadyButt_00");
  });

  it("persists a generated identity and reuses it on later reads", async () => {
    const storage = createMemoryIdentityStorage();

    const firstLoad = await ensureAnonymousIdentity(storage, {
      now: new Date("2026-04-24T12:00:00.000Z"),
      random: () => 0,
    });

    const secondLoad = await ensureAnonymousIdentity(storage, {
      now: new Date("2026-04-25T12:00:00.000Z"),
      random: () => 0.75,
    });

    expect(firstLoad.isNewIdentity).toBe(true);
    expect(secondLoad.isNewIdentity).toBe(false);
    expect(secondLoad.identity).toEqual(firstLoad.identity);
    expect(firstLoad.identity.username).toBe("SteadyButt_00");
    expect(firstLoad.identity.createdAt).toBe("2026-04-24T12:00:00.000Z");
    expect(firstLoad.identity.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
    expect(await storage.getItem(anonymousIdentityStorageKey)).toContain(
      '"version":2',
    );
  });

  it("upgrades legacy stored identities into editable profiles", async () => {
    const storage = createMemoryIdentityStorage({
      [anonymousIdentityStorageKey]: JSON.stringify({
        version: 1,
        id: "user-123",
        username: "SteadyButt_00",
        createdAt: "2026-04-24T12:00:00.000Z",
      }),
    });

    const ensuredProfile = await ensureAnonymousProfile(storage);

    expect(ensuredProfile).toEqual({
      isNewIdentity: false,
      profile: {
        id: "user-123",
        username: "SteadyButt_00",
        createdAt: "2026-04-24T12:00:00.000Z",
        email: null,
        emailPromptDismissedAt: null,
        emailPromptSubmittedAt: null,
      },
    });
  });

  it("persists profile edits and derives email prompt eligibility", async () => {
    const storage = createMemoryIdentityStorage();
    const { profile } = await ensureAnonymousProfile(storage, {
      now: new Date("2026-04-24T12:00:00.000Z"),
      random: () => 0,
    });

    expect(shouldShowEmailCapturePrompt(profile, 2)).toBe(false);
    expect(shouldShowEmailCapturePrompt(profile, 3)).toBe(true);
    expect(validateAnonymousUsername("  Hall Monitor  ")).toEqual({
      status: "valid",
      normalizedUsername: "Hall Monitor",
    });
    expect(validateEmailAddress("  EXAMPLE@MAIL.com  ")).toEqual({
      status: "valid",
      normalizedEmail: "example@mail.com",
    });

    const updatedProfile = await updateAnonymousProfile(storage, {
      username: "Hall Monitor",
      email: "example@mail.com",
      emailPromptSubmittedAt: "2026-04-24T12:05:00.000Z",
    });

    expect(updatedProfile).toMatchObject({
      username: "Hall Monitor",
      email: "example@mail.com",
      emailPromptSubmittedAt: "2026-04-24T12:05:00.000Z",
    });
    expect(shouldShowEmailCapturePrompt(updatedProfile, 3)).toBe(false);
  });
});

describe("landing session flow", () => {
  it("starts on the landing screen with no retroactive stub shown", () => {
    expect(createSessionFlowState()).toEqual({
      stage: "landing",
      startedAt: null,
      retroactiveStub: null,
    });
  });

  it("starts a live session immediately and records the entry timestamp", () => {
    expect(startLiveSession(new Date("2026-04-24T12:34:56.000Z"))).toEqual({
      stage: "active",
      startedAt: "2026-04-24T12:34:56.000Z",
      retroactiveStub: null,
    });
  });

  it("shows and dismisses the retroactive stub without leaving landing mode", () => {
    const withStub = openRetroactiveSessionStub(createSessionFlowState());

    expect(withStub.stage).toBe("landing");
    expect(withStub.retroactiveStub).toEqual({
      title: "I Pooped",
      body: "Coming soon. Retroactive logging stays stubbed for V1.",
    });

    expect(dismissRetroactiveSessionStub(withStub)).toEqual({
      stage: "landing",
      startedAt: null,
      retroactiveStub: null,
    });
  });

  it("ignores retroactive stub requests once the live session has started", () => {
    const liveSession = startLiveSession(new Date("2026-04-24T12:34:56.000Z"));

    expect(openRetroactiveSessionStub(liveSession)).toEqual(liveSession);
  });
});

describe("session runtime", () => {
  it("creates a clean activity state for a started session", () => {
    expect(createSessionActivityState("2026-04-24T12:00:00.000Z")).toEqual({
      startedAt: "2026-04-24T12:00:00.000Z",
      pushCount: 0,
      totalPushMs: 0,
      activePushStartedAt: null,
      lastPushMs: null,
    });
  });

  it("tracks elapsed session and active push time independently", () => {
    const activePush = startPush(
      createSessionActivityState("2026-04-24T12:00:00.000Z"),
      new Date("2026-04-24T12:00:03.000Z"),
    );

    expect(
      getSessionElapsedMs(activePush, new Date("2026-04-24T12:00:10.000Z")),
    ).toBe(10000);
    expect(
      getCurrentPushElapsedMs(activePush, new Date("2026-04-24T12:00:05.500Z")),
    ).toBe(2500);
  });

  it("records a completed push as one log and accumulates push time", () => {
    const releasedPush = releasePush(
      startPush(
        createSessionActivityState("2026-04-24T12:00:00.000Z"),
        new Date("2026-04-24T12:00:02.000Z"),
      ),
      new Date("2026-04-24T12:00:05.250Z"),
    );

    expect(releasedPush).toEqual({
      startedAt: "2026-04-24T12:00:00.000Z",
      pushCount: 1,
      totalPushMs: 3250,
      activePushStartedAt: null,
      lastPushMs: 3250,
    });
    expect(getHoldButtonLabel(releasedPush.pushCount, false)).toBe(
      "I'M NOT DONE",
    );
  });

  it("ignores redundant release calls and formats timer values for display", () => {
    const idleState = createSessionActivityState("2026-04-24T12:00:00.000Z");

    expect(releasePush(idleState)).toBe(idleState);
    expect(getHoldButtonLabel(idleState.pushCount, false)).toBe(
      "IT'S COMING OUT",
    );
    expect(formatDurationMs(0)).toBe("00:00");
    expect(formatDurationMs(125000)).toBe("02:05");
    expect(formatDurationMs(3661000)).toBe("1:01:01");
  });

  it("finalizes an active session into a certificate summary", () => {
    const { finalActivity, certificate } = completeSession(
      startPush(
        createSessionActivityState("2026-04-24T12:00:00.000Z"),
        new Date("2026-04-24T12:02:00.000Z"),
      ),
      "SteadyButt_00",
      new Date("2026-04-24T12:05:00.000Z"),
    );

    expect(finalActivity).toEqual({
      startedAt: "2026-04-24T12:00:00.000Z",
      pushCount: 1,
      totalPushMs: 180000,
      activePushStartedAt: null,
      lastPushMs: 180000,
    });
    expect(certificate).toMatchObject({
      username: "SteadyButt_00",
      durationMs: 300000,
      durationLabel: "05:00",
      pushCount: 1,
      totalPushMs: 180000,
      totalPushLabel: "03:00",
      rankLabel: "Faster than --% of today's poopers",
      sealLabel: "Provisional Bathroom Authority",
    });
    expect(certificate.endedAt).toBe("2026-04-24T12:05:00.000Z");
    expect(certificate.issuedAtLabel).toContain("2026");
  });
});

describe("session ambience", () => {
  it("rotates encouragement copy before the first milestone", () => {
    expect(getEncouragementMessage(0)).toBe("hang in there, champ");
    expect(getEncouragementMessage(20_000)).toBe(
      "official business is underway",
    );
  });

  it("switches to milestone copy at the required elapsed times", () => {
    expect(getEncouragementMessage(2 * 60 * 1000)).toBe("Still going?");
    expect(getEncouragementMessage(5 * 60 * 1000)).toBe("You okay in there?");
    expect(getEncouragementMessage(21 * 60 * 1000)).toBe(
      "This is a medical situation.",
    );
  });

  it("seeds the simulated counter from the eastern-time activity curve", () => {
    const overnightLow = getSimulatedCounterSeed(
      new Date("2026-04-24T08:45:00.000Z"),
    );
    const morningPeak = getSimulatedCounterSeed(
      new Date("2026-04-24T12:30:00.000Z"),
    );
    const lunchBump = getSimulatedCounterSeed(
      new Date("2026-04-24T17:15:00.000Z"),
    );
    const lateAfternoon = getSimulatedCounterSeed(
      new Date("2026-04-24T21:00:00.000Z"),
    );
    const eveningLift = getSimulatedCounterSeed(
      new Date("2026-04-24T23:00:00.000Z"),
    );

    expect(overnightLow).toBe(simulatedCounterFloor);
    expect(morningPeak).toBeGreaterThan(lunchBump);
    expect(lunchBump).toBeGreaterThan(lateAfternoon);
    expect(eveningLift).toBeGreaterThan(lateAfternoon);
  });

  it("nudges the simulated counter toward the morning peak with human-trackable updates", () => {
    const randomValues = [0.6, 0.9, 0.1, 0.4];
    let index = 0;

    expect(
      simulateCounterTick(
        20,
        new Date("2026-04-24T12:30:00.000Z"),
        () => randomValues[index++] ?? 0.4,
      ),
    ).toEqual({
      count: 19,
      nextDelayMs: 252,
    });
  });

  it("never lets the simulated counter fall below the floor", () => {
    const randomValues = [0.4, 0.05, 0.95, 0.2];
    let index = 0;

    expect(
      simulateCounterTick(
        simulatedCounterFloor + 1,
        new Date("2026-04-24T08:45:00.000Z"),
        () => randomValues[index++] ?? 0.2,
      ),
    ).toEqual({
      count: simulatedCounterFloor,
      nextDelayMs: 1940,
    });
  });

  it("builds the daily poop counter from the same eastern-time curve and resets after midnight", () => {
    const earlyMorning = getDailyPoopCounterSeed(
      new Date("2026-04-24T08:45:00.000Z"),
    );
    const morningPeak = getDailyPoopCounterSeed(
      new Date("2026-04-24T12:30:00.000Z"),
    );
    const evening = getDailyPoopCounterSeed(
      new Date("2026-04-24T23:00:00.000Z"),
    );
    const justAfterMidnight = getDailyPoopCounterSeed(
      new Date("2026-04-25T04:01:00.000Z"),
    );

    expect(earlyMorning).toBeGreaterThan(0);
    expect(morningPeak).toBeGreaterThan(earlyMorning);
    expect(evening).toBeGreaterThan(morningPeak);
    expect(justAfterMidnight).toBeLessThan(earlyMorning);
  });
});

describe("live feed", () => {
  it("picks feed phases from the active session state", () => {
    expect(
      getLiveFeedPhase({
        sessionElapsedMs: 30_000,
        pushCount: 0,
        isHolding: false,
      }),
    ).toBe("early");
    expect(
      getLiveFeedPhase({
        sessionElapsedMs: 3 * 60 * 1000,
        pushCount: 0,
        isHolding: false,
      }),
    ).toBe("middle");
    expect(
      getLiveFeedPhase({
        sessionElapsedMs: 3 * 60 * 1000,
        pushCount: 1,
        isHolding: true,
      }),
    ).toBe("push");
    expect(
      getLiveFeedPhase({
        sessionElapsedMs: 6 * 60 * 1000,
        pushCount: 2,
        isHolding: false,
      }),
    ).toBe("victory");
  });

  it("creates deterministic seeded feed messages for the current phase", () => {
    const sequence = [0.4, 0.2, 0.6];
    let sequenceIndex = 0;

    const seededMessage = getSeededLiveFeedMessage({
      sessionElapsedMs: 4 * 60 * 1000,
      pushCount: 0,
      isHolding: false,
      now: new Date("2026-04-24T12:00:00.000Z"),
      random: () => sequence[sequenceIndex++] ?? 0,
    });

    expect(seededMessage).toMatchObject({
      username: "SilentComet_14",
      message: "we're negotiating",
      createdAt: "2026-04-24T12:00:00.000Z",
      source: "seed",
    });
    expect(seededMessage.id).toBe("1777032000000-400000");
  });

  it("validates user messages with the v1 length and profanity stub", () => {
    expect(validateLiveFeedInput("   hello from the stall   ")).toEqual({
      status: "valid",
      normalizedMessage: "hello from the stall",
    });
    expect(validateLiveFeedInput(" ")).toEqual({
      status: "invalid",
      errorMessage: "Say something first.",
    });
    expect(validateLiveFeedInput("x".repeat(61))).toEqual({
      status: "invalid",
      errorMessage: "Keep it to 60 characters or less.",
    });
    expect(validateLiveFeedInput("this is shit")).toEqual({
      status: "invalid",
      errorMessage: "That message is blocked by the v1 word filter.",
    });
  });

  it("creates user feed messages and caps the floating history", () => {
    const createdAt = new Date("2026-04-24T12:00:00.000Z");
    const messages = [0, 1, 2, 3, 4].map((index) =>
      createUserLiveFeedMessage({
        username: `SteadyButt_0${index}`,
        message: `message-${index}`,
        now: new Date(createdAt.getTime() + index * 1000),
        random: () => 0,
      }),
    );

    const nextMessage = createUserLiveFeedMessage({
      username: "SteadyButt_05",
      message: "message-5",
      now: new Date("2026-04-24T12:00:05.000Z"),
      random: () => 0,
    });

    expect(
      appendLiveFeedMessage(messages, nextMessage, 5).map(
        (message) => message.message,
      ),
    ).toEqual([
      "message-1",
      "message-2",
      "message-3",
      "message-4",
      "message-5",
    ]);
  });
});

describe("session history", () => {
  it("persists completed sessions into storage and parses them back", async () => {
    const storage = createMemoryIdentityStorage();
    const sessionStart = new Date(2026, 3, 24, 12, 0, 0);
    const certificate = completeSession(
      createSessionActivityState(sessionStart.toISOString()),
      "SteadyButt_00",
      new Date(2026, 3, 24, 12, 4, 0),
    ).certificate;

    const storedRecords = await recordCompletedSession(
      storage,
      certificate,
      () => 0,
    );

    expect(storedRecords).toEqual([
      {
        id: `${Date.parse(certificate.endedAt)}-0`,
        username: "SteadyButt_00",
        durationMs: 240000,
        pushCount: 0,
        totalPushMs: 0,
        completedAt: certificate.endedAt,
      },
    ]);
    expect(
      parseStoredSessionHistory(
        await storage.getItem(sessionHistoryStorageKey),
      ),
    ).toEqual(storedRecords);
  });

  it("persists the diarrhea flag when a session is marked that way", async () => {
    const storage = createMemoryIdentityStorage();
    const sessionStart = new Date(2026, 3, 24, 13, 0, 0);
    const certificate = completeSession(
      createSessionActivityState(sessionStart.toISOString()),
      "SteadyButt_00",
      new Date(2026, 3, 24, 13, 5, 0),
    ).certificate;

    const storedRecords = await recordCompletedSession(
      storage,
      certificate,
      () => 0,
      {
        wasDiarrhea: true,
      },
    );

    expect(storedRecords[0]).toMatchObject({
      wasDiarrhea: true,
    });
  });

  it("builds streaks, records, weekly summary, and heatmap counts", () => {
    const history = appendStoredSessionRecord(
      [],
      createStoredSessionRecord(
        {
          username: "SteadyButt_00",
          durationMs: 180000,
          durationLabel: "03:00",
          pushCount: 1,
          totalPushMs: 60000,
          totalPushLabel: "01:00",
          startedAt: new Date(2026, 3, 18, 8, 0, 0).toISOString(),
          endedAt: new Date(2026, 3, 18, 8, 3, 0).toISOString(),
          issuedAtLabel: "Apr 18, 2026, 8:03 AM",
          rankLabel: "Faster than --% of today's poopers",
          sealLabel: "Provisional Bathroom Authority",
        },
        () => 0,
      ),
    );
    const seededHistory = [
      ...history,
      {
        id: "a-1",
        username: "SteadyButt_00",
        durationMs: 240000,
        pushCount: 2,
        totalPushMs: 90000,
        completedAt: new Date(2026, 3, 20, 8, 4, 0).toISOString(),
      },
      {
        id: "a-2",
        username: "SteadyButt_00",
        durationMs: 300000,
        pushCount: 3,
        totalPushMs: 120000,
        completedAt: new Date(2026, 3, 20, 9, 5, 0).toISOString(),
      },
      {
        id: "a-3",
        username: "SteadyButt_00",
        durationMs: 120000,
        pushCount: 1,
        totalPushMs: 45000,
        completedAt: new Date(2026, 3, 22, 7, 2, 0).toISOString(),
      },
      {
        id: "a-4",
        username: "SteadyButt_00",
        durationMs: 420000,
        pushCount: 4,
        totalPushMs: 210000,
        completedAt: new Date(2026, 3, 23, 8, 7, 0).toISOString(),
      },
      {
        id: "a-5",
        username: "SteadyButt_00",
        durationMs: 360000,
        pushCount: 2,
        totalPushMs: 150000,
        completedAt: new Date(2026, 3, 24, 6, 6, 0).toISOString(),
      },
    ];

    const stats = buildSessionStats(
      seededHistory,
      new Date(2026, 3, 24, 12, 0, 0),
    );

    expect(stats).not.toBeNull();
    expect(stats?.totalSessions).toBe(6);
    expect(stats?.streaks).toEqual({ current: 3, best: 3 });
    expect(stats?.records.fastest.id).toBe("a-3");
    expect(stats?.records.longest.id).toBe("a-4");
    expect(stats?.records.mostLogs.id).toBe("a-4");
    expect(stats?.weeklySummary).toEqual({
      sessionCount: 5,
      averageDurationMs: 288000,
      averageDurationLabel: "04:48",
      personalRecordCount: 3,
      summaryText: "This week: 5 poops, avg 04:48, 3 personal records.",
    });
    expect(stats?.heatmap.length).toBe(84);
    expect(
      stats?.heatmap.find((cell) => cell.dateKey === "2026-04-20"),
    ).toEqual({
      dateKey: "2026-04-20",
      count: 2,
      level: 2,
    });
  });
});

describe("global analytics", () => {
  it("filters preview rows by threshold and sorts them by average duration", () => {
    const analytics = buildGlobalAnalyticsSnapshot({
      minimumSessions: 50,
      countries: [
        {
          name: "Too Small",
          sessionCount: 49,
          averageDurationMs: 180000,
          averagePeakHour: 6,
          averageLogsPerSession: 2,
          averagePushMsPerSession: 70000,
        },
        {
          name: "United Kingdom",
          sessionCount: 61,
          averageDurationMs: 210000,
          averagePeakHour: 9,
          averageLogsPerSession: 2.1,
          averagePushMsPerSession: 92000,
        },
        {
          name: "United States",
          sessionCount: 88,
          averageDurationMs: 240000,
          averagePeakHour: 7,
          averageLogsPerSession: 2.5,
          averagePushMsPerSession: 110000,
        },
      ],
      regions: [
        {
          name: "US West",
          sessionCount: 54,
          averageDurationMs: 225000,
          averagePeakHour: 8,
          averageLogsPerSession: 2.3,
          averagePushMsPerSession: 99000,
          foodProfile: "Placeholder foods.",
        },
        {
          name: "Too Small Region",
          sessionCount: 12,
          averageDurationMs: 205000,
          averagePeakHour: 10,
          averageLogsPerSession: 2.2,
          averagePushMsPerSession: 81000,
          foodProfile: "Filtered out.",
        },
      ],
    });

    expect(analytics.minimumSessions).toBe(50);
    expect(analytics.countryLeaderboard.map((row) => row.name)).toEqual([
      "United Kingdom",
      "United States",
    ]);
    expect(analytics.countryLeaderboard[0]).toMatchObject({
      averageDurationLabel: "03:30",
      averagePeakHourLabel: "9 AM",
      averagePushLabel: "01:32",
    });
    expect(analytics.regionalStats).toEqual([
      expect.objectContaining({
        name: "US West",
        foodProfile: "Placeholder foods.",
      }),
    ]);
  });
});

describe("Supabase foundation", () => {
  it("reads web public Supabase env values only when both keys exist", () => {
    expect(
      getWebPublicSupabaseEnv({
        NEXT_PUBLIC_SUPABASE_URL: " https://example.supabase.co ",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: " anon-key ",
      }),
    ).toEqual({
      url: "https://example.supabase.co",
      anonKey: "anon-key",
    });

    expect(
      getWebPublicSupabaseEnv({
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      }),
    ).toBeNull();
  });

  it("upserts the anonymous user payload for later session-start sync", async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn().mockReturnValue({ upsert });

    const result = await upsertAnonymousUser(
      {
        from,
      },
      {
        id: "user-123",
        username: "SteadyButt_00",
        createdAt: "2026-04-24T12:00:00.000Z",
      },
    );

    expect(from).toHaveBeenCalledWith("users");
    expect(upsert).toHaveBeenCalledWith(
      {
        id: "user-123",
        username: "SteadyButt_00",
      },
      {
        onConflict: "id",
      },
    );
    expect(result).toEqual({ status: "synced" });
  });

  it("surfaces anonymous user sync failures without throwing", async () => {
    const result = await upsertAnonymousUser(
      {
        from: () => ({
          upsert: async () => ({
            error: {
              message: "write denied",
            },
          }),
        }),
      },
      {
        id: "user-123",
        username: "SteadyButt_00",
        createdAt: "2026-04-24T12:00:00.000Z",
      },
    );

    expect(result).toEqual({
      status: "failed",
      errorMessage: "write denied",
    });
  });
});
