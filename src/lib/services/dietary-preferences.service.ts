import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  CreateDietaryPreferencesCommand,
  DietaryPreferencesDTO,
  DietaryPreferencesInsert,
  ForbiddenIngredientsInsert
} from '../../types';

export class DietaryPreferencesService {
  constructor(private readonly supabase: SupabaseClient) {}

  async createDietaryPreferences(
    userId: string,
    command: CreateDietaryPreferencesCommand
  ): Promise<DietaryPreferencesDTO> {
    // Check for existing preferences
    const { data: existingPrefs } = await this.supabase
      .from('dietary_preferences')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (existingPrefs) {
      throw new Error('User already has dietary preferences');
    }

    // Start transaction
    const { data: preferences, error: txError } = await this.supabase.rpc(
      'create_dietary_preferences',
      {
        p_user_id: userId,
        p_diet_type: command.diet_type,
        p_forbidden_ingredients: command.forbidden_ingredients
      }
    );

    if (txError) {
      throw new Error(`Failed to create dietary preferences: ${txError.message}`);
    }

    // Fetch the created preferences with ingredients
    const { data: result, error: fetchError } = await this.supabase
      .from('dietary_preferences')
      .select(`
        id,
        diet_type,
        version,
        created_at,
        updated_at,
        forbidden_ingredients (
          ingredient_name
        )
      `)
      .eq('id', preferences.id)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch created preferences: ${fetchError.message}`);
    }

    return {
      id: result.id,
      diet_type: result.diet_type,
      forbidden_ingredients: result.forbidden_ingredients.map(fi => fi.ingredient_name),
      version: result.version,
      created_at: result.created_at,
      updated_at: result.updated_at
    };
  }
}
