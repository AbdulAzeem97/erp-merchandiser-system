import React, { useState } from 'react';
import { X, Maximize2, Minimize2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PDFAnnotationViewer } from './PDFAnnotationViewer';

interface PDFAnnotationModalProps {
  pdfUrl: string;
  jobCardId: number;
  jobNumber?: string;
  isOpen: boolean;
  onClose: () => void;
  onAnnotationsChange?: (annotations: any[]) => void;
  readOnly?: boolean;
}

export const PDFAnnotationModal: React.FC<PDFAnnotationModalProps> = ({
  pdfUrl,
  jobCardId,
  jobNumber,
  isOpen,
  onClose,
  onAnnotationsChange,
  readOnly = false
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${isFullscreen ? 'max-w-[95vw] h-[95vh] max-h-[95vh]' : 'max-w-6xl h-[90vh] max-h-[90vh]'} p-0`}>
        <DialogHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <span>PDF Annotations{jobNumber ? ` - ${jobNumber}` : ''}</span>
            </DialogTitle>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
                title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className={`flex-1 overflow-hidden ${isFullscreen ? 'h-[calc(95vh-80px)]' : 'h-[calc(90vh-80px)]'}`}>
          <div className="h-full overflow-y-auto p-6">
            <PDFAnnotationViewer
              pdfUrl={pdfUrl}
              jobCardId={jobCardId}
              onAnnotationsChange={onAnnotationsChange}
              readOnly={readOnly}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

