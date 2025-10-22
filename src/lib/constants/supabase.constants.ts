/**
 * Constants related to Supabase error codes and other values
 * This class provides centralized access to Supabase-specific constants
 * to avoid duplication and ensure consistency across the codebase.
 */
export class SupabaseConstants {
  // Supabase error codes
  public static readonly ERROR_CODES = {
    NOT_FOUND: 'PGRST116',
    UNIQUE_VIOLATION: '23505',
  };
}

