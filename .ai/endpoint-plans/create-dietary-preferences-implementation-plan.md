# API Endpoint Implementation Plan: POST /api/dietary-preferences

## 1. Endpoint Overview

This endpoint creates dietary preferences for the currently authenticated user. It accepts a diet type and a list of forbidden ingredients, storing them across two related database tables (`dietary_preferences` and `forbidden_ingredients`) in an atomic transaction. The endpoint ensures data integrity by preventing duplicate preferences for the same user and validates all inputs according to business rules.

## 2. Request Details

- **HTTP Method:** POST
- **URL Structure:** `/api/dietary-preferences`
- **Authentication:** Required (JWT Bearer token)
- **Content-Type:** `application/json`

### Parameters:
- **Required:**
  - `diet_type`: enum value ("vegan", "vegetarian", "none")
  - `forbidden_ingredients`: array of strings (max 100 items)
- **Optional:** None

### Request Body:
```json
{
  "diet_type": "vegan|vegetarian|none",
  "forbidden_ingredients": ["string"]
}
```

## 3. Used Types

### Input Types:
- `CreateDietaryPreferencesCommand` - Request payload validation
- `DietType` - Enum for diet type validation

### Output Types:
- `DietaryPreferencesDTO` - Response payload
- `ErrorResponseDTO` - Error response structure
- `ValidationError` - Validation error details

### Database Types:
- `DietaryPreferencesInsert` - Database insert type
- `ForbiddenIngredientsInsert` - Database insert type for ingredients

## 4. Response Details

### Success Response (201 Created):
```json
{
  "id": "uuid",
  "diet_type": "vegan|vegetarian|none",
  "forbidden_ingredients": ["string"],
  "version": 1,
  "created_at": "ISO8601",
  "updated_at": "ISO8601"
}
```

### Error Responses:
- **400 Bad Request:** Invalid input data or validation errors
- **401 Unauthorized:** Missing or invalid authentication token
- **409 Conflict:** Dietary preferences already exist for user
- **500 Internal Server Error:** Database or server errors

## 5. Data Flow

1. **Request Validation:**
   - Astro middleware uses DEFAULT_USER_ID from supabase.client.ts
   - Validate request body against Zod schema
   - Check business rules (max 100 forbidden ingredients)

2. **Business Logic Check:**
   - Verify a user doesn't already have dietary preferences
   - Sanitize forbidden ingredients (trim, lowercase)

3. **Database Operations:**
   - Begin transaction
   - Insert into `dietary_preferences` table
   - Insert forbidden ingredients into `forbidden_ingredients` table
   - Commit transaction

4. **Response Generation:**
   - Fetch complete dietary preferences data
   - Transform to DTO format
   - Return 201 Created with data

## 6. Security Considerations

### Authentication & Authorization:
- uses DEFAULT_USER_ID from supabase.client.ts for this MVP

### Input Validation:
- Zod schema validation for type safety
- Input sanitization to prevent XSS attacks
- Array length validation (max 100 ingredients)
- String length validation for ingredient names

### Data Protection:
- Parameterized queries prevent SQL injection
- CORS configuration for authorized domains
- Request size limits (max 1MB)

### Rate Limiting:
- 100 requests per minute per user
- Additional protection against abuse

## 7. Error Handling

### Validation Errors (400):
- Invalid `diet_type` value
- Missing required fields
- Forbidden ingredients array too large (>100 items)
- Invalid ingredient format (empty strings, non-string values)

### Business Logic Errors (409):
- Dietary preferences already exist for user
- Duplicate ingredient names in request

### Authentication Errors (401):
- Missing Authorization header
- Invalid or expired JWT token
- Token signature verification failure

### Database Errors (500):
- Connection failures
- Transaction rollback scenarios
- Constraint violations
- Unexpected database errors

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
- Use database transactions for atomicity
- Batch insert forbidden ingredients
- Leverage existing indexes on `user_id`

### Caching Strategy:
- No caching for write operations
- Consider caching user preferences after creation

### Monitoring:
- Log endpoint performance metrics
- Monitor transaction success/failure rates
- Track validation error patterns

## 9. Implementation Steps

### Step 1: Create Zod Validation Schema
- Define validation schema in `src/lib/validation/dietary-preferences.validation.ts`
- Include diet type enum validation
- Add forbidden ingredients array validation with size limits
- Implement ingredient string format validation

### Step 2: Implement the Service Layer
- Create `DietaryPreferencesService` in `src/lib/services/dietary-preferences.service.ts`
- Implement `createDietaryPreferences` method
- Add database transaction handling
- Include business logic for duplicate checking

### Step 3: Create API Endpoint
- Implement POST handler in `src/pages/api/dietary-preferences.ts`
- Add authentication middleware integration
- Implement request validation using Zod schema
- Add error handling and response formatting

### Step 4: Database Operations
- Implement atomic transaction for both tables
- Add proper error handling for constraint violations
- Ensure RLS policies are properly applied

### Step 5: Error Handling Implementation
- Create consistent error response formatting
- Implement proper HTTP status code mapping
- Add comprehensive error logging

### Step 6: Security Implementation
- Verify authentication middleware integration
- Implement input sanitization
- Add rate limiting configuration
- Validate CORS settings

### Step 7: Testing & Validation
- Unit tests for validation schemas
- Integration tests for service layer
- End-to-end API tests
- Security penetration testing

### Step 8: Documentation & Monitoring
- Add API documentation
- Implement performance monitoring
- Set up error tracking and alerting
- Create operational runbooks

## 10. Additional Considerations

### Data Consistency:
- Ensure atomic operations using database transactions
- Implement proper rollback mechanisms
- Handle concurrent request scenarios

### Maintenance:
- Implement comprehensive logging
- Add health check endpoints
- Create monitoring dashboards
- Establish backup and recovery procedures
