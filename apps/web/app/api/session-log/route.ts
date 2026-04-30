import { createClient } from "@supabase/supabase-js";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextResponse } from "next/server";

import {
  upsertAnonymousUser,
  type AnonymousUsersClient,
} from "@impoopingrightnow/shared";

import {
  getSessionLogHourOfDay,
  type CompletedSessionSyncPayload,
} from "../../_lib/session-sync";

async function readServiceSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  let serviceRoleKey = process.env["SUPABASE_SERVICE_ROLE_KEY"]?.trim();

  try {
    const cloudflareContext = await getCloudflareContext({ async: true });
    const runtimeEnv = cloudflareContext.env as Record<string, string | undefined>;

    serviceRoleKey = runtimeEnv.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? serviceRoleKey;
  } catch {
    // Local Next.js dev can fall back to process.env.
  }

  if (!url || !serviceRoleKey) {
    return null;
  }

  return { url, serviceRoleKey };
}

async function createServiceSupabaseClient() {
  const config = await readServiceSupabaseConfig();

  if (!config) {
    return null;
  }

  return createClient(config.url, config.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}

function isCompletedSessionSyncPayload(
  value: unknown,
): value is CompletedSessionSyncPayload {
  const candidate = value as Partial<CompletedSessionSyncPayload> | null;

  return Boolean(
    candidate &&
    candidate.identity &&
    typeof candidate.identity.id === "string" &&
    typeof candidate.identity.username === "string" &&
    candidate.certificate &&
    typeof candidate.certificate.durationMs === "number" &&
    typeof candidate.certificate.pushCount === "number" &&
    typeof candidate.certificate.totalPushMs === "number" &&
    typeof candidate.certificate.startedAt === "string" &&
    typeof candidate.certificate.endedAt === "string",
  );
}

export async function POST(request: Request) {
  const client = await createServiceSupabaseClient();

  if (!client) {
    return NextResponse.json(
      { error: "Supabase session sync is not configured." },
      { status: 503 },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid session sync payload." },
      { status: 400 },
    );
  }

  if (!isCompletedSessionSyncPayload(body)) {
    return NextResponse.json(
      { error: "Invalid session sync payload." },
      { status: 400 },
    );
  }

  const upsertResult = await upsertAnonymousUser(
    client as unknown as AnonymousUsersClient,
    {
      id: body.identity.id,
      username: body.identity.username,
      createdAt: body.certificate.startedAt,
    },
  );

  if (upsertResult.status === "failed") {
    return NextResponse.json(
      { error: upsertResult.errorMessage },
      { status: 500 },
    );
  }

  const { error } = await client.from("session_log").insert({
    user_id: body.identity.id,
    duration_sec: Math.max(0, Math.round(body.certificate.durationMs / 1000)),
    push_count: Math.max(0, Math.round(body.certificate.pushCount)),
    push_time_sec: Math.max(0, Math.round(body.certificate.totalPushMs / 1000)),
    hour_of_day: getSessionLogHourOfDay(body.certificate.startedAt),
    created_at: body.certificate.endedAt,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ status: "synced" });
}
