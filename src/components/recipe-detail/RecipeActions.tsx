import { Edit, Sparkles, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import type { RecipeActionsProps } from '../../types';

/**
 * RecipeActions component provides action buttons for recipe operations
 * Includes edit, AI analysis, and delete functionality
 */
export function RecipeActions({ onEdit, onAnalyze, onDelete }: RecipeActionsProps) {
  return (
    <div className="flex flex-wrap gap-3">
      <Button
        onClick={onEdit}
        variant="default"
        className="gap-2"
      >
        <Edit className="h-4 w-4" />
        Edit
      </Button>

      <Button
        onClick={onAnalyze}
        variant="secondary"
        className="gap-2"
      >
        <Sparkles className="h-4 w-4" />
        Analyze with AI
      </Button>

      <Button
        onClick={onDelete}
        variant="destructive"
        className="gap-2"
      >
        <Trash2 className="h-4 w-4" />
        Delete
      </Button>
    </div>
  );
}

