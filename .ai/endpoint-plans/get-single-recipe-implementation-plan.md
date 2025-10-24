# API Endpoint Implementation Plan: Get Single Recipe by ID

## 1. Endpoint Overview

This endpoint retrieves a specific recipe by its unique identifier (UUID). It allows authenticated users to fetch detailed information about one of their saved recipes. The endpoint enforces user isolation through PostgreSQL Row-Level Security (RLS) policies, ensuring users can only access their own recipes.

**Purpose:** Retrieve a single recipe's complete details including title, content, update history, and timestamps.

**Use Cases:**
- Viewing recipe details on a dedicated recipe page
- Editing an existing recipe (fetching current data)
- Sharing recipe information within the application

## 2. Request Details

- **HTTP Method:** GET
- **URL Structure:** `/api/recipes/{id}`
- **URL Parameters:**
  - **Required:**
    - `id` (UUID) - The unique identifier of the recipe to retrieve
  - **Optional:** None
- **Query Parameters:** None
- **Request Headers:**
  - `Authorization: Bearer <jwt_token>` (Required)
  - `Content-Type: application/json`
- **Request Body:** None (GET request)

### Example Request

```http
GET /api/recipes/123e4567-e89b-12d3-a456-426614174000 HTTP/1.1
Host: api.healthymeal.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 3. Used Types

### Response DTOs

**RecipeDTO** (from `src/types.ts`):
```typescript
type RecipeDTO = {
  id: string;
  title: string;
  content: string;
  update_counter: number;
  created_at: string;
  updated_at: string;
}
```

**ErrorResponseDTO** (from `src/types.ts`):
```typescript
interface ErrorResponseDTO {
  error: {
    message: string;
    code?: string;
    details?: ValidationError[];
  };
  timestamp: string;
}
```

### No Command Models Required
This is a read-only operation, so no command models are needed.

## 4. Response Details

### Success Response (200 OK)

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "title": "Vegan Chocolate Cake",
  "content": "Ingredients:\n- 2 cups flour\n- 1 cup sugar\n...",
  "update_counter": 3,
  "created_at": "2025-10-20T10:30:00.000Z",
  "updated_at": "2025-10-23T14:45:00.000Z"
}
```

### Error Responses

**400 Bad Request** (Invalid UUID format):
```json
{
  "error": {
    "message": "Invalid recipe ID format",
    "code": "INVALID_UUID"
  },
  "timestamp": "2025-10-24T12:00:00.000Z"
}
```

**401 Unauthorized** (Missing or invalid token):
```json
{
  "error": {
    "message": "Unauthorized"
  },
  "timestamp": "2025-10-24T12:00:00.000Z"
}
```

**404 Not Found** (Recipe doesn't exist or belongs to another user):
```json
{
  "error": {
    "message": "Recipe not found"
  },
  "timestamp": "2025-10-24T12:00:00.000Z"
}
```

**500 Internal Server Error** (Database or server error):
```json
{
  "error": {
    "message": "Internal server error"
  },
  "timestamp": "2025-10-24T12:00:00.000Z"
}
```

## 5. Data Flow

### Request Flow

1. **Client Request** → API endpoint with recipe ID in URL path
2. **Astro Middleware** → uses DEFAULT_USER_ID from supabase.client.ts
3. **Input Validation** → Validates UUID format of recipe ID
4. **RecipeService** → Calls `getRecipeById(userId, recipeId)`
5. **Database Query** → Supabase executes SELECT with RLS policies
6. **Response Mapping** → Maps database entity to RecipeDTO
7. **Client Response** → Returns JSON response

### Database Interaction

```sql
-- Executed by RecipeService via Supabase client
SELECT id, title, content, update_counter, created_at, updated_at
FROM recipes
WHERE id = $1 
  AND user_id = $2 
  AND deleted_at IS NULL
LIMIT 1;
```

**RLS Policy Applied:**
```sql
-- Automatically enforced by PostgreSQL
CREATE POLICY select_own_recipes ON recipes
  FOR SELECT USING (user_id = auth.uid());
```

### Service Layer Logic

The `RecipeService.getRecipeById()` method:
1. Queries Supabase with recipe ID and user ID
2. Filters out soft-deleted recipes (`deleted_at IS NULL`)
3. Returns `null` if not found (PGRST116 error code)
4. Throws error for other database errors
5. Maps result to `RecipeDTO` format

## 6. Security Considerations

### Authentication
- **Requirement:** Valid JWT token in Authorization header
- **Validation:** Handled by Astro middleware (`src/middleware/index.ts`)
- **Token Source:** Supabase Auth-issued JWT
- **Session Management:** Tokens stored in HTTP-only cookies

### Authorization
- **User Isolation:** PostgreSQL RLS policies ensure users can only access their own recipes
- **Service Layer:** `RecipeService` passes authenticated user ID to all queries
- **Double Protection:** Both RLS and service-level user_id filtering

### Input Validation
- **UUID Format:** Validate recipe ID is a valid UUID before querying
- **SQL Injection:** Protected via Supabase parameterized queries
- **Path Traversal:** UUID format validation prevents path traversal attempts

### Data Exposure Prevention
- **Sensitive Fields Excluded:** `user_id` and `deleted_at` not included in RecipeDTO
- **Error Messages:** Generic "not found" message (don't reveal if recipe exists for other users)
- **Token Security:** Never log or expose JWT tokens in error messages

### Rate Limiting
- **Global Limit:** 100 requests per minute per user (application-level)
- **Endpoint-Specific:** Consider lower limits for resource-intensive operations
- **Implementation:** Via middleware or API gateway

## 7. Error Handling

### Error Scenarios and Status Codes

| Scenario | Status Code | Error Message | Handling Strategy |
|----------|-------------|---------------|-------------------|
| Missing Authorization header | 401 | "Unauthorized" | Return early from middleware |
| Invalid/expired JWT token | 401 | "Unauthorized" | Handled by Supabase auth |
| Invalid UUID format | 400 | "Invalid recipe ID format" | Validate before database query |
| Recipe not found | 404 | "Recipe not found" | Check for PGRST116 error code |
| Recipe belongs to another user | 404 | "Recipe not found" | RLS returns empty result |
| Recipe is soft-deleted | 404 | "Recipe not found" | Filtered by `deleted_at IS NULL` |
| Database connection error | 500 | "Internal server error" | Log error, return generic message |
| Supabase client unavailable | 500 | "Supabase client not available" | Check locals.supabase exists |
| Unexpected server error | 500 | "Internal server error" | Catch-all error handler |

### Error Response Format

All errors follow the standardized `ErrorResponseDTO` structure:
```typescript
{
  error: {
    message: string,      // User-friendly error message
    code?: string,        // Optional error code for client handling
    details?: Array       // Optional validation details
  },
  timestamp: string       // ISO 8601 timestamp
}
```

### Error Logging Strategy

- **Console Logging:** Use `console.error()` for all errors with context
- **Log Format:** `"Error fetching recipe:", error`
- **Sensitive Data:** Never log JWT tokens, user passwords, or PII
- **Production:** Consider integration with error tracking service (e.g., Sentry)

### Guard Clauses

Implement early returns for error conditions:
1. Check Supabase client availability
2. Validate user authentication
3. Validate UUID format
4. Check service response for null
5. Handle database errors

## 8. Performance Considerations

### Database Performance

**Query Optimization:**
- Recipe retrieval uses primary key lookup (O(log n) with B-tree index)
- `user_id` and `deleted_at` filters use indexed columns
- Single query operation (no joins required)

**Index Usage:**
```sql
-- Primary key index (automatic)
CREATE INDEX ON recipes(id);

-- User and timestamp index for user-scoped queries
CREATE INDEX idx_recipes_user_created ON recipes(user_id, created_at);
```

### Caching Strategy

**Client-Side:**
- Cache recipe data in browser for 5 minutes
- Invalidate cache on recipe updates
- Use ETags for conditional requests (future enhancement)

**Server-Side:**
- No server-side caching in MVP (Supabase handles query optimization)
- Consider Redis caching for frequently accessed recipes (future)

### Response Size

- Average recipe: ~2-10 KB (text content)
- Maximum recipe: ~50 KB (50,000 character limit)
- Minimal overhead: No nested objects or arrays in response

### Bottlenecks

**Identified:**
- Database round-trip latency (10-50ms typical)
- JWT validation overhead (5-10ms)

**Mitigation:**
- Connection pooling (handled by Supabase)
- Middleware optimization (reuse Supabase client)
- Geographic proximity (deploy close to database)

### Monitoring Metrics

- Response time (p50, p95, p99)
- Error rate by status code
- Database query duration
- Authentication failures

## 9. Implementation Steps

### Step 1: Create API Route File
**File:** `src/pages/api/recipes/[id].ts`

Create new Astro API route with proper exports:
```typescript
export const prerender = false;
export const GET: APIRoute = async ({ params, locals }) => { ... }
```

### Step 2: Implement Request Validation

1. Validate UUID format using regex or validation library
2. Use DEFAULT_USER_ID from supabase.client.ts

**UUID Validation Pattern:**
```typescript
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
```

### Step 3: Integrate RecipeService

1. Import `RecipeService` from `src/lib/services/recipe.service.ts`
2. Instantiate service with Supabase client: `new RecipeService(supabase)`
3. Call `getRecipeById(user.id, recipeId)` method
4. Handle null return value (recipe not found)

### Step 4: Implement Response Mapping

1. Check if service returns null → return 404 error
2. Map service result to RecipeDTO format (already correct format)
3. Serialize to JSON with proper Content-Type header
4. Return 200 OK status code

### Step 5: Add Error Handling

Wrap entire handler in try-catch block:
1. Catch authentication errors → 401 response
2. Catch validation errors → 400 response
3. Catch not found errors → 404 response
4. Catch all other errors → 500 response
5. Log all errors to console with context

### Step 6: Add Type Safety

1. Import required types from `src/types.ts`:
   - `RecipeDTO`
   - `ErrorResponseDTO`
2. Import `APIRoute` type from `astro`
3. Ensure all response objects conform to DTOs

### Step 7: Test Error Scenarios

Create test cases for:
- Missing authentication token
- Invalid recipe ID format (not UUID)
- Recipe ID that doesn't exist
- Recipe ID belonging to another user
- Soft-deleted recipe
- Database connection failure

### Step 8: Verify RLS Policies

Confirm that:
- `recipes` table has RLS enabled
- `select_own_recipes` policy exists and is active
- Policy correctly filters by `user_id = auth.uid()`
- Policy excludes soft-deleted recipes

### Step 9: Add Documentation Comments

Add JSDoc comments explaining:
- Endpoint purpose and behavior
- Authentication requirements
- Expected response formats
- Error scenarios

### Step 10: Integration Testing

Test endpoint with:
- Valid recipe ID (owned by authenticated user)
- Valid recipe ID (owned by different user) → should return 404
- Invalid UUID format
- Missing authentication
- Soft-deleted recipe

### Implementation Checklist

- [ ] Create API route file with proper structure
- [ ] Implement authentication check via middleware
- [ ] Validate UUID format of recipe ID
- [ ] Integrate with RecipeService
- [ ] Implement proper error handling with status codes
- [ ] Add structured error responses
- [ ] Ensure RecipeDTO excludes sensitive fields
- [ ] Test all error scenarios
- [ ] Verify RLS policies are enforced
- [ ] Add logging for debugging
- [ ] Document endpoint behavior
- [ ] Performance test with realistic data

## 10. Code Structure Template

```typescript
// src/pages/api/recipes/[id].ts
import type { APIRoute } from 'astro';
import { RecipeService } from '@/lib/services/recipe.service';
import type { ErrorResponseDTO, RecipeDTO } from '@/types';

export const prerender = false;

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // 1. Validate Supabase client
    // 2. Authenticate user
    // 3. Validate recipe ID format
    // 4. Call RecipeService
    // 5. Handle not found case
    // 6. Return success response
  } catch (error) {
    // Handle errors with appropriate status codes
  }
};
```

## 11. Dependencies

### Existing Services
- `RecipeService` (src/lib/services/recipe.service.ts)
  - Method: `getRecipeById(userId: string, recipeId: string)`

### Existing Types
- `RecipeDTO` (src/types.ts)
- `ErrorResponseDTO` (src/types.ts)
- `SupabaseClient` (src/db/supabase.client.ts)

### Middleware
- Astro middleware (src/middleware/index.ts)
  - Provides authenticated Supabase client in `locals.supabase`

### Database
- `recipes` table with RLS policies
- Required indexes on `id`, `user_id`, `deleted_at`

## 12. Future Enhancements

- **ETags:** Implement conditional requests to reduce bandwidth
- **Caching:** Add Redis caching for frequently accessed recipes
- **Versioning:** Track recipe version history
- **Metrics:** Add detailed performance monitoring
- **Rate Limiting:** Implement per-endpoint rate limits
- **Field Selection:** Allow clients to specify which fields to return
- **Related Data:** Option to include user's dietary preferences in response

