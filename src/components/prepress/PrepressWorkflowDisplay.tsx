import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Palette, 
  Wrench, 
  Cpu, 
  CheckCircle, 
  Clock, 
  User,
  Calendar,
  Building
} from 'lucide-react';

interface PrepressWorkflowDisplayProps {
  jobCardId: string;
  prepressStatus: string;
  workflowProgress?: {
    stages: Array<{
      key: string;
      label: string;
      status: 'pending' | 'current' | 'completed';
    }>;
    currentStage: string;
    progress: number;
  };
  designerName?: string;
  startDate?: string;
  department?: string;
  onStatusUpdate?: (newStatus: string, notes?: string) => void;
  showActions?: boolean;
  compact?: boolean;
}

const PrepressWorkflowDisplay: React.FC<PrepressWorkflowDisplayProps> = ({
  jobCardId,
  prepressStatus,
  workflowProgress,
  designerName,
  startDate,
  department = 'Prepress Department',
  onStatusUpdate,
  showActions = false,
  compact = false
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DESIGNING':
      case 'DESIGNING_COMPLETED':
        return <Palette className="w-4 h-4" />;
      case 'DIE_MAKING':
      case 'DIE_MAKING_COMPLETED':
        return <Wrench className="w-4 h-4" />;
      case 'PLATE_MAKING':
      case 'PLATE_MAKING_COMPLETED':
        return <Cpu className="w-4 h-4" />;
      case 'PREPRESS_COMPLETED':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DESIGNING':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'DESIGNING_COMPLETED':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'DIE_MAKING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'DIE_MAKING_COMPLETED':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'PLATE_MAKING':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'PLATE_MAKING_COMPLETED':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'PREPRESS_COMPLETED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getNextAction = (status: string) => {
    switch (status) {
      case 'ASSIGNED':
        return { action: 'DESIGNING', label: 'Start Designing', color: 'bg-blue-600 hover:bg-blue-700' };
      case 'DESIGNING':
        return { action: 'DESIGNING_COMPLETED', label: 'Complete Design', color: 'bg-green-600 hover:bg-green-700' };
      case 'DIE_MAKING':
        return { action: 'DIE_MAKING_COMPLETED', label: 'Complete Die Making', color: 'bg-green-600 hover:bg-green-700' };
      case 'PLATE_MAKING':
        return { action: 'PLATE_MAKING_COMPLETED', label: 'Complete Plate Making', color: 'bg-green-600 hover:bg-green-700' };
      default:
        return null;
    }
  };

  const nextAction = getNextAction(prepressStatus);

  if (compact) {
    return (
      <div className="flex items-center space-x-2">
        {getStatusIcon(prepressStatus)}
        <Badge className={`${getStatusColor(prepressStatus)} border text-xs`}>
          {prepressStatus.replace(/_/g, ' ')}
        </Badge>
        {workflowProgress && (
          <span className="text-xs text-gray-600">
            {workflowProgress.progress}%
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header with Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {getStatusIcon(prepressStatus)}
          <span className="text-sm font-medium text-gray-700">Prepress Status</span>
        </div>
        <Badge className={`${getStatusColor(prepressStatus)} border`}>
          {prepressStatus.replace(/_/g, ' ')}
        </Badge>
      </div>

      {/* Workflow Progress */}
      {workflowProgress && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-600">Progress</span>
            <span className="text-xs font-medium text-gray-800">
              {workflowProgress.progress}% Complete
            </span>
          </div>
          <Progress value={workflowProgress.progress} className="h-2" />
          
          {/* Stage Indicators */}
          <div className="grid grid-cols-3 gap-2">
            {workflowProgress.stages.map((stage, index) => (
              <div key={stage.key} className="flex items-center space-x-1">
                <div className={`w-2 h-2 rounded-full ${
                  stage.status === 'completed' ? 'bg-green-500' :
                  stage.status === 'current' ? 'bg-blue-500' : 'bg-gray-300'
                }`}></div>
                <span className={`text-xs ${
                  stage.status === 'completed' ? 'text-green-700' :
                  stage.status === 'current' ? 'text-blue-700 font-medium' : 'text-gray-500'
                }`}>
                  {stage.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Designer Info */}
      {(designerName || startDate || department) && (
        <div className="p-2 bg-gray-50 rounded-lg space-y-1">
          {designerName && (
            <div className="flex items-center space-x-2 text-xs text-gray-600">
              <User className="w-3 h-3" />
              <span>Designer: {designerName}</span>
            </div>
          )}
          {startDate && (
            <div className="flex items-center space-x-2 text-xs text-gray-600">
              <Calendar className="w-3 h-3" />
              <span>Started: {new Date(startDate).toLocaleDateString()}</span>
            </div>
          )}
          <div className="flex items-center space-x-2 text-xs text-gray-600">
            <Building className="w-3 h-3" />
            <span>Department: {department}</span>
          </div>
        </div>
      )}

      {/* Action Button */}
      {showActions && nextAction && onStatusUpdate && (
        <Button
          size="sm"
          onClick={() => onStatusUpdate(nextAction.action, `${nextAction.label} for job ${jobCardId}`)}
          className={`${nextAction.color} text-white w-full`}
        >
          {nextAction.label}
        </Button>
      )}
    </div>
  );
};

export default PrepressWorkflowDisplay;
