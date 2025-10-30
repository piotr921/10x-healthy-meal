import type { RecipeMetadataProps } from '../../types';

/**
 * RecipeMetadata component displays formatted creation and update information
 * Shows dates in a readable format and the number of times the recipe was updated
 */
export function RecipeMetadata({ createdAt, updatedAt, updateCounter }: RecipeMetadataProps) {
  /**
   * Formats ISO8601 timestamp to readable date string
   */
  const formatDate = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex flex-col gap-1 text-sm text-gray-600 dark:text-gray-400">
      <div>
        <span className="font-medium">Created: </span>
        <time dateTime={createdAt}>{formatDate(createdAt)}</time>
      </div>
      <div>
        <span className="font-medium">Last updated: </span>
        <time dateTime={updatedAt}>{formatDate(updatedAt)}</time>
      </div>
      <div>
        <span className="font-medium">Updates: </span>
        <span>{updateCounter}</span>
      </div>
    </div>
  );
}

