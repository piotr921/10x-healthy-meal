# View Implementation Plan: Dietary Preferences

## 1. Overview
This document outlines the implementation plan for the Dietary Preferences view. The purpose of this view is to allow authenticated users to manage their dietary settings, which include selecting a diet type (vegan, vegetarian, or none) and maintaining a list of forbidden ingredients. These preferences will be used by the application's AI to suggest recipe modifications.

## 2. View Routing
- **Path**: `/app/profile/preferences`
- **Page Component**: `src/pages/app/profile/preferences.astro`

## 3. Component Structure
The view will be composed of a single main component, `DietaryPreferencesView`, which will encapsulate all the functionality.

```
src/pages/app/profile/preferences.astro
└── src/components/profile/DietaryPreferencesView.tsx
    ├── Shadcn/ui `Card` components
    ├── Shadcn/ui `RadioGroup` for diet type selection
    ├── Shadcn/ui `Input` for adding forbidden ingredients
    ├── Shadcn/ui `Button` for adding ingredients
    ├── Shadcn/ui `Badge` for displaying forbidden ingredients
    └── Shadcn/ui `Button` for form submission
```

## 4. Component Details

### `DietaryPreferencesView.tsx`
- **Component Description**: A client-side React component that provides a form for users to view and update their dietary preferences. It fetches existing preferences on load, allows users to modify them, and submits the changes to the backend. It handles loading, success, and error states.
- **Main Elements**:
    - A main container using `Card` components from `shadcn/ui`.
    - A `RadioGroup` for selecting `diet_type` ('vegan', 'vegetarian', 'none').
    - An `Input` field and an "Add" `Button` to add ingredients to the `forbidden_ingredients` list.
    - A display area where currently added forbidden ingredients are shown as `Badge` components, each with a delete button.
    - A "Save Changes" `Button` to submit the form.
- **Handled Interactions**:
    - Selecting a diet type from the radio group.
    - Typing an ingredient into the input field.
    - Clicking the "Add" button to add an ingredient to the list.
    - Pressing "Enter" in the ingredient input field to add it to the list.
    - Clicking the 'x' on an ingredient badge to remove it from the list.
    - Clicking the "Save Changes" button to submit the form.
- **Validation Conditions**:
    - The `diet_type` must be one of 'vegan', 'vegetarian', or 'none'.
    - `forbidden_ingredients` must be an array of strings. Each string must be a non-empty, trimmed value. Duplicate ingredients should be prevented.
- **Types**:
    - `DietaryPreferencesDTO`
    - `UpdateDietaryPreferencesCommand`
    - `DietaryPreferencesViewModel`
- **Props**: None.

## 5. Types

### `DietaryPreferencesViewModel`
This new ViewModel will represent the state of the form on the client side.

```typescript
export interface DietaryPreferencesViewModel {
  diet_type: DietType;
  forbidden_ingredients: string[];
}
```
- `diet_type`: Same as `DietaryPreferencesDTO.diet_type`.
- `forbidden_ingredients`: Same as `DietaryPreferencesDTO.forbidden_ingredients`.

## 6. State Management
State will be managed locally within the `DietaryPreferencesView.tsx` component using React hooks. A custom hook, `useDietaryPreferences`, will be created to encapsulate the logic for fetching data, managing form state, and handling the submission process.

### `useDietaryPreferences` hook (`src/components/hooks/useDietaryPreferences.ts`)
- **Purpose**: To abstract the business logic and state management for the dietary preferences form.
- **State Variables**:
    - `preferences: DietaryPreferencesViewModel | null`: Holds the current state of the form data.
    - `isLoading: boolean`: Tracks the loading state for the initial data fetch.
    - `isSaving: boolean`: Tracks the saving state during form submission.
    - `error: string | null`: Stores any error messages from the API.
- **Functions**:
    - `fetchPreferences()`: Fetches the user's preferences via a `GET` request to `/api/dietary-preferences`.
    - `updatePreferences(data: DietaryPreferencesViewModel)`: Updates the local `preferences` state.
    - `savePreferences()`: Submits the current form state via a `PUT` request to `/api/dietary-preferences`.

## 7. API Integration
The view will interact with the `/api/dietary-preferences` endpoint.

- **Fetching Data**:
    - **Action**: On component mount.
    - **Request**: `GET /api/dietary-preferences`
    - **Response (Success)**: `200 OK` with `DietaryPreferencesDTO` as the body.
    - **Response (Not Found)**: `404 Not Found` if the user has not set preferences yet. The form should initialize with default values (`diet_type: 'none'`, `forbidden_ingredients: []`).
- **Saving Data**:
    - **Action**: On "Save Changes" button click.
    - **Request**: `PUT /api/dietary-preferences`
    - **Request Body**: `UpdateDietaryPreferencesCommand` (`{ diet_type: DietType, forbidden_ingredients: string[] }`)
    - **Response (Success)**: `200 OK` (updated) or `201 Created` (created) with `DietaryPreferencesDTO` as the body.

## 8. User Interactions
- **Loading**: The component will display a loading skeleton or spinner while initial preferences are being fetched.
- **Data Display**: Once loaded, the form will be populated with the user's current preferences or default values if none exist.
- **Form Modification**:
    - The user can change the selected diet type.
    - The user can add new ingredients to the forbidden list. The input should be cleared after an ingredient is added.
    - The user can remove ingredients from the list by clicking the 'x' on the badge.
- **Submission**:
    - Clicking "Save Changes" disables the button and shows a saving indicator.
    - On success, a success notification (e.g., a toast message) is displayed.
    - On failure, an error message is displayed.

## 9. Conditions and Validation
- **Authentication**: The Astro page (`preferences.astro`) must ensure the user is authenticated before rendering the `DietaryPreferencesView` component. If the user is not logged in, they should be redirected to the login page.
- **Input Validation**:
    - Forbidden ingredients cannot be empty strings. The "Add" button should be disabled if the input is empty.
    - Duplicate ingredients should not be added to the list. An appropriate message can be shown if the user tries to add a duplicate.

## 10. Error Handling
- **Fetch Error**: If the initial `GET` request fails (for reasons other than 404), a prominent error message will be displayed, prompting the user to try again.
- **Save Error**: If the `PUT` request fails, an error message will be displayed near the "Save" button or as a toast notification, indicating that the changes could not be saved.
- **401 Unauthorized**: If any API call returns a 401, the user should be redirected to the login page. This can be handled globally by a client-side fetch wrapper or in the `useDietaryPreferences` hook.

## 11. Implementation Steps
1. **Create Astro Page**: Create `src/pages/app/profile/preferences.astro`. This page will handle authentication and render the main React component.
2. **Create View Component**: Create the main React component `src/components/profile/DietaryPreferencesView.tsx`.
3. **Implement Custom Hook**: Create the `useDietaryPreferences` hook in `src/components/hooks/useDietaryPreferences.ts` to manage state and API calls.
4. **Build the UI**: In `DietaryPreferencesView.tsx`, build the form using `shadcn/ui` components for layout, inputs, and buttons.
5. **Connect State and UI**: Wire up the `useDietaryPreferences` hook to the UI components to display data and handle user interactions.
6. **Implement Fetch Logic**: In the hook, implement the initial data fetching, including handling the 404 case to set default form values.
7. **Implement Save Logic**: In the hook, implement the form submission logic, including optimistic UI updates (disabling the save button) and handling success and error responses.
8. **Add Notifications**: Integrate a toast or notification system to provide feedback for save success and failure.
9. **Refine Accessibility**: Ensure all form controls are properly labeled and the component is fully keyboard-navigable.
10. **Testing**: Manually test all user flows, including loading, saving, error states, and edge cases like adding empty or duplicate ingredients.

