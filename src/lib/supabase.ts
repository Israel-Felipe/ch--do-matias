import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Resolve URL/key from common names:
 * - app defaults (NEXT_PUBLIC_SUPABASE_*)
 * - Vercel Marketplace (SUPABASE_*)
 * - prefixed integration (CHA_MATIAS_*, NEXT_PUBLIC_CHA_MATIAS_*)
 */
function firstEnv(...names: string[]): string | undefined {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  return undefined;
}

function supabaseUrl(): string | undefined {
  return firstEnv(
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_URL",
    "NEXT_PUBLIC_CHA_MATIAS_SUPABASE_URL",
    "CHA_MATIAS_SUPABASE_URL",
  );
}

function supabaseKey(): string | undefined {
  // Prefer secret/service_role so admin + RSVP reads work (bypass RLS).
  return firstEnv(
    "SUPABASE_SERVICE_ROLE_KEY",
    "SUPABASE_SECRET_KEY",
    "CHA_MATIAS_SUPABASE_SERVICE_ROLE_KEY",
    "CHA_MATIAS_SUPABASE_SECRET_KEY",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    "SUPABASE_PUBLISHABLE_KEY",
    "NEXT_PUBLIC_CHA_MATIAS_SUPABASE_ANON_KEY",
    "NEXT_PUBLIC_CHA_MATIAS_SUPABASE_PUBLISHABLE_KEY",
    "CHA_MATIAS_SUPABASE_PUBLISHABLE_KEY",
  );
}

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl() && supabaseKey());
}

export function getSupabaseAdmin(): SupabaseClient | null {
  const url = supabaseUrl();
  const key = supabaseKey();

  if (!url || !key) return null;

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
