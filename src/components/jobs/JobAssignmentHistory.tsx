import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  History,
  User,
  Clock,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  MessageSquare,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { jobAssignmentHistoryAPI } from '@/services/api';
import { toast } from 'sonner';

interface AssignmentHistoryRecord {
  id: number;
  job_id: number;
  assigned_to: number;
  assigned_by: number;
  previous_designer?: number;
  action_type: 'ASSIGNED' | 'REASSIGNED' | 'UNASSIGNED';
  notes?: string;
  created_at: string;
  assigned_by_name?: string;
  assigned_to_name?: string;
  previous_designer_name?: string;
  jobNumber?: string;
  job_status?: string;
}

interface JobAssignmentHistoryProps {
  jobId: string;
  jobCardId?: string;
  onClose?: () => void;
}

export const JobAssignmentHistory: React.FC<JobAssignmentHistoryProps> = ({
  jobId,
  jobCardId,
  onClose
}) => {
  const [history, setHistory] = useState<AssignmentHistoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAssignmentHistory();
  }, [jobId]);

  const loadAssignmentHistory = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('📋 Loading assignment history for job:', jobId);
      const response = await jobAssignmentHistoryAPI.getJobHistory(jobId);
      
      if (response.success) {
        setHistory(response.history || []);
        console.log('📋 Assignment history loaded:', response.history?.length || 0, 'records');
      } else {
        setError('Failed to load assignment history');
        toast.error('Failed to load assignment history');
      }
    } catch (error) {
      console.error('Error loading assignment history:', error);
      setError('Failed to load assignment history');
      toast.error('Failed to load assignment history');
    } finally {
      setIsLoading(false);
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'ASSIGNED':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'REASSIGNED':
        return <RotateCcw className="h-4 w-4 text-blue-600" />;
      case 'UNASSIGNED':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case 'ASSIGNED':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'REASSIGNED':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'UNASSIGNED':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Assignment History
            {jobCardId && <span className="text-sm font-normal text-gray-500">- {jobCardId}</span>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading assignment history...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Assignment History
            {jobCardId && <span className="text-sm font-normal text-gray-500">- {jobCardId}</span>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button variant="outline" onClick={loadAssignmentHistory}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Assignment History
            {jobCardId && <span className="text-sm font-normal text-gray-500">- {jobCardId}</span>}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadAssignmentHistory}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            {onClose && (
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <div className="text-center py-8">
            <History className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No assignment history found</p>
            <p className="text-sm text-gray-400 mt-1">Assignment records will appear here when jobs are assigned or reassigned</p>
          </div>
        ) : (
          <ScrollArea className="h-96">
            <div className="space-y-4">
              <AnimatePresence>
                {history.map((record, index) => (
                  <motion.div
                    key={record.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative"
                  >
                    {/* Timeline line */}
                    {index < history.length - 1 && (
                      <div className="absolute left-6 top-12 w-0.5 h-16 bg-gray-200" />
                    )}
                    
                    <div className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50">
                      {/* Action icon */}
                      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center">
                        {getActionIcon(record.action_type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getActionColor(record.action_type)}>
                            {record.action_type}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {formatDate(record.created_at)}
                          </span>
                        </div>

                        {/* Assignment details */}
                        <div className="space-y-2">
                          {record.action_type === 'ASSIGNED' && (
                            <div className="flex items-center gap-2 text-sm">
                              <User className="h-4 w-4 text-gray-500" />
                              <span className="text-gray-600">Assigned to</span>
                              <span className="font-medium">{record.assigned_to_name || `User ${record.assigned_to}`}</span>
                              <span className="text-gray-500">by</span>
                              <span className="font-medium">{record.assigned_by_name || `User ${record.assigned_by}`}</span>
                            </div>
                          )}

                          {record.action_type === 'REASSIGNED' && (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm">
                                <ArrowLeft className="h-4 w-4 text-red-500" />
                                <span className="text-gray-600">From:</span>
                                <span className="font-medium">{record.previous_designer_name || `User ${record.previous_designer}`}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <ArrowRight className="h-4 w-4 text-green-500" />
                                <span className="text-gray-600">To:</span>
                                <span className="font-medium">{record.assigned_to_name || `User ${record.assigned_to}`}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <User className="h-4 w-4 text-gray-500" />
                                <span className="text-gray-600">Reassigned by:</span>
                                <span className="font-medium">{record.assigned_by_name || `User ${record.assigned_by}`}</span>
                              </div>
                            </div>
                          )}

                          {record.action_type === 'UNASSIGNED' && (
                            <div className="flex items-center gap-2 text-sm">
                              <XCircle className="h-4 w-4 text-red-500" />
                              <span className="text-gray-600">Unassigned from</span>
                              <span className="font-medium">{record.assigned_to_name || `User ${record.assigned_to}`}</span>
                              <span className="text-gray-500">by</span>
                              <span className="font-medium">{record.assigned_by_name || `User ${record.assigned_by}`}</span>
                            </div>
                          )}

                          {/* Notes */}
                          {record.notes && (
                            <div className="flex items-start gap-2 text-sm mt-2">
                              <MessageSquare className="h-4 w-4 text-gray-500 mt-0.5" />
                              <span className="text-gray-600 italic">"{record.notes}"</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default JobAssignmentHistory;
