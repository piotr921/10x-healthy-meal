import type { APIRoute } from 'astro';
import { z } from 'zod';
import { RecipeService } from '@/lib/services/recipe.service';
import { DietaryPreferencesService } from '@/lib/services/dietary-preferences.service';
import { OpenRouterService } from '@/lib/services/openrouter.service';
import { DEFAULT_USER_ID } from '@/db/supabase.client';
import type { RecipeAnalysisResponseDTO } from '@/types';
import type { ResponseFormat } from '@/lib/services/openrouter.types';

export const prerender = false;

/**
 * POST /api/recipes/{id}/analyze
 *
 * Analyzes a recipe using AI based on user's dietary preferences
 * Returns original and modified versions with a summary of changes
 */
export const POST: APIRoute = async ({ params, locals }) => {
  try {
    // Extract recipe ID from params
    const recipeId = params.id;
    if (!recipeId) {
      return new Response(
        JSON.stringify({
          error: {
            message: 'Recipe ID is required',
            code: 'MISSING_RECIPE_ID'
          },
          timestamp: new Date().toISOString()
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate UUID format
    const uuidSchema = z.string().uuid();
    const validationResult = uuidSchema.safeParse(recipeId);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: {
            message: 'Invalid recipe ID format',
            code: 'INVALID_UUID'
          },
          timestamp: new Date().toISOString()
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Initialize services
    const supabase = locals.supabase;
    const recipeService = new RecipeService(supabase);
    const dietaryPreferencesService = new DietaryPreferencesService(supabase);

    // Fetch recipe and verify ownership
    const recipe = await recipeService.getRecipeById(DEFAULT_USER_ID, recipeId);
    if (!recipe) {
      return new Response(
        JSON.stringify({
          error: {
            message: 'Recipe not found',
            code: 'RECIPE_NOT_FOUND'
          },
          timestamp: new Date().toISOString()
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Fetch dietary preferences
    const preferences = await dietaryPreferencesService.getUserPreferences(DEFAULT_USER_ID);
    if (!preferences) {
      return new Response(
        JSON.stringify({
          error: {
            message: 'Dietary preferences not set. Please set your dietary preferences before analyzing recipes.',
            code: 'PREFERENCES_NOT_SET'
          },
          timestamp: new Date().toISOString()
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Build AI prompt
    const systemMessage = `You are a culinary AI assistant specialized in adapting recipes to dietary preferences. 
Your task is to modify recipes based on the user's dietary requirements while maintaining the dish's essence and taste.

Rules:
1. Keep the original recipe structure and format
2. Replace forbidden ingredients with suitable alternatives
3. Adapt the recipe to match the specified diet type
4. Provide clear explanations for major changes
5. Maintain cooking times and temperatures unless changes require adjustment
6. Ensure nutritional balance in modifications
7. Keep recipe original language`;

    const forbiddenList = preferences.forbidden_ingredients.length > 0
      ? preferences.forbidden_ingredients.join(', ')
      : 'none';

    const userMessage = `Please analyze and modify this recipe according to the following dietary preferences:

Diet Type: ${preferences.diet_type}
Forbidden Ingredients: ${forbiddenList}

Original Recipe:
Title: ${recipe.title}
Content:
${recipe.content}

Please provide:
1. The original recipe (as provided)
2. A modified version that adheres to the dietary preferences
3. A summary of the modifications made`;

    // Define response schema
    const responseSchema = {
      type: 'object',
      properties: {
        original: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            content: { type: 'string' }
          },
          required: ['title', 'content']
        },
        modified: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            content: { type: 'string' }
          },
          required: ['title', 'content']
        },
        modifications_summary: { type: 'string' }
      },
      required: ['original', 'modified', 'modifications_summary'],
      additionalProperties: false
    };

    const responseFormat: ResponseFormat = {
      type: 'json_schema',
      json_schema: {
        name: 'recipe_analysis',
        strict: true,
        schema: responseSchema
      }
    };

    // Call OpenRouter API
    const openRouter = OpenRouterService.getInstance();
    const analysisResult = await openRouter.getChatCompletion<RecipeAnalysisResponseDTO>({
      systemMessage,
      userMessage,
      responseFormat,
      temperature: 0.7,
      maxTokens: 4000
    });

    // Return successful response
    return new Response(
      JSON.stringify(analysisResult),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Recipe analysis error:', error);

    // Handle specific error types
    if (error instanceof Error) {
      return new Response(
        JSON.stringify({
          error: {
            message: error.message || 'Failed to analyze recipe',
            code: 'ANALYSIS_ERROR'
          },
          timestamp: new Date().toISOString()
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Generic error
    return new Response(
      JSON.stringify({
        error: {
          message: 'An unexpected error occurred',
          code: 'INTERNAL_ERROR'
        },
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

