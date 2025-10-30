import React, { useState } from 'react';
import SearchBar from './SearchBar';
import RecipeList from './RecipeList';

const RecipesView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="flex flex-col gap-6">
      <SearchBar onSearchChange={setSearchTerm} />
      <RecipeList searchTerm={searchTerm} />
    </div>
  );
};

export default RecipesView;

