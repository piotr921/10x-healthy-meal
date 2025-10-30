# View Implementation Plan: Edit Recipe

## 1. Overview
This document outlines the implementation plan for the "Edit Recipe" view. This view allows users to modify the title and content of an existing recipe. It fetches the current recipe data, pre-fills a form, validates user input, and submits the changes to the backend. Upon successful update, it redirects the user to the recipe's detail page.

## 2. View Routing
- **Path:** `/app/recipes/[id]/edit`
- **Page Component:** `src/pages/app/recipes/[id]/edit.astro`

## 3. Component Structure
The view will be composed of the following components in a hierarchical structure:

```
- AppLayout.astro (root layout)
  - EditRecipePage.astro (`/app/recipes/[id]/edit.astro`)
    - RecipeForm.tsx (client-side interactive form)
      - Input (from shadcn/ui)
      - Textarea (from shadcn/ui)
      - Button (from shadcn/ui)
      - ConfirmDeleteModal.tsx (reused for confirming save)
```

## 4. Component Details

### 4.1. EditRecipePage.astro
- **Component Description:** This is the main page component responsible for fetching the initial recipe data and rendering the `RecipeForm`. It acts as a bridge between the server-side data fetching and the client-side React form component.
- **Main Elements:**
    - It will use the `AppLayout.astro` for consistent page structure.
    - It will fetch the recipe data on the server using the `recipe.service`.
    - It will render the `<RecipeForm />` component, passing the fetched recipe data as a prop.
- **Handled Interactions:** None directly. It delegates all user interactions to the `RecipeForm` component.
- **Handled Validation:** None.
- **Types:** `Recipe`
- **Props:** None. It receives the `id` from the URL parameters.

### 4.2. RecipeForm.tsx
- **Component Description:** A client-side React component that provides a form for editing a recipe. It manages the form's state, handles user input, performs validation, and communicates with the API to save the changes. It will be reused for both creating and editing recipes.
- **Main Elements:**
    - A `<form>` element.
    - `<Input>` for the recipe title.
    - `<Textarea>` for the recipe content.
    - `<Button>` to trigger the save process.
    - A confirmation dialog (`ConfirmDeleteModal` can be adapted or a new `ConfirmationDialog` can be created) to confirm the update.
- **Handled Interactions:**
    - `onChange` on form fields to update the component's state.
    - `onSubmit` on the form to trigger validation and the save process.
    - `onClick` on the "Save Changes" button to show the confirmation dialog.
    - `onConfirm` in the dialog to proceed with the API call.
- **Handled Validation:**
    - **Title:** Must be a non-empty string with a minimum of 3 characters.
    - **Content:** Must be a non-empty string with a minimum of 10 characters.
- **Types:** `Recipe`, `UpdateRecipeDto`, `RecipeFormViewModel`
- **Props:**
    - `recipe?: Recipe`: The existing recipe data to pre-fill the form. If not provided, the form will be in "create" mode.
    - `isEditMode: boolean`: A flag to indicate if the form is for editing an existing recipe.

## 5. Types

### 5.1. Recipe (from `src/types.ts`)
This type represents a recipe entity as stored in the database and returned by the API.
```typescript
export type Recipe = {
  id: string; // UUID
  title: string;
  content: string;
  user_id: string;
  created_at: string; // ISO8601
  updated_at: string; // ISO8601
};
```

### 5.2. UpdateRecipeDto (from `src/types.ts`)
This is the Data Transfer Object for updating a recipe. It contains only the fields that can be modified.
```typescript
export type UpdateRecipeDto = {
  title: string;
  content: string;
};
```

### 5.3. RecipeFormViewModel
A new client-side type to manage the form's state, including loading and error states.
```typescript
export type RecipeFormViewModel = {
  initialData: Recipe | null;
  formData: UpdateRecipeDto;
  isLoading: boolean;
  error: string | null;
};
```

## 6. State Management
State will be managed within the `RecipeForm.tsx` component using React hooks. A custom hook, `useRecipeForm`, will be created to encapsulate the logic for managing form data, handling submission, and managing API communication state (loading, error).

- **`useRecipeForm(recipe?: Recipe)`:**
    - Initializes and manages the `RecipeFormViewModel` state.
    - Provides a function to handle form submission, which includes validation and calling the API service.
    - Manages `isLoading` and `error` states based on the API call lifecycle.
    - Handles the redirect on successful update using `Astro.redirect` or a similar mechanism passed down or invoked via events.

## 7. API Integration
The frontend will interact with the `PUT /api/recipes/[id]` endpoint to update a recipe.

- **Request:**
    - A `PUT` request will be sent to `/api/recipes/[id]`.
    - The request body will be of type `UpdateRecipeDto`.
    - The `recipe.service.ts` will contain a function `updateRecipe(id: string, data: UpdateRecipeDto): Promise<Recipe>`.

- **Response:**
    - **Success (200 OK):** The server responds with the updated `Recipe` object. The application will then redirect to `/app/recipes/[id]`.
    - **Error:** The `updateRecipe` service function will throw an error for non-2xx responses, which will be caught in the `useRecipeForm` hook to update the `error` state in the view model.

## 8. User Interactions
1.  **Page Load:** The user navigates to `/app/recipes/[id]/edit`. The `EditRecipePage.astro` fetches the recipe data and renders the `RecipeForm` with the title and content fields pre-filled.
2.  **Editing:** The user modifies the text in the title and/or content fields. The component state is updated on every keystroke.
3.  **Save Attempt:** The user clicks the "Save Changes" button.
4.  **Confirmation:** A modal dialog appears asking, "Are you sure you want to save these changes?".
5.  **Save Confirmed:** The user clicks "Confirm". The `useRecipeForm` hook initiates the API call. The UI enters a loading state (e.g., button is disabled, spinner is shown).
6.  **Save Canceled:** The user clicks "Cancel" in the modal. The modal closes, and the UI returns to the editable state.
7.  **Successful Update:** The API returns a 200 status. The application redirects the user to the recipe detail page at `/app/recipes/[id]`.
8.  **Failed Update:** The API returns an error (e.g., 400, 409). The loading state is removed, and an error message is displayed to the user near the form's submit button.

## 9. Conditions and Validation
- **Form Enablement:** The "Save Changes" button will be disabled if the form is in a `loading` state.
- **Input Validation:**
    - **Title:** The field is required. An error message ("Title is required and must be at least 3 characters long.") is shown if the user tries to save with an empty or too short title.
    - **Content:** The field is required. An error message ("Content is required and must be at least 10 characters long.") is shown if the user tries to save with empty or too short content.
- **API-Side Validation:**
    - **Conflict (409):** If the API returns a 409 error (duplicate title), a specific error message ("A recipe with this title already exists.") will be displayed.

## 10. Error Handling
- **Fetch Error:** If the initial data fetch in `EditRecipePage.astro` fails (e.g., recipe not found), the page should render an appropriate error state, indicating that the recipe could not be loaded.
- **Update Error:** If the `PUT` request fails, the `RecipeForm` will display a descriptive error message.
    - For a 409 Conflict, a specific message about the duplicate title will be shown.
    - For other client or server errors (400, 500), a generic message like "Failed to save recipe. Please try again." will be displayed.
- **Loading State:** During the API call, the "Save Changes" button will be disabled, and a visual indicator (e.g., a spinner) will be shown to prevent multiple submissions and inform the user that an operation is in progress.

## 11. Implementation Steps
1.  **Create Page Component:** Create the file `src/pages/app/recipes/[id]/edit.astro`.
2.  **Implement Data Fetching:** In `edit.astro`, add logic to get the recipe `id` from the URL. Use the existing `recipe.service` to fetch the recipe data from the server. Handle the case where the recipe is not found.
3.  **Update `RecipeForm` for Edit Mode:**
    - Modify `src/components/my-recipes/RecipeForm.tsx` to accept the `recipe` object and an `isEditMode` boolean as props.
    - Use the `recipe` prop to pre-fill the form fields when in edit mode.
4.  **Create `useRecipeForm` Hook:**
    - Create a new file `src/components/hooks/useRecipeForm.ts`.
    - Implement the hook to manage form state (`formData`, `isLoading`, `error`).
    - It should expose a `handleSubmit` function that performs validation and calls the appropriate API service (create or update).
5.  **Integrate Hook into Form:** Refactor `RecipeForm.tsx` to use the new `useRecipeForm` hook to manage its state and logic.
6.  **Implement API Update Function:** In `src/lib/services/recipe.service.ts`, add the `updateRecipe` function that sends a `PUT` request to `/api/recipes/[id]` with the `UpdateRecipeDto` payload.
7.  **Add Confirmation Modal:** Integrate a confirmation dialog (reuse or create a new one) that appears when the user clicks "Save Changes". The actual API call should only be made after the user confirms the action.
8.  **Handle Redirection:** On successful update, use `Astro.redirect` from the server-side or a client-side navigation utility to redirect the user to `/app/recipes/[id]`.
9.  **Implement Error and Loading UI:** Add UI elements in `RecipeForm.tsx` to display loading spinners and error messages based on the state from the `useRecipeForm` hook.
10. **Testing:** Manually test the entire flow: loading data, editing, validating, saving, handling errors, and successful redirection.

