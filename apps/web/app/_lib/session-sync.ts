import type { AnonymousProfile, SessionCertificate } from "@impoopingrightnow/shared";

export type CompletedSessionSyncPayload = {
  identity: {
    id: string;
    username: string;
  };
  certificate: {
    durationMs: number;
    pushCount: number;
    totalPushMs: number;
    startedAt: string;
    endedAt: string;
  };
};

export function buildCompletedSessionSyncPayload(
  identity: AnonymousProfile,
  certificate: SessionCertificate,
): CompletedSessionSyncPayload {
  return {
    identity: {
      id: identity.id,
      username: identity.username,
    },
    certificate: {
      durationMs: certificate.durationMs,
      pushCount: certificate.pushCount,
      totalPushMs: certificate.totalPushMs,
      startedAt: certificate.startedAt,
      endedAt: certificate.endedAt,
    },
  };
}

export function getSessionLogHourOfDay(startedAt: string): number {
  const date = new Date(startedAt);

  if (Number.isNaN(date.getTime())) {
    return 0;
  }

  return date.getHours();
}

export async function syncCompletedSessionToBackend(
  payload: CompletedSessionSyncPayload,
): Promise<void> {
  const response = await fetch("/api/session-log", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Session sync failed.");
  }
}