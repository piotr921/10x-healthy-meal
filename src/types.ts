// ============================================
// Response DTOs
// ============================================

/**
 * Standard success response structure
 */
export interface SuccessResponseDTO {
  message: string;
  timestamp?: string;
}

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

// ============================================
// Recipe Types
// ============================================

/**
 * Recipe entity from database
 */
export interface RecipeEntity {
  id: string;
  user_id: string;
  title: string;
  content: string;
  update_counter: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/**
 * Recipe Data Transfer Object (excludes sensitive fields)
 */
export interface RecipeDTO {
  id: string;
  title: string;
  content: string;
  update_counter: number;
  created_at: string;
  updated_at: string;
}

/**
 * Command model for creating a recipe
 */
export interface CreateRecipeCommand {
  title: string;
  content: string;
}

/**
 * Command model for updating a recipe
 */
export interface UpdateRecipeCommand {
  title: string;
  content: string;
}

/**
 * Recipe data for database insertion
 */
export interface RecipeInsert {
  user_id: string;
  title: string;
  content: string;
  update_counter: number;
}

/**
 * Query parameters for recipe list endpoint
 */
export interface RecipeListQueryParams {
  page?: number;
  limit?: number;
  search?: string;
}

/**
 * Pagination metadata
 */
export interface PaginationMetadata {
  current_page: number;
  total_pages: number;
  total_count: number;
  limit: number;
}

/**
 * Response for recipe list endpoint
 */
export interface RecipeListResponseDTO {
  recipes: RecipeDTO[];
  pagination: PaginationMetadata;
}

// ============================================
// Dietary Preferences Types
// ============================================

/**
 * Diet type enumeration
 */
export type DietType = 'vegan' | 'vegetarian' | 'none';

/**
 * Command model for creating dietary preferences
 */
export interface CreateDietaryPreferencesCommand {
  diet_type: DietType;
  forbidden_ingredients: string[];
}

/**
 * Command model for updating dietary preferences
 */
export interface UpdateDietaryPreferencesCommand {
  diet_type: DietType;
  forbidden_ingredients: string[];
}

/**
 * Dietary Preferences Data Transfer Object
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
 * Dietary Preferences View Model (client-side form state)
 */
export interface DietaryPreferencesViewModel {
  diet_type: DietType;
  forbidden_ingredients: string[];
}

// ============================================
// Recipe Analysis Types
// ============================================

/**
 * Response from AI recipe analysis endpoint
 */
export interface RecipeAnalysisResponseDTO {
  original: {
    title: string;
    content: string;
  };
  modified: {
    title: string;
    content: string;
  };
  modifications_summary: string;
}

/**
 * Props for AI Analysis Modal component
 */
export interface AIAnalysisModalProps {
  isOpen: boolean;
  isAnalyzing: boolean;
  analysisResult: RecipeAnalysisResponseDTO | null;
  error: string | null;
  onAccept: () => Promise<void>;
  onCancel: () => void;
}

/**
 * Props for RecipeActions component
 */
export interface RecipeActionsProps {
  onEdit: () => void;
  onAnalyze: () => void;
  onDelete: () => void;
}

/**
 * Props for RecipeDetailView component
 */
export interface RecipeDetailViewProps {
  recipeId: string;
}

/**
 * Props for RecipeDetailContent component
 */
export interface RecipeDetailContentProps {
  recipe: RecipeDTO;
  onEdit: () => void;
  onDelete: () => Promise<void>;
  onAnalyze: () => void;
}

/**
 * Props for ConfirmDeleteModal component
 */
export interface ConfirmDeleteModalProps {
  isOpen: boolean;
  recipeTitle: string;
  isDeleting: boolean;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

