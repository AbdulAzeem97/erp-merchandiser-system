import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Maximize2, Minimize2, ExternalLink, Check, X as XIcon, Eye, EyeOff, Search, CheckCircle2, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AnnotationToolbar } from '@/components/pdf/AnnotationToolbar';
import { PDFAnnotation } from '@/types/annotations';
import { getApiBaseUrl } from '@/utils/apiConfig';
import { toast } from 'sonner';

interface RatioLayoutComparisonProps {
  ratioReport: RatioReport | null;
  finalLayoutUrl: string;
  jobNumber: string;
  jobCardId: number;
  isOpen: boolean;
  onClose: () => void;
}

interface RatioReport {
  id: number;
  job_card_id: number;
  factory_name: string;
  po_number: string;
  job_number: string;
  brand_name: string;
  item_name: string;
  total_ups: number;
  total_sheets: number;
  total_plates: number;
  qty_produced: number;
  excess_qty: number;
  efficiency_percentage: number;
  color_details: Array<{
    epNo?: string;
    itemCode?: string;
    itemDescription?: string;
    price?: string;
    color: string;
    size: string;
    requiredQty: number;
    plate: string;
    ups: number;
    sheets: number;
    qtyProduced: number;
    excessQty: number;
  }>;
}

export const RatioLayoutComparison: React.FC<RatioLayoutComparisonProps> = ({
  ratioReport,
  finalLayoutUrl,
  jobNumber,
  jobCardId,
  isOpen,
  onClose
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [annotations, setAnnotations] = useState<PDFAnnotation[]>([]);
  const [annotationMode, setAnnotationMode] = useState<'tick' | 'cross' | null>(null);
  const [isLoadingAnnotations, setIsLoadingAnnotations] = useState(true);
  const [isSavingAnnotations, setIsSavingAnnotations] = useState(false);
  const [showAnnotationToolbar, setShowAnnotationToolbar] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');
  const [highlightedRowIndex, setHighlightedRowIndex] = useState<number | null>(null);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [reviewNote, setReviewNote] = useState('');
  const [isMarkedAsReviewed, setIsMarkedAsReviewed] = useState(false);
  const pdfContainerRef = useRef<HTMLDivElement>(null);

  // Load annotations when comparison opens
  useEffect(() => {
    if (isOpen && finalLayoutUrl) {
      loadAnnotations();
    }
  }, [isOpen, finalLayoutUrl, jobCardId]);

  const loadAnnotations = async () => {
    try {
      setIsLoadingAnnotations(true);
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${getApiBaseUrl()}/jobs/${jobCardId}/annotations?pdf_url=${encodeURIComponent(finalLayoutUrl)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.annotations) {
          setAnnotations(data.annotations.annotations || []);
        }
      } else if (response.status === 404) {
        // No annotations yet - this is fine
        setAnnotations([]);
      }
    } catch (error) {
      console.error('Error loading annotations:', error);
    } finally {
      setIsLoadingAnnotations(false);
    }
  };

  const saveAnnotations = async () => {
    if (annotations.length === 0) {
      toast.info('No annotations to save');
      return;
    }

    try {
      setIsSavingAnnotations(true);
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${getApiBaseUrl()}/jobs/${jobCardId}/annotations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          pdf_url: finalLayoutUrl,
          annotations: annotations
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast.success('Annotations saved successfully');
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
      setIsSavingAnnotations(false);
    }
  };

  const handlePdfContainerClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!annotationMode || !pdfContainerRef.current) return;

    const rect = pdfContainerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    // Only add annotation if click is within bounds
    if (x >= 0 && x <= 1 && y >= 0 && y <= 1) {
      const newAnnotation: PDFAnnotation = {
        id: `annotation-${Date.now()}-${Math.random()}`,
        type: annotationMode,
        x,
        y,
        page: 1,
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
  }, [annotationMode, annotations]);

  const clearAllAnnotations = () => {
    if (window.confirm('Are you sure you want to clear all annotations?')) {
      setAnnotations([]);
    }
  };

  const deleteAnnotation = (id: string) => {
    setAnnotations(annotations.filter(ann => ann.id !== id));
  };

  if (!ratioReport) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${isFullscreen ? 'max-w-[95vw] h-[95vh]' : 'max-w-7xl'} p-0`}>
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <span>Ratio vs Final Layout Comparison - {jobNumber}</span>
              {annotations.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {annotations.length} annotation{annotations.length !== 1 ? 's' : ''}
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAnnotationToolbar(!showAnnotationToolbar)}
                className="ml-2"
                title={showAnnotationToolbar ? 'Hide annotation toolbar' : 'Show annotation toolbar'}
              >
                {showAnnotationToolbar ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </DialogTitle>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
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

        <div className={`flex ${isFullscreen ? 'h-[calc(95vh-80px)]' : 'max-h-[80vh]'} overflow-hidden`}>
          {/* Left Side - Ratio Report Table */}
          <div className="w-1/2 border-r overflow-y-auto p-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between mb-3">
                  <CardTitle className="text-lg">Production Ratio Report</CardTitle>
                </div>
                {/* Search Filter */}
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Search by item code, color, size..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </CardHeader>
              <CardContent>
                {/* Order Information */}
                <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div><strong>Factory:</strong> {ratioReport.factory_name}</div>
                    <div><strong>PO:</strong> {ratioReport.po_number}</div>
                    <div><strong>Brand:</strong> {ratioReport.brand_name}</div>
                    <div><strong>Item:</strong> {ratioReport.item_name}</div>
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="font-bold text-blue-600">{ratioReport.total_sheets || 'N/A'}</div>
                    <div className="text-xs text-gray-600">Total Sheets</div>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="font-bold text-green-600">{ratioReport.total_plates || 'N/A'}</div>
                    <div className="text-xs text-gray-600">Total Plates</div>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="font-bold text-purple-600">
                      {typeof ratioReport.efficiency_percentage === 'number' 
                        ? `${ratioReport.efficiency_percentage.toFixed(1)}%` 
                        : 'N/A'}
                    </div>
                    <div className="text-xs text-gray-600">Efficiency</div>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="font-bold text-orange-600">{ratioReport.excess_qty || 'N/A'}</div>
                    <div className="text-xs text-gray-600">Excess Qty</div>
                  </div>
                </div>

                {/* Color Details Table */}
                {ratioReport.color_details && ratioReport.color_details.length > 0 && (() => {
                  // Filter details based on search
                  const filteredDetails = searchFilter
                    ? ratioReport.color_details.filter(detail => {
                        const searchLower = searchFilter.toLowerCase();
                        return (
                          detail.itemCode?.toLowerCase().includes(searchLower) ||
                          detail.color?.toLowerCase().includes(searchLower) ||
                          detail.size?.toLowerCase().includes(searchLower) ||
                          detail.itemDescription?.toLowerCase().includes(searchLower) ||
                          detail.epNo?.toLowerCase().includes(searchLower)
                        );
                      })
                    : ratioReport.color_details;

                  return (
                    <div className="overflow-x-auto">
                      {searchFilter && (
                        <div className="mb-2 text-sm text-gray-600">
                          Showing {filteredDetails.length} of {ratioReport.color_details.length} items
                        </div>
                      )}
                      <table className="w-full text-xs border-collapse">
                        <thead className="bg-gray-100 sticky top-0 z-10">
                          <tr>
                            {ratioReport.color_details[0]?.epNo !== undefined && (
                              <th className="px-2 py-1 text-left border">EP NO</th>
                            )}
                            {ratioReport.color_details[0]?.itemCode !== undefined && (
                              <th className="px-2 py-1 text-left border">Item Code</th>
                            )}
                            {ratioReport.color_details[0]?.itemDescription !== undefined && (
                              <th className="px-2 py-1 text-left border">Item Desc</th>
                            )}
                            {ratioReport.color_details[0]?.price !== undefined && (
                              <th className="px-2 py-1 text-left border">Price</th>
                            )}
                            <th className="px-2 py-1 text-left border">Color</th>
                            <th className="px-2 py-1 text-left border">Size</th>
                            <th className="px-2 py-1 text-left border">Req Qty</th>
                            <th className="px-2 py-1 text-left border">Plate</th>
                            <th className="px-2 py-1 text-left border">UPS</th>
                            <th className="px-2 py-1 text-left border">Sheets</th>
                            <th className="px-2 py-1 text-left border">Qty Prod</th>
                            <th className="px-2 py-1 text-left border">Excess</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredDetails.map((detail, index) => {
                            const originalIndex = ratioReport.color_details.findIndex(d => 
                              d.itemCode === detail.itemCode && 
                              d.color === detail.color && 
                              d.size === detail.size
                            );
                            return (
                              <tr 
                                key={index} 
                                className={`
                                  ${originalIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                                  ${highlightedRowIndex === originalIndex ? 'bg-yellow-100 ring-2 ring-yellow-400' : ''}
                                  transition-colors
                                `}
                                onClick={() => setHighlightedRowIndex(originalIndex)}
                              >
                            {detail.epNo !== undefined && (
                              <td className="px-2 py-1 border">{detail.epNo || 'N/A'}</td>
                            )}
                            {detail.itemCode !== undefined && (
                              <td className="px-2 py-1 border">{detail.itemCode || 'N/A'}</td>
                            )}
                            {detail.itemDescription !== undefined && (
                              <td className="px-2 py-1 border text-xs">{detail.itemDescription || 'N/A'}</td>
                            )}
                            {detail.price !== undefined && (
                              <td className="px-2 py-1 border">{detail.price || 'N/A'}</td>
                            )}
                            <td className="px-2 py-1 border">{detail.color || 'N/A'}</td>
                            <td className="px-2 py-1 border">{detail.size || 'N/A'}</td>
                            <td className="px-2 py-1 border">{detail.requiredQty || 'N/A'}</td>
                            <td className="px-2 py-1 border font-medium text-blue-600">{detail.plate || 'N/A'}</td>
                            <td className="px-2 py-1 border">{detail.ups || 'N/A'}</td>
                            <td className="px-2 py-1 border">{detail.sheets || 'N/A'}</td>
                            <td className="px-2 py-1 border">{detail.qtyProduced || 'N/A'}</td>
                            <td className="px-2 py-1 border">
                              <span className={detail.excessQty > 0 ? 'text-orange-600 font-medium' : 'text-green-600'}>
                                {detail.excessQty || 'N/A'}
                              </span>
                            </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Final Layout PDF with Annotations */}
          <div className="w-1/2 overflow-hidden flex flex-col p-4">
            <Card className="flex flex-col h-full">
              <CardHeader className="flex-shrink-0">
                <div className="flex items-center justify-between mb-2">
                  <CardTitle className="text-lg">Final Layout PDF</CardTitle>
                  <a
                    href={finalLayoutUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open in Drive
                  </a>
                </div>
                {showAnnotationToolbar && (
                  <AnnotationToolbar
                    annotationMode={annotationMode}
                    onModeChange={setAnnotationMode}
                    onClear={clearAllAnnotations}
                    onSave={saveAnnotations}
                    annotationCount={annotations.length}
                    isSaving={isSavingAnnotations}
                  />
                )}
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0 relative">
                <div
                  ref={pdfContainerRef}
                  className="h-full w-full border rounded-lg overflow-hidden bg-gray-50 relative"
                  onClick={handlePdfContainerClick}
                  style={{ cursor: annotationMode ? 'crosshair' : 'default' }}
                >
                  {/* PDF Iframe */}
                  {(() => {
                    // Convert Google Drive URL to preview/embed URL
                    const fileIdMatch = finalLayoutUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
                    if (fileIdMatch) {
                      const fileId = fileIdMatch[1];
                      const previewUrl = `https://drive.google.com/file/d/${fileId}/preview`;
                      return (
                        <iframe
                          src={previewUrl}
                          className="w-full h-full border-0 pointer-events-none"
                          title="Final Layout PDF Preview"
                          allow="autoplay"
                        />
                      );
                    }
                    // Fallback to original URL
                    return (
                      <iframe
                        src={finalLayoutUrl}
                        className="w-full h-full border-0 pointer-events-none"
                        title="Final Layout PDF Preview"
                        allow="autoplay"
                      />
                    );
                  })()}

                  {/* Annotation Overlay */}
                  {!isLoadingAnnotations && (
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
                            `}
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteAnnotation(annotation.id);
                            }}
                            title={annotation.comment || `${annotation.type === 'tick' ? 'Approved' : 'Rejected'}`}
                          >
                            {annotation.type === 'tick' ? (
                              <Check className="w-5 h-5" />
                            ) : (
                              <XIcon className="w-5 h-5" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Annotation Mode Indicator */}
                  {annotationMode && (
                    <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-2 rounded-lg text-sm z-10">
                      Click on the PDF to add a {annotationMode === 'tick' ? '✓ tick' : '✗ cross'} mark
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Actions Panel */}
        {showQuickActions && (
          <div className="absolute top-20 right-6 bg-white border rounded-lg shadow-lg p-4 z-50 w-64">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Quick Actions
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Review Note</label>
                <Textarea
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder="Add notes about this comparison..."
                  className="text-sm"
                  rows={3}
                />
              </div>
              <Button
                onClick={() => {
                  setIsMarkedAsReviewed(true);
                  toast.success('Marked as reviewed');
                  if (reviewNote.trim()) {
                    toast.info(`Note: ${reviewNote}`);
                  }
                }}
                className="w-full"
                variant={isMarkedAsReviewed ? "outline" : "default"}
                disabled={isMarkedAsReviewed}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                {isMarkedAsReviewed ? 'Marked as Reviewed' : 'Mark as Reviewed'}
              </Button>
              <Button
                onClick={() => {
                  saveAnnotations();
                }}
                className="w-full"
                variant="outline"
                disabled={annotations.length === 0 || isSavingAnnotations}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                {isSavingAnnotations ? 'Saving...' : `Save Annotations (${annotations.length})`}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

