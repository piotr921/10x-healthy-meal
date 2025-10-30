import { AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import type { ConfirmDeleteModalProps } from '../../types';

/**
 * ConfirmDeleteModal component displays a confirmation dialog before deleting a recipe
 * Uses Shadcn Dialog component with focus trapping and accessibility features
 */
export function ConfirmDeleteModal({
  isOpen,
  recipeTitle,
  isDeleting,
  onConfirm,
  onCancel
}: ConfirmDeleteModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="mb-4 flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <DialogTitle className="text-center">Delete Recipe</DialogTitle>
          <DialogDescription className="text-center">
            Are you sure you want to delete <span className="font-semibold">"{recipeTitle}"</span>?
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete Recipe'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

