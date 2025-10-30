# View Implementation Plan: My Recipes

## 1. Overview
This document outlines the implementation plan for the "My Recipes" view, located at `/app/recipes`. This view serves as a personal dashboard where users can browse, search, and manage their saved culinary recipes. It will display a list of recipes, provide a search functionality to filter them by title, and include a button to initiate the creation of a new recipe. The user experience is designed to be seamless, featuring infinite scrolling with a "Load More" option, loading skeletons for better feedback, and a clear empty state message when no recipes are found.

## 2. View Routing
The "My Recipes" view will be accessible at the following path:
- **Path**: `/app/recipes`

This will be a new page created in the `src/pages/app/` directory.

## 3. Component Structure
The view will be composed of a main Astro page that orchestrates several React components for dynamic functionality.

```
/src/pages/app/recipes.astro
└── /src/layouts/AppLayout.astro
    ├── /src/components/my-recipes/SearchBar.tsx
    ├── /src/components/my-recipes/InfoBanner.tsx
    └── /src/components/my-recipes/RecipeList.tsx
        ├── /src/components/my-recipes/RecipeCard.astro
        ├── /src/components/my-recipes/RecipeCardSkeleton.astro
        └── /src/components/ui/button.tsx (Load More)
```

## 4. Component Details

### `recipes.astro`
- **Component Description**: The main page component that lays out the structure of the "My Recipes" view. It will be responsible for rendering the static layout and integrating the interactive React components.
- **Main Elements**:
  - A main heading (`h1`) for the page title ("My Recipes").
  - A container for the `SearchBar` and "Create Recipe" button.
  - The `InfoBanner` component.
  - The `RecipeList` component.
- **Handled Interactions**: None. This is a static layout component.
- **Handled Validation**: None.
- **Types**: None.
- **Props**: None.

### `SearchBar.tsx`
- **Component Description**: An interactive client-side component that allows users to filter recipes by title. It will feature debounced input to prevent excessive API calls while the user is typing.
- **Main Elements**:
  - `Input` component from `shadcn/ui`.
  - A search icon inside the input field.
- **Handled Interactions**:
  - `onChange`: Updates the search term in the parent component (`RecipeList`) after a debounce period.
- **Handled Validation**: None.
- **Types**: None.
- **Props**:
  - `onSearchChange: (searchTerm: string) => void`: A callback function to notify the parent component of a search term change.

### `InfoBanner.tsx`
- **Component Description**: A dismissible banner displayed to the user if they have not set their dietary preferences. This component will be conditionally rendered.
- **Main Elements**:
  - A container `div` with the appropriate styling for a banner.
  - A message encouraging the user to set their preferences.
  - A "Set Preferences" link/button.
  - A close button (`X`) to dismiss the banner.
- **Handled Interactions**:
  - `onClick` on the close button: Hides the banner and potentially sets a flag in local storage to keep it dismissed.
- **Handled Validation**: None.
- **Types**: None.
- **Props**: None.

### `RecipeList.tsx`
- **Component Description**: The core interactive component of the view. It is responsible for fetching the user's recipes, managing the list state (including pagination and search results), handling infinite scroll, and rendering the list of recipes or appropriate feedback (loading skeletons, empty state).
- **Main Elements**:
  - A container for the grid of `RecipeCard` components.
  - Renders `RecipeCardSkeleton` components while data is loading.
  - Displays an "Empty State" message if no recipes are found.
  - A "Load More" `Button` to fetch the next page of recipes.
- **Handled Interactions**:
  - Initial data fetch on component mount.
  - `onClick` on the "Load More" button: Fetches the next page of recipes and appends them to the list.
  - Handles search term changes from `SearchBar` to refetch and filter the recipe list.
- **Handled Validation**: None.
- **Types**: `RecipeDTO`, `PaginationMetadata`, `RecipeListResponseDTO`.
- **Props**: None.

### `RecipeCard.astro`
- **Component Description**: A static, presentational component that displays a summary of a single recipe. It is designed for reuse and optimized for performance as an Astro component.
- **Main Elements**:
  - A clickable `<a>` tag wrapping the card, linking to the recipe details page.
  - `h3` for the recipe title.
  - A short snippet of the recipe content.
  - Metadata like creation or update date.
- **Handled Interactions**: None.
- **Handled Validation**: None.
- **Types**: `RecipeDTO`.
- **Props**:
  - `recipe: RecipeDTO`: The recipe object to display.

### `RecipeCardSkeleton.astro`
- **Component Description**: A static component that mimics the layout of `RecipeCard` to provide a loading state indicator. It uses placeholder shapes and animations.
- **Main Elements**:
  - `div` elements with background colors and animations to represent the structure of a recipe card.
- **Handled Interactions**: None.
- **Handled Validation**: None.
- **Types**: None.
- **Props**: None.

## 5. Types
The view will use existing types defined in `src/types.ts`. No new custom ViewModel types are required for this implementation.

- **`RecipeDTO`**: Represents a single recipe object.
  ```typescript
  export type RecipeDTO = Omit<RecipeEntity, 'user_id' | 'deleted_at'>;
  // {
  //   id: string;
  //   title: string;
  //   content: string;
  //   update_counter: number;
  //   created_at: string;
  //   updated_at: string;
  // }
  ```
- **`RecipeListResponseDTO`**: The expected response from the `GET /api/recipes` endpoint.
  ```typescript
  export interface RecipeListResponseDTO {
    recipes: RecipeDTO[];
    pagination: PaginationMetadata;
  }
  ```
- **`PaginationMetadata`**: Contains pagination details.
  ```typescript
  export interface PaginationMetadata {
    current_page: number;
    total_pages: number;
    total_count: number;
    limit: number;
  }
  ```

## 6. State Management
State will be managed locally within the `RecipeList.tsx` component using React hooks. A custom hook, `useRecipes`, will be created to encapsulate the logic for fetching, pagination, and searching.

### `useRecipes` Custom Hook
- **Purpose**: To abstract the complexity of data fetching and state management from the `RecipeList` component, making it cleaner and more focused on rendering.
- **State Variables**:
  - `recipes: RecipeDTO[]`: An array to store the list of fetched recipes.
  - `isLoading: boolean`: A flag to indicate when a data fetch is in progress.
  - `error: Error | null`: To hold any error object that occurs during fetching.
  - `pagination: PaginationMetadata | null`: To store the pagination details from the API.
  - `searchTerm: string`: The current search query.
- **Functions**:
  - `fetchRecipes(page: number, search: string)`: The core function to make the API call.
  - `loadMore()`: A function to fetch the next page of results.
  - `setSearchTerm(term: string)`: A function to update the search term and trigger a new fetch.

## 7. API Integration
The `RecipeList.tsx` component, via the `useRecipes` hook, will interact with the backend API.

- **Endpoint**: `GET /api/recipes`
- **Method**: `GET`
- **Request**:
  - The hook will make a `fetch` request to the endpoint.
  - **Query Parameters**:
    - `page: number`: The page number for pagination.
    - `limit: number`: The number of items per page (e.g., 20).
    - `search: string`: The search term from the `SearchBar`.
- **Response**:
  - The expected response is a JSON object matching the `RecipeListResponseDTO` type.
  - On success, the `recipes` array will be appended to the local state, and `pagination` will be updated.
  - On failure, the `error` state will be updated.

## 8. User Interactions
- **Searching for a Recipe**:
  1. User types in the `SearchBar.tsx`.
  2. The `onChange` event is debounced.
  3. After the debounce delay, `onSearchChange` is called.
  4. The `useRecipes` hook updates the `searchTerm`, resets the `recipes` list and pagination, and fetches the first page of results with the new search term.
- **Loading More Recipes**:
  1. User scrolls to the bottom of the list and clicks the "Load More" button.
  2. The `onClick` handler calls the `loadMore` function from the `useRecipes` hook.
  3. The hook increments the page number and fetches the next page of recipes.
  4. The new recipes are appended to the existing `recipes` array.
  5. The "Load More" button is hidden if the last page is reached.
- **Creating a Recipe**:
  1. User clicks the "Create Recipe" button.
  2. The application navigates the user to the recipe creation page (e.g., `/app/recipes/create`).

## 9. Conditions and Validation
- **Loading State**: The `isLoading` flag will be `true` during API requests. The UI will display `RecipeCardSkeleton` components in the `RecipeList` to indicate loading.
- **Empty State**: If the initial fetch returns `total_count: 0`, the `RecipeList` will display a message like "No recipes found. Get started by creating one!".
- **"Load More" Button Visibility**: The button will be visible only if `isLoading` is `false` and `pagination.current_page < pagination.total_pages`.
- **Search Results**: When a search is active, the `RecipeList` will announce the updated results to screen readers using an ARIA live region.

## 10. Error Handling
- **API Errors**: If an API call fails (e.g., network error, server error), the `error` state in `useRecipes` will be set. The `RecipeList` component will display a user-friendly error message, such as "Could not load recipes. Please try again later."
- **No Search Results**: This is not an error but an empty state. If a search yields no results, a message like "No recipes match your search for '[searchTerm]'" will be displayed.

## 11. Implementation Steps
1.  **Create File Structure**:
    -   Create the page file: `src/pages/app/recipes.astro`.
    -   Create a new directory for the view's components: `src/components/my-recipes/`.
    -   Create the component files: `SearchBar.tsx`, `InfoBanner.tsx`, `RecipeList.tsx`, `RecipeCard.astro`, and `RecipeCardSkeleton.astro`.
2.  **Implement Static Components (`.astro`)**:
    -   Develop the `RecipeCard.astro` component to display a single recipe based on the `RecipeDTO` prop.
    -   Develop the `RecipeCardSkeleton.astro` component with a placeholder UI.
    -   Set up the main layout in `recipes.astro`, including the page title and placeholders for the React components.
3.  **Develop the `useRecipes` Hook**:
    -   Create `src/components/hooks/useRecipes.ts`.
    -   Implement the state variables (`recipes`, `isLoading`, `error`, `pagination`, `searchTerm`).
    -   Write the logic for fetching data from `GET /api/recipes`, handling pagination, and search queries.
    -   Expose methods to `loadMore` and `setSearchTerm`.
4.  **Implement `RecipeList.tsx`**:
    -   Integrate the `useRecipes` hook.
    -   Render `RecipeCardSkeleton`s when `isLoading` is true.
    -   Render the list of `RecipeCard` components by mapping over the `recipes` state.
    -   Display the empty state message when appropriate.
    -   Render the "Load More" button and handle its `onClick` event.
    -   Implement the error message display.
5.  **Implement `SearchBar.tsx`**:
    -   Create the input field with a search icon.
    -   Use a debounce utility (e.g., from `lodash.debounce` or a custom hook) for the `onChange` handler.
    -   Call the `onSearchChange` prop with the debounced value.
6.  **Implement `InfoBanner.tsx`**:
    -   Create the banner with a dismiss button.
    -   Add state to manage its visibility.
7.  **Assemble the View**:
    -   In `recipes.astro`, import and render the `SearchBar`, `InfoBanner`, and `RecipeList` React components, ensuring they are marked for client-side hydration (`client:load`).
    -   Pass the `setSearchTerm` function from the `RecipeList` (or its hook) to the `SearchBar` as a prop.
8.  **Testing and Refinement**:
    -   Manually test all user interactions: searching, loading more, empty states, and error conditions.
    -   Verify accessibility features, such as ARIA attributes and keyboard navigation.
    -   Check responsiveness and ensure the layout works on different screen sizes.

