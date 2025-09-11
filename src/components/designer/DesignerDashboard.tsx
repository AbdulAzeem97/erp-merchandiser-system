import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Palette,
  Clock,
  CheckCircle,
  AlertCircle,
  Play,
  Pause,
  Eye,
  Edit,
  Calendar,
  User,
  Building,
  Package,
  Target,
  TrendingUp,
  BarChart3,
  Filter,
  Search,
  RefreshCw,
  Bell,
  Settings,
  LogOut,
  Plus,
  FileText,
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
  Shield
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useSocket } from '@/services/socketService.tsx';
import { MainLayout } from '../layout/MainLayout';
import { authAPI } from '@/services/api';
import { getProcessSequence } from '@/data/processSequences';

interface DesignerJob {
  prepress_job_id: string;
  job_card_number: string;
  status: 'ASSIGNED' | 'IN_PROGRESS' | 'PAUSED' | 'HOD_REVIEW' | 'COMPLETED' | 'REJECTED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  due_date: string;
  assigned_at: string;
  updated_at: string;
  company_name: string;
  product_name: string;
  product_item_code: string;
  quantity: number;
  delivery_date: string;
  customer_notes: string;
  special_instructions: string;
  notes: string;
}

interface DesignerStats {
  total_jobs: number;
  assigned_jobs: number;
  in_progress_jobs: number;
  completed_jobs: number;
  paused_jobs: number;
  hod_review_jobs: number;
}

interface DesignerDashboardProps {
  onLogout?: () => void;
  onNavigate?: (page: string) => void;
}

const statusColors = {
  ASSIGNED: 'bg-blue-100 text-blue-800 border-blue-300',
  IN_PROGRESS: 'bg-green-100 text-green-800 border-green-300',
  PAUSED: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  HOD_REVIEW: 'bg-purple-100 text-purple-800 border-purple-300',
  COMPLETED: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  REJECTED: 'bg-red-100 text-red-800 border-red-300'
};

const priorityColors = {
  LOW: 'bg-gray-100 text-gray-800 border-gray-300',
  MEDIUM: 'bg-blue-100 text-blue-800 border-blue-300',
  HIGH: 'bg-orange-100 text-orange-800 border-orange-300',
  CRITICAL: 'bg-red-100 text-red-800 border-red-300'
};

const DesignerDashboard: React.FC<DesignerDashboardProps> = ({ onLogout, onNavigate }) => {
  const { socket, isConnected } = useSocket();
  const [jobs, setJobs] = useState<DesignerJob[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<DesignerJob[]>([]);
  const [stats, setStats] = useState<DesignerStats>({
    total_jobs: 0,
    assigned_jobs: 0,
    in_progress_jobs: 0,
    completed_jobs: 0,
    paused_jobs: 0,
    hod_review_jobs: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedJob, setSelectedJob] = useState<DesignerJob | null>(null);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isJobDetailsOpen, setIsJobDetailsOpen] = useState(false);
  const [jobDetailsData, setJobDetailsData] = useState<DesignerJob | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  // Handle logout function
  const handleLogout = () => {
    authAPI.logout();
    if (onLogout) {
      onLogout();
    } else {
      window.location.href = '/';
    }
  };

  // Handle navigation function
  const handleNavigate = (page: string) => {
    if (onNavigate) {
      onNavigate(page);
    } else {
      // Default navigation logic or routing
      console.log(`Navigate to: ${page}`);
    }
  };

  // Handle view job details
  const handleViewJobDetails = async (job: DesignerJob) => {
    try {
      setJobDetailsData(job);
      setIsJobDetailsOpen(true);
    } catch (error) {
      console.error('Error loading job details:', error);
      toast.error('Failed to load job details');
    }
  };

  // Load designer jobs
  const loadJobs = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('authToken');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      console.log('🔄 Designer Dashboard: Loading jobs...');
      console.log('🔄 User ID:', user.id);
      console.log('🔄 Token present:', !!token);
      
      if (!user.id) {
        toast.error('User information not found');
        return;
      }

      const apiUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:3002'}/api/job-assignment/designer/${user.id}?limit=100`;
      console.log('🔄 API URL:', apiUrl);

      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('🔄 API Response Status:', response.status);
      console.log('🔄 API Response OK:', response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log('🔄 API Response Data:', data);
        console.log('🔄 Jobs Count:', data.data?.jobs?.length || 0);
        
        setJobs(data.data.jobs || []);
        setFilteredJobs(data.data.jobs || []);
        
        // Calculate stats
        const jobStats = {
          total_jobs: data.data.jobs.length,
          assigned_jobs: data.data.jobs.filter((job: DesignerJob) => job.status === 'ASSIGNED').length,
          in_progress_jobs: data.data.jobs.filter((job: DesignerJob) => job.status === 'IN_PROGRESS').length,
          completed_jobs: data.data.jobs.filter((job: DesignerJob) => job.status === 'COMPLETED').length,
          paused_jobs: data.data.jobs.filter((job: DesignerJob) => job.status === 'PAUSED').length,
          hod_review_jobs: data.data.jobs.filter((job: DesignerJob) => job.status === 'HOD_REVIEW').length
        };
        setStats(jobStats);
        
        console.log('✅ Jobs loaded successfully:', jobStats);
        console.log('✅ Current jobs state:', data.data.jobs);
        console.log('✅ Looking for JC-1757336985212:', data.data.jobs.find((job: any) => job.job_card_id === 'JC-1757336985212'));
      } else {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        toast.error('Failed to load jobs');
      }
    } catch (error) {
      console.error('❌ Error loading jobs:', error);
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
        job.job_card_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.product_name.toLowerCase().includes(searchTerm.toLowerCase())
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

  // Update job status
  const updateJobStatus = async (jobId: string, status: string, notes: string) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3002'}/api/job-assignment/${jobId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status, notes })
      });

      if (response.ok) {
        toast.success('Job status updated successfully');
        setIsStatusDialogOpen(false);
        setNewStatus('');
        setStatusNotes('');
        loadJobs(); // Reload jobs
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update job status');
      }
    } catch (error) {
      console.error('Error updating job status:', error);
      toast.error('Error updating job status');
    }
  };

  // Socket event handlers
  useEffect(() => {
    if (socket && isConnected) {
      console.log('🎧 Designer Dashboard: Setting up Socket.io event listeners');
      
      // Listen for job assignments
      socket.on('job_assigned', (data) => {
        console.log('📨 Designer Dashboard: Received job_assigned event:', data);
        toast.success(`New job assigned: ${data.jobCardId}`);
        loadJobs();
      });

      // Listen for jobs assigned specifically to this designer
      socket.on('job_assigned_to_me', (data) => {
        console.log('📨 Designer Dashboard: Received job_assigned_to_me event:', data);
        toast.success(`You have been assigned job: ${data.jobCardId}`);
        loadJobs();
      });

      // Listen for job status updates
      socket.on('job_status_updated', (data) => {
        console.log('📨 Designer Dashboard: Received job_status_updated event:', data);
        toast.info(`Job status updated: ${data.jobCardId}`);
        loadJobs();
      });

      // Listen for new jobs created (for HOD/Admin visibility)
      socket.on('job_created', (data) => {
        console.log('📨 Designer Dashboard: Received job_created event:', data);
        toast.info(`New job created: ${data.jobCardId}`);
        // Only reload if user is HOD or Admin
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user.role === 'HOD_PREPRESS' || user.role === 'ADMIN') {
          loadJobs();
        }
      });

      // Listen for new jobs ready for assignment
      socket.on('new_job_for_assignment', (data) => {
        console.log('📨 Designer Dashboard: Received new_job_for_assignment event:', data);
        toast.info(`New job ready for assignment: ${data.jobCardId}`);
        // Only reload if user is HOD or Admin
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user.role === 'HOD_PREPRESS' || user.role === 'ADMIN') {
          loadJobs();
        }
      });

      return () => {
        console.log('🧹 Designer Dashboard: Cleaning up Socket.io event listeners');
        socket.off('job_assigned');
        socket.off('job_assigned_to_me');
        socket.off('job_status_updated');
        socket.off('job_created');
        socket.off('new_job_for_assignment');
      };
    } else {
      console.log('❌ Designer Dashboard: Socket not connected, skipping event listeners');
    }
  }, [socket, isConnected]);

  useEffect(() => {
    loadJobs();
  }, []);

  // Fallback: Auto-refresh every 30 seconds if Socket.io is not connected
  useEffect(() => {
    if (!isConnected) {
      console.log('🔄 Socket.io not connected, setting up fallback auto-refresh');
      const interval = setInterval(() => {
        console.log('🔄 Fallback auto-refresh triggered');
        loadJobs();
      }, 30000); // 30 seconds

      return () => clearInterval(interval);
    }
  }, [isConnected]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ASSIGNED': return <Clock className="h-4 w-4" />;
      case 'IN_PROGRESS': return <Play className="h-4 w-4" />;
      case 'PAUSED': return <Pause className="h-4 w-4" />;
      case 'HOD_REVIEW': return <Eye className="h-4 w-4" />;
      case 'COMPLETED': return <CheckCircle className="h-4 w-4" />;
      case 'REJECTED': return <XCircle className="h-4 w-4" />;
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

  return (
    <MainLayout
      currentPage="designer-dashboard"
      onNavigate={handleNavigate}
      onLogout={handleLogout}
      isLoading={isLoading}
      pageTitle="Designer Dashboard"
      pageDescription="Manage your design assignments and track progress"
    >
      <div className="p-6 bg-gradient-to-br from-blue-50 via-white to-purple-50 min-h-full">
        {/* Connection Status Badge */}
        <div className="mb-6">
          <Badge variant="outline" className={`${isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </Badge>
          <Button variant="outline" size="sm" onClick={loadJobs} className="ml-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Jobs
          </Button>
          <Button variant="outline" size="sm" onClick={() => {
            console.log('🔄 Manual refresh triggered');
            console.log('🔌 Socket status:', isConnected ? 'Connected' : 'Disconnected');
            console.log('🔌 Socket instance:', socket ? 'Present' : 'Missing');
            loadJobs();
          }} className="ml-2">
            <RefreshCw className="h-4 w-4 mr-2" />
            Force Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => {
            console.log('🧪 Testing API call...');
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const token = localStorage.getItem('authToken');
            console.log('🧪 User:', user);
            console.log('🧪 Token:', token ? 'Present' : 'Missing');
            console.log('🧪 API URL:', `${import.meta.env.VITE_API_URL || 'http://localhost:3002'}/api/job-assignment/designer/${user.id}?limit=100`);
            loadJobs();
          }} className="ml-2">
            <RefreshCw className="h-4 w-4 mr-2" />
            Test API
          </Button>
        </div>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
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

          <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm font-medium">Assigned</p>
                  <p className="text-3xl font-bold">{stats.assigned_jobs}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">HOD Review</p>
                  <p className="text-3xl font-bold">{stats.hod_review_jobs}</p>
                </div>
                <Eye className="h-8 w-8 text-purple-200" />
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

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Paused</p>
                  <p className="text-3xl font-bold">{stats.paused_jobs}</p>
                </div>
                <Pause className="h-8 w-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
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
                  <SelectItem value="ASSIGNED">Assigned</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="PAUSED">Paused</SelectItem>
                  <SelectItem value="HOD_REVIEW">HOD Review</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
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
              <span>My Jobs ({filteredJobs.length})</span>
              <Badge variant="outline">
                {filteredJobs.filter(job => job.status === 'IN_PROGRESS').length} Active
              </Badge>
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
                    key={job.prepress_job_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {job.job_card_number}
                          </h3>
                          <Badge className={statusColors[job.status]}>
                            {getStatusIcon(job.status)}
                            <span className="ml-1">{job.status.replace('_', ' ')}</span>
                          </Badge>
                          <Badge className={priorityColors[job.priority]}>
                            {getPriorityIcon(job.priority)}
                            <span className="ml-1">{job.priority}</span>
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-gray-500">Company</p>
                            <p className="font-medium">{job.company_name}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Product</p>
                            <p className="font-medium">{job.product_name} ({job.product_item_code})</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Quantity</p>
                            <p className="font-medium">{job.quantity.toLocaleString()}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-gray-500">Due Date</p>
                            <p className="font-medium">{formatDate(job.due_date)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Delivery Date</p>
                            <p className="font-medium">{formatDate(job.delivery_date)}</p>
                          </div>
                        </div>

                        {job.customer_notes && (
                          <div className="mb-4">
                            <p className="text-sm text-gray-500">Customer Notes</p>
                            <p className="text-sm bg-gray-50 p-3 rounded">{job.customer_notes}</p>
                          </div>
                        )}

                        {job.special_instructions && (
                          <div className="mb-4">
                            <p className="text-sm text-gray-500">Special Instructions</p>
                            <p className="text-sm bg-blue-50 p-3 rounded">{job.special_instructions}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col space-y-2 ml-4">
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedJob(job);
                            setNewStatus(job.status);
                            setIsStatusDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Update Status
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewJobDetails(job)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Status Update Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Job Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Job: {selectedJob?.job_card_number}</Label>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ASSIGNED">Assigned</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="PAUSED">Paused</SelectItem>
                  <SelectItem value="HOD_REVIEW">Submit for HOD Review</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this status update..."
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (selectedJob && newStatus) {
                    updateJobStatus(selectedJob.prepress_job_id, newStatus, statusNotes);
                  }
                }}
              >
                Update Status
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Job Details Modal */}
      <Dialog open={isJobDetailsOpen} onOpenChange={setIsJobDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Job Details: {jobDetailsData?.job_card_number}
            </DialogTitle>
          </DialogHeader>
          
          {jobDetailsData && (
            <div className="space-y-6">
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="product">Product Info</TabsTrigger>
                  <TabsTrigger value="customer">Customer Info</TabsTrigger>
                  <TabsTrigger value="process">Process Sequence</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          Job Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Job Card Number</Label>
                          <p className="font-semibold">{jobDetailsData.job_card_number}</p>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-sm font-medium text-gray-500">Status</Label>
                            <div className="mt-1">
                              <Badge className={statusColors[jobDetailsData.status]}>
                                {getStatusIcon(jobDetailsData.status)}
                                <span className="ml-1">{jobDetailsData.status.replace('_', ' ')}</span>
                              </Badge>
                            </div>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-500">Priority</Label>
                            <div className="mt-1">
                              <Badge className={priorityColors[jobDetailsData.priority]}>
                                {getPriorityIcon(jobDetailsData.priority)}
                                <span className="ml-1">{jobDetailsData.priority}</span>
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <Separator />
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Assigned Date</Label>
                          <p className="font-medium">{formatDate(jobDetailsData.assigned_at)}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Due Date</Label>
                          <p className="font-medium">{formatDate(jobDetailsData.due_date)}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Last Updated</Label>
                          <p className="font-medium">{formatDate(jobDetailsData.updated_at)}</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Activity className="h-5 w-5" />
                          Quick Stats
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Quantity</Label>
                          <p className="text-2xl font-bold text-blue-600">{jobDetailsData.quantity?.toLocaleString()}</p>
                        </div>
                        <Separator />
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Delivery Date</Label>
                          <p className="font-medium">{formatDate(jobDetailsData.delivery_date)}</p>
                        </div>
                        <Separator />
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Job ID</Label>
                          <p className="font-mono text-sm">{jobDetailsData.prepress_job_id}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Notes Section */}
                  {(jobDetailsData.customer_notes || jobDetailsData.special_instructions || jobDetailsData.notes) && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <MessageSquare className="h-5 w-5" />
                          Notes & Instructions
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {jobDetailsData.customer_notes && (
                          <div>
                            <Label className="text-sm font-medium text-blue-600">Customer Notes</Label>
                            <div className="mt-1 p-3 bg-blue-50 rounded-lg border border-blue-200">
                              <p className="text-sm">{jobDetailsData.customer_notes}</p>
                            </div>
                          </div>
                        )}
                        {jobDetailsData.special_instructions && (
                          <div>
                            <Label className="text-sm font-medium text-orange-600">Special Instructions</Label>
                            <div className="mt-1 p-3 bg-orange-50 rounded-lg border border-orange-200">
                              <p className="text-sm">{jobDetailsData.special_instructions}</p>
                            </div>
                          </div>
                        )}
                        {jobDetailsData.notes && (
                          <div>
                            <Label className="text-sm font-medium text-gray-600">Internal Notes</Label>
                            <div className="mt-1 p-3 bg-gray-50 rounded-lg border border-gray-200">
                              <p className="text-sm">{jobDetailsData.notes}</p>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Product Info Tab */}
                <TabsContent value="product" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Product Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Product Name</Label>
                          <p className="font-semibold text-lg">{jobDetailsData.product_name}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Item Code</Label>
                          <p className="font-mono font-semibold">{jobDetailsData.product_item_code}</p>
                        </div>
                      </div>
                      <Separator />
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Quantity</Label>
                          <p className="text-xl font-bold text-blue-600">{jobDetailsData.quantity?.toLocaleString()} pieces</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Delivery Date</Label>
                          <p className="font-semibold">{formatDate(jobDetailsData.delivery_date)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Customer Info Tab */}
                <TabsContent value="customer" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Building className="h-5 w-5" />
                        Customer Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Company Name</Label>
                        <p className="text-xl font-bold text-blue-600">{jobDetailsData.company_name}</p>
                      </div>
                      <Separator />
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Product</Label>
                        <p className="font-semibold">{jobDetailsData.product_name} ({jobDetailsData.product_item_code})</p>
                      </div>
                      {jobDetailsData.customer_notes && (
                        <>
                          <Separator />
                          <div>
                            <Label className="text-sm font-medium text-gray-500">Customer Requirements</Label>
                            <div className="mt-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
                              <p className="text-sm leading-relaxed">{jobDetailsData.customer_notes}</p>
                            </div>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Process Sequence Tab */}
                <TabsContent value="process" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        Production Process Sequence
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {(() => {
                        // Extract product type from product name or item code - this might need adjustment based on your data structure
                        const productType = jobDetailsData.product_name?.includes('Offset') ? 'Offset' : 
                                           jobDetailsData.product_name?.includes('Digital') ? 'Digital' :
                                           jobDetailsData.product_name?.includes('Thermal') ? 'Thermal' :
                                           jobDetailsData.product_name?.includes('Woven') ? 'Woven' :
                                           jobDetailsData.product_name?.includes('PFL') ? 'PFL' :
                                           jobDetailsData.product_name?.includes('Heat Transfer') ? 'Heat Transfer Label' :
                                           jobDetailsData.product_name?.includes('Leather') ? 'Leather Patch' : 'Offset';
                        
                        const processSequence = getProcessSequence(productType);
                        
                        if (!processSequence) {
                          return (
                            <div className="text-center py-8">
                              <Target className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                              <p className="text-gray-500">No process sequence found for this product type</p>
                              <p className="text-sm text-gray-400 mt-1">Product Type: {productType}</p>
                            </div>
                          );
                        }

                        return (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <p className="text-sm text-gray-600">
                                Product Type: <span className="font-semibold text-blue-600">{processSequence.productType}</span>
                              </p>
                              <Badge variant="outline">
                                {processSequence.steps.length} Total Steps
                              </Badge>
                            </div>
                            <div className="grid gap-2">
                              {processSequence.steps.map((step, index) => (
                                <div 
                                  key={step.id}
                                  className={`flex items-center justify-between p-3 rounded-lg border ${
                                    step.isCompulsory 
                                      ? 'bg-blue-50 border-blue-200' 
                                      : 'bg-gray-50 border-gray-200'
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                                      step.isCompulsory 
                                        ? 'bg-blue-600 text-white' 
                                        : 'bg-gray-400 text-white'
                                    }`}>
                                      {step.order}
                                    </div>
                                    <span className="font-medium">{step.name}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {step.isCompulsory && (
                                      <Badge variant="secondary" className="text-xs">
                                        Required
                                      </Badge>
                                    )}
                                    <Badge variant="outline" className="text-xs">
                                      Step {step.order}
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default DesignerDashboard;
