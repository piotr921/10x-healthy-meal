import { Sparkles, AlertCircle, Check, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import type { AIAnalysisModalProps } from '../../types';

/**
 * AIAnalysisModal component displays AI-generated recipe modifications
 * Shows original vs modified recipe with side-by-side comparison
 * Provides Accept/Reject actions for the modifications
 */
export function AIAnalysisModal({
  isOpen,
  isAnalyzing,
  analysisResult,
  error,
  onAccept,
  onCancel
}: AIAnalysisModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isAnalyzing && onCancel()}>
      <DialogContent className="sm:max-w-[90vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="mb-4 flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/20">
              <Sparkles className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <DialogTitle className="text-center">AI Recipe Analysis</DialogTitle>
          <DialogDescription className="text-center">
            {isAnalyzing ? 'Analyzing your recipe...' : 'Review the suggested modifications'}
          </DialogDescription>
        </DialogHeader>

        {/* Loading State */}
        {isAnalyzing && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              This may take a moment...
            </p>
          </div>
        )}

        {/* Error State */}
        {error && !isAnalyzing && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
              <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <p className="text-sm text-red-600 dark:text-red-400 text-center mb-4">
              {error}
            </p>
            {error.includes('dietary preferences') && (
              <Button
                variant="outline"
                onClick={() => window.location.href = '/app/profile/preferences'}
                className="mt-2"
              >
                Go to Preferences
              </Button>
            )}
          </div>
        )}

        {/* Analysis Result */}
        {analysisResult && !isAnalyzing && !error && (
          <div className="space-y-4">
            {/* Modifications Summary */}
            <Card className="p-4 bg-purple-50 dark:bg-purple-900/10 border-purple-200 dark:border-purple-800">
              <h3 className="font-semibold text-sm mb-2 text-purple-900 dark:text-purple-100">
                Modifications Summary
              </h3>
              <p className="text-sm text-purple-800 dark:text-purple-200 whitespace-pre-wrap">
                {analysisResult.modifications_summary}
              </p>
            </Card>

            {/* Comparison Grid */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Original Recipe */}
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-2 w-2 rounded-full bg-gray-400"></div>
                  <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300">
                    Original Recipe
                  </h3>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Title
                    </p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {analysisResult.original.title}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Content
                    </p>
                    <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap max-h-[400px] overflow-y-auto p-3 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                      {analysisResult.original.content}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Modified Recipe */}
              <Card className="p-4 border-2 border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <h3 className="font-semibold text-sm text-green-700 dark:text-green-300">
                    Modified Recipe
                  </h3>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Title
                    </p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {analysisResult.modified.title}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Content
                    </p>
                    <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap max-h-[400px] overflow-y-auto p-3 bg-green-50 dark:bg-green-900/10 rounded border border-green-200 dark:border-green-800">
                      {analysisResult.modified.content}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        {analysisResult && !isAnalyzing && !error && (
          <DialogFooter className="sm:justify-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Reject Changes
            </Button>
            <Button
              type="button"
              variant="default"
              onClick={onAccept}
              className="gap-2 bg-green-600 hover:bg-green-700"
            >
              <Check className="h-4 w-4" />
              Accept & Save Changes
            </Button>
          </DialogFooter>
        )}

        {/* Error Footer */}
        {error && !isAnalyzing && (
          <DialogFooter className="sm:justify-center">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
            >
              Close
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

