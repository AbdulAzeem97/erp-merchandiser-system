import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Package, TrendingUp, AlertCircle } from 'lucide-react';
import { getApiUrl } from '@/utils/apiConfig';
import { PlateProgressTracker } from './PlateProgressTracker';
import { DailyProgressView } from './DailyProgressView';

interface JobProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: number;
  assignmentId?: number;
  totalPlates?: number;
  plateLabels?: string[];
  targetSheetsMap?: Record<string, number>;
}

export const JobProgressModal: React.FC<JobProgressModalProps> = ({
  isOpen,
  onClose,
  jobId,
  assignmentId,
  totalPlates = 0,
  plateLabels,
  targetSheetsMap
}) => {
  const [progress, setProgress] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const apiUrl = getApiUrl();
  const token = localStorage.getItem('authToken');

  useEffect(() => {
    if (isOpen && jobId) {
      loadJobProgress();
    }
  }, [isOpen, jobId]);

  const loadJobProgress = async () => {
    try {
      setIsLoading(true);
      // Get assignment ID if not provided
      let finalAssignmentId = assignmentId;
      if (!finalAssignmentId) {
        const assignmentResponse = await fetch(
          `${apiUrl}/api/offset-printing/jobs/${jobId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        if (assignmentResponse.ok) {
          const jobData = await assignmentResponse.json();
          finalAssignmentId = jobData.job?.assignment_id;
        }
      }

      if (finalAssignmentId) {
        const response = await fetch(
          `${apiUrl}/api/offset-printing/progress/${finalAssignmentId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          setProgress(data);
        }
      }
    } catch (error) {
      console.error('Error loading job progress:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const summary = progress?.summary;
  const progressList = progress?.progress || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Job Progress Details</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Loading progress...</div>
        ) : (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="plates">Plate Progress</TabsTrigger>
              <TabsTrigger value="daily">Daily Summary</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {summary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-sm text-blue-600 mb-1">Total Plates</div>
                    <div className="text-2xl font-bold text-blue-900">{summary.total_plates || 0}</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-sm text-green-600 mb-1">Completed</div>
                    <div className="text-2xl font-bold text-green-900">{summary.completed_plates || 0}</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-sm text-purple-600 mb-1">Sheets Completed</div>
                    <div className="text-2xl font-bold text-purple-900">{summary.total_sheets_completed || 0}</div>
                  </div>
                  <div className="bg-indigo-50 p-4 rounded-lg">
                    <div className="text-sm text-indigo-600 mb-1">Progress</div>
                    <div className="text-2xl font-bold text-indigo-900">{summary.overall_progress_percentage?.toFixed(1) || 0}%</div>
                  </div>
                </div>
              )}

              {summary && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Overall Progress</span>
                    <span className="text-sm text-gray-600">{summary.overall_progress_percentage?.toFixed(1) || 0}%</span>
                  </div>
                  <Progress value={summary.overall_progress_percentage || 0} className="h-3" />
                </div>
              )}

              {summary?.estimated_completion_date && (
                <div className="bg-yellow-50 p-4 rounded-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-yellow-600" />
                  <div>
                    <div className="text-sm font-medium text-yellow-900">Estimated Completion</div>
                    <div className="text-sm text-yellow-700">
                      {new Date(summary.estimated_completion_date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <h3 className="font-semibold mb-2">Recent Progress</h3>
                <div className="space-y-2">
                  {progressList.slice(0, 10).map((p: any, idx: number) => (
                    <div key={idx} className="border rounded p-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span>Plate {p.plate_number} - {new Date(p.date).toLocaleDateString()}</span>
                        <Badge>{p.sheets_completed} sheets</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="plates">
              {assignmentId && totalPlates > 0 ? (
                <PlateProgressTracker
                  assignmentId={assignmentId}
                  jobCardId={jobId}
                  totalPlates={totalPlates}
                  plateLabels={plateLabels}
                  targetSheetsMap={targetSheetsMap}
                  onProgressUpdate={loadJobProgress}
                />
              ) : (
                <div className="text-center py-8 text-gray-500">Assignment information not available</div>
              )}
            </TabsContent>

            <TabsContent value="daily">
              {assignmentId ? (
                <DailyProgressView assignmentId={assignmentId} />
              ) : (
                <div className="text-center py-8 text-gray-500">Assignment information not available</div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};

