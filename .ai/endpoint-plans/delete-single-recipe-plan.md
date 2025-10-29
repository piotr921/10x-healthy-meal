# API Endpoint Implementation Plan: Delete Recipe

## 1. Endpoint Overview

This endpoint implements a soft delete operation for a recipe resource. Rather than permanently removing the recipe from the database, it sets the `deleted_at` timestamp to mark the recipe as deleted. This approach preserves data integrity, maintains audit trails, and allows for potential future recovery features.

**Key characteristics:**
- RESTful DELETE operation on a single resource
- Requires authentication via Supabase Auth
- Implements authorization check (user can only delete their own recipes)
- Idempotent operation (already-deleted recipes return 404)
- Returns simple success message on successful deletion

## 2. Request Details

- **HTTP Method:** DELETE
- **URL Structure:** `/api/recipes/{id}`
- **Parameters:**
  - **Required:**
    - `id` (path parameter): UUID string representing the recipe to delete
  - **Optional:** None
- **Request Body:** None
- **Headers:**
  - `Authorization: Bearer <jwt_token>` (required, handled by Supabase Auth middleware)

**Example Request:**
```
DELETE /api/recipes/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 3. Used Types

**From `src/types.ts`:**

```typescript
// Response Type
SuccessResponseDTO {
  message: string;
  timestamp?: string;
}

// Entity Type (for database operations)
RecipeEntity {
  id: string;
  user_id: string;
  title: string;
  content: string;
  update_counter: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}
```

**Validation Schema (to be created in `src/lib/validation/uuid.validation.ts`):**

```typescript
// UUID validation schema
const uuidSchema = z.string().uuid({ message: "Invalid recipe ID format" });
```

**No Command Model required** (DELETE operation has no request body)

## 4. Response Details

### Success Response (200 OK)

```json
{
  "message": "Recipe deleted successfully"
}
```

### Error Responses

**400 Bad Request** (Invalid UUID):
```json
{
  "error": {
    "message": "Invalid recipe ID format",
    "code": "INVALID_UUID"
  },
  "timestamp": "2025-10-29T10:30:00.000Z"
}
```

**401 Unauthorized** (Not authenticated):
```json
{
  "error": {
    "message": "Authentication required",
    "code": "UNAUTHORIZED"
  },
  "timestamp": "2025-10-29T10:30:00.000Z"
}
```

**404 Not Found** (Recipe doesn't exist, already deleted, or belongs to another user):
```json
{
  "error": {
    "message": "Recipe not found",
    "code": "RECIPE_NOT_FOUND"
  },
  "timestamp": "2025-10-29T10:30:00.000Z"
}
```

**500 Internal Server Error** (Database or server error):
```json
{
  "error": {
    "message": "An unexpected error occurred",
    "code": "INTERNAL_ERROR"
  },
  "timestamp": "2025-10-29T10:30:00.000Z"
}
```

## 5. Data Flow

```
1. Client sends DELETE request with recipe ID in URL
   ↓
2. Astro middleware uses DEFAULT_USER_ID from supabase.client.ts
   ↓
3. API endpoint handler extracts user ID from auth context
   ↓
4. Validate recipe ID parameter (UUID format)
   ↓
5. Call recipe.service.softDeleteRecipe(recipeId, userId)
   ↓
6. Service queries database:
   - Check if recipe exists
   - Check if recipe belongs to authenticated user
   - Check if recipe is not already deleted (deleted_at IS NULL)
   ↓
7. If all checks pass: UPDATE recipes SET deleted_at = NOW() WHERE id = recipeId
   ↓
8. Return success response with 200 status code
```

**Database Query Flow:**

```sql
-- Service layer executes this query through Supabase client
UPDATE recipes
SET 
  deleted_at = NOW(),
  updated_at = NOW()
WHERE 
  id = $1 
  AND user_id = $2 
  AND deleted_at IS NULL
RETURNING id;
```

**Important:** The query combines existence check, ownership verification, and deletion check in a single atomic operation. If the query returns no rows, the recipe either doesn't exist, belongs to another user, or is already deleted.

## 6. Security Considerations

### Authentication
- **Requirement:** User must be authenticated via Supabase Auth
- **Implementation:** JWT token validation handled by Astro middleware
- **Failure Response:** 401 Unauthorized if token is missing, invalid, or expired

### Authorization
- **Requirement:** User can only delete their own recipes
- **Implementation:** Include `user_id` in WHERE clause of UPDATE query
- **Security Pattern:** Return 404 (not 403) to prevent resource enumeration attacks
  - Attackers cannot determine if a recipe ID exists but belongs to someone else
  - Consistent response for non-existent and unauthorized resources

### Input Validation
- **UUID Validation:** Use Zod schema to validate UUID format before database query
- **SQL Injection Prevention:** Supabase client uses parameterized queries automatically
- **Path Traversal:** UUID validation prevents path traversal attempts

### Data Isolation
- **RLS Policies:** Leverage PostgreSQL Row-Level Security policies already enabled
- **User Context:** All queries are scoped to authenticated user via `auth.uid()`
- **Soft Delete Verification:** Ensure deleted recipes are excluded from future queries

### Rate Limiting
- **Recommendation:** Implement rate limiting at API gateway or middleware level
- **Suggested Limit:** 100 requests per minute per user (as per API plan)
- **Purpose:** Prevent abuse and DoS attacks

## 7. Error Handling

### Error Scenarios and Handling Strategy

| Error Scenario | Status Code | Response Message | Handling Strategy |
|---------------|-------------|------------------|-------------------|
| Invalid UUID format | 400 | "Invalid recipe ID format" | Validate with Zod early in handler |
| Missing auth token | 401 | "Authentication required" | Handled by middleware |
| Invalid/expired token | 401 | "Authentication required" | Handled by middleware |
| Recipe not found | 404 | "Recipe not found" | Query returns 0 rows |
| Recipe already deleted | 404 | "Recipe not found" | Treat as not found (idempotent) |
| Unauthorized access | 404 | "Recipe not found" | Don't reveal existence |
| Database connection error | 500 | "An unexpected error occurred" | Log error, return generic message |
| Unexpected server error | 500 | "An unexpected error occurred" | Log error, return generic message |

### Error Response Structure

All errors follow the `ErrorResponseDTO` type:

```typescript
{
  error: {
    message: string;      // User-friendly error message
    code?: string;        // Machine-readable error code
    details?: ValidationError[];  // Optional validation details
  };
  timestamp: string;      // ISO8601 timestamp
}
```

### Logging Strategy

**Server-side logging (not exposed to client):**
- Invalid UUID attempts: `console.warn`
- Recipe not found: `console.info` (could be legitimate)
- Authorization failures: `console.warn` (potential security issue)
- Database errors: `console.error` (requires investigation)

**Log format:**
```typescript
console.error('[DELETE /api/recipes/:id]', {
  recipeId,
  userId,
  error: error.message,
  timestamp: new Date().toISOString()
});
```

## 8. Performance Considerations

### Database Performance
- **Indexed Query:** The query uses indexed columns (`id`, `user_id`)
- **Single Query:** Combines existence, ownership, and deletion checks in one UPDATE
- **No Cascading Deletes:** Soft delete doesn't trigger cascading operations
- **Expected Response Time:** < 50ms for indexed query

### Optimizations
1. **Composite Index:** The existing `INDEX(user_id, created_at)` helps, but consider adding `INDEX(id, user_id, deleted_at)` if delete operations become frequent
2. **Connection Pooling:** Leverage Supabase connection pooling for concurrent requests
3. **No N+1 Queries:** Single atomic UPDATE operation

### Potential Bottlenecks
- **Database Connection:** If connection pool is exhausted under high load
- **Network Latency:** Communication with Supabase (mitigated by regional deployment)
- **JWT Validation:** Token validation overhead (acceptable for security)

### Caching Considerations
- **No Caching:** DELETE operations should not be cached
- **Cache Invalidation:** If implementing caching elsewhere, ensure deleted recipes are removed from cache

## 9. Implementation Steps

### Step 1: Validate UUID Format
**File:** `src/lib/validation/uuid.validation.ts`

**Action:** Create or update UUID validation schema

```typescript
import { z } from 'zod';

export const uuidParamSchema = z.object({
  id: z.string().uuid({ message: "Invalid recipe ID format" })
});

export type UuidParam = z.infer<typeof uuidParamSchema>;
```

### Step 2: Add Service Method
**File:** `src/lib/services/recipe.service.ts`

**Action:** Add `softDeleteRecipe` method to existing service

```typescript
/**
 * Soft deletes a recipe by setting deleted_at timestamp
 * @param recipeId - UUID of recipe to delete
 * @param userId - UUID of authenticated user
 * @returns true if recipe was deleted, false if not found
 * @throws Error if database operation fails
 */
export async function softDeleteRecipe(
  supabase: SupabaseClient,
  recipeId: string,
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('recipes')
    .update({ 
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', recipeId)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .select('id')
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows returned (expected for not found)
    throw error;
  }

  return data !== null;
}
```

### Step 3: Create API Endpoint Handler
**File:** `src/pages/api/recipes/[id].ts`

**Action:** Implement DELETE handler (may need to add to existing file)

```typescript
import type { APIRoute } from 'astro';
import { uuidParamSchema } from '../../../lib/validation/uuid.validation';
import { softDeleteRecipe } from '../../../lib/services/recipe.service';
import type { SuccessResponseDTO, ErrorResponseDTO } from '../../../types';

export const prerender = false;

export const DELETE: APIRoute = async ({ params, locals }) => {
  // Guard: Check authentication
  const session = await locals.supabase.auth.getSession();
  if (!session.data.session) {
    const errorResponse: ErrorResponseDTO = {
      error: {
        message: 'Authentication required',
        code: 'UNAUTHORIZED'
      },
      timestamp: new Date().toISOString()
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Guard: Validate UUID format
  const validation = uuidParamSchema.safeParse(params);
  if (!validation.success) {
    const errorResponse: ErrorResponseDTO = {
      error: {
        message: 'Invalid recipe ID format',
        code: 'INVALID_UUID',
        details: validation.error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message
        }))
      },
      timestamp: new Date().toISOString()
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const { id: recipeId } = validation.data;
  const userId = session.data.session.user.id;

  try {
    // Call service to soft delete recipe
    const deleted = await softDeleteRecipe(locals.supabase, recipeId, userId);

    // Guard: Handle not found
    if (!deleted) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          message: 'Recipe not found',
          code: 'RECIPE_NOT_FOUND'
        },
        timestamp: new Date().toISOString()
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Happy path: Return success
    const successResponse: SuccessResponseDTO = {
      message: 'Recipe deleted successfully'
    };
    return new Response(JSON.stringify(successResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    // Log error for debugging
    console.error('[DELETE /api/recipes/:id] Database error:', {
      recipeId,
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });

    // Return generic error response
    const errorResponse: ErrorResponseDTO = {
      error: {
        message: 'An unexpected error occurred',
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
```

### Step 4: Update Existing Query Filters
**Files:** `src/lib/services/recipe.service.ts` and related query functions

**Action:** Ensure all existing recipe queries exclude soft-deleted records

Add `.is('deleted_at', null)` filter to:
- `getRecipes()` (list recipes)
- `getRecipeById()` (single recipe)
- `updateRecipe()` (prevent updating deleted recipes)

Example:
```typescript
.from('recipes')
.select('*')
.eq('user_id', userId)
.is('deleted_at', null)  // Exclude soft-deleted recipes
```

### Step 5: Test the Endpoint

**Manual Testing Checklist:**
- [ ] DELETE with valid recipe ID returns 200
- [ ] DELETE with invalid UUID returns 400
- [ ] DELETE without auth token returns 401
- [ ] DELETE with expired token returns 401
- [ ] DELETE non-existent recipe returns 404
- [ ] DELETE another user's recipe returns 404
- [ ] DELETE already-deleted recipe returns 404
- [ ] Verify deleted recipe is excluded from GET /api/recipes
- [ ] Verify deleted recipe returns 404 on GET /api/recipes/{id}
- [ ] Verify deleted recipe cannot be updated

**Automated Test Cases:**
```typescript
describe('DELETE /api/recipes/:id', () => {
  it('should soft delete a recipe successfully', async () => {
    // Test implementation
  });

  it('should return 400 for invalid UUID', async () => {
    // Test implementation
  });

  it('should return 401 for unauthenticated request', async () => {
    // Test implementation
  });

  it('should return 404 for non-existent recipe', async () => {
    // Test implementation
  });

  it('should return 404 for another user\'s recipe', async () => {
    // Test implementation
  });

  it('should be idempotent (deleting twice returns 404)', async () => {
    // Test implementation
  });
});
```

### Step 6: Update Documentation
**Action:** Document the endpoint behavior

- Update API documentation with delete endpoint details
- Document soft delete behavior for frontend team
- Add JSDoc comments to service methods
- Update any API client libraries or SDKs

---

## Implementation Checklist

- [ ] Create/update UUID validation schema
- [ ] Add `softDeleteRecipe` method to recipe service
- [ ] Implement DELETE handler in `/api/recipes/[id].ts`
- [ ] Update existing queries to exclude soft-deleted recipes
- [ ] Add server-side error logging
- [ ] Write unit tests for service method
- [ ] Write integration tests for endpoint
- [ ] Manual testing of all error scenarios
- [ ] Update API documentation
- [ ] Code review and security audit
- [ ] Deploy to staging environment
- [ ] Production deployment

## Notes for Development Team

1. **Idempotency:** The endpoint is designed to be idempotent. Deleting an already-deleted recipe returns 404, which is the correct behavior for a missing resource.

2. **Security First:** Always return 404 (not 403) when a recipe exists but belongs to another user. This prevents attackers from enumerating valid recipe IDs.

3. **Atomic Operations:** The UPDATE query combines existence check, ownership verification, and deletion in a single atomic operation. This prevents race conditions.

4. **Soft Delete Consistency:** Ensure all recipe queries across the application filter out soft-deleted records using `.is('deleted_at', null)`.

5. **Future Considerations:** If recovery functionality is needed, implement a separate "restore" endpoint that clears the `deleted_at` timestamp.

6. **Performance:** The query is efficient due to existing indexes. Monitor query performance in production and add composite indexes if needed.****
