# API Endpoint Implementation Plan: GET /api/dietary-preferences

## 1. Endpoint Overview
This endpoint retrieves the authenticated user's dietary preferences, including their diet type and forbidden ingredients. It returns a combined view of preferences from both the `dietary_preferences` and `forbidden_ingredients` tables.

## 2. Request Details
- **HTTP Method:** GET
- **URL Structure:** `/api/dietary-preferences`
- **Headers:**
  - `Authorization: Bearer <jwt_token>` (Required)
- **Parameters:** None
- **Request Body:** None

## 3. Used Types
```typescript
// Response DTO
interface DietaryPreferencesDTO {
  id: string;
  diet_type: DietType;
  forbidden_ingredients: string[];
  version: number;
  created_at: string;
  updated_at: string;
}

// Database Entities
type DietaryPreferencesEntity = Tables<'dietary_preferences'>;
type ForbiddenIngredientsEntity = Tables<'forbidden_ingredients'>;

// Error Response
interface ErrorResponseDTO {
  error: {
    message: string;
    code?: string;
    details?: ValidationError[];
  };
  timestamp: string;
}
```

## 4. Data Flow
1. **Request Handling:**
   - Validate authentication token (Supabase Auth)
   - Astro middleware uses DEFAULT_USER_ID from supabase.client.ts

2. **Service Layer:**
   ```typescript
   // src/lib/services/dietary-preferences.service.ts
   class DietaryPreferencesService {
     async getUserPreferences(supabase: SupabaseClient, userId: string): Promise<DietaryPreferencesDTO>
   }
   ```

3. **Database Operations:**
   - Query dietary_preferences table for user's preferences
   - Query forbidden_ingredients table for associated ingredients
   - Combine results into DTO

4. **Response Flow:**
   - Transform database results to DTO
   - Return response with the appropriate status code

## 5. Security Considerations
1. **Authentication:**
   - Astro middleware uses DEFAULT_USER_ID from supabase.client.ts
   - Validate JWT token
   - Use RLS policies for data access

2. **Data Protection:**
   - Sanitize database results
   - Implement rate limiting
   - Use HTTPS for all communications

## 6. Error Handling
1. **Authentication Errors (401):**
   ```typescript
   {
     error: {
       message: "Authentication required",
       code: "AUTH_REQUIRED"
     },
     timestamp: "2025-10-16T10:00:00Z"
   }
   ```

2. **Not Found (404):**
   ```typescript
   {
     error: {
       message: "Dietary preferences not found",
       code: "PREFERENCES_NOT_FOUND"
     },
     timestamp: "2025-10-16T10:00:00Z"
   }
   ```

3. **Server Error (500):**
   ```typescript
   {
     error: {
       message: "Internal server error",
       code: "INTERNAL_ERROR"
     },
     timestamp: "2025-10-16T10:00:00Z"
   }
   ```

## 7. Performance Considerations
1. **Database Optimization:**
   - Use a single query with JOIN for preferences and ingredients
   - Implement proper indexing on user_id and dietary_preferences_id
   - Cache frequently accessed preferences

2. **Response Optimization:**
   - Implement HTTP caching headers
   - Use compression for responses
   - Consider implementing ETags

## 8. Implementation Steps

### 1. Create Service Layer
```typescript
// src/lib/services/dietary-preferences.service.ts
export class DietaryPreferencesService {
  async getUserPreferences(supabase: SupabaseClient, userId: string): Promise<DietaryPreferencesDTO>;
}
```

### 2. Create API Endpoint
```typescript
// src/pages/api/dietary-preferences.ts
export const prerender = false;

export async function GET({ request, locals }) {
  // Implementation
}
```

### 3. Create Validation Schema
```typescript
// src/lib/validation/dietary-preferences.validation.ts
import { z } from 'zod';

export const dietaryPreferencesResponseSchema = z.object({
  // Schema definition
});
```

### 4. Implementation Order:
1. Set up basic endpoint structure
2. Implement authentication middleware
3. Create a service layer with database queries
4. Add error handling and validation
5. Implement response transformation
6. Add security headers and rate limiting
7. Write tests
8. Add logging
9. Implement caching
10. Performance testing and optimization

### 5. Testing Requirements:
- Unit tests for service layer
- Integration tests for database queries
- API endpoint tests
- Authentication tests
- Error handling tests
- Performance tests

### 6. Documentation:
- Update API documentation
- Add JSDoc comments
- Update Swagger/OpenAPI specs
- Document error codes and responses
