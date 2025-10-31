# OpenRouter Service - Usage Guide

## Overview

The `OpenRouterService` is a singleton service that provides a simple interface for interacting with the OpenRouter.ai API. It handles authentication, request formatting, and structured JSON responses.

## Basic Usage

```typescript
import { OpenRouterService } from '../services/openrouter.service';
import type { ResponseFormat } from '../services/openrouter.types';

// Define your expected response structure
interface RecipeAnalysis {
  isHealthy: boolean;
  suggestions: string[];
  nutritionScore: number;
}

// Define the JSON schema for the response
const analysisSchema = {
  type: 'object',
  properties: {
    isHealthy: { type: 'boolean' },
    suggestions: { 
      type: 'array', 
      items: { type: 'string' } 
    },
    nutritionScore: { type: 'number' }
  },
  required: ['isHealthy', 'suggestions', 'nutritionScore'],
  additionalProperties: false
};

const responseFormat: ResponseFormat = {
  type: 'json_schema',
  json_schema: {
    name: 'recipe_analysis',
    strict: true,
    schema: analysisSchema,
  },
};

// Get the service instance and make a request
try {
  const openRouter = OpenRouterService.getInstance();
  
  const result = await openRouter.getChatCompletion<RecipeAnalysis>({
    model: 'anthropic/claude-3.5-sonnet',
    systemMessage: 'You are a nutritionist analyzing recipes for healthiness.',
    userMessage: 'Analyze this recipe: Pasta with cream sauce...',
    responseFormat: responseFormat,
    temperature: 0.7,
    maxTokens: 1000,
  });

  console.log('Is healthy:', result.isHealthy);
  console.log('Suggestions:', result.suggestions);
  console.log('Nutrition score:', result.nutritionScore);
} catch (error) {
  console.error('Failed to analyze recipe:', error);
}
```

## Integration with Recipe Analysis Endpoint

Here's how the service integrates with the `/api/recipes/analyze` endpoint:

```typescript
// In /src/pages/api/recipes/analyze.ts

import type { APIContext } from 'astro';
import { OpenRouterService } from '../../lib/services/openrouter.service';
import type { ResponseFormat } from '../../lib/services/openrouter.types';

export const prerender = false;

interface RecipeAnalysisResponse {
  suggested_modifications: {
    title: string;
    content: string;
    changes: Array<{
      type: 'ingredient_substitution' | 'instruction_modification';
      original: string;
      suggested: string;
      reason: string;
    }>;
  };
  unmet_constraints: Array<{
    type: 'forbidden_ingredient' | 'diet_restriction';
    description: string;
    ingredient: string;
  }>;
  can_fully_adapt: boolean;
}

export async function POST(context: APIContext) {
  try {
    // 1. Get authenticated user
    const { data: { user }, error: authError } = await context.locals.supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    // 2. Parse request body
    const body = await context.request.json();
    const { title, content } = body;

    if (!title || !content) {
      return new Response(
        JSON.stringify({ error: 'Missing title or content' }), 
        { status: 400 }
      );
    }

    // 3. Fetch user's dietary preferences
    const { data: preferences, error: prefError } = await context.locals.supabase
      .from('dietary_preferences')
      .select('diet_type, forbidden_ingredients(ingredient)')
      .eq('user_id', user.id)
      .single();

    if (prefError || !preferences) {
      return new Response(
        JSON.stringify({ error: 'Dietary preferences not set' }), 
        { status: 404 }
      );
    }

    // 4. Build AI prompt
    const forbiddenList = preferences.forbidden_ingredients
      .map((item: any) => item.ingredient)
      .join(', ');

    const systemMessage = `You are a culinary expert specializing in dietary adaptations.
Analyze the provided recipe and suggest modifications based on these dietary requirements:
- Diet type: ${preferences.diet_type}
- Forbidden ingredients: ${forbiddenList}

Provide structured suggestions for adapting the recipe while maintaining flavor and texture.`;

    const userMessage = `Recipe Title: ${title}\n\nRecipe Content:\n${content}`;

    // 5. Define response schema
    const responseSchema = {
      type: 'object',
      properties: {
        suggested_modifications: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            content: { type: 'string' },
            changes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string', enum: ['ingredient_substitution', 'instruction_modification'] },
                  original: { type: 'string' },
                  suggested: { type: 'string' },
                  reason: { type: 'string' }
                },
                required: ['type', 'original', 'suggested', 'reason']
              }
            }
          },
          required: ['title', 'content', 'changes']
        },
        unmet_constraints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['forbidden_ingredient', 'diet_restriction'] },
              description: { type: 'string' },
              ingredient: { type: 'string' }
            },
            required: ['type', 'description', 'ingredient']
          }
        },
        can_fully_adapt: { type: 'boolean' }
      },
      required: ['suggested_modifications', 'unmet_constraints', 'can_fully_adapt']
    };

    const responseFormat: ResponseFormat = {
      type: 'json_schema',
      json_schema: {
        name: 'recipe_analysis',
        strict: true,
        schema: responseSchema,
      },
    };

    // 6. Call OpenRouter service
    const openRouter = OpenRouterService.getInstance();
    const analysisResult = await openRouter.getChatCompletion<RecipeAnalysisResponse>({
      model: 'anthropic/claude-3.5-sonnet',
      systemMessage,
      userMessage,
      responseFormat,
      temperature: 0.7,
    });

    // 7. Build and return response
    const response = {
      original_recipe: {
        title,
        content,
      },
      ...analysisResult,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Recipe analysis error:', error);
    
    // Handle OpenRouter service errors
    if (error instanceof Error && error.message.includes('OpenRouter')) {
      return new Response(
        JSON.stringify({ error: 'AI service temporarily unavailable' }), 
        { status: 503 }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      { status: 500 }
    );
  }
}
```

## Configuration

### Environment Variables

Add these to your `.env` file:

```bash
OPENROUTER_API_KEY="sk-or-v1-..."
SITE_URL="http://localhost:4321"
```

For production:

```bash
SITE_URL="https://yourdomain.com"
```

## Supported Models

The service works with any OpenRouter-compatible model. Popular choices:

- `anthropic/claude-3.5-sonnet` - Best for complex reasoning
- `anthropic/claude-3-haiku` - Faster, cost-effective
- `openai/gpt-4-turbo` - Alternative high-quality option
- `openai/gpt-3.5-turbo` - Fast and economical

## Error Handling

The service throws descriptive errors for different scenarios:

```typescript
try {
  const result = await openRouter.getChatCompletion<MyType>({...});
} catch (error) {
  if (error instanceof Error) {
    if (error.message.includes('not configured')) {
      // Missing environment variables
    } else if (error.message.includes('API error')) {
      // OpenRouter API error (401, 429, 500, etc.)
    } else if (error.message.includes('Network error')) {
      // Connection issues
    } else if (error.message.includes('Invalid API response')) {
      // Malformed response from API
    }
  }
}
```

## Best Practices

1. **Type Safety**: Always define a TypeScript interface for your expected response
2. **Schema Validation**: Use `strict: true` in your JSON schema for reliable responses
3. **Error Handling**: Wrap all API calls in try-catch blocks
4. **Temperature**: Use 0.7-0.9 for creative tasks, 0.0-0.3 for deterministic outputs
5. **Max Tokens**: Set appropriate limits to control costs
6. **Singleton Pattern**: Always use `getInstance()` - never try to instantiate directly

## Testing

For unit tests, you can mock the service:

```typescript
import { OpenRouterService } from './openrouter.service';

// Mock the getInstance method
jest.spyOn(OpenRouterService, 'getInstance').mockReturnValue({
  getChatCompletion: jest.fn().mockResolvedValue({
    isHealthy: true,
    suggestions: ['Test suggestion'],
  }),
} as any);
```

