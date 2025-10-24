/**
 * UUID validation regex pattern (RFC 4122 compliant)
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validates if a string is a valid UUID format
 * @param value - The string to validate
 * @returns boolean - true if valid UUID, false otherwise
 */
export function isValidUUID(value: string): boolean {
  return UUID_REGEX.test(value);
}

