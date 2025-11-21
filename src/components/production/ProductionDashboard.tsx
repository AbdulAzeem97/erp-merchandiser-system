import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Printer,
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
  Edit,
  Eye,
  Play,
  Settings,
  Factory
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useSocket } from '@/services/socketService.tsx';
import { MainLayout } from '@/components/layout/MainLayout';

interface ProductionJob {
  id: string | number;
  job_card_id?: string | number;
  jobNumber?: string;
  po_number?: string;
  product_name?: string;
  product_type?: string;
  product_item_code?: string;
  company_name?: string;
  customer_name?: string;
  quantity: number;
  priority: string;
  dueDate?: string;
  status?: string;
  current_step?: string;
  current_department?: string;
  workflow_status?: string;
  status_message?: string;
  step_name?: string;
  step_status?: string;
  assignment_id?: string;
  assigned_operator_name?: string;
  machine_name?: string;
  machine_type?: string;
  assignment_status?: string;
  started_at?: string;
  completed_at?: string;
  material_consumed?: any;
  quality_metrics?: any;
}

interface ProductionDashboardProps {
  onLogout?: () => void;
}

const statusConfig = {
  'Pending': { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  'Assigned': { color: 'bg-blue-100 text-blue-800', icon: User },
  'Setup': { color: 'bg-purple-100 text-purple-800', icon: Settings },
  'Printing': { color: 'bg-green-100 text-green-800', icon: Play },
  'Quality Check': { color: 'bg-indigo-100 text-indigo-800', icon: Eye },
  'Completed': { color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle },
  'On Hold': { color: 'bg-orange-100 text-orange-800', icon: Pause },
  'Rejected': { color: 'bg-red-100 text-red-800', icon: XCircle }
};

const ProductionDashboard: React.FC<ProductionDashboardProps> = ({ onLogout }) => {
  const { socket, isConnected } = useSocket();
  const [jobs, setJobs] = useState<ProductionJob[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<ProductionJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [stepTypeFilter, setStepTypeFilter] = useState('all');
  const [selectedJob, setSelectedJob] = useState<ProductionJob | null>(null);
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isCommentDialogOpen, setIsCommentDialogOpen] = useState(false);
  const [availableOperators, setAvailableOperators] = useState<any[]>([]);
  const [availableMachines, setAvailableMachines] = useState<any[]>([]);
  const [assignmentData, setAssignmentData] = useState({
    assignedTo: '',
    machineId: '',
    comments: ''
  });
  const [statusData, setStatusData] = useState({
    status: '',
    comments: ''
  });
  const [commentText, setCommentText] = useState('');

  // Load production jobs
  const loadProductionJobs = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/production/jobs`, {
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
        toast.error(error.message || 'Failed to load production jobs');
      }
    } catch (error) {
      console.error('Error loading production jobs:', error);
      toast.error('Failed to load production jobs');
    } finally {
      setIsLoading(false);
    }
  };

  // Load available operators
  const loadOperators = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/production/operators`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAvailableOperators(data.operators || []);
      }
    } catch (error) {
      console.error('Error loading operators:', error);
    }
  };

  // Load available machines
  const loadMachines = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/production/machines`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAvailableMachines(data.machines || []);
      }
    } catch (error) {
      console.error('Error loading machines:', error);
    }
  };

  useEffect(() => {
    loadProductionJobs();
    loadOperators();
    loadMachines();
  }, []);

  // Socket.io real-time updates
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleStatusUpdated = (data: any) => {
      setTimeout(() => {
        toast.info('Production status updated');
        loadProductionJobs();
      }, 0);
    };

    const handleJobAssigned = (data: any) => {
      setTimeout(() => {
        toast.info('Job assigned to production');
        loadProductionJobs();
      }, 0);
    };

    socket.on('production:status_updated', handleStatusUpdated);
    socket.on('production:job_assigned', handleJobAssigned);

    return () => {
      socket.off('production:status_updated', handleStatusUpdated);
      socket.off('production:job_assigned', handleJobAssigned);
    };
  }, [socket, isConnected]);

  // Filter jobs
  useEffect(() => {
    let filtered = [...jobs];

    if (searchTerm) {
      filtered = filtered.filter(job =>
        job.jobNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.po_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(job => job.assignment_status === statusFilter || job.step_status === statusFilter);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(job => job.priority === priorityFilter);
    }

    if (stepTypeFilter !== 'all') {
      filtered = filtered.filter(job => 
        job.step_name?.toLowerCase().includes(stepTypeFilter.toLowerCase())
      );
    }

    setFilteredJobs(filtered);
  }, [jobs, searchTerm, statusFilter, priorityFilter, stepTypeFilter]);

  // Assign job
  const handleAssign = async () => {
    if (!selectedJob || !assignmentData.assignedTo || !assignmentData.machineId) {
      toast.error('Please select operator and machine');
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/production/assign`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jobId: selectedJob.job_card_id || selectedJob.id,
          assignedTo: parseInt(assignmentData.assignedTo),
          machineId: parseInt(assignmentData.machineId),
          comments: assignmentData.comments
        })
      });

      if (response.ok) {
        toast.success('Job assigned successfully');
        setIsAssignmentDialogOpen(false);
        setAssignmentData({ assignedTo: '', machineId: '', comments: '' });
        loadProductionJobs();
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
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/production/update-status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jobId: selectedJob.job_card_id || selectedJob.id,
          status: statusData.status,
          comments: statusData.comments
        })
      });

      if (response.ok) {
        toast.success('Status updated successfully');
        setIsStatusDialogOpen(false);
        setStatusData({ status: '', comments: '' });
        loadProductionJobs();
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
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/production/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jobId: selectedJob.id || selectedJob.job_card_id,
          comment: commentText
        })
      });

      if (response.ok) {
        toast.success('Comment added successfully');
        setIsCommentDialogOpen(false);
        setCommentText('');
        loadProductionJobs();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to add comment');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    }
  };

  const getStatusBadge = (status: string | undefined) => {
    if (!status) return null;
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['Pending'];
    const Icon = config.icon;
    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    );
  };

  const stats = {
    total: jobs.length,
    pending: jobs.filter(j => j.assignment_status === 'Pending' || j.step_status === 'pending').length,
    inProgress: jobs.filter(j => j.assignment_status === 'Printing' || j.step_status === 'in_progress').length,
    completed: jobs.filter(j => j.assignment_status === 'Completed' || j.step_status === 'completed').length
  };

  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Factory className="w-8 h-8" />
              Production Department Dashboard
            </h1>
            <p className="text-gray-600 mt-1">Manage production jobs and assignments</p>
          </div>
          <Button onClick={loadProductionJobs} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-600">Total Jobs</div>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-600">Pending</div>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-600">In Progress</div>
              <div className="text-2xl font-bold text-green-600">{stats.inProgress}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-600">Completed</div>
              <div className="text-2xl font-bold text-emerald-600">{stats.completed}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
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
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Assigned">Assigned</SelectItem>
                  <SelectItem value="Setup">Setup</SelectItem>
                  <SelectItem value="Printing">Printing</SelectItem>
                  <SelectItem value="Quality Check">Quality Check</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="On Hold">On Hold</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="NORMAL">Normal</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
              <Select value={stepTypeFilter} onValueChange={setStepTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Step Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Steps</SelectItem>
                  <SelectItem value="Offset">Offset Printing</SelectItem>
                  <SelectItem value="Digital">Digital Printing</SelectItem>
                  <SelectItem value="Screen">Screen Printing</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Jobs List */}
        {isLoading ? (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400" />
            <p className="text-gray-600 mt-2">Loading production jobs...</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Printer className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">No production jobs found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredJobs.map((job) => (
              <motion.div
                key={job.id || job.job_card_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-xl font-bold text-gray-900">
                            {job.jobNumber || `JC-${job.job_card_id || job.id}` || 'N/A'}
                          </h3>
                          {getStatusBadge(job.assignment_status || job.step_status)}
                          <Badge variant="outline">{job.priority}</Badge>
                          {job.step_name && (
                            <Badge variant="secondary">{job.step_name}</Badge>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Client:</span>
                            <p className="font-medium">{job.company_name || job.customer_name || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Product:</span>
                            <p className="font-medium">{job.product_name || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Quantity:</span>
                            <p className="font-medium">{job.quantity?.toLocaleString() || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Due Date:</span>
                            <p className="font-medium">
                              {job.dueDate ? new Date(job.dueDate).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                        </div>

                        {job.assigned_operator_name && (
                          <div className="mt-3 text-sm">
                            <span className="text-gray-600">Assigned Operator: </span>
                            <span className="font-medium">{job.assigned_operator_name}</span>
                            {job.machine_name && (
                              <>
                                <span className="text-gray-600 ml-4">Machine: </span>
                                <span className="font-medium">{job.machine_name}</span>
                              </>
                            )}
                          </div>
                        )}

                        {job.status_message && (
                          <div className="mt-2 text-sm text-gray-600">
                            {job.status_message}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedJob(job);
                            setIsAssignmentDialogOpen(true);
                            loadOperators();
                            loadMachines();
                          }}
                        >
                          <Users className="w-4 h-4 mr-1" />
                          Assign
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedJob(job);
                            setStatusData({ status: job.assignment_status || '', comments: '' });
                            setIsStatusDialogOpen(true);
                          }}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Status
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedJob(job);
                            setIsCommentDialogOpen(true);
                          }}
                        >
                          <MessageSquare className="w-4 h-4 mr-1" />
                          Comment
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Assignment Dialog */}
        <Dialog open={isAssignmentDialogOpen} onOpenChange={setIsAssignmentDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Assign Production Job</DialogTitle>
              <DialogDescription>
                Assign this job to a production operator and machine.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Operator</Label>
                <Select value={assignmentData.assignedTo} onValueChange={(value) => setAssignmentData({ ...assignmentData, assignedTo: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select operator" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableOperators.map((op) => (
                      <SelectItem key={op.id} value={op.id.toString()}>
                        {op.firstName} {op.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Machine</Label>
                <Select value={assignmentData.machineId} onValueChange={(value) => setAssignmentData({ ...assignmentData, machineId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select machine" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMachines.map((machine) => (
                      <SelectItem key={machine.id} value={machine.id.toString()}>
                        {machine.name} ({machine.machine_type})
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
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAssignmentDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAssign}>
                  Assign Job
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Status Update Dialog */}
        <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Update Production Status</DialogTitle>
              <DialogDescription>
                Update the current status of this production job.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Status</Label>
                <Select value={statusData.status} onValueChange={(value) => setStatusData({ ...statusData, status: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Assigned">Assigned</SelectItem>
                    <SelectItem value="Setup">Setup</SelectItem>
                    <SelectItem value="Printing">Printing</SelectItem>
                    <SelectItem value="Quality Check">Quality Check</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="On Hold">On Hold</SelectItem>
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
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Comment</DialogTitle>
              <DialogDescription>
                Add a comment or note to this production job.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
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
    </MainLayout>
  );
};

export default ProductionDashboard;
