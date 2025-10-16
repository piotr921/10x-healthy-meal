import { createClient, type SupabaseClient as BaseSupabaseClient } from '@supabase/supabase-js';

import type { Database } from '../db/database.types.ts';

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Export the typed SupabaseClient for use in services
export type SupabaseClient = typeof supabaseClient;

export const DEFAULT_USER_ID = "d0738ea1-2cd0-4c3e-a999-a62ce23fb6e2";
