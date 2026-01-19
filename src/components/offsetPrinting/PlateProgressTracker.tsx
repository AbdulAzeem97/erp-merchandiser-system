import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { getApiUrl } from '@/utils/apiConfig';
import { Calendar, Plus, Save, X, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface PlateProgress {
  id?: number;
  plate_number: number;
  date: string;
  sheets_completed: number;
  sheets_target?: number;
  status: string;
  notes?: string;
  operator_name?: string;
  quality_issues?: any[];
  downtime_minutes?: number;
}

interface PlateProgressTrackerProps {
  assignmentId: number;
  jobCardId: number;
  totalPlates: number;
  plateLabels?: string[]; // e.g., ["A", "B", "C"]
  targetSheetsMap?: Record<string, number>; // e.g., {A: 50, B: 45, C: 40}
  onProgressUpdate?: () => void;
}

export const PlateProgressTracker: React.FC<PlateProgressTrackerProps> = ({
  assignmentId,
  jobCardId,
  totalPlates,
  plateLabels,
  targetSheetsMap,
  onProgressUpdate
}) => {
  // Create mapping between plate labels (A, B, C) and plate numbers (1, 2, 3)
  const plateLabelToNumber = plateLabels && plateLabels.length > 0
    ? plateLabels.reduce((acc, label, index) => {
        acc[label] = index + 1;
        return acc;
      }, {} as Record<string, number>)
    : {};

  const numberToPlateLabel = plateLabels && plateLabels.length > 0
    ? plateLabels.reduce((acc, label, index) => {
        acc[index + 1] = label;
        return acc;
      }, {} as Record<number, string>)
    : {};
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [plateProgress, setPlateProgress] = useState<Map<number, PlateProgress>>(new Map());
  const [editingPlate, setEditingPlate] = useState<number | null>(null);
  const [editingData, setEditingData] = useState<{ sheetsCompleted: number; sheetsTarget: number; notes: string }>({
    sheetsCompleted: 0,
    sheetsTarget: 0,
    notes: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const apiUrl = getApiUrl();
  const token = localStorage.getItem('authToken');

  // Load daily progress
  useEffect(() => {
    loadDailyProgress();
  }, [assignmentId, selectedDate]);

  const loadDailyProgress = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `${apiUrl}/api/offset-printing/progress/${assignmentId}/daily/${selectedDate}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        const progressMap = new Map<number, PlateProgress>();
        
        data.progress.forEach((p: PlateProgress) => {
          progressMap.set(p.plate_number, p);
        });

        setPlateProgress(progressMap);
      }
    } catch (error) {
      console.error('Error loading daily progress:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProgress = async (plateNumber: number, sheetsCompleted: number, sheetsTarget?: number, notes?: string) => {
    try {
      setIsSaving(true);
      const userId = parseInt(localStorage.getItem('userId') || '0');

      const response = await fetch(`${apiUrl}/api/offset-printing/progress/record`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          assignmentId,
          plateNumber,
          sheetsCompleted,
          date: selectedDate,
          operatorId: userId,
          metadata: {
            sheetsTarget,
            notes,
            status: sheetsCompleted > 0 ? 'In Progress' : 'Not Started'
          }
        })
      });

      if (response.ok) {
        const plateLabel = numberToPlateLabel[plateNumber] || `Plate ${plateNumber}`;
        toast.success(`Progress recorded for Plate ${plateLabel}`);
        setEditingPlate(null);
        loadDailyProgress();
        if (onProgressUpdate) {
          onProgressUpdate();
        }
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to record progress');
      }
    } catch (error) {
      console.error('Error saving progress:', error);
      toast.error('Failed to record progress');
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config = {
      'Completed': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      'In Progress': { color: 'bg-blue-100 text-blue-800', icon: Clock },
      'Not Started': { color: 'bg-gray-100 text-gray-800', icon: X },
      'On Hold': { color: 'bg-orange-100 text-orange-800', icon: AlertCircle }
    };

    const statusConfig = config[status as keyof typeof config] || config['Not Started'];
    const Icon = statusConfig.icon;

    return (
      <Badge className={statusConfig.color}>
        <Icon className="h-3 w-3 mr-1" />
        {status}
      </Badge>
    );
  };

  const getProgressPercentage = (completed: number, target?: number) => {
    if (!target || target === 0) return 0;
    return Math.min(100, Math.round((completed / target) * 100));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Plate Progress Tracker
          </CardTitle>
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-40"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading progress...</div>
          ) : (
            <>
              {Array.from({ length: totalPlates }, (_, i) => i + 1).map((plateNum) => {
                const progress = plateProgress.get(plateNum);
                const isEditing = editingPlate === plateNum;
                const plateLabel = numberToPlateLabel[plateNum] || `Plate ${plateNum}`;
                const defaultTargetSheets = plateLabels && plateLabels.length > 0 && targetSheetsMap
                  ? targetSheetsMap[plateLabels[plateNum - 1]] || 0
                  : 0;
                
                return (
                  <div key={plateNum} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <h4 className="font-semibold">Plate {plateLabel}</h4>
                        {progress && getStatusBadge(progress.status)}
                      </div>
                      {!isEditing && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingPlate(plateNum);
                            setEditingData({
                              sheetsCompleted: progress?.sheets_completed || 0,
                              sheetsTarget: progress?.sheets_target || defaultTargetSheets,
                              notes: progress?.notes || ''
                            });
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          {progress ? 'Update' : 'Record'}
                        </Button>
                      )}
                    </div>

                    {progress && !isEditing && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Sheets Completed:</span>
                          <span className="font-medium">{progress.sheets_completed}</span>
                        </div>
                        {progress.sheets_target && (
                          <>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Target:</span>
                              <span className="font-medium">{progress.sheets_target}</span>
                            </div>
                            <Progress
                              value={getProgressPercentage(progress.sheets_completed, progress.sheets_target)}
                              className="h-2"
                            />
                            <div className="text-xs text-gray-500 text-right">
                              {getProgressPercentage(progress.sheets_completed, progress.sheets_target)}%
                            </div>
                          </>
                        )}
                        {progress.operator_name && (
                          <div className="text-xs text-gray-500">
                            Operator: {progress.operator_name}
                          </div>
                        )}
                        {progress.notes && (
                          <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                            {progress.notes}
                          </div>
                        )}
                        {progress.downtime_minutes && progress.downtime_minutes > 0 && (
                          <div className="text-xs text-orange-600">
                            Downtime: {progress.downtime_minutes} minutes
                          </div>
                        )}
                      </div>
                    )}

                    {isEditing && (
                      <div className="space-y-3 pt-2 border-t">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label>Sheets Completed</Label>
                            <Input
                              type="number"
                              value={editingData.sheetsCompleted}
                              onChange={(e) => setEditingData({ ...editingData, sheetsCompleted: parseInt(e.target.value) || 0 })}
                              min="0"
                            />
                          </div>
                          <div>
                            <Label>Target Sheets {defaultTargetSheets > 0 ? `(From Ratio: ${defaultTargetSheets})` : '(Optional)'}</Label>
                            <Input
                              type="number"
                              value={editingData.sheetsTarget}
                              onChange={(e) => setEditingData({ ...editingData, sheetsTarget: parseInt(e.target.value) || 0 })}
                              min="0"
                              placeholder={defaultTargetSheets > 0 ? defaultTargetSheets.toString() : 'Enter target sheets'}
                            />
                          </div>
                        </div>
                        <div>
                          <Label>Notes (Optional)</Label>
                          <Textarea
                            value={editingData.notes}
                            onChange={(e) => setEditingData({ ...editingData, notes: e.target.value })}
                            rows={2}
                            placeholder="Add any notes about this plate..."
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleSaveProgress(plateNum, editingData.sheetsCompleted, editingData.sheetsTarget || undefined, editingData.notes)}
                            disabled={isSaving}
                          >
                            <Save className="h-4 w-4 mr-2" />
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingPlate(null)}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

