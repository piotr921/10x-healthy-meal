import React from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useRecipeForm } from '@/components/hooks/useRecipeForm';
import { ConfirmSaveModal } from './ConfirmSaveModal';
import type { RecipeDTO } from '@/types';

export interface RecipeFormProps {
  recipe?: RecipeDTO;
  isEditMode?: boolean;
}

const RecipeForm: React.FC<RecipeFormProps> = ({ recipe, isEditMode = false }) => {
  const {
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
  } = useRecipeForm({ recipe, isEditMode });

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg border shadow-sm">
      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="title" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          Recipe Title <span className="text-destructive">*</span>
        </label>
        <Input
          id="title"
          type="text"
          placeholder="e.g., Grandma's Chocolate Chip Cookies"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (validationErrors.title) {
              clearValidationError('title');
            }
          }}
          className={validationErrors.title ? 'border-destructive' : ''}
          disabled={isSubmitting}
          maxLength={200}
        />
        {validationErrors.title && (
          <p className="text-sm text-destructive">{validationErrors.title}</p>
        )}
        <p className="text-xs text-muted-foreground">
          {title.length}/200 characters
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="content" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          Recipe Content <span className="text-destructive">*</span>
        </label>
        <Textarea
          id="content"
          placeholder="Enter your recipe ingredients and instructions..."
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            if (validationErrors.content) {
              clearValidationError('content');
            }
          }}
          className={validationErrors.content ? 'border-destructive' : ''}
          disabled={isSubmitting}
          rows={12}
        />
        {validationErrors.content && (
          <p className="text-sm text-destructive">{validationErrors.content}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Include ingredients, measurements, and step-by-step instructions
        </p>
      </div>

      <div className="flex gap-4 pt-4">
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isEditMode ? 'Saving...' : 'Creating...'}
            </>
          ) : (
            isEditMode ? 'Save Changes' : 'Create Recipe'
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => window.location.href = isEditMode && recipe ? `/app/recipes/${recipe.id}` : '/app/recipes'}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
      </div>

      <ConfirmSaveModal
        isOpen={showConfirmDialog}
        onConfirm={handleConfirmSave}
        onCancel={handleCancelSave}
        isEditMode={isEditMode}
      />
    </form>
  );
};

export default RecipeForm;

