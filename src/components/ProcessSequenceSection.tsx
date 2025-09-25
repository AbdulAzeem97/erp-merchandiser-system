import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Settings, CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { ProductType, PRODUCT_TYPES, ProcessStep } from '../types/erp';
import { processSequencesAPI } from '@/services/api';
import { PROCESS_SEQUENCES } from '@/data/processSequences';

interface ProcessSequenceSectionProps {
  selectedProductType: ProductType;
  onProductTypeChange: (productType: ProductType) => void;
  onProcessStepsChange?: (steps: ProcessStep[]) => void;
  initialSelectedSteps?: ProcessStep[];
}

export const ProcessSequenceSection: React.FC<ProcessSequenceSectionProps> = ({
  selectedProductType,
  onProductTypeChange,
  onProcessStepsChange,
  initialSelectedSteps
}) => {
  const [processSteps, setProcessSteps] = useState<ProcessStep[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProcessSequence = async () => {
      if (!selectedProductType) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        console.log('Attempting to fetch from API for product type:', selectedProductType);
        const response = await processSequencesAPI.getByProductType(selectedProductType);
        let steps = response.process_sequence?.steps || response.steps || [];
        
        console.log('API response received:', steps.length, 'steps');
        
        // Default selection: all compulsory steps
        steps = steps.map(step => ({
          ...step,
          isSelected: Boolean(step.isCompulsory || step.is_compulsory)
        }));
        
        setProcessSteps(steps);
        if (onProcessStepsChange) {
          onProcessStepsChange(steps);
        }
      } catch (err) {
        console.warn('API failed, falling back to static data:', err);
        
        // Fallback to static data with proper ID mapping
        const staticData = PROCESS_SEQUENCES.find(seq => seq.productType === selectedProductType);
        if (staticData) {
          let steps = staticData.steps.map(step => ({
            id: step.id,
            name: step.name,
            isCompulsory: step.isCompulsory,
            is_compulsory: step.isCompulsory,
            isSelected: step.isCompulsory,
            order: step.order
          }));
          
          console.log('Using static data:', steps.length, 'steps for', selectedProductType);
          setProcessSteps(steps);
          if (onProcessStepsChange) {
            onProcessStepsChange(steps);
          }
        } else {
          setError('Process sequence not found for this product type');
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProcessSequence();
  }, [selectedProductType]);

  // Separate effect for handling initial selections
  useEffect(() => {
    if (processSteps.length > 0 && initialSelectedSteps && initialSelectedSteps.length > 0) {
      const updatedSteps = processSteps.map(step => ({
        ...step,
        isSelected: Boolean((step.isCompulsory || step.is_compulsory) || initialSelectedSteps.some(
          initial => initial.id === step.id && initial.isSelected
        ))
      }));

      setProcessSteps(updatedSteps);
      if (onProcessStepsChange) {
        onProcessStepsChange(updatedSteps);
      }
    }
  }, [initialSelectedSteps]);

  const handleStepToggle = (stepId: string, checked: boolean) => {
    const updatedSteps = processSteps.map(step => 
      step.id === stepId && !(step.isCompulsory || step.is_compulsory)
        ? { ...step, isSelected: checked }
        : step
    );
    
    setProcessSteps(updatedSteps);
    
    // Notify parent component of changes
    if (onProcessStepsChange) {
      onProcessStepsChange(updatedSteps);
    }
  };

  const compulsorySteps = processSteps.filter(step => step.isCompulsory || step.is_compulsory);
  const optionalSteps = processSteps.filter(step => !(step.isCompulsory || step.is_compulsory));
  const selectedOptionalSteps = optionalSteps.filter(step => step.isSelected);

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <Settings className="w-5 h-5 text-primary" />
          Process Sequence & Department Flow
        </CardTitle>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4 text-success" />
            <span>{compulsorySteps.length} Compulsory</span>
          </div>
          <div className="flex items-center gap-1">
            <Circle className="w-4 h-4 text-muted-foreground" />
            <span>{selectedOptionalSteps.length}/{optionalSteps.length} Optional Selected</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Product Type Selection */}
        <div className="space-y-2">
          <Label htmlFor="productType" className="text-sm font-medium">
            Product Type
          </Label>
          <Select 
            value={selectedProductType} 
            onValueChange={(value: ProductType) => onProductTypeChange(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select product type" />
            </SelectTrigger>
            <SelectContent>
              {PRODUCT_TYPES.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="ml-2 text-sm text-muted-foreground">Loading process steps...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-6">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Process Steps */}
        {!isLoading && !error && processSteps.length > 0 && (
          <div className="space-y-4">
            {/* Compulsory Steps */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="default" className="text-xs bg-success hover:bg-success/90">
                  Compulsory Steps
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {compulsorySteps.length} steps - automatically included
                </span>
              </div>
              <ScrollArea className="h-32 rounded-md border bg-muted/30 p-3">
                <div className="space-y-2">
                  {compulsorySteps.map((step) => (
                    <div key={step.id} className="flex items-center gap-3">
                      <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                      <span className="text-sm font-medium text-foreground">{step.order}.</span>
                      <span className="text-sm text-foreground">{step.name}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Optional Steps */}
            {optionalSteps.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      Optional Steps
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Select additional processes as needed
                    </span>
                  </div>
                  <ScrollArea className="h-48 rounded-md border p-3">
                    <div className="space-y-3">
                      {optionalSteps.map((step) => (
                        <div key={step.id} className="flex items-center gap-3">
                          <Checkbox
                            id={step.id}
                            checked={step.isSelected}
                            onCheckedChange={(checked) => 
                              handleStepToggle(step.id, checked as boolean)
                            }
                          />
                          <Label 
                            htmlFor={step.id} 
                            className="text-sm cursor-pointer flex items-center gap-2 flex-1"
                          >
                            <span className="font-medium text-muted-foreground">{step.order}.</span>
                            <span className={step.isSelected ? 'text-foreground font-medium' : 'text-muted-foreground'}>
                              {step.name}
                            </span>
                          </Label>
                          {step.isSelected && (
                            <Badge variant="secondary" className="text-xs px-2 py-0">
                              Selected
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </>
            )}

            {/* Summary */}
            <div className="bg-accent/50 rounded-lg p-3 border">
              <div className="text-sm font-medium text-accent-foreground mb-2">
                Process Summary
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>Total Steps: {compulsorySteps.length + selectedOptionalSteps.length}</div>
                <div>Estimated Timeline: Based on selected processes</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
