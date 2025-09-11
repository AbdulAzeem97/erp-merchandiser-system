import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Factory,
  Package,
  FileText,
  Scissors,
  Printer,
  Palette,
  Layers,
  CheckCircle,
  Clock,
  AlertCircle,
  Play,
  Pause,
  RotateCcw,
  Eye,
  Download,
  Share,
  Calendar,
  User,
  Building,
  Target,
  TrendingUp,
  BarChart3,
  Settings,
  ArrowRight,
  ArrowDown,
  ChevronDown,
  ChevronUp,
  Info,
  Zap,
  Star,
  Flag,
  Search,
  Filter,
  SortAsc,
  Grid,
  List,
  Plus,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import JobLifecycleTracker from './JobLifecycleTracker';

interface JobSummary {
  id: string;
  jobCardId: string;
  productCode: string;
  customer: string;
  quantity: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'completed' | 'on_hold';
  progress: number;
  startDate: string;
  dueDate: string;
  createdBy: string;
  currentStage: string;
  currentDepartment: string;
  stages: {
    completed: number;
    inProgress: number;
    pending: number;
    blocked: number;
  };
  timeline: {
    punched: string;
    prepress: string;
    die: string;
    plate: string;
    production: string;
    cutting: string;
    printing: string;
    varnishing: string;
    embossing: string;
    finishing: string;
    packaging: string;
    delivery: string;
  };
}

const JobDashboard: React.FC = () => {
  const [selectedJob, setSelectedJob] = useState<JobSummary | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data - replace with actual API data
  const mockJobs: JobSummary[] = [
    {
      id: 'job-001',
      jobCardId: 'JC-2024-001',
      productCode: 'BR-00-139-A',
      customer: 'JCP Brand Solutions',
      quantity: 10000,
      priority: 'high',
      status: 'in_progress',
      progress: 65,
      startDate: '2024-01-15',
      dueDate: '2024-01-25',
      createdBy: 'Abdullah Khan',
      currentStage: 'Production',
      currentDepartment: 'Production',
      stages: { completed: 4, inProgress: 1, pending: 7, blocked: 0 },
      timeline: {
        punched: '2024-01-15',
        prepress: '2024-01-17',
        die: '2024-01-19',
        plate: '2024-01-20',
        production: '2024-01-21',
        cutting: '2024-01-22',
        printing: '2024-01-24',
        varnishing: '2024-01-25',
        embossing: '2024-01-26',
        finishing: '2024-01-27',
        packaging: '2024-01-28',
        delivery: '2024-01-29'
      }
    },
    {
      id: 'job-002',
      jobCardId: 'JC-2024-002',
      productCode: 'BR-00-140-B',
      customer: 'TechCorp Industries',
      quantity: 5000,
      priority: 'critical',
      status: 'in_progress',
      progress: 45,
      startDate: '2024-01-16',
      dueDate: '2024-01-22',
      createdBy: 'Jaseem Ahmed',
      currentStage: 'Die Making',
      currentDepartment: 'Die Department',
      stages: { completed: 2, inProgress: 1, pending: 9, blocked: 0 },
      timeline: {
        punched: '2024-01-16',
        prepress: '2024-01-18',
        die: '2024-01-20',
        plate: '2024-01-21',
        production: '2024-01-22',
        cutting: '2024-01-23',
        printing: '2024-01-24',
        varnishing: '2024-01-25',
        embossing: '2024-01-26',
        finishing: '2024-01-27',
        packaging: '2024-01-28',
        delivery: '2024-01-29'
      }
    },
    {
      id: 'job-003',
      jobCardId: 'JC-2024-003',
      productCode: 'BR-00-141-C',
      customer: 'Global Print Co.',
      quantity: 15000,
      priority: 'medium',
      status: 'completed',
      progress: 100,
      startDate: '2024-01-10',
      dueDate: '2024-01-20',
      createdBy: 'Ali Hassan',
      currentStage: 'Delivery',
      currentDepartment: 'Logistics',
      stages: { completed: 12, inProgress: 0, pending: 0, blocked: 0 },
      timeline: {
        punched: '2024-01-10',
        prepress: '2024-01-12',
        die: '2024-01-14',
        plate: '2024-01-15',
        production: '2024-01-16',
        cutting: '2024-01-17',
        printing: '2024-01-18',
        varnishing: '2024-01-19',
        embossing: '2024-01-19',
        finishing: '2024-01-19',
        packaging: '2024-01-20',
        delivery: '2024-01-20'
      }
    },
    {
      id: 'job-004',
      jobCardId: 'JC-2024-004',
      productCode: 'BR-00-142-D',
      customer: 'Premium Brands Ltd.',
      quantity: 8000,
      priority: 'high',
      status: 'on_hold',
      progress: 25,
      startDate: '2024-01-18',
      dueDate: '2024-01-28',
      createdBy: 'Ahmed Ali',
      currentStage: 'Prepress',
      currentDepartment: 'Prepress',
      stages: { completed: 1, inProgress: 0, pending: 11, blocked: 0 },
      timeline: {
        punched: '2024-01-18',
        prepress: '2024-01-20',
        die: '2024-01-22',
        plate: '2024-01-23',
        production: '2024-01-24',
        cutting: '2024-01-25',
        printing: '2024-01-26',
        varnishing: '2024-01-27',
        embossing: '2024-01-28',
        finishing: '2024-01-29',
        packaging: '2024-01-30',
        delivery: '2024-01-31'
      }
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'on_hold': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'in_progress': return <Play className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'on_hold': return <Pause className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const filteredJobs = mockJobs.filter(job => {
    const matchesSearch = job.jobCardId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.productCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.customer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || job.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || job.priority === filterPriority;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  if (selectedJob) {
    return <JobLifecycleTracker />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                Job Dashboard
              </h1>
              <p className="text-gray-600 mt-2 text-sm sm:text-base">
                Track and manage all production jobs across departments
              </p>
            </div>
            <div className="flex items-center space-x-3 mt-4 sm:mt-0">
              <Button variant="outline" className="bg-white/80 backdrop-blur-sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                <Plus className="w-4 h-4 mr-2" />
                New Job
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-blue-50 to-blue-100/50 hover:from-blue-100 hover:to-blue-200/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-700/80 mb-1">Total Jobs</p>
                      <p className="text-3xl font-bold text-blue-900">{mockJobs.length}</p>
                      <p className="text-xs text-blue-600/70 mt-1">Active projects</p>
                    </div>
                    <div className="h-14 w-14 bg-blue-500/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Factory className="h-7 w-7 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-emerald-50 to-emerald-100/50 hover:from-emerald-100 hover:to-emerald-200/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-emerald-700/80 mb-1">In Progress</p>
                      <p className="text-3xl font-bold text-emerald-900">
                        {mockJobs.filter(j => j.status === 'in_progress').length}
                      </p>
                      <p className="text-xs text-emerald-600/70 mt-1">Active production</p>
                    </div>
                    <div className="h-14 w-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Play className="h-7 w-7 text-emerald-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-green-50 to-green-100/50 hover:from-green-100 hover:to-green-200/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-700/80 mb-1">Completed</p>
                      <p className="text-3xl font-bold text-green-900">
                        {mockJobs.filter(j => j.status === 'completed').length}
                      </p>
                      <p className="text-xs text-green-600/70 mt-1">Finished jobs</p>
                    </div>
                    <div className="h-14 w-14 bg-green-500/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <CheckCircle className="h-7 w-7 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-amber-50 to-amber-100/50 hover:from-amber-100 hover:to-amber-200/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-amber-700/80 mb-1">On Hold</p>
                      <p className="text-3xl font-bold text-amber-900">
                        {mockJobs.filter(j => j.status === 'on_hold').length}
                      </p>
                      <p className="text-xs text-amber-600/70 mt-1">Blocked jobs</p>
                    </div>
                    <div className="h-14 w-14 bg-amber-500/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Pause className="h-7 w-7 text-amber-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>

        {/* Filters and Search */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search jobs by ID, product code, or customer..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white/80"
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-40 bg-white/80">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterPriority} onValueChange={setFilterPriority}>
                  <SelectTrigger className="w-40 bg-white/80">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex border border-gray-200 rounded-lg bg-white/80">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="rounded-r-none"
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="rounded-l-none"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Jobs Grid/List */}
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6' : 'space-y-4'}>
          <AnimatePresence>
            {filteredJobs.map((job, index) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={viewMode === 'grid' ? '' : 'w-full'}
              >
                <Card 
                  className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm cursor-pointer hover:scale-[1.02]"
                  onClick={() => setSelectedJob(job)}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {job.jobCardId}
                        </CardTitle>
                        <p className="text-sm text-gray-600 mt-1">{job.productCode}</p>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <Badge className={`${getPriorityColor(job.priority)} text-xs`}>
                          <Flag className="w-3 h-3 mr-1" />
                          {job.priority.toUpperCase()}
                        </Badge>
                        <Badge className={`${getStatusColor(job.status)} text-xs`}>
                          {getStatusIcon(job.status)}
                          <span className="ml-1">{job.status.replace('_', ' ').toUpperCase()}</span>
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <label className="text-gray-600">Customer</label>
                        <p className="font-medium text-gray-900">{job.customer}</p>
                      </div>
                      <div>
                        <label className="text-gray-600">Quantity</label>
                        <p className="font-medium text-gray-900">{job.quantity.toLocaleString()}</p>
                      </div>
                      <div>
                        <label className="text-gray-600">Current Stage</label>
                        <p className="font-medium text-gray-900">{job.currentStage}</p>
                      </div>
                      <div>
                        <label className="text-gray-600">Department</label>
                        <p className="font-medium text-gray-900">{job.currentDepartment}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">Progress</span>
                        <span className="text-sm text-gray-600">{job.progress}%</span>
                      </div>
                      <Progress value={job.progress} className="h-2" />
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div className="bg-green-50 rounded-lg p-2">
                        <div className="text-lg font-bold text-green-600">{job.stages.completed}</div>
                        <div className="text-xs text-green-600">Done</div>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-2">
                        <div className="text-lg font-bold text-blue-600">{job.stages.inProgress}</div>
                        <div className="text-xs text-blue-600">Active</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2">
                        <div className="text-lg font-bold text-gray-600">{job.stages.pending}</div>
                        <div className="text-xs text-gray-600">Pending</div>
                      </div>
                      <div className="bg-red-50 rounded-lg p-2">
                        <div className="text-lg font-bold text-red-600">{job.stages.blocked}</div>
                        <div className="text-xs text-red-600">Blocked</div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-sm text-gray-600">
                      <span>Due: {job.dueDate}</span>
                      <span>Created by: {job.createdBy}</span>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button size="sm" variant="outline" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button size="sm" variant="outline" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Settings className="w-4 h-4 mr-1" />
                        Manage
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredJobs.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Factory className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default JobDashboard;

