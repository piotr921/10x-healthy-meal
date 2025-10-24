import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { CreateRecipeCommand } from '@/types';

const RecipeForm: React.FC = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{ title?: string; content?: string }>({});

  const validateForm = (): boolean => {
    const errors: { title?: string; content?: string } = {};

    if (!title.trim()) {
      errors.title = 'Title is required';
    } else if (title.length < 3) {
      errors.title = 'Title must be at least 3 characters long';
    } else if (title.length > 200) {
      errors.title = 'Title must not exceed 200 characters';
    }

    if (!content.trim()) {
      errors.content = 'Recipe content is required';
    } else if (content.length < 10) {
      errors.content = 'Recipe content must be at least 10 characters long';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const command: CreateRecipeCommand = {
      title: title.trim(),
      content: content.trim(),
    };

    try {
      const response = await fetch('/api/recipes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        const errorData = await response.json();

        if (errorData.error?.code === 'DUPLICATE_TITLE') {
          setValidationErrors({ title: 'A recipe with this title already exists' });
        } else if (errorData.error?.details) {
          // Handle validation errors from API
          const apiErrors: { title?: string; content?: string } = {};
          errorData.error.details.forEach((detail: any) => {
            if (detail.path && detail.path[0]) {
              apiErrors[detail.path[0] as 'title' | 'content'] = detail.message;
            }
          });
          setValidationErrors(apiErrors);
        } else {
          setError(errorData.error?.message || 'Failed to create recipe');
        }
        return;
      }

      // Success - redirect to recipes list
      window.location.href = '/app/recipes';
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Recipe creation error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg border shadow-sm">
      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="title" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          Recipe Title <span className="text-destructive">*</span>
        </label>
        <Input
          id="title"
          type="text"
          placeholder="e.g., Grandma's Chocolate Chip Cookies"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (validationErrors.title) {
              setValidationErrors({ ...validationErrors, title: undefined });
            }
          }}
          className={validationErrors.title ? 'border-destructive' : ''}
          disabled={isSubmitting}
          maxLength={200}
        />
        {validationErrors.title && (
          <p className="text-sm text-destructive">{validationErrors.title}</p>
        )}
        <p className="text-xs text-muted-foreground">
          {title.length}/200 characters
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="content" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          Recipe Content <span className="text-destructive">*</span>
        </label>
        <textarea
          id="content"
          placeholder="Enter your recipe ingredients and instructions..."
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            if (validationErrors.content) {
              setValidationErrors({ ...validationErrors, content: undefined });
            }
          }}
          className={`flex min-h-[200px] w-full rounded-md border ${
            validationErrors.content ? 'border-destructive' : 'border-input'
          } bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`}
          disabled={isSubmitting}
          rows={12}
        />
        {validationErrors.content && (
          <p className="text-sm text-destructive">{validationErrors.content}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Include ingredients, measurements, and step-by-step instructions
        </p>
      </div>

      <div className="flex gap-4 pt-4">
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? 'Creating...' : 'Create Recipe'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => window.location.href = '/app/recipes'}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default RecipeForm;

