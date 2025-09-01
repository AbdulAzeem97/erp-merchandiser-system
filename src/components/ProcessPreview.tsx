import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, Factory, Clock, Users } from 'lucide-react';
import { ProcessStep, ProductType } from '../types/erp';

interface ProcessPreviewProps {
  selectedProductType: ProductType;
  selectedProcessSteps: ProcessStep[];
}

// Map process steps to departments
const PROCESS_TO_DEPARTMENT_MAP: { [key: string]: string } = {
  'artwork': 'Design',
  'proofing': 'Design',
  'prepress': 'Prepress',
  'printing': 'Printing',
  'offset_printing': 'Printing',
  'digital_printing': 'Printing',
  'screen_printing': 'Printing',
  'cutting': 'Finishing',
  'die_cutting': 'Finishing',
  'lamination': 'Finishing',
  'coating': 'Finishing',
  'embossing': 'Finishing',
  'foiling': 'Finishing',
  'folding': 'Finishing',
  'binding': 'Finishing',
  'stitching': 'Assembly',
  'assembly': 'Assembly',
  'mounting': 'Assembly',
  'quality_check': 'Quality Control',
  'inspection': 'Quality Control',
  'final_check': 'Quality Control',
  'packaging': 'Packaging',
  'labeling': 'Packaging',
  'shipping_prep': 'Packaging'
};

// Department colors matching the dashboard
const DEPARTMENT_COLORS: { [key: string]: string } = {
  'Design': '#8B5CF6',
  'Prepress': '#06B6D4',
  'Printing': '#3B82F6',
  'Finishing': '#10B981',
  'Assembly': '#F59E0B',
  'Quality Control': '#EF4444',
  'Packaging': '#8B5CF6'
};

export const ProcessPreview: React.FC<ProcessPreviewProps> = ({
  selectedProductType,
  selectedProcessSteps
}) => {
  // Group steps by department (unified - no separation)
  const departmentGroups = selectedProcessSteps.reduce((groups, step) => {
    const departmentName = PROCESS_TO_DEPARTMENT_MAP[step.name.toLowerCase().replace(/\s+/g, '_')] || 'Other';
    if (!groups[departmentName]) {
      groups[departmentName] = [];
    }
    
    // Add all filtered steps to the same array
    if ((step.isCompulsory || step.is_compulsory) || (step.isSelected || step.is_selected)) {
      groups[departmentName].push(step);
    }
    
    return groups;
  }, {} as Record<string, ProcessStep[]>);

  const totalSteps = selectedProcessSteps.filter(step => 
    (step.isCompulsory || step.is_compulsory) || (step.isSelected || step.is_selected)
  ).length;

  const allFilteredSteps = selectedProcessSteps.filter(step => 
    (step.isCompulsory || step.is_compulsory) || (step.isSelected || step.is_selected)
  );

  if (selectedProcessSteps.length === 0) {
    return null;
  }

  return (
    <Card className="shadow-sm border-l-4 border-l-primary">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <Factory className="w-5 h-5 text-primary" />
          Production Flow Preview
        </CardTitle>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Badge variant="default" className="bg-primary/10 text-primary">
              {selectedProductType}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{totalSteps} Total Steps</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{Object.keys(departmentGroups).length} Departments</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{totalSteps}</div>
            <div className="text-xs text-muted-foreground">Total Process Steps</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{Object.keys(departmentGroups).length}</div>
            <div className="text-xs text-muted-foreground">Departments</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">7-10 Days</div>
            <div className="text-xs text-muted-foreground">Est. Duration</div>
          </div>
        </div>

        <Separator />

        {/* Department Flow */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
            <Factory className="w-4 h-4" />
            Department Flow & Process Steps
          </h4>
          
          <div className="space-y-3">
            {Object.entries(departmentGroups).map(([department, steps], index) => {
              const totalDeptSteps = steps.length;
              const departmentColor = DEPARTMENT_COLORS[department] || '#6B7280';
              
              return (
                <div key={department} className="border rounded-lg p-4 bg-card">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: departmentColor }}
                      />
                      <span className="font-medium text-foreground">{department}</span>
                      <Badge variant="secondary" className="text-xs">
                        {totalDeptSteps} steps
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Step {index + 1} of {Object.keys(departmentGroups).length}
                    </div>
                  </div>

                  {/* Unified Process Steps */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-4 h-4 text-purple-600" />
                      <span className="text-xs font-medium text-purple-700">
                        Process Steps ({steps.length})
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      {steps.map((step) => (
                        <div key={step.id} className="text-xs text-muted-foreground flex items-center gap-1">
                          <span className="w-4 text-center">{step.order}.</span>
                          <span>{step.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Flow Visualization */}
        <div className="p-4 bg-accent/30 rounded-lg">
          <h5 className="text-xs font-medium mb-2 text-accent-foreground">Production Flow</h5>
          <div className="flex items-center gap-2 flex-wrap">
            {Object.keys(departmentGroups).map((dept, index) => (
              <React.Fragment key={dept}>
                <div className="flex items-center gap-1">
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: DEPARTMENT_COLORS[dept] || '#6B7280' }}
                  />
                  <span className="text-xs text-accent-foreground">{dept}</span>
                </div>
                {index < Object.keys(departmentGroups).length - 1 && (
                  <span className="text-xs text-muted-foreground">→</span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};