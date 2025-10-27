import { RecipeMetadata } from './RecipeMetadata';
import type { RecipeHeaderProps } from '../../types';

/**
 * RecipeHeader component displays the recipe title and metadata
 * Uses proper heading hierarchy (h1) for accessibility
 */
export function RecipeHeader({ title, createdAt, updatedAt, updateCounter }: RecipeHeaderProps) {
  return (
    <div className="mb-8">
      <h1 className="mb-4 text-3xl font-bold text-gray-900 dark:text-gray-100">
        {title}
      </h1>
      <RecipeMetadata
        createdAt={createdAt}
        updatedAt={updatedAt}
        updateCounter={updateCounter}
      />
    </div>
  );
}

