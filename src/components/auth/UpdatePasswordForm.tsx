import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UpdatePasswordSchema, type UpdatePasswordFormData } from '@/lib/validation/auth.validation';

export const UpdatePasswordForm: React.FC = () => {
  const [formData, setFormData] = useState<UpdatePasswordFormData>({
    password: '',
    confirmPassword: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Partial<Record<keyof UpdatePasswordFormData, string>>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setValidationErrors({});
    setSuccess(false);

    // Validate form data
    const result = UpdatePasswordSchema.safeParse(formData);
    if (!result.success) {
      const errors: Partial<Record<keyof UpdatePasswordFormData, string>> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0] as keyof UpdatePasswordFormData] = err.message;
        }
      });
      setValidationErrors(errors);
      return;
    }

    setIsSubmitting(true);

    // TODO: Implement Supabase updateUser logic
    // This will be implemented in the next phase
    console.log('Update password attempt');

    // Placeholder for demonstration
    setTimeout(() => {
      setIsSubmitting(false);
      setSuccess(true);
    }, 1000);
  };

  const handleChange = (field: keyof UpdatePasswordFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-sm space-y-6">
        <div className="bg-primary/10 border border-primary text-primary px-4 py-3 rounded-md">
          <h3 className="font-medium mb-2">Password updated!</h3>
          <p className="text-sm">
            Your password has been successfully updated. You can now sign in with your new password.
          </p>
        </div>
        <Button
          onClick={() => window.location.href = '/auth/login'}
          className="w-full"
        >
          Go to Sign In
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
        <Label htmlFor="password">
          New Password <span className="text-destructive">*</span>
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
          Confirm New Password <span className="text-destructive">*</span>
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
            Updating password...
          </>
        ) : (
          'Update Password'
        )}
      </Button>
    </form>
  );
};

