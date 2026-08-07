import { createClient } from '@supabase/supabase-js';
import { getEnv } from '../env';
import WebSocket from 'ws';

let supabaseClient: ReturnType<typeof createClient> | null = null;
let supabaseAnonClient: ReturnType<typeof createClient> | null = null;

// Service-role client: full admin access (bypasses RLS). Use for trusted
// server-side operations only (login lookups, admin tasks).
export function getSupabase() {
  const env = getEnv();
  if (!supabaseClient) {
    supabaseClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      realtime: { transport: WebSocket as any },
    });
  }
  return supabaseClient;
}

// Anon-key client: same permissions a browser would have. Used for
// auth.signUp() so Supabase actually sends a real confirmation email and
// marks the account unconfirmed until the user clicks the link — the
// admin client's createUser() cannot do this safely.
export function getSupabaseAnon() {
  const env = getEnv();
  if (!supabaseAnonClient) {
    supabaseAnonClient = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return supabaseAnonClient;
}