# View Implementation Plan: Recipe Detail View

## 1. Overview

The Recipe Detail View displays the complete details of a single recipe, including its title, content (ingredients and instructions), and metadata (creation date, update date, update counter). This view provides users with the ability to view their saved recipe in full detail and take actions such as editing, deleting, or analyzing it with AI. The view is accessible only to authenticated users and enforces recipe ownership through the backend API.

## 2. View Routing

**Primary Path**: `/app/recipes/[id]`

Where `[id]` is the UUID of the recipe to display.

The route should be implemented as an Astro page at `src/pages/app/recipes/[id].astro` with dynamic routing to capture the recipe ID from the URL.

## 3. Component Structure

```
RecipeDetailPage.astro (Astro page)
└── RecipeDetailView.tsx (React component, client:load)
    ├── LoadingState.tsx (conditional - shown during data fetch)
    ├── ErrorState.tsx (conditional - shown on fetch error)
    └── RecipeDetailContent.tsx (conditional - shown when data loaded)
        ├── RecipeHeader.tsx
        │   ├── <h1> Recipe title
        │   └── RecipeMetadata.tsx (dates and update counter)
        ├── RecipeContent.tsx
        │   └── <div> Formatted recipe content
        ├── RecipeActions.tsx
        │   ├── Button (Edit)
        │   ├── Button (Analyze with AI)
        │   └── Button (Delete)
        └── ConfirmDeleteModal.tsx (Shadcn Dialog component)
            ├── DialogContent
            ├── DialogHeader
            ├── DialogDescription
            └── DialogFooter
                ├── Button (Cancel)
                └── Button (Confirm Delete)
```

## 4. Component Details

### RecipeDetailPage.astro
- **Component description**: Astro page component that serves as the entry point for the recipe detail view. It handles route parameters, validates the UUID format, and renders the React component.
- **Main elements**: 
  - AppLayout wrapper
  - UUID validation logic
  - RecipeDetailView React component with client:load directive
- **Handled interactions**: None (delegates to React components)
- **Handled validation**: 
  - Validates recipe ID is provided in params
  - Validates recipe ID is a valid UUID format using `isValidUUID` helper
  - Returns 404 response if validation fails
- **Types**: 
  - Astro.params for route parameters
- **Props**: None (Astro page)

### RecipeDetailView.tsx
- **Component description**: Main React container component that orchestrates the recipe detail view. Fetches recipe data on mount, manages view state (loading, error, success), and coordinates child components.
- **Main elements**:
  - Conditional rendering of LoadingState, ErrorState, or RecipeDetailContent
  - State management for recipe data, modals, and operations
  - useRecipeDetail custom hook integration
- **Handled interactions**:
  - Initial recipe data fetch on mount
  - Edit button click → navigate to edit view
  - Delete button click → open confirmation modal
  - Analyze button click → open AI analysis modal (future)
  - Delete confirmation → execute delete and navigate to list
- **Handled validation**: None (data fetched from API is already validated)
- **Types**: 
  - RecipeDTO (from API response)
  - RecipeDetailViewModel (internal state type)
- **Props**: 
  - `recipeId: string` - UUID of the recipe to display

### LoadingState.tsx
- **Component description**: Displays a skeleton loading state while recipe data is being fetched. Provides visual feedback to users during the loading process.
- **Main elements**:
  - Skeleton placeholders matching the layout of RecipeDetailContent
  - Title skeleton (h1 width)
  - Metadata skeleton (dates)
  - Content skeleton (multiple lines)
  - Action buttons skeleton
- **Handled interactions**: None
- **Handled validation**: None
- **Types**: None
- **Props**: None

### ErrorState.tsx
- **Component description**: Displays error messages when recipe fetch fails. Shows appropriate messaging based on error type (404, network error, server error) and provides recovery options.
- **Main elements**:
  - Error icon or illustration
  - Error heading
  - Error message text
  - Retry button (conditional based on error type)
  - Back to recipes link
- **Handled interactions**:
  - Retry button click → trigger refetch
  - Back to recipes link → navigate to recipe list
- **Handled validation**: None
- **Types**: ErrorStateProps
- **Props**:
  - `error: string` - Error message to display
  - `statusCode?: number` - HTTP status code (optional, for conditional rendering)
  - `onRetry?: () => void` - Callback for retry action (optional)

### RecipeDetailContent.tsx
- **Component description**: Container component for the successfully loaded recipe content. Wraps all display and action components for the recipe.
- **Main elements**:
  - RecipeHeader component
  - RecipeContent component
  - RecipeActions component
  - ConfirmDeleteModal component
- **Handled interactions**:
  - Delegates all interactions to child components
  - Manages delete modal state
- **Handled validation**: None
- **Types**: RecipeDetailContentProps
- **Props**:
  - `recipe: RecipeDTO` - The recipe data to display
  - `onEdit: () => void` - Callback for edit action
  - `onDelete: () => void` - Callback for delete action
  - `onAnalyze: () => void` - Callback for analyze action

### RecipeHeader.tsx
- **Component description**: Displays the recipe title and metadata (creation date, update date, update counter). Uses proper heading hierarchy for accessibility.
- **Main elements**:
  - `<h1>` element for recipe title
  - RecipeMetadata component for dates and counter
- **Handled interactions**: None
- **Handled validation**: None
- **Types**: RecipeHeaderProps
- **Props**:
  - `title: string` - Recipe title
  - `createdAt: string` - ISO8601 timestamp of creation
  - `updatedAt: string` - ISO8601 timestamp of last update
  - `updateCounter: number` - Number of times recipe was updated

### RecipeMetadata.tsx
- **Component description**: Displays formatted metadata for the recipe including creation date, last update date, and update counter.
- **Main elements**:
  - Text elements for "Created" and "Updated" dates
  - Text element for update counter
  - Time elements with datetime attribute for accessibility
- **Handled interactions**: None
- **Handled validation**: None
- **Types**: RecipeMetadataProps (subset of RecipeHeaderProps)
- **Props**:
  - `createdAt: string` - ISO8601 timestamp
  - `updatedAt: string` - ISO8601 timestamp
  - `updateCounter: number` - Update count

### RecipeContent.tsx
- **Component description**: Displays the full recipe content with preserved formatting. Content includes ingredients and instructions as provided by the user.
- **Main elements**:
  - `<div>` container with `white-space: pre-wrap` styling to preserve line breaks and formatting
  - Prose styling from Tailwind for readable text
- **Handled interactions**: None
- **Handled validation**: None
- **Types**: RecipeContentProps
- **Props**:
  - `content: string` - The full recipe text content

### RecipeActions.tsx
- **Component description**: Provides action buttons for recipe operations (edit, analyze, delete). Uses Shadcn Button components with appropriate styling and accessibility.
- **Main elements**:
  - Button component (Edit) - primary style
  - Button component (Analyze with AI) - secondary style
  - Button component (Delete) - destructive style
  - Container div with flexbox for button layout
- **Handled interactions**:
  - Edit button click → triggers onEdit callback
  - Analyze button click → triggers onAnalyze callback
  - Delete button click → triggers onDelete callback
- **Handled validation**: None
- **Types**: RecipeActionsProps
- **Props**:
  - `onEdit: () => void` - Callback when edit is clicked
  - `onAnalyze: () => void` - Callback when analyze is clicked
  - `onDelete: () => void` - Callback when delete is clicked

### ConfirmDeleteModal.tsx
- **Component description**: Modal dialog that confirms recipe deletion before executing the action. Uses Shadcn Dialog component with focus trapping and proper ARIA attributes for accessibility.
- **Main elements**:
  - Dialog component (from Shadcn/ui)
  - DialogContent wrapper
  - DialogHeader with DialogTitle
  - DialogDescription warning message
  - DialogFooter with action buttons
  - Cancel button (secondary)
  - Confirm Delete button (destructive, with loading state)
- **Handled interactions**:
  - Cancel button click → triggers onCancel callback, closes modal
  - Confirm button click → triggers onConfirm callback (async)
  - Escape key or overlay click → triggers onCancel callback
- **Handled validation**: None (confirmation is the validation)
- **Types**: ConfirmDeleteModalProps
- **Props**:
  - `isOpen: boolean` - Controls modal visibility
  - `recipeTitle: string` - Recipe title to display in confirmation message
  - `isDeleting: boolean` - Loading state during delete operation
  - `onConfirm: () => Promise<void>` - Async callback for delete confirmation
  - `onCancel: () => void` - Callback for cancellation

## 5. Types

### Existing Types (from types.ts)

```typescript
// Recipe data transfer object from API
type RecipeDTO = {
  id: string;                    // UUID
  title: string;                 // Recipe title
  content: string;               // Full recipe text (ingredients + instructions)
  update_counter: number;        // Number of times updated
  created_at: string;            // ISO8601 timestamp
  updated_at: string;            // ISO8601 timestamp
}

// Error response from API
interface ErrorResponseDTO {
  error: {
    message: string;
    code?: string;
    details?: ValidationError[];
  };
  timestamp: string;
}
```

### New Types for View Implementation

```typescript
// Main view state model
interface RecipeDetailViewModel {
  recipe: RecipeDTO | null;      // Recipe data, null during loading or on error
  isLoading: boolean;            // True during initial fetch
  error: string | null;          // Error message if fetch failed
}

// Props for RecipeDetailView component
interface RecipeDetailViewProps {
  recipeId: string;              // UUID of recipe to display
}

// Props for RecipeDetailContent component
interface RecipeDetailContentProps {
  recipe: RecipeDTO;             // Recipe data to display
  onEdit: () => void;            // Callback for edit action
  onDelete: () => void;          // Callback for delete action
  onAnalyze: () => void;         // Callback for AI analyze action
}

// Props for RecipeHeader component
interface RecipeHeaderProps {
  title: string;                 // Recipe title
  createdAt: string;             // ISO8601 creation timestamp
  updatedAt: string;             // ISO8601 update timestamp
  updateCounter: number;         // Number of updates
}

// Props for RecipeMetadata component
interface RecipeMetadataProps {
  createdAt: string;             // ISO8601 creation timestamp
  updatedAt: string;             // ISO8601 update timestamp
  updateCounter: number;         // Number of updates
}

// Props for RecipeContent component
interface RecipeContentProps {
  content: string;               // Full recipe text content
}

// Props for RecipeActions component
interface RecipeActionsProps {
  onEdit: () => void;            // Callback for edit button
  onAnalyze: () => void;         // Callback for analyze button
  onDelete: () => void;          // Callback for delete button
}

// Props for ConfirmDeleteModal component
interface ConfirmDeleteModalProps {
  isOpen: boolean;               // Modal visibility state
  recipeTitle: string;           // Recipe title for confirmation message
  isDeleting: boolean;           // Loading state during deletion
  onConfirm: () => Promise<void>; // Async delete confirmation handler
  onCancel: () => void;          // Cancel/close handler
}

// Props for ErrorState component
interface ErrorStateProps {
  error: string;                 // Error message to display
  statusCode?: number;           // Optional HTTP status code
  onRetry?: () => void;          // Optional retry callback
}

// Return type for useRecipeDetail custom hook
interface UseRecipeDetailReturn {
  recipe: RecipeDTO | null;      // Fetched recipe data
  isLoading: boolean;            // Loading state
  error: string | null;          // Error message
  deleteRecipe: () => Promise<void>; // Delete function
  isDeleting: boolean;           // Deleting state
  refetch: () => Promise<void>;  // Refetch function for retry
}
```

## 6. State Management

State management for the Recipe Detail View is handled through a custom hook `useRecipeDetail` combined with local component state for UI concerns.

### Custom Hook: useRecipeDetail

**Location**: `src/components/hooks/useRecipeDetail.ts`

**Purpose**: Encapsulates all data fetching and mutation logic for a single recipe, providing a clean interface for components to interact with the API.

**State Variables**:
- `recipe: RecipeDTO | null` - Stores the fetched recipe data
- `isLoading: boolean` - Indicates active fetch operation
- `error: string | null` - Stores error message from failed operations
- `isDeleting: boolean` - Indicates active delete operation

**Provided Functions**:
- `refetch()` - Re-fetches recipe data (used for retry after errors)
- `deleteRecipe()` - Deletes the recipe and handles navigation

**Implementation Details**:
- Uses `useEffect` to fetch recipe data on mount
- Uses `fetch` API to communicate with backend
- Handles all HTTP status codes (200, 404, 401, 500)
- Converts API responses to appropriate error messages
- Uses `AbortController` to cancel fetch on unmount
- Navigates to `/app/recipes` after successful deletion

### Component State

**RecipeDetailView.tsx**:
- Uses `useRecipeDetail` hook for data management
- No additional state needed at this level

**RecipeDetailContent.tsx**:
- `isDeleteModalOpen: boolean` - Controls ConfirmDeleteModal visibility
- Manages modal state locally as it's UI-only concern

### State Flow

1. **Initial Load**:
   - RecipeDetailView mounts with `recipeId` prop
   - useRecipeDetail hook triggers fetch
   - `isLoading = true`, recipe data fetched
   - On success: `recipe` populated, `isLoading = false`
   - On error: `error` set, `isLoading = false`

2. **Delete Operation**:
   - User clicks Delete button
   - RecipeDetailContent sets `isDeleteModalOpen = true`
   - User clicks Confirm in modal
   - useRecipeDetail.deleteRecipe() called
   - `isDeleting = true` during API call
   - On success: Navigate to `/app/recipes`
   - On error: `error` set, `isDeleting = false`, modal remains open

3. **Retry After Error**:
   - User clicks Retry button
   - ErrorState calls useRecipeDetail.refetch()
   - State resets to loading state
   - Fetch process repeats

## 7. API Integration

### Endpoint: GET /api/recipes/{id}

**Purpose**: Fetch single recipe data by ID

**Request**:
- Method: `GET`
- URL: `/api/recipes/${recipeId}`
- Headers: None (cookies handled automatically)
- Body: None

**Response Types**:

**Success (200)**:
```typescript
RecipeDTO {
  id: string;
  title: string;
  content: string;
  update_counter: number;
  created_at: string;
  updated_at: string;
}
```

**Error (4xx/5xx)**:
```typescript
ErrorResponseDTO {
  error: {
    message: string;
    code?: string;
    details?: Array<{
      field: string;
      message: string;
      code?: string;
    }>;
  };
  timestamp: string;
}
```

**Integration in useRecipeDetail hook**:

```typescript
// Fetch implementation
const fetchRecipe = async (recipeId: string): Promise<void> => {
  setIsLoading(true);
  setError(null);
  
  try {
    const response = await fetch(`/api/recipes/${recipeId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      signal: abortController.signal
    });
    
    if (response.ok) {
      const data: RecipeDTO = await response.json();
      setRecipe(data);
    } else if (response.status === 404) {
      setError('Recipe not found');
    } else if (response.status === 401) {
      // Redirect to login
      window.location.href = '/login';
      return;
    } else {
      const errorData: ErrorResponseDTO = await response.json();
      setError(errorData.error.message || 'Failed to load recipe');
    }
  } catch (err) {
    if (err.name !== 'AbortError') {
      setError('Failed to load recipe. Please check your connection.');
    }
  } finally {
    setIsLoading(false);
  }
};
```

### Endpoint: DELETE /api/recipes/{id}

**Purpose**: Delete a recipe by ID

**Request**:
- Method: `DELETE`
- URL: `/api/recipes/${recipeId}`
- Headers: None (cookies handled automatically)
- Body: None

**Response**:
- Success: 204 No Content or 200 with success message
- Error: ErrorResponseDTO (similar to GET)

**Integration in useRecipeDetail hook**:

```typescript
const deleteRecipe = async (): Promise<void> => {
  setIsDeleting(true);
  
  try {
    const response = await fetch(`/api/recipes/${recipeId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      // Navigate to recipe list
      window.location.href = '/app/recipes';
    } else {
      const errorData: ErrorResponseDTO = await response.json();
      setError(errorData.error.message || 'Failed to delete recipe');
      setIsDeleting(false);
    }
  } catch (err) {
    setError('Failed to delete recipe. Please try again.');
    setIsDeleting(false);
  }
};
```

## 8. User Interactions

### 1. Navigating to Recipe Detail View

**User Action**: Click on recipe title in recipe list view  
**System Response**:
- Navigate to `/app/recipes/{id}` using View Transitions API
- Astro page validates UUID format
- RecipeDetailView component mounts
- Display LoadingState skeleton
- Fetch recipe data from API
- Display RecipeDetailContent with recipe data
- Or display ErrorState if fetch fails

### 2. Viewing Recipe Content

**User Action**: Scroll through recipe detail page  
**System Response**:
- Recipe title, metadata, and content remain visible
- Content preserves formatting (line breaks, spacing)
- Action buttons remain accessible at all times

### 3. Editing Recipe

**User Action**: Click "Edit" button  
**System Response**:
- Navigate to edit view (implementation depends on edit view routing)
- Pass recipe ID in URL
- Use View Transitions for smooth navigation

### 4. Analyzing Recipe with AI

**User Action**: Click "Analyze with AI" button  
**System Response**:
- Open AIAnalysisModal component (future implementation)
- Fetch AI analysis from API
- Display original vs modified recipe comparison
- Provide accept/reject options

### 5. Initiating Recipe Deletion

**User Action**: Click "Delete" button  
**System Response**:
- Open ConfirmDeleteModal
- Display recipe title in confirmation message
- Focus trapped in modal
- Keyboard accessible (Tab, Shift+Tab, Escape)

### 6. Confirming Recipe Deletion

**User Action**: Click "Confirm Delete" in modal  
**System Response**:
- Disable Confirm button, show loading spinner
- Call DELETE API endpoint
- On success: 
  - Close modal
  - Navigate to `/app/recipes` list view
  - Optional: Show success toast "Recipe deleted"
- On failure:
  - Keep modal open
  - Display error message
  - Re-enable Confirm button

### 7. Canceling Recipe Deletion

**User Action**: Click "Cancel" button or press Escape or click modal overlay  
**System Response**:
- Close ConfirmDeleteModal
- Return focus to Delete button
- No API call made
- Recipe remains visible

### 8. Retrying After Error

**User Action**: Click "Retry" button on ErrorState  
**System Response**:
- Clear error state
- Show LoadingState
- Re-fetch recipe data
- Display RecipeDetailContent or ErrorState based on result

### 9. Returning to Recipe List

**User Action**: Click "Back to recipes" link (in header or error state)  
**System Response**:
- Navigate to `/app/recipes` list view
- Use View Transitions for smooth navigation

## 9. Conditions and Validation

### Recipe ID Validation

**Condition**: Recipe ID must be a valid UUID format  
**Validation Location**: RecipeDetailPage.astro (Astro page)  
**Validation Method**: 
- Extract `id` from `Astro.params`
- Call `isValidUUID(id)` helper function
- If invalid, return 404 response before rendering React component

**Impact on UI**:
- Invalid UUID: 404 error page displayed, no React component rendered
- Valid UUID: RecipeDetailView component rendered with recipeId prop

### Recipe Existence and Ownership

**Condition**: Recipe must exist and belong to authenticated user  
**Validation Location**: Backend API (enforced by RecipeService)  
**Validation Method**:
- API checks if recipe exists in database
- API verifies recipe.user_id matches authenticated user
- Returns 404 if either condition fails

**Impact on UI**:
- Recipe not found: ErrorState displayed with "Recipe not found" message
- No retry option provided (retry won't resolve issue)
- "Back to recipes" link available

### Authentication Status

**Condition**: User must be authenticated to access view  
**Validation Location**: Middleware (Astro middleware)  
**Validation Method**:
- Middleware checks for valid session
- Redirects to login if not authenticated
- API returns 401 for unauthenticated requests

**Impact on UI**:
- Unauthenticated: Redirect to login page (before view renders)
- 401 response: Redirect to login with return URL

### Network Connectivity

**Condition**: Network connection required to fetch data  
**Validation Location**: useRecipeDetail hook  
**Validation Method**:
- Catch fetch errors
- Check for network-related error types

**Impact on UI**:
- Network error: ErrorState with "Check your connection" message
- Retry option provided

### Delete Confirmation

**Condition**: User must explicitly confirm deletion  
**Validation Location**: ConfirmDeleteModal component  
**Validation Method**:
- Modal must be opened (isDeleteModalOpen = true)
- User must click "Confirm Delete" button
- Prevents accidental deletion

**Impact on UI**:
- Delete button → Opens modal (no deletion yet)
- Cancel → Closes modal, no action taken
- Confirm → Executes deletion, shows loading state

## 10. Error Handling

### Error Scenario: Recipe Not Found (404)

**Cause**: Invalid recipe ID or recipe doesn't belong to user  
**Detection**: API returns 404 status code  
**Handling**:
- Display ErrorState component
- Message: "Recipe not found"
- No retry button (won't resolve issue)
- Provide "Back to recipes" link for navigation
- Log error to console for debugging

### Error Scenario: Unauthorized Access (401)

**Cause**: User session expired or not authenticated  
**Detection**: API returns 401 status code  
**Handling**:
- Redirect to login page immediately
- Store current URL for post-login redirect
- Display message: "Please log in to continue"

### Error Scenario: Network Error

**Cause**: No internet connection or API unreachable  
**Detection**: Fetch throws network error  
**Handling**:
- Display ErrorState component
- Message: "Failed to load recipe. Please check your connection."
- Provide "Retry" button
- Log error details to console

### Error Scenario: Server Error (500)

**Cause**: Unexpected backend error  
**Detection**: API returns 5xx status code  
**Handling**:
- Display ErrorState component
- Message: "Something went wrong. Please try again later."
- Provide "Retry" button
- Log error response to console for debugging

### Error Scenario: Delete Operation Failed

**Cause**: Network error or server error during deletion  
**Detection**: DELETE request fails or returns error status  
**Handling**:
- Keep ConfirmDeleteModal open
- Display error message in modal or as toast
- Reset isDeleting state to re-enable buttons
- Allow user to retry or cancel
- Log error to console

### Error Scenario: Invalid UUID Format

**Cause**: Malformed ID in URL  
**Detection**: isValidUUID validation fails in Astro page  
**Handling**:
- Return 404 response from Astro page
- Display 404 error page (not RecipeDetailView)
- No API call attempted
- Provide link to recipe list

### Error Scenario: Component Unmounts During Fetch

**Cause**: User navigates away before fetch completes  
**Detection**: AbortController signal triggered  
**Handling**:
- Abort ongoing fetch request
- Ignore AbortError in catch block
- Prevent state updates on unmounted component
- Clean up resources

### Error Scenario: JSON Parse Error

**Cause**: Malformed response from API  
**Detection**: response.json() throws error  
**Handling**:
- Catch JSON parse error
- Display generic error message
- Log full error and response to console
- Provide "Retry" button

### Error Display Strategy

**For Fetch Errors**:
- Replace entire view with ErrorState component
- Include error icon/illustration
- Clear, user-friendly message
- Actionable next steps (retry, back to list)

**For Delete Errors**:
- Keep modal open (user can retry or cancel)
- Display error message within modal
- Or use toast notification for less critical errors
- Maintain recipe view state

**Error Logging**:
- Console.error for all errors with context
- Include error type, status code, message
- Include recipe ID for debugging
- Do not log sensitive information

## 11. Implementation Steps

### Step 1: Set Up Project Structure
1. Create directory: `src/pages/app/recipes/`
2. Create directory: `src/components/recipe-detail/`
3. Create file: `src/components/hooks/useRecipeDetail.ts`
4. Verify existing utilities: `src/lib/validation/uuid.validation.ts`

### Step 2: Implement UUID Validation Utility (if not exists)
1. Create `isValidUUID` function in `src/lib/validation/uuid.validation.ts`
2. Implement UUID format validation using regex
3. Export function for use in Astro page

### Step 3: Create Type Definitions
1. Open `src/types.ts`
2. Add all new interface definitions from section 5:
   - RecipeDetailViewModel
   - RecipeDetailViewProps
   - RecipeDetailContentProps
   - RecipeHeaderProps
   - RecipeMetadataProps
   - RecipeContentProps
   - RecipeActionsProps
   - ConfirmDeleteModalProps
   - ErrorStateProps
   - UseRecipeDetailReturn
3. Export all new types

### Step 4: Implement useRecipeDetail Custom Hook
1. Create `src/components/hooks/useRecipeDetail.ts`
2. Implement state variables: recipe, isLoading, error, isDeleting
3. Implement fetchRecipe function with error handling
4. Implement deleteRecipe function with navigation
5. Implement refetch function
6. Add useEffect for initial fetch on mount
7. Add AbortController for cleanup
8. Export hook with UseRecipeDetailReturn interface

### Step 5: Create Utility Components
1. Create `src/components/recipe-detail/LoadingState.tsx`
   - Implement skeleton UI matching recipe layout
   - Use Tailwind for styling
2. Create `src/components/recipe-detail/ErrorState.tsx`
   - Accept error, statusCode, onRetry props
   - Conditional rendering based on error type
   - Include retry button and back link

### Step 6: Create Display Components
1. Create `src/components/recipe-detail/RecipeMetadata.tsx`
   - Format dates using Date API
   - Display creation date, update date, update counter
   - Use semantic HTML with time elements
2. Create `src/components/recipe-detail/RecipeHeader.tsx`
   - Render h1 with recipe title
   - Include RecipeMetadata component
3. Create `src/components/recipe-detail/RecipeContent.tsx`
   - Render content div with pre-wrap styling
   - Apply Tailwind prose classes for readability

### Step 7: Create Action Components
1. Create `src/components/recipe-detail/RecipeActions.tsx`
   - Import Button from Shadcn/ui
   - Implement Edit, Analyze, Delete buttons
   - Apply appropriate variant styling
   - Wire up onClick handlers

### Step 8: Create Modal Components
1. Create `src/components/recipe-detail/ConfirmDeleteModal.tsx`
   - Import Dialog components from Shadcn/ui
   - Implement modal structure with proper ARIA
   - Add confirmation message with recipe title
   - Implement Cancel and Confirm buttons
   - Handle loading state on Confirm button
   - Wire up onConfirm and onCancel handlers

### Step 9: Create Container Components
1. Create `src/components/recipe-detail/RecipeDetailContent.tsx`
   - Accept recipe and callback props
   - Manage isDeleteModalOpen state
   - Render RecipeHeader, RecipeContent, RecipeActions
   - Include ConfirmDeleteModal
   - Wire up delete modal open/close handlers

### Step 10: Create Main View Component
1. Create `src/components/recipe-detail/RecipeDetailView.tsx`
   - Accept recipeId prop
   - Use useRecipeDetail hook
   - Implement conditional rendering:
     - If isLoading: render LoadingState
     - If error: render ErrorState with retry
     - If recipe: render RecipeDetailContent
   - Implement edit handler (navigation)
   - Implement analyze handler (future)
   - Pass delete handler from hook to content

### Step 11: Create Astro Page
1. Create `src/pages/app/recipes/[id].astro`
2. Import AppLayout
3. Extract recipe ID from Astro.params
4. Validate recipe ID using isValidUUID
5. Return 404 response if invalid
6. Render AppLayout with RecipeDetailView component
7. Use client:load directive for React component
8. Pass recipeId as prop

### Step 12: Style Components
1. Apply Tailwind classes to all components
2. Ensure responsive design (mobile-first)
3. Apply proper spacing and typography
4. Ensure button styles match design system
5. Test dark mode compatibility (if enabled)

### Step 13: Implement Accessibility Features
1. Verify heading hierarchy (h1 for title)
2. Add aria-labels where needed
3. Test keyboard navigation:
   - Tab through all interactive elements
   - Enter/Space activate buttons
   - Escape closes modal
4. Test focus management in modal
5. Test with screen reader (VoiceOver/NVDA)
6. Ensure sufficient color contrast

### Step 14: Test Error Scenarios
1. Test with invalid UUID in URL
2. Test with non-existent recipe ID
3. Test with network disconnected
4. Test delete operation success
5. Test delete operation failure
6. Test navigation after successful delete
7. Test retry functionality

### Step 15: Implement Navigation Integration
1. Ensure recipe list links use correct ID format
2. Test navigation from list to detail
3. Test navigation from detail back to list
4. Implement View Transitions if not already enabled
5. Test edit navigation (requires edit view implementation)

### Step 16: Test Complete User Flows
1. User flow: View recipe details from list
2. User flow: Delete recipe and return to list
3. User flow: Navigate to edit (if available)
4. User flow: Handle all error scenarios
5. User flow: Retry after network error

### Step 17: Code Review and Optimization
1. Review all components for best practices
2. Check for proper error handling in all paths
3. Verify type safety (no `any` types)
4. Optimize re-renders (useMemo/useCallback if needed)
5. Remove console.logs (keep console.errors)
6. Add code comments for complex logic

### Step 18: Documentation
1. Add JSDoc comments to custom hook
2. Document component props with JSDoc
3. Update any relevant project documentation
4. Add inline comments for non-obvious logic

### Step 19: Final Testing
1. Test on multiple browsers (Chrome, Firefox, Safari)
2. Test on mobile devices
3. Test with slow network (throttling)
4. Test all keyboard interactions
5. Run accessibility audit
6. Verify no console errors

### Step 20: Deployment Preparation
1. Verify all linting passes
2. Verify TypeScript compilation
3. Test build process
4. Deploy to staging environment
5. Conduct final QA on staging
6. Deploy to production

