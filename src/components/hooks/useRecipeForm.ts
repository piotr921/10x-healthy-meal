import { useState, useCallback } from 'react';
import type { RecipeDTO, CreateRecipeCommand, UpdateRecipeCommand } from '@/types';

interface ValidationErrors {
  title?: string;
  content?: string;
}

interface UseRecipeFormOptions {
  recipe?: RecipeDTO;
  isEditMode?: boolean;
}

interface UseRecipeFormReturn {
  title: string;
  content: string;
  isSubmitting: boolean;
  error: string | null;
  validationErrors: ValidationErrors;
  showConfirmDialog: boolean;
  setTitle: (title: string) => void;
  setContent: (content: string) => void;
  clearValidationError: (field: 'title' | 'content') => void;
  handleSubmit: (e: React.FormEvent) => void;
  handleConfirmSave: () => Promise<void>;
  handleCancelSave: () => void;
}

/**
 * Custom hook for managing recipe form state and submission logic
 * Handles both create and edit modes
 */
export function useRecipeForm({ recipe, isEditMode = false }: UseRecipeFormOptions): UseRecipeFormReturn {
  const [title, setTitle] = useState(recipe?.title || '');
  const [content, setContent] = useState(recipe?.content || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  /**
   * Validates the form fields
   * @returns true if validation passes, false otherwise
   */
  const validateForm = useCallback((): boolean => {
    const errors: ValidationErrors = {};

    // Validate title
    if (!title.trim()) {
      errors.title = 'Title is required';
    } else if (title.length < 3) {
      errors.title = 'Title must be at least 3 characters long';
    } else if (title.length > 200) {
      errors.title = 'Title must not exceed 200 characters';
    }

    // Validate content
    if (!content.trim()) {
      errors.content = 'Recipe content is required';
    } else if (content.length < 10) {
      errors.content = 'Recipe content must be at least 10 characters long';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [title, content]);

  /**
   * Clears a specific validation error
   */
  const clearValidationError = useCallback((field: 'title' | 'content') => {
    setValidationErrors((prev) => ({ ...prev, [field]: undefined }));
  }, []);

  /**
   * Handles form submission
   * Shows confirmation dialog if validation passes
   */
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();

    // Guard clause: validate form
    if (!validateForm()) {
      return;
    }

    // Show confirmation dialog
    setShowConfirmDialog(true);
  }, [validateForm]);

  /**
   * Handles confirmed save action
   * Calls API and handles response
   */
  const handleConfirmSave = useCallback(async () => {
    setShowConfirmDialog(false);
    setIsSubmitting(true);
    setError(null);

    const command: CreateRecipeCommand | UpdateRecipeCommand = {
      title: title.trim(),
      content: content.trim(),
    };

    try {
      // Determine API endpoint and method
      const url = isEditMode && recipe ? `/api/recipes/${recipe.id}` : '/api/recipes';
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(command),
      });

      // Guard clause: handle non-ok responses
      if (!response.ok) {
        const errorData = await response.json();

        if (errorData.error?.code === 'DUPLICATE_TITLE') {
          setValidationErrors({ title: 'A recipe with this title already exists' });
        } else if (errorData.error?.details) {
          // Handle validation errors from API
          const apiErrors: ValidationErrors = {};
          errorData.error.details.forEach((detail: any) => {
            if (detail.path && detail.path[0]) {
              apiErrors[detail.path[0] as 'title' | 'content'] = detail.message;
            }
          });
          setValidationErrors(apiErrors);
        } else {
          setError(errorData.error?.message || `Failed to ${isEditMode ? 'update' : 'create'} recipe`);
        }
        return;
      }

      const responseData = await response.json();
      const recipeId = responseData.data?.id || recipe?.id;

      // Success - redirect to recipe detail page or recipes list
      window.location.href = isEditMode && recipeId ? `/app/recipes/${recipeId}` : '/app/recipes';
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error(`Recipe ${isEditMode ? 'update' : 'creation'} error:`, err);
    } finally {
      setIsSubmitting(false);
    }
  }, [title, content, isEditMode, recipe]);

  /**
   * Handles cancel action in confirmation dialog
   */
  const handleCancelSave = useCallback(() => {
    setShowConfirmDialog(false);
  }, []);

  return {
    title,
    content,
    isSubmitting,
    error,
    validationErrors,
    showConfirmDialog,
    setTitle,
    setContent,
    clearValidationError,
    handleSubmit,
    handleConfirmSave,
    handleCancelSave,
  };
}

