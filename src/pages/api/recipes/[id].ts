import type { APIRoute } from 'astro';

import { RecipeService } from '../../../lib/services/recipe.service';
import { isValidUUID } from '../../../lib/validation/uuid.validation';
import { DEFAULT_USER_ID } from '../../../db/supabase.client';
import type { ErrorResponseDTO, RecipeDTO } from '../../../types';

export const prerender = false;

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
    if (!locals.supabase) {
      console.error('Supabase client not available in locals');
      const errorResponse: ErrorResponseDTO = {
        error: {
          message: 'Internal server error',
          code: 'SUPABASE_CLIENT_UNAVAILABLE'
        },
        timestamp: new Date().toISOString()
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Guard clause: Validate recipe ID parameter exists
    const recipeId = params.id;
    if (!recipeId) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          message: 'Recipe ID is required',
          code: 'MISSING_RECIPE_ID'
        },
        timestamp: new Date().toISOString()
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Guard clause: Validate UUID format
    if (!isValidUUID(recipeId)) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          message: 'Invalid recipe ID format',
          code: 'INVALID_UUID'
        },
        timestamp: new Date().toISOString()
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Fetch recipe using RecipeService
    const recipeService = new RecipeService(locals.supabase);
    const recipe: RecipeDTO | null = await recipeService.getRecipeById(DEFAULT_USER_ID, recipeId);

    // Guard clause: Handle recipe not found
    if (!recipe) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          message: 'Recipe not found'
        },
        timestamp: new Date().toISOString()
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Happy path: Return the recipe
    return new Response(JSON.stringify(recipe), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    // Handle unexpected errors
    console.error('Error fetching recipe:', error);

    const errorResponse: ErrorResponseDTO = {
      error: {
        message: 'Internal server error'
      },
      timestamp: new Date().toISOString()
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

