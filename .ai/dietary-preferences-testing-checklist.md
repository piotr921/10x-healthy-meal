# Dietary Preferences View - Testing Checklist

## Authentication Tests
- [x] Authenticated users can access `/app/profile/preferences`
- [x] Unauthenticated users are redirected to home page

## Initial Load Tests
- [x] Loading state displays spinner while fetching preferences
- [x] 404 response loads default preferences (diet_type: 'none', forbidden_ingredients: [])
- [x] Existing preferences are loaded and displayed correctly
- [x] Fetch errors display error message with retry button

## Diet Type Selection Tests
- [x] Can select "No specific diet" (none)
- [x] Can select "Vegetarian"
- [x] Can select "Vegan"
- [x] Selection updates local state immediately

## Forbidden Ingredients Tests
- [x] Input field is properly labeled
- [x] Can type ingredient name into input field
- [x] "Add" button is disabled when input is empty
- [x] Can add ingredient by clicking "Add" button
- [x] Can add ingredient by pressing Enter key
- [x] Input field clears after adding ingredient
- [x] Duplicate ingredients show warning message
- [x] Duplicate warning auto-dismisses after 3 seconds
- [x] Ingredients display as badges with remove buttons
- [x] Can remove ingredient by clicking "×" button
- [x] Empty list shows "No forbidden ingredients added yet" message

## Save Functionality Tests
- [x] "Save Changes" button submits form
- [x] Button shows "Saving..." text while saving
- [x] Button is disabled while saving
- [x] Success message displays after successful save
- [x] Success message auto-dismisses after 3 seconds
- [x] Error message displays on save failure
- [x] 401 errors redirect to login page

## Accessibility Tests
- [x] All form controls have proper labels
- [x] ARIA live regions for success/error messages
- [x] aria-label on input field
- [x] aria-describedby links duplicate warning to input
- [x] Remove buttons have descriptive aria-labels
- [x] Ingredient list has role="list" and role="listitem"
- [x] Keyboard navigation works for all interactive elements
- [x] Focus rings visible on buttons
- [x] Success messages use role="alert" with aria-live="polite"
- [x] Error messages use role="alert" with aria-live="assertive"

## Responsive Design Tests
- [x] Layout works on mobile screens (sm)
- [x] Layout works on tablet screens (md)
- [x] Layout works on desktop screens (lg)
- [x] Save button is full-width on mobile, auto-width on larger screens
- [x] Cards stack properly on all screen sizes

## Edge Cases
- [x] Trimmed whitespace from ingredient input
- [x] Prevents duplicate ingredients (case-sensitive)
- [x] Handles empty ingredient input gracefully
- [x] Network errors handled appropriately
- [x] Component handles null/undefined preferences state

## Navigation Tests
- [x] Header link points to correct path: `/app/profile/preferences`
- [x] Navigation between pages preserves authentication state

