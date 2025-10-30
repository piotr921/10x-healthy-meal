# API Endpoint Implementation Plan: Update Recipe

## 1. Endpoint Overview

This endpoint updates an existing recipe for the authenticated user. It accepts the recipe ID as a URL parameter and the updated title and content in the request body. The endpoint validates ownership, checks for title conflicts with other recipes, increments the update counter, and returns the updated recipe data.

## 2. Request Details

- **HTTP Method:** PUT
- **URL Structure:** `/api/recipes/{id}`
- **Parameters:**
  - **Required:** 
    - `id` (URL parameter): UUID of the recipe to update
    - `title` (body): String, 1-200 characters, non-empty after trim
    - `content` (body): String, 1-10,000 characters, non-empty after trim
  - **Optional:** None
- **Request Body:**
```json
{
  "title": "string",
  "content": "string"
}
```
- **Headers:**
  - `Authorization`: Bearer token (managed by Supabase Auth)
  - `Content-Type`: application/json

## 3. Used Types

**Existing Types (from `src/types.ts`):**
- `UpdateRecipeCommand`: Command object for update operation
  ```typescript
  type UpdateRecipeCommand = Pick<RecipeUpdate, 'title' | 'content'>
  ```
- `RecipeDTO`: Response data transfer object
  ```typescript
  type RecipeDTO = Omit<RecipeEntity, 'user_id' | 'deleted_at'>
  ```

**Validation Schemas (to be added to `src/lib/validation/recipe.validation.ts`):**
- `UpdateRecipeCommandSchema`: Zod schema for validating request body (same rules as CreateRecipeCommandSchema)

**Service Method (to be added to `src/lib/services/recipe.service.ts`):**
- `updateRecipe(userId: string, recipeId: string, command: UpdateRecipeCommand): Promise<RecipeDTO>`

## 4. Response Details

**Success Response (200 OK):**
```json
{
  "id": "uuid",
  "title": "string",
  "content": "string",
  "update_counter": number,
  "created_at": "ISO8601",
  "updated_at": "ISO8601"
}
```

**Error Responses:**

- **400 Bad Request:**
```json
{
  "error": "Invalid input",
  "details": [
    {
      "field": "title",
      "message": "Title is required and cannot be empty",
      "code": "invalid_type"
    }
  ]
}
```

- **401 Unauthorized:**
```json
{
  "error": "Unauthorized"
}
```

- **404 Not Found:**
```json
{
  "error": "Recipe not found"
}
```

- **409 Conflict:**
```json
{
  "error": "Recipe with this title already exists"
}
```

- **500 Internal Server Error:**
```json
{
  "error": "Internal server error"
}
```

## 5. Data Flow

1. **Request Reception:** Astro API endpoint receives PUT request at `/api/recipes/[id].ts`
2. **Authentication Check:** Uses DEFAULT_USER_ID from supabase.client.ts
3. **Input Validation:**
   - Validate recipe ID format (UUID)
   - Validate request body using `UpdateRecipeCommandSchema`
4. **Service Layer Processing:**
   - `RecipeService.updateRecipe()` called with userId, recipeId, and validated command
   - Service verifies recipe exists and belongs to user (via `getRecipeById`)
   - Service checks for duplicate title (excluding current recipe)
   - Service updates recipe with new data:
     - Set `title` and `content`
     - Increment `update_counter`
     - Update `updated_at` timestamp (automatic via database default)
5. **Database Update:** Supabase executes UPDATE query on recipes table
6. **Response Transformation:** Convert `RecipeEntity` to `RecipeDTO`
7. **Response Delivery:** Return 200 OK with updated recipe data

## 6. Security Considerations

### Authentication
- Enforce authentication via Astro middleware checking `context.locals.supabase.auth.getUser()`
- Return 401 if user is not authenticated
- Extract `userId` from authenticated session

### Authorization
- Verify recipe ownership by querying with both `id` AND `user_id`
- Return 404 if recipe doesn't exist OR belongs to different user (prevents information disclosure)
- Never expose `user_id` in response (handled by RecipeDTO type)

### Input Validation
- Validate UUID format for recipe ID to prevent injection
- Sanitize and trim title/content inputs
- Enforce length limits to prevent DoS via large payloads
- Use Zod for type-safe validation

### Database Security
- Use parameterized queries (handled by Supabase client)
- Check for soft-deleted recipes (`deleted_at IS NULL`)
- Enforce unique constraint on `(user_id, title)` combination

### Rate Limiting
- Consider implementing rate limiting for update operations (future enhancement)

## 7. Error Handling

### Error Scenarios and Responses

| Scenario | Status Code | Response | Logging |
|----------|-------------|----------|---------|
| Missing/invalid authentication | 401 | `{ "error": "Unauthorized" }` | Log authentication failure |
| Invalid UUID format | 400 | `{ "error": "Invalid recipe ID format" }` | Log validation error |
| Missing title or content | 400 | `{ "error": "Invalid input", "details": [...] }` | Log validation error |
| Title/content too long/short | 400 | `{ "error": "Invalid input", "details": [...] }` | Log validation error |
| Recipe not found | 404 | `{ "error": "Recipe not found" }` | Log with userId and recipeId |
| Recipe belongs to different user | 404 | `{ "error": "Recipe not found" }` | Log authorization attempt |
| Duplicate title (409 conflict) | 409 | `{ "error": "Recipe with this title already exists" }` | Log conflict |
| Database connection error | 500 | `{ "error": "Internal server error" }` | Log full error details |
| Unexpected error | 500 | `{ "error": "Internal server error" }` | Log full error stack |

### Error Handling Pattern

```typescript
try {
  // Validation
  // Service call
  // Return success
} catch (error) {
  if (error.message === 'DUPLICATE_TITLE') {
    return new Response(JSON.stringify({ error: 'Recipe with this title already exists' }), {
      status: 409,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  if (error.message === 'NOT_FOUND') {
    return new Response(JSON.stringify({ error: 'Recipe not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  console.error('Error updating recipe:', error);
  return new Response(JSON.stringify({ error: 'Internal server error' }), {
    status: 500,
    headers: { 'Content-Type': 'application/json' }
  });
}
```

## 8. Performance Considerations

### Potential Bottlenecks
- Database query to check for duplicate titles
- Database query to verify recipe ownership
- Network latency to Supabase

### Optimization Strategies
1. **Single Query Approach:** Combine ownership check and update into a single query with conditional update
2. **Indexing:** Ensure proper indexes exist:
   - Primary key index on `recipes.id` (exists by default)
   - Unique index on `(user_id, title)` (specified in schema)
   - Index on `user_id` for faster filtering (should exist due to foreign key)
3. **Query Optimization:**
   - Use `.select()` only for needed fields
   - Use `.single()` to retrieve one record
4. **Caching:** Consider caching strategy for frequently accessed recipes (future enhancement)
5. **Soft Delete Filter:** Ensure `deleted_at IS NULL` uses index efficiently

### Expected Performance
- Target response time: < 200ms for successful updates
- Database queries: 2-3 (auth check, duplicate check, update)

## 9. Implementation Steps

### Step 1: Add Validation Schema
**File:** `src/lib/validation/recipe.validation.ts`
- Add `UpdateRecipeCommandSchema` (can reuse `CreateRecipeCommandSchema` since validation rules are identical)
- Export the schema for use in API endpoint

### Step 2: Extend Recipe Service
**File:** `src/lib/services/recipe.service.ts`
- Add `updateRecipe(userId: string, recipeId: string, command: UpdateRecipeCommand): Promise<RecipeDTO>` method
- Implement logic:
  1. Check if recipe exists and belongs to user using existing `getRecipeById()` method
  2. If not found, throw 'NOT_FOUND' error
  3. Check for duplicate title (excluding current recipe) with modified `checkForDuplicateTitle()` that accepts optional `excludeId` parameter
  4. Update recipe using Supabase client with `.update()` method
  5. Increment `update_counter` in the update operation
  6. Return updated recipe as `RecipeDTO`
- Handle Supabase unique constraint violation error codes
- Transform result to DTO using existing `transformToDTO()` private method

### Step 3: Modify Duplicate Title Check
**File:** `src/lib/services/recipe.service.ts`
- Update private method `checkForDuplicateTitle()` signature to accept optional `excludeId` parameter
- Modify query to exclude the current recipe when checking for duplicates:
  ```typescript
  .neq('id', excludeId) // Add this condition when excludeId is provided
  ```

### Step 4: Create API Endpoint File
**File:** `src/pages/api/recipes/[id].ts`
- Add `export const prerender = false` for SSR
- Implement PUT handler function
- Extract recipe ID from URL params: `context.params.id`
- Get authenticated user from `context.locals.supabase.auth.getUser()`
- Return 401 if not authenticated
- Parse and validate request body using `UpdateRecipeCommandSchema`
- Return 400 with formatted errors if validation fails
- Validate recipe ID is a valid UUID using existing `UUIDSchema` from `src/lib/validation/uuid.validation.ts`
- Instantiate `RecipeService` with `context.locals.supabase`
- Call `recipeService.updateRecipe(userId, recipeId, validatedCommand)`
- Handle service errors and return appropriate status codes
- Return 200 with updated recipe DTO on success

### Step 5: Test Error Scenarios
- Test with invalid UUID format
- Test with missing authentication
- Test with non-existent recipe ID
- Test with recipe belonging to different user
- Test with duplicate title
- Test with invalid title/content (too long, too short, empty)
- Test successful update

### Step 6: Test Success Scenario
- Create a recipe
- Update it with valid data
- Verify `update_counter` increments
- Verify `updated_at` timestamp updates
- Verify response matches expected DTO structure

### Step 7: Validate Security
- Verify users cannot update other users' recipes
- Verify soft-deleted recipes cannot be updated
- Verify authentication is enforced
- Test with edge cases (empty strings after trim, special characters)

### Step 8: Document Endpoint
- Add endpoint documentation to project API documentation
- Include example requests and responses
- Document error codes and scenarios

