import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Factory,
  Package,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  BarChart3,
  Eye,
  RefreshCw,
  Filter,
  Search,
  Calendar,
  User,
  ArrowRight,
  Play,
  Pause,
  RotateCcw,
  History,
  Bell,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { jobsAPI, jobAssignmentHistoryAPI } from '@/services/api';
import { toast } from 'sonner';
import { useSocket } from '@/services/socketService.tsx';
import JobAssignmentHistory from '../jobs/JobAssignmentHistory';

interface Job {
  id: number;
  jobNumber: string;
  productName: string;
  customerName: string;
  quantity: number;
  priority: string;
  status: string;
  assignedToId?: number;
  assignedDesignerName?: string;
  createdAt: string;
  deliveryDate: string;
  progress: number;
  department?: string;
  current_department?: string;
  workflow_status?: string;
  current_step?: string;
  status_message?: string;
}

interface JobStats {
  total_jobs: number;
  assigned_jobs: number;
  in_progress_jobs: number;
  completed_jobs: number;
  pending_jobs: number;
  overdue_jobs: number;
}

export const MerchandiserDashboard: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState<JobStats>({
    total_jobs: 0,
    assigned_jobs: 0,
    in_progress_jobs: 0,
    completed_jobs: 0,
    pending_jobs: 0,
    overdue_jobs: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showJobHistory, setShowJobHistory] = useState(false);
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    loadJobs();
    setupSocketListeners();
  }, []);

  useEffect(() => {
    if (socket && isConnected) {
      setupSocketListeners();
    }
  }, [socket, isConnected]);

  const setupSocketListeners = () => {
    if (!socket) return;

    console.log('🎧 Merchandiser Dashboard: Setting up Socket.io event listeners');

    // Listen for job status updates
    socket.on('job_status_update', (data) => {
      console.log('📊 Job status update received:', data);
      toast.success(`Job ${data.jobCardId} status updated to ${data.status}`);
      loadJobs(); // Refresh jobs list
    });

    // Listen for job assignments
    socket.on('job_assigned', (data) => {
      console.log('👤 Job assignment received:', data);
      toast.success(`Job ${data.jobCardId} assigned to designer`);
      loadJobs(); // Refresh jobs list
    });

    // Listen for job reassignments
    socket.on('job_reassigned', (data) => {
      console.log('🔄 Job reassignment received:', data);
      toast.info(`Job ${data.jobCardId} reassigned`);
      loadJobs(); // Refresh jobs list
    });

    // Listen for prepress status updates
    socket.on('prepress_status_update', (data) => {
      console.log('🎨 Prepress status update received:', data);
      toast.info(`Job ${data.jobCardId} prepress status: ${data.status}`);
      loadJobs(); // Refresh jobs list
    });

    return () => {
      socket.off('job_status_update');
      socket.off('job_assigned');
      socket.off('job_reassigned');
      socket.off('prepress_status_update');
    };
  };

  const loadJobs = async () => {
    setIsLoading(true);
    try {
      console.log('📋 Loading jobs for Merchandiser Dashboard...');
      const response = await jobsAPI.getAll();
      
      if (response.success) {
        const jobsData = response.jobs || [];
        setJobs(jobsData);
        
        // Calculate stats
        const newStats = {
          total_jobs: jobsData.length,
          assigned_jobs: jobsData.filter(job => job.assignedToId).length,
          in_progress_jobs: jobsData.filter(job => job.status === 'IN_PROGRESS').length,
          completed_jobs: jobsData.filter(job => job.status === 'COMPLETED').length,
          pending_jobs: jobsData.filter(job => job.status === 'PENDING').length,
          overdue_jobs: jobsData.filter(job => {
            const deliveryDate = new Date(job.deliveryDate);
            const today = new Date();
            return deliveryDate < today && job.status !== 'COMPLETED';
          }).length
        };
        setStats(newStats);
        
        console.log('📋 Jobs loaded successfully:', newStats);
      } else {
        toast.error('Failed to load jobs');
      }
    } catch (error) {
      console.error('Error loading jobs:', error);
      toast.error('Failed to load jobs');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to get display status based on department and workflow_status
  const getDisplayStatus = (job: Job): string => {
    // If job has current_department and workflow_status, use them to determine display status
    if (job.current_department && job.workflow_status) {
      if (job.current_department === 'Prepress' && job.workflow_status === 'in_progress') {
        return 'In CTP';
      }
      if (job.current_department === 'Job Planning' && job.workflow_status === 'pending') {
        return 'Pending (Job Planning)';
      }
      if (job.current_department === 'Cutting' && job.workflow_status === 'in_progress') {
        return 'In Progress (Cutting)';
      }
      if (job.current_department === 'Cutting' && job.workflow_status === 'pending') {
        return 'Pending (Cutting)';
      }
    }
    // Fallback to original status
    return job.status;
  };

  const getStatusColor = (status: string) => {
    // Handle new status formats
    if (status.includes('In CTP')) {
      return 'bg-purple-100 text-purple-800 border-purple-300';
    }
    if (status.includes('Job Planning')) {
      return 'bg-indigo-100 text-indigo-800 border-indigo-300';
    }
    if (status.includes('Cutting')) {
      return 'bg-cyan-100 text-cyan-800 border-cyan-300';
    }
    
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'PAUSED':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'REJECTED':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'APPROVED_BY_QA':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.jobNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || job.priority?.toLowerCase() === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleViewJobHistory = async (job: Job) => {
    setSelectedJob(job);
    setShowJobHistory(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isOverdue = (deliveryDate: string, status: string) => {
    const delivery = new Date(deliveryDate);
    const today = new Date();
    return delivery < today && status !== 'COMPLETED';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading job dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Job Management Dashboard</h1>
              <p className="text-gray-600">Monitor job progress and assignments across all departments</p>
            </div>
            <div className="flex items-center gap-2 mt-4 sm:mt-0">
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                {isConnected ? 'Connected' : 'Disconnected'}
              </div>
              <Button variant="outline" size="sm" onClick={loadJobs}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Jobs</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total_jobs}</p>
                  </div>
                  <Factory className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Assigned</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.assigned_jobs}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">In Progress</p>
                    <p className="text-2xl font-bold text-green-600">{stats.in_progress_jobs}</p>
                  </div>
                  <Play className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Completed</p>
                    <p className="text-2xl font-bold text-green-600">{stats.completed_jobs}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.pending_jobs}</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Overdue</p>
                    <p className="text-2xl font-bold text-red-600">{stats.overdue_jobs}</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search jobs, products, or customers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="PAUSED">Paused</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Jobs List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Jobs ({filteredJobs.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-4">
                <AnimatePresence>
                  {filteredJobs.map((job) => (
                    <motion.div
                      key={job.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900">{job.jobNumber}</h3>
                            <Badge className={getStatusColor(getDisplayStatus(job))}>
                              {getDisplayStatus(job)}
                            </Badge>
                            <Badge className={getPriorityColor(job.priority)}>
                              {job.priority}
                            </Badge>
                            {isOverdue(job.deliveryDate, job.status) && (
                              <Badge className="bg-red-100 text-red-800 border-red-300">
                                Overdue
                              </Badge>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">Product:</span> {job.productName}
                            </div>
                            <div>
                              <span className="font-medium">Customer:</span> {job.customerName}
                            </div>
                            <div>
                              <span className="font-medium">Quantity:</span> {job.quantity}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mt-2">
                            <div>
                              <span className="font-medium">Created:</span> {formatDate(job.createdAt)}
                            </div>
                            <div>
                              <span className="font-medium">Delivery:</span> {formatDate(job.deliveryDate)}
                            </div>
                            <div>
                              <span className="font-medium">Assigned to:</span> {job.assignedDesignerName || 'Unassigned'}
                            </div>
                          </div>

                          <div className="mt-3">
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span className="text-gray-600">Progress</span>
                              <span className="font-medium">{job.progress || 0}%</span>
                            </div>
                            <Progress value={job.progress || 0} className="h-2" />
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewJobHistory(job)}
                          >
                            <History className="h-4 w-4 mr-2" />
                            History
                          </Button>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Job Assignment History Modal */}
        {showJobHistory && selectedJob && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Assignment History - {selectedJob.jobNumber}</h2>
                  <Button variant="outline" onClick={() => setShowJobHistory(false)}>
                    Close
                  </Button>
                </div>
                <JobAssignmentHistory 
                  jobId={selectedJob.id.toString()} 
                  jobCardId={selectedJob.jobNumber}
                  onClose={() => setShowJobHistory(false)}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MerchandiserDashboard;
