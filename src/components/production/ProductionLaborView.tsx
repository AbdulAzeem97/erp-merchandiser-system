import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Printer,
  Clock,
  CheckCircle,
  Package,
  Building2,
  Calendar,
  FileText,
  Eye
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useSocket } from '@/services/socketService.tsx';
import { toast } from 'sonner';

interface ProductionJob {
  id: string | number;
  job_card_id?: string | number;
  jobNumber?: string;
  product_name?: string;
  company_name?: string;
  quantity: number;
  priority: string;
  dueDate?: string;
  assignment_status?: string;
  step_name?: string;
  machine_name?: string;
  status_message?: string;
}

interface ProductionLaborViewProps {
  onLogout?: () => void;
}

const statusConfig = {
  'Pending': { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  'Assigned': { color: 'bg-blue-100 text-blue-800', icon: Clock },
  'Setup': { color: 'bg-purple-100 text-purple-800', icon: Clock },
  'Printing': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
  'Quality Check': { color: 'bg-indigo-100 text-indigo-800', icon: Eye },
  'Completed': { color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle },
  'On Hold': { color: 'bg-orange-100 text-orange-800', icon: Clock },
  'Rejected': { color: 'bg-red-100 text-red-800', icon: Clock }
};

const ProductionLaborView: React.FC<ProductionLaborViewProps> = ({ onLogout }) => {
  const { socket, isConnected } = useSocket();
  const [jobs, setJobs] = useState<ProductionJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<ProductionJob | null>(null);
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

  // Load assigned jobs (VIEW-ONLY)
  const loadAssignedJobs = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/production/live`, {
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

  useEffect(() => {
    loadAssignedJobs();
  }, []);

  // Socket.io real-time updates
  useEffect(() => {
    if (!socket || !isConnected) return;

    socket.on('production:status_updated', (data: any) => {
      loadAssignedJobs();
    });

    socket.on('production:job_assigned', (data: any) => {
      loadAssignedJobs();
    });

    return () => {
      socket.off('production:status_updated');
      socket.off('production:job_assigned');
    };
  }, [socket, isConnected]);

  // Mark as acknowledged (VIEW-ONLY - no workflow impact)
  const handleAcknowledge = (jobId: string | number) => {
    setAcknowledgedJobs(prev => new Set([...prev, jobId.toString()]));
    toast.success('Job acknowledged');
  };

  const getStatusBadge = (status: string | undefined) => {
    if (!status) return null;
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['Pending'];
    const Icon = config.icon;
    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-3">
            <Printer className="w-10 h-10" />
            Production Labor Dashboard
          </h1>
          <p className="text-gray-600">View your assigned production jobs</p>
        </div>

        {/* Jobs Grid - Full Screen Kiosk Layout */}
        {isLoading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading assigned jobs...</p>
          </div>
        ) : jobs.length === 0 ? (
          <Card className="text-center py-20">
            <CardContent>
              <Printer className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 text-lg">No jobs assigned to you</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job) => (
              <motion.div
                key={job.id || job.job_card_id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="h-full hover:shadow-xl transition-shadow cursor-pointer"
                      onClick={() => {
                        setSelectedJob(job);
                        setIsDetailsOpen(true);
                      }}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1">
                          {job.jobNumber || `JC-${job.job_card_id || job.id}` || 'N/A'}
                        </h3>
                        {getStatusBadge(job.assignment_status)}
                      </div>
                      {acknowledgedJobs.has((job.id || job.job_card_id || '').toString()) && (
                        <Badge variant="outline" className="bg-green-50">Acknowledged</Badge>
                      )}
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">{job.company_name || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">{job.product_name || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">Qty: {job.quantity?.toLocaleString() || 'N/A'}</span>
                      </div>
                      {job.machine_name && (
                        <div className="flex items-center gap-2">
                          <Printer className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">Machine: {job.machine_name}</span>
                        </div>
                      )}
                      {job.dueDate && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">
                            Due: {new Date(job.dueDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>

                    {job.status_message && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">{job.status_message}</p>
                      </div>
                    )}

                    {!acknowledgedJobs.has((job.id || job.job_card_id || '').toString()) && (
                      <div className="mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAcknowledge(job.id || job.job_card_id || '');
                          }}
                        >
                          Mark as Acknowledged
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Job Details Dialog (VIEW-ONLY) */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Job Details - {selectedJob?.jobNumber || `JC-${selectedJob?.job_card_id || selectedJob?.id || 'N/A'}`}
              </DialogTitle>
            </DialogHeader>
            {selectedJob && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-600">Status</Label>
                    <div className="mt-1">{getStatusBadge(selectedJob.assignment_status)}</div>
                  </div>
                  <div>
                    <Label className="text-gray-600">Priority</Label>
                    <div className="mt-1">
                      <Badge variant="outline">{selectedJob.priority}</Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-gray-600">Client</Label>
                    <p className="mt-1 font-medium">{selectedJob.company_name || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Product</Label>
                    <p className="mt-1 font-medium">{selectedJob.product_name || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Quantity</Label>
                    <p className="mt-1 font-medium">{selectedJob.quantity?.toLocaleString() || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Due Date</Label>
                    <p className="mt-1 font-medium">
                      {selectedJob.dueDate ? new Date(selectedJob.dueDate).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  {selectedJob.machine_name && (
                    <div>
                      <Label className="text-gray-600">Machine</Label>
                      <p className="mt-1 font-medium">{selectedJob.machine_name}</p>
                    </div>
                  )}
                  {selectedJob.step_name && (
                    <div>
                      <Label className="text-gray-600">Step</Label>
                      <p className="mt-1 font-medium">{selectedJob.step_name}</p>
                    </div>
                  )}
                </div>
                {selectedJob.status_message && (
                  <div>
                    <Label className="text-gray-600">Status Message</Label>
                    <p className="mt-1 p-3 bg-gray-50 rounded-lg">{selectedJob.status_message}</p>
                  </div>
                )}
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-500 text-center">
                    This is a view-only dashboard. Contact your supervisor for status updates.
                  </p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

// Add Label component import
const Label = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <label className={`text-sm font-medium ${className}`}>{children}</label>
);

export default ProductionLaborView;

