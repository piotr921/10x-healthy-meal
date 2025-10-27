import { useState } from 'react';
import { RecipeHeader } from './RecipeHeader';
import { RecipeContent } from './RecipeContent';
import { RecipeActions } from './RecipeActions';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import type { RecipeDetailContentProps } from '../../types';

/**
 * RecipeDetailContent component orchestrates the display of recipe details
 * Manages delete modal state and coordinates child components
 */
export function RecipeDetailContent({
  recipe,
  onEdit,
  onDelete,
  onAnalyze
}: RecipeDetailContentProps) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await onDelete();
      // Modal will close automatically when navigation occurs
    } catch (error) {
      console.error('Delete failed:', error);
      setIsDeleting(false);
      // Keep modal open so user can retry or cancel
    }
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <RecipeHeader
        title={recipe.title}
        createdAt={recipe.created_at}
        updatedAt={recipe.updated_at}
        updateCounter={recipe.update_counter}
      />

      <RecipeContent content={recipe.content} />

      <RecipeActions
        onEdit={onEdit}
        onAnalyze={onAnalyze}
        onDelete={handleDeleteClick}
      />

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        recipeTitle={recipe.title}
        isDeleting={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </div>
  );
}

