# REST API Plan

## 1. Resources

The API exposes the following main resources mapped to database entities:

- **Users** - Corresponds to `users` table (managed by Supabase Auth)
- **Dietary Preferences** - Corresponds to `dietary_preferences` and `forbidden_ingredients` tables
- **Recipes** - Corresponds to `recipes` table
- **Recipe Analysis** - Virtual resource for AI-powered recipe modification

## 2. Endpoints

### 2.1 Dietary Preferences

#### Get User's Dietary Preferences
- **HTTP Method:** GET
- **URL Path:** `/api/dietary-preferences`
- **Description:** Retrieve the current user's dietary preferences including diet type and forbidden ingredients
- **Authentication:** Required
- **Query Parameters:** None
- **Request Payload:** None
- **Response Payload:**
```json
{
  "id": "uuid",
  "diet_type": "vegan|vegetarian|none",
  "forbidden_ingredients": ["string"],
  "version": "number",
  "created_at": "ISO8601",
  "updated_at": "ISO8601"
}
```
- **Success Codes:** 200 OK
- **Error Codes:** 
  - 401 Unauthorized
  - 404 Not Found (if preferences not set yet)

#### Create Dietary Preferences for User
- **HTTP Method:** POST
- **URL Path:** `/api/users/{userId}/dietary-preferences`
- **Description:** Create dietary preferences for a specific user
- **Authentication:** Required
- **Query Parameters:** None
- **Request Payload:**
```json
{
  "diet_type": "vegan|vegetarian|none",
  "forbidden_ingredients": ["string"]
}
```
- **Response Payload:**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "diet_type": "vegan|vegetarian|none",
  "forbidden_ingredients": ["string"],
  "version": 1,
  "created_at": "ISO8601",
  "updated_at": "ISO8601"
}
```
- **Success Codes:** 201 Created
- **Error Codes:**
  - 400 Bad Request (invalid diet_type, validation errors, or preferences already exist for user)
  - 401 Unauthorized
  - 403 Forbidden (cannot create preferences for other users)
  - 404 Not Found (user does not exist)
  - 409 Conflict (dietary preferences already exist for this user)

#### Update User's Dietary Preferences
- **HTTP Method:** PUT
- **URL Path:** `/api/dietary-preferences`
- **Description:** Create or update the current user's dietary preferences
- **Authentication:** Required
- **Query Parameters:** None
- **Request Payload:**
```json
{
  "diet_type": "vegan|vegetarian|none",
  "forbidden_ingredients": ["string"]
}
```
- **Response Payload:**
```json
{
  "id": "uuid",
  "diet_type": "vegan|vegetarian|none",
  "forbidden_ingredients": ["string"],
  "version": "number",
  "created_at": "ISO8601",
  "updated_at": "ISO8601"
}
```
- **Success Codes:** 200 OK (update), 201 Created (new preferences)
- **Error Codes:**
  - 400 Bad Request (invalid diet_type or validation errors)
  - 401 Unauthorized

### 2.2 Recipes

#### Get User's Recipes
- **HTTP Method:** GET
- **URL Path:** `/api/recipes`
- **Description:** Retrieve a paginated list of the current user's recipes, ordered chronologically (newest first)
- **Authentication:** Required
- **Query Parameters:**
  - `page` (optional, default: 1) - Page number for pagination
  - `limit` (optional, default: 20, max: 100) - Number of recipes per page
  - `search` (optional) - Search term for recipe titles
- **Request Payload:** None
- **Response Payload:**
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
- **Success Codes:** 200 OK
- **Error Codes:**
  - 400 Bad Request (invalid pagination parameters)
  - 401 Unauthorized

#### Get Single Recipe
- **HTTP Method:** GET
- **URL Path:** `/api/recipes/{id}`
- **Description:** Retrieve a specific recipe by ID
- **Authentication:** Required
- **Query Parameters:** None
- **Request Payload:** None
- **Response Payload:**
```json
{
  "id": "uuid",
  "title": "string",
  "content": "string",
  "update_counter": "number",
  "created_at": "ISO8601",
  "updated_at": "ISO8601"
}
```
- **Success Codes:** 200 OK
- **Error Codes:**
  - 401 Unauthorized
  - 404 Not Found

#### Create Recipe
- **HTTP Method:** POST
- **URL Path:** `/api/recipes`
- **Description:** Create a new recipe for the current user
- **Authentication:** Required
- **Query Parameters:** None
- **Request Payload:**
```json
{
  "title": "string",
  "content": "string"
}
```
- **Response Payload:**
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
- **Success Codes:** 201 Created
- **Error Codes:**
  - 400 Bad Request (missing title or content, duplicate title)
  - 401 Unauthorized
  - 409 Conflict (recipe with same title already exists)

#### Update Recipe
- **HTTP Method:** PUT
- **URL Path:** `/api/recipes/{id}`
- **Description:** Update an existing recipe
- **Authentication:** Required
- **Query Parameters:** None
- **Request Payload:**
```json
{
  "title": "string",
  "content": "string"
}
```
- **Response Payload:**
```json
{
  "id": "uuid",
  "title": "string",
  "content": "string",
  "update_counter": "number",
  "created_at": "ISO8601",
  "updated_at": "ISO8601"
}
```
- **Success Codes:** 200 OK
- **Error Codes:**
  - 400 Bad Request (missing title or content)
  - 401 Unauthorized
  - 404 Not Found
  - 409 Conflict (recipe with same title already exists)

#### Delete Recipe
- **HTTP Method:** DELETE
- **URL Path:** `/api/recipes/{id}`
- **Description:** Soft delete a recipe (sets deleted_at timestamp)
- **Authentication:** Required
- **Query Parameters:** None
- **Request Payload:** None
- **Response Payload:**
```json
{
  "message": "Recipe deleted successfully"
}
```
- **Success Codes:** 200 OK
- **Error Codes:**
  - 401 Unauthorized
  - 404 Not Found

### 2.3 Recipe Analysis (AI)

#### Analyze Recipe
- **HTTP Method:** POST
- **URL Path:** `/api/recipes/analyze`
- **Description:** Analyze a recipe text and return AI-generated modifications based on user's dietary preferences
- **Authentication:** Required
- **Query Parameters:** None
- **Request Payload:**
```json
{
  "title": "string",
  "content": "string"
}
```
- **Response Payload:**
```json
{
  "original_recipe": {
    "title": "string",
    "content": "string"
  },
  "suggested_modifications": {
    "title": "string",
    "content": "string",
    "changes": [
      {
        "type": "ingredient_substitution|instruction_modification",
        "original": "string",
        "suggested": "string",
        "reason": "string"
      }
    ]
  },
  "unmet_constraints": [
    {
      "type": "forbidden_ingredient|diet_restriction",
      "description": "string",
      "ingredient": "string"
    }
  ],
  "can_fully_adapt": "boolean"
}
```
- **Success Codes:** 200 OK
- **Error Codes:**
  - 400 Bad Request (missing title or content, AI disabled)
  - 401 Unauthorized
  - 404 Not Found (dietary preferences not set)
  - 503 Service Unavailable (AI service error)

### 2.4 Health Check

#### API Health Check
- **HTTP Method:** GET
- **URL Path:** `/api/health`
- **Description:** Check API health status
- **Authentication:** Not required
- **Query Parameters:** None
- **Request Payload:** None
- **Response Payload:**
```json
{
  "status": "healthy",
  "timestamp": "ISO8601",
  "version": "string"
}
```
- **Success Codes:** 200 OK

## 3. Authentication and Authorization

### Authentication Mechanism
- **Provider:** Supabase Auth
- **Method:** JWT (JSON Web Tokens) via Authorization header
- **Header Format:** `Authorization: Bearer <jwt_token>`

### Implementation Details
- All API endpoints (except `/api/health`) require authentication
- JWT tokens are issued and managed by Supabase Auth
- Token validation is handled by Supabase middleware
- User context is extracted from `auth.uid()` for RLS policies

### Authorization Rules
- Users can only access their own data (enforced by PostgreSQL RLS policies)
- No admin or elevated permissions in MVP
- All data operations are scoped to the authenticated user

## 4. Validation and Business Logic

### 4.1 Validation Conditions

#### User Data Validation
- Email format validation (standard email regex)
- Email uniqueness (enforced by database constraint)
- Password strength requirements (handled by Supabase Auth)

#### Dietary Preferences Validation
- `diet_type` must be one of: "vegan", "vegetarian", "none"
- `forbidden_ingredients` must be an array of non-empty strings
- Maximum 100 forbidden ingredients per user

#### Recipe Validation
- `title` is required and must be 1-200 characters
- `content` is required and must be 10-50,000 characters
- Recipe title must be unique per user
- Recipe content must contain recognizable recipe structure

### 4.2 Business Logic Implementation

#### Recipe Creation with AI Integration
1. Validate recipe input
2. If AI is enabled and dietary preferences exist:
   - Call `/api/recipes/analyze` first
   - Present suggestions to user
   - User can accept/reject modifications
3. Save final recipe (original or modified)
4. Increment `update_counter` on modifications

#### Dietary Preferences Management
- Automatically increment `version` on updates
- Cascade delete forbidden ingredients when preferences are deleted
- Validate diet type against enum constraints

#### Recipe Soft Delete
- Set `deleted_at` timestamp instead of hard delete
- Exclude soft-deleted recipes from list/search results
- Maintain referential integrity

#### AI Analysis Logic
1. Parse recipe content to identify ingredients and instructions
2. Check ingredients against forbidden list
3. Check compatibility with selected diet type
4. Generate substitution suggestions
5. Provide clear feedback on unmet constraints
6. Return structured modification suggestions

#### Pagination and Performance
- Default page size: 20 recipes
- Maximum page size: 100 recipes
- Sort by `created_at DESC` (newest first)
- Use offset-based pagination for simplicity

#### Error Handling
- Consistent error response format across all endpoints
- Detailed validation error messages
- Proper HTTP status codes
- Logging for debugging and monitoring

### 4.3 Rate Limiting and Security
- Rate limiting: 100 requests per minute per user
- Input sanitization to prevent XSS and injection attacks
- CORS configuration for frontend domain
- Request size limits (max 1MB for recipe content)
- SQL injection protection via parameterized queries
