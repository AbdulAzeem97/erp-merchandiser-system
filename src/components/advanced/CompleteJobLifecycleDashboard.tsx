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
  LogOut,
  Settings,
  Edit,
  Plus,
  Minus,
  ChevronDown,
  ChevronUp,
  FileText,
  Wrench,
  Truck,
  Shield,
  Box
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useSocket } from '@/services/socketService.tsx';
import { toast } from 'sonner';
import { getApiUrl } from '@/utils/apiConfig';
import BackendStatusIndicator from '../BackendStatusIndicator';

interface JobLifecycleProps {
  onLogout?: () => void;
}

interface JobLifecycleData {
  id: string;
  job_card_id: string;
  status: string;
  current_stage: string;
  product_type: string;
  priority: string;
  progress_percentage: number;
  prepress_status?: string;
  prepress_notes?: string;
  inventory_status?: string;
  inventory_notes?: string;
  production_status?: string;
  production_notes?: string;
  qa_status?: string;
  qa_notes?: string;
  dispatch_status?: string;
  dispatch_notes?: string;
  current_department_id?: string;
  current_process_id?: string;
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
  'ASSIGNED_TO_INVENTORY': 'bg-purple-100 text-purple-800 border-purple-300',
  'INVENTORY_IN_PROGRESS': 'bg-orange-100 text-orange-800 border-orange-300',
  'INVENTORY_COMPLETED': 'bg-emerald-100 text-emerald-800 border-emerald-300',
  'ASSIGNED_TO_PRODUCTION': 'bg-cyan-100 text-cyan-800 border-cyan-300',
  'PRODUCTION_IN_PROGRESS': 'bg-teal-100 text-teal-800 border-teal-300',
  'PRODUCTION_COMPLETED': 'bg-lime-100 text-lime-800 border-lime-300',
  'ASSIGNED_TO_QA': 'bg-pink-100 text-pink-800 border-pink-300',
  'QA_IN_PROGRESS': 'bg-rose-100 text-rose-800 border-rose-300',
  'QA_COMPLETED': 'bg-violet-100 text-violet-800 border-violet-300',
  'ASSIGNED_TO_DISPATCH': 'bg-amber-100 text-amber-800 border-amber-300',
  'DISPATCH_IN_PROGRESS': 'bg-orange-100 text-orange-800 border-orange-300',
  'DISPATCH_COMPLETED': 'bg-emerald-100 text-emerald-800 border-emerald-300',
  'COMPLETED': 'bg-green-100 text-green-800 border-green-300',
  'ON_HOLD': 'bg-red-100 text-red-800 border-red-300',
  'CANCELLED': 'bg-gray-100 text-gray-800 border-gray-300'
};

const departmentStatusColors: Record<string, string> = {
  'PENDING': 'bg-gray-100 text-gray-800 border-gray-300',
  'IN_PROGRESS': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'COMPLETED': 'bg-green-100 text-green-800 border-green-300',
  'DELAYED': 'bg-red-100 text-red-800 border-red-300',
  'ON_HOLD': 'bg-orange-100 text-orange-800 border-orange-300',
  'REJECTED': 'bg-red-100 text-red-800 border-red-300',
  'PASSED': 'bg-green-100 text-green-800 border-green-300',
  'FAILED': 'bg-red-100 text-red-800 border-red-300',
  'REWORK_REQUIRED': 'bg-orange-100 text-orange-800 border-orange-300'
};

const priorityColors: Record<string, string> = {
  'LOW': 'bg-green-100 text-green-800 border-green-300',
  'MEDIUM': 'bg-blue-100 text-blue-800 border-blue-300',
  'HIGH': 'bg-orange-100 text-orange-800 border-orange-300',
  'CRITICAL': 'bg-red-100 text-red-800 border-red-300'
};

const workflowStages = [
  { key: 'CREATED', name: 'Created', icon: FileText, color: 'blue' },
  { key: 'ASSIGNED_TO_PREPRESS', name: 'Prepress', icon: Settings, color: 'indigo' },
  { key: 'PREPRESS_COMPLETED', name: 'Prepress Done', icon: CheckCircle, color: 'green' },
  { key: 'ASSIGNED_TO_INVENTORY', name: 'Inventory', icon: Package, color: 'purple' },
  { key: 'INVENTORY_COMPLETED', name: 'Inventory Done', icon: CheckCircle, color: 'emerald' },
  { key: 'ASSIGNED_TO_PRODUCTION', name: 'Production', icon: Factory, color: 'cyan' },
  { key: 'PRODUCTION_COMPLETED', name: 'Production Done', icon: CheckCircle, color: 'lime' },
  { key: 'ASSIGNED_TO_QA', name: 'QA', icon: Shield, color: 'pink' },
  { key: 'QA_COMPLETED', name: 'QA Done', icon: CheckCircle, color: 'violet' },
  { key: 'ASSIGNED_TO_DISPATCH', name: 'Dispatch', icon: Truck, color: 'amber' },
  { key: 'COMPLETED', name: 'Completed', icon: CheckCircle, color: 'green' }
];

export const CompleteJobLifecycleDashboard: React.FC<JobLifecycleProps> = ({ onLogout }) => {
  const { socket, isConnected } = useSocket();
  const [jobs, setJobs] = useState<JobLifecycleData[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<JobLifecycleData[]>([]);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [stats, setStats] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedJobs, setExpandedJobs] = useState<Set<string>>(new Set());

  // Load initial data
  const loadJobs = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Loading complete job lifecycle data...');
      
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/complete-job-lifecycle/all`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

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
      const response = await fetch(`${apiUrl}/api/complete-job-lifecycle/stats/dashboard`, {
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
      socket.emit('join_job_updates');

      // Listen for comprehensive job lifecycle updates
      socket.on('job_lifecycle_update', (update) => {
        console.log('🔄 Received job lifecycle update:', update);
        
        setJobs(prevJobs => {
          const updatedJobs = prevJobs.map(job => 
            job.job_card_id === update.jobCardId 
              ? { ...job, ...update.data, updated_at: update.timestamp }
              : job
          );
          
          if (!prevJobs.find(job => job.job_card_id === update.jobCardId)) {
            updatedJobs.unshift({
              id: update.data.lifecycleId || Date.now().toString(),
              job_card_id: update.jobCardId,
              status: update.data.newStatus || update.data.status,
              current_stage: update.data.currentStage,
              priority: update.data.priority || 'MEDIUM',
              progress_percentage: update.data.progress || 0,
              created_at: update.timestamp,
              updated_at: update.timestamp,
              ...update.data
            });
          }
          
          return updatedJobs;
        });

        // Add notification
        const notification: NotificationData = {
          id: Date.now().toString(),
          type: 'info',
          title: 'Job Updated',
          message: `Job ${update.jobCardId} has been updated`,
          jobCardId: update.jobCardId,
          timestamp: update.timestamp || new Date().toISOString(),
          read: false
        };
        
        setNotifications(prev => [notification, ...prev].slice(0, 50));
        
        toast.success(notification.message, {
          description: `Job ${update.jobCardId}`,
        });
      });

      return () => {
        socket.off('job_lifecycle_update');
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

    if (selectedDepartment !== 'all') {
      filtered = filtered.filter(job => job.current_department_id === selectedDepartment);
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
  }, [jobs, selectedStatus, selectedPriority, selectedDepartment, searchTerm]);

  const getProgressPercentage = (status: string) => {
    const progressMap: Record<string, number> = {
      'CREATED': 5,
      'ASSIGNED_TO_PREPRESS': 15,
      'PREPRESS_IN_PROGRESS': 25,
      'PREPRESS_COMPLETED': 35,
      'ASSIGNED_TO_INVENTORY': 45,
      'INVENTORY_IN_PROGRESS': 55,
      'INVENTORY_COMPLETED': 65,
      'ASSIGNED_TO_PRODUCTION': 75,
      'PRODUCTION_IN_PROGRESS': 85,
      'PRODUCTION_COMPLETED': 90,
      'ASSIGNED_TO_QA': 92,
      'QA_IN_PROGRESS': 94,
      'QA_COMPLETED': 96,
      'ASSIGNED_TO_DISPATCH': 98,
      'DISPATCH_IN_PROGRESS': 99,
      'DISPATCH_COMPLETED': 100,
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

  const toggleJobExpansion = (jobId: string) => {
    setExpandedJobs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(jobId)) {
        newSet.delete(jobId);
      } else {
        newSet.add(jobId);
      }
      return newSet;
    });
  };

  const getDepartmentStatus = (job: JobLifecycleData) => {
    if (job.prepress_status) return { status: job.prepress_status, department: 'Prepress' };
    if (job.inventory_status) return { status: job.inventory_status, department: 'Inventory' };
    if (job.production_status) return { status: job.production_status, department: 'Production' };
    if (job.qa_status) return { status: job.qa_status, department: 'QA' };
    if (job.dispatch_status) return { status: job.dispatch_status, department: 'Dispatch' };
    return { status: 'PENDING', department: 'Unknown' };
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
                  Complete Job Lifecycle Dashboard
                </h1>
                <div className="flex items-center gap-4 mt-2">
                  <p className="text-gray-600">Monitor complete workflow from Prepress to Dispatch</p>
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
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">Total Jobs</p>
                  <p className="text-2xl font-bold text-blue-900">{stats.total_jobs || 0}</p>
                </div>
                <Package className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-600 text-sm font-medium">Prepress</p>
                  <p className="text-2xl font-bold text-yellow-900">{stats.prepress_jobs || 0}</p>
                </div>
                <Settings className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 text-sm font-medium">Inventory</p>
                  <p className="text-2xl font-bold text-purple-900">{stats.inventory_jobs || 0}</p>
                </div>
                <Package className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-cyan-50 to-teal-50 border-cyan-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cyan-600 text-sm font-medium">Production</p>
                  <p className="text-2xl font-bold text-cyan-900">{stats.production_jobs || 0}</p>
                </div>
                <Factory className="w-8 h-8 text-cyan-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-pink-50 to-rose-50 border-pink-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-pink-600 text-sm font-medium">QA</p>
                  <p className="text-2xl font-bold text-pink-900">{stats.qa_jobs || 0}</p>
                </div>
                <Shield className="w-8 h-8 text-pink-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">Completed</p>
                  <p className="text-2xl font-bold text-green-900">{stats.completed_jobs || 0}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="workflow">Workflow</TabsTrigger>
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
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                        <SelectItem value="ASSIGNED_TO_PREPRESS">Prepress</SelectItem>
                        <SelectItem value="ASSIGNED_TO_INVENTORY">Inventory</SelectItem>
                        <SelectItem value="ASSIGNED_TO_PRODUCTION">Production</SelectItem>
                        <SelectItem value="ASSIGNED_TO_QA">QA</SelectItem>
                        <SelectItem value="ASSIGNED_TO_DISPATCH">Dispatch</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Priority</SelectItem>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="CRITICAL">Critical</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Departments" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Departments</SelectItem>
                        <SelectItem value="prepress">Prepress</SelectItem>
                        <SelectItem value="inventory">Inventory</SelectItem>
                        <SelectItem value="production">Production</SelectItem>
                        <SelectItem value="qa">QA</SelectItem>
                        <SelectItem value="dispatch">Dispatch</SelectItem>
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
                  <CardTitle>Complete Job Workflow ({filteredJobs.length})</CardTitle>
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
                        {filteredJobs.map((job, index) => {
                          const isExpanded = expandedJobs.has(job.id);
                          const departmentStatus = getDepartmentStatus(job);
                          
                          return (
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
                                    <Badge className={departmentStatusColors[departmentStatus.status]}>
                                      {departmentStatus.department}: {formatStatus(departmentStatus.status)}
                                    </Badge>
                                    <Badge className={priorityColors[job.job_priority]}>
                                      {job.job_priority}
                                    </Badge>
                                    {getDaysUntilDue(job.delivery_date) <= 2 && job.status !== 'COMPLETED' && (
                                      <Badge className="bg-red-100 text-red-800 border-red-300 animate-pulse">
                                        URGENT
                                      </Badge>
                                    )}
                                  </div>
                                  
                                  <div className="flex items-center gap-2">
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      className="gap-2"
                                      onClick={() => toggleJobExpansion(job.id)}
                                    >
                                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                      {isExpanded ? 'Collapse' : 'Expand'}
                                    </Button>
                                    <Button size="sm" variant="outline" className="gap-2">
                                      <Eye className="w-4 h-4" />
                                      View Details
                                    </Button>
                                  </div>
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

                                {/* Workflow Timeline */}
                                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                                  {workflowStages.map((stage, idx) => {
                                    const isActive = job.status === stage.key;
                                    const isCompleted = getProgressPercentage(job.status) > getProgressPercentage(stage.key);
                                    const Icon = stage.icon;
                                    
                                    return (
                                      <React.Fragment key={stage.key}>
                                        <div className={`flex items-center gap-2 whitespace-nowrap ${
                                          isActive ? 'text-blue-600 font-medium' : 
                                          isCompleted ? 'text-green-600' :
                                          'text-gray-400'
                                        }`}>
                                          <div className={`w-3 h-3 rounded-full ${
                                            isActive ? 'bg-blue-600 animate-pulse' : 
                                            isCompleted ? 'bg-green-600' :
                                            'bg-gray-300'
                                          }`}></div>
                                          <Icon className="w-4 h-4" />
                                          <span className="text-xs">{stage.name}</span>
                                        </div>
                                        {idx < workflowStages.length - 1 && (
                                          <ArrowRight className="w-3 h-3 text-gray-300 flex-shrink-0" />
                                        )}
                                      </React.Fragment>
                                    );
                                  })}
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

                                {/* Expanded Details */}
                                <Collapsible open={isExpanded} onOpenChange={() => toggleJobExpansion(job.id)}>
                                  <CollapsibleContent className="space-y-4">
                                    <div className="border-t pt-4">
                                      <h4 className="font-medium text-gray-900 mb-3">Department Status Details</h4>
                                      
                                      {/* Prepress Status */}
                                      {job.prepress_status && (
                                        <div className="bg-yellow-50 rounded-lg p-3 mb-2">
                                          <div className="flex items-center justify-between">
                                            <span className="font-medium text-yellow-800">Prepress</span>
                                            <Badge className={departmentStatusColors[job.prepress_status]}>
                                              {formatStatus(job.prepress_status)}
                                            </Badge>
                                          </div>
                                          {job.prepress_notes && (
                                            <p className="text-sm text-yellow-700 mt-1">{job.prepress_notes}</p>
                                          )}
                                        </div>
                                      )}

                                      {/* Inventory Status */}
                                      {job.inventory_status && (
                                        <div className="bg-purple-50 rounded-lg p-3 mb-2">
                                          <div className="flex items-center justify-between">
                                            <span className="font-medium text-purple-800">Inventory</span>
                                            <Badge className={departmentStatusColors[job.inventory_status]}>
                                              {formatStatus(job.inventory_status)}
                                            </Badge>
                                          </div>
                                          {job.inventory_notes && (
                                            <p className="text-sm text-purple-700 mt-1">{job.inventory_notes}</p>
                                          )}
                                        </div>
                                      )}

                                      {/* Production Status */}
                                      {job.production_status && (
                                        <div className="bg-cyan-50 rounded-lg p-3 mb-2">
                                          <div className="flex items-center justify-between">
                                            <span className="font-medium text-cyan-800">Production</span>
                                            <Badge className={departmentStatusColors[job.production_status]}>
                                              {formatStatus(job.production_status)}
                                            </Badge>
                                          </div>
                                          {job.production_notes && (
                                            <p className="text-sm text-cyan-700 mt-1">{job.production_notes}</p>
                                          )}
                                        </div>
                                      )}

                                      {/* QA Status */}
                                      {job.qa_status && (
                                        <div className="bg-pink-50 rounded-lg p-3 mb-2">
                                          <div className="flex items-center justify-between">
                                            <span className="font-medium text-pink-800">QA</span>
                                            <Badge className={departmentStatusColors[job.qa_status]}>
                                              {formatStatus(job.qa_status)}
                                            </Badge>
                                          </div>
                                          {job.qa_notes && (
                                            <p className="text-sm text-pink-700 mt-1">{job.qa_notes}</p>
                                          )}
                                        </div>
                                      )}

                                      {/* Dispatch Status */}
                                      {job.dispatch_status && (
                                        <div className="bg-amber-50 rounded-lg p-3 mb-2">
                                          <div className="flex items-center justify-between">
                                            <span className="font-medium text-amber-800">Dispatch</span>
                                            <Badge className={departmentStatusColors[job.dispatch_status]}>
                                              {formatStatus(job.dispatch_status)}
                                            </Badge>
                                          </div>
                                          {job.dispatch_notes && (
                                            <p className="text-sm text-amber-700 mt-1">{job.dispatch_notes}</p>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </CollapsibleContent>
                                </Collapsible>

                                {/* Last Updated */}
                                <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
                                  <span>Created by {job.creator_name}</span>
                                  <span>Last updated: {new Date(job.updated_at).toLocaleString()}</span>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
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

          <TabsContent value="workflow" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-lg">
              <CardHeader>
                <CardTitle>Workflow Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Factory className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Workflow Management</h3>
                  <p className="text-gray-600">Advanced workflow management features coming soon.</p>
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
                    <h4 className="font-medium text-gray-900 mb-3">Department Workload</h4>
                    <div className="space-y-2">
                      {['Prepress', 'Inventory', 'Production', 'QA', 'Dispatch'].map((dept) => {
                        const count = jobs.filter(j => j.current_stage?.includes(dept.toLowerCase())).length;
                        return (
                          <div key={dept} className="flex items-center justify-between">
                            <span className="text-sm text-gray-700">{dept}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-12 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full"
                                  style={{ width: `${Math.min((count / 10) * 100, 100)}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium w-4 text-right">{count}</span>
                            </div>
                          </div>
                        );
                      })}
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

export default CompleteJobLifecycleDashboard;
