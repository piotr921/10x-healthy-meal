import { useEffect, useState, useCallback, useRef } from 'react';
import type { RecipeDTO, UseRecipeDetailReturn, ErrorResponseDTO } from '../../types';

/**
 * Custom hook for managing recipe detail data fetching and deletion
 * @param recipeId - UUID of the recipe to fetch and manage
 * @returns Recipe data, loading states, error state, and action functions
 */
export function useRecipeDetail(recipeId: string): UseRecipeDetailReturn {
  const [recipe, setRecipe] = useState<RecipeDTO | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Fetches recipe data from the API
   */
  const fetchRecipe = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(`/api/recipes/${recipeId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        signal: abortControllerRef.current.signal
      });

      if (response.ok) {
        const data: RecipeDTO = await response.json();
        setRecipe(data);
        setError(null);
      } else if (response.status === 404) {
        setError('Recipe not found');
        setRecipe(null);
      } else if (response.status === 401) {
        // Redirect to login for unauthorized access
        window.location.href = '/';
        return;
      } else {
        // Try to parse error response
        try {
          const errorData: ErrorResponseDTO = await response.json();
          setError(errorData.error.message || 'Failed to load recipe');
        } catch {
          setError('Failed to load recipe');
        }
        setRecipe(null);
      }
    } catch (err) {
      // Don't set error if request was aborted (component unmounted)
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Error fetching recipe:', err);
        setError('Failed to load recipe. Please check your connection.');
        setRecipe(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, [recipeId]);

  /**
   * Deletes the recipe and navigates to recipe list
   */
  const deleteRecipe = useCallback(async (): Promise<void> => {
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/recipes/${recipeId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Navigate to recipe list after successful deletion
        window.location.href = '/app/recipes';
      } else {
        // Try to parse error response
        try {
          const errorData: ErrorResponseDTO = await response.json();
          setError(errorData.error.message || 'Failed to delete recipe');
        } catch {
          setError('Failed to delete recipe');
        }
        setIsDeleting(false);
      }
    } catch (err) {
      console.error('Error deleting recipe:', err);
      setError('Failed to delete recipe. Please try again.');
      setIsDeleting(false);
    }
  }, [recipeId]);

  /**
   * Refetches recipe data (used for retry after errors)
   */
  const refetch = useCallback(async (): Promise<void> => {
    await fetchRecipe();
  }, [fetchRecipe]);

  // Fetch recipe on mount and when recipeId changes
  useEffect(() => {
    fetchRecipe();

    // Cleanup: abort ongoing request when component unmounts
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchRecipe]);

  return {
    recipe,
    isLoading,
    error,
    deleteRecipe,
    isDeleting,
    refetch
  };
}

