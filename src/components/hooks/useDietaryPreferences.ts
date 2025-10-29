import { useState, useEffect, useCallback } from 'react';
import type { DietaryPreferencesViewModel, DietaryPreferencesDTO, UpdateDietaryPreferencesCommand } from '../../types';

interface UseDietaryPreferencesReturn {
  preferences: DietaryPreferencesViewModel | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  updatePreferences: (data: DietaryPreferencesViewModel) => void;
  savePreferences: () => Promise<void>;
}

const DEFAULT_PREFERENCES: DietaryPreferencesViewModel = {
  diet_type: 'none',
  forbidden_ingredients: [],
};

export function useDietaryPreferences(): UseDietaryPreferencesReturn {
  const [preferences, setPreferences] = useState<DietaryPreferencesViewModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPreferences = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/dietary-preferences', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        // Redirect to login
        window.location.href = '/';
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch dietary preferences');
      }

      const data: DietaryPreferencesDTO | null = await response.json();

      // If null, user hasn't set preferences yet - use defaults
      if (!data) {
        setPreferences(DEFAULT_PREFERENCES);
      } else {
        setPreferences({
          diet_type: data.diet_type,
          forbidden_ingredients: data.forbidden_ingredients,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching preferences');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updatePreferences = useCallback((data: DietaryPreferencesViewModel) => {
    setPreferences(data);
  }, []);

  const savePreferences = useCallback(async () => {
    if (!preferences) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const payload: UpdateDietaryPreferencesCommand = {
        diet_type: preferences.diet_type,
        forbidden_ingredients: preferences.forbidden_ingredients,
      };

      const response = await fetch('/api/dietary-preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 401) {
        // Redirect to login
        window.location.href = '/';
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to save dietary preferences');
      }

      // Success - preferences saved
      const data: DietaryPreferencesDTO = await response.json();
      setPreferences({
        diet_type: data.diet_type,
        forbidden_ingredients: data.forbidden_ingredients,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while saving preferences');
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [preferences]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  return {
    preferences,
    isLoading,
    isSaving,
    error,
    updatePreferences,
    savePreferences,
  };
}

