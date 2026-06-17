import { createClient } from '@supabase/supabase-js';
import { getEnv } from '../env';
import WebSocket from 'ws';

let supabaseClient: ReturnType<typeof createClient> | null = null;

export function getSupabase() {
  const env = getEnv();
  if (!supabaseClient) {
    supabaseClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      realtime: { transport: WebSocket as any },
    });
  }
  return supabaseClient;
}
