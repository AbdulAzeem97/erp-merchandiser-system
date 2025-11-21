import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Scissors,
  Clock,
  CheckCircle,
  Package,
  Building2,
  Calendar,
  FileText,
  Eye
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useSocket } from '@/services/socketService.tsx';
import { toast } from 'sonner';

interface CuttingJob {
  id: string;
  job_card_id: string;
  jobNumber?: string;
  product_code?: string;
  product_name?: string;
  company_name?: string;
  customer_name?: string;
  quantity: number;
  priority: string;
  delivery_date: string;
  cutting_status?: string;
  cutting_comments?: string;
  cutting_started_at?: string;
  required_plate_count?: number;
  plate_count?: number;
  ctp_machine_name?: string;
  status_message?: string;
}

interface CuttingLaborViewProps {
  onLogout?: () => void;
}

const statusConfig = {
  'Pending': { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  'Assigned': { color: 'bg-blue-100 text-blue-800', icon: Clock },
  'In Progress': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
  'On Hold': { color: 'bg-orange-100 text-orange-800', icon: Clock },
  'Completed': { color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle },
  'Rejected': { color: 'bg-red-100 text-red-800', icon: Clock }
};

const CuttingLaborView: React.FC<CuttingLaborViewProps> = ({ onLogout }) => {
  const { socket, isConnected } = useSocket();
  const [jobs, setJobs] = useState<CuttingJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<CuttingJob | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [acknowledgedJobs, setAcknowledgedJobs] = useState<Set<string>>(new Set());

  // Get current user ID
  const getCurrentUserId = () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return user.id;
    }
    return null;
  };

  // Load assigned jobs
  const loadAssignedJobs = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('authToken');
      const userId = getCurrentUserId();
      
      if (!userId) {
        toast.error('User not found');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/cutting/live`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setJobs(data.jobs || []);
      } else {
        const error = await response.json();
        console.error('Error loading jobs:', error);
      }
    } catch (error) {
      console.error('Error loading assigned jobs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Mark job as acknowledged (read-only, no effect on workflow)
  const handleAcknowledge = (jobId: string) => {
    setAcknowledgedJobs(prev => new Set([...prev, jobId]));
  };

  // Load data on mount and set up polling
  useEffect(() => {
    loadAssignedJobs();
    
    // Poll for updates every 30 seconds
    const interval = setInterval(loadAssignedJobs, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Socket listeners
  useEffect(() => {
    if (socket && isConnected) {
      socket.on('cutting:job_assigned', (data) => {
        if (data.assignedTo === getCurrentUserId()) {
          loadAssignedJobs();
        }
      });

      socket.on('cutting:status_updated', () => {
        loadAssignedJobs();
      });

      return () => {
        socket.off('cutting:job_assigned');
        socket.off('cutting:status_updated');
      };
    }
  }, [socket, isConnected]);

  const getStatusIcon = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig];
    if (config) {
      const Icon = config.icon;
      return <Icon className="w-4 h-4" />;
    }
    return <Clock className="w-4 h-4" />;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header - Kiosk Mode */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white flex items-center justify-center gap-4 mb-4">
            <Scissors className="w-12 h-12" />
            Cutting Department - Labor View
          </h1>
          <p className="text-blue-200 text-lg">Your Assigned Tasks</p>
        </div>

        {/* Jobs Grid - Full Screen Kiosk Layout */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-white text-xl">Loading your tasks...</div>
          </div>
        ) : jobs.length === 0 ? (
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-12 text-center">
              <Package className="w-16 h-16 text-white/50 mx-auto mb-4" />
              <p className="text-white text-xl">No tasks assigned</p>
              <p className="text-white/70 mt-2">You will see your assigned cutting tasks here</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-lg shadow-xl p-6 hover:shadow-2xl transition-all cursor-pointer"
                onClick={() => {
                  setSelectedJob(job);
                  setIsDetailsOpen(true);
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {job.job_card_id || job.jobNumber}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">{job.product_code}</p>
                  </div>
                  <Badge className={statusConfig[job.cutting_status as keyof typeof statusConfig]?.color || 'bg-gray-100 text-gray-800'}>
                    {getStatusIcon(job.cutting_status || 'Pending')}
                    <span className="ml-1">{job.cutting_status || 'Pending'}</span>
                  </Badge>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Building2 className="w-4 h-4" />
                    <span className="text-sm">{job.company_name || job.customer_name || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Package className="w-4 h-4" />
                    <span className="text-sm">Qty: {job.quantity.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">Due: {formatDate(job.delivery_date)}</span>
                  </div>
                  {job.required_plate_count && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <FileText className="w-4 h-4" />
                      <span className="text-sm">
                        Plates: {job.plate_count || 0} / {job.required_plate_count}
                      </span>
                    </div>
                  )}
                </div>

                {!acknowledgedJobs.has(job.id) && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAcknowledge(job.id);
                    }}
                  >
                    Mark as Acknowledged
                  </Button>
                )}

                {acknowledgedJobs.has(job.id) && (
                  <div className="text-center text-sm text-green-600 font-medium">
                    ✓ Acknowledged
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Job Details Dialog */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Job Details</DialogTitle>
            </DialogHeader>
            {selectedJob && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Job Number</Label>
                    <p className="font-medium">{selectedJob.job_card_id || selectedJob.jobNumber}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Status</Label>
                    <Badge className={statusConfig[selectedJob.cutting_status as keyof typeof statusConfig]?.color || 'bg-gray-100 text-gray-800'}>
                      {selectedJob.cutting_status || 'Pending'}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Client</Label>
                    <p>{selectedJob.company_name || selectedJob.customer_name || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Product</Label>
                    <p>{selectedJob.product_code || 'N/A'}</p>
                    <p className="text-sm text-gray-600">{selectedJob.product_name}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Quantity</Label>
                    <p className="font-medium">{selectedJob.quantity.toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Delivery Date</Label>
                    <p>{formatDate(selectedJob.delivery_date)}</p>
                  </div>
                </div>

                {selectedJob.required_plate_count && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Plates Information</Label>
                    <p>Required: {selectedJob.required_plate_count}</p>
                    <p>Available: {selectedJob.plate_count || 0}</p>
                    {selectedJob.ctp_machine_name && (
                      <p className="text-sm text-gray-600">Machine: {selectedJob.ctp_machine_name}</p>
                    )}
                  </div>
                )}

                {selectedJob.cutting_comments && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Comments</Label>
                    <p className="text-sm bg-gray-50 p-3 rounded italic">{selectedJob.cutting_comments}</p>
                  </div>
                )}

                {selectedJob.status_message && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Status Message</Label>
                    <p className="text-sm bg-blue-50 p-3 rounded italic">{selectedJob.status_message}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default CuttingLaborView;

