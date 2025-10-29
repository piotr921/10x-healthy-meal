import { useState } from 'react';
import { useDietaryPreferences } from '../hooks/useDietaryPreferences';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Badge } from '../ui/badge';
import type { DietType } from '../../types';

export default function DietaryPreferencesView() {
  const {
    preferences,
    isLoading,
    isSaving,
    error,
    updatePreferences,
    savePreferences,
  } = useDietaryPreferences();

  const [ingredientInput, setIngredientInput] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState(false);

  const handleDietTypeChange = (value: DietType) => {
    if (!preferences) return;
    updatePreferences({
      ...preferences,
      diet_type: value,
    });
  };

  const handleAddIngredient = () => {
    if (!preferences) return;

    const trimmedIngredient = ingredientInput.trim();

    if (!trimmedIngredient) return;

    // Check for duplicates
    if (preferences.forbidden_ingredients.includes(trimmedIngredient)) {
      setDuplicateWarning(true);
      setTimeout(() => setDuplicateWarning(false), 3000);
      return;
    }

    updatePreferences({
      ...preferences,
      forbidden_ingredients: [...preferences.forbidden_ingredients, trimmedIngredient],
    });
    setIngredientInput('');
    setDuplicateWarning(false);
  };

  const handleRemoveIngredient = (ingredient: string) => {
    if (!preferences) return;
    updatePreferences({
      ...preferences,
      forbidden_ingredients: preferences.forbidden_ingredients.filter(
        (item) => item !== ingredient
      ),
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddIngredient();
    }
  };

  const handleSave = async () => {
    try {
      await savePreferences();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      // Error is already handled in the hook
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading...</CardTitle>
          <CardDescription>Fetching your dietary preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && !preferences) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
          <CardDescription>Failed to load dietary preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-destructive mb-4">{error}</div>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </CardContent>
      </Card>
    );
  }

  if (!preferences) return null;

  // Check if user has never saved preferences (all values are defaults)
  const hasNeverSetPreferences =
      {/* Info Message for first-time users */}
      {hasNeverSetPreferences && !saveSuccess && (
        <div
          className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-md"
          role="status"
          aria-live="polite"
        >
          <p className="font-semibold mb-1">Welcome! Set your dietary preferences</p>
          <p className="text-sm">
            Configure your diet type and forbidden ingredients below to help personalize your recipe experience.
            Don't forget to click "Save Changes" when you're done!
          </p>
        </div>
      )}

    preferences.diet_type === 'none' &&
    preferences.forbidden_ingredients.length === 0;

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {saveSuccess && (
        <div
          className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md"
          role="alert"
          aria-live="polite"
        >
          Your dietary preferences have been saved successfully!
        </div>
      )}

      {/* Diet Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Diet Type</CardTitle>
          <CardDescription>
            Select your dietary preference to help customize recipe suggestions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={preferences.diet_type}
            onValueChange={handleDietTypeChange}
            className="space-y-3"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="none" id="none" />
              <Label htmlFor="none" className="cursor-pointer">
                No specific diet
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="vegetarian" id="vegetarian" />
              <Label htmlFor="vegetarian" className="cursor-pointer">
                Vegetarian
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="vegan" id="vegan" />
              <Label htmlFor="vegan" className="cursor-pointer">
                Vegan
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Forbidden Ingredients */}
      <Card>
        <CardHeader>
          <CardTitle>Forbidden Ingredients</CardTitle>
          <CardDescription>
            Add ingredients you want to avoid in your recipes (e.g., allergens or dislikes)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Input for adding ingredients */}
          <div className="space-y-2">
            <Label htmlFor="ingredient-input">Add forbidden ingredient</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  id="ingredient-input"
                  type="text"
                  placeholder="Enter an ingredient (e.g., peanuts, milk)"
                  value={ingredientInput}
                  onChange={(e) => setIngredientInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  aria-label="Ingredient to add"
                  aria-describedby={duplicateWarning ? "duplicate-warning" : undefined}
                />
                {duplicateWarning && (
                  <p id="duplicate-warning" className="text-sm text-amber-600 mt-1" role="alert">
                    This ingredient is already in your list
                  </p>
                )}
              </div>
              <Button
                onClick={handleAddIngredient}
                disabled={!ingredientInput.trim()}
                type="button"
                aria-label="Add ingredient to forbidden list"
              >
                Add
              </Button>
            </div>
          </div>

          {/* Display current ingredients */}
          {preferences.forbidden_ingredients.length > 0 ? (
            <div className="space-y-2">
              <Label>Current forbidden ingredients:</Label>
              <div
                className="flex flex-wrap gap-2"
                role="list"
                aria-label="List of forbidden ingredients"
              >
                {preferences.forbidden_ingredients.map((ingredient) => (
                  <Badge
                    key={ingredient}
                    variant="secondary"
                    className="text-sm px-3 py-1.5 flex items-center gap-2"
                    role="listitem"
                  >
                    <span>{ingredient}</span>
                    <button
                      onClick={() => handleRemoveIngredient(ingredient)}
                      className="ml-1 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 rounded transition-colors"
                      aria-label={`Remove ${ingredient} from forbidden ingredients`}
                      type="button"
                    >
                      <span aria-hidden="true">×</span>
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              No forbidden ingredients added yet
            </p>
          )}
        </CardContent>
      </Card>

      {/* Save Button and Error Message */}
      <div className="space-y-4">
        {error && (
          <div
            className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md"
            role="alert"
            aria-live="assertive"
          >
            {error}
          </div>
        )}
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full sm:w-auto"
          size="lg"
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}

