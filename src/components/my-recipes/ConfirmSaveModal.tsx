import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ConfirmSaveModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isEditMode: boolean;
}

/**
 * Confirmation modal for saving recipe changes
 * Displays different messages for create vs edit mode
 */
export function ConfirmSaveModal({ isOpen, onConfirm, onCancel, isEditMode }: ConfirmSaveModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Save Changes?' : 'Create Recipe?'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Are you sure you want to save these changes? This will update the recipe.'
              : 'Are you sure you want to create this recipe?'}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onConfirm}>
            {isEditMode ? 'Save Changes' : 'Create Recipe'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

