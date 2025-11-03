import React from 'react';
import { Button } from '@/components/ui/button';

interface UserNavProps {
  isLoggedIn: boolean;
}

export const UserNav: React.FC<UserNavProps> = ({ isLoggedIn }) => {
  if (isLoggedIn) {
    return (
      <div className="flex items-center gap-4">
        <a
          href="/app/profile/preferences"
          className="text-sm font-medium hover:text-primary transition-colors hidden sm:inline-block"
        >
          Profile
        </a>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            // TODO: Implement Supabase sign-out logic
            // This will be implemented in the next phase
            console.log('Logout clicked');
          }}
        >
          Logout
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <a
        href="/auth/login"
        className="text-sm font-medium hover:text-primary transition-colors"
      >
        Sign In
      </a>
      <Button
        size="sm"
        onClick={() => window.location.href = '/auth/register'}
      >
        Sign Up
      </Button>
    </div>
  );
};

