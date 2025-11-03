import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RegisterSchema, type RegisterFormData } from '@/lib/validation/auth.validation';

export const RegisterForm: React.FC = () => {
  const [formData, setFormData] = useState<RegisterFormData>({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Partial<Record<keyof RegisterFormData, string>>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setValidationErrors({});

    // Validate form data
    const result = RegisterSchema.safeParse(formData);
    if (!result.success) {
      const errors: Partial<Record<keyof RegisterFormData, string>> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0] as keyof RegisterFormData] = err.message;
        }
      });
      setValidationErrors(errors);
      return;
    }

    setIsSubmitting(true);

    try {
      // Call registration API endpoint
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle error response
        setError(data.error || 'An error occurred during registration. Please try again.');
        setIsSubmitting(false);
        return;
      }

      // Success - redirect to login page with success message
      window.location.href = '/auth/login?registered=true';
    } catch (err) {
      console.error('Registration error:', err);
      setError('An unexpected error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof RegisterFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };


  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-sm">
      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">
          Email <span className="text-destructive">*</span>
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={formData.email}
          onChange={handleChange('email')}
          className={validationErrors.email ? 'border-destructive' : ''}
          disabled={isSubmitting}
          autoComplete="email"
        />
        {validationErrors.email && (
          <p className="text-sm text-destructive">{validationErrors.email}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">
          Password <span className="text-destructive">*</span>
        </Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          value={formData.password}
          onChange={handleChange('password')}
          className={validationErrors.password ? 'border-destructive' : ''}
          disabled={isSubmitting}
          autoComplete="new-password"
        />
        {validationErrors.password && (
          <p className="text-sm text-destructive">{validationErrors.password}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Must be at least 8 characters long
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">
          Confirm Password <span className="text-destructive">*</span>
        </Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="••••••••"
          value={formData.confirmPassword}
          onChange={handleChange('confirmPassword')}
          className={validationErrors.confirmPassword ? 'border-destructive' : ''}
          disabled={isSubmitting}
          autoComplete="new-password"
        />
        {validationErrors.confirmPassword && (
          <p className="text-sm text-destructive">{validationErrors.confirmPassword}</p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating account...
          </>
        ) : (
          'Create Account'
        )}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <a href="/auth/login" className="text-primary hover:underline font-medium">
          Sign in
        </a>
      </p>
    </form>
  );
};

