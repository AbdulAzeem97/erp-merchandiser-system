import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  CheckCircle2, 
  Circle, 
  Loader2, 
  ArrowUp, 
  ArrowDown, 
  GripVertical,
  Save,
  X,
  Info
} from 'lucide-react';
import { ProcessStep } from '@/types/erp';
import { processSequencesAPI } from '@/services/api';
import { toast } from 'sonner';

interface ProcessSequenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  jobCardId: string;
  productType: string;
  initialSteps?: ProcessStep[];
  onSave: (steps: ProcessStep[]) => void;
}

export const ProcessSequenceModal: React.FC<ProcessSequenceModalProps> = ({
  isOpen,
  onClose,
  jobId,
  jobCardId,
  productType,
  initialSteps = [],
  onSave
}) => {
  const [processSteps, setProcessSteps] = useState<ProcessStep[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && productType) {
      console.log('🔄 ProcessSequenceModal opened for job:', jobId, 'productType:', productType);
      console.log('🔄 Job ID type:', typeof jobId, 'Job ID value:', jobId);
      console.log('🔄 Job Card ID:', jobCardId);
      loadProcessSequence();
    }
  }, [isOpen, productType, jobId]);

  const loadProcessSequence = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Loading process sequence for job:', jobId);
      
      // Try to get job-specific process sequence first
      let response;
      try {
        response = await processSequencesAPI.getForJob(jobId);
        console.log('Loaded job-specific process sequence:', response);
      } catch (jobError) {
        console.log('No job-specific process sequence found, loading by product type:', productType);
        // Fallback to product type if no job-specific sequence exists
        response = await processSequencesAPI.getByProductType(productType as any);
      }
      
      let steps = response.process_sequence?.steps || response.steps || [];
      
      // If we have initial steps, use them as the base
      if (initialSteps.length > 0) {
        steps = steps.map(step => {
          const initialStep = initialSteps.find(initStep => initStep.id === step.id);
          return {
            ...step,
            isSelected: initialStep ? initialStep.isSelected : Boolean(step.isCompulsory || step.is_compulsory)
          };
        });
      } else {
        // Default selection: all compulsory steps
        steps = steps.map(step => ({
          ...step,
          isSelected: Boolean(step.isCompulsory || step.is_compulsory)
        }));
      }
      
      setProcessSteps(steps);
      console.log('Process sequence loaded:', steps.length, 'steps');
    } catch (error) {
      console.error('Error loading process sequence:', error);
      setError('Failed to load process sequence');
      toast.error('Failed to load process sequence');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStepToggle = (stepId: string) => {
    setProcessSteps(prev => 
      prev.map(step => 
        step.id === stepId 
          ? { ...step, isSelected: !step.isSelected }
          : step
      )
    );
  };

  const moveStep = (stepId: string, direction: 'up' | 'down') => {
    setProcessSteps(prev => {
      const newSteps = [...prev];
      const currentIndex = newSteps.findIndex(step => step.id === stepId);
      
      if (direction === 'up' && currentIndex > 0) {
        [newSteps[currentIndex], newSteps[currentIndex - 1]] = [newSteps[currentIndex - 1], newSteps[currentIndex]];
      } else if (direction === 'down' && currentIndex < newSteps.length - 1) {
        [newSteps[currentIndex], newSteps[currentIndex + 1]] = [newSteps[currentIndex + 1], newSteps[currentIndex]];
      }
      
      return newSteps;
    });
  };

  const handleSave = async () => {
    console.log('💾 Saving process sequence for job:', jobId);
    console.log('💾 Job ID type:', typeof jobId, 'Job ID value:', jobId);
    console.log('💾 Selected steps:', processSteps.filter(step => step.isSelected));
    
    if (!jobId || jobId === '') {
      console.error('❌ Job ID is empty or undefined!');
      toast.error('Job ID is missing. Cannot save process sequence.');
      return;
    }
    
    setIsSaving(true);
    try {
      const selectedSteps = processSteps.filter(step => step.isSelected);
      
      // Save to backend using job-specific endpoint
      console.log('💾 Calling API to save process sequence...');
      console.log('💾 API URL will be:', `/api/process-sequences/for-job/${jobId}`);
      await processSequencesAPI.saveForJob(jobId, selectedSteps);
      console.log('✅ Process sequence saved successfully');
      
      // Call the parent's onSave callback
      onSave(selectedSteps);
      
      toast.success('Process sequence updated successfully');
      onClose();
    } catch (error) {
      console.error('❌ Error saving process sequence:', error);
      toast.error('Failed to save process sequence');
    } finally {
      setIsSaving(false);
    }
  };

  const selectedStepsCount = processSteps.filter(step => step.isSelected).length;
  const compulsoryStepsCount = processSteps.filter(step => step.isCompulsory || step.is_compulsory).length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Edit Process Sequence
          </DialogTitle>
          <DialogDescription>
            Configure the process sequence for Job {jobCardId} - {productType}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4 min-h-0">
          {/* Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Process Summary</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>{selectedStepsCount} steps selected</span>
                </div>
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-blue-600" />
                  <span>{compulsoryStepsCount} compulsory steps</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Process Steps */}
          <Card className="flex-1 flex flex-col min-h-0">
            <CardHeader className="pb-3 flex-shrink-0">
              <CardTitle className="text-sm font-medium">Process Steps</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 flex-1 flex flex-col min-h-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading process sequence...</span>
                </div>
              ) : error ? (
                <div className="text-center py-8 text-red-600">
                  <p>{error}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={loadProcessSequence}
                    className="mt-2"
                  >
                    Retry
                  </Button>
                </div>
              ) : (
                <ScrollArea className="flex-1">
                  <div className="space-y-2 pr-4 pb-4">
                    {processSteps.map((step, index) => (
                      <motion.div
                        key={step.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50"
                      >
                        {/* Drag Handle */}
                        <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
                        
                        {/* Step Number */}
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>

                        {/* Step Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-sm truncate">{step.name}</h4>
                            {step.isCompulsory || step.is_compulsory ? (
                              <Badge variant="secondary" className="text-xs">
                                Compulsory
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">
                                Optional
                              </Badge>
                            )}
                          </div>
                          {step.description && (
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                              {step.description}
                            </p>
                          )}
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-2">
                          {/* Move Up */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => moveStep(step.id, 'up')}
                            disabled={index === 0}
                            className="h-8 w-8 p-0"
                          >
                            <ArrowUp className="h-3 w-3" />
                          </Button>

                          {/* Move Down */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => moveStep(step.id, 'down')}
                            disabled={index === processSteps.length - 1}
                            className="h-8 w-8 p-0"
                          >
                            <ArrowDown className="h-3 w-3" />
                          </Button>

                          {/* Toggle Selection */}
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`step-${step.id}`}
                              checked={step.isSelected}
                              onCheckedChange={() => handleStepToggle(step.id)}
                              disabled={step.isCompulsory || step.is_compulsory}
                            />
                            <Label 
                              htmlFor={`step-${step.id}`}
                              className="text-sm cursor-pointer"
                            >
                              {step.isSelected ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              ) : (
                                <Circle className="h-4 w-4 text-gray-400" />
                              )}
                            </Label>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Actions - Fixed at bottom */}
          <div className="flex-shrink-0 flex items-center justify-between pt-4 border-t bg-white">
            <div className="text-sm text-gray-600">
              {selectedStepsCount} of {processSteps.length} steps selected
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={onClose} disabled={isSaving}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving || selectedStepsCount === 0}>
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProcessSequenceModal;
