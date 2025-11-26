import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Scissors,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  Pause,
  XCircle,
  Search,
  Filter,
  RefreshCw,
  Building2,
  Calendar,
  Package,
  FileText,
  MessageSquare,
  Users,
  Plus,
  Edit,
  Eye,
  Play,
  Square
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useSocket } from '@/services/socketService.tsx';
import { MainLayout } from '@/components/layout/MainLayout';
import { authAPI } from '@/services/api';
import { CuttingLayoutDisplay } from './CuttingLayoutDisplay';

interface CuttingJob {
  id: string;
  job_card_id?: string | number;
  jobNumber?: string;
  po_number?: string;
  product_code?: string;
  product_name?: string;
  product_brand?: string;
  product_gsm?: number;
  product_description?: string;
  product_fsc_certified?: boolean;
  product_fsc_license?: string;
  material_name?: string;
  category_name?: string;
  company_name?: string;
  company_email?: string;
  company_phone?: string;
  company_address?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  customer_address?: string;
  quantity: number;
  priority: string;
  delivery_date: string;
  createdAt?: string;
  updatedAt?: string;
  job_notes?: string;
  client_layout_link?: string;
  cutting_status?: string;
  cutting_assigned_to?: string;
  assigned_labor_name?: string;
  assigned_labor_email?: string;
  assigned_labor_phone?: string;
  assigned_by_name?: string;
  assigned_by_email?: string;
  cutting_comments?: string;
  cutting_started_at?: string;
  cutting_finished_at?: string;
  required_plate_count?: number;
  plate_count?: number;
  ctp_machine_name?: string;
  ctp_machine_code?: string;
  ctp_machine_type?: string;
  ctp_machine_location?: string;
  current_step?: string;
  current_department?: string;
  workflow_status?: string;
  status_message?: string;
  assignment_id?: string;
  // Job Planning Information
  blank_width_mm?: number;
  blank_height_mm?: number;
  blank_width_inches?: number;
  blank_height_inches?: number;
  blank_size_unit?: string;
  additional_sheets?: number;
  base_required_sheets?: number;
  selected_sheet_size_id?: number;
  efficiency_percentage?: number;
  scrap_percentage?: number;
  sheet_width_mm?: number;
  sheet_height_mm?: number;
}

interface CuttingDashboardProps {
  onLogout?: () => void;
}

const statusConfig = {
  'Pending': { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  'Assigned': { color: 'bg-blue-100 text-blue-800', icon: User },
  'In Progress': { color: 'bg-green-100 text-green-800', icon: Play },
  'On Hold': { color: 'bg-orange-100 text-orange-800', icon: Pause },
  'Completed': { color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle },
  'Rejected': { color: 'bg-red-100 text-red-800', icon: XCircle }
};

const CuttingDashboard: React.FC<CuttingDashboardProps> = ({ onLogout }) => {
  const { socket, isConnected } = useSocket();
  const [jobs, setJobs] = useState<CuttingJob[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<CuttingJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [assignedFilter, setAssignedFilter] = useState('all');
  const [selectedJob, setSelectedJob] = useState<CuttingJob | null>(null);
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isCommentDialogOpen, setIsCommentDialogOpen] = useState(false);
  const [availableLabor, setAvailableLabor] = useState<any[]>([]);
  const [assignmentData, setAssignmentData] = useState({
    assignedTo: '',
    comments: ''
  });
  const [statusData, setStatusData] = useState({
    status: '',
    comments: ''
  });
  const [commentText, setCommentText] = useState('');

  // Load cutting jobs
  const loadCuttingJobs = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/cutting/jobs`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setJobs(data.jobs || []);
        setFilteredJobs(data.jobs || []);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to load cutting jobs');
      }
    } catch (error) {
      console.error('Error loading cutting jobs:', error);
      toast.error('Failed to load cutting jobs');
    } finally {
      setIsLoading(false);
    }
  };

  // Load available labor
  const loadAvailableLabor = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/auth/users/role/CUTTING_LABOR`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAvailableLabor(data.users || []);
      }
    } catch (error) {
      console.error('Error loading labor:', error);
    }
  };

  // Filter jobs
  useEffect(() => {
    let filtered = jobs;

    if (searchTerm) {
      filtered = filtered.filter(job => {
        const jobId = job.jobNumber || `JC-${job.job_card_id || job.id}` || '';
        return jobId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (job.product_code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (job.company_name || job.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(job => (job.cutting_status || 'Pending') === statusFilter);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(job => job.priority === priorityFilter);
    }

    if (assignedFilter !== 'all') {
      if (assignedFilter === 'unassigned') {
        filtered = filtered.filter(job => !job.cutting_assigned_to);
      } else {
        filtered = filtered.filter(job => job.cutting_assigned_to === assignedFilter);
      }
    }

    setFilteredJobs(filtered);
  }, [jobs, searchTerm, statusFilter, priorityFilter, assignedFilter]);

  // Load data on mount
  useEffect(() => {
    loadCuttingJobs();
    loadAvailableLabor();
  }, []);

  // Socket listeners
  useEffect(() => {
    if (socket && isConnected) {
      const handleJobReady = (data: any) => {
        setTimeout(() => {
          toast.info(`New job ready for cutting: ${data.jobId}`);
          loadCuttingJobs();
        }, 0);
      };

      const handleJobAssigned = (data: any) => {
        setTimeout(() => {
          toast.success('Job assigned successfully');
          loadCuttingJobs();
        }, 0);
      };

      const handleStatusUpdated = (data: any) => {
        setTimeout(() => {
          toast.info('Cutting status updated');
          loadCuttingJobs();
        }, 0);
      };

      socket.on('cutting:job_ready', handleJobReady);
      socket.on('cutting:job_assigned', handleJobAssigned);
      socket.on('cutting:status_updated', handleStatusUpdated);

      return () => {
        socket.off('cutting:job_ready', handleJobReady);
        socket.off('cutting:job_assigned', handleJobAssigned);
        socket.off('cutting:status_updated', handleStatusUpdated);
      };
    }
  }, [socket, isConnected]);

  // Assign job to labor
  const handleAssign = async () => {
    if (!selectedJob || !assignmentData.assignedTo) {
      toast.error('Please select a labor to assign');
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/cutting/assign`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jobId: selectedJob.id,
          assignedTo: assignmentData.assignedTo,
          comments: assignmentData.comments
        })
      });

      if (response.ok) {
        toast.success('Job assigned successfully');
        setIsAssignmentDialogOpen(false);
        setAssignmentData({ assignedTo: '', comments: '' });
        loadCuttingJobs();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to assign job');
      }
    } catch (error) {
      console.error('Error assigning job:', error);
      toast.error('Failed to assign job');
    }
  };

  // Update status
  const handleUpdateStatus = async () => {
    if (!selectedJob || !statusData.status) {
      toast.error('Please select a status');
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/cutting/update-status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jobId: selectedJob.id,
          status: statusData.status,
          comments: statusData.comments
        })
      });

      if (response.ok) {
        toast.success('Status updated successfully');
        setIsStatusDialogOpen(false);
        setStatusData({ status: '', comments: '' });
        loadCuttingJobs();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  // Add comment
  const handleAddComment = async () => {
    if (!selectedJob || !commentText.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/cutting/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jobId: selectedJob.id,
          comment: commentText
        })
      });

      if (response.ok) {
        toast.success('Comment added successfully');
        setIsCommentDialogOpen(false);
        setCommentText('');
        loadCuttingJobs();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to add comment');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    }
  };

  const getStatusIcon = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig];
    if (config) {
      const Icon = config.icon;
      return <Icon className="w-3 h-3" />;
    }
    return <Clock className="w-3 h-3" />;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const handleNavigate = (page: string) => {
    // Navigation handler for sidebar
    if (page === 'cutting-dashboard') {
      // Already on cutting dashboard
      return;
    }
    // Add other navigation handlers if needed
  };

  const handleLogout = () => {
    try {
      authAPI.logout();
      toast.success('Logged out successfully');
      // Redirect to login page
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      // Fallback: clear local storage and redirect
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
  };

  return (
    <MainLayout
      currentPage="cutting-dashboard"
      onNavigate={handleNavigate}
      onLogout={handleLogout}
      pageTitle="Cutting Department Dashboard"
      pageDescription="Manage cutting operations and assignments"
    >
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Scissors className="w-8 h-8 text-blue-600" />
              Cutting Department Dashboard
            </h1>
            <p className="text-gray-600 mt-2">Manage cutting operations and assignments</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={loadCuttingJobs} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Jobs</p>
                  <p className="text-2xl font-bold">{jobs.length}</p>
                </div>
                <Package className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {jobs.filter(j => (j.cutting_status || 'Pending') === 'Pending').length}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">In Progress</p>
                  <p className="text-2xl font-bold text-green-600">
                    {jobs.filter(j => j.cutting_status === 'In Progress').length}
                  </p>
                </div>
                <Play className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    {jobs.filter(j => j.cutting_status === 'Completed').length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search jobs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Assigned">Assigned</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="On Hold">On Hold</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
              <Select value={assignedFilter} onValueChange={setAssignedFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Assignments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assignments</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {availableLabor.map(labor => (
                    <SelectItem key={labor.id} value={labor.id}>
                      {labor.firstName} {labor.lastName}
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
            <CardTitle>Cutting Jobs ({filteredJobs.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                Loading jobs...
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No cutting jobs found
              </div>
            ) : (
              <div className="space-y-4">
                {filteredJobs.map((job) => (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* Header with Job Number and Badges */}
                        <div className="flex items-center space-x-3 mb-4">
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">
                              {job.jobNumber || (job as any).jobnumber || `JC-${job.job_card_id || job.id}` || 'N/A'}
                            </h3>
                            {job.po_number && (
                              <p className="text-sm text-gray-500">PO: {job.po_number}</p>
                            )}
                          </div>
                          <Badge className={statusConfig[job.cutting_status as keyof typeof statusConfig]?.color || 'bg-gray-100 text-gray-800'}>
                            {getStatusIcon(job.cutting_status || 'Pending')}
                            <span className="ml-1">{job.cutting_status || 'Pending'}</span>
                          </Badge>
                          <Badge className={`${
                            job.priority === 'URGENT' ? 'bg-red-100 text-red-800' :
                            job.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                            job.priority === 'MEDIUM' ? 'bg-blue-100 text-blue-800' :
                            job.priority === 'NORMAL' ? 'bg-gray-100 text-gray-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {job.priority || 'MEDIUM'}
                          </Badge>
                          {job.current_step && (
                            <Badge variant="outline" className="text-xs">
                              {job.current_step}
                            </Badge>
                          )}
                        </div>

                        {/* Main Job Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                          {/* Client Information */}
                          <div className="bg-blue-50 p-3 rounded-lg">
                            <p className="text-xs font-semibold text-blue-700 mb-2 flex items-center gap-1">
                              <Building2 className="w-3 h-3" />
                              CLIENT INFORMATION
                            </p>
                            <p className="font-semibold text-gray-900">{job.company_name || job.customer_name || 'N/A'}</p>
                            {job.customer_name && job.company_name && (
                              <p className="text-sm text-gray-600">Contact: {job.customer_name}</p>
                            )}
                            {job.customer_email && (
                              <p className="text-xs text-gray-500">📧 {job.customer_email}</p>
                            )}
                            {job.customer_phone && (
                              <p className="text-xs text-gray-500">📞 {job.customer_phone}</p>
                            )}
                            {job.customer_address && (
                              <p className="text-xs text-gray-500 mt-1">📍 {job.customer_address}</p>
                            )}
                          </div>

                          {/* Product Information */}
                          <div className="bg-green-50 p-3 rounded-lg">
                            <p className="text-xs font-semibold text-green-700 mb-2 flex items-center gap-1">
                              <Package className="w-3 h-3" />
                              PRODUCT INFORMATION
                            </p>
                            <p className="font-semibold text-gray-900">{job.product_name || 'N/A'}</p>
                            {job.product_code && (
                              <p className="text-sm text-gray-600">SKU: {job.product_code}</p>
                            )}
                            {job.product_brand && (
                              <p className="text-xs text-gray-500">Brand: {job.product_brand}</p>
                            )}
                            {job.material_name && (
                              <p className="text-xs text-gray-500">Material: {job.material_name}</p>
                            )}
                            {job.product_gsm && (
                              <p className="text-xs text-gray-500">GSM: {job.product_gsm}</p>
                            )}
                            {job.category_name && (
                              <p className="text-xs text-gray-500">Category: {job.category_name}</p>
                            )}
                            {job.product_fsc_certified && (
                              <p className="text-xs text-green-600">✓ FSC Certified</p>
                            )}
                          </div>

                          {/* Quantity & Delivery */}
                          <div className="bg-purple-50 p-3 rounded-lg">
                            <p className="text-xs font-semibold text-purple-700 mb-2 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              QUANTITY & DELIVERY
                            </p>
                            <p className="font-semibold text-gray-900 text-lg">{job.quantity.toLocaleString()} units</p>
                            <p className="text-sm text-gray-600 mt-1">
                              <Calendar className="w-3 h-3 inline mr-1" />
                              Due: {formatDate(job.delivery_date)}
                            </p>
                            {job.createdAt && (
                              <p className="text-xs text-gray-500 mt-1">
                                Created: {formatDate(job.createdAt)}
                              </p>
                            )}
                          </div>

                          {/* CTP & Plates Information */}
                          <div className="bg-orange-50 p-3 rounded-lg">
                            <p className="text-xs font-semibold text-orange-700 mb-2 flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              CTP & PLATES
                            </p>
                            <p className="font-semibold text-gray-900">
                              Plates: {job.plate_count || 0} / {job.required_plate_count || 0}
                            </p>
                            {job.ctp_machine_name && (
                              <p className="text-sm text-gray-600 mt-1">
                                Machine: {job.ctp_machine_name}
                                {job.ctp_machine_code && ` (${job.ctp_machine_code})`}
                              </p>
                            )}
                            {job.ctp_machine_location && (
                              <p className="text-xs text-gray-500">📍 {job.ctp_machine_location}</p>
                            )}
                          </div>

                          {/* Assignment Information */}
                          <div className="bg-yellow-50 p-3 rounded-lg">
                            <p className="text-xs font-semibold text-yellow-700 mb-2 flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              ASSIGNMENT
                            </p>
                            <p className="font-semibold text-gray-900">
                              {job.assigned_labor_name || 'Unassigned'}
                            </p>
                            {job.assigned_labor_email && (
                              <p className="text-xs text-gray-500">📧 {job.assigned_labor_email}</p>
                            )}
                            {job.assigned_labor_phone && (
                              <p className="text-xs text-gray-500">📞 {job.assigned_labor_phone}</p>
                            )}
                            {job.assigned_by_name && (
                              <p className="text-xs text-gray-500 mt-1">
                                Assigned by: {job.assigned_by_name}
                              </p>
                            )}
                            {job.cutting_started_at && (
                              <p className="text-xs text-gray-500">
                                Started: {formatDate(job.cutting_started_at)}
                              </p>
                            )}
                            {job.cutting_finished_at && (
                              <p className="text-xs text-gray-500">
                                Finished: {formatDate(job.cutting_finished_at)}
                              </p>
                            )}
                          </div>

                          {/* Workflow Status */}
                          <div className="bg-indigo-50 p-3 rounded-lg">
                            <p className="text-xs font-semibold text-indigo-700 mb-2 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              WORKFLOW STATUS
                            </p>
                            <p className="font-semibold text-gray-900">{job.current_step || 'N/A'}</p>
                            <p className="text-sm text-gray-600">{job.current_department || 'N/A'}</p>
                            <p className="text-xs text-gray-500 mt-1 italic">{job.status_message || 'N/A'}</p>
                            {job.workflow_status && (
                              <Badge variant="outline" className="mt-1 text-xs">
                                {job.workflow_status}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Job Planning Information Section */}
                        {(job.grid_pattern || job.cutting_layout_type || job.final_total_sheets || job.blank_width_mm || job.blank_width_inches || job.blanks_per_sheet) && (
                          <div className="mt-4 space-y-4">
                            {/* Visual Layout - Always show if any planning data exists */}
                            {(job.grid_pattern || job.cutting_layout_type || job.blanks_per_sheet || job.final_total_sheets) && (
                              <CuttingLayoutDisplay
                                gridPattern={job.grid_pattern || undefined}
                                cuttingLayoutType={job.cutting_layout_type || undefined}
                                blanksPerSheet={job.blanks_per_sheet ? (typeof job.blanks_per_sheet === 'number' ? job.blanks_per_sheet : parseInt(job.blanks_per_sheet)) : undefined}
                                efficiencyPercentage={job.efficiency_percentage ? (typeof job.efficiency_percentage === 'number' ? job.efficiency_percentage : parseFloat(job.efficiency_percentage)) : undefined}
                                scrapPercentage={job.scrap_percentage ? (typeof job.scrap_percentage === 'number' ? job.scrap_percentage : parseFloat(job.scrap_percentage)) : undefined}
                                blankWidth={(() => {
                                  if (job.blank_size_unit === 'inches' && job.blank_width_inches) {
                                    const val = typeof job.blank_width_inches === 'number' ? job.blank_width_inches : parseFloat(job.blank_width_inches);
                                    return !isNaN(val) ? val * 25.4 : undefined;
                                  }
                                  if (job.blank_width_mm) {
                                    const val = typeof job.blank_width_mm === 'number' ? job.blank_width_mm : parseFloat(job.blank_width_mm);
                                    return !isNaN(val) ? val : undefined;
                                  }
                                  return undefined;
                                })()}
                                blankHeight={(() => {
                                  if (job.blank_size_unit === 'inches' && job.blank_height_inches) {
                                    const val = typeof job.blank_height_inches === 'number' ? job.blank_height_inches : parseFloat(job.blank_height_inches);
                                    return !isNaN(val) ? val * 25.4 : undefined;
                                  }
                                  if (job.blank_height_mm) {
                                    const val = typeof job.blank_height_mm === 'number' ? job.blank_height_mm : parseFloat(job.blank_height_mm);
                                    return !isNaN(val) ? val : undefined;
                                  }
                                  return undefined;
                                })()}
                                blankSizeUnit={job.blank_size_unit || 'mm'}
                                sheetWidth={job.sheet_width_mm ? (typeof job.sheet_width_mm === 'number' ? job.sheet_width_mm : parseFloat(job.sheet_width_mm)) : undefined}
                                sheetHeight={job.sheet_height_mm ? (typeof job.sheet_height_mm === 'number' ? job.sheet_height_mm : parseFloat(job.sheet_height_mm)) : undefined}
                              />
                            )}

                            {/* Blank Sheet Size and Sheet Quantities */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Blank Sheet Size */}
                              {(job.blank_width_mm || job.blank_width_inches) && (
                                <Card className="bg-cyan-50 border-cyan-200">
                                  <CardHeader className="pb-3">
                                    <CardTitle className="text-base flex items-center gap-2">
                                      <Square className="h-4 w-4 text-cyan-600" />
                                      Blank Sheet Size
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="space-y-2">
                                      {job.blank_size_unit === 'inches' && job.blank_width_inches && job.blank_height_inches ? (
                                        <>
                                          <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">Width:</span>
                                            <span className="font-semibold text-gray-900">
                                              {typeof job.blank_width_inches === 'number' 
                                                ? job.blank_width_inches.toFixed(2) 
                                                : parseFloat(job.blank_width_inches).toFixed(2)}"
                                            </span>
                                          </div>
                                          <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">Height:</span>
                                            <span className="font-semibold text-gray-900">
                                              {typeof job.blank_height_inches === 'number' 
                                                ? job.blank_height_inches.toFixed(2) 
                                                : parseFloat(job.blank_height_inches).toFixed(2)}"
                                            </span>
                                          </div>
                                          {job.blank_width_mm && job.blank_height_mm && (
                                            <div className="pt-2 border-t border-cyan-200">
                                              <div className="flex items-center justify-between text-xs text-gray-500">
                                                <span>Width:</span>
                                                <span>{typeof job.blank_width_mm === 'number' ? job.blank_width_mm.toFixed(2) : parseFloat(job.blank_width_mm).toFixed(2)} mm</span>
                                              </div>
                                              <div className="flex items-center justify-between text-xs text-gray-500">
                                                <span>Height:</span>
                                                <span>{typeof job.blank_height_mm === 'number' ? job.blank_height_mm.toFixed(2) : parseFloat(job.blank_height_mm).toFixed(2)} mm</span>
                                              </div>
                                            </div>
                                          )}
                                        </>
                                      ) : job.blank_width_mm && job.blank_height_mm ? (
                                        <>
                                          <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">Width:</span>
                                            <span className="font-semibold text-gray-900">
                                              {typeof job.blank_width_mm === 'number' 
                                                ? job.blank_width_mm.toFixed(2) 
                                                : parseFloat(job.blank_width_mm).toFixed(2)} mm
                                            </span>
                                          </div>
                                          <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">Height:</span>
                                            <span className="font-semibold text-gray-900">
                                              {typeof job.blank_height_mm === 'number' 
                                                ? job.blank_height_mm.toFixed(2) 
                                                : parseFloat(job.blank_height_mm).toFixed(2)} mm
                                            </span>
                                          </div>
                                          {job.blank_width_inches && job.blank_height_inches && (
                                            <div className="pt-2 border-t border-cyan-200">
                                              <div className="flex items-center justify-between text-xs text-gray-500">
                                                <span>Width:</span>
                                                <span>{typeof job.blank_width_inches === 'number' ? job.blank_width_inches.toFixed(2) : parseFloat(job.blank_width_inches).toFixed(2)}"</span>
                                              </div>
                                              <div className="flex items-center justify-between text-xs text-gray-500">
                                                <span>Height:</span>
                                                <span>{typeof job.blank_height_inches === 'number' ? job.blank_height_inches.toFixed(2) : parseFloat(job.blank_height_inches).toFixed(2)}"</span>
                                              </div>
                                            </div>
                                          )}
                                        </>
                                      ) : null}
                                    </div>
                                  </CardContent>
                                </Card>
                              )}

                              {/* Sheet Quantities */}
                              {(job.final_total_sheets || job.base_required_sheets || job.additional_sheets) && (
                                <Card className="bg-emerald-50 border-emerald-200">
                                  <CardHeader className="pb-3">
                                    <CardTitle className="text-base flex items-center gap-2">
                                      <Package className="h-4 w-4 text-emerald-600" />
                                      Sheet Quantities (From Job Planning)
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="space-y-3">
                                      {job.base_required_sheets !== undefined && job.base_required_sheets !== null && (
                                        <div className="flex items-center justify-between p-2 bg-white rounded border border-emerald-100">
                                          <span className="text-sm text-gray-600">Base Required Sheets:</span>
                                          <span className="font-semibold text-emerald-700">
                                            {typeof job.base_required_sheets === 'number' 
                                              ? job.base_required_sheets.toLocaleString() 
                                              : parseInt(job.base_required_sheets).toLocaleString()}
                                          </span>
                                        </div>
                                      )}
                                      {job.additional_sheets !== undefined && job.additional_sheets !== null && job.additional_sheets > 0 && (
                                        <div className="flex items-center justify-between p-2 bg-white rounded border border-emerald-100">
                                          <span className="text-sm text-gray-600">Additional Sheets (Extra):</span>
                                          <span className="font-semibold text-orange-700">
                                            +{typeof job.additional_sheets === 'number' 
                                              ? job.additional_sheets.toLocaleString() 
                                              : parseInt(job.additional_sheets).toLocaleString()}
                                          </span>
                                        </div>
                                      )}
                                      {job.final_total_sheets !== undefined && job.final_total_sheets !== null && (
                                        <div className="flex items-center justify-between p-3 bg-emerald-100 rounded border-2 border-emerald-300">
                                          <span className="text-sm font-semibold text-emerald-900">Total Sheets for Production:</span>
                                          <span className="text-xl font-bold text-emerald-900">
                                            {typeof job.final_total_sheets === 'number' 
                                              ? job.final_total_sheets.toLocaleString() 
                                              : parseInt(job.final_total_sheets).toLocaleString()}
                                          </span>
                                        </div>
                                      )}
                                      {(!job.base_required_sheets && !job.additional_sheets && job.final_total_sheets) && (
                                        <p className="text-xs text-gray-500 italic">
                                          Total sheets approved for cutting
                                        </p>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Additional Information */}
                        {(job.job_notes || job.client_layout_link) && (
                          <div className="mt-4 p-3 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                            <p className="text-xs font-semibold text-gray-700 mb-2">ADDITIONAL INFORMATION</p>
                            {job.job_notes && (
                              <div className="mb-2">
                                <p className="text-xs font-semibold text-gray-600">Job Notes:</p>
                                <p className="text-sm text-gray-700">{job.job_notes}</p>
                              </div>
                            )}
                            {job.client_layout_link && (
                              <div>
                                <p className="text-xs font-semibold text-gray-600">Client Layout:</p>
                                <a 
                                  href={job.client_layout_link} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-600 hover:underline"
                                >
                                  {job.client_layout_link}
                                </a>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Cutting Comments */}
                        {job.cutting_comments && (
                          <div className="mt-3 p-3 bg-amber-50 rounded-lg border-l-4 border-amber-500">
                            <p className="text-xs font-semibold text-amber-700 mb-1">CUTTING COMMENTS</p>
                            <p className="text-sm text-gray-700 italic">{job.cutting_comments}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col space-y-2 ml-4">
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedJob(job);
                            setIsAssignmentDialogOpen(true);
                          }}
                          disabled={job.cutting_status === 'Completed'}
                        >
                          <Users className="h-4 w-4 mr-2" />
                          {job.cutting_assigned_to ? 'Reassign' : 'Assign'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedJob(job);
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
                            setIsCommentDialogOpen(true);
                          }}
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Add Comment
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assignment Dialog */}
        <Dialog open={isAssignmentDialogOpen} onOpenChange={setIsAssignmentDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Job to Labor</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Job</Label>
                <p className="font-medium">{selectedJob?.job_card_id || selectedJob?.jobNumber}</p>
              </div>
              <div>
                <Label>Select Labor</Label>
                <Select value={assignmentData.assignedTo} onValueChange={(value) => setAssignmentData({ ...assignmentData, assignedTo: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select labor" />
                  </SelectTrigger>
                  <SelectContent>
                  {availableLabor.map(labor => (
                    <SelectItem key={labor.id} value={labor.id}>
                      {labor.firstName || labor.first_name} {labor.lastName || labor.last_name} ({labor.email})
                    </SelectItem>
                  ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Comments (Optional)</Label>
                <Textarea
                  value={assignmentData.comments}
                  onChange={(e) => setAssignmentData({ ...assignmentData, comments: e.target.value })}
                  placeholder="Add assignment notes..."
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAssignmentDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAssign}>
                  Assign
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Status Update Dialog */}
        <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Cutting Status</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Job</Label>
                <p className="font-medium">{selectedJob?.job_card_id || selectedJob?.jobNumber}</p>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={statusData.status} onValueChange={(value) => setStatusData({ ...statusData, status: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Assigned">Assigned</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="On Hold">On Hold</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Comments (Optional)</Label>
                <Textarea
                  value={statusData.comments}
                  onChange={(e) => setStatusData({ ...statusData, comments: e.target.value })}
                  placeholder="Add status update notes..."
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateStatus}>
                  Update Status
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Comment Dialog */}
        <Dialog open={isCommentDialogOpen} onOpenChange={setIsCommentDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Comment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Job</Label>
                <p className="font-medium">{selectedJob?.job_card_id || selectedJob?.jobNumber}</p>
              </div>
              <div>
                <Label>Comment</Label>
                <Textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Enter your comment..."
                  rows={4}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCommentDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddComment}>
                  Add Comment
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>
    </MainLayout>
  );
};

export default CuttingDashboard;

