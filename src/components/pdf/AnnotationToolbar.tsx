import React from 'react';
import { Check, X, Trash2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface AnnotationToolbarProps {
  annotationMode: 'tick' | 'cross' | null;
  onModeChange: (mode: 'tick' | 'cross' | null) => void;
  onClear: () => void;
  onSave: () => void;
  annotationCount: number;
  isSaving?: boolean;
}

export const AnnotationToolbar: React.FC<AnnotationToolbarProps> = ({
  annotationMode,
  onModeChange,
  onClear,
  onSave,
  annotationCount,
  isSaving = false
}) => {
  return (
    <div className="flex items-center gap-2 p-2 bg-white border rounded-lg shadow-sm">
      <div className="flex items-center gap-1">
        <span className="text-sm font-medium text-gray-700">Mode:</span>
        <Button
          variant={annotationMode === 'tick' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onModeChange(annotationMode === 'tick' ? null : 'tick')}
          className={annotationMode === 'tick' ? 'bg-green-600 hover:bg-green-700' : ''}
        >
          <Check className="w-4 h-4 mr-1" />
          Tick
        </Button>
        <Button
          variant={annotationMode === 'cross' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onModeChange(annotationMode === 'cross' ? null : 'cross')}
          className={annotationMode === 'cross' ? 'bg-red-600 hover:bg-red-700' : ''}
        >
          <X className="w-4 h-4 mr-1" />
          Cross
        </Button>
      </div>

      <div className="h-6 w-px bg-gray-300" />

      <Badge variant="secondary" className="px-2 py-1">
        {annotationCount} annotation{annotationCount !== 1 ? 's' : ''}
      </Badge>

      <div className="flex-1" />

      <Button
        variant="outline"
        size="sm"
        onClick={onClear}
        disabled={annotationCount === 0}
      >
        <Trash2 className="w-4 h-4 mr-1" />
        Clear All
      </Button>

      <Button
        size="sm"
        onClick={onSave}
        disabled={annotationCount === 0 || isSaving}
        className="bg-blue-600 hover:bg-blue-700"
      >
        <Save className="w-4 h-4 mr-1" />
        {isSaving ? 'Saving...' : 'Save'}
      </Button>
    </div>
  );
};

