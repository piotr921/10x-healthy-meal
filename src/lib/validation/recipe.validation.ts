import { z } from 'zod';

/**
 * Validation schema for CreateRecipeCommand
 * Validates title (1-200 characters) and content (1-10,000 characters)
 */
export const CreateRecipeCommandSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required and cannot be empty')
    .max(200, 'Title must be 200 characters or less')
    .trim(),
  content: z
    .string()
    .min(1, 'Content is required and cannot be empty')
    .max(10000, 'Content must be 10,000 characters or less')
    .trim(),
});

/**
 * Validation schema for recipe list query parameters
 * Used in GET /api/recipes
 */
export const RecipeListQueryParamsSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .refine((val) => val >= 1, 'Page must be a positive integer'),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .refine(
      (val) => val >= 1 && val <= 100,
      'Limit must be between 1 and 100'
    ),
  search: z
    .string()
    .optional()
    .transform((val) => val?.trim() || undefined)
    .refine(
      (val) => !val || val.length <= 200,
      'Search term must be 200 characters or less'
    ),
});

/**
 * Helper function to format Zod validation errors for API responses
 */
export function formatValidationErrors(error: z.ZodError) {
  return error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code,
  }));
}
