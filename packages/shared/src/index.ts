export const appName = "impoopingrightnow";

export {
  anonymousIdentityStorageKey,
  createAnonymousIdentity,
  createFunnyUsername,
  createMemoryIdentityStorage,
  ensureAnonymousProfile,
  ensureAnonymousIdentity,
  parseStoredAnonymousIdentity,
  parseStoredAnonymousProfile,
  shouldShowEmailCapturePrompt,
  updateAnonymousProfile,
  upsertAnonymousUser,
  validateAnonymousUsername,
  validateEmailAddress,
} from "./identity";
export type {
  AnonymousIdentity,
  AnonymousProfile,
  AnonymousUsersClient,
  AnonymousUserUpsertPayload,
  EmailValidationResult,
  IdentityStorage,
  UsernameValidationResult,
  UpsertAnonymousUserResult,
} from "./identity";

export {
  createSessionFlowState,
  dismissRetroactiveSessionStub,
  openRetroactiveSessionStub,
  startLiveSession,
} from "./session-flow";
export type {
  SessionFlowNotice,
  SessionFlowState,
  SessionFlowStage,
} from "./session-flow";

export {
  createSessionActivityState,
  completeSession,
  formatDurationMs,
  getCurrentPushElapsedMs,
  getHoldButtonLabel,
  getSessionElapsedMs,
  releasePush,
  startPush,
} from "./session-runtime";
export type {
  SessionActivityState,
  SessionCertificate,
} from "./session-runtime";

export {
  getDailyPoopCounterSeed,
  getSimulatedCounterSeed,
  simulateCounterTick,
  simulatedCounterFloor,
} from "./session-ambience";
export type { SimulatedCounterSnapshot } from "./session-ambience";

export {
  appendLiveFeedMessage,
  createUserLiveFeedMessage,
  getSeededLiveFeedMessage,
  validateLiveFeedInput,
} from "./live-feed";
export type { LiveFeedMessage, LiveFeedValidationResult } from "./live-feed";

export { masterWordBank } from "./word-bank";

export {
  appendStoredSessionRecord,
  buildSessionStats,
  createStoredSessionRecord,
  parseStoredSessionHistory,
  recordCompletedSession,
  sessionHistoryStorageKey,
} from "./session-history";
export type {
  SessionHeatmapCell,
  SessionStatsSnapshot,
  StoredSessionRecord,
  WeeklySummary,
} from "./session-history";

export {
  buildGlobalAnalyticsSnapshot,
  formatPeakHourLabel,
  globalAnalyticsMinimumSessions,
} from "./global-analytics";
export type {
  GlobalAnalyticsRow,
  GlobalAnalyticsSnapshot,
  RegionalAnalyticsRow,
} from "./global-analytics";

export {
  createPublicSupabaseClient,
  getExpoPublicSupabaseEnv,
  getWebPublicSupabaseEnv,
} from "./supabase";
export type { PublicSupabaseEnv } from "./supabase";
