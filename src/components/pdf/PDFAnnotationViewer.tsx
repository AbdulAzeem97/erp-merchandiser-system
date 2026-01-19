import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PDFAnnotation } from '@/types/annotations';
import { AnnotationToolbar } from './AnnotationToolbar';
import { GoogleDrivePreview } from '@/components/ui/GoogleDrivePreview';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { getApiUrl } from '@/utils/apiConfig';

interface PDFAnnotationViewerProps {
  pdfUrl: string;
  jobCardId: number;
  onAnnotationsChange?: (annotations: PDFAnnotation[]) => void;
  readOnly?: boolean;
}

export const PDFAnnotationViewer: React.FC<PDFAnnotationViewerProps> = ({
  pdfUrl,
  jobCardId,
  onAnnotationsChange,
  readOnly = false
}) => {
  const [annotations, setAnnotations] = useState<PDFAnnotation[]>([]);
  const [annotationMode, setAnnotationMode] = useState<'tick' | 'cross' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const annotationsRef = useRef<PDFAnnotation[]>([]);

  // Load annotations on mount
  useEffect(() => {
    loadAnnotations();
  }, [jobCardId, pdfUrl]);

  const loadAnnotations = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${getApiUrl()}/api/jobs/${jobCardId}/annotations?pdf_url=${encodeURIComponent(pdfUrl)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.annotations) {
          setAnnotations(data.annotations.annotations || []);
          annotationsRef.current = data.annotations.annotations || [];
        }
      } else if (response.status === 404) {
        // No annotations yet - this is fine
        setAnnotations([]);
        annotationsRef.current = [];
      }
    } catch (error) {
      console.error('Error loading annotations:', error);
      toast.error('Failed to load annotations');
    } finally {
      setIsLoading(false);
    }
  };

  const saveAnnotations = async () => {
    if (annotations.length === 0) {
      toast.info('No annotations to save');
      return;
    }

    try {
      setIsSaving(true);
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${getApiUrl()}/api/jobs/${jobCardId}/annotations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          pdf_url: pdfUrl,
          annotations: annotations
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast.success('Annotations saved successfully');
          annotationsRef.current = annotations;
          if (onAnnotationsChange) {
            onAnnotationsChange(annotations);
          }
        } else {
          toast.error('Failed to save annotations');
        }
      } else {
        toast.error('Failed to save annotations');
      }
    } catch (error) {
      console.error('Error saving annotations:', error);
      toast.error('Failed to save annotations');
    } finally {
      setIsSaving(false);
    }
  };

  const handleContainerClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (readOnly || !annotationMode || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    // Only add annotation if click is within bounds
    if (x >= 0 && x <= 1 && y >= 0 && y <= 1) {
      const newAnnotation: PDFAnnotation = {
        id: `annotation-${Date.now()}-${Math.random()}`,
        type: annotationMode,
        x,
        y,
        page: 1, // For now, assume single page or first page
        createdBy: (() => {
          const userData = localStorage.getItem('user');
          if (userData) {
            try {
              const user = JSON.parse(userData);
              return user.id || 0;
            } catch {
              return 0;
            }
          }
          return 0;
        })(),
        createdAt: new Date().toISOString()
      };

      const newAnnotations = [...annotations, newAnnotation];
      setAnnotations(newAnnotations);
    }
  }, [readOnly, annotationMode, annotations]);

  const clearAllAnnotations = () => {
    if (window.confirm('Are you sure you want to clear all annotations?')) {
      setAnnotations([]);
    }
  };

  const deleteAnnotation = (id: string) => {
    setAnnotations(annotations.filter(ann => ann.id !== id));
  };

  return (
    <div className="space-y-4">
      {!readOnly && (
        <AnnotationToolbar
          annotationMode={annotationMode}
          onModeChange={setAnnotationMode}
          onClear={clearAllAnnotations}
          onSave={saveAnnotations}
          annotationCount={annotations.length}
          isSaving={isSaving}
        />
      )}

      <Card>
        <CardContent className="p-0">
          <div
            ref={containerRef}
            className="relative border rounded-lg overflow-hidden"
            onClick={handleContainerClick}
            style={{ cursor: annotationMode && !readOnly ? 'crosshair' : 'default' }}
          >
            {/* PDF Preview */}
            <div className="relative">
              <GoogleDrivePreview url={pdfUrl} />
            </div>

            {/* Annotation Overlay */}
            {!isLoading && (
              <div className="absolute inset-0 pointer-events-none">
                {annotations.map((annotation) => (
                  <div
                    key={annotation.id}
                    className="absolute pointer-events-auto"
                    style={{
                      left: `${annotation.x * 100}%`,
                      top: `${annotation.y * 100}%`,
                      transform: 'translate(-50%, -50%)'
                    }}
                  >
                    <div
                      className={`
                        w-8 h-8 rounded-full flex items-center justify-center
                        ${annotation.type === 'tick' 
                          ? 'bg-green-500 text-white' 
                          : 'bg-red-500 text-white'}
                        shadow-lg cursor-pointer hover:scale-110 transition-transform
                        ${!readOnly ? 'pointer-events-auto' : ''}
                      `}
                      onClick={(e) => {
                        if (!readOnly) {
                          e.stopPropagation();
                          deleteAnnotation(annotation.id);
                        }
                      }}
                      title={annotation.comment || `${annotation.type === 'tick' ? 'Approved' : 'Rejected'}`}
                    >
                      {annotation.type === 'tick' ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {annotationMode && !readOnly && (
              <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-2 rounded-lg text-sm">
                Click on the PDF to add a {annotationMode === 'tick' ? '✓ tick' : '✗ cross'} mark
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

