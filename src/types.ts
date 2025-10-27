import type {Database, Tables, TablesInsert, TablesUpdate, Enums} from './db/database.types';

// =============================================================================
// Database Entity Type Aliases
// =============================================================================

export type DietaryPreferencesEntity = Tables<'dietary_preferences'>;
export type ForbiddenIngredientsEntity = Tables<'forbidden_ingredients'>;
export type RecipeEntity = Tables<'recipes'>;

export type DietaryPreferencesInsert = TablesInsert<'dietary_preferences'>;
export type ForbiddenIngredientsInsert = TablesInsert<'forbidden_ingredients'>;
export type RecipeInsert = TablesInsert<'recipes'>;

export type DietaryPreferencesUpdate = TablesUpdate<'dietary_preferences'>;
export type ForbiddenIngredientsUpdate = TablesUpdate<'forbidden_ingredients'>;
export type RecipeUpdate = TablesUpdate<'recipes'>;

export type DietType = Enums<'diet_type_enum'>;

// =============================================================================
// Dietary Preferences DTOs and Commands
// =============================================================================

/**
 * DTO for dietary preferences response that combines dietary_preferences
 * and forbidden_ingredients data into a single object
 */
export interface DietaryPreferencesDTO {
  id: string;
  diet_type: DietType;
  forbidden_ingredients: string[];
  version: number;
  created_at: string;
  updated_at: string;
}

/**
 * Command for creating dietary preferences for a specific user
 * Used in POST /api/users/{userId}/dietary-preferences
 */
export interface CreateDietaryPreferencesCommand {
  diet_type: DietType;
  forbidden_ingredients: string[];
}

/**
 * Command for updating dietary preferences for the current user
 * Used in PUT /api/dietary-preferences
 */
export interface UpdateDietaryPreferencesCommand {
  diet_type: DietType;
  forbidden_ingredients: string[];
}

// =============================================================================
// Recipe DTOs and Commands
// =============================================================================

/**
 * DTO for recipe responses - excludes sensitive fields like user_id and deleted_at
 */
export type RecipeDTO = Omit<RecipeEntity, 'user_id' | 'deleted_at'>;

/**
 * Command for creating a new recipe
 * Used in POST /api/recipes
 */
export type CreateRecipeCommand = Pick<RecipeInsert, 'title' | 'content'>;

/**
 * Command for updating an existing recipe
 * Used in PUT /api/recipes/{id}
 */
export interface UpdateRecipeCommand {
  title: string;
  content: string;
}

/**
 * Pagination metadata for recipe list responses
 */
export interface PaginationMetadata {
  current_page: number;
  total_pages: number;
  total_count: number;
  limit: number;
}

/**
 * DTO for paginated recipe list response
 * Used in GET /api/recipes
 */
export interface RecipeListResponseDTO {
  recipes: RecipeDTO[];
  pagination: PaginationMetadata;
}

// =============================================================================
// Recipe Analysis DTOs and Commands (AI Integration)
// =============================================================================

/**
 * Command for analyzing a recipe with AI
 * Used in POST /api/recipes/analyze
 */
export interface AnalyzeRecipeCommand {
  title: string;
  content: string;
}

/**
 * Types of changes that can be suggested by AI analysis
 */
export type ChangeType = 'ingredient_substitution' | 'instruction_modification';

/**
 * Individual change suggestion from AI analysis
 */
export interface ChangeSuggestion {
  type: ChangeType;
  original: string;
  suggested: string;
  reason: string;
}

/**
 * Types of dietary constraints that may not be met
 */
export type ConstraintType = 'forbidden_ingredient' | 'diet_restriction';

/**
 * Unmet dietary constraint identified by AI analysis
 */
export interface UnmetConstraint {
  type: ConstraintType;
  description: string;
  ingredient: string;
}

/**
 * AI-suggested modifications to a recipe
 */
export interface SuggestedModifications {
  title: string;
  content: string;
  changes: ChangeSuggestion[];
}

/**
 * Original recipe data for AI analysis response
 */
export interface OriginalRecipe {
  title: string;
  content: string;
}

/**
 * Complete response from AI recipe analysis
 * Used in POST /api/recipes/analyze response
 */
export interface RecipeAnalysisDTO {
  original_recipe: OriginalRecipe;
  suggested_modifications: SuggestedModifications;
  unmet_constraints: UnmetConstraint[];
  can_fully_adapt: boolean;
}

// =============================================================================
// Health Check DTO
// =============================================================================

/**
 * DTO for API health check response
 * Used in GET /api/health
 */
export interface HealthCheckDTO {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  version: string;
}

// =============================================================================
// Query Parameters Types
// =============================================================================

/**
 * Query parameters for recipe list endpoint
 * Used in GET /api/recipes
 */
export interface RecipeListQueryParams {
  page?: number;
  limit?: number;
  search?: string;
}

// =============================================================================
// Error Response Types
// =============================================================================

/**
 * Validation error detail
 */
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

/**
 * Standard error response structure
 */
export interface ErrorResponseDTO {
  error: {
    message: string;
    code?: string;
    details?: ValidationError[];
  };
  timestamp: string;
}

// =============================================================================
// Success Response Types
// =============================================================================

/**
 * Generic success response for operations that don't return data
 */
export interface SuccessResponseDTO {
  message: string;
  timestamp?: string;
}

// =============================================================================
// Recipe Detail View Types
// =============================================================================

/**
 * Main view state model for Recipe Detail View
 */
export interface RecipeDetailViewModel {
  recipe: RecipeDTO | null;      // Recipe data, null during loading or on error
  isLoading: boolean;            // True during initial fetch
  error: string | null;          // Error message if fetch failed
}

/**
 * Props for RecipeDetailView component
 */
export interface RecipeDetailViewProps {
  recipeId: string;              // UUID of recipe to display
}

/**
 * Props for RecipeDetailContent component
 */
export interface RecipeDetailContentProps {
  recipe: RecipeDTO;             // Recipe data to display
  onEdit: () => void;            // Callback for edit action
  onDelete: () => void;          // Callback for delete action
  onAnalyze: () => void;         // Callback for AI analyze action
}

/**
 * Props for RecipeHeader component
 */
export interface RecipeHeaderProps {
  title: string;                 // Recipe title
  createdAt: string;             // ISO8601 creation timestamp
  updatedAt: string;             // ISO8601 update timestamp
  updateCounter: number;         // Number of updates
}

/**
 * Props for RecipeMetadata component
 */
export interface RecipeMetadataProps {
  createdAt: string;             // ISO8601 creation timestamp
  updatedAt: string;             // ISO8601 update timestamp
  updateCounter: number;         // Number of updates
}

/**
 * Props for RecipeContent component
 */
export interface RecipeContentProps {
  content: string;               // Full recipe text content
}

/**
 * Props for RecipeActions component
 */
export interface RecipeActionsProps {
  onEdit: () => void;            // Callback for edit button
  onAnalyze: () => void;         // Callback for analyze button
  onDelete: () => void;          // Callback for delete button
}

/**
 * Props for ConfirmDeleteModal component
 */
export interface ConfirmDeleteModalProps {
  isOpen: boolean;               // Modal visibility state
  recipeTitle: string;           // Recipe title for confirmation message
  isDeleting: boolean;           // Loading state during deletion
  onConfirm: () => Promise<void>; // Async delete confirmation handler
  onCancel: () => void;          // Cancel/close handler
}

/**
 * Props for ErrorState component
 */
export interface ErrorStateProps {
  error: string;                 // Error message to display
  statusCode?: number;           // Optional HTTP status code
  onRetry?: () => void;          // Optional retry callback
}

/**
 * Return type for useRecipeDetail custom hook
 */
export interface UseRecipeDetailReturn {
  recipe: RecipeDTO | null;      // Fetched recipe data
  isLoading: boolean;            // Loading state
  error: string | null;          // Error message
  deleteRecipe: () => Promise<void>; // Delete function
  isDeleting: boolean;           // Deleting state
  refetch: () => Promise<void>;  // Refetch function for retry
}

