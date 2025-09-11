import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play,
  Pause,
  Square,
  Upload,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Eye,
  Download,
  RefreshCw,
  Filter,
  Search,
  Calendar,
  User,
  Target,
  Award,
  LogOut,
  Zap,
  Activity,
  TrendingUp,
  Bell,
  Settings,
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
  Minimize2
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
import { useMyPrepressJobs, usePrepressJobActivity } from '@/hooks/usePrepress';
import { 
  useStartPrepressJob, 
  usePausePrepressJob, 
  useResumePrepressJob, 
  useSubmitPrepressJob,
  useAddPrepressRemark 
} from '@/hooks/usePrepress';
import { toast } from 'sonner';
import { PrepressJob, PrepressStatus, PrepressPriority } from '@/types/prepress';
import { authAPI } from '@/services/api';
import { useSocket } from '@/services/socketService.tsx';

interface ModernDesignerWorkbenchProps {
  onLogout?: () => void;
}

const ModernDesignerWorkbench: React.FC<ModernDesignerWorkbenchProps> = ({ onLogout }) => {
  const [selectedJob, setSelectedJob] = useState<PrepressJob | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    search: ''
  });
  const [isRemarkDialogOpen, setIsRemarkDialogOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [remark, setRemark] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState('kanban');

  const { data: myJobs, isLoading: jobsLoading, refetch: refetchJobs } = useMyPrepressJobs(filters);
  const { data: activity } = usePrepressJobActivity(selectedJob?.id || '');
  const { socket } = useSocket();

  // Mutations
  const startJobMutation = useStartPrepressJob();
  const pauseJobMutation = usePausePrepressJob();
  const resumeJobMutation = useResumePrepressJob();
  const submitJobMutation = useSubmitPrepressJob();
  const addRemarkMutation = useAddPrepressRemark();

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

      return () => {
        socket.off('prepress_job_updated');
        socket.off('prepress_job_assigned');
      };
    }
  }, [socket, refetchJobs]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value === 'all' ? '' : value }));
  };

  const handleStartJob = (jobId: string) => {
    startJobMutation.mutate(jobId, {
      onSuccess: () => {
        toast.success('Work started successfully');
        refetchJobs();
        // Emit real-time update
        if (socket) {
          socket.emit('prepress_job_started', { jobId });
        }
      },
      onError: (error: Error) => {
        toast.error(`Failed to start work: ${error.message}`);
      }
    });
  };

  const handlePauseJob = (jobId: string) => {
    pauseJobMutation.mutate({ jobId, remark: 'Work paused by designer' }, {
      onSuccess: () => {
        toast.success('Work paused successfully');
        refetchJobs();
        if (socket) {
          socket.emit('prepress_job_paused', { jobId });
        }
      },
      onError: (error: Error) => {
        toast.error(`Failed to pause work: ${error.message}`);
      }
    });
  };

  const handleResumeJob = (jobId: string) => {
    resumeJobMutation.mutate(jobId, {
      onSuccess: () => {
        toast.success('Work resumed successfully');
        refetchJobs();
        if (socket) {
          socket.emit('prepress_job_resumed', { jobId });
        }
      },
      onError: (error: Error) => {
        toast.error(`Failed to resume work: ${error.message}`);
      }
    });
  };

  const handleSubmitJob = (jobId: string) => {
    submitJobMutation.mutate({ jobId, remark: 'Submitted for HOD review' }, {
      onSuccess: () => {
        toast.success('Job submitted for review successfully');
        refetchJobs();
        if (socket) {
          socket.emit('prepress_job_submitted', { jobId });
        }
      },
      onError: (error: Error) => {
        toast.error(`Failed to submit job: ${error.message}`);
      }
    });
  };

  const handleAddRemark = () => {
    if (selectedJob && remark.trim()) {
      addRemarkMutation.mutate({
        jobId: selectedJob.id,
        data: { remark: remark.trim(), isHodRemark: false }
      }, {
        onSuccess: () => {
          toast.success('Remark added successfully');
          setIsRemarkDialogOpen(false);
          setRemark('');
          refetchJobs();
        },
        onError: (error: Error) => {
          toast.error(`Failed to add remark: ${error.message}`);
        }
      });
    }
  };

  const handleRefresh = () => {
    refetchJobs();
    toast.success('Workbench refreshed');
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

  const getStatusColor = (status: PrepressStatus) => {
    switch (status) {
      case 'PENDING': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'ASSIGNED': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'PAUSED': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'HOD_REVIEW': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'COMPLETED': return 'bg-green-100 text-green-700 border-green-200';
      case 'REJECTED': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getPriorityColor = (priority: PrepressPriority) => {
    switch (priority) {
      case 'LOW': return 'bg-gray-100 text-gray-700';
      case 'MEDIUM': return 'bg-blue-100 text-blue-700';
      case 'HIGH': return 'bg-orange-100 text-orange-700';
      case 'CRITICAL': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getActionButtons = (job: PrepressJob) => {
    switch (job.status) {
      case 'ASSIGNED':
        return (
          <Button
            size="sm"
            onClick={() => handleStartJob(job.id)}
            disabled={startJobMutation.isPending}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Play className="h-4 w-4 mr-2" />
            Start Work
          </Button>
        );
      case 'IN_PROGRESS':
        return (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handlePauseJob(job.id)}
              disabled={pauseJobMutation.isPending}
              className="border-orange-200 text-orange-600 hover:bg-orange-50"
            >
              <Pause className="h-4 w-4 mr-2" />
              Pause
            </Button>
            <Button
              size="sm"
              onClick={() => handleSubmitJob(job.id)}
              disabled={submitJobMutation.isPending}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Submit
            </Button>
          </div>
        );
      case 'PAUSED':
        return (
          <Button
            size="sm"
            onClick={() => handleResumeJob(job.id)}
            disabled={resumeJobMutation.isPending}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Play className="h-4 w-4 mr-2" />
            Resume
          </Button>
        );
      default:
        return null;
    }
  };

  // Group jobs by status
  const jobsByStatus = myJobs?.reduce((acc, job) => {
    if (!acc[job.status]) acc[job.status] = [];
    acc[job.status].push(job);
    return acc;
  }, {} as Record<PrepressStatus, PrepressJob[]>) || {};

  const statusColumns = [
    { key: 'ASSIGNED', title: 'Assigned', color: 'bg-gradient-to-br from-blue-50 to-blue-100', textColor: 'text-blue-700', icon: Target },
    { key: 'IN_PROGRESS', title: 'In Progress', color: 'bg-gradient-to-br from-yellow-50 to-yellow-100', textColor: 'text-yellow-700', icon: Activity },
    { key: 'PAUSED', title: 'Paused', color: 'bg-gradient-to-br from-orange-50 to-orange-100', textColor: 'text-orange-700', icon: Pause },
    { key: 'HOD_REVIEW', title: 'Under Review', color: 'bg-gradient-to-br from-purple-50 to-purple-100', textColor: 'text-purple-700', icon: Eye },
    { key: 'COMPLETED', title: 'Completed', color: 'bg-gradient-to-br from-green-50 to-green-100', textColor: 'text-green-700', icon: CheckCircle },
    { key: 'REJECTED', title: 'Rejected', color: 'bg-gradient-to-br from-red-50 to-red-100', textColor: 'text-red-700', icon: AlertTriangle }
  ] as const;

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 transition-all duration-300 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Modern Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex justify-between items-center"
        >
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Palette className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                Designer Workbench
              </h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">
                Your creative workspace for prepress design projects
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-white hover:border-blue-300 transition-all duration-200"
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleRefresh} 
              disabled={jobsLoading}
              className="bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-white hover:border-blue-300 transition-all duration-200"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${jobsLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button 
              onClick={handleLogout} 
              variant="outline" 
              size="sm" 
              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 transition-all duration-200"
            >
              <LogOut className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </motion.div>

        {/* Modern KPI Cards */}
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
                    <p className="text-2xl font-bold text-gray-900">{myJobs?.length || 0}</p>
                    <p className="text-xs text-blue-600 flex items-center mt-1">
                      <FileText className="h-3 w-3 mr-1" />
                      All projects
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
                      {jobsByStatus['IN_PROGRESS']?.length || 0}
                    </p>
                    <p className="text-xs text-yellow-600 flex items-center mt-1">
                      <Activity className="h-3 w-3 mr-1" />
                      Active work
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Activity className="h-6 w-6 text-yellow-600" />
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
                      {jobsByStatus['COMPLETED']?.length || 0}
                    </p>
                    <p className="text-xs text-green-600 flex items-center mt-1">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Success rate
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
                    <p className="text-sm font-medium text-gray-600">Under Review</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {jobsByStatus['HOD_REVIEW']?.length || 0}
                    </p>
                    <p className="text-xs text-purple-600 flex items-center mt-1">
                      <Eye className="h-3 w-3 mr-1" />
                      Awaiting approval
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Eye className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Modern Filters */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Filter className="h-5 w-5 text-blue-600" />
              Smart Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="status" className="text-sm font-medium text-gray-700">Status</Label>
                <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                  <SelectTrigger className="mt-1 bg-white/50 border-gray-200 focus:border-blue-300 focus:ring-blue-200">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="ASSIGNED">Assigned</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="PAUSED">Paused</SelectItem>
                    <SelectItem value="HOD_REVIEW">Under Review</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority" className="text-sm font-medium text-gray-700">Priority</Label>
                <Select value={filters.priority} onValueChange={(value) => handleFilterChange('priority', value)}>
                  <SelectTrigger className="mt-1 bg-white/50 border-gray-200 focus:border-blue-300 focus:ring-blue-200">
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
                <Label htmlFor="search" className="text-sm font-medium text-gray-700">Search</Label>
                <Input
                  id="search"
                  placeholder="Search jobs..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="mt-1 bg-white/50 border-gray-200 focus:border-blue-300 focus:ring-blue-200"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Modern Job Queue with Tabs */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Target className="h-5 w-5 text-blue-600" />
                My Creative Queue
              </CardTitle>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="kanban" className="flex items-center gap-2">
                    <Layers className="h-4 w-4" />
                    Kanban
                  </TabsTrigger>
                  <TabsTrigger value="list" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    List
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsContent value="kanban" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
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
                      <div className="space-y-3 min-h-[400px]">
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
                                  <h4 className="font-medium text-sm text-gray-900 group-hover:text-blue-600 transition-colors">
                                    {job.job_card_id_display}
                                  </h4>
                                  <Badge className={`${getPriorityColor(job.priority as PrepressPriority)} text-xs`}>
                                    {job.priority}
                                  </Badge>
                                </div>
                                
                                <div className="space-y-2">
                                  <p className="text-xs text-gray-600 font-medium">{job.company_name}</p>
                                  <p className="text-xs text-gray-500">{job.product_type}</p>
                                  {job.due_date && (
                                    <div className="flex items-center gap-1 text-xs text-orange-600">
                                      <Calendar className="h-3 w-3" />
                                      Due: {new Date(job.due_date).toLocaleDateString()}
                                    </div>
                                  )}
                                </div>

                                <div className="flex items-center justify-between">
                                  <Badge className={`${getStatusColor(job.status)} text-xs border`}>
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

                                {getActionButtons(job) && (
                                  <div className="pt-2">
                                    {getActionButtons(job)}
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="list" className="space-y-4">
                <div className="space-y-3">
                  {myJobs?.map((job) => (
                    <motion.div
                      key={job.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer group"
                      onClick={() => setSelectedJob(job)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="h-10 w-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                            <FileText className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                              {job.job_card_id_display}
                            </h4>
                            <p className="text-sm text-gray-600">{job.company_name} • {job.product_type}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Badge className={`${getPriorityColor(job.priority as PrepressPriority)} text-xs`}>
                            {job.priority}
                          </Badge>
                          <Badge className={`${getStatusColor(job.status)} text-xs border`}>
                            {job.status.replace('_', ' ')}
                          </Badge>
                          {getActionButtons(job)}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Modern Job Detail Dialog */}
        <Dialog open={!!selectedJob} onOpenChange={() => setSelectedJob(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-xl">
                <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <FileText className="h-4 w-4 text-white" />
                </div>
                Job Details - {selectedJob?.job_card_id_display}
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                View job details, add remarks, and manage your creative work
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
                    <Badge className={`${getPriorityColor(selectedJob.priority as PrepressPriority)} mt-1`}>
                      {selectedJob.priority}
                    </Badge>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                    <Label className="text-sm font-medium text-purple-700">Status</Label>
                    <Badge className={`${getStatusColor(selectedJob.status)} mt-1 border`}>
                      {selectedJob.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl">
                    <Label className="text-sm font-medium text-yellow-700">Due Date</Label>
                    <p className="text-sm text-gray-800 mt-1 font-medium">
                      {selectedJob.due_date ? new Date(selectedJob.due_date).toLocaleDateString() : 'Not set'}
                    </p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
                    <Label className="text-sm font-medium text-gray-700">Created</Label>
                    <p className="text-sm text-gray-800 mt-1 font-medium">
                      {new Date(selectedJob.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Special Instructions */}
                {selectedJob.special_instructions && (
                  <div className="p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl border border-indigo-200">
                    <Label className="text-sm font-medium text-indigo-700">Special Instructions</Label>
                    <p className="text-sm text-gray-800 mt-2 p-3 bg-white/80 rounded-lg border border-indigo-200">
                      {selectedJob.special_instructions}
                    </p>
                  </div>
                )}

                {/* HOD Remarks */}
                {selectedJob.hod_last_remark && (
                  <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                    <Label className="text-sm font-medium text-purple-700">HOD Remarks</Label>
                    <p className="text-sm text-gray-800 mt-2 p-3 bg-white/80 rounded-lg border border-purple-200">
                      {selectedJob.hod_last_remark}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 flex-wrap">
                  {getActionButtons(selectedJob)}
                  
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
                            className="mt-1 bg-white/50 border-gray-200 focus:border-blue-300 focus:ring-blue-200"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button 
                          onClick={handleAddRemark} 
                          disabled={!remark.trim() || addRemarkMutation.isPending}
                          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0"
                        >
                          {addRemarkMutation.isPending ? 'Adding...' : 'Add Remark'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="border-green-200 text-green-600 hover:bg-green-50">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Files
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
                      <DialogHeader>
                        <DialogTitle>Upload Files</DialogTitle>
                        <DialogDescription>
                          Upload artwork, previews, or other files for this job
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="file-upload">Select Files</Label>
                          <Input
                            id="file-upload"
                            type="file"
                            multiple
                            accept=".jpg,.jpeg,.png,.pdf,.ai,.psd"
                            className="mt-1 bg-white/50 border-gray-200 focus:border-blue-300 focus:ring-blue-200"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button 
                          onClick={() => setIsUploadDialogOpen(false)}
                          className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border-0"
                        >
                          Upload
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

export default ModernDesignerWorkbench;
