import type { APIRoute } from 'astro';
import { DietaryPreferencesService } from '../../lib/services/dietary-preferences.service';
import { createDietaryPreferencesSchema } from '../../lib/validation/dietary-preferences.validation';
import { DEFAULT_USER_ID } from '../../db/supabase.client';
import type { ErrorResponseDTO } from '../../types';

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
