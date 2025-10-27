import type { APIRoute } from 'astro';

import { RecipeService } from '../../../lib/services/recipe.service';
import { isValidUUID } from '../../../lib/validation/uuid.validation';
import { UpdateRecipeCommandSchema, formatValidationErrors } from '../../../lib/validation/recipe.validation';
import { DEFAULT_USER_ID } from '../../../db/supabase.client';
import type { ErrorResponseDTO, RecipeDTO, UpdateRecipeCommand } from '../../../types';

export const prerender = false;

// =============================================================================
// Helper Methods
// =============================================================================

/**
 * Creates a JSON response with the specified status code and body
 * @param body - Response body object
 * @param status - HTTP status code
 * @returns Response object with JSON content type
 */
function createJsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * Creates an error response with the specified message, code, and status
 * @param message - Error message
 * @param status - HTTP status code
 * @param code - Optional error code
 * @param details - Optional validation error details
 * @returns Response object with error details
 */
function createErrorResponse(
  message: string,
  status: number,
  code?: string,
  details?: Array<{ field: string; message: string; code?: string }>
): Response {
  const errorResponse: ErrorResponseDTO = {
    error: {
      message,
      ...(code && { code }),
      ...(details && { details })
    },
    timestamp: new Date().toISOString()
  };
  return createJsonResponse(errorResponse, status);
}

/**
 * Validates that Supabase client is available in locals
 * @param locals - Astro locals object
 * @returns Response with error if validation fails, null otherwise
 */
function validateSupabaseClient(locals: any): Response | null {
  if (!locals.supabase) {
    console.error('Supabase client not available in locals');
    return createErrorResponse('Internal server error', 500, 'SUPABASE_CLIENT_UNAVAILABLE');
  }
  return null;
}

/**
 * Validates and extracts recipe ID from params
 * @param params - Route parameters
 * @returns Object with recipeId or error response
 */
function validateRecipeId(params: { id?: string }): { recipeId: string } | { error: Response } {
  const recipeId = params.id;

  if (!recipeId) {
    return { error: createErrorResponse('Recipe ID is required', 400, 'MISSING_RECIPE_ID') };
  }

  if (!isValidUUID(recipeId)) {
    return { error: createErrorResponse('Invalid recipe ID format', 400, 'INVALID_UUID') };
  }

  return { recipeId };
}

/**
 * GET /api/recipes/{id}
 * Retrieves a single recipe by ID for the authenticated user
 *
 * @param params.id - The UUID of the recipe to retrieve
 * @returns 200 with RecipeDTO on success
 * @returns 400 if recipe ID is not a valid UUID
 * @returns 404 if recipe not found or belongs to another user
 * @returns 500 on server errors
 */
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // Guard clause: Validate Supabase client availability
    const supabaseError = validateSupabaseClient(locals);
    if (supabaseError) return supabaseError;

    // Guard clause: Validate recipe ID and UUID format
    const validation = validateRecipeId(params);
    if ('error' in validation) return validation.error;
    const { recipeId } = validation;

    // Fetch recipe using RecipeService
    const recipeService = new RecipeService(locals.supabase);
    const recipe: RecipeDTO | null = await recipeService.getRecipeById(DEFAULT_USER_ID, recipeId);

    // Guard clause: Handle recipe not found
    if (!recipe) {
      return createErrorResponse('Recipe not found', 404);
    }

    // Happy path: Return the recipe
    return createJsonResponse(recipe, 200);

  } catch (error) {
    // Handle unexpected errors
    console.error('Error fetching recipe:', error);
    return createErrorResponse('Internal server error', 500);
  }
};

/**
 * PUT /api/recipes/{id}
 * Updates an existing recipe for the authenticated user
 *
 * @param params.id - The UUID of the recipe to update
 * @param request.body - UpdateRecipeCommand containing title and content
 * @returns 200 with updated RecipeDTO on success
 * @returns 400 if recipe ID is invalid or request body validation fails
 * @returns 404 if recipe not found or belongs to another user
 * @returns 409 if recipe with same title already exists
 * @returns 500 on server errors
 */
export const PUT: APIRoute = async ({ params, request, locals }) => {
  try {
    // Guard clause: Validate Supabase client availability
    const supabaseError = validateSupabaseClient(locals);
    if (supabaseError) return supabaseError;

    // Guard clause: Validate recipe ID and UUID format
    const validation = validateRecipeId(params);
    if ('error' in validation) return validation.error;
    const { recipeId } = validation;

    // Parse request body
    let requestBody: unknown;
    try {
      requestBody = await request.json();
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return createErrorResponse('Invalid JSON in request body', 400, 'INVALID_JSON');
    }

    // Guard clause: Validate request body using Zod schema
    const validationResult = UpdateRecipeCommandSchema.safeParse(requestBody);
    if (!validationResult.success) {
      return createErrorResponse(
        'Invalid input',
        400,
        'VALIDATION_ERROR',
        formatValidationErrors(validationResult.error)
      );
    }

    const validatedCommand: UpdateRecipeCommand = validationResult.data;

    // Update recipe using RecipeService
    const recipeService = new RecipeService(locals.supabase);
    const updatedRecipe: RecipeDTO = await recipeService.updateRecipe(
      DEFAULT_USER_ID,
      recipeId,
      validatedCommand
    );

    // Happy path: Return the updated recipe
    return createJsonResponse(updatedRecipe, 200);

  } catch (error) {
    // Handle service-specific errors
    if (error instanceof Error) {
      // Handle NOT_FOUND error
      if (error.message === 'NOT_FOUND') {
        console.error(`Recipe not found for update - recipeId: ${params.id}, userId: ${DEFAULT_USER_ID}`);
        return createErrorResponse('Recipe not found', 404, 'NOT_FOUND');
      }

      // Handle DUPLICATE_TITLE error
      if (error.message === 'DUPLICATE_TITLE') {
        console.error(`Duplicate recipe title attempted - userId: ${DEFAULT_USER_ID}, recipeId: ${params.id}`);
        return createErrorResponse('Recipe with this title already exists', 409, 'DUPLICATE_TITLE');
      }
    }

    // Handle unexpected errors
    console.error('Error updating recipe:', error);
    return createErrorResponse('Internal server error', 500);
  }
};

/**
 * DELETE /api/recipes/{id}
 * Soft deletes an existing recipe for the authenticated user
 *
 * @param params.id - The UUID of the recipe to delete
 * @returns 204 No Content on success
 * @returns 400 if recipe ID is invalid
 * @returns 404 if recipe not found or belongs to another user
 * @returns 500 on server errors
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    // Guard clause: Validate Supabase client availability
    const supabaseError = validateSupabaseClient(locals);
    if (supabaseError) return supabaseError;

    // Guard clause: Validate recipe ID and UUID format
    const validation = validateRecipeId(params);
    if ('error' in validation) return validation.error;
    const { recipeId } = validation;

    // Delete recipe using RecipeService
    const recipeService = new RecipeService(locals.supabase);
    await recipeService.deleteRecipe(DEFAULT_USER_ID, recipeId);

    // Happy path: Return 204 No Content
    return new Response(null, { status: 204 });

  } catch (error) {
    // Handle service-specific errors
    if (error instanceof Error && error.message === 'NOT_FOUND') {
      console.error(`Recipe not found for deletion - recipeId: ${params.id}, userId: ${DEFAULT_USER_ID}`);
      return createErrorResponse('Recipe not found', 404, 'NOT_FOUND');
    }

    // Handle unexpected errors
    console.error('Error deleting recipe:', error);
    return createErrorResponse('Internal server error', 500);
  }
};

