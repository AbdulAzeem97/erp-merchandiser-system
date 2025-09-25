import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  Calendar,
  User,
  Building,
  Package,
  Target,
  TrendingUp,
  BarChart3,
  Clock,
  CheckCircle,
  AlertCircle,
  Play,
  Pause,
  Eye as EyeIcon,
  Download,
  Upload,
  MessageSquare,
  Star,
  Flag,
  Zap,
  Activity,
  PieChart,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Timer,
  Award,
  Crown,
  Shield,
  Users,
  FileText,
  Settings,
  LogOut
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useSocket } from '@/services/socketService.tsx';
import JobAssignmentForm from './JobAssignmentForm';

interface Job {
  id: string;
  job_card_id: string;
  product_id: string;
  product_name?: string;
  product_code?: string;
  company_id: string;
  company_name?: string;
  assigned_designer_id?: string;
  designer_name?: string;
  status: string;
  priority: string;
  progress: number;
  quantity: number;
  delivery_date: string;
  description: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface JobStats {
  total_jobs: number;
  pending_jobs: number;
  in_progress_jobs: number;
  completed_jobs: number;
  overdue_jobs: number;
}

interface JobManagementDashboardProps {
  onLogout?: () => void;
}

const statusColors = {
  PENDING: 'bg-gray-100 text-gray-800 border-gray-300',
  IN_PROGRESS: 'bg-blue-100 text-blue-800 border-blue-300',
  COMPLETED: 'bg-green-100 text-green-800 border-green-300',
  ON_HOLD: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  CANCELLED: 'bg-red-100 text-red-800 border-red-300'
};

const priorityColors = {
  LOW: 'bg-gray-100 text-gray-800 border-gray-300',
  MEDIUM: 'bg-blue-100 text-blue-800 border-blue-300',
  HIGH: 'bg-orange-100 text-orange-800 border-orange-300',
  CRITICAL: 'bg-red-100 text-red-800 border-red-300'
};

const JobManagementDashboard: React.FC<JobManagementDashboardProps> = ({ onLogout }) => {
  const { socket, isConnected } = useSocket();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState<JobStats>({
    total_jobs: 0,
    pending_jobs: 0,
    in_progress_jobs: 0,
    completed_jobs: 0,
    overdue_jobs: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isJobDetailsOpen, setIsJobDetailsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Load jobs
  const loadJobs = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/jobs`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setJobs(data.jobs || []);
        setFilteredJobs(data.jobs || []);
        
        // Calculate stats
        const jobStats = {
          total_jobs: data.jobs.length,
          pending_jobs: data.jobs.filter((job: Job) => job.status === 'PENDING').length,
          in_progress_jobs: data.jobs.filter((job: Job) => job.status === 'IN_PROGRESS').length,
          completed_jobs: data.jobs.filter((job: Job) => job.status === 'COMPLETED').length,
          overdue_jobs: data.jobs.filter((job: Job) => 
            new Date(job.delivery_date) < new Date() && job.status !== 'COMPLETED'
          ).length
        };
        setStats(jobStats);
      } else {
        toast.error('Failed to load jobs');
      }
    } catch (error) {
      console.error('Error loading jobs:', error);
      toast.error('Error loading jobs');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter jobs
  useEffect(() => {
    let filtered = jobs;

    if (searchTerm) {
      filtered = filtered.filter(job =>
        job.job_card_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.designer_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(job => job.status === statusFilter);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(job => job.priority === priorityFilter);
    }

    setFilteredJobs(filtered);
  }, [jobs, searchTerm, statusFilter, priorityFilter]);

  // Socket event handlers
  useEffect(() => {
    if (socket && isConnected) {
      socket.on('job_created', (data) => {
        toast.success(`New job created: ${data.jobCardId}`);
        loadJobs();
      });

      socket.on('job_assigned', (data) => {
        toast.info(`Job assigned: ${data.jobCardId}`);
        loadJobs();
      });

      return () => {
        socket.off('job_created');
        socket.off('job_assigned');
      };
    }
  }, [socket, isConnected]);

  useEffect(() => {
    loadJobs();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock className="h-4 w-4" />;
      case 'IN_PROGRESS': return <Play className="h-4 w-4" />;
      case 'COMPLETED': return <CheckCircle className="h-4 w-4" />;
      case 'ON_HOLD': return <Pause className="h-4 w-4" />;
      case 'CANCELLED': return <XCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'LOW': return <Flag className="h-4 w-4" />;
      case 'MEDIUM': return <Flag className="h-4 w-4" />;
      case 'HIGH': return <AlertTriangle className="h-4 w-4" />;
      case 'CRITICAL': return <Zap className="h-4 w-4" />;
      default: return <Flag className="h-4 w-4" />;
    }
  };

  const handleJobCreated = (newJob: any) => {
    loadJobs(); // Reload jobs to show the new one
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading job management dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <FileText className="h-8 w-8 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">Job Management Dashboard</h1>
              </div>
              <Badge variant="outline" className="bg-green-100 text-green-800">
                {isConnected ? 'Connected' : 'Disconnected'}
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <JobAssignmentForm onJobCreated={handleJobCreated} />
              <Button variant="outline" size="sm" onClick={loadJobs}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button variant="outline" size="sm" onClick={onLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="jobs">All Jobs</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm font-medium">Total Jobs</p>
                      <p className="text-3xl font-bold">{stats.total_jobs}</p>
                    </div>
                    <Package className="h-8 w-8 text-blue-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-gray-500 to-gray-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-100 text-sm font-medium">Pending</p>
                      <p className="text-3xl font-bold">{stats.pending_jobs}</p>
                    </div>
                    <Clock className="h-8 w-8 text-gray-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm font-medium">In Progress</p>
                      <p className="text-3xl font-bold">{stats.in_progress_jobs}</p>
                    </div>
                    <Play className="h-8 w-8 text-green-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-emerald-100 text-sm font-medium">Completed</p>
                      <p className="text-3xl font-bold">{stats.completed_jobs}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-emerald-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-red-100 text-sm font-medium">Overdue</p>
                      <p className="text-3xl font-bold">{stats.overdue_jobs}</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-red-200" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Jobs */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Jobs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {jobs.slice(0, 5).map((job) => (
                    <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div>
                          <p className="font-semibold">{job.job_card_id}</p>
                          <p className="text-sm text-gray-500">{job.company_name}</p>
                        </div>
                        <Badge className={statusColors[job.status as keyof typeof statusColors]}>
                          {getStatusIcon(job.status)}
                          <span className="ml-1">{job.status}</span>
                        </Badge>
                        <Badge className={priorityColors[job.priority as keyof typeof priorityColors]}>
                          {getPriorityIcon(job.priority)}
                          <span className="ml-1">{job.priority}</span>
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{job.designer_name || 'Unassigned'}</p>
                        <p className="text-sm text-gray-500">{formatDate(job.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Jobs Tab */}
          <TabsContent value="jobs" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search jobs..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="ON_HOLD">On Hold</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="Filter by priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priority</SelectItem>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="CRITICAL">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Jobs List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>All Jobs ({filteredJobs.length})</span>
                  <JobAssignmentForm onJobCreated={handleJobCreated} />
                </CardTitle>
              </CardHeader>
              <CardContent>
                {filteredJobs.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
                    <p className="text-gray-500">No jobs match your current filters.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredJobs.map((job) => (
                      <motion.div
                        key={job.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="border rounded-lg p-6 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-3">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {job.job_card_id}
                              </h3>
                              <Badge className={statusColors[job.status as keyof typeof statusColors]}>
                                {getStatusIcon(job.status)}
                                <span className="ml-1">{job.status}</span>
                              </Badge>
                              <Badge className={priorityColors[job.priority as keyof typeof priorityColors]}>
                                {getPriorityIcon(job.priority)}
                                <span className="ml-1">{job.priority}</span>
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                              <div>
                                <p className="text-sm text-gray-500">Company</p>
                                <p className="font-medium">{job.company_name}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Product</p>
                                <p className="font-medium">{job.product_name} ({job.product_code})</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Designer</p>
                                <p className="font-medium">{job.designer_name || 'Unassigned'}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Quantity</p>
                                <p className="font-medium">{job.quantity.toLocaleString()}</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div>
                                <p className="text-sm text-gray-500">Delivery Date</p>
                                <p className="font-medium">{formatDate(job.delivery_date)}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Created</p>
                                <p className="font-medium">{formatDate(job.created_at)}</p>
                              </div>
                            </div>

                            {job.progress > 0 && (
                              <div className="mb-4">
                                <div className="flex justify-between text-sm mb-1">
                                  <span>Progress</span>
                                  <span>{job.progress}%</span>
                                </div>
                                <Progress value={job.progress} className="h-2" />
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col space-y-2 ml-4">
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedJob(job);
                                setIsJobDetailsOpen(true);
                              }}
                            >
                              <EyeIcon className="h-4 w-4 mr-2" />
                              View Details
                            </Button>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Job Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(statusColors).map(([status, colorClass]) => {
                      const count = jobs.filter(job => job.status === status).length;
                      const percentage = jobs.length > 0 ? (count / jobs.length) * 100 : 0;
                      
                      return (
                        <div key={status} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded-full ${colorClass.split(' ')[0]}`}></div>
                            <span className="text-sm font-medium">{status}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-500">{count}</span>
                            <span className="text-sm text-gray-400">({percentage.toFixed(1)}%)</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Priority Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(priorityColors).map(([priority, colorClass]) => {
                      const count = jobs.filter(job => job.priority === priority).length;
                      const percentage = jobs.length > 0 ? (count / jobs.length) * 100 : 0;
                      
                      return (
                        <div key={priority} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded-full ${colorClass.split(' ')[0]}`}></div>
                            <span className="text-sm font-medium">{priority}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-500">{count}</span>
                            <span className="text-sm text-gray-400">({percentage.toFixed(1)}%)</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Job Details Dialog */}
      <Dialog open={isJobDetailsOpen} onOpenChange={setIsJobDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Job Details</DialogTitle>
          </DialogHeader>
          {selectedJob && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Job Card ID</Label>
                  <p className="font-medium">{selectedJob.job_card_id}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge className={statusColors[selectedJob.status as keyof typeof statusColors]}>
                    {getStatusIcon(selectedJob.status)}
                    <span className="ml-1">{selectedJob.status}</span>
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Company</Label>
                  <p className="font-medium">{selectedJob.company_name}</p>
                </div>
                <div>
                  <Label>Product</Label>
                  <p className="font-medium">{selectedJob.product_name} ({selectedJob.product_code})</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Designer</Label>
                  <p className="font-medium">{selectedJob.designer_name || 'Unassigned'}</p>
                </div>
                <div>
                  <Label>Quantity</Label>
                  <p className="font-medium">{selectedJob.quantity.toLocaleString()}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Delivery Date</Label>
                  <p className="font-medium">{formatDate(selectedJob.delivery_date)}</p>
                </div>
                <div>
                  <Label>Created</Label>
                  <p className="font-medium">{formatDate(selectedJob.created_at)}</p>
                </div>
              </div>
              
              {selectedJob.description && (
                <div>
                  <Label>Description</Label>
                  <p className="text-sm bg-gray-50 p-3 rounded">{selectedJob.description}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default JobManagementDashboard;
