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
  LogOut
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

interface HODPrepressDashboardProps {
  onLogout?: () => void;
}

const HODPrepressDashboard: React.FC<HODPrepressDashboardProps> = ({ onLogout }) => {
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

  const { data: prepressJobs, isLoading: jobsLoading, refetch: refetchJobs } = usePrepressJobs(filters);
  const { data: statistics, isLoading: statsLoading } = usePrepressStatistics();
  const { data: designerProductivity } = useDesignerProductivity();
  const { data: activity } = usePrepressJobActivity(selectedJob?.id || '');

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value === 'all' ? '' : value }));
  };

  const handleAssignDesigner = () => {
    if (selectedJob && selectedDesigner) {
      // TODO: Implement assignment logic
      toast.success('Designer assigned successfully');
      setIsAssignDialogOpen(false);
      setSelectedDesigner('');
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
      // Fallback: reload the page to trigger authentication check
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
    { key: 'PENDING', title: 'Pending', color: 'bg-gray-100', textColor: 'text-gray-700' },
    { key: 'ASSIGNED', title: 'Assigned', color: 'bg-blue-100', textColor: 'text-blue-700' },
    { key: 'IN_PROGRESS', title: 'In Progress', color: 'bg-yellow-100', textColor: 'text-yellow-700' },
    { key: 'PAUSED', title: 'Paused', color: 'bg-orange-100', textColor: 'text-orange-700' },
    { key: 'HOD_REVIEW', title: 'HOD Review', color: 'bg-purple-100', textColor: 'text-purple-700' },
    { key: 'COMPLETED', title: 'Completed', color: 'bg-green-100', textColor: 'text-green-700' },
    { key: 'REJECTED', title: 'Rejected', color: 'bg-red-100', textColor: 'text-red-700' }
  ] as const;

  const priorityColors = {
    LOW: 'bg-gray-100 text-gray-700',
    MEDIUM: 'bg-blue-100 text-blue-700',
    HIGH: 'bg-orange-100 text-orange-700',
    CRITICAL: 'bg-red-100 text-red-700'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">HOD Prepress Dashboard</h1>
            <p className="text-gray-600 mt-1">Prepress job management and designer coordination</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={handleLogout} variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
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
                  <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
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
            <Card>
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
                  <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
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
            <Card>
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
                  <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
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
            <Card>
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
                  <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                  <SelectTrigger>
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
                <Label htmlFor="priority">Priority</Label>
                <Select value={filters.priority} onValueChange={(value) => handleFilterChange('priority', value)}>
                  <SelectTrigger>
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
                <Label htmlFor="designer">Designer</Label>
                <Select value={filters.designer} onValueChange={(value) => handleFilterChange('designer', value)}>
                  <SelectTrigger>
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
                <Label htmlFor="search">Search</Label>
                <Input
                  id="search"
                  placeholder="Search jobs..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Kanban Board */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Prepress Jobs Kanban Board
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
              {statusColumns.map((column) => (
                <div key={column.key} className="space-y-3">
                  <div className={`p-3 rounded-lg ${column.color}`}>
                    <h3 className={`font-semibold ${column.textColor}`}>
                      {column.title}
                    </h3>
                    <Badge variant="secondary" className="ml-2">
                      {jobsByStatus[column.key as PrepressStatus]?.length || 0}
                    </Badge>
                  </div>
                  <div className="space-y-2 min-h-[400px]">
                    <AnimatePresence>
                      {jobsByStatus[column.key as PrepressStatus]?.map((job) => (
                        <motion.div
                          key={job.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          className="p-3 bg-white border rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => setSelectedJob(job)}
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-sm">{job.job_card_id_display}</h4>
                              <Badge className={priorityColors[job.priority as PrepressPriority]}>
                                {job.priority}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-600">{job.company_name}</p>
                            <p className="text-xs text-gray-500">{job.product_type}</p>
                            {job.designer_first_name && (
                              <p className="text-xs text-blue-600">
                                👤 {job.designer_first_name} {job.designer_last_name}
                              </p>
                            )}
                            {job.due_date && (
                              <p className="text-xs text-orange-600">
                                📅 Due: {new Date(job.due_date).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Designer Productivity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
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
                  className="p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-purple-600 font-semibold">
                        {designer.first_name[0]}{designer.last_name[0]}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold">{designer.first_name} {designer.last_name}</h3>
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

        {/* Job Detail Dialog */}
        <Dialog open={!!selectedJob} onOpenChange={() => setSelectedJob(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Job Details - {selectedJob?.job_card_id_display}</DialogTitle>
              <DialogDescription>
                Manage this prepress job and view its activity history
              </DialogDescription>
            </DialogHeader>
            
            {selectedJob && (
              <div className="space-y-6">
                {/* Job Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Company</Label>
                    <p className="text-sm text-gray-600">{selectedJob.company_name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Product Type</Label>
                    <p className="text-sm text-gray-600">{selectedJob.product_type}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Priority</Label>
                    <Badge className={priorityColors[selectedJob.priority as PrepressPriority]}>
                      {selectedJob.priority}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    <Badge variant="secondary">{selectedJob.status}</Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Assigned Designer</Label>
                    <p className="text-sm text-gray-600">
                      {selectedJob.designer_first_name ? 
                        `${selectedJob.designer_first_name} ${selectedJob.designer_last_name}` : 
                        'Not assigned'
                      }
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Due Date</Label>
                    <p className="text-sm text-gray-600">
                      {selectedJob.due_date ? new Date(selectedJob.due_date).toLocaleDateString() : 'Not set'}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Users className="h-4 w-4 mr-2" />
                        Assign Designer
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
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
                            <SelectTrigger>
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
                        <Button onClick={handleAssignDesigner} disabled={!selectedDesigner}>
                          Assign
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={isRemarkDialogOpen} onOpenChange={setIsRemarkDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <FileText className="h-4 w-4 mr-2" />
                        Add Remark
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
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
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={handleAddRemark} disabled={!remark.trim()}>
                          Add Remark
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Activity History */}
                <div>
                  <Label className="text-sm font-medium">Activity History</Label>
                  <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                    {activity?.map((act, index) => (
                      <div key={index} className="flex items-center gap-3 p-2 border rounded">
                        <div className="h-2 w-2 bg-blue-500 rounded-full" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{act.action}</p>
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

export default HODPrepressDashboard;
