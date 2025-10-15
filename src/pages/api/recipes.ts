import type { APIRoute } from 'astro';

import { RecipeService } from '../../lib/services/recipe.service';
import { CreateRecipeCommandSchema, formatValidationErrors } from '../../lib/validation/recipe.validation';
import type { CreateRecipeCommand, ErrorResponseDTO, RecipeDTO } from '../../types';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Get authenticated user from Supabase
    const { data: { user }, error: authError } = await locals.supabase.auth.getUser();

    if (authError || !user) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          message: 'Authentication required',
          code: 'UNAUTHORIZED'
        },
        timestamp: new Date().toISOString()
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse and validate request body
    const validationResult = await parseAndValidateRequestBody(request);
    if (!validationResult.success) {
      return validationResult.errorResponse!;
    }

    const command: CreateRecipeCommand = validationResult.data!;

    // Create a recipe using service
    const recipeService = new RecipeService(locals.supabase);
    
    try {
      const newRecipe: RecipeDTO = await recipeService.createRecipe(user.id, command);
      
      return new Response(JSON.stringify(newRecipe), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (serviceError) {
      // Handle specific service errors
      if (serviceError instanceof Error) {
        if (serviceError.message === 'DUPLICATE_TITLE') {
          const errorResponse: ErrorResponseDTO = {
            error: {
              message: 'A recipe with this title already exists',
              code: 'DUPLICATE_TITLE'
            },
            timestamp: new Date().toISOString()
          };
          return new Response(JSON.stringify(errorResponse), {
            status: 409,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        // Log the error for debugging
        console.error('Recipe creation error:', serviceError.message);
        
        const errorResponse: ErrorResponseDTO = {
          error: {
            message: 'Failed to create recipe',
            code: 'INTERNAL_ERROR'
          },
          timestamp: new Date().toISOString()
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      throw serviceError;
    }
  } catch (error) {
    // Handle unexpected errors
    console.error('Unexpected error in POST /api/recipes:', error);
    
    const errorResponse: ErrorResponseDTO = {
      error: {
        message: 'An unexpected error occurred',
        code: 'INTERNAL_ERROR'
      },
      timestamp: new Date().toISOString()
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

/**
 * Parses and validates the request body for recipe creation
 * @param request - The incoming request object
 * @returns Promise with a validation result containing either the validated command or error response
 */
async function parseAndValidateRequestBody(request: Request): Promise<{
    success: boolean;
    data?: CreateRecipeCommand;
    errorResponse?: Response;
}> {
    // Parse and validate request body
    let requestBody: unknown;
    try {
        requestBody = await request.json();
    } catch (parseError) {
        const errorResponse: ErrorResponseDTO = {
            error: {
                message: 'Invalid JSON in request body',
                code: 'INVALID_JSON'
            },
            timestamp: new Date().toISOString()
        };
        return {
            success: false,
            errorResponse: new Response(JSON.stringify(errorResponse), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            })
        };
    }

    // Validate request body against schema
    const validationResult = CreateRecipeCommandSchema.safeParse(requestBody);
    if (!validationResult.success) {
        const errorResponse: ErrorResponseDTO = {
            error: {
                message: 'Validation failed',
                code: 'VALIDATION_ERROR',
                details: formatValidationErrors(validationResult.error)
            },
            timestamp: new Date().toISOString()
        };
        return {
            success: false,
            errorResponse: new Response(JSON.stringify(errorResponse), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            })
        };
    }

    return {
        success: true,
        data: validationResult.data
    };
}
