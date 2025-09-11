import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Play, 
  Pause, 
  Square, 
  Upload, 
  Download,
  MessageSquare,
  Calendar,
  User,
  Package,
  Building2,
  RefreshCw,
  Eye,
  FileText,
  Send,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { jobsAPI, authAPI } from '@/services/api';
import SmartSidebar from '@/components/layout/SmartSidebar';
import { useSocket } from '@/services/socketService.tsx';

interface DesignerJob {
  id: string;
  job_card_id: string;
  product_id: string;
  product_name?: string;
  product_code?: string;
  company_id: string;
  company_name?: string;
  status: string;
  priority: string;
  progress: number;
  quantity: number;
  delivery_date: string;
  description: string;
  assigned_designer_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  accepted_at?: string;
  started_at?: string;
  completed_at?: string;
  designer_notes?: string;
  files_uploaded?: string[];
}

const DesignerPortal: React.FC = () => {
  const [jobs, setJobs] = useState<DesignerJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedJob, setSelectedJob] = useState<DesignerJob | null>(null);
  const [isAcceptModalOpen, setIsAcceptModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState('prepressDesigner');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [designerNotes, setDesignerNotes] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [newProgress, setNewProgress] = useState(0);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const socket = useSocket();

  useEffect(() => {
    loadCurrentUser();
    loadJobs();
  }, []);

  // Real-time updates
  useEffect(() => {
    if (socket && socket.connected && currentUser) {
      // Listen for job updates
      socket.on('jobUpdated', (data) => {
        const updatedJob = data.data;
        if (updatedJob.assigned_designer_id === currentUser.id) {
          setJobs(prevJobs => 
            prevJobs.map(job => 
              job.id === updatedJob.id ? { ...job, ...updatedJob } : job
            )
          );
          toast.info(`Job ${updatedJob.job_card_id} has been updated`);
        }
      });

      // Listen for new job assignments
      socket.on('jobAssigned', (data) => {
        const newJob = data.data;
        if (newJob.assigned_designer_id === currentUser.id) {
          setJobs(prevJobs => [newJob, ...prevJobs]);
          toast.success(`New job assigned: ${newJob.job_card_id}`);
        }
      });

      return () => {
        socket.off('jobUpdated');
        socket.off('jobAssigned');
      };
    }
  }, [socket, currentUser]);

  const loadCurrentUser = async () => {
    try {
      const user = await authAPI.getCurrentUser();
      setCurrentUser(user);
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  };

  const loadJobs = async () => {
    try {
      setLoading(true);
      const response = await jobsAPI.getByDesigner(currentUser?.id);
      setJobs(response.data || []);
    } catch (error) {
      console.error('Error loading designer jobs:', error);
      toast.error('Failed to load your assigned jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptJob = async (job: DesignerJob) => {
    setSelectedJob(job);
    setDesignerNotes('');
    setIsAcceptModalOpen(true);
  };

  const confirmAcceptJob = async () => {
    if (!selectedJob) return;
    
    try {
      await jobsAPI.updateStatus(selectedJob.id, {
        status: 'in_progress',
        progress: 10,
        accepted_at: new Date().toISOString(),
        started_at: new Date().toISOString(),
        designer_notes: designerNotes
      });
      
      toast.success('Job accepted successfully!');
      setIsAcceptModalOpen(false);
      setSelectedJob(null);
      loadJobs();
    } catch (error) {
      console.error('Error accepting job:', error);
      toast.error('Failed to accept job');
    }
  };

  const handleUpdateStatus = async (job: DesignerJob) => {
    setSelectedJob(job);
    setNewStatus(job.status);
    setNewProgress(job.progress);
    setDesignerNotes(job.designer_notes || '');
    setIsUpdateModalOpen(true);
  };

  const confirmUpdateStatus = async () => {
    if (!selectedJob) return;
    
    try {
      const updateData: any = {
        status: newStatus,
        progress: newProgress,
        designer_notes: designerNotes
      };

      if (newStatus === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      await jobsAPI.updateStatus(selectedJob.id, updateData);
      
      toast.success('Job status updated successfully!');
      setIsUpdateModalOpen(false);
      setSelectedJob(null);
      loadJobs();
    } catch (error) {
      console.error('Error updating job status:', error);
      toast.error('Failed to update job status');
    }
  };

  const handleViewJob = (job: DesignerJob) => {
    setSelectedJob(job);
    setIsViewModalOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'on_hold': return 'bg-orange-100 text-orange-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'in_progress': return <Play className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'on_hold': return <Pause className="w-4 h-4" />;
      case 'cancelled': return <Square className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const filteredJobs = jobs.filter(job => {
    if (filterStatus === 'all') return true;
    return job.status === filterStatus;
  });

  const getJobStats = () => {
    const total = jobs.length;
    const pending = jobs.filter(j => j.status === 'pending').length;
    const inProgress = jobs.filter(j => j.status === 'in_progress').length;
    const completed = jobs.filter(j => j.status === 'completed').length;
    
    return { total, pending, inProgress, completed };
  };

  const stats = getJobStats();

  return (
    <div className="min-h-screen bg-gray-50">
      <SmartSidebar 
        currentView={currentView}
        onNavigate={setCurrentView}
        userRole="DESIGNER"
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      
      <div className={`p-6 transition-all duration-300 ${isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-70'}`}>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Designer Workbench</h1>
              <p className="text-gray-600 mt-1">Manage your assigned design tasks</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" onClick={loadJobs} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Jobs</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Clock className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Play className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">In Progress</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.inProgress}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Completed</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <h3 className="text-lg font-medium">Filter by Status</h3>
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Jobs Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Your Assigned Jobs ({filteredJobs.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                  Loading your jobs...
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Job ID</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Progress</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Assigned</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredJobs.map((job) => (
                        <TableRow key={job.id}>
                          <TableCell className="font-medium">{job.job_card_id}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{job.product_code}</div>
                              <div className="text-sm text-gray-500">{job.product_name}</div>
                            </div>
                          </TableCell>
                          <TableCell>{job.company_name || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(job.status)}>
                              <span className="flex items-center">
                                {getStatusIcon(job.status)}
                                <span className="ml-1">{job.status.replace('_', ' ').toUpperCase()}</span>
                              </span>
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getPriorityColor(job.priority)}>
                              {job.priority.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full" 
                                  style={{ width: `${job.progress}%` }}
                                />
                              </div>
                              <span className="text-sm">{job.progress}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span>{new Date(job.delivery_date).toLocaleDateString()}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {job.accepted_at ? (
                                <div>
                                  <div className="text-green-600">Accepted</div>
                                  <div className="text-xs text-gray-500">
                                    {new Date(job.accepted_at).toLocaleDateString()}
                                  </div>
                                </div>
                              ) : (
                                <div className="text-yellow-600">Pending</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewJob(job)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              
                              {job.status === 'pending' && (
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleAcceptJob(job)}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <ThumbsUp className="w-4 h-4 mr-1" />
                                  Accept
                                </Button>
                              )}
                              
                              {job.status !== 'pending' && job.status !== 'completed' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleUpdateStatus(job)}
                                >
                                  <Send className="w-4 h-4 mr-1" />
                                  Update
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Accept Job Modal */}
      <Dialog open={isAcceptModalOpen} onOpenChange={setIsAcceptModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Accept Job Assignment</DialogTitle>
          </DialogHeader>
          {selectedJob && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900">Job Details</h4>
                <p className="text-sm text-blue-700 mt-1">
                  <strong>Job ID:</strong> {selectedJob.job_card_id}
                </p>
                <p className="text-sm text-blue-700">
                  <strong>Product:</strong> {selectedJob.product_code} - {selectedJob.product_name}
                </p>
                <p className="text-sm text-blue-700">
                  <strong>Company:</strong> {selectedJob.company_name}
                </p>
                <p className="text-sm text-blue-700">
                  <strong>Due Date:</strong> {new Date(selectedJob.delivery_date).toLocaleDateString()}
                </p>
              </div>
              
              <div>
                <Label htmlFor="designer_notes">Initial Notes (Optional)</Label>
                <Textarea
                  id="designer_notes"
                  value={designerNotes}
                  onChange={(e) => setDesignerNotes(e.target.value)}
                  placeholder="Any initial thoughts or questions about this job..."
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsAcceptModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={confirmAcceptJob} className="bg-green-600 hover:bg-green-700">
                  <ThumbsUp className="w-4 h-4 mr-2" />
                  Accept Job
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Update Status Modal */}
      <Dialog open={isUpdateModalOpen} onOpenChange={setIsUpdateModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Job Status</DialogTitle>
          </DialogHeader>
          {selectedJob && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900">Job: {selectedJob.job_card_id}</h4>
                <p className="text-sm text-blue-700">
                  {selectedJob.product_code} - {selectedJob.product_name}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="new_status">Status</Label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="on_hold">On Hold</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="new_progress">Progress (%)</Label>
                  <Input
                    id="new_progress"
                    type="number"
                    min="0"
                    max="100"
                    value={newProgress}
                    onChange={(e) => setNewProgress(parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="designer_notes_update">Designer Notes</Label>
                <Textarea
                  id="designer_notes_update"
                  value={designerNotes}
                  onChange={(e) => setDesignerNotes(e.target.value)}
                  placeholder="Update on progress, issues, or completion notes..."
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsUpdateModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={confirmUpdateStatus}>
                  <Send className="w-4 h-4 mr-2" />
                  Update Status
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Job Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Job Details</DialogTitle>
          </DialogHeader>
          {selectedJob && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Job ID</Label>
                  <p className="text-lg font-semibold">{selectedJob.job_card_id}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Status</Label>
                  <Badge className={getStatusColor(selectedJob.status)}>
                    {selectedJob.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Product</Label>
                  <p className="font-medium">{selectedJob.product_code}</p>
                  <p className="text-sm text-gray-600">{selectedJob.product_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Company</Label>
                  <p>{selectedJob.company_name || 'N/A'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Priority</Label>
                  <Badge className={getPriorityColor(selectedJob.priority)}>
                    {selectedJob.priority.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Progress</Label>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${selectedJob.progress}%` }}
                      />
                    </div>
                    <span className="text-sm">{selectedJob.progress}%</span>
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Delivery Date</Label>
                <p>{new Date(selectedJob.delivery_date).toLocaleDateString()}</p>
              </div>
              {selectedJob.description && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Description</Label>
                  <p>{selectedJob.description}</p>
                </div>
              )}
              {selectedJob.designer_notes && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Designer Notes</Label>
                  <p>{selectedJob.designer_notes}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Assigned</Label>
                  <p className="text-sm">{new Date(selectedJob.created_at).toLocaleString()}</p>
                </div>
                {selectedJob.accepted_at && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Accepted</Label>
                    <p className="text-sm">{new Date(selectedJob.accepted_at).toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DesignerPortal;
