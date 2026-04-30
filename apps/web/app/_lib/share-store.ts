import {
  createPublicSupabaseClient,
  type PublicSupabaseEnv,
} from "@impoopingrightnow/shared";

import type { PublicShareSnapshot } from "./share-snapshot";

type ShareSnapshotRow = {
  share_id: string;
  mode: PublicShareSnapshot["mode"];
  username: string | null;
  total_sessions: number;
  current_streak: number;
  best_streak: number;
  average_per_day: number | null;
  recent_heatmap: string;
  shared_at: string;
};

function toSnapshot(row: ShareSnapshotRow): PublicShareSnapshot {
  return {
    version: 1,
    mode: row.mode,
    sharedAt: row.shared_at,
    username: row.username,
    totalSessions: row.total_sessions,
    currentStreak: row.current_streak,
    bestStreak: row.best_streak,
    averagePerDay:
      typeof row.average_per_day === "number" ? row.average_per_day : null,
    recentHeatmap: row.recent_heatmap,
  };
}

function readClientSupabaseEnv(): PublicSupabaseEnv | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) {
    return null;
  }

  return { url, anonKey };
}

function getShareClient() {
  const env = readClientSupabaseEnv();

  if (!env) {
    return null;
  }

  return createPublicSupabaseClient(env);
}

export function isShareStorageConfigured(): boolean {
  return Boolean(readClientSupabaseEnv());
}

export function getStoredSharePath(shareId: string): string {
  return `/share/${encodeURIComponent(shareId)}`;
}

export function buildStoredShareUrl(options: {
  origin: string;
  shareId: string;
}): string {
  return `${options.origin}${getStoredSharePath(options.shareId)}`;
}

export async function createStoredShareId(
  snapshot: PublicShareSnapshot,
): Promise<string | null> {
  const client = getShareClient();

  if (!client) {
    return null;
  }

  const { data, error } = await client
    .from("share_snapshots")
    .insert({
      mode: snapshot.mode,
      username: snapshot.username,
      total_sessions: snapshot.totalSessions,
      current_streak: snapshot.currentStreak,
      best_streak: snapshot.bestStreak,
      average_per_day: snapshot.averagePerDay,
      recent_heatmap: snapshot.recentHeatmap,
      shared_at: snapshot.sharedAt,
    })
    .select("share_id")
    .single<{ share_id: string }>();

  if (error || !data?.share_id) {
    return null;
  }

  return data.share_id;
}

export async function getStoredShareSnapshot(
  shareId: string,
): Promise<PublicShareSnapshot | null> {
  const client = getShareClient();

  if (!client) {
    return null;
  }

  const { data, error } = await client
    .from("share_snapshots")
    .select(
      "share_id, mode, username, total_sessions, current_streak, best_streak, average_per_day, recent_heatmap, shared_at",
    )
    .eq("share_id", shareId)
    .maybeSingle<ShareSnapshotRow>();

  if (error || !data) {
    return null;
  }

  return toSnapshot(data);
}
