import type { APIRoute } from 'astro';
import { DietaryPreferencesService } from '@/lib/services/dietary-preferences.service';
import { createDietaryPreferencesSchema, updateDietaryPreferencesSchema, dietaryPreferencesResponseSchema } from '@/lib/validation/dietary-preferences.validation';
import { DEFAULT_USER_ID } from '@/db/supabase.client';
import type { ErrorResponseDTO } from '@/types';
import { ZodError } from 'zod';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = createDietaryPreferencesSchema.safeParse(body);

    if (!validationResult.success) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          message: 'Invalid request data',
          code: 'VALIDATION_ERROR',
          details: validationResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: 'INVALID_FIELD'
          }))
        },
        timestamp: new Date().toISOString()
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create service instance with Supabase client from context
    const service = new DietaryPreferencesService(locals.supabase);

    // Process the request
    const result = await service.createDietaryPreferences(
      DEFAULT_USER_ID,
      validationResult.data
    );

    // Return success response
    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error creating dietary preferences:', error);

    const errorResponse: ErrorResponseDTO = {
      error: {
        message: error instanceof Error ? error.message : 'Internal server error',
        code: error instanceof Error && error.message.includes('already has')
          ? 'PREFERENCES_EXIST'
          : 'INTERNAL_ERROR'
      },
      timestamp: new Date().toISOString()
    };

    return new Response(JSON.stringify(errorResponse), {
      status: error instanceof Error && error.message.includes('already has') ? 409 : 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const GET: APIRoute = async ({ locals }) => {
  try {
    // Create a service instance with Supabase client from context
    const service = new DietaryPreferencesService(locals.supabase);

    // Fetch the user's dietary preferences
    const preferences = await service.getUserPreferences(DEFAULT_USER_ID);

    // If no preferences found, return 404
    if (!preferences) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          message: "Dietary preferences not found",
          code: "PREFERENCES_NOT_FOUND"
        },
        timestamp: new Date().toISOString()
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate the response data
    const validationResult = dietaryPreferencesResponseSchema.safeParse(preferences);

    if (!validationResult.success) {
      console.error('Invalid response data:', validationResult.error);

      const errorResponse: ErrorResponseDTO = {
        error: {
          message: 'Internal data validation error',
          code: 'DATA_VALIDATION_ERROR'
        },
        timestamp: new Date().toISOString()
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Return success response
    return new Response(JSON.stringify(preferences), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'private, max-age=60' // Cache for 60 seconds
      }
    });
  } catch (error) {
    console.error('Error fetching dietary preferences:', error);

    const errorResponse: ErrorResponseDTO = {
      error: {
        message: error instanceof Error ? error.message : 'Internal server error',
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
 * PUT /api/dietary-preferences
 * Creates or updates the current user's dietary preferences
 *
 * Authentication: Required
 * Request Body: { diet_type: DietType, forbidden_ingredients: string[] }
 * Response: DietaryPreferencesDTO with 201 (created) or 200 (updated)
 */
export const PUT: APIRoute = async ({ request, locals }) => {
  try {
    // Verify user authentication
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

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          message: 'Request body must be valid JSON',
          code: 'INVALID_JSON'
        },
        timestamp: new Date().toISOString()
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate request body with Zod schema
    const validationResult = updateDietaryPreferencesSchema.safeParse(body);

    if (!validationResult.success) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          message: 'Invalid input data',
          code: 'VALIDATION_ERROR',
          details: validationResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: 'INVALID_FIELD'
          }))
        },
        timestamp: new Date().toISOString()
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create service instance with Supabase client from context
    const service = new DietaryPreferencesService(locals.supabase);

    // Upsert dietary preferences (create or update)
    const result = await service.upsertDietaryPreferences(
      user.id,
      validationResult.data
    );

    // Return success response with appropriate status code
    const statusCode = result.isNew ? 201 : 200;

    return new Response(JSON.stringify(result.data), {
      status: statusCode,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error upserting dietary preferences:', error);

    // Handle specific error types
    if (error instanceof ZodError) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          message: 'Invalid input data',
          code: 'VALIDATION_ERROR',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        timestamp: new Date().toISOString()
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generic error response (don't expose internal details)
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

