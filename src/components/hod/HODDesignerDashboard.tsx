import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
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
  Shield,
  UserPlus,
  TrendingDown,
  Maximize2,
  Minimize2,
  FolderOpen,
  UserCheck
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
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { getApiUrl } from '@/utils/apiConfig';
import { useSocket } from '@/services/socketService.tsx';
import { MainLayout } from '../layout/MainLayout';
import { authAPI, jobsAPI, usersAPI, jobAssignmentAPI } from '@/services/api';
import { getProcessSequence } from '@/data/processSequences';
import { Separator } from '@/components/ui/separator';
import AnimatedKPICards from '@/components/ui/animated-kpi-cards';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

interface HODJob {
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
  designer_first_name: string;
  designer_last_name: string;
  designer_email: string;
  designer_id: string;
  assigned_by_first_name: string;
  assigned_by_last_name: string;
  // Outsourcing Information
  outsourcing_die_making_initiated?: boolean;
  fil_initiated_request?: boolean;
  blocks_initiated?: boolean;
}

interface HODStats {
  total_jobs: number;
  assigned_jobs: number;
  in_progress_jobs: number;
  completed_jobs: number;
  paused_jobs: number;
  hod_review_jobs: number;
}

interface DesignerStats {
  designer_id: string;
  first_name: string;
  last_name: string;
  email: string;
  total_jobs: number;
  completed_jobs: number;
  in_progress_jobs: number;
  paused_jobs: number;
}

interface Designer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  active_jobs: number;
}

interface HODDesignerDashboardProps {
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

const HODDesignerDashboard: React.FC<HODDesignerDashboardProps> = ({ onLogout, onNavigate }) => {
  const { socket, isConnected } = useSocket();
  const [jobs, setJobs] = useState<HODJob[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<HODJob[]>([]);
  const [designers, setDesigners] = useState<Designer[]>([]);
  const [stats, setStats] = useState<HODStats>({
    total_jobs: 0,
    assigned_jobs: 0,
    in_progress_jobs: 0,
    completed_jobs: 0,
    paused_jobs: 0,
    hod_review_jobs: 0
  });
  const [designerStats, setDesignerStats] = useState<DesignerStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [designerFilter, setDesignerFilter] = useState('all');
  const [selectedJob, setSelectedJob] = useState<HODJob | null>(null);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isReassignDialogOpen, setIsReassignDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [selectedDesigner, setSelectedDesigner] = useState('');
  const [assignPriority, setAssignPriority] = useState('MEDIUM');
  const [assignDueDate, setAssignDueDate] = useState('');
  const [assignNotes, setAssignNotes] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  // Enhanced HOD functionality state
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [isJobDetailsOpen, setIsJobDetailsOpen] = useState(false);
  const [jobDetailsData, setJobDetailsData] = useState<HODJob | null>(null);
  const [reviewJob, setReviewJob] = useState<HODJob | null>(null);
  const [reviewDecision, setReviewDecision] = useState<'APPROVED' | 'REJECTED' | ''>('');
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [qualityRating, setQualityRating] = useState(0);
  const [designerPerformance, setDesignerPerformance] = useState<any>({});
  const [isBulkActionOpen, setIsBulkActionOpen] = useState(false);
  const [selectedJobIds, setSelectedJobIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState('');

  // Load HOD dashboard data
  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('authToken');

      const apiUrl = getApiUrl();
      const [jobsResponse, designersResponse] = await Promise.all([
        fetch(`${apiUrl}/api/job-assignment/hod/dashboard?limit=200`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch(`${apiUrl}/api/job-assignment/designers`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      ]);

      if (jobsResponse.ok) {
        const jobsData = await jobsResponse.json();
        setJobs(jobsData.data.jobs || []);
        setFilteredJobs(jobsData.data.jobs || []);
        setStats(jobsData.data.statistics || {});
        setDesignerStats(jobsData.data.designerStats || []);
      }

      if (designersResponse.ok) {
        const designersData = await designersResponse.json();
        setDesigners(designersData.data || []);
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Error loading dashboard data');
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
        job.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.designer_first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.designer_last_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(job => job.status === statusFilter);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(job => job.priority === priorityFilter);
    }

    if (designerFilter !== 'all') {
      filtered = filtered.filter(job => job.designer_id === designerFilter);
    }

    setFilteredJobs(filtered);
  }, [jobs, searchTerm, statusFilter, priorityFilter, designerFilter]);

  // Update job status
  const updateJobStatus = async (jobId: string, status: string, notes: string) => {
    try {
      const token = localStorage.getItem('authToken');
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/job-assignment/${jobId}/status`, {
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
        loadDashboardData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update job status');
      }
    } catch (error) {
      console.error('Error updating job status:', error);
      toast.error('Error updating job status');
    }
  };

  // Assign job to designer
  const assignJobToDesigner = async (jobCardId: string, designerId: string, priority: string, dueDate: string, notes: string) => {
    try {
      const token = localStorage.getItem('authToken');
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/job-assignment/assign`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jobCardId,
          designerId,
          priority,
          dueDate,
          notes
        })
      });

      if (response.ok) {
        toast.success('Job assigned successfully');
        setIsAssignDialogOpen(false);
        setSelectedDesigner('');
        setAssignPriority('MEDIUM');
        setAssignDueDate('');
        setAssignNotes('');
        loadDashboardData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to assign job');
      }
    } catch (error) {
      console.error('Error assigning job:', error);
      toast.error('Error assigning job');
    }
  };

  // Handle outsourcing status update
  const handleOutsourcingUpdate = async (jobId: string, field: string, value: boolean) => {
    try {
      if (!jobId) {
        console.warn('HOD: Cannot update outsourcing status: invalid jobId');
        toast.error('Cannot update status: Prepress job not found');
        return;
      }
      console.log(`🔄 HOD: Updating outsourcing field ${field} to ${value} for job ${jobId}`);
      await jobAssignmentAPI.updateOutsourcingStatus(jobId, { [field]: value });

      // Update local state
      setJobs(prevJobs => prevJobs.map(job =>
        job.prepress_job_id === jobId ? { ...job, [field]: value } : job
      ));

      toast.success('Outsourcing status updated');
    } catch (error) {
      console.error('Error updating outsourcing status:', error);
      toast.error('Failed to update outsourcing status');
    }
  };

  const reassignJobToDesigner = async (jobCardId: string, designerId: string, priority: string, dueDate: string, notes: string) => {
    try {
      const token = localStorage.getItem('authToken');
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/job-assignment/assign`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jobCardId,
          designerId,
          priority,
          dueDate,
          notes,
          isReassignment: true
        })
      });

      if (response.ok) {
        toast.success('Job reassigned successfully');
        setIsReassignDialogOpen(false);
        setSelectedDesigner('');
        setAssignPriority('MEDIUM');
        setAssignDueDate('');
        setAssignNotes('');
        loadDashboardData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to reassign job');
      }
    } catch (error) {
      console.error('Error reassigning job:', error);
      toast.error('Failed to reassign job');
    }
  };

  // Socket event handlers
  useEffect(() => {
    if (socket && isConnected) {
      // Listen for job assignments
      socket.on('job_assigned', (data) => {
        toast.success(`New job assigned: ${data.jobCardId}`);
        loadDashboardData();
      });

      // Listen for designer job assignments
      socket.on('designer_job_assigned', (data) => {
        toast.success(`Job assigned to designer: ${data.jobCardId}`);
        loadDashboardData();
      });

      // Listen for job status updates
      socket.on('job_status_updated', (data) => {
        toast.info(`Job status updated: ${data.jobCardId}`);
        loadDashboardData();
      });

      // Listen for new jobs created
      socket.on('job_created', (data) => {
        toast.info(`New job created: ${data.jobCardId}`);
        loadDashboardData();
      });

      // Listen for new jobs ready for assignment
      socket.on('new_job_for_assignment', (data) => {
        toast.info(`New job ready for assignment: ${data.jobCardId}`);
        loadDashboardData();
      });

      return () => {
        socket.off('job_assigned');
        socket.off('designer_job_assigned');
        socket.off('job_status_updated');
        socket.off('job_created');
        socket.off('new_job_for_assignment');
      };
    }
  }, [socket, isConnected]);

  useEffect(() => {
    loadDashboardData();
  }, []);

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

  // Chart data for designer productivity
  const productivityData = designerStats.map(designer => ({
    name: `${designer.first_name} ${designer.last_name}`,
    completed: designer.completed_jobs,
    inProgress: designer.in_progress_jobs,
    paused: designer.paused_jobs,
    total: designer.total_jobs
  }));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading HOD dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Crown className="h-8 w-8 text-purple-600" />
                <h1 className="text-2xl font-bold text-gray-900">HOD Designer Dashboard</h1>
              </div>
              <Badge variant="outline" className="bg-green-100 text-green-800">
                {isConnected ? 'Connected' : 'Disconnected'}
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" onClick={loadDashboardData}>
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="jobs">All Jobs</TabsTrigger>
            <TabsTrigger value="designers">Designers</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Enhanced KPI Cards */}
            <AnimatedKPICards cards={[
              {
                title: "Total Active Projects",
                value: stats.total_jobs - stats.completed_jobs,
                change: "+12% from last month",
                changeType: "positive",
                icon: FolderOpen,
                gradient: "bg-gradient-to-br from-blue-500 to-blue-600",
                iconColor: "text-blue-100"
              },
              {
                title: "Designers Assigned",
                value: designerStats.length,
                change: `${designerStats.filter(d => d.total_jobs > 0).length} active`,
                changeType: "neutral",
                icon: UserCheck,
                gradient: "bg-gradient-to-br from-purple-500 to-purple-600",
                iconColor: "text-purple-100"
              },
              {
                title: "Pending Approvals",
                value: stats.hod_review_jobs,
                change: stats.hod_review_jobs > 5 ? "High priority" : "Normal",
                changeType: stats.hod_review_jobs > 5 ? "negative" : "positive",
                icon: Eye,
                gradient: "bg-gradient-to-br from-orange-500 to-orange-600",
                iconColor: "text-orange-100"
              },
              {
                title: "Completed Tasks",
                value: stats.completed_jobs,
                change: "+8.1% from last month",
                changeType: "positive",
                icon: CheckCircle,
                gradient: "bg-gradient-to-br from-green-500 to-green-600",
                iconColor: "text-green-100"
              }
            ]} />

            {/* Recent Jobs */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Job Assignments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {jobs.slice(0, 5).map((job) => (
                    <div key={job.prepress_job_id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div>
                          <p className="font-semibold">{job.job_card_number}</p>
                          <p className="text-sm text-gray-500">{job.company_name}</p>
                        </div>
                        <Badge className={statusColors[job.status]}>
                          {getStatusIcon(job.status)}
                          <span className="ml-1">{job.status.replace('_', ' ')}</span>
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{job.designer_first_name} {job.designer_last_name}</p>
                        <p className="text-sm text-gray-500">{formatDate(job.assigned_at)}</p>
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
                  <Select value={designerFilter} onValueChange={setDesignerFilter}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="Filter by designer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Designers</SelectItem>
                      {designers.map((designer) => (
                        <SelectItem key={designer.id} value={designer.id}>
                          {designer.first_name} {designer.last_name}
                        </SelectItem>
                      ))}
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
                  <Button onClick={() => setIsAssignDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Assign New Job
                  </Button>
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

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                              <div>
                                <p className="text-sm text-gray-500">Company</p>
                                <p className="font-medium">{job.company_name}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Product</p>
                                <p className="font-medium">{job.product_name} ({job.product_item_code})</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Designer</p>
                                <p className="font-medium">{job.designer_first_name} {job.designer_last_name}</p>
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
                                <p className="text-sm text-gray-500">Assigned By</p>
                                <p className="font-medium">{job.assigned_by_first_name} {job.assigned_by_last_name}</p>
                              </div>
                            </div>

                            {/* Outsourcing Status Section for HOD */}
                            {job.prepress_job_id && (
                              <div className="bg-purple-50/50 p-3 rounded-lg border border-purple-100 mb-4 shadow-sm">
                                <p className="text-[11px] font-bold text-purple-800 uppercase tracking-wider mb-2">Outsourcing Status</p>
                                <div className="flex flex-wrap gap-x-6 gap-y-2">
                                  <div className="flex items-center space-x-2 group">
                                    <Checkbox
                                      id={`die-making-hod-${job.prepress_job_id}`}
                                      checked={job.outsourcing_die_making_initiated}
                                      onCheckedChange={(checked) => handleOutsourcingUpdate(job.prepress_job_id, 'outsourcing_die_making_initiated', !!checked)}
                                      className="h-4 w-4 data-[state=checked]:bg-purple-600 border-purple-300 ring-offset-white"
                                    />
                                    <Label
                                      htmlFor={`die-making-hod-${job.prepress_job_id}`}
                                      className="text-xs font-semibold text-gray-700 cursor-pointer group-hover:text-purple-700 transition-colors"
                                    >
                                      Die Making
                                    </Label>
                                  </div>
                                  <div className="flex items-center space-x-2 group">
                                    <Checkbox
                                      id={`fil-req-hod-${job.prepress_job_id}`}
                                      checked={job.fil_initiated_request}
                                      onCheckedChange={(checked) => handleOutsourcingUpdate(job.prepress_job_id, 'fil_initiated_request', !!checked)}
                                      className="h-4 w-4 data-[state=checked]:bg-purple-600 border-purple-300 ring-offset-white"
                                    />
                                    <Label
                                      htmlFor={`fil-req-hod-${job.prepress_job_id}`}
                                      className="text-xs font-semibold text-gray-700 cursor-pointer group-hover:text-purple-700 transition-colors"
                                    >
                                      Fil Req
                                    </Label>
                                  </div>
                                  <div className="flex items-center space-x-2 group">
                                    <Checkbox
                                      id={`blocks-hod-${job.prepress_job_id}`}
                                      checked={job.blocks_initiated}
                                      onCheckedChange={(checked) => handleOutsourcingUpdate(job.prepress_job_id, 'blocks_initiated', !!checked)}
                                      className="h-4 w-4 data-[state=checked]:bg-purple-600 border-purple-300 ring-offset-white"
                                    />
                                    <Label
                                      htmlFor={`blocks-hod-${job.prepress_job_id}`}
                                      className="text-xs font-semibold text-gray-700 cursor-pointer group-hover:text-purple-700 transition-colors"
                                    >
                                      Blocks
                                    </Label>
                                  </div>
                                </div>
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
                              onClick={() => {
                                setSelectedJob(job);
                                setSelectedDesigner(job.designer_id);
                                setAssignPriority(job.priority);
                                setAssignDueDate(job.due_date);
                                setAssignNotes('');
                                setIsReassignDialogOpen(true);
                              }}
                            >
                              <UserPlus className="h-4 w-4 mr-2" />
                              Reassign
                            </Button>
                            <Button variant="outline" size="sm">
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
          </TabsContent>

          {/* Designers Tab */}
          <TabsContent value="designers" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {designerStats.map((designer) => (
                <Card key={designer.designer_id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{designer.first_name} {designer.last_name}</span>
                      <Badge variant="outline">
                        {designer.total_jobs} Jobs
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Completed</span>
                        <span className="font-medium text-green-600">{designer.completed_jobs}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">In Progress</span>
                        <span className="font-medium text-blue-600">{designer.in_progress_jobs}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Paused</span>
                        <span className="font-medium text-yellow-600">{designer.paused_jobs}</span>
                      </div>
                      <div className="mt-4">
                        <Progress
                          value={(designer.completed_jobs / designer.total_jobs) * 100}
                          className="h-2"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {Math.round((designer.completed_jobs / designer.total_jobs) * 100)}% Completion Rate
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Designer Productivity</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={productivityData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="completed" fill="#10b981" name="Completed" />
                      <Bar dataKey="inProgress" fill="#3b82f6" name="In Progress" />
                      <Bar dataKey="paused" fill="#f59e0b" name="Paused" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Job Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={[
                          { name: 'Completed', value: stats.completed_jobs, color: '#10b981' },
                          { name: 'In Progress', value: stats.in_progress_jobs, color: '#3b82f6' },
                          { name: 'HOD Review', value: stats.hod_review_jobs, color: '#8b5cf6' },
                          { name: 'Assigned', value: stats.assigned_jobs, color: '#f59e0b' },
                          { name: 'Paused', value: stats.paused_jobs, color: '#ef4444' }
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {[
                          { name: 'Completed', value: stats.completed_jobs, color: '#10b981' },
                          { name: 'In Progress', value: stats.in_progress_jobs, color: '#3b82f6' },
                          { name: 'HOD Review', value: stats.hod_review_jobs, color: '#8b5cf6' },
                          { name: 'Assigned', value: stats.assigned_jobs, color: '#f59e0b' },
                          { name: 'Paused', value: stats.paused_jobs, color: '#ef4444' }
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Job Assignment Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Job to Designer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="jobCardId">Job Card ID</Label>
              <Input
                id="jobCardId"
                placeholder="Enter job card ID"
                value={selectedJob?.job_card_number || ''}
                disabled
              />
            </div>
            <div>
              <Label htmlFor="designer">Designer</Label>
              <Select value={selectedDesigner} onValueChange={setSelectedDesigner}>
                <SelectTrigger>
                  <SelectValue placeholder="Select designer" />
                </SelectTrigger>
                <SelectContent>
                  {designers.map((designer) => (
                    <SelectItem key={designer.id} value={designer.id}>
                      {designer.first_name} {designer.last_name} ({designer.active_jobs} active jobs)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select value={assignPriority} onValueChange={setAssignPriority}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="datetime-local"
                value={assignDueDate}
                onChange={(e) => setAssignDueDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes for the designer..."
                value={assignNotes}
                onChange={(e) => setAssignNotes(e.target.value)}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (selectedJob && selectedDesigner) {
                    assignJobToDesigner(
                      selectedJob.job_card_number,
                      selectedDesigner,
                      assignPriority,
                      assignDueDate,
                      assignNotes
                    );
                  }
                }}
              >
                Assign Job
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Job Reassignment Dialog */}
      <Dialog open={isReassignDialogOpen} onOpenChange={setIsReassignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reassign Job to Designer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Job: {selectedJob?.job_card_number}</Label>
              <p className="text-sm text-gray-500">Currently assigned to: {selectedJob?.designer_first_name} {selectedJob?.designer_last_name}</p>
            </div>
            <div>
              <Label htmlFor="designer">Select New Designer</Label>
              <Select value={selectedDesigner} onValueChange={setSelectedDesigner}>
                <SelectTrigger>
                  <SelectValue placeholder="Select designer" />
                </SelectTrigger>
                <SelectContent>
                  {designers.map((designer) => (
                    <SelectItem key={designer.id} value={designer.id}>
                      {designer.first_name} {designer.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select value={assignPriority} onValueChange={setAssignPriority}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                type="datetime-local"
                value={assignDueDate}
                onChange={(e) => setAssignDueDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="notes">Reassignment Notes</Label>
              <Textarea
                value={assignNotes}
                onChange={(e) => setAssignNotes(e.target.value)}
                placeholder="Reason for reassignment..."
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsReassignDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (selectedJob && selectedDesigner) {
                    reassignJobToDesigner(
                      selectedJob.prepress_job_id,
                      selectedDesigner,
                      assignPriority,
                      assignDueDate,
                      assignNotes
                    );
                  }
                }}
              >
                Reassign Job
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
                  <SelectItem value="HOD_REVIEW">HOD Review</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
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
    </div>
  );
};

export default HODDesignerDashboard;
