import React, { useState } from 'react';
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

interface DesignerWorkbenchProps {
  onLogout?: () => void;
}

const DesignerWorkbench: React.FC<DesignerWorkbenchProps> = ({ onLogout }) => {
  const [selectedJob, setSelectedJob] = useState<PrepressJob | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    search: ''
  });
  const [isRemarkDialogOpen, setIsRemarkDialogOpen] = useState(false);
  const [remark, setRemark] = useState('');
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);

  const { data: myJobs, isLoading: jobsLoading, refetch: refetchJobs } = useMyPrepressJobs(filters);
  const { data: activity } = usePrepressJobActivity(selectedJob?.id || '');

  // Mutations
  const startJobMutation = useStartPrepressJob();
  const pauseJobMutation = usePausePrepressJob();
  const resumeJobMutation = useResumePrepressJob();
  const submitJobMutation = useSubmitPrepressJob();
  const addRemarkMutation = useAddPrepressRemark();

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value === 'all' ? '' : value }));
  };

  const handleStartJob = (jobId: string) => {
    startJobMutation.mutate(jobId, {
      onSuccess: () => {
        toast.success('Work started successfully');
        refetchJobs();
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
      // Fallback: reload the page to trigger authentication check
      window.location.reload();
    }
  };

  const getStatusColor = (status: PrepressStatus) => {
    switch (status) {
      case 'PENDING': return 'bg-gray-100 text-gray-700';
      case 'ASSIGNED': return 'bg-blue-100 text-blue-700';
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-700';
      case 'PAUSED': return 'bg-orange-100 text-orange-700';
      case 'HOD_REVIEW': return 'bg-purple-100 text-purple-700';
      case 'COMPLETED': return 'bg-green-100 text-green-700';
      case 'REJECTED': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
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
            >
              <Pause className="h-4 w-4 mr-2" />
              Pause
            </Button>
            <Button
              size="sm"
              onClick={() => handleSubmitJob(job.id)}
              disabled={submitJobMutation.isPending}
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
    { key: 'ASSIGNED', title: 'Assigned', color: 'bg-blue-50', textColor: 'text-blue-700' },
    { key: 'IN_PROGRESS', title: 'In Progress', color: 'bg-yellow-50', textColor: 'text-yellow-700' },
    { key: 'PAUSED', title: 'Paused', color: 'bg-orange-50', textColor: 'text-orange-700' },
    { key: 'HOD_REVIEW', title: 'Under Review', color: 'bg-purple-50', textColor: 'text-purple-700' },
    { key: 'COMPLETED', title: 'Completed', color: 'bg-green-50', textColor: 'text-green-700' },
    { key: 'REJECTED', title: 'Rejected', color: 'bg-red-50', textColor: 'text-red-700' }
  ] as const;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Designer Workbench</h1>
            <p className="text-gray-600 mt-1">Your personal prepress job queue and work management</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={handleLogout} variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                    <p className="text-2xl font-bold text-gray-900">{myJobs?.length || 0}</p>
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
                      {jobsByStatus['IN_PROGRESS']?.length || 0}
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
                      {jobsByStatus['COMPLETED']?.length || 0}
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
                    <p className="text-sm font-medium text-gray-600">Under Review</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {jobsByStatus['HOD_REVIEW']?.length || 0}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Eye className="h-6 w-6 text-purple-600" />
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                  <SelectTrigger>
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

        {/* Job Queue */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              My Job Queue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
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
                  <div className="space-y-2 min-h-[300px]">
                    <AnimatePresence>
                      {jobsByStatus[column.key as PrepressStatus]?.map((job) => (
                        <motion.div
                          key={job.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          className="p-3 bg-white border rounded-lg shadow-sm"
                        >
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-sm">{job.job_card_id_display}</h4>
                              <Badge className={getPriorityColor(job.priority as PrepressPriority)}>
                                {job.priority}
                              </Badge>
                            </div>
                            
                            <div className="space-y-1">
                              <p className="text-xs text-gray-600">{job.company_name}</p>
                              <p className="text-xs text-gray-500">{job.product_type}</p>
                              {job.due_date && (
                                <p className="text-xs text-orange-600">
                                  📅 Due: {new Date(job.due_date).toLocaleDateString()}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center justify-between">
                              <Badge className={getStatusColor(job.status)}>
                                {job.status.replace('_', ' ')}
                              </Badge>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setSelectedJob(job)}
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
          </CardContent>
        </Card>

        {/* Job Detail Dialog */}
        <Dialog open={!!selectedJob} onOpenChange={() => setSelectedJob(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Job Details - {selectedJob?.job_card_id_display}</DialogTitle>
              <DialogDescription>
                View job details, add remarks, and manage your work
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
                    <Badge className={getPriorityColor(selectedJob.priority as PrepressPriority)}>
                      {selectedJob.priority}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    <Badge className={getStatusColor(selectedJob.status)}>
                      {selectedJob.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Due Date</Label>
                    <p className="text-sm text-gray-600">
                      {selectedJob.due_date ? new Date(selectedJob.due_date).toLocaleDateString() : 'Not set'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Created</Label>
                    <p className="text-sm text-gray-600">
                      {new Date(selectedJob.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Job Description */}
                {selectedJob.special_instructions && (
                  <div>
                    <Label className="text-sm font-medium">Special Instructions</Label>
                    <p className="text-sm text-gray-600 mt-1 p-3 bg-gray-50 rounded">
                      {selectedJob.special_instructions}
                    </p>
                  </div>
                )}

                {/* HOD Remarks */}
                {selectedJob.hod_last_remark && (
                  <div>
                    <Label className="text-sm font-medium">HOD Remarks</Label>
                    <p className="text-sm text-gray-600 mt-1 p-3 bg-blue-50 rounded border-l-4 border-blue-400">
                      {selectedJob.hod_last_remark}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  {getActionButtons(selectedJob)}
                  
                  <Dialog open={isRemarkDialogOpen} onOpenChange={setIsRemarkDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <MessageSquare className="h-4 w-4 mr-2" />
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
                        <Button onClick={handleAddRemark} disabled={!remark.trim() || addRemarkMutation.isPending}>
                          {addRemarkMutation.isPending ? 'Adding...' : 'Add Remark'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Files
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
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
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={() => setIsUploadDialogOpen(false)}>
                          Upload
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

export default DesignerWorkbench;
