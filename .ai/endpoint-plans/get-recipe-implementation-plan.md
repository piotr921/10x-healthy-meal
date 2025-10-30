# API Endpoint Implementation Plan: GET /api/recipes

## 1. Endpoint Overview
The GET /api/recipes endpoint retrieves a paginated list of recipes belonging to the authenticated user, ordered by creation date in descending order (newest first). It supports optional pagination parameters and a search filter for recipe titles. This endpoint is crucial for displaying user recipes in the frontend, enabling efficient browsing through potentially large collections.

## 2. Request Details
- HTTP Method: GET
- URL Structure: `/api/recipes`
- Parameters:
  - Required: None
  - Optional: 
    - `page` (integer, default: 1) - Page number for pagination, must be >= 1
    - `limit` (integer, default: 20, max: 100) - Number of recipes per page, must be between 1 and 100
    - `search` (string, optional) - Search term for filtering recipes by title
- Request Body: None

## 3. Used Types
- **DTOs**: `RecipeDTO`, `PaginationMetadata`, `RecipeListResponseDTO`
- **Command Models**: None (GET request)

## 4. Response Details
- Success Response (200 OK):
  ```json
  {
    "recipes": [
      {
        "id": "uuid",
        "title": "string",
        "content": "string",
        "update_counter": "number",
        "created_at": "ISO8601",
        "updated_at": "ISO8601"
      }
    ],
    "pagination": {
      "current_page": "number",
      "total_pages": "number",
      "total_count": "number",
      "limit": "number"
    }
  }
  ```
- Error Responses:
  - 400 Bad Request: Invalid query parameters
  - 401 Unauthorized: Missing or invalid authentication
  - 500 Internal Server Error: Server-side errors

## 5. Data Flow
1. Client sends GET request with optional query parameters
2. Astro middleware uses DEFAULT_USER_ID from supabase.client.ts
3. Endpoint handler validates query parameters using Zod schema
4. Handler calls recipe service method with validated params and user ID
5. Service queries Supabase database with RLS policies ensuring user isolation
6. Database returns filtered, paginated results (excluding soft-deleted recipes)
7. Service calculates pagination metadata
8. Handler returns formatted response with recipes and pagination info

## 6. Security Considerations
- Authentication is enforced via Supabase JWT tokens; unauthenticated requests return 401
- Authorization relies on PostgreSQL RLS policies that restrict access to user's own recipes
- Input validation prevents malicious query parameters; Zod schemas ensure type safety and constraints
- Parameterized queries in Supabase client prevent SQL injection
- No sensitive data (user_id, deleted_at) is exposed in responses
- Rate limiting (100 requests/minute per user) should be considered for production deployment

## 7. Error Handling
- **400 Bad Request**: Returned for invalid query parameters (e.g., page < 1, limit > 100, search too long). Include detailed validation error messages in response.
- **401 Unauthorized**: Returned when authentication token is missing, invalid, or expired.
- **500 Internal Server Error**: Returned for database connection failures, unexpected service errors, or other server-side issues. Log errors for debugging without exposing sensitive information.
- Use consistent error response format with `ErrorResponseDTO` structure.
- Implement early returns for validation failures to avoid deep nesting.
- Log errors using Astro's logger for monitoring and debugging.

## 8. Performance Considerations
- Database queries use indexes on (user_id, created_at) for efficient ordering and pagination
- Offset-based pagination may become slow for large datasets; consider cursor-based pagination in future iterations
- Search functionality uses ILIKE for case-insensitive matching; ensure proper indexing on title column
- Limit maximum limit to 100 to prevent excessive data transfer
- Cache frequently accessed data if performance issues arise
- Monitor query performance and consider query optimization if response times exceed acceptable thresholds

## 9. Implementation Steps
1. Create Zod validation schema for query parameters in `src/lib/validation/recipe.validation.ts`
2. Extend `src/lib/services/recipe.service.ts` with `getUserRecipes` method that:
   - Accepts `RecipeListQueryParams` and `userId`
   - Builds Supabase query with filters, ordering, and pagination
   - Excludes soft-deleted recipes (where deleted_at IS NULL)
   - Calculates total count for pagination metadata
   - Returns `RecipeListResponseDTO`
3. Update `src/pages/api/recipes.ts` endpoint handler:
   - Set `export const prerender = false`
   - Extract and validate query parameters using Zod
   - Use DEFAULT_USER_ID from supabase.client.ts
   - Call recipe service method
   - Return 200 response with data or appropriate error status
4. Add error logging in the endpoint handler for 500 errors
5. Test the endpoint with various parameter combinations and edge cases
6. Update API documentation if needed
