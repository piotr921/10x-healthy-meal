import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDietaryPreferences } from '@/components/hooks/useDietaryPreferences';

const INFO_BANNER_DISMISSED_KEY = 'infoBannerDismissed';

const InfoBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { preferences, isLoading } = useDietaryPreferences();

  useEffect(() => {
    // Don't show banner while loading
    if (isLoading) {
      setIsVisible(false);
      return;
    }

    // Check if user has manually dismissed the banner
    const isDismissed = localStorage.getItem(INFO_BANNER_DISMISSED_KEY);
    if (isDismissed === 'true') {
      setIsVisible(false);
      return;
    }

    // Check if dietary preferences are actually set
    // Preferences are considered "not set" if:
    // - preferences are null OR
    // - diet_type is 'none' AND forbidden_ingredients is empty
    const preferencesNotSet =
      !preferences ||
      (preferences.diet_type === 'none' && preferences.forbidden_ingredients.length === 0);

    // Show banner only if preferences are not set AND not dismissed
    setIsVisible(preferencesNotSet);
  }, [isLoading, preferences]);

  const handleDismiss = () => {
    localStorage.setItem(INFO_BANNER_DISMISSED_KEY, 'true');
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 rounded-md flex justify-between items-center">
      <div>
        <p className="font-bold">Set Your Dietary Preferences</p>
        <p>Get personalized recipe recommendations by setting your dietary preferences.</p>
      </div>
      <div className="flex items-center">
        <a href="/app/profile/preferences">
          <Button variant="outline" size="sm" className="mr-4">
            Set Preferences
          </Button>
        </a>
        <button onClick={handleDismiss} className="text-blue-500 hover:text-blue-700">
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default InfoBanner;

