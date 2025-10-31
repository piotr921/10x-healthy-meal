import { useState } from 'react';
import { useRecipeDetail } from '../hooks/useRecipeDetail';
import { LoadingState } from './LoadingState';
import { ErrorState } from './ErrorState';
import { RecipeDetailContent } from './RecipeDetailContent';
import { AIAnalysisModal } from './AIAnalysisModal';
import type { RecipeDetailViewProps, RecipeAnalysisResponseDTO, UpdateRecipeCommand } from '../../types';

/**
 * RecipeDetailView is the main container component for the recipe detail page
 * Manages data fetching, loading, and error states using the useRecipeDetail hook
 */
export function RecipeDetailView({ recipeId }: RecipeDetailViewProps) {
  const { recipe, isLoading, error, deleteRecipe, refetch } = useRecipeDetail(recipeId);

  // AI Analysis state
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<RecipeAnalysisResponseDTO | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Handle edit navigation
  const handleEdit = () => {
    window.location.href = `/app/recipes/${recipeId}/edit`;
  };

  // Handle AI analysis
  const handleAnalyze = async () => {
    setIsAnalysisModalOpen(true);
    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisResult(null);

    try {
      const response = await fetch(`/api/recipes/${recipeId}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data: RecipeAnalysisResponseDTO = await response.json();
        setAnalysisResult(data);
        setAnalysisError(null);
      } else {
        const errorData = await response.json().catch(() => ({ error: { message: 'Failed to analyze recipe' } }));
        setAnalysisError(errorData.error?.message || 'Failed to analyze recipe');
        setAnalysisResult(null);
      }
    } catch (err) {
      console.error('Error analyzing recipe:', err);
      setAnalysisError('Failed to analyze recipe. Please check your connection.');
      setAnalysisResult(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle accepting AI modifications
  const handleAcceptModifications = async () => {
    if (!analysisResult) return;

    try {
      const updateCommand: UpdateRecipeCommand = {
        title: analysisResult.modified.title,
        content: analysisResult.modified.content
      };

      const response = await fetch(`/api/recipes/${recipeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateCommand)
      });

      if (response.ok) {
        // Close modal and refresh recipe data
        setIsAnalysisModalOpen(false);
        setAnalysisResult(null);
        await refetch();
      } else {
        const errorData = await response.json().catch(() => ({ error: { message: 'Failed to save modifications' } }));
        setAnalysisError(errorData.error?.message || 'Failed to save modifications');
      }
    } catch (err) {
      console.error('Error saving modifications:', err);
      setAnalysisError('Failed to save modifications. Please try again.');
    }
  };

  // Handle canceling/closing the analysis modal
  const handleCancelAnalysis = () => {
    setIsAnalysisModalOpen(false);
    setAnalysisResult(null);
    setAnalysisError(null);
  };

  // Show loading state during initial fetch
  if (isLoading) {
    return <LoadingState />;
  }

  // Show error state if fetch failed
  if (error) {
    return (
      <ErrorState
        error={error}
        statusCode={error.toLowerCase().includes('not found') ? 404 : undefined}
        onRetry={error.toLowerCase().includes('not found') ? undefined : refetch}
      />
    );
  }

  // Show error state if recipe is null (shouldn't happen if no error, but handle it)
  if (!recipe) {
    return (
      <ErrorState
        error="Recipe not found"
        statusCode={404}
      />
    );
  }

  // Show recipe content
  return (
    <>
      <RecipeDetailContent
        recipe={recipe}
        onEdit={handleEdit}
        onDelete={deleteRecipe}
        onAnalyze={handleAnalyze}
      />

      <AIAnalysisModal
        isOpen={isAnalysisModalOpen}
        isAnalyzing={isAnalyzing}
        analysisResult={analysisResult}
        error={analysisError}
        onAccept={handleAcceptModifications}
        onCancel={handleCancelAnalysis}
      />
    </>
  );
}

