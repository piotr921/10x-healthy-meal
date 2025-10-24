**Plan Version:** 1.0  
**Created:** 2025-10-24  
**Target Endpoint:** PUT /api/dietary-preferences
# API Endpoint Implementation Plan: Update User's Dietary Preferences

## 1. Endpoint Overview

This endpoint allows authenticated users to create or update their dietary preferences. It manages both the `dietary_preferences` table and associated `forbidden_ingredients` records in a single atomic operation. The endpoint uses an upsert pattern - creating new preferences if none exist, or updating existing ones while incrementing the version number.

**Key Characteristics:**
- Idempotent operation (can be called multiple times safely)
- Atomic transaction handling (preferences + ingredients)
- Version tracking for optimistic concurrency control
- One-to-many relationship management (preferences to ingredients)

## 2. Request Details

- **HTTP Method:** PUT
- **URL Structure:** `/api/dietary-preferences`
- **Authentication:** Required (validated via Astro middleware)
- **Parameters:**
  - **Required:** None in URL
  - **Optional:** None
- **Request Body:**
```json
{
  "diet_type": "vegan" | "vegetarian" | "none",
  "forbidden_ingredients": ["string", "string", ...]
}
```

**Body Constraints:**
- `diet_type`: Must be one of the three enum values
- `forbidden_ingredients`: Array of strings (can be empty array)
  - Each ingredient must be non-empty string
  - Trimmed whitespace
  - Maximum reasonable length (e.g., 100 characters per ingredient)

## 3. Used Types

**From types.ts:**

```typescript
// Input validation
UpdateDietaryPreferencesCommand {
  diet_type: DietType;
  forbidden_ingredients: string[];
}

// Response
DietaryPreferencesDTO {
  id: string;
  diet_type: DietType;
  forbidden_ingredients: string[];
  version: number;
  created_at: string;
  updated_at: string;
}

// Enums
DietType = 'vegan' | 'vegetarian' | 'none'

// Error handling
ErrorResponseDTO {
  error: {
    message: string;
    code?: string;
    details?: ValidationError[];
  };
  timestamp: string;
}

ValidationError {
  field: string;
  message: string;
  code?: string;
}
```

## 4. Response Details

### Success Responses

**201 Created** - New dietary preferences created
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "diet_type": "vegan",
  "forbidden_ingredients": ["dairy", "eggs", "honey"],
  "version": 1,
  "created_at": "2025-10-24T10:30:00.000Z",
  "updated_at": "2025-10-24T10:30:00.000Z"
}
```

**200 OK** - Existing dietary preferences updated
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "diet_type": "vegetarian",
  "forbidden_ingredients": ["meat", "fish"],
  "version": 3,
  "created_at": "2025-10-20T08:15:00.000Z",
  "updated_at": "2025-10-24T10:30:00.000Z"
}
```

### Error Responses

**400 Bad Request** - Validation errors
```json
{
  "error": {
    "message": "Invalid input data",
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "field": "diet_type",
        "message": "Must be one of: vegan, vegetarian, none",
        "code": "INVALID_ENUM"
      }
    ]
  },
  "timestamp": "2025-10-24T10:30:00.000Z"
}
```

**401 Unauthorized** - No authentication
```json
{
  "error": {
    "message": "Authentication required",
    "code": "UNAUTHORIZED"
  },
  "timestamp": "2025-10-24T10:30:00.000Z"
}
```

**500 Internal Server Error** - Server issues
```json
{
  "error": {
    "message": "An unexpected error occurred",
    "code": "INTERNAL_ERROR"
  },
  "timestamp": "2025-10-24T10:30:00.000Z"
}
```

## 5. Data Flow

### High-Level Flow
1. **Request Reception**: Astro endpoint receives PUT request
2. **Authentication Check**: Uses DEFAULT_USER_ID from supabase.client.ts
3. **Input Validation**: Zod schema validates request body
4. **User Identification**: Extract user_id from context.locals.supabase
5. **Service Call**: Invoke dietary preferences service with user_id and command
6. **Database Operations** (within service):
   - Check if preferences exist for a user
   - Start database transaction
   - If exists: 
     - Update dietary_preferences record (increment version)
     - Delete existing forbidden_ingredients records
     - Insert new forbidden_ingredients records
   - If not exists:
     - Insert dietary_preferences record (version = 1)
     - Insert forbidden_ingredients records
   - Commit transaction
7. **Response Construction**: Build DietaryPreferencesDTO from database results
8. **Status Code Selection**: Return 201 for new, 200 for update
9. **Response Delivery**: Send JSON response to client

### Database Transaction Details

```
BEGIN TRANSACTION;

-- Check existence
SELECT id, version FROM dietary_preferences WHERE user_id = $1;

-- Path A: Update existing
IF EXISTS THEN
  UPDATE dietary_preferences 
  SET diet_type = $2, version = version + 1, updated_at = NOW()
  WHERE user_id = $1
  RETURNING *;
  
  DELETE FROM forbidden_ingredients 
  WHERE dietary_preferences_id = $3;
  
  INSERT INTO forbidden_ingredients (dietary_preferences_id, ingredient_name)
  VALUES ($3, $4), ($3, $5), ... ;
  
-- Path B: Create new
ELSE
  INSERT INTO dietary_preferences (user_id, diet_type, version)
  VALUES ($1, $2, 1)
  RETURNING *;
  
  INSERT INTO forbidden_ingredients (dietary_preferences_id, ingredient_name)
  VALUES ($3, $4), ($3, $5), ... ;
END IF;

COMMIT;
```

### Service Layer Responsibilities
- Abstract database complexity from endpoint handler
- Manage transaction lifecycle
- Transform database entities to DTOs
- Handle database-specific errors
- Ensure data consistency

## 6. Security Considerations

### Authentication & Authorization
- **Session Validation**: User must have valid Supabase session (enforced by middleware)
- **User Isolation**: Each user can only modify their own preferences
  - User ID extracted from authenticated session (context.locals.supabase.auth.getUser())
  - Never accept user_id from request body or query params
- **Token Verification**: Supabase client validates JWT tokens automatically

### Input Validation & Sanitization
- **Type Safety**: Zod schema enforces correct data types
- **Enum Validation**: diet_type strictly validated against allowed values
- **String Sanitization**: 
  - Trim whitespace from ingredient names
  - Reject empty strings
  - Limit maximum length (prevent storage abuse)
  - Consider rejecting special characters if not needed
- **Array Validation**: Ensure forbidden_ingredients is array (prevent prototype pollution)
- **SQL Injection Prevention**: Supabase client uses parameterized queries

### Data Integrity
- **Transaction Safety**: All operations wrapped in database transaction
- **Referential Integrity**: Foreign key constraints enforced by database
- **Cascade Deletes**: Forbidden ingredients deleted when preferences deleted (ON DELETE CASCADE)
- **Version Control**: Version field helps detect concurrent modifications

### Rate Limiting Considerations
- Consider implementing rate limiting for this endpoint (e.g., max 10 updates per minute per user)
- Prevents abuse and protects database resources

## 7. Error Handling

### Client Errors (4xx)

| Scenario | Status Code | Error Code | Response Message | Details |
|----------|-------------|------------|------------------|---------|
| No authentication token | 401 | UNAUTHORIZED | "Authentication required" | User not logged in |
| Invalid JSON body | 400 | INVALID_JSON | "Request body must be valid JSON" | Malformed JSON |
| Missing diet_type | 400 | VALIDATION_ERROR | "Invalid input data" | Field: diet_type, Message: Required |
| Invalid diet_type value | 400 | VALIDATION_ERROR | "Invalid input data" | Field: diet_type, Message: Must be vegan/vegetarian/none |
| Missing forbidden_ingredients | 400 | VALIDATION_ERROR | "Invalid input data" | Field: forbidden_ingredients, Message: Required |
| forbidden_ingredients not array | 400 | VALIDATION_ERROR | "Invalid input data" | Field: forbidden_ingredients, Message: Must be array |
| Empty ingredient string | 400 | VALIDATION_ERROR | "Invalid input data" | Field: forbidden_ingredients[0], Message: Cannot be empty |
| Ingredient too long | 400 | VALIDATION_ERROR | "Invalid input data" | Field: forbidden_ingredients[0], Message: Max 100 characters |

### Server Errors (5xx)

| Scenario | Status Code | Error Code | Response Message | Logging Action |
|----------|-------------|------------|------------------|----------------|
| Database connection failure | 500 | DATABASE_ERROR | "An unexpected error occurred" | Log full error with stack trace |
| Transaction failure | 500 | TRANSACTION_ERROR | "An unexpected error occurred" | Log transaction details |
| Supabase client error | 500 | SERVICE_ERROR | "An unexpected error occurred" | Log Supabase error response |
| Unexpected exception | 500 | INTERNAL_ERROR | "An unexpected error occurred" | Log full error with context |

### Error Handling Strategy

**In Endpoint Handler:**
1. Wrap all operations in try-catch block
2. Handle authentication errors first (early return)
3. Validate input with Zod - catch ZodError specifically
4. Call service method within try block
5. Transform service errors to appropriate HTTP responses
6. Never expose internal error details to client
7. Always include timestamp in error responses

**In Service Layer:**
1. Use guard clauses for preconditions
2. Wrap database operations in try-catch
3. Throw custom errors with meaningful codes
4. Let transaction rollback on error
5. Log errors before re-throwing
6. Include context in error messages (for logging, not client)

**Example Error Handler Structure:**
```typescript
try {
  // Validate input
  const validated = schema.parse(body);
  
  // Call service
  const result = await service.upsertPreferences(userId, validated);
  
  // Return success
  return new Response(JSON.stringify(result), { status: result.isNew ? 201 : 200 });
  
} catch (error) {
  if (error instanceof ZodError) {
    return new Response(JSON.stringify({
      error: {
        message: "Invalid input data",
        code: "VALIDATION_ERROR",
        details: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      },
      timestamp: new Date().toISOString()
    }), { status: 400 });
  }
  
  console.error('Unexpected error:', error);
  return new Response(JSON.stringify({
    error: {
      message: "An unexpected error occurred",
      code: "INTERNAL_ERROR"
    },
    timestamp: new Date().toISOString()
  }), { status: 500 });
}
```

## 8. Performance Considerations

### Potential Bottlenecks
1. **Multiple DB Round Trips**: Checking existence + update/insert + ingredients operations
2. **Ingredient Array Size**: Large arrays of forbidden ingredients increase processing time
3. **Transaction Lock Duration**: Long-running transactions block other operations
4. **Index Usage**: Queries on user_id must use index efficiently

### Optimization Strategies

**Database Level:**
- Ensure index exists on `dietary_preferences.user_id` (should be UNIQUE index)
- Ensure index exists on `forbidden_ingredients.dietary_preferences_id`
- Use batch insert for forbidden ingredients instead of multiple single inserts
- Consider stored procedure for entire upsert operation (reduces round trips)
- Keep transactions as short as possible

**Application Level:**
- Validate input before database calls (fail fast)
- Limit maximum array size for forbidden_ingredients (e.g., max 50 items)
- Use connection pooling (Supabase handles this)
- Consider caching user preferences for read-heavy scenarios (if applicable later)

**Network Level:**
- Keep response payload lean (DietaryPreferencesDTO is already minimal)
- Use compression for response body
- Consider CDN for static assets (not applicable here)

### Expected Performance Characteristics
- **Target Response Time**: < 200ms for typical request
- **Database Queries**: 1 SELECT + 1 UPDATE/INSERT + 1 DELETE + 1 BATCH INSERT = ~4 queries in transaction
- **Payload Size**: Typical response ~500 bytes (small)
- **Concurrency**: Handle 100+ concurrent requests per second

## 9. Implementation Steps

### Step 1: Update Validation Schema
**File:** `src/lib/validation/dietary-preferences.validation.ts`

```typescript
import { z } from 'zod';

export const updateDietaryPreferencesSchema = z.object({
  diet_type: z.enum(['vegan', 'vegetarian', 'none'], {
    errorMap: () => ({ message: 'Must be one of: vegan, vegetarian, none' })
  }),
  forbidden_ingredients: z.array(
    z.string()
      .trim()
      .min(1, 'Ingredient name cannot be empty')
      .max(100, 'Ingredient name cannot exceed 100 characters')
  ).default([])
});
```

**Validation:**
- Check that schema exports correctly
- Verify error messages are user-friendly
- Test with various invalid inputs

### Step 2: Create/Update Service Method
**File:** `src/lib/services/dietary-preferences.service.ts`

Create or update the service with:
```typescript
async upsertDietaryPreferences(
  supabase: SupabaseClient,
  userId: string,
  command: UpdateDietaryPreferencesCommand
): Promise<{ data: DietaryPreferencesDTO; isNew: boolean }>
```

**Implementation details:**
- Check if preferences exist for user
- Use Supabase RPC or transaction handling
- Handle both create and update paths
- Delete old forbidden_ingredients before inserting new ones
- Return combined DTO with ingredients array
- Include isNew flag to determine status code

**Error handling:**
- Throw specific errors for database failures
- Ensure transaction rollback on error
- Log errors with context

### Step 3: Create API Endpoint Handler
**File:** `src/pages/api/dietary-preferences.ts`

```typescript
export const prerender = false;

import type { APIRoute } from 'astro';
import { updateDietaryPreferencesSchema } from '../../lib/validation/dietary-preferences.validation';
import { upsertDietaryPreferences } from '../../lib/services/dietary-preferences.service';
import type { UpdateDietaryPreferencesCommand, DietaryPreferencesDTO, ErrorResponseDTO } from '../../types';

export const PUT: APIRoute = async (context) => {
  // Implementation here
}
```

**Implementation flow:**
1. Extract supabase client from context.locals
2. Verify user authentication (getUser())
3. Parse and validate request body
4. Call service method
5. Return appropriate response with status code

### Step 4: Test Authentication
- Verify middleware is active for this route
- Test with no token → expect 401
- Test with invalid token → expect 401
- Test with valid token → proceed to validation

### Step 5: Test Input Validation
Test cases:
- Valid input (all enum values)
- Missing diet_type → 400
- Invalid diet_type value → 400
- Missing forbidden_ingredients → should default to empty array
- Non-array forbidden_ingredients → 400
- Empty string in ingredients → 400
- Very long ingredient name → 400
- Empty ingredients array → should succeed
- Malformed JSON → 400

### Step 6: Test Database Operations
Test scenarios:
- Create new preferences (no existing) → 201
- Update existing preferences → 200
- Verify version increments on update
- Verify old ingredients are deleted
- Verify new ingredients are inserted
- Test transaction rollback on error
- Verify timestamps are updated

### Step 7: Test Error Scenarios
- Database connection failure
- Transaction timeout
- Concurrent updates (version conflict)
- Invalid user_id
- Network errors

### Step 8: Integration Testing
- Test complete flow end-to-end
- Use real authentication tokens
- Verify response structure matches DTO
- Test with various payload sizes
- Verify idempotency (same request multiple times)

### Step 9: Performance Testing
- Measure response times
- Test with maximum ingredient array size
- Test concurrent requests
- Monitor database query performance
- Check for N+1 query problems

### Step 10: Documentation and Code Review
- Add JSDoc comments to service methods
- Document any edge cases or assumptions
- Review error handling completeness
- Verify coding standards compliance
- Update API documentation if needed
- Run linter and fix any issues

### Step 11: Security Review
- Verify no user_id can be injected from request
- Confirm SQL injection protection
- Review input sanitization
- Test authorization boundaries
- Check for information leakage in errors

### Step 12: Deployment Checklist
- [ ] All tests passing
- [ ] Linter checks passing
- [ ] Type checking passing
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Monitoring/logging configured
- [ ] Error tracking setup
- [ ] Rate limiting considered
- [ ] Backup strategy in place

---

## Additional Notes

### Database Migration Considerations
If the stored procedure approach is used, create a migration:
```sql
CREATE OR REPLACE FUNCTION upsert_dietary_preferences(
  p_user_id UUID,
  p_diet_type diet_type_enum,
  p_forbidden_ingredients TEXT[]
) RETURNS TABLE (
  id UUID,
  diet_type diet_type_enum,
  version INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
-- Implementation
$$ LANGUAGE plpgsql;
```

### Future Enhancements
- Add support for custom dietary restrictions beyond enum
- Implement version-based optimistic locking
- Add audit logging for preference changes
- Support for allergen information
- Integration with nutrition databases
- Bulk import of forbidden ingredients

### Monitoring & Observability
- Track endpoint latency (p50, p95, p99)
- Monitor error rates by type
- Alert on high failure rates
- Track usage patterns (most common diet types)
- Monitor database transaction times
- Track ingredient array size distribution

---
