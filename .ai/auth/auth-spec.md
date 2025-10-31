# Authentication Module - Technical Specification

## 1. Introduction

This document outlines the technical architecture for implementing user authentication in the HealthyMeal application. The solution will leverage Supabase Auth for core authentication logic and will be integrated into the existing Astro and React frontend. This specification addresses user stories US-001 (Registration), US-002 (Login), and US-003 (Logout) from the Product Requirements Document.

## 2. User Interface Architecture

The frontend will be updated to include dedicated authentication pages and components, with clear separation of concerns between client-side and server-side logic.

### 2.1. New Pages

New pages will be created under `src/pages/auth/`:

-   **`src/pages/auth/login.astro`**: This page will host the login form. It will be the default page for unauthenticated users attempting to access protected routes.
-   **`src/pages/auth/register.astro`**: This page will host the registration form, allowing new users to create an account.
-   **`src/pages/auth/callback.astro`**: This server-side page will handle the OAuth callback from Supabase after a successful login or registration, setting the session cookie and redirecting the user.

### 2.2. New Components

New React components will be created under `src/components/auth/`:

-   **`LoginForm.tsx`**: A client-side component containing the form for user login.
    -   **Props**: None.
    -   **State**: Manages form fields (email, password), submission status (loading), and error messages.
    -   **Responsibilities**:
        -   Renders email and password input fields and a submit button.
        -   Performs client-side validation for input formats.
        -   Calls the Supabase client to handle the sign-in process.
        -   Displays error messages returned from the backend (e.g., "Invalid credentials").
-   **`RegisterForm.tsx`**: A client-side component for user registration.
    -   **Props**: None.
    -   **State**: Manages form fields (email, password, confirm password), submission status, and error messages.
    -   **Responsibilities**:
        -   Renders email, password, and password confirmation fields.
        -   Validates that email is valid
        -   Validates that passwords match and meet complexity requirements.
        -   Calls the Supabase client to handle the sign-up process.
        -   Displays a success message upon successful registration, prompting the user to check their email for confirmation.
-   **`UserNav.tsx`**: A component to be added to the main header (`src/components/Header.astro`).
    -   **Props**: `isLoggedIn: boolean`.
    -   **Responsibilities**:
        -   If `isLoggedIn` is `true`, it will display a "Logout" button and a link to the user's profile (`/app/profile/preferences`).
        -   If `isLoggedIn` is `false`, it will display "Login" and "Register" links.

### 2.3. Layout Changes

-   **`src/layouts/AppLayout.astro`**: This layout, used for protected routes, will be modified to check for an active user session. If no session exists, it will redirect the user to `/auth/login`.
-   **`src/components/Header.astro`**: This component will be updated to include the `UserNav` component, dynamically rendering authentication status.

### 2.4. Client-side vs. Server-side Responsibilities

-   **Astro Pages (`.astro`)**:
    -   Handle routing and server-side data fetching.
    -   Render the overall page structure and pass session status to client-side components.
    -   The `auth/callback.astro` page will handle the server-side logic of exchanging an auth code for a session.
-   **React Components (`.tsx`)**:
    -   Manage interactive form state, user input, and client-side validation.
    -   Interact directly with the Supabase client-side library for sign-up, sign-in, and sign-out actions.

### 2.5. Validation and Error Messages

-   **Client-Side (in React components)**:
    -   **Email**: Must be a valid email format. Message: "Please enter a valid email address."
    -   **Password**: Must be at least 8 characters long. Message: "Password must be at least 8 characters."
    -   **Password Confirmation**: Must match the password field. Message: "Passwords do not match."
-   **Server-Side (from Supabase)**:
    -   **Login**: "Invalid login credentials."
    -   **Registration**: "User already registered."

### 2.6. User Scenarios

-   **Registration**:
    1.  User navigates to `/auth/register`.
    2.  The `RegisterForm.tsx` component is rendered.
    3.  User fills out the form and submits.
    4.  The component calls `supabase.auth.signUp()`.
    5.  On success, a message is shown asking the user to confirm their email.
-   **Login**:
    1.  User navigates to `/auth/login`.
    2.  The `LoginForm.tsx` component is rendered.
    3.  User enters credentials and submits.
    4.  The component calls `supabase.auth.signInWithPassword()`.
    5.  On success, Supabase redirects to the `auth/callback` route, which sets a session cookie. The user is then redirected to the `/app/recipes` page.
-   **Logout**:
    1.  User clicks the "Logout" button in `UserNav.tsx`.
    2.  An event handler calls `supabase.auth.signOut()`.
    3.  The session cookie is cleared, and the page reloads. The user is redirected to the home page (`/`).

## 3. Backend Logic

The backend logic will primarily be handled by Supabase, with API routes in Astro for any custom server-side actions.

### 3.1. API Endpoints

-   **`src/pages/api/auth/callback.ts` (replaces `src/pages/auth/callback.astro`)**:
    -   **Method**: `GET`
    -   **Description**: Handles the server-side session creation after a successful Supabase redirect. It exchanges the authorization code for a session and stores it in a cookie.
    -   **Logic**:
        1.  Receives the `code` from the query parameters.
        2.  Calls `supabase.auth.exchangeCodeForSession(code)`.
        3.  Sets the session cookie using `Astro.cookies.set()`.
        4.  Redirects the user to a protected page (e.g., `/app/recipes`).

### 3.2. Data Models

Zod schemas will be used for validation within the React forms, ensuring data integrity before it is sent to Supabase.

-   **`src/lib/validation/auth.validation.ts`**:
    -   `LoginSchema`:
        -   `email`: `z.string().email()`
        -   `password`: `z.string().min(1, "Password is required")`
    -   `RegisterSchema`:
        -   `email`: `z.string().email()`
        -   `password`: `z.string().min(8)`

### 3.3. Exception Handling

-   API routes will use `try...catch` blocks to handle errors from Supabase (e.g., invalid code in the callback).
-   Errors will be logged, and a generic error response will be sent to the client (e.g., HTTP 500).

### 3.4. Server-Side Rendering (SSR)

-   The `astro.config.mjs` file is already configured for `output: 'server'`, which is required for this authentication strategy.
-   The middleware at `src/middleware/index.ts` will be updated to protect routes. It will check for a valid session on all routes under `/app/*`. If no session is found, it will redirect to `/auth/login`.

## 4. Authentication System

Supabase Auth will be the core of the authentication system.

### 4.1. Supabase Auth Integration

-   The Supabase client will be initialized in `src/db/supabase.client.ts`.
-   The client will be used on both the server (in API routes and middleware, accessed via `context.locals.supabase`) and the client (in React components).
-   **Environment Variables**: `SUPABASE_URL` and `SUPABASE_ANON_KEY` will be stored in `.env` and accessed via `import.meta.env`.

### 4.2. Key Flows

-   **Registration**: `supabase.auth.signUp()` will be used. Supabase will handle sending the confirmation email.
-   **Login**: `supabase.auth.signInWithPassword()` will be used for password-based login.
-   **Logout**: `supabase.auth.signOut()` will clear the session on both the client and server.
-   **Password Recovery**:
    -   A "Forgot Password?" link will be added to `LoginForm.tsx`.
    -   This will lead to a new page, `src/pages/auth/forgot-password.astro`, with a form to enter an email.
    -   The form will call `supabase.auth.resetPasswordForEmail()`.
    -   Supabase will send a password reset link to the user.
    -   A page at `src/pages/auth/update-password.astro` will handle the password update form, using `supabase.auth.updateUser()`.

