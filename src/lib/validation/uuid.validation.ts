import { z } from 'zod';

/**
 * Validation schema for UUID path parameters
 * Ensures the ID parameter is a valid UUID format
 */
export const uuidParamSchema = z.object({
  id: z.string().uuid({ message: "Invalid recipe ID format" })
});

export type UuidParam = z.infer<typeof uuidParamSchema>;

/**
 * Helper function to validate if a string is a valid UUID
 * @param value - The string to validate
 * @returns true if the string is a valid UUID, false otherwise
 */
export function isValidUUID(value: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

