import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RestorePasswordSchema, type RestorePasswordFormData } from '@/lib/validation/auth.validation';

export const RestorePasswordForm: React.FC = () => {
  const [formData, setFormData] = useState<RestorePasswordFormData>({
    email: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Partial<Record<keyof RestorePasswordFormData, string>>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setValidationErrors({});
    setSuccess(false);

    // Validate form data
    const result = RestorePasswordSchema.safeParse(formData);
    if (!result.success) {
      const errors: Partial<Record<keyof RestorePasswordFormData, string>> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0] as keyof RestorePasswordFormData] = err.message;
        }
      });
      setValidationErrors(errors);
      return;
    }

    setIsSubmitting(true);

    // TODO: Implement Supabase resetPasswordForEmail logic
    // This will be implemented in the next phase
    console.log('Password reset attempt:', formData);

    // Placeholder for demonstration
    setTimeout(() => {
      setIsSubmitting(false);
      setSuccess(true);
    }, 1000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ email: e.target.value });
    if (validationErrors.email) {
      setValidationErrors({});
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-sm space-y-6">
        <div className="bg-primary/10 border border-primary text-primary px-4 py-3 rounded-md">
          <h3 className="font-medium mb-2">Check your email</h3>
          <p className="text-sm">
            If an account exists for {formData.email}, you will receive a password reset link shortly.
          </p>
        </div>
        <Button
          onClick={() => window.location.href = '/auth/login'}
          className="w-full"
          variant="outline"
        >
          Back to Sign In
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-sm">
      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">
          Email <span className="text-destructive">*</span>
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={formData.email}
          onChange={handleChange}
          className={validationErrors.email ? 'border-destructive' : ''}
          disabled={isSubmitting}
          autoComplete="email"
        />
        {validationErrors.email && (
          <p className="text-sm text-destructive">{validationErrors.email}</p>
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
            Sending reset link...
          </>
        ) : (
          'Send Reset Link'
        )}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        <a href="/auth/login" className="text-primary hover:underline font-medium">
          Back to Sign In
        </a>
      </p>
    </form>
  );
};

