import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Loader2, 
  Play, 
  Pause, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  Clock, 
  User, 
  Calendar,
  Settings,
  Eye,
  FileText,
  AlertCircle
} from 'lucide-react';
import { productionApi, ProductionJobAssignment, ProductionDepartment, ProductionProcess } from '@/services/productionApi';

interface DepartmentWorkflowProps {
  departmentId: string;
  userRole: string;
  userId: string;
  permissions: string[];
}

const DepartmentWorkflow: React.FC<DepartmentWorkflowProps> = ({
  departmentId,
  userRole,
  userId,
  permissions
}) => {
  const [department, setDepartment] = useState<ProductionDepartment | null>(null);
  const [processes, setProcesses] = useState<ProductionProcess[]>([]);
  const [jobAssignments, setJobAssignments] = useState<ProductionJobAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<ProductionJobAssignment | null>(null);
  const [isStatusUpdateOpen, setIsStatusUpdateOpen] = useState(false);
  const [statusUpdateData, setStatusUpdateData] = useState({
    status: '',
    remarks: '',
    attachments: []
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load department details
      const deptDetails = await productionApi.getDepartmentDetails(departmentId);
      setDepartment(deptDetails);
      setProcesses(deptDetails.processes);

      // Load job assignments for this department
      const jobs = await productionApi.getJobAssignments({ departmentId });
      setJobAssignments(jobs);

    } catch (err: any) {
      console.error('Error loading department workflow:', err);
      setError(err.response?.data?.message || 'Failed to load department data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [departmentId]);

  const handleStatusUpdate = async (jobId: string) => {
    try {
      await productionApi.updateJobAssignmentStatus(jobId, statusUpdateData);
      setIsStatusUpdateOpen(false);
      setSelectedJob(null);
      setStatusUpdateData({ status: '', remarks: '', attachments: [] });
      await loadData(); // Reload data
    } catch (err: any) {
      console.error('Error updating job status:', err);
      setError(err.response?.data?.message || 'Failed to update job status');
    }
  };

  const canUpdateJob = (job: ProductionJobAssignment) => {
    return permissions.includes('UPDATE_JOB_STATUS') || 
           job.assigned_to_user_id === userId ||
           userRole === 'HOD' ||
           userRole === 'SUPERVISOR';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'IN_PROGRESS':
        return <Play className="h-5 w-5 text-blue-500" />;
      case 'ON_HOLD':
        return <Pause className="h-5 w-5 text-yellow-500" />;
      case 'REWORK':
        return <RefreshCw className="h-5 w-5 text-orange-500" />;
      case 'PENDING':
        return <Clock className="h-5 w-5 text-gray-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ON_HOLD':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'REWORK':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'PENDING':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MEDIUM':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'LOW':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getProcessStageForJob = (job: ProductionJobAssignment) => {
    const processIndex = processes.findIndex(p => p.id === job.process_id);
    return processIndex >= 0 ? processIndex + 1 : 0;
  };

  const groupJobsByProcess = () => {
    const grouped: { [processId: string]: ProductionJobAssignment[] } = {};
    
    jobAssignments.forEach(job => {
      if (!grouped[job.process_id]) {
        grouped[job.process_id] = [];
      }
      grouped[job.process_id].push(job);
    });

    return grouped;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading department workflow...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!department) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>Department not found</AlertDescription>
      </Alert>
    );
  }

  const groupedJobs = groupJobsByProcess();

  return (
    <div className="space-y-6">
      {/* Department Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <CardTitle className="text-2xl">{department.name} ({department.code})</CardTitle>
              <CardDescription>{department.description}</CardDescription>
              {department.head_name && (
                <p className="text-sm text-gray-600 mt-2">
                  <User className="h-4 w-4 inline mr-1" />
                  Department Head: {department.head_name}
                </p>
              )}
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{processes.length}</p>
                <p className="text-sm text-gray-600">Processes</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{department.activeJobsCount}</p>
                <p className="text-sm text-gray-600">Active Jobs</p>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Process Workflow */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">Production Workflow</h2>
        
        {processes.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>No processes defined for this department</AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {processes.map((process, index) => {
              const processJobs = groupedJobs[process.id] || [];
              const completedJobs = processJobs.filter(j => j.status === 'COMPLETED').length;
              const inProgressJobs = processJobs.filter(j => j.status === 'IN_PROGRESS').length;
              const pendingJobs = processJobs.filter(j => j.status === 'PENDING').length;

              return (
                <Card key={process.id} className="relative">
                  {/* Process Step Indicator */}
                  <div className="absolute -left-3 top-6 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {index + 1}
                  </div>
                  
                  <CardHeader className="pl-8">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                      <div>
                        <CardTitle className="text-lg">{process.name}</CardTitle>
                        <CardDescription>
                          Code: {process.code} | 
                          Estimated Duration: {process.estimated_duration_hours}h
                        </CardDescription>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm">
                        <div className="text-center">
                          <p className="font-bold text-gray-600">{processJobs.length}</p>
                          <p className="text-gray-500">Total</p>
                        </div>
                        <div className="text-center">
                          <p className="font-bold text-yellow-600">{pendingJobs}</p>
                          <p className="text-gray-500">Pending</p>
                        </div>
                        <div className="text-center">
                          <p className="font-bold text-blue-600">{inProgressJobs}</p>
                          <p className="text-gray-500">Active</p>
                        </div>
                        <div className="text-center">
                          <p className="font-bold text-green-600">{completedJobs}</p>
                          <p className="text-gray-500">Done</p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pl-8">
                    {processJobs.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No jobs assigned to this process</p>
                    ) : (
                      <div className="space-y-3">
                        {processJobs.map((job) => (
                          <div 
                            key={job.id} 
                            className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-start gap-3">
                                {getStatusIcon(job.status)}
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="font-semibold text-gray-900">
                                      {job.job_card} - {job.company_name}
                                    </h4>
                                    <Badge className={getPriorityColor(job.priority)}>
                                      {job.priority}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-gray-600 mt-1">
                                    {job.product_item_code}
                                    {job.brand && ` | ${job.brand}`}
                                  </p>
                                  {job.assigned_to_name && (
                                    <p className="text-sm text-gray-600 mt-1">
                                      <User className="h-4 w-4 inline mr-1" />
                                      Assigned to: {job.assigned_to_name}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
                                    <span>
                                      <Calendar className="h-4 w-4 inline mr-1" />
                                      Assigned: {new Date(job.assigned_date).toLocaleDateString()}
                                    </span>
                                    {job.estimated_completion_date && (
                                      <span>
                                        Due: {new Date(job.estimated_completion_date).toLocaleDateString()}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Badge className={getStatusColor(job.status)}>
                                  {job.status}
                                </Badge>
                                
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="outline" size="sm">
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-2xl">
                                    <DialogHeader>
                                      <DialogTitle>{job.job_card} - Job Details</DialogTitle>
                                      <DialogDescription>
                                        {job.company_name} | {job.product_item_code}
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <Label className="text-sm font-medium">Status</Label>
                                          <div className="flex items-center gap-2 mt-1">
                                            {getStatusIcon(job.status)}
                                            <Badge className={getStatusColor(job.status)}>
                                              {job.status}
                                            </Badge>
                                          </div>
                                        </div>
                                        <div>
                                          <Label className="text-sm font-medium">Priority</Label>
                                          <Badge className={`${getPriorityColor(job.priority)} mt-1`}>
                                            {job.priority}
                                          </Badge>
                                        </div>
                                      </div>
                                      {job.notes && (
                                        <div>
                                          <Label className="text-sm font-medium">Notes</Label>
                                          <p className="text-sm text-gray-600 mt-1 p-3 bg-gray-50 rounded">
                                            {job.notes}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </DialogContent>
                                </Dialog>

                                {canUpdateJob(job) && (
                                  <Dialog open={isStatusUpdateOpen && selectedJob?.id === job.id} 
                                         onOpenChange={(open) => {
                                           setIsStatusUpdateOpen(open);
                                           if (open) setSelectedJob(job);
                                           else setSelectedJob(null);
                                         }}>
                                    <DialogTrigger asChild>
                                      <Button variant="outline" size="sm">
                                        <Settings className="h-4 w-4" />
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Update Job Status</DialogTitle>
                                        <DialogDescription>
                                          Update status for {job.job_card} - {job.process_name}
                                        </DialogDescription>
                                      </DialogHeader>
                                      <div className="space-y-4">
                                        <div>
                                          <Label htmlFor="status">New Status</Label>
                                          <Select 
                                            value={statusUpdateData.status} 
                                            onValueChange={(value) => 
                                              setStatusUpdateData(prev => ({ ...prev, status: value }))
                                            }
                                          >
                                            <SelectTrigger>
                                              <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="PENDING">Pending</SelectItem>
                                              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                              <SelectItem value="ON_HOLD">On Hold</SelectItem>
                                              <SelectItem value="COMPLETED">Completed</SelectItem>
                                              <SelectItem value="REWORK">Rework</SelectItem>
                                              <SelectItem value="CANCELLED">Cancelled</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        
                                        <div>
                                          <Label htmlFor="remarks">Remarks</Label>
                                          <Textarea
                                            placeholder="Add remarks about this status update..."
                                            value={statusUpdateData.remarks}
                                            onChange={(e) => 
                                              setStatusUpdateData(prev => ({ ...prev, remarks: e.target.value }))
                                            }
                                          />
                                        </div>
                                        
                                        <div className="flex justify-end gap-2">
                                          <Button 
                                            variant="outline" 
                                            onClick={() => setIsStatusUpdateOpen(false)}
                                          >
                                            Cancel
                                          </Button>
                                          <Button 
                                            onClick={() => handleStatusUpdate(job.id)}
                                            disabled={!statusUpdateData.status}
                                          >
                                            Update Status
                                          </Button>
                                        </div>
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                  
                  {/* Process Progress Indicator */}
                  {processJobs.length > 0 && (
                    <div className="px-8 pb-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Process Progress</span>
                        <span>{completedJobs}/{processJobs.length} completed</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(completedJobs / processJobs.length) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Connection Line to Next Process */}
                  {index < processes.length - 1 && (
                    <div className="absolute -bottom-4 left-3 w-0.5 h-8 bg-gray-300" />
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DepartmentWorkflow;