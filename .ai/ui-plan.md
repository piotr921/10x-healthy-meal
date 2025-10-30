# UI Architecture for HealthyMeal

## 1. UI Structure Overview
The HealthyMeal UI is a responsive web application, built on Astro for static content and server-side rendering, and React for interactive components. The architecture prioritizes a clean, intuitive user experience, focusing on three core user flows: user authentication, recipe management, and AI-powered recipe analysis.

The structure is centered around a main dashboard ("My Recipes") that serves as the user's home base. From there, users can navigate to create new recipes, view recipe details, and manage their dietary preferences. Navigation is handled by a persistent top bar, ensuring easy access to all key sections. The design uses a hybrid rendering model, where Astro pages provide fast initial loads and React components (islands) handle dynamic functionality like data fetching, form interactions, and state management.

## 2. View List

### 2.1. Landing/Login Page
- **View Path**: `/` (or redirects to `/login` if not authenticated)
- **Main Purpose**: To allow new users to register and existing users to log in.
- **Key Information**: Login form (email, password), link to registration page.
- **Key View Components**: `AuthForm.tsx` (React component for login/registration).
- **UX/Accessibility/Security**:
    - **UX**: Clear error messages for invalid credentials. Autofocus on the first input field.
    - **Accessibility**: Proper form labels, ARIA attributes for validation, keyboard navigable.
    - **Security**: Forms submit to secure API endpoints. No sensitive data is stored client-side.

### 2.2. Registration Page
- **View Path**: `/register`
- **Main Purpose**: To enable new user account creation.
- **Key Information**: Registration form (email, password).
- **Key View Components**: `AuthForm.tsx` (React component configured for registration).
- **UX/Accessibility/Security**:
    - **UX**: Real-time validation for email format and password strength.
    - **Accessibility**: Semantic HTML for forms, `aria-describedby` for validation hints.
    - **Security**: All communication is over HTTPS. Passwords are not logged.

### 2.3. My Recipes (Dashboard)
- **View Path**: `/app/recipes`
- **Main Purpose**: To display all the user's saved recipes and allow them to search and create new ones.
- **Key Information**: A list of recipe cards, a search bar, and a "Create Recipe" button.
- **Key View Components**:
    - `RecipeList.tsx`: Interactive component managing fetching, infinite scroll, and filtering.
    - `RecipeCard.astro`: Static component for displaying individual recipe summaries.
    - `SearchBar.tsx`: Debounced search input.
    - `InfoBanner.tsx`: Dismissible banner if dietary preferences are not set.
- **UX/Accessibility/Security**:
    - **UX**: Infinite scroll with a "Load More" button for discoverability. Loading skeletons provide feedback. Empty state message is clear.
    - **Accessibility**: "Load More" button as a fallback for non-JS or screen reader users. ARIA live regions announce search results.
    - **Security**: All data is fetched for the authenticated user only, enforced by API and RLS.

### 2.4. Recipe Detail View
- **View Path**: `/app/recipes/{id}`
- **Main Purpose**: To display the full content of a single recipe and provide actions for editing, deleting, or analyzing it.
- **Key Information**: Recipe title, content, metadata (creation/update dates), action buttons.
- **Key View Components**:
    - `RecipeDetail.tsx`: Main component to fetch and display recipe data.
    - `AIAnalysisModal.tsx`: Modal for displaying AI modification suggestions.
    - `ConfirmationModal.tsx`: For confirming recipe deletion.
- **UX/Accessibility/Security**:
    - **UX**: Clear separation of recipe content and actions. Inline editing for quick changes.
    - **Accessibility**: Proper heading structure. All actions are keyboard-accessible. Modals trap focus.
    - **Security**: User can only access their own recipes, enforced by the API.

### 2.5 Edit Recipe View
- **Route:** `/app/recipes/[id]/edit`
- **Page Component:** `src/pages/app/recipes/[id]/edit.astro`
- **UI Component:** `src/components/my-recipes/RecipeForm.tsx`
- **Description:** A form for editing an existing recipe, pre-filled with the recipe's current data.
- **Features:**
    - Fetches recipe data from `GET /api/recipes/{id}` to pre-fill the form.
    - Input field for the recipe title.
    - Text area for the recipe content.
    - A "Save Changes" button that submits the form to `PUT /api/recipes/{id}`.
    - Handles loading and error states.
    - Redirects to the recipe detail view (`/app/recipes/{id}`) on successful update.

### 2.6. Recipe Creation Page
- **View Path**: `/app/recipes/create`
- **Main Purpose**: To allow users to create a new recipe by pasting its content.
- **Key Information**: Form with fields for title and content.
- **Key View Components**: `RecipeForm.tsx` (handles input, validation, and submission).
- **UX/Accessibility/Security**:
    - **UX**: Real-time character counters and validation feedback. Auto-save drafts to local storage.
    - **Accessibility**: `aria-invalid` on fields with errors. `aria-describedby` links fields to error messages.
    - **Security**: Input is sanitized on the backend to prevent XSS. Zod validation on the server is the source of truth.

### 2.7. Dietary Preferences Page
- **View Path**: `/app/profile/preferences`
- **Main Purpose**: To allow users to define and save their dietary preferences.
- **Key Information**: Form to select a diet type and manage a list of forbidden ingredients.
- **Key View Components**: `DietaryPreferencesForm.tsx`.
- **UX/Accessibility/Security**:
    - **UX**: Simple interface for adding/removing ingredients. Success/error notifications on save.
    - **Accessibility**: Form elements are properly labeled. List of ingredients is manageable with a keyboard.
    - **Security**: Preferences are tied to the user's account and used in server-side AI analysis.

## 3. User Journey Map

### New User Registration and Onboarding
1.  **Start**: User lands on the **Landing Page** (`/`).
2.  **Navigate to Register**: User clicks "Register" and is taken to the **Registration Page** (`/register`).
3.  **Submit Form**: User fills in their email and password and submits the form.
4.  **Login & Redirect**: Upon success, the user is logged in and redirected to the **My Recipes** dashboard (`/app/recipes`).
5.  **Onboarding (Optional)**: A banner on the dashboard suggests setting dietary preferences. The user can click it to go to the **Dietary Preferences Page** or dismiss it.

### Creating and Analyzing a Recipe
1.  **Start**: User is on the **My Recipes** dashboard (`/app/recipes`).
2.  **Create Recipe**: User clicks "Create Recipe" and navigates to the **Recipe Creation Page** (`/app/recipes/create`).
3.  **Enter Content**: User pastes the recipe title and content and clicks "Save".
4.  **View Recipe**: The user is redirected to the new recipe's **Recipe Detail View** (`/app/recipes/{id}`).
5.  **Initiate Analysis**: User clicks the "Analyze with AI" button.
6.  **Review Suggestions**: The `AIAnalysisModal` opens, showing a comparison of the original and modified recipe.
    - If preferences are not set, a modal first prompts the user to set them, redirecting to the **Dietary Preferences Page**.
7.  **Accept/Reject**:
    - **Accept**: The user accepts the changes. The recipe is updated via an API call, the modal closes, and the **Recipe Detail View** refreshes.
    - **Reject**: The user closes the modal, and no changes are made.

## 4. Layout and Navigation Structure
The main application layout consists of a persistent top navigation bar and a main content area.

- **Top Navigation Bar**:
    - **Logo/Home Link**: Navigates to "My Recipes" (`/app/recipes`).
    - **My Recipes**: Link to the main recipe list.
    - **Dietary Preferences**: Link to `/app/profile/preferences`.
    - **Profile/Logout**: A dropdown menu with a link to the user's profile and a "Logout" button.

- **Content Area**: This is where the main content of each view is rendered. For authenticated users, all routes are prefixed with `/app`.

- **Authentication Flow**: Unauthenticated users are restricted to the `/login` and `/register` pages. Any attempt to access `/app/*` routes will redirect to `/login`.

## 5. Key Components

- **`AuthForm.tsx`**: A reusable React component for handling both login and registration, with props to toggle between modes.
- **`RecipeList.tsx`**: An interactive component that fetches, displays, and filters a user's recipes using infinite scroll.
- **`RecipeForm.tsx`**: A controlled form component for creating and editing recipes, featuring real-time validation and draft auto-saving.
- **`AIAnalysisModal.tsx`**: A modal component that presents the AI-generated recipe modifications in a clear, comparable format (side-by-side on desktop, tabs on mobile).
- **`DietaryPreferencesForm.tsx`**: A form for managing diet type and a dynamic list of forbidden ingredients.
- **`InfoBanner.tsx`**: A dismissible banner used for onboarding prompts and other contextual information.
- **`ConfirmationModal.tsx`**: A generic modal to confirm destructive actions, such as deleting a recipe.
- **`LoadingSkeleton.astro`**: A static placeholder component used to indicate loading states, improving perceived performance.

