import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  Download,
  Filter,
  Calendar,
  Search,
  Bell,
  Settings,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Zap,
  Target,
  Award,
  FileText,
  RefreshCw,
  Plus,
  MoreHorizontal,
  LogOut,
  TrendingUp,
  TrendingDown,
  UserPlus,
  MessageSquare,
  Palette,
  Layers,
  Sparkles,
  Star,
  Timer,
  CheckCircle2,
  AlertTriangle,
  Info,
  ArrowRight,
  ArrowLeft,
  Maximize2,
  Minimize2,
  Crown,
  Shield,
  Gauge,
  PieChart
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
import { usePrepressJobs, usePrepressStatistics, usePrepressJobActivity } from '@/hooks/usePrepress';
import { useDesignerProductivity } from '@/hooks/useReports';
import { toast } from 'sonner';
import { PrepressJob, PrepressStatus, PrepressPriority } from '@/types/prepress';
import { authAPI } from '@/services/api';
import { useSocket } from '@/services/socketService.tsx';

interface ModernHODPrepressDashboardProps {
  onLogout?: () => void;
}

const ModernHODPrepressDashboard: React.FC<ModernHODPrepressDashboardProps> = ({ onLogout }) => {
  const [selectedJob, setSelectedJob] = useState<PrepressJob | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    designer: '',
    search: ''
  });
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isRemarkDialogOpen, setIsRemarkDialogOpen] = useState(false);
  const [selectedDesigner, setSelectedDesigner] = useState('');
  const [remark, setRemark] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const { data: prepressJobs, isLoading: jobsLoading, refetch: refetchJobs } = usePrepressJobs(filters);
  const { data: statistics, isLoading: statsLoading } = usePrepressStatistics();
  const { data: designerProductivity } = useDesignerProductivity();
  const { data: activity } = usePrepressJobActivity(selectedJob?.id || '');
  const { socket } = useSocket();

  // Real-time updates
  useEffect(() => {
    if (socket) {
      socket.on('prepress_job_updated', (data) => {
        toast.success(`Job ${data.job_card_id} status updated to ${data.status}`);
        refetchJobs();
      });

      socket.on('prepress_job_assigned', (data) => {
        toast.info(`New job assigned: ${data.job_card_id}`);
        refetchJobs();
      });

      socket.on('prepress_job_started', (data) => {
        toast.info(`Job ${data.job_card_id} started by designer`);
        refetchJobs();
      });

      return () => {
        socket.off('prepress_job_updated');
        socket.off('prepress_job_assigned');
        socket.off('prepress_job_started');
      };
    }
  }, [socket, refetchJobs]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value === 'all' ? '' : value }));
  };

  const handleAssignDesigner = () => {
    if (selectedJob && selectedDesigner) {
      // TODO: Implement assignment logic
      toast.success('Designer assigned successfully');
      setIsAssignDialogOpen(false);
      setSelectedDesigner('');
      if (socket) {
        socket.emit('prepress_job_assigned', { 
          jobId: selectedJob.id, 
          designerId: selectedDesigner 
        });
      }
    }
  };

  const handleAddRemark = () => {
    if (selectedJob && remark) {
      // TODO: Implement remark logic
      toast.success('Remark added successfully');
      setIsRemarkDialogOpen(false);
      setRemark('');
    }
  };

  const handleRefresh = () => {
    refetchJobs();
    toast.success('Dashboard refreshed');
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
      toast.success('Logged out successfully');
    } else {
      authAPI.logout();
      toast.success('Logged out successfully');
      window.location.reload();
    }
  };

  // Group jobs by status for Kanban view
  const jobsByStatus = prepressJobs?.reduce((acc, job) => {
    if (!acc[job.status]) acc[job.status] = [];
    acc[job.status].push(job);
    return acc;
  }, {} as Record<PrepressStatus, PrepressJob[]>) || {};

  const statusColumns = [
    { key: 'PENDING', title: 'Pending', color: 'bg-gradient-to-br from-gray-50 to-gray-100', textColor: 'text-gray-700', icon: Clock },
    { key: 'ASSIGNED', title: 'Assigned', color: 'bg-gradient-to-br from-blue-50 to-blue-100', textColor: 'text-blue-700', icon: Target },
    { key: 'IN_PROGRESS', title: 'In Progress', color: 'bg-gradient-to-br from-yellow-50 to-yellow-100', textColor: 'text-yellow-700', icon: Activity },
    { key: 'PAUSED', title: 'Paused', color: 'bg-gradient-to-br from-orange-50 to-orange-100', textColor: 'text-orange-700', icon: Pause },
    { key: 'HOD_REVIEW', title: 'HOD Review', color: 'bg-gradient-to-br from-purple-50 to-purple-100', textColor: 'text-purple-700', icon: Eye },
    { key: 'COMPLETED', title: 'Completed', color: 'bg-gradient-to-br from-green-50 to-green-100', textColor: 'text-green-700', icon: CheckCircle },
    { key: 'REJECTED', title: 'Rejected', color: 'bg-gradient-to-br from-red-50 to-red-100', textColor: 'text-red-700', icon: XCircle }
  ] as const;

  const priorityColors = {
    LOW: 'bg-gray-100 text-gray-700',
    MEDIUM: 'bg-blue-100 text-blue-700',
    HIGH: 'bg-orange-100 text-orange-700',
    CRITICAL: 'bg-red-100 text-red-700'
  };

  // Mock chart data
  const productivityData = [
    { name: 'Jan', completed: 12, inProgress: 8, pending: 5 },
    { name: 'Feb', completed: 15, inProgress: 6, pending: 3 },
    { name: 'Mar', completed: 18, inProgress: 10, pending: 4 },
    { name: 'Apr', completed: 22, inProgress: 7, pending: 2 },
    { name: 'May', completed: 25, inProgress: 9, pending: 3 },
    { name: 'Jun', completed: 28, inProgress: 8, pending: 1 }
  ];

  const statusDistribution = [
    { name: 'Completed', value: statistics?.completed_jobs || 0, color: '#10B981' },
    { name: 'In Progress', value: statistics?.in_progress_jobs || 0, color: '#F59E0B' },
    { name: 'Pending', value: (statistics?.total_jobs || 0) - (statistics?.completed_jobs || 0) - (statistics?.in_progress_jobs || 0), color: '#6B7280' }
  ];

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/50 transition-all duration-300 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Modern Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="modern-card p-8 shadow-2xl overflow-hidden relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-50/50 to-indigo-50/50"></div>
          <div className="relative z-10 flex justify-between items-center">
            <div className="flex items-center space-x-6">
              <div className="h-14 w-14 bg-gradient-to-br from-purple-500 via-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-xl hover:scale-105 transition-transform duration-200">
                <Crown className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-display-3 font-bold text-gradient mb-2">
                  HOD Prepress Dashboard
                </h1>
                <p className="text-body text-slate-600 flex items-center gap-2">
                  <span>Comprehensive prepress management</span>
                  <span className="w-1 h-1 bg-slate-400 rounded-full"></span>
                  <span>Team coordination</span>
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="btn-secondary-modern"
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
              <Button 
                onClick={handleRefresh} 
                disabled={jobsLoading}
                className="btn-secondary-modern"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${jobsLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              <Button 
                className="btn-secondary-modern"
              >
                <Download className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Export</span>
              </Button>
              <Button 
                onClick={handleLogout} 
                className="btn-secondary-modern text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Modern Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Jobs</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {statsLoading ? '...' : statistics?.total_jobs || 0}
                    </p>
                    <p className="text-xs text-blue-600 flex items-center mt-1">
                      <Activity className="h-3 w-3 mr-1" />
                      All time
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">In Progress</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {statsLoading ? '...' : statistics?.in_progress_jobs || 0}
                    </p>
                    <p className="text-xs text-yellow-600 flex items-center mt-1">
                      <Clock className="h-3 w-3 mr-1" />
                      Active work
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Clock className="h-6 w-6 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Completed</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {statsLoading ? '...' : statistics?.completed_jobs || 0}
                    </p>
                    <p className="text-xs text-green-600 flex items-center mt-1">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {statistics?.total_jobs ? Math.round((statistics.completed_jobs / statistics.total_jobs) * 100) : 0}% completion
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Designers</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {statsLoading ? '...' : statistics?.active_designers || 0}
                    </p>
                    <p className="text-xs text-purple-600 flex items-center mt-1">
                      <Users className="h-3 w-3 mr-1" />
                      Team members
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Main Content Tabs */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="overview" className="flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4" />
                  <span>Overview</span>
                </TabsTrigger>
                <TabsTrigger value="kanban" className="flex items-center space-x-2">
                  <Layers className="w-4 h-4" />
                  <span>Kanban</span>
                </TabsTrigger>
                <TabsTrigger value="analytics" className="flex items-center space-x-2">
                  <PieChart className="w-4 h-4" />
                  <span>Analytics</span>
                </TabsTrigger>
                <TabsTrigger value="team" className="flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>Team</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* Quick Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="border-0 bg-gradient-to-br from-blue-50 to-blue-100">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-blue-900">Productivity Trend</h3>
                          <p className="text-3xl font-bold text-blue-600">+12%</p>
                          <p className="text-sm text-blue-700">vs last month</p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-blue-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 bg-gradient-to-br from-green-50 to-green-100">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-green-900">Quality Score</h3>
                          <p className="text-3xl font-bold text-green-600">94%</p>
                          <p className="text-sm text-green-700">Average rating</p>
                        </div>
                        <Award className="h-8 w-8 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 bg-gradient-to-br from-purple-50 to-purple-100">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-purple-900">On-Time Delivery</h3>
                          <p className="text-3xl font-bold text-purple-600">87%</p>
                          <p className="text-sm text-purple-700">This month</p>
                        </div>
                        <Timer className="h-8 w-8 text-purple-600" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Activity */}
                <Card className="border-0 bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-blue-600" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {prepressJobs?.slice(0, 5).map((job, index) => (
                        <motion.div
                          key={job.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="h-8 w-8 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                              <FileText className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{job.job_card_id_display}</p>
                              <p className="text-sm text-gray-600">{job.company_name}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={priorityColors[job.priority as PrepressPriority]}>
                              {job.priority}
                            </Badge>
                            <Badge variant="outline">{job.status}</Badge>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="kanban" className="space-y-6">
                {/* Modern Filters */}
                <Card className="border-0 bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-gray-900">
                      <Filter className="h-5 w-5 text-purple-600" />
                      Smart Filters
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <Label htmlFor="status" className="text-sm font-medium text-gray-700">Status</Label>
                        <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                          <SelectTrigger className="mt-1 bg-white/50 border-gray-200 focus:border-purple-300 focus:ring-purple-200">
                            <SelectValue placeholder="All Statuses" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="PENDING">Pending</SelectItem>
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
                        <Label htmlFor="priority" className="text-sm font-medium text-gray-700">Priority</Label>
                        <Select value={filters.priority} onValueChange={(value) => handleFilterChange('priority', value)}>
                          <SelectTrigger className="mt-1 bg-white/50 border-gray-200 focus:border-purple-300 focus:ring-purple-200">
                            <SelectValue placeholder="All Priorities" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Priorities</SelectItem>
                            <SelectItem value="LOW">Low</SelectItem>
                            <SelectItem value="MEDIUM">Medium</SelectItem>
                            <SelectItem value="HIGH">High</SelectItem>
                            <SelectItem value="CRITICAL">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="designer" className="text-sm font-medium text-gray-700">Designer</Label>
                        <Select value={filters.designer} onValueChange={(value) => handleFilterChange('designer', value)}>
                          <SelectTrigger className="mt-1 bg-white/50 border-gray-200 focus:border-purple-300 focus:ring-purple-200">
                            <SelectValue placeholder="All Designers" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Designers</SelectItem>
                            {designerProductivity?.map((designer) => (
                              <SelectItem key={designer.id} value={designer.id}>
                                {designer.first_name} {designer.last_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="search" className="text-sm font-medium text-gray-700">Search</Label>
                        <Input
                          id="search"
                          placeholder="Search jobs..."
                          value={filters.search}
                          onChange={(e) => handleFilterChange('search', e.target.value)}
                          className="mt-1 bg-white/50 border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Modern Kanban Board */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
                  {statusColumns.map((column) => (
                    <div key={column.key} className="space-y-3">
                      <div className={`p-4 rounded-xl ${column.color} border border-opacity-50`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <column.icon className="h-4 w-4" />
                            <h3 className={`font-semibold ${column.textColor}`}>
                              {column.title}
                            </h3>
                          </div>
                          <Badge variant="secondary" className="bg-white/80 text-gray-700">
                            {jobsByStatus[column.key as PrepressStatus]?.length || 0}
                          </Badge>
                        </div>
                      </div>
                      <div className="space-y-3 min-h-[500px]">
                        <AnimatePresence>
                          {jobsByStatus[column.key as PrepressStatus]?.map((job) => (
                            <motion.div
                              key={job.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer group"
                              onClick={() => setSelectedJob(job)}
                            >
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-medium text-sm text-gray-900 group-hover:text-purple-600 transition-colors">
                                    {job.job_card_id_display}
                                  </h4>
                                  <Badge className={`${priorityColors[job.priority as PrepressPriority]} text-xs`}>
                                    {job.priority}
                                  </Badge>
                                </div>
                                
                                <div className="space-y-2">
                                  <p className="text-xs text-gray-600 font-medium">{job.company_name}</p>
                                  <p className="text-xs text-gray-500">{job.product_type}</p>
                                  {job.designer_first_name && (
                                    <div className="flex items-center gap-1 text-xs text-blue-600">
                                      <User className="h-3 w-3" />
                                      {job.designer_first_name} {job.designer_last_name}
                                    </div>
                                  )}
                                  {job.due_date && (
                                    <div className="flex items-center gap-1 text-xs text-orange-600">
                                      <Calendar className="h-3 w-3" />
                                      Due: {new Date(job.due_date).toLocaleDateString()}
                                    </div>
                                  )}
                                </div>

                                <div className="flex items-center justify-between">
                                  <Badge variant="outline" className="text-xs">
                                    {job.status.replace('_', ' ')}
                                  </Badge>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="analytics" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="border-0 bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-blue-600" />
                        Productivity Trend
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={productivityData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="completed" stroke="#10B981" strokeWidth={2} />
                          <Line type="monotone" dataKey="inProgress" stroke="#F59E0B" strokeWidth={2} />
                          <Line type="monotone" dataKey="pending" stroke="#6B7280" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card className="border-0 bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <PieChart className="h-5 w-5 text-purple-600" />
                        Status Distribution
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <RechartsPieChart>
                          <Pie
                            data={statusDistribution}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {statusDistribution.map((entry, index) => (
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

              <TabsContent value="team" className="space-y-6">
                <Card className="border-0 bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-purple-600" />
                      Designer Productivity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {designerProductivity?.map((designer, index) => (
                        <motion.div
                          key={designer.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="p-4 border border-gray-200 rounded-xl bg-white hover:shadow-lg transition-all duration-200"
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <div className="h-10 w-10 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center">
                              <span className="text-purple-600 font-semibold">
                                {designer.first_name[0]}{designer.last_name[0]}
                              </span>
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{designer.first_name} {designer.last_name}</h3>
                              <p className="text-sm text-gray-600">{designer.email}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="text-center">
                              <p className="text-lg font-bold text-blue-600">{designer.total_jobs}</p>
                              <p className="text-gray-600">Total</p>
                            </div>
                            <div className="text-center">
                              <p className="text-lg font-bold text-green-600">{designer.completed_jobs}</p>
                              <p className="text-gray-600">Completed</p>
                            </div>
                            <div className="text-center">
                              <p className="text-lg font-bold text-yellow-600">{designer.in_progress_jobs}</p>
                              <p className="text-gray-600">In Progress</p>
                            </div>
                            <div className="text-center">
                              <p className="text-lg font-bold text-red-600">{designer.rejected_jobs}</p>
                              <p className="text-gray-600">Rejected</p>
                            </div>
                          </div>
                          <div className="mt-3">
                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                              <span>Completion Rate</span>
                              <span>{designer.total_jobs > 0 ? Math.round((designer.completed_jobs / designer.total_jobs) * 100) : 0}%</span>
                            </div>
                            <Progress 
                              value={designer.total_jobs > 0 ? (designer.completed_jobs / designer.total_jobs) * 100 : 0} 
                              className="h-2" 
                            />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Modern Job Detail Dialog */}
        <Dialog open={!!selectedJob} onOpenChange={() => setSelectedJob(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-xl">
                <div className="h-8 w-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                  <Crown className="h-4 w-4 text-white" />
                </div>
                Job Details - {selectedJob?.job_card_id_display}
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                Manage this prepress job and view its activity history
              </DialogDescription>
            </DialogHeader>
            
            {selectedJob && (
              <div className="space-y-6">
                {/* Job Information Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                    <Label className="text-sm font-medium text-blue-700">Company</Label>
                    <p className="text-sm text-gray-800 mt-1 font-medium">{selectedJob.company_name}</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                    <Label className="text-sm font-medium text-green-700">Product Type</Label>
                    <p className="text-sm text-gray-800 mt-1 font-medium">{selectedJob.product_type}</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl">
                    <Label className="text-sm font-medium text-orange-700">Priority</Label>
                    <Badge className={`${priorityColors[selectedJob.priority as PrepressPriority]} mt-1`}>
                      {selectedJob.priority}
                    </Badge>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                    <Label className="text-sm font-medium text-purple-700">Status</Label>
                    <Badge variant="outline" className="mt-1">{selectedJob.status}</Badge>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl">
                    <Label className="text-sm font-medium text-yellow-700">Assigned Designer</Label>
                    <p className="text-sm text-gray-800 mt-1 font-medium">
                      {selectedJob.designer_first_name ? 
                        `${selectedJob.designer_first_name} ${selectedJob.designer_last_name}` : 
                        'Not assigned'
                      }
                    </p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
                    <Label className="text-sm font-medium text-gray-700">Due Date</Label>
                    <p className="text-sm text-gray-800 mt-1 font-medium">
                      {selectedJob.due_date ? new Date(selectedJob.due_date).toLocaleDateString() : 'Not set'}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 flex-wrap">
                  <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="border-purple-200 text-purple-600 hover:bg-purple-50">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Assign Designer
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
                      <DialogHeader>
                        <DialogTitle>Assign Designer</DialogTitle>
                        <DialogDescription>
                          Select a designer to assign to this job
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="designer-select">Designer</Label>
                          <Select value={selectedDesigner} onValueChange={setSelectedDesigner}>
                            <SelectTrigger className="mt-1 bg-white/50 border-gray-200 focus:border-purple-300 focus:ring-purple-200">
                              <SelectValue placeholder="Select a designer" />
                            </SelectTrigger>
                            <SelectContent>
                              {designerProductivity?.map((designer) => (
                                <SelectItem key={designer.id} value={designer.id}>
                                  {designer.first_name} {designer.last_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button 
                          onClick={handleAssignDesigner} 
                          disabled={!selectedDesigner}
                          className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white border-0"
                        >
                          Assign
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={isRemarkDialogOpen} onOpenChange={setIsRemarkDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="border-blue-200 text-blue-600 hover:bg-blue-50">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Add Remark
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
                      <DialogHeader>
                        <DialogTitle>Add Remark</DialogTitle>
                        <DialogDescription>
                          Add a remark or note for this job
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="remark">Remark</Label>
                          <Textarea
                            id="remark"
                            placeholder="Enter your remark..."
                            value={remark}
                            onChange={(e) => setRemark(e.target.value)}
                            className="mt-1 bg-white/50 border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button 
                          onClick={handleAddRemark} 
                          disabled={!remark.trim()}
                          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0"
                        >
                          Add Remark
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Activity History */}
                <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
                  <Label className="text-sm font-medium text-gray-700">Activity History</Label>
                  <div className="mt-3 space-y-3 max-h-40 overflow-y-auto">
                    {activity?.map((act, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
                        <div className="h-2 w-2 bg-blue-500 rounded-full" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{act.action}</p>
                          <p className="text-xs text-gray-600">
                            {act.first_name} {act.last_name} • {new Date(act.created_at).toLocaleString()}
                          </p>
                          {act.remark && (
                            <p className="text-xs text-gray-500 mt-1">{act.remark}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ModernHODPrepressDashboard;
