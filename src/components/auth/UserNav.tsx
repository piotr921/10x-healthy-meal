import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

interface UserNavProps {
  isLoggedIn: boolean;
}

export const UserNav: React.FC<UserNavProps> = ({ isLoggedIn }) => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Redirect to login page after successful logout
        window.location.href = '/auth/login';
      } else {
        console.error('Logout failed');
        setIsLoggingOut(false);
      }
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
    }
  };

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
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? 'Logging out...' : 'Logout'}
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

