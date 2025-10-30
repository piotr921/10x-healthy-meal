# API Endpoint Implementation Plan: Create Recipe

## 1. Endpoint Overview

The Create Recipe endpoint allows authenticated users to create new recipes in their personal collection. This endpoint accepts a recipe title and content, validates the input, checks for duplicate titles within the user's recipes, and stores the new recipe in the database. The endpoint follows REST principles and returns the created recipe with a 201 status code upon successful creation.

## 2. Request Details

- **HTTP Method:** POST
- **URL Structure:** `/api/recipes`
- **Authentication:** Required (JWT Bearer token)
- **Content-Type:** `application/json`

### Parameters:
- **Required:** 
  - `title` (string): Recipe title, 1-200 characters
  - `content` (string): Recipe content, 1-10,000 characters
- **Optional:** None

### Request Body:
```json
{
  "title": "string",
  "content": "string"
}
```

## 3. Used Types

### Command Models:
- `CreateRecipeCommand` - Request validation and transformation
- `RecipeInsert` - Database insertion model

### DTOs:
- `RecipeDTO` - Response model (excludes user_id, deleted_at)
- `ErrorResponseDTO` - Error response structure

### Database Types:
- `RecipeEntity` - Full database entity model
- User context from Supabase Auth (`auth.uid()`)

## 4. Response Details

### Success Response (201 Created):
```json
{
  "id": "uuid",
  "title": "string", 
  "content": "string",
  "update_counter": 1,
  "created_at": "ISO8601",
  "updated_at": "ISO8601"
}
```

### Error Responses:
- **400 Bad Request:** Invalid input, missing fields, validation errors
- **401 Unauthorized:** Missing or invalid authentication token
- **409 Conflict:** Recipe with the same title already exists for user
- **500 Internal Server Error:** Database or server errors

## 5. Data Flow

1. **Request Reception:** Astro API route receives POST request
2. **Authentication:** Middleware validates JWT token and extracts user ID
3. **Input Validation:** Zod schema validates request body structure and constraints
4. **Business Logic:** RecipeService handles duplicate checking and creation logic
5. **Database Operation:** Supabase client inserts recipe with RLS policy enforcement
6. **Response Formation:** Transform a database result to RecipeDTO format
7. **Response Delivery:** Return 201 Created with recipe data

### Database Interaction:
- Insert into `recipes` table with `user_id` from auth context
- Leverage unique constraint on `(user_id, title)` for duplicate detection
- Use RLS policies to ensure data isolation between users

## 6. Security Considerations

### Authentication & Authorization:
- JWT token validation via Supabase Auth middleware
- User context extracted from `auth.uid()` 
- Row-Level Security (RLS) policies ensure users can only create recipes for themselves

### Input Validation & Sanitization:
- Zod schema validation for type safety and constraints
- Input sanitization to prevent XSS attacks
- Content length limits to prevent abuse (10KB max)

### Rate Limiting:
- Implement 100 requests per minute per user limit
- Consider additional protection against recipe spam

### Data Protection:
- Parameterized queries to prevent SQL injection
- HTTPS-only communication
- No sensitive data exposure in error messages

## 7. Error Handling

### Validation Errors (400):
- Missing title or content fields
- Title length < 1 or > 200 characters
- Content length < 1 or > 10,000 characters
- Invalid JSON structure
- Non-string values for title/content

### Authentication Errors (401):
- Missing Authorization header
- Invalid JWT token format
- Expired JWT token
- Revoked JWT token

### Conflict Errors (409):
- Recipe with an identical title already exists for user
- Detected via unique constraint violation

### Server Errors (500):
- Database connection failures
- Supabase service unavailable
- Unexpected application errors

### Error Response Format:
```json
{
  "error": {
    "message": "string",
    "code": "string",
    "details": [
      {
        "field": "string",
        "message": "string",
        "code": "string"
      }
    ]
  },
  "timestamp": "ISO8601"
}
```

## 8. Performance Considerations

### Database Optimization:
- Leverage existing indexes on `(user_id, title)` and `(user_id, created_at)`
- Use prepared statements for query optimization
- Minimize round trips with a single insert operation

### Caching Strategy:
- No caching needed for creation endpoint
- Consider cache invalidation for user recipe lists

### Resource Management:
- Content size validation prevents oversized payloads
- Connection pooling via Supabase client
- Proper error handling to prevent resource leaks

## 9. Implementation Steps

### 1. Create Recipe Service
- Create `src/lib/services/recipe.service.ts`
- Implement `createRecipe(userId: string, command: CreateRecipeCommand)` method
- Handle duplicate title checking and database insertion
- Include proper error handling and logging

### 2. Set up Validation Schema
- Create Zod schema for `CreateRecipeCommand` validation
- Validate title length (1-200 characters)
- Validate content length (1-10,000 characters)
- Ensure both fields are non-empty strings

### 3. Implement API Route
- Create `src/pages/api/recipes.ts` with `export const prerender = false`
- Implement POST handler function
- Extract user ID from `context.locals.supabase.auth.getUser()`
- Validate request body using Zod schema
- Call RecipeService for business logic
- Transform response to RecipeDTO format

### 4. Error Handling Implementation
- Implement comprehensive error catching
- Map database constraint violations to appropriate HTTP status codes
- Create consistent error response formatting
- Add request/error logging for debugging

### 5. Security Implementation
- Verify JWT token extraction in the middleware
- Implement rate limiting middleware
- Add input sanitization for XSS prevention
- Test RLS policy enforcement

### 6. Testing Setup
- Unit tests for RecipeService methods
- Integration tests for API endpoint
- Test all error scenarios (400, 401, 409, 500)
- Test authentication and authorization flows
- Validate response format and status codes

### 7. Documentation and Validation
- Update API documentation
- Test endpoint with various payloads
- Verify error responses match specification
- Validate security measures are working
- Performance testing under load

### 8. Integration with Frontend
- Ensure response format matches frontend expectations
- Test the end-to-end recipe creation flow
- Validate error handling in UI components
- Test authentication integration
