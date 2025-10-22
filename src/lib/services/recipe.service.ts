import type { SupabaseClient } from '../../db/supabase.client';
import type {
  CreateRecipeCommand,
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
   * Transforms a RecipeEntity to RecipeDTO format
   * @param recipe - The recipe entity from database
   * @returns RecipeDTO - The transformed recipe data
   */
  private transformToDTO(recipe: RecipeEntity): RecipeDTO {
    const { user_id, deleted_at, ...recipeDTO } = recipe;
    return recipeDTO;
  }
}
