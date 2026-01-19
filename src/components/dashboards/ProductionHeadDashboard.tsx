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
  Box,
  Crown,
  Award,
  Gauge,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  XCircle2,
  Clock3,
  UserCheck,
  UserX,
  Calendar as CalendarIcon,
  DollarSign,
  Percent,
  Zap as ZapIcon
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

interface ProductionHeadDashboardProps {
  onLogout?: () => void;
}

interface JobData {
  id: string;
  job_card_id: string;
  status: string;
  current_stage: string;
  product_type: string;
  priority: string;
  progress_percentage: number;
  prepress_status?: string;
  inventory_status?: string;
  production_status?: string;
  qa_status?: string;
  dispatch_status?: string;
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
  created_at: string;
  updated_at: string;
}

interface DepartmentStats {
  name: string;
  total_jobs: number;
  completed_jobs: number;
  in_progress_jobs: number;
  pending_jobs: number;
  delayed_jobs: number;
  efficiency: number;
  quality_score: number;
}

interface ProductionMetrics {
  total_jobs: number;
  completed_jobs: number;
  in_progress_jobs: number;
  pending_jobs: number;
  delayed_jobs: number;
  on_hold_jobs: number;
  cancelled_jobs: number;
  completion_rate: number;
  on_time_rate: number;
  efficiency_rate: number;
  quality_score: number;
  revenue_generated: number;
  cost_savings: number;
  profit_margin: number;
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

const priorityColors: Record<string, string> = {
  'LOW': 'bg-green-100 text-green-800 border-green-300',
  'MEDIUM': 'bg-blue-100 text-blue-800 border-blue-300',
  'HIGH': 'bg-orange-100 text-orange-800 border-orange-300',
  'CRITICAL': 'bg-red-100 text-red-800 border-red-300'
};

export const ProductionHeadDashboard: React.FC<ProductionHeadDashboardProps> = ({ onLogout }) => {
  const { socket, isConnected } = useSocket();
  const [jobs, setJobs] = useState<JobData[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<JobData[]>([]);
  const [metrics, setMetrics] = useState<ProductionMetrics>({
    total_jobs: 0,
    completed_jobs: 0,
    in_progress_jobs: 0,
    pending_jobs: 0,
    delayed_jobs: 0,
    on_hold_jobs: 0,
    cancelled_jobs: 0,
    completion_rate: 0,
    on_time_rate: 0,
    efficiency_rate: 0,
    quality_score: 0,
    revenue_generated: 0,
    cost_savings: 0,
    profit_margin: 0
  });
  const [departmentStats, setDepartmentStats] = useState<DepartmentStats[]>([]);
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
      console.log('🔄 Loading production head dashboard data...');
      
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
        calculateMetrics(data.data || []);
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

  const calculateMetrics = (jobsData: JobData[]) => {
    const total = jobsData.length;
    const completed = jobsData.filter(j => j.status === 'COMPLETED').length;
    const inProgress = jobsData.filter(j => j.status.includes('IN_PROGRESS')).length;
    const pending = jobsData.filter(j => j.status.includes('ASSIGNED_TO') || j.status === 'CREATED').length;
    const delayed = jobsData.filter(j => {
      const due = new Date(j.delivery_date);
      const today = new Date();
      return due < today && j.status !== 'COMPLETED';
    }).length;
    const onHold = jobsData.filter(j => j.status === 'ON_HOLD').length;
    const cancelled = jobsData.filter(j => j.status === 'CANCELLED').length;

    const onTime = jobsData.filter(j => {
      const due = new Date(j.delivery_date);
      const today = new Date();
      return due >= today || j.status === 'COMPLETED';
    }).length;

    const newMetrics: ProductionMetrics = {
      total_jobs: total,
      completed_jobs: completed,
      in_progress_jobs: inProgress,
      pending_jobs: pending,
      delayed_jobs: delayed,
      on_hold_jobs: onHold,
      cancelled_jobs: cancelled,
      completion_rate: total > 0 ? Math.round((completed / total) * 100) : 0,
      on_time_rate: total > 0 ? Math.round((onTime / total) * 100) : 0,
      efficiency_rate: total > 0 ? Math.round(((completed + inProgress) / total) * 100) : 0,
      quality_score: 85, // Mock data
      revenue_generated: 125000, // Mock data
      cost_savings: 15000, // Mock data
      profit_margin: 12.5 // Mock data
    };

    setMetrics(newMetrics);

    // Calculate department stats
    const departments = ['Prepress', 'Inventory', 'Production', 'QA', 'Dispatch'];
    const deptStats: DepartmentStats[] = departments.map(dept => {
      const deptJobs = jobsData.filter(j => j.current_stage?.toLowerCase().includes(dept.toLowerCase()));
      const completed = deptJobs.filter(j => j.status.includes('COMPLETED')).length;
      const inProgress = deptJobs.filter(j => j.status.includes('IN_PROGRESS')).length;
      const pending = deptJobs.filter(j => j.status.includes('ASSIGNED_TO')).length;
      const delayed = deptJobs.filter(j => {
        const due = new Date(j.delivery_date);
        const today = new Date();
        return due < today && !j.status.includes('COMPLETED');
      }).length;

      return {
        name: dept,
        total_jobs: deptJobs.length,
        completed_jobs: completed,
        in_progress_jobs: inProgress,
        pending_jobs: pending,
        delayed_jobs: delayed,
        efficiency: deptJobs.length > 0 ? Math.round((completed / deptJobs.length) * 100) : 0,
        quality_score: 85 + Math.random() * 10 // Mock data
      };
    });

    setDepartmentStats(deptStats);
  };

  // Setup real-time updates
  useEffect(() => {
    if (socket && isConnected) {
      socket.emit('join_job_updates');

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

        toast.success(`Job ${update.jobCardId} updated`, {
          description: update.data.message || 'Status changed',
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
        job.company_name.toLowerCase().includes(searchTerm.toLowerCase())
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
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Production Head Dashboard
                </h1>
                <div className="flex items-center gap-4 mt-2">
                  <p className="text-gray-600">Complete production oversight with admin privileges</p>
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
              
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Settings className="w-4 h-4" />
                Settings
              </Button>

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

        {/* Key Metrics Cards */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">Total Jobs</p>
                  <p className="text-3xl font-bold text-blue-900">{metrics.total_jobs}</p>
                  <p className="text-xs text-blue-600 mt-1">All active jobs</p>
                </div>
                <Package className="w-10 h-10 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">Completion Rate</p>
                  <p className="text-3xl font-bold text-green-900">{metrics.completion_rate}%</p>
                  <p className="text-xs text-green-600 mt-1">Jobs completed</p>
                </div>
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-600 text-sm font-medium">On-Time Rate</p>
                  <p className="text-3xl font-bold text-orange-900">{metrics.on_time_rate}%</p>
                  <p className="text-xs text-orange-600 mt-1">Delivered on time</p>
                </div>
                <Clock3 className="w-10 h-10 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 text-sm font-medium">Efficiency</p>
                  <p className="text-3xl font-bold text-purple-900">{metrics.efficiency_rate}%</p>
                  <p className="text-xs text-purple-600 mt-1">Overall efficiency</p>
                </div>
                <Gauge className="w-10 h-10 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Financial Metrics */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">Revenue Generated</p>
                  <p className="text-2xl font-bold text-green-900">${metrics.revenue_generated.toLocaleString()}</p>
                  <p className="text-xs text-green-600 mt-1">This month</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">Cost Savings</p>
                  <p className="text-2xl font-bold text-blue-900">${metrics.cost_savings.toLocaleString()}</p>
                  <p className="text-xs text-blue-600 mt-1">Efficiency gains</p>
                </div>
                <TrendingDown className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 text-sm font-medium">Profit Margin</p>
                  <p className="text-2xl font-bold text-purple-900">{metrics.profit_margin}%</p>
                  <p className="text-xs text-purple-600 mt-1">Net profit margin</p>
                </div>
                <Percent className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="departments">Departments</TabsTrigger>
            <TabsTrigger value="jobs">Jobs</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Department Performance */}
            <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-indigo-600" />
                  Department Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {departmentStats.map((dept, index) => (
                    <motion.div
                      key={dept.name}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-900">{dept.name}</h3>
                        <Badge className={dept.efficiency > 80 ? 'bg-green-100 text-green-800' : dept.efficiency > 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}>
                          {dept.efficiency}%
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Total Jobs</span>
                          <span className="font-medium">{dept.total_jobs}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Completed</span>
                          <span className="font-medium text-green-600">{dept.completed_jobs}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">In Progress</span>
                          <span className="font-medium text-blue-600">{dept.in_progress_jobs}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Delayed</span>
                          <span className="font-medium text-red-600">{dept.delayed_jobs}</span>
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Efficiency</span>
                          <span>{dept.efficiency}%</span>
                        </div>
                        <Progress value={dept.efficiency} className="h-2" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Jobs */}
            <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-indigo-600" />
                  Recent Job Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredJobs.slice(0, 5).map((job, index) => (
                    <motion.div
                      key={job.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <div>
                          <p className="font-medium text-gray-900">{job.job_card_id_display}</p>
                          <p className="text-sm text-gray-600">{job.company_name} • {job.product_item_code}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={statusColors[job.status]}>
                          {formatStatus(job.status)}
                        </Badge>
                        <Badge className={priorityColors[job.job_priority]}>
                          {job.job_priority}
                        </Badge>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="departments" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-lg">
              <CardHeader>
                <CardTitle>Department Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Factory className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Department Management</h3>
                  <p className="text-gray-600">Advanced department management features coming soon.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="jobs" className="space-y-6">
            {/* Filters */}
            <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-indigo-600" />
                  Job Filters
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

                  <Button variant="outline" className="gap-2">
                    <Calendar className="w-4 h-4" />
                    Due Date
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Jobs List */}
            <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-lg">
              <CardHeader>
                <CardTitle>All Jobs ({filteredJobs.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading jobs...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredJobs.map((job, index) => (
                      <motion.div
                        key={job.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-300"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <h3 className="font-semibold text-lg text-gray-900">
                              {job.job_card_id_display}
                            </h3>
                            <Badge className={statusColors[job.status]}>
                              {formatStatus(job.status)}
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
                            <Button size="sm" variant="outline" className="gap-2">
                              <Eye className="w-4 h-4" />
                              View
                            </Button>
                            <Button size="sm" variant="outline" className="gap-2">
                              <Edit className="w-4 h-4" />
                              Edit
                            </Button>
                          </div>
                        </div>

                        <div className="mt-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Progress</span>
                            <span className="text-sm text-gray-600">{getProgressPercentage(job.status)}%</span>
                          </div>
                          <Progress value={getProgressPercentage(job.status)} className="h-2" />
                        </div>

                        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Product:</span>
                            <div>{job.product_item_code}</div>
                          </div>
                          <div>
                            <span className="font-medium">Company:</span>
                            <div>{job.company_name}</div>
                          </div>
                          <div>
                            <span className="font-medium">Quantity:</span>
                            <div>{job.quantity.toLocaleString()}</div>
                          </div>
                          <div>
                            <span className="font-medium">Due Date:</span>
                            <div className={getDaysUntilDue(job.delivery_date) <= 2 ? 'text-red-600 font-medium' : ''}>
                              {new Date(job.delivery_date).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-indigo-600" />
                    Performance Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Performance Trends</h3>
                    <p className="text-gray-600">Advanced analytics coming soon.</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-green-600" />
                    Quality Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Overall Quality Score</span>
                      <span className="text-2xl font-bold text-green-600">{metrics.quality_score}%</span>
                    </div>
                    <Progress value={metrics.quality_score} className="h-3" />
                    
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600">{metrics.completion_rate}%</div>
                        <div className="text-xs text-gray-600">Completion Rate</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-orange-600">{metrics.on_time_rate}%</div>
                        <div className="text-xs text-gray-600">On-Time Rate</div>
                      </div>
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

export default ProductionHeadDashboard;
