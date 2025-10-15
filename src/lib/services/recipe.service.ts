import type { SupabaseClient } from '../../db/supabase.client';
import type {
  CreateRecipeCommand,
  RecipeInsert,
  RecipeEntity,
  RecipeDTO
} from '../../types';

export class RecipeService {
  // Supabase error codes
  private static readonly SUPABASE_NOT_FOUND_CODE = 'PGRST116';
  private static readonly POSTGRES_UNIQUE_VIOLATION_CODE = '23505';

  constructor(private supabase: SupabaseClient) {}

  /**
   * Creates a new recipe for the specified user
   * @param userId - The ID of the user creating the recipe
   * @param command - The recipe creation command containing title and content
   * @returns Promise<RecipeDTO> - The created recipe data
   * @throws Error if recipe with same title exists or database operation fails
   */
  async createRecipe(userId: string, command: CreateRecipeCommand): Promise<RecipeDTO> {
    // Check for duplicate title first
    await this.checkForDuplicateTitle(userId, command.title);

    // Prepare recipe data for insertion
    const recipeData: RecipeInsert = {
      user_id: userId,
      title: command.title,
      content: command.content,
      update_counter: 1,
    };

    // Insert the new recipe
    const { data: newRecipe, error: insertError } = await this.supabase
      .from('recipes')
      .insert(recipeData)
      .select()
      .single();

    if (insertError) {
      // Handle unique constraint violation (fallback if duplicate check failed)
      if (insertError.code === RecipeService.POSTGRES_UNIQUE_VIOLATION_CODE) {
        throw new Error('DUPLICATE_TITLE');
      }
      throw new Error(`Failed to create recipe: ${insertError.message}`);
    }

    if (!newRecipe) {
      throw new Error('Recipe creation failed - no data returned');
    }

    // Transform to DTO format (exclude user_id and deleted_at)
    return this.transformToDTO(newRecipe);
  }

  /**
   * Checks if a recipe with the same title already exists for the user
   * @param userId - The ID of the user
   * @param title - The title to check for duplicates
   * @throws Error if duplicate title exists or database operation fails
   */
  private async checkForDuplicateTitle(userId: string, title: string): Promise<void> {
    const { data: existingRecipe, error: checkError } = await this.supabase
      .from('recipes')
      .select('id')
      .eq('user_id', userId)
      .eq('title', title)
      .is('deleted_at', null)
      .single();

    if (checkError && checkError.code !== RecipeService.SUPABASE_NOT_FOUND_CODE) {
      // SUPABASE_NOT_FOUND_CODE is "not found" which is what we want
      throw new Error(`Failed to check for existing recipe: ${checkError.message}`);
    }

    if (existingRecipe) {
      throw new Error('DUPLICATE_TITLE');
    }
  }

  /**
   * Transforms a RecipeEntity to RecipeDTO format
   * @param recipe - The recipe entity from database
   * @returns RecipeDTO - The transformed recipe data
   */
  private transformToDTO(recipe: RecipeEntity): RecipeDTO {
    const { user_id, deleted_at, ...recipeDTO } = recipe;
    return recipeDTO;
  }
}
