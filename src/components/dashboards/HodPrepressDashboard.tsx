import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PieChart, 
  Pie, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  AreaChart,
  Area,
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  Cell 
} from 'recharts';
import { 
  Package,
  Clock,
  User,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
  Calendar,
  Filter,
  Search,
  Bell,
  Settings,
  LogOut,
  FileText,
  Download,
  Activity,
  TrendingUp,
  TrendingDown,
  Zap,
  Target,
  Award,
  BarChart3,
  UserPlus,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  Palette,
  Shield,
  Layers,
  MonitorSpeaker
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { MainLayout } from '../layout/MainLayout';
import BackendStatusIndicator from '../BackendStatusIndicator';
import { prepressAPI, jobLifecycleAPI, authAPI } from '@/services/api';
import { useSocket } from '@/services/socketService.tsx';

interface HodPrepressDashboardProps {
  onNavigate?: (page: string) => void;
  onLogout?: () => void;
  currentPage?: string;
  isLoading?: boolean;
}

// Mock data - to be replaced with real API calls
const mockPrepressJobs = [
  {
    id: 'pj-001',
    job_card_id: 'JC-001234',
    product_code: 'BR-00-139-A',
    company_name: 'JCP Brand',
    status: 'ASSIGNED',
    priority: 'HIGH',
    due_date: '2024-01-15',
    created_at: '2024-01-10',
    assigned_designer: 'Emma Wilson',
    designer_id: '62081101-7c55-4a1e-bdfb-980e64999a74',
    progress: 25,
    customer_notes: 'Custom packaging design required'
  },
  {
    id: 'pj-002',
    job_card_id: 'JC-001235',
    product_code: 'BR-00-140-B',
    company_name: 'Nike',
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    due_date: '2024-01-18',
    created_at: '2024-01-11',
    assigned_designer: 'James Brown',
    designer_id: '57c715e5-b409-4a3d-98f1-a37ab8b36215',
    progress: 60
  },
  {
    id: 'pj-003',
    job_card_id: 'JC-001236',
    product_code: 'BR-00-141-C',
    company_name: 'Adidas',
    status: 'HOD_REVIEW',
    priority: 'LOW',
    due_date: '2024-01-20',
    created_at: '2024-01-12',
    assigned_designer: 'Lisa Garcia',
    designer_id: 'c77488cf-fec8-4b5e-804a-23edcc644bb7',
    progress: 95
  },
  {
    id: 'pj-004',
    job_card_id: 'JC-001237',
    product_code: 'BR-00-142-D',
    company_name: 'Puma',
    status: 'PENDING',
    priority: 'HIGH',
    due_date: '2024-01-22',
    created_at: '2024-01-13',
    assigned_designer: null,
    designer_id: null,
    progress: 0
  }
];

const mockDesigners = [
  { id: '62081101-7c55-4a1e-bdfb-980e64999a74', name: 'Emma Wilson', email: 'emma.wilson@horizonsourcing.com' },
  { id: '57c715e5-b409-4a3d-98f1-a37ab8b36215', name: 'James Brown', email: 'james.brown@horizonsourcing.com' },
  { id: 'c77488cf-fec8-4b5e-804a-23edcc644bb7', name: 'Lisa Garcia', email: 'lisa.garcia@horizonsourcing.com' }
];

const statusColors = {
  'PENDING': 'bg-gray-100 text-gray-800 border-gray-300',
  'ASSIGNED': 'bg-blue-100 text-blue-800 border-blue-300',
  'IN_PROGRESS': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'PAUSED': 'bg-orange-100 text-orange-800 border-orange-300',
  'HOD_REVIEW': 'bg-purple-100 text-purple-800 border-purple-300',
  'COMPLETED': 'bg-green-100 text-green-800 border-green-300',
  'REJECTED': 'bg-red-100 text-red-800 border-red-300'
};

const priorityColors = {
  'LOW': 'bg-green-100 text-green-800 border-green-300',
  'MEDIUM': 'bg-blue-100 text-blue-800 border-blue-300',
  'HIGH': 'bg-orange-100 text-orange-800 border-orange-300',
  'CRITICAL': 'bg-red-100 text-red-800 border-red-300'
};

// Mock productivity data
const weeklyProductivity = [
  { day: 'Mon', completed: 12, assigned: 15, inProgress: 8 },
  { day: 'Tue', completed: 15, assigned: 18, inProgress: 10 },
  { day: 'Wed', completed: 18, assigned: 20, inProgress: 12 },
  { day: 'Thu', completed: 14, assigned: 16, inProgress: 9 },
  { day: 'Fri', completed: 20, assigned: 22, inProgress: 14 },
  { day: 'Sat', completed: 8, assigned: 10, inProgress: 6 },
  { day: 'Sun', completed: 5, assigned: 8, inProgress: 4 }
];

export const HodPrepressDashboard: React.FC<HodPrepressDashboardProps> = ({ 
  onNavigate = () => {}, 
  onLogout = () => {},
  currentPage = 'prepressHOD',
  isLoading = false
}) => {
  const { isConnected, socket } = useSocket();
  const [prepressJobs, setPrepressJobs] = useState(mockPrepressJobs);
  const [filteredJobs, setFilteredJobs] = useState(mockPrepressJobs);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedDesigner, setSelectedDesigner] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [assigningJobId, setAssigningJobId] = useState<string | null>(null);

  // Statistics
  const stats = {
    total: prepressJobs.length,
    pending: prepressJobs.filter(job => job.status === 'PENDING').length,
    assigned: prepressJobs.filter(job => job.status === 'ASSIGNED').length,
    inProgress: prepressJobs.filter(job => job.status === 'IN_PROGRESS').length,
    inReview: prepressJobs.filter(job => job.status === 'HOD_REVIEW').length,
    completed: prepressJobs.filter(job => job.status === 'COMPLETED').length,
    overdue: prepressJobs.filter(job => {
      const dueDate = new Date(job.due_date);
      const today = new Date();
      return dueDate < today && job.status !== 'COMPLETED';
    }).length
  };

  // Chart data
  const statusData = Object.entries(statusColors).map(([status, _]) => ({
    name: status.replace('_', ' '),
    value: prepressJobs.filter(job => job.status === status).length,
    color: status === 'PENDING' ? '#6B7280' :
           status === 'ASSIGNED' ? '#3B82F6' :
           status === 'IN_PROGRESS' ? '#F59E0B' : 
           status === 'HOD_REVIEW' ? '#8B5CF6' :
           status === 'COMPLETED' ? '#10B981' : '#EF4444'
  })).filter(item => item.value > 0);

  // Designer workload data
  const designerWorkload = mockDesigners.map(designer => ({
    name: designer.name.split(' ')[0],
    assigned: prepressJobs.filter(job => job.designer_id === designer.id && job.status === 'ASSIGNED').length,
    inProgress: prepressJobs.filter(job => job.designer_id === designer.id && job.status === 'IN_PROGRESS').length,
    completed: prepressJobs.filter(job => job.designer_id === designer.id && job.status === 'COMPLETED').length
  }));

  // Filter jobs
  useEffect(() => {
    let filtered = prepressJobs;

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(job => job.status === selectedStatus);
    }

    if (selectedPriority !== 'all') {
      filtered = filtered.filter(job => job.priority === selectedPriority);
    }

    if (selectedDesigner !== 'all') {
      filtered = filtered.filter(job => job.designer_id === selectedDesigner);
    }

    if (searchTerm) {
      filtered = filtered.filter(job => 
        job.job_card_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.product_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (job.assigned_designer && job.assigned_designer.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredJobs(filtered);
  }, [prepressJobs, selectedStatus, selectedPriority, selectedDesigner, searchTerm]);

  // API functions (to be implemented with real API)
  const assignDesigner = async (jobId: string, designerId: string) => {
    try {
      setLoading(true);
      const designer = mockDesigners.find(d => d.id === designerId);
      // Real API call would go here
      setPrepressJobs(prev => 
        prev.map(job => 
          job.id === jobId ? { 
            ...job, 
            status: 'ASSIGNED',
            designer_id: designerId,
            assigned_designer: designer?.name || ''
          } : job
        )
      );
      toast.success(`Job assigned to ${designer?.name}`);
      setAssigningJobId(null);
    } catch (error) {
      toast.error('Failed to assign job');
    } finally {
      setLoading(false);
    }
  };

  const approveJob = async (jobId: string) => {
    try {
      setLoading(true);
      // Real API call would go here
      setPrepressJobs(prev => 
        prev.map(job => 
          job.id === jobId ? { ...job, status: 'COMPLETED' } : job
        )
      );
      toast.success('Job approved successfully');
    } catch (error) {
      toast.error('Failed to approve job');
    } finally {
      setLoading(false);
    }
  };

  const rejectJob = async (jobId: string) => {
    try {
      setLoading(true);
      // Real API call would go here
      setPrepressJobs(prev => 
        prev.map(job => 
          job.id === jobId ? { ...job, status: 'REJECTED' } : job
        )
      );
      toast.success('Job rejected and sent back to designer');
    } catch (error) {
      toast.error('Failed to reject job');
    } finally {
      setLoading(false);
    }
  };

  const reassignJob = async (jobId: string, newDesignerId: string) => {
    try {
      setLoading(true);
      const designer = mockDesigners.find(d => d.id === newDesignerId);
      // Real API call would go here
      setPrepressJobs(prev => 
        prev.map(job => 
          job.id === jobId ? { 
            ...job, 
            designer_id: newDesignerId,
            assigned_designer: designer?.name || '',
            status: 'ASSIGNED'
          } : job
        )
      );
      toast.success(`Job reassigned to ${designer?.name}`);
    } catch (error) {
      toast.error('Failed to reassign job');
    } finally {
      setLoading(false);
    }
  };

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <MainLayout
      currentPage={currentPage}
      onNavigate={onNavigate}
      onLogout={onLogout}
      isLoading={loading}
      pageTitle="Prepress HOD Dashboard"
      pageDescription="Manage design team, review jobs, and monitor progress"
    >
      <motion.div 
        className="p-6 bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 min-h-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* Header */}
        <motion.div 
          className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 mb-8 border border-white/20 shadow-xl"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  HOD Prepress Dashboard
                </h1>
                <p className="text-gray-600">Manage all prepress jobs and designer assignments</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
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
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-6 mb-8"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">Total Jobs</p>
                  <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
                </div>
                <Package className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                </div>
                <Clock className="w-8 h-8 text-gray-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">Assigned</p>
                  <p className="text-2xl font-bold text-blue-900">{stats.assigned}</p>
                </div>
                <UserPlus className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-600 text-sm font-medium">In Progress</p>
                  <p className="text-2xl font-bold text-yellow-900">{stats.inProgress}</p>
                </div>
                <Activity className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 text-sm font-medium">In Review</p>
                  <p className="text-2xl font-bold text-purple-900">{stats.inReview}</p>
                </div>
                <Eye className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">Completed</p>
                  <p className="text-2xl font-bold text-green-900">{stats.completed}</p>
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
                  <p className="text-2xl font-bold text-red-900">{stats.overdue}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Filters and Search */}
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="w-5 h-5 text-purple-600" />
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
                        <SelectItem value="PENDING">Pending Assignment</SelectItem>
                        <SelectItem value="ASSIGNED">Assigned</SelectItem>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem value="HOD_REVIEW">Ready for Review</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                        <SelectItem value="REJECTED">Rejected</SelectItem>
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

                    <Select value={selectedDesigner} onValueChange={setSelectedDesigner}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Designers" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Designers</SelectItem>
                        {mockDesigners.map(designer => (
                          <SelectItem key={designer.id} value={designer.id}>
                            {designer.name}
                          </SelectItem>
                        ))}
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
                  <CardTitle>All Prepress Jobs ({filteredJobs.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <AnimatePresence>
                      {filteredJobs.map((job, index) => (
                        <motion.div
                          key={job.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ delay: index * 0.05 }}
                          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-4 mb-2">
                                <h3 className="font-semibold text-lg text-gray-900">
                                  {job.job_card_id}
                                </h3>
                                <Badge className={statusColors[job.status]}>
                                  {job.status.replace('_', ' ')}
                                </Badge>
                                <Badge className={priorityColors[job.priority]}>
                                  {job.priority}
                                </Badge>
                                {getDaysUntilDue(job.due_date) <= 2 && (
                                  <Badge className="bg-red-100 text-red-800 border-red-300">
                                    URGENT
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                                <div>
                                  <span className="font-medium">Product:</span> {job.product_code}
                                </div>
                                <div>
                                  <span className="font-medium">Company:</span> {job.company_name}
                                </div>
                                <div>
                                  <span className="font-medium">Designer:</span> 
                                  {job.assigned_designer ? (
                                    <span className="ml-1 text-blue-600">{job.assigned_designer}</span>
                                  ) : (
                                    <span className="ml-1 text-red-600">Unassigned</span>
                                  )}
                                </div>
                                <div>
                                  <span className="font-medium">Due Date:</span> 
                                  <span className={getDaysUntilDue(job.due_date) <= 2 ? 'text-red-600 font-medium ml-1' : 'ml-1'}>
                                    {new Date(job.due_date).toLocaleDateString()} ({getDaysUntilDue(job.due_date)}d)
                                  </span>
                                </div>
                              </div>

                              {job.progress > 0 && (
                                <div className="mb-3">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm text-gray-600">Progress</span>
                                    <span className="text-sm font-medium">{job.progress}%</span>
                                  </div>
                                  <Progress value={job.progress} className="h-2" />
                                </div>
                              )}

                              {job.customer_notes && (
                                <div className="mb-2">
                                  <span className="text-sm font-medium text-gray-700">Notes:</span>
                                  <p className="text-sm text-gray-600">{job.customer_notes}</p>
                                </div>
                              )}
                            </div>

                            <div className="flex flex-col gap-2 ml-4 min-w-[120px]">
                              {job.status === 'PENDING' && (
                                <div className="space-y-2">
                                  {assigningJobId === job.id ? (
                                    <div className="space-y-1">
                                      <Select onValueChange={(value) => assignDesigner(job.id, value)}>
                                        <SelectTrigger className="text-xs">
                                          <SelectValue placeholder="Select Designer" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {mockDesigners.map(designer => (
                                            <SelectItem key={designer.id} value={designer.id}>
                                              {designer.name}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        onClick={() => setAssigningJobId(null)}
                                        className="w-full text-xs"
                                      >
                                        Cancel
                                      </Button>
                                    </div>
                                  ) : (
                                    <Button 
                                      size="sm"
                                      onClick={() => setAssigningJobId(job.id)}
                                      disabled={loading}
                                      className="gap-2 bg-blue-600 hover:bg-blue-700 w-full"
                                    >
                                      <UserPlus className="w-4 h-4" />
                                      Assign
                                    </Button>
                                  )}
                                </div>
                              )}
                              
                              {job.status === 'HOD_REVIEW' && (
                                <div className="space-y-2">
                                  <Button 
                                    size="sm"
                                    onClick={() => approveJob(job.id)}
                                    disabled={loading}
                                    className="gap-2 bg-green-600 hover:bg-green-700 w-full"
                                  >
                                    <ThumbsUp className="w-4 h-4" />
                                    Approve
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => rejectJob(job.id)}
                                    disabled={loading}
                                    className="gap-2 hover:bg-red-50 hover:border-red-200 hover:text-red-700 w-full"
                                  >
                                    <ThumbsDown className="w-4 h-4" />
                                    Reject
                                  </Button>
                                </div>
                              )}

                              {job.assigned_designer && job.status !== 'COMPLETED' && job.status !== 'HOD_REVIEW' && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => setAssigningJobId(job.id)}
                                  disabled={loading}
                                  className="gap-2 w-full"
                                >
                                  <RotateCcw className="w-4 h-4" />
                                  Reassign
                                </Button>
                              )}

                              <Button size="sm" variant="outline" className="gap-2 w-full">
                                <Eye className="w-4 h-4" />
                                View
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    
                    {filteredJobs.length === 0 && (
                      <div className="text-center py-12">
                        <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
                        <p className="text-gray-600">No prepress jobs match your current filters.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <motion.div
            className="lg:col-span-1 space-y-6"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {/* Status Distribution */}
            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                  Status Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Designer Workload */}
            <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Designer Workload
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={designerWorkload}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="assigned" fill="#3B82F6" name="Assigned" />
                      <Bar dataKey="inProgress" fill="#F59E0B" name="In Progress" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Weekly Productivity */}
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  This Week
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weeklyProductivity.slice(-7)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <Tooltip />
                      <Area 
                        type="monotone" 
                        dataKey="completed" 
                        stroke="#10B981" 
                        fill="#10B981" 
                        fillOpacity={0.6}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Avg. Daily Completion:</span>
                    <span className="font-semibold text-green-700">13.1</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Team Efficiency:</span>
                    <span className="font-semibold text-blue-700">89%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-600" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full gap-2 hover:bg-yellow-50">
                  <FileText className="w-4 h-4" />
                  Export Report
                </Button>
                <Button variant="outline" className="w-full gap-2 hover:bg-blue-50">
                  <Settings className="w-4 h-4" />
                  Manage Designers
                </Button>
                <Button variant="outline" className="w-full gap-2 hover:bg-purple-50">
                  <Activity className="w-4 h-4" />
                  View Analytics
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </MainLayout>
  );
};