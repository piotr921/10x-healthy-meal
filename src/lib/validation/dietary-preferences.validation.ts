import { z } from 'zod';
import type { CreateDietaryPreferencesCommand, UpdateDietaryPreferencesCommand, DietaryPreferencesDTO } from '@/types';

const dietTypeEnum = z.enum(['vegan', 'vegetarian', 'none'] as const, {
  errorMap: () => ({ message: 'Must be one of: vegan, vegetarian, none' })
});

const forbiddenIngredientsArray = z
  .array(
    z
      .string()
      .trim()
      .min(1, 'Ingredient name cannot be empty')
      .max(100, 'Ingredient name cannot exceed 100 characters')
  )
  .max(100, 'Maximum 100 forbidden ingredients allowed')
  .transform(ingredients =>
    ingredients.map(i => i.toLowerCase())
  );

export const createDietaryPreferencesSchema = z.object({
  diet_type: dietTypeEnum.describe('Diet type must be one of: vegan, vegetarian, none'),
  forbidden_ingredients: forbiddenIngredientsArray
}) satisfies z.ZodType<CreateDietaryPreferencesCommand>;

export const updateDietaryPreferencesSchema = z.object({
  diet_type: dietTypeEnum,
  forbidden_ingredients: forbiddenIngredientsArray.default([])
});

export const dietaryPreferencesResponseSchema = z.object({
  id: z.string().uuid('Invalid preference ID format'),
  diet_type: dietTypeEnum,
  forbidden_ingredients: z.array(
    z.string().trim().min(1).max(100)
  ),
  version: z.number().int().positive(),
  created_at: z.string(),
  updated_at: z.string()
}) satisfies z.ZodType<DietaryPreferencesDTO>;
