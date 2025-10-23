## UI Architecture Planning Summary

### Main UI Architecture Requirements

HealthyMeal is a web application (no mobile app version planned for MVP) built with Astro 5, React 19, TypeScript 5, Tailwind 4, and Shadcn/ui. The architecture follows a responsive web design approach, optimized for desktop and tablet browsers. The application centers on three core user flows:

1. **User Management**: Registration, login/logout, profile management with dietary preferences
2. **Recipe Management**: Create, view, edit, delete recipes with validation and search
3. **AI Integration**: On-demand recipe analysis based on user dietary preferences

The application follows a hybrid rendering approach with Astro handling static content and SSR, while React components provide interactivity where needed.

### Key Views, Screens, and User Flows

#### 1. Authentication Flow
- **Landing Page** (`/`): Entry point with login/register options
- **Registration Page**: Email/password signup
- **Login Page**: Email/password authentication
- **Post-Registration Onboarding**: Optional dietary preferences setup

#### 2. Main Application Views

**My Recipes (Default Landing)**
- Recipe list with infinite scroll + "Load More" button
- Search bar with 300ms debounced filtering
- Recipe cards showing: title (2-line truncate), absolute date, edit count badge (if > 1), AI-modified indicator (image from resources)
- Card hover effects with quick actions (view, delete) on desktop
- Empty state: "No data to display on this page"

**Recipe Detail View**
- Full recipe display (title + content)
- Metadata footer: created_at, updated_at, update_counter (format: "Updated 3 times")
- Action toolbar: Edit, Delete, Analyze with AI buttons
- Edit mode: Inline editing of title and content with real-time validation
- AI Analysis modal/side panel:
  - Tabbed view (Original/Modified) on mobile
  - Side-by-side comparison on desktop (lg:)
  - Highlighted changes (yellow background for substitutions)
  - Structured change list: original → substitute + reason
  - Warning banner for unmet constraints (if applicable)
  - Collapsible unmet constraints section
- Delete confirmation modal

**Recipe Creation Page**
- Text area for pasting recipe content
- Real-time character count (title: 1-200, content: 10-50,000)
- Inline validation error messages
- Auto-save drafts to local storage every 60 seconds
- Dismissible info banner (if dietary preferences are not set) explaining AI features unavailable
- Save button with loading state
- Empty state: "No data to display on this page"

**Dietary Preferences Page**
- Diet type selector (vegan, vegetarian, none)
- Forbidden ingredients list manager (add/remove)
- Save button with validation
- Version indicator
- Success/error notifications
- Empty state: "No data to display on this page"

**Profile/Settings Page**
- User information display
- Logout button
- Link to Dietary Preferences management

#### 3. User Flows

**New User Onboarding**
```
Registration → Login → Optional Dietary Preferences Setup → My Recipes
```

**Recipe Creation**
```
My Recipes → Create Recipe → Paste Content → Validate → Save → My Recipes
```

**Recipe Analysis with AI**
```
Recipe Detail → Click "Analyze with AI" → 
  [If no preferences: Modal → Set Preferences → Return to Recipe] →
  API Call → Display Results (Original vs Modified) →
  [Accept → Update Recipe] or [Reject → Keep Original]
```

**Recipe Editing**
```
Recipe Detail → Click Edit → Inline Editing → Save → Increment update_counter
```

### API Integration and State Management Strategy

#### Authentication Management
- **Astro Middleware** (`src/middleware/index.ts`): Validates JWT, injects user session into `context.locals`
- **React AuthContext**: Provides auth state to React components via serialized session prop from Astro
- **Cookie Storage**: httpOnly cookies managed by Supabase for JWT tokens

#### API Integration Patterns

**Server-Side (Astro Pages)**
- Access `context.locals.supabase` for authenticated API calls
- Use `export const prerender = false` for dynamic routes
- Implement Zod validation in API endpoints
- Extract business logic to services in `src/lib/services/`

**Client-Side (React Components)**
- Fetch data from Astro API endpoints (`/api/*`)
- Manage component-local state with React hooks (useState, useReducer)
- Use custom hooks for reusable logic (`src/components/hooks/`)
- Implement optimistic updates with useOptimistic for better UX

#### State Management Approach

**Global State**: Minimal - authentication only via AuthContext
**Local State**: Component-level using React hooks
**Server State**: Direct API calls with loading/error states
**Form State**: Controlled components with real-time validation
**Temporary State**: Session storage for navigation context (e.g., return URLs)
**Persistent State**: Local storage for draft auto-save (every 60 seconds during recipe creation/editing)

#### Data Flow

```
User Action → React Component → 
  Astro API Endpoint (`/api/*`) → 
  Service Layer (`src/lib/services/*`) → 
  Supabase Client (`context.locals.supabase`) → 
  Database (via RLS policies) → 
  Response → Component Update
```

#### Caching Strategy
- No client-side caching for MVP (always fetch fresh data)
- Browser-managed HTTP caching for static assets
- Session storage for temporary navigation state
- Local storage for draft auto-save only

### Responsiveness, Accessibility, and Security Considerations

#### Responsiveness

**Breakpoint Strategy** (Responsive Web Design)
- **Base (< 640px)**: Single column, stacked layouts, full-width components (mobile browsers)
- **sm: (640px)**: Slightly wider cards, improved spacing (mobile/small tablets)
- **md: (768px)**: Two-column recipe grid, enhanced navigation (tablets)
- **lg: (1024px)**: Side-by-side AI comparison, three-column recipe grid, hover states (desktop)

**Key Responsive Patterns**
- Infinite scroll works seamlessly across all viewport sizes
- Tabbed interface for smaller viewports (AI comparison)
- Side-by-side columns for desktop AI comparison
- Collapsible sections for long content on smaller screens
- Touch-friendly button sizes (min 44x44px) for tablet users

#### Accessibility

**ARIA Implementation**
- Landmarks for page regions (main, navigation)
- aria-expanded and aria-controls for collapsible sections
- aria-live regions for dynamic content (loading states, success messages)
- aria-label for icon-only buttons
- aria-describedby for form validation errors
- aria-current for navigation state

**Keyboard Navigation**
- All interactive elements are keyboard-accessible
- Logical tab order
- Focus on visible indicators
- Escape key to close modals
- Enter/Space for button activation

**Screen Reader Support**
- Semantic HTML elements (nav, main, article, section)
- Clear heading hierarchy (h1-h6)
- Descriptive link text (no "click here")
- Alternative text for icons
- Status announcements for async operations

**Visual Accessibility**
- Sufficient color contrast (WCAG AA minimum)
- No color-only information conveyance
- Resizable text without layout breaking
- Focus on indicators visible and clear
- Loading spinners with text alternatives

#### Security Considerations

**Authentication Security**
- JWT tokens in httpOnly cookies (XSS protection)
- Middleware validates tokens on every request
- Automatic redirect to login for 401/403 errors
- Session expiration handling
- CSRF protection via Supabase

**Authorization**
- PostgreSQL RLS policies enforce user data isolation
- All API endpoints require authentication (except /api/health)
- User ID from auth context, never from client input
- No privilege escalation in MVP (single user role)

**Input Validation**
- Zod schemas validate all API inputs
- Client-side validation for immediate feedback
- Server-side validation as source of truth
- Character limits enforced (title: 200, content: 50,000)
- SQL injection prevention via parameterized queries

**Output Security**
- XSS prevention via React's automatic escaping
- Sanitize user-generated content before display
- Content Security Policy headers
- CORS configuration for trusted domains only

**API Security**
- Request size limits (max 1MB)
- Error messages don't leak sensitive information
- Logging for security monitoring

### Component Architecture

#### Astro Components (Static/SSR)
- `Layout.astro`: Main layout wrapper with navigation
- `RecipeCard.astro`: Static recipe card for server-rendered lists
- `ErrorMessage.astro`: Reusable error display
- `LoadingSkeleton.astro`: Loading state placeholders

#### React Components (Interactive)
- `RecipeList.tsx`: Infinite scroll recipe list with search
- `RecipeDetail.tsx`: Recipe display with edit/delete/analyze actions
- `RecipeForm.tsx`: Recipe creation/editing form with validation
- `AIAnalysisModal.tsx`: AI comparison and suggestion acceptance
- `DietaryPreferencesForm.tsx`: Preferences management form
- `AuthForm.tsx`: Login/registration forms
- `ConfirmationModal.tsx`: Reusable confirmation dialog
- `InfoBanner.tsx`: Dismissible info banner component

#### Shared UI Components (Shadcn/ui)
- Button, Input, Textarea, Card, Badge, Tabs, Modal, Alert, Spinner

### Error Handling Strategy

**Client-Side Errors**
- Form validation errors: Inline near fields
- Network errors: Retry button with exponential backoff
- 404 errors: Inline "Not found" message
- Generic errors: Toast notifications (3 seconds auto-dismiss)
- Success notifications: Toast notifications (3 seconds auto-dismiss)

**Server-Side Errors**
- 400 Bad Request: Return validation errors in structured format
- 401/403 Unauthorized: Redirect to login page
- 404 Not Found: Return error message for display
- 409 Conflict: Return specific conflict details
- 503 Service Unavailable: Return retry-after header, show retry UI

**AI Service Errors**
- Timeout: Show retry option
- Rate limiting (429): Display wait time
- Service unavailable (503): Explain temporary issue, offer retry

### Performance Optimization

**Bundle Optimization**
- React.lazy() for code splitting heavy components
- Astro islands for partial hydration
- Tree shaking via ES modules
- Minimize client-side JavaScript

**Rendering Optimization**
- React.memo() for expensive recipe cards
- useCallback for event handlers passed to children
- useMemo for expensive calculations (e.g., recipe formatting)
- Debounced search input (300ms)

**Network Optimization**
- Pagination limits API response size
- Optimistic UI updates for better perceived performance
- Image optimization via Astro Image integration
- Request deduplication where possible

## Resolved Specifications

### Implementation Details

All minor clarifications have been resolved with the following specifications:

1. **Recipe AI-Modified Indicator**: Visual indicator (icon, badge, color) will be provided as an image file in project resources.

2. **Auto-Save Draft Timing**: Recipe drafts auto-save to local storage every 60 seconds during creation/editing.

3. **Version History Display Format**: Update counter displays as "Updated X times" (e.g., "Updated 3 times").

4. **Empty States Content**: Universal empty state message for all pages: "No data to display on this page".

5. **Success Notification Duration**: Toast notifications (success and error) auto-dismiss after 3 seconds.

6. **Date Format**: Always use absolute date format (e.g., "Jan 15, 2025") - no relative dates ("2 days ago").

7. **Loading Skeleton Design**: Will be addressed during implementation phase.

8. **Dietary Preferences Maximum Items**: API limitation will be adjusted separately - no UI-specific handling needed in MVP.

### Notes

All architectural decisions have been finalized. The UI architecture is ready for implementation with complete specifications for:
- User flows and navigation
- API integration patterns
- State management strategy
- Responsive design breakpoints
- Accessibility requirements
- Security considerations
- Error handling
- Performance optimization
- Component architecture

**Key MVP Scope Clarifications:**
- Web application only (no mobile app version)
- No rate limiting implementation required
- Auto-save interval: 60 seconds
- Success notifications: 3 seconds duration
- Date format: Always absolute (never relative)
- Empty states: Universal "No data to display on this page" message
# UI Architecture Planning Summary

## Decisions

1. **Recipe List Pagination**: Implement infinite scrolling with a "Load More" button as fallback for accessibility. Start with 20 recipes per page, display loading skeleton during fetch.

2. **Recipe Analysis Flow**: Recipe analysis is separate from recipe creation. Users paste and create valid recipes first, then can analyze saved recipes with AI when desired.

3. **Dietary Preferences Onboarding**: Optional onboarding step after registration with "Skip for now" option. Show persistent banner on recipe creation page if preferences aren't set, explaining AI features won't work without them.

4. **Error State Handling**: Unified error handling with specific messages per status code: 401/403 redirect to login, 404 inline "Not found", 409 validation errors near form fields, 503 retry with exponential backoff for AI services.

5. **Recipe Search**: Simple search bar above recipe list filtering by title with debounced input (300ms).

6. **Navigation Structure**: Top navigation bar with "My Recipes" (default landing), "Dietary Preferences", and "Profile/Settings" sections.

7. **Recipe Detail View Actions**: Include Delete, Edit, and Analyze buttons. Delete with confirmation modal, Edit for manual modifications, Analyze for AI modifications.

8. **Mobile Responsiveness**: Mobile-first design prioritizing sm: (640px) and md: (768px) breakpoints. Desktop (lg: 1024px) uses two-column layout for recipe analysis comparison.

9. **Authentication State Management**: Astro middleware checks auth and injects user session into context.locals. AuthContext provider for React components reading from serialized session prop. JWT in httpOnly cookies managed by Supabase.

10. **AI Feature Usage**: AI used only when user clicks "Analyze" button on Recipe Detail View, not automatically during creation.

11. **Recipe Edit Flow**: Users can edit recipes manually or with AI. Each save increments update_counter. Show version history indicator (e.g., "Updated 3 times") without full version history in MVP.

12. **AI Analysis Results Storage**: Store AI analysis results temporarily in component state only. Display in modal/side panel. If accepted, update recipe via PUT /api/recipes/{id} which increments update_counter. Don't persist analysis metadata.

13. **Recipe Creation Validation**: Basic validation: title (1-200 chars), content (10-50,000 chars), recipe structure check. Real-time character count. Zod schema matching API. Inline validation errors.

14. **Dietary Preferences Empty State**: AI analysis forbidden without dietary preferences. Show modal explaining requirement with "Set Preferences Now" button navigating to preferences page. Cache return URL in session storage.

15. **AI Analysis Button Placement**: "Analyze with AI" button in action toolbar alongside Edit and Delete with distinctive accent color and AI icon. Show loading spinner with "Analyzing..." when processing.

16. **Recipe Modification Comparison UI**: Tabbed interface ("Original"/"Modified") for mobile. Side-by-side columns on desktop (lg:). Highlight changes with colored background (yellow for substitutions). List all changes below in structured format: original → substitute + reason.

17. **AI Analysis Unmet Constraints Display**: Warning banner at top with "⚠️ Some constraints couldn't be met". Collapsible section listing each unmet constraint with type and description. Orange/amber color scheme for partial success.

18. **Multiple AI Analysis Attempts**: Allow unlimited analysis attempts. Each "Analyze" click makes fresh API call with current dietary preferences. Add rate limiting notification if API returns 429.

19. **Recipe List Item Display**: Show recipe title (truncated to 2 lines), creation date (absolute date format), update counter badge if > 1 (format: "Updated 3 times"), visual indicator if AI-modified (image from project resources). Card layout with hover effect. Quick action icons (delete, view) on hover for desktop.

20. **Onboarding Banner Persistence**: Dismissible with "×" button, re-shows each session until preferences set. Store dismissal in session storage. Position: top of page below navigation. Info color scheme (blue).

## Matched Recommendations

1. **Infinite Scrolling Implementation**: Use infinite scroll with "Load More" fallback, 20 items per page, loading skeleton during fetch for better UX and accessibility.

2. **Separate Recipe Creation and Analysis**: Clear separation between saving recipes and analyzing them improves user control and simplifies workflow.

3. **Guided Onboarding**: Optional dietary preferences setup after registration with clear communication about AI feature dependencies.

4. **Comprehensive Error Handling**: Status-code-specific error handling with appropriate UI responses ensures robust user experience.

5. **Simple Search Functionality**: Debounced search (300ms) minimizes API calls while providing responsive search experience.

6. **Clean Navigation Structure**: Three-section navigation keeps MVP scope focused on core features.

7. **Complete Recipe Detail Actions**: Edit, Delete, and Analyze buttons provide full CRUD + AI capabilities on single view.

8. **Mobile-First Responsive Design**: Prioritize mobile breakpoints with progressive enhancement for desktop views.

9. **Secure Authentication Pattern**: Middleware-based auth with context propagation to React components follows Astro best practices.

10. **On-Demand AI Analysis**: User-initiated AI analysis respects user control and reduces unnecessary API calls.

11. **Manual and AI Edit Support**: Flexible editing approach accommodates both manual tweaks and AI-powered modifications.

12. **Ephemeral Analysis Results**: Temporary storage of AI suggestions keeps data model simple and allows re-analysis with updated preferences.

13. **Real-Time Validation Feedback**: Character counts and inline errors improve form completion success rate.

14. **Clear AI Prerequisites Communication**: Modal explaining missing dietary preferences prevents confusion and guides users to correct setup.

15. **Prominent AI Action Visibility**: Distinctive styling and loading states for AI button provide clear feedback during processing.

16. **Responsive Comparison Layout**: Tabbed mobile view and side-by-side desktop view optimizes screen real estate for each context.

17. **Transparent Constraint Communication**: Warning banners and detailed unmet constraints list manage user expectations when AI cannot fully adapt recipes.

18. **Iterative Analysis Support**: Unlimited analysis attempts enable users to refine preferences and immediately see impact.

19. **Information-Rich Recipe Cards**: Display key metadata (title, absolute date, edit count, AI indicator from resources) helps users quickly identify and navigate recipes.

20. **Smart Banner Persistence**: Session-based dismissal balances user control with persistent guidance toward feature completion.

