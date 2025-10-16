import { createClient, type SupabaseClient as BaseSupabaseClient } from '@supabase/supabase-js';

import type { Database } from '../db/database.types.ts';

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Export the typed SupabaseClient for use in services
export type SupabaseClient = typeof supabaseClient;

export const DEFAULT_USER_ID = "25db51ec-2788-4943-82e5-76f03ba8a94d";
