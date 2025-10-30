import { AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import type { ErrorStateProps } from '../../types';

/**
 * ErrorState component displays error messages with appropriate actions
 * Shows different content based on error type (404, network error, etc.)
 */
export function ErrorState({ error, statusCode, onRetry }: ErrorStateProps) {
  const is404 = statusCode === 404 || error.toLowerCase().includes('not found');
  const showRetry = !is404 && onRetry;

  return (
    <div className="container mx-auto flex max-w-2xl flex-col items-center justify-center px-4 py-16">
      {/* Error icon */}
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
        <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
      </div>

      {/* Error heading */}
      <h1 className="mb-3 text-2xl font-bold text-gray-900 dark:text-gray-100">
        {is404 ? 'Recipe Not Found' : 'Oops! Something went wrong'}
      </h1>

      {/* Error message */}
      <p className="mb-8 text-center text-gray-600 dark:text-gray-400">
        {error}
      </p>

      {/* Action buttons */}
      <div className="flex flex-col gap-3 sm:flex-row">
        {showRetry && (
          <Button onClick={onRetry} variant="default">
            Try Again
          </Button>
        )}
        <Button
          onClick={() => window.location.href = '/app/recipes'}
          variant={showRetry ? 'outline' : 'default'}
        >
          Back to Recipes
        </Button>
      </div>
    </div>
  );
}

