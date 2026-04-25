import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type PublicSupabaseEnv = {
  url: string;
  anonKey: string;
};

type EnvSource = {
  [key: string]: string | undefined;
};

function readPublicSupabaseEnv(
  urlValue: string | undefined,
  anonKeyValue: string | undefined,
): PublicSupabaseEnv | null {
  const url = urlValue?.trim();
  const anonKey = anonKeyValue?.trim();

  if (!url || !anonKey) {
    return null;
  }

  return {
    url,
    anonKey,
  };
}

export function getWebPublicSupabaseEnv(
  source: EnvSource = process.env,
): PublicSupabaseEnv | null {
  return readPublicSupabaseEnv(
    source["NEXT_PUBLIC_SUPABASE_URL"],
    source["NEXT_PUBLIC_SUPABASE_ANON_KEY"],
  );
}

export function getExpoPublicSupabaseEnv(
  source: EnvSource = process.env,
): PublicSupabaseEnv | null {
  return readPublicSupabaseEnv(
    source["EXPO_PUBLIC_SUPABASE_URL"],
    source["EXPO_PUBLIC_SUPABASE_ANON_KEY"],
  );
}

export function createPublicSupabaseClient(
  env: PublicSupabaseEnv,
): SupabaseClient {
  return createClient(env.url, env.anonKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}
