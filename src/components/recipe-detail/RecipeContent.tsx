import type { RecipeContentProps } from '../../types';

/**
 * RecipeContent component displays the full recipe text content
 * Preserves formatting (line breaks, spacing) using white-space: pre-wrap
 */
export function RecipeContent({ content }: RecipeContentProps) {
  return (
    <div className="mb-8">
      <div className="prose prose-gray max-w-none whitespace-pre-wrap rounded-lg border border-gray-200 bg-white p-6 dark:prose-invert dark:border-gray-700 dark:bg-gray-800">
        {content}
      </div>
    </div>
  );
}

