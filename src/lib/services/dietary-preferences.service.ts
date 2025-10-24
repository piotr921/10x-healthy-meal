import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  CreateDietaryPreferencesCommand,
  UpdateDietaryPreferencesCommand,
  DietaryPreferencesDTO
} from '@/types';
import { SupabaseConstants } from '../constants/supabase.constants';

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

  async getUserPreferences(userId: string): Promise<DietaryPreferencesDTO | null> {
    // Fetch the user's preferences with ingredients
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
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      // If an error is not found, return null
      if (fetchError.code === SupabaseConstants.ERROR_CODES.NOT_FOUND) {
        return null;
      }
      throw new Error(`Failed to fetch dietary preferences: ${fetchError.message}`);
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

  /**
   * Creates or updates dietary preferences for a user.
   * Returns the preferences DTO and a flag indicating if it was newly created.
   *
   * @param userId - The ID of the user
   * @param command - The update command with diet_type and forbidden_ingredients
   * @returns Object containing the DTO and isNew flag
   * @throws Error if database operations fail
   */
  async upsertDietaryPreferences(
    userId: string,
    command: UpdateDietaryPreferencesCommand
  ): Promise<{ data: DietaryPreferencesDTO; isNew: boolean }> {
    // Check if preferences exist for the user
    const { data: existing, error: checkError } = await this.supabase
      .from('dietary_preferences')
      .select('id, version')
      .eq('user_id', userId)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing preferences:', checkError);
      throw new Error(`Failed to check existing preferences: ${checkError.message}`);
    }

    const isNew = !existing;

    if (isNew) {
      // Create new preferences using the RPC function
      const { data: preferences, error: createError } = await this.supabase.rpc(
        'create_dietary_preferences',
        {
          p_user_id: userId,
          p_diet_type: command.diet_type,
          p_forbidden_ingredients: command.forbidden_ingredients
        }
      );

      if (createError) {
        console.error('Error creating dietary preferences:', createError);
        throw new Error(`Failed to create dietary preferences: ${createError.message}`);
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
        console.error('Error fetching created preferences:', fetchError);
        throw new Error(`Failed to fetch created preferences: ${fetchError.message}`);
      }

      return {
        data: {
          id: result.id,
          diet_type: result.diet_type,
          forbidden_ingredients: result.forbidden_ingredients.map(fi => fi.ingredient_name),
          version: result.version,
          created_at: result.created_at,
          updated_at: result.updated_at
        },
        isNew: true
      };
    } else {
      // Update existing preferences
      // First, update the dietary_preferences record
      const { data: updatedPrefs, error: updateError } = await this.supabase
        .from('dietary_preferences')
        .update({
          diet_type: command.diet_type,
          version: existing.version + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select('id, diet_type, version, created_at, updated_at')
        .single();

      if (updateError) {
        console.error('Error updating dietary preferences:', updateError);
        throw new Error(`Failed to update dietary preferences: ${updateError.message}`);
      }

      // Delete existing forbidden ingredients
      const { error: deleteError } = await this.supabase
        .from('forbidden_ingredients')
        .delete()
        .eq('dietary_preferences_id', existing.id);

      if (deleteError) {
        console.error('Error deleting forbidden ingredients:', deleteError);
        throw new Error(`Failed to delete forbidden ingredients: ${deleteError.message}`);
      }

      // Insert new forbidden ingredients if any
      if (command.forbidden_ingredients.length > 0) {
        const ingredientsToInsert = command.forbidden_ingredients.map(ingredient => ({
          dietary_preferences_id: existing.id,
          ingredient_name: ingredient
        }));

        const { error: insertError } = await this.supabase
          .from('forbidden_ingredients')
          .insert(ingredientsToInsert);

        if (insertError) {
          console.error('Error inserting forbidden ingredients:', insertError);
          throw new Error(`Failed to insert forbidden ingredients: ${insertError.message}`);
        }
      }

      return {
        data: {
          id: updatedPrefs.id,
          diet_type: updatedPrefs.diet_type,
          forbidden_ingredients: command.forbidden_ingredients,
          version: updatedPrefs.version,
          created_at: updatedPrefs.created_at,
          updated_at: updatedPrefs.updated_at
        },
        isNew: false
      };
    }
  }
}
