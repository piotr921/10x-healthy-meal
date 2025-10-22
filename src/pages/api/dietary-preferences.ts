import type { APIRoute } from 'astro';
import { DietaryPreferencesService } from '@/lib/services/dietary-preferences.service';
import { createDietaryPreferencesSchema, dietaryPreferencesResponseSchema } from '@/lib/validation/dietary-preferences.validation';
import { DEFAULT_USER_ID } from '@/db/supabase.client';
import type { ErrorResponseDTO } from '@/types';

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
