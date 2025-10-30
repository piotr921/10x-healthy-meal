import React from 'react';
import { useRecipes } from '../hooks/useRecipes';
import { Button } from '@/components/ui/button';
import { PlusCircle, ChefHat } from 'lucide-react';

interface RecipeListProps {
  searchTerm?: string;
}

const RecipeList: React.FC<RecipeListProps> = ({ searchTerm: externalSearchTerm }) => {
  const { recipes, isLoading, error, pagination, loadMore, setSearchTerm } = useRecipes();

  // Sync external search term with internal state
  React.useEffect(() => {
    if (externalSearchTerm !== undefined) {
      setSearchTerm(externalSearchTerm);
    }
  }, [externalSearchTerm, setSearchTerm]);

  if (error) {
    return <p className="text-red-500">Could not load recipes. Please try again later.</p>;
  }

  if (isLoading && recipes.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div key={idx} className="block p-4 border rounded-lg">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-full animate-pulse mb-1"></div>
            <div className="h-4 bg-gray-200 rounded w-full animate-pulse mb-1"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4 mt-4 animate-pulse"></div>
          </div>
        ))}
      </div>
    );
  }

  if (recipes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="rounded-full bg-primary/10 p-6 mb-6">
          <ChefHat className="h-16 w-16 text-primary" />
        </div>
        <h3 className="text-2xl font-bold mb-2">No recipes yet</h3>
        <p className="text-muted-foreground text-center mb-6 max-w-md">
          {externalSearchTerm
            ? `No recipes found matching "${externalSearchTerm}". Try a different search term or create a new recipe.`
            : "Start building your personal recipe collection by adding your first recipe!"
          }
        </p>
        <a
          href="/app/recipes/create"
          className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-6 py-2 transition-colors gap-2"
        >
          <PlusCircle className="h-5 w-5" />
          Create Your First Recipe
        </a>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recipes.map(recipe => (
          <div key={recipe.id} className="block p-4 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <a href={`/app/recipes/${recipe.id}`}>
              <h3 className="text-xl font-semibold mb-2">{recipe.title}</h3>
              <p className="text-gray-600 dark:text-gray-400 line-clamp-3">{recipe.content}</p>
              <p className="text-sm text-gray-500 mt-4">Last updated: {new Date(recipe.updated_at).toLocaleDateString()}</p>
            </a>
          </div>
        ))}
      </div>
      {pagination && pagination.current_page < pagination.total_pages && (
        <div className="flex justify-center mt-8">
          <Button onClick={loadMore} disabled={isLoading}>
            {isLoading ? 'Loading...' : 'Load More'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default RecipeList;
