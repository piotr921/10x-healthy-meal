import { useState, useEffect, useCallback } from 'react';
import type { RecipeDTO, RecipeListResponseDTO, PaginationMetadata } from '@/types';

const API_URL = '/api/recipes';

export function useRecipes() {
  const [recipes, setRecipes] = useState<RecipeDTO[]>([]);
  const [pagination, setPagination] = useState<PaginationMetadata | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [page, setPage] = useState<number>(1);

  const fetchRecipes = useCallback(async (currentPage: number, currentSearchTerm: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: '20',
      });
      if (currentSearchTerm) {
        params.append('search', currentSearchTerm);
      }
      const response = await fetch(`${API_URL}?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch recipes');
      }
      const data: RecipeListResponseDTO = await response.json();

      if (currentPage === 1) {
        setRecipes(data.recipes);
      } else {
        setRecipes(prevRecipes => [...prevRecipes, ...data.recipes]);
      }
      setPagination(data.pagination);
    } catch (e) {
      setError(e as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setPage(1);
    fetchRecipes(1, searchTerm);
  }, [searchTerm, fetchRecipes]);

  const loadMore = () => {
    if (pagination && pagination.current_page < pagination.total_pages && !isLoading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchRecipes(nextPage, searchTerm);
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  return {
    recipes,
    isLoading,
    error,
    pagination,
    searchTerm,
    loadMore,
    setSearchTerm: handleSearch,
  };
}

