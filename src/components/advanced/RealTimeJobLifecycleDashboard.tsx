import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Factory,
  Package,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  ArrowRight,
  Activity,
  Calendar,
  Search,
  Filter,
  Bell,
  Zap,
  TrendingUp,
  Users,
  BarChart3,
  RefreshCw,
  Play,
  Pause,
  XCircle,
  Target,
  LogOut
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSocket } from '@/services/socketService.tsx';
import { toast } from 'sonner';
import BackendStatusIndicator from '../BackendStatusIndicator';

interface JobLifecycleProps {
  onLogout?: () => void;
}

interface JobLifecycleData {
  id: string;
  job_card_id: string;
  status: string;
  prepress_status?: string;
  prepress_notes?: string;
  assigned_designer_id?: string;
  designer_name?: string;
  creator_name?: string;
  job_card_id_display: string;
  product_item_code: string;
  brand: string;
  company_name: string;
  quantity: number;
  delivery_date: string;
  job_priority: string;
  prepress_due_date?: string;
  created_at: string;
  updated_at: string;
  statusHistory?: any[];
}

interface NotificationData {
  id: string;
  type: 'success' | 'warning' | 'info' | 'error';
  title: string;
  message: string;
  jobCardId?: string;
  timestamp: string;
  read: boolean;
}

const statusColors: Record<string, string> = {
  'CREATED': 'bg-blue-100 text-blue-800 border-blue-300',
  'ASSIGNED_TO_PREPRESS': 'bg-indigo-100 text-indigo-800 border-indigo-300',
  'PREPRESS_IN_PROGRESS': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'PREPRESS_COMPLETED': 'bg-green-100 text-green-800 border-green-300',
  'READY_FOR_PRODUCTION': 'bg-purple-100 text-purple-800 border-purple-300',
  'IN_PRODUCTION': 'bg-orange-100 text-orange-800 border-orange-300',
  'COMPLETED': 'bg-emerald-100 text-emerald-800 border-emerald-300',
  'ON_HOLD': 'bg-red-100 text-red-800 border-red-300',
  'CANCELLED': 'bg-gray-100 text-gray-800 border-gray-300'
};

const prepressStatusColors: Record<string, string> = {
  'PENDING': 'bg-gray-100 text-gray-800 border-gray-300',
  'ASSIGNED': 'bg-blue-100 text-blue-800 border-blue-300',
  'IN_PROGRESS': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'PAUSED': 'bg-orange-100 text-orange-800 border-orange-300',
  'HOD_REVIEW': 'bg-purple-100 text-purple-800 border-purple-300',
  'COMPLETED': 'bg-green-100 text-green-800 border-green-300',
  'REJECTED': 'bg-red-100 text-red-800 border-red-300'
};

const priorityColors: Record<string, string> = {
  'Low': 'bg-green-100 text-green-800 border-green-300',
  'Medium': 'bg-blue-100 text-blue-800 border-blue-300',
  'High': 'bg-orange-100 text-orange-800 border-orange-300',
  'Critical': 'bg-red-100 text-red-800 border-red-300'
};

export const RealTimeJobLifecycleDashboard: React.FC<JobLifecycleProps> = ({ onLogout }) => {
  const { socket, isConnected } = useSocket();
  const [jobs, setJobs] = useState<JobLifecycleData[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<JobLifecycleData[]>([]);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [stats, setStats] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');

  // Load initial data
  const loadJobs = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Loading job lifecycle data...');
      
      // Load all jobs with lifecycle data
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/job-lifecycle/all`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      console.log('🔄 API Response Status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Jobs loaded:', data.data?.length || 0);
        setJobs(data.data || []);
        setFilteredJobs(data.data || []);
      } else {
        console.error('❌ Failed to load jobs:', response.status);
        toast.error('Failed to load jobs');
      }
    } catch (error) {
      console.error('❌ Error loading jobs:', error);
      toast.error('Error loading jobs');
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      console.log('🔄 Loading dashboard stats...');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/job-lifecycle/stats/dashboard`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Stats loaded:', data.data);
        setStats(data.data || {});
      } else {
        console.error('❌ Failed to load stats:', response.status);
      }
    } catch (error) {
      console.error('❌ Error loading stats:', error);
    }
  };

  // Setup real-time updates
  useEffect(() => {
    if (socket && isConnected) {
      // Join job updates
      socket.emit('join_job_updates');

      // Listen for comprehensive job lifecycle updates
      socket.on('job_lifecycle_update', (update) => {
        console.log('🔄 Received job lifecycle update:', update);
        
        // Update jobs list with new data
        setJobs(prevJobs => {
          const updatedJobs = prevJobs.map(job => 
            job.job_card_id === update.jobCardId 
              ? { ...job, ...update.data, updated_at: update.timestamp }
              : job
          );
          
          // If job doesn't exist, add it
          if (!prevJobs.find(job => job.job_card_id === update.jobCardId)) {
            updatedJobs.unshift({
              id: update.data.lifecycleId || Date.now().toString(),
              job_card_id: update.jobCardId,
              status: update.data.newStatus || update.data.status,
              current_stage: update.data.currentStage,
              priority: update.data.priority || 'MEDIUM',
              progress: update.data.progress || 0,
              created_at: update.timestamp,
              updated_at: update.timestamp,
              ...update.data
            });
          }
          
          return updatedJobs;
        });

        // Update filtered jobs
        setFilteredJobs(prevFiltered => {
          const updatedFiltered = prevFiltered.map(job => 
            job.job_card_id === update.jobCardId 
              ? { ...job, ...update.data, updated_at: update.timestamp }
              : job
          );
          
          if (!prevFiltered.find(job => job.job_card_id === update.jobCardId)) {
            updatedFiltered.unshift({
              id: update.data.lifecycleId || Date.now().toString(),
              job_card_id: update.jobCardId,
              status: update.data.newStatus || update.data.status,
              current_stage: update.data.currentStage,
              priority: update.data.priority || 'MEDIUM',
              progress: update.data.progress || 0,
              created_at: update.timestamp,
              updated_at: update.timestamp,
              ...update.data
            });
          }
          
          return updatedFiltered;
        });

        // Add notification based on event type
        let notificationType: 'success' | 'warning' | 'info' | 'error' = 'info';
        let title = 'Job Updated';
        let message = `Job ${update.jobCardId} has been updated`;

        switch (update.eventType) {
          case 'JOB_CREATED':
            notificationType = 'success';
            title = 'New Job Created';
            message = `New job ${update.jobCardId} has been created`;
            break;
          case 'STATUS_CHANGED':
            notificationType = 'info';
            title = 'Status Changed';
            message = `Job ${update.jobCardId} status changed from ${update.data.oldStatus} to ${update.data.newStatus}`;
            break;
          case 'STEP_COMPLETED':
            notificationType = 'success';
            title = 'Process Step Completed';
            message = `Job ${update.jobCardId} completed a process step`;
            break;
        }

        const notification: NotificationData = {
          id: Date.now().toString(),
          type: notificationType,
          title,
          message,
          jobCardId: update.jobCardId,
          timestamp: update.timestamp || new Date().toISOString(),
          read: false
        };
        
        setNotifications(prev => [notification, ...prev].slice(0, 50));
        
        // Show toast notification
        toast.success(notification.message, {
          description: `Job ${update.jobCardId}`,
          action: {
            label: 'View',
            onClick: () => {
              const element = document.getElementById(`job-${update.jobCardId}`);
              if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
              }
            }
          }
        });
      });

      // Listen for prepress-specific updates
      socket.on('prepress_job_update', (update) => {
        console.log('Received prepress update:', update);
        loadJobs(); // Refresh job list
      });

      // Listen for notifications
      socket.on('notification', (notification) => {
        const newNotification: NotificationData = {
          id: Date.now().toString(),
          type: notification.type || 'info',
          title: notification.title,
          message: notification.message,
          jobCardId: notification.jobCardId,
          timestamp: notification.timestamp,
          read: false
        };
        
        setNotifications(prev => [newNotification, ...prev].slice(0, 50));
        toast(notification.title, {
          description: notification.message,
        });
      });

      return () => {
        socket.off('job_lifecycle_update');
        socket.off('prepress_job_update');
        socket.off('notification');
      };
    }
  }, [socket, isConnected]);

  // Load initial data
  useEffect(() => {
    loadJobs();
    loadStats();
  }, []);

  // Filter jobs
  useEffect(() => {
    let filtered = jobs;

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(job => job.status === selectedStatus);
    }

    if (selectedPriority !== 'all') {
      filtered = filtered.filter(job => job.job_priority === selectedPriority);
    }

    if (searchTerm) {
      filtered = filtered.filter(job => 
        job.job_card_id_display.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.product_item_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (job.designer_name && job.designer_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredJobs(filtered);
  }, [jobs, selectedStatus, selectedPriority, searchTerm]);

  const getProgressPercentage = (status: string) => {
    const progressMap: Record<string, number> = {
      'CREATED': 10,
      'ASSIGNED_TO_PREPRESS': 25,
      'PREPRESS_IN_PROGRESS': 50,
      'PREPRESS_COMPLETED': 75,
      'READY_FOR_PRODUCTION': 85,
      'IN_PRODUCTION': 95,
      'COMPLETED': 100,
      'ON_HOLD': 0,
      'CANCELLED': 0
    };
    return progressMap[status] || 0;
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <motion.div 
          className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 mb-8 border border-white/20 shadow-xl"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Real-Time Job Lifecycle Dashboard
                </h1>
                <div className="flex items-center gap-4 mt-2">
                  <p className="text-gray-600">Monitor job progress with live updates</p>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className={`text-sm ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                      {isConnected ? 'Live' : 'Disconnected'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={loadJobs}
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
              
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Bell className="w-4 h-4" />
                  {notifications.filter(n => !n.read).length > 0 && (
                    <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {notifications.filter(n => !n.read).length}
                    </span>
                  )}
                </Button>
              </div>

              <BackendStatusIndicator />
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onLogout} 
                className="gap-2 hover:bg-red-50 hover:border-red-200 hover:text-red-700"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">Total Active</p>
                  <p className="text-2xl font-bold text-blue-900">{jobs.length}</p>
                </div>
                <Package className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-600 text-sm font-medium">In Prepress</p>
                  <p className="text-2xl font-bold text-yellow-900">
                    {jobs.filter(j => ['ASSIGNED_TO_PREPRESS', 'PREPRESS_IN_PROGRESS'].includes(j.status)).length}
                  </p>
                </div>
                <User className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">Completed</p>
                  <p className="text-2xl font-bold text-green-900">
                    {jobs.filter(j => j.status === 'COMPLETED').length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-rose-50 border-red-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-600 text-sm font-medium">Overdue</p>
                  <p className="text-2xl font-bold text-red-900">
                    {jobs.filter(j => getDaysUntilDue(j.delivery_date) < 0 && j.status !== 'COMPLETED').length}
                  </p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 text-sm font-medium">On Time %</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {jobs.length > 0 ? Math.round((jobs.filter(j => getDaysUntilDue(j.delivery_date) >= 0).length / jobs.length) * 100) : 0}%
                  </p>
                </div>
                <Target className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="notifications">
              Notifications {notifications.filter(n => !n.read).length > 0 && (
                <span className="ml-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Filters */}
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="w-5 h-5 text-indigo-600" />
                    Filters & Search
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="Search jobs..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    
                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="CREATED">Created</SelectItem>
                        <SelectItem value="ASSIGNED_TO_PREPRESS">Assigned to Prepress</SelectItem>
                        <SelectItem value="PREPRESS_IN_PROGRESS">Prepress In Progress</SelectItem>
                        <SelectItem value="PREPRESS_COMPLETED">Prepress Completed</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Priority</SelectItem>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button variant="outline" className="gap-2">
                      <Calendar className="w-4 h-4" />
                      Due Date
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Jobs List */}
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-lg">
                <CardHeader>
                  <CardTitle>Live Job Status ({filteredJobs.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                      <p className="mt-4 text-gray-600">Loading jobs...</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <AnimatePresence>
                        {filteredJobs.map((job, index) => (
                          <motion.div
                            key={job.id}
                            id={`job-${job.job_card_id}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ delay: index * 0.05 }}
                            className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all duration-300"
                          >
                            <div className="space-y-4">
                              {/* Header */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <h3 className="font-semibold text-lg text-gray-900">
                                    {job.job_card_id_display}
                                  </h3>
                                  <Badge className={statusColors[job.status]}>
                                    {formatStatus(job.status)}
                                  </Badge>
                                  {job.prepress_status && (
                                    <Badge className={prepressStatusColors[job.prepress_status]}>
                                      Prepress: {formatStatus(job.prepress_status)}
                                    </Badge>
                                  )}
                                  <Badge className={priorityColors[job.job_priority]}>
                                    {job.job_priority}
                                  </Badge>
                                  {getDaysUntilDue(job.delivery_date) <= 2 && job.status !== 'COMPLETED' && (
                                    <Badge className="bg-red-100 text-red-800 border-red-300 animate-pulse">
                                      URGENT
                                    </Badge>
                                  )}
                                </div>
                                
                                <Button size="sm" variant="outline" className="gap-2">
                                  <Eye className="w-4 h-4" />
                                  View Details
                                </Button>
                              </div>

                              {/* Progress Bar */}
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                                  <span className="text-sm text-gray-600">{getProgressPercentage(job.status)}%</span>
                                </div>
                                <Progress 
                                  value={getProgressPercentage(job.status)} 
                                  className="h-2"
                                />
                              </div>

                              {/* Job Details */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                                <div>
                                  <span className="font-medium">Product:</span>
                                  <div>{job.product_item_code}</div>
                                  <div className="text-xs text-gray-500">{job.brand}</div>
                                </div>
                                <div>
                                  <span className="font-medium">Company:</span>
                                  <div>{job.company_name}</div>
                                  <div className="text-xs text-gray-500">Qty: {job.quantity.toLocaleString()}</div>
                                </div>
                                <div>
                                  <span className="font-medium">Designer:</span>
                                  <div className={job.designer_name ? 'text-blue-600' : 'text-red-600'}>
                                    {job.designer_name || 'Unassigned'}
                                  </div>
                                </div>
                                <div>
                                  <span className="font-medium">Due Date:</span>
                                  <div className={getDaysUntilDue(job.delivery_date) <= 2 ? 'text-red-600 font-medium' : ''}>
                                    {new Date(job.delivery_date).toLocaleDateString()}
                                  </div>
                                  <div className={`text-xs ${getDaysUntilDue(job.delivery_date) <= 2 ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                                    {getDaysUntilDue(job.delivery_date)} days left
                                  </div>
                                </div>
                              </div>

                              {/* Status Timeline */}
                              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                                {['CREATED', 'ASSIGNED_TO_PREPRESS', 'PREPRESS_IN_PROGRESS', 'PREPRESS_COMPLETED', 'COMPLETED'].map((status, idx) => (
                                  <React.Fragment key={status}>
                                    <div className={`flex items-center gap-2 whitespace-nowrap ${
                                      job.status === status ? 'text-blue-600 font-medium' : 
                                      getProgressPercentage(job.status) > getProgressPercentage(status) ? 'text-green-600' :
                                      'text-gray-400'
                                    }`}>
                                      <div className={`w-3 h-3 rounded-full ${
                                        job.status === status ? 'bg-blue-600 animate-pulse' : 
                                        getProgressPercentage(job.status) > getProgressPercentage(status) ? 'bg-green-600' :
                                        'bg-gray-300'
                                      }`}></div>
                                      <span className="text-xs">{formatStatus(status).replace('Prepress ', '')}</span>
                                    </div>
                                    {idx < 4 && (
                                      <ArrowRight className="w-3 h-3 text-gray-300 flex-shrink-0" />
                                    )}
                                  </React.Fragment>
                                ))}
                              </div>

                              {/* Notes */}
                              {job.prepress_notes && (
                                <div className="bg-gray-50 rounded-lg p-3">
                                  <span className="text-sm font-medium text-gray-700">Latest Notes:</span>
                                  <p className="text-sm text-gray-600 mt-1">{job.prepress_notes}</p>
                                </div>
                              )}

                              {/* Last Updated */}
                              <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
                                <span>Created by {job.creator_name}</span>
                                <span>Last updated: {new Date(job.updated_at).toLocaleString()}</span>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      
                      {filteredJobs.length === 0 && !isLoading && (
                        <div className="text-center py-12">
                          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
                          <p className="text-gray-600">No jobs match your current filters.</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Real-Time Notifications ({notifications.length})</span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
                  >
                    Mark All Read
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {notifications.map((notification) => (
                    <div 
                      key={notification.id} 
                      className={`p-4 rounded-lg border ${notification.read ? 'bg-gray-50' : 'bg-blue-50 border-blue-200'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${
                            notification.type === 'success' ? 'bg-green-500' :
                            notification.type === 'error' ? 'bg-red-500' :
                            notification.type === 'warning' ? 'bg-yellow-500' :
                            'bg-blue-500'
                          }`}></div>
                          <div>
                            <h4 className="font-medium text-gray-900">{notification.title}</h4>
                            <p className="text-sm text-gray-600">{notification.message}</p>
                            {notification.jobCardId && (
                              <p className="text-xs text-blue-600">Job: {notification.jobCardId}</p>
                            )}
                          </div>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(notification.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
                  
                  {notifications.length === 0 && (
                    <div className="text-center py-8">
                      <Bell className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">No notifications yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-indigo-600" />
                    Status Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(
                      jobs.reduce((acc, job) => {
                        acc[job.status] = (acc[job.status] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>)
                    ).map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge className={statusColors[status]}>
                            {formatStatus(status)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-indigo-600 h-2 rounded-full"
                              style={{ width: `${(count / jobs.length) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium w-8 text-right">{count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {Math.round((jobs.filter(j => j.status === 'COMPLETED').length / jobs.length) * 100) || 0}%
                      </div>
                      <div className="text-sm text-gray-600">Completion Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {Math.round((jobs.filter(j => getDaysUntilDue(j.delivery_date) >= 0).length / jobs.length) * 100) || 0}%
                      </div>
                      <div className="text-sm text-gray-600">On-Time Rate</div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <h4 className="font-medium text-gray-900 mb-3">Designer Workload</h4>
                    <div className="space-y-2">
                      {Object.entries(
                        jobs.filter(j => j.designer_name).reduce((acc, job) => {
                          const designer = job.designer_name!;
                          acc[designer] = (acc[designer] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>)
                      ).map(([designer, count]) => (
                        <div key={designer} className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">{designer}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-12 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${Math.min((count / 5) * 100, 100)}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium w-4 text-right">{count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </motion.div>
  );
};
