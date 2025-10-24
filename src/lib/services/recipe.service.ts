import type { SupabaseClient } from '../../db/supabase.client';
import type {
  CreateRecipeCommand,
  UpdateRecipeCommand,
  RecipeInsert,
  RecipeEntity,
  RecipeDTO,
  RecipeListResponseDTO,
  RecipeListQueryParams,
  PaginationMetadata
} from '../../types';
import { SupabaseConstants } from '../constants/supabase.constants';

export class RecipeService {

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
      if (insertError.code === SupabaseConstants.ERROR_CODES.UNIQUE_VIOLATION) {
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
   * @param excludeId - Optional recipe ID to exclude from the duplicate check (used when updating)
   * @throws Error if duplicate title exists or database operation fails
   */
  private async checkForDuplicateTitle(userId: string, title: string, excludeId?: string): Promise<void> {
    let query = this.supabase
      .from('recipes')
      .select('id')
      .eq('user_id', userId)
      .eq('title', title)
      .is('deleted_at', null);

    // Exclude the current recipe when checking for duplicates during update
    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data: existingRecipe, error: checkError } = await query.single();

    if (checkError && checkError.code !== SupabaseConstants.ERROR_CODES.NOT_FOUND) {
      // NOT_FOUND is the expected error when no duplicate exists
      throw new Error(`Failed to check for existing recipe: ${checkError.message}`);
    }

    if (existingRecipe) {
      throw new Error('DUPLICATE_TITLE');
    }
  }

  /**
   * Retrieves a paginated list of recipes for the specified user
   * @param queryParams - Query parameters for pagination and search
   * @param userId - The ID of the user
   * @returns Promise<RecipeListResponseDTO> - Paginated list of recipes with metadata
   * @throws Error if database operation fails
   */
  async getUserRecipes(queryParams: RecipeListQueryParams, userId: string): Promise<RecipeListResponseDTO> {
    const { page = 1, limit = 20, search } = queryParams;
    const offset = (page - 1) * limit;

    // Build the base query
    let query = this.supabase
      .from('recipes')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    // Add a search filter if provided
    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    // Execute the query
    const { data: recipes, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch recipes: ${error.message}`);
    }

    if (!recipes) {
      throw new Error('Recipe fetch failed - no data returned');
    }

    // Calculate pagination metadata
    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / limit);

    const pagination: PaginationMetadata = {
      current_page: page,
      total_pages: totalPages,
      total_count: totalCount,
      limit: limit
    };

    // Transform recipes to DTO format
    const recipeDTOs = recipes.map(recipe => this.transformToDTO(recipe));

    return {
      recipes: recipeDTOs,
      pagination
    };
  }

  /**
   * Retrieves a single recipe by ID for the specified user
   * @param userId - The ID of the user
   * @param recipeId - The ID of the recipe to retrieve
   * @returns Promise<RecipeDTO | null> - The recipe data or null if not found
   * @throws Error if database operation fails
   */
  async getRecipeById(userId: string, recipeId: string): Promise<RecipeDTO | null> {
    const { data: recipe, error } = await this.supabase
      .from('recipes')
      .select('*')
      .eq('id', recipeId)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .single();

    // Handle not found case (PGRST116 is Supabase's "not found" error code)
    if (error) {
      if (error.code === SupabaseConstants.ERROR_CODES.NOT_FOUND) {
        return null;
      }
      throw new Error(`Failed to fetch recipe: ${error.message}`);
    }

    if (!recipe) {
      return null;
    }

    // Transform to DTO format
    return this.transformToDTO(recipe);
  }

  /**
   * Updates an existing recipe for the specified user
   * @param userId - The ID of the user updating the recipe
   * @param recipeId - The ID of the recipe to update
   * @param command - The recipe update command containing title and content
   * @returns Promise<RecipeDTO> - The updated recipe data
   * @throws Error if recipe not found, duplicate title exists, or database operation fails
   */
  async updateRecipe(userId: string, recipeId: string, command: UpdateRecipeCommand): Promise<RecipeDTO> {
    // Guard clause: Verify recipe exists and belongs to user
    const existingRecipe = await this.getRecipeById(userId, recipeId);
    if (!existingRecipe) {
      throw new Error('NOT_FOUND');
    }

    // Guard clause: Check for duplicate title (excluding current recipe)
    await this.checkForDuplicateTitle(userId, command.title, recipeId);

    // Update the recipe with new data and increment update_counter
    const { data: updatedRecipe, error: updateError } = await this.supabase
      .from('recipes')
      .update({
        title: command.title,
        content: command.content,
        update_counter: existingRecipe.update_counter + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', recipeId)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .select()
      .single();

    if (updateError) {
      // Handle unique constraint violation (fallback if duplicate check failed)
      if (updateError.code === SupabaseConstants.ERROR_CODES.UNIQUE_VIOLATION) {
        throw new Error('DUPLICATE_TITLE');
      }
      throw new Error(`Failed to update recipe: ${updateError.message}`);
    }

    if (!updatedRecipe) {
      throw new Error('Recipe update failed - no data returned');
    }

    // Transform to DTO format (exclude user_id and deleted_at)
    return this.transformToDTO(updatedRecipe);
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
