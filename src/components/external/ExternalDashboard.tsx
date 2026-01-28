import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Play, CheckCircle, Loader2, Search, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { getApiUrl } from '@/utils/apiConfig';
import { useSocket } from '@/services/socketService.tsx';
import { MainLayout } from '@/components/layout/MainLayout';

interface ExternalJob {
  id: number;
  jobNumber: string;
  product_name?: string;
  current_step?: string;
  current_department?: string;
  workflow_status?: string;
  status_message?: string;
  quantity?: number;
  workflow?: any[];
}

const ExternalDashboard: React.FC<{ onLogout?: () => void }> = ({ onLogout }) => {
  const { socket } = useSocket();
  const [jobs, setJobs] = useState<ExternalJob[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<ExternalJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [completing, setCompleting] = useState<number | null>(null);
  const [starting, setStarting] = useState<number | null>(null);
  const [selectedJob, setSelectedJob] = useState<ExternalJob | null>(null);
  const [outputQty, setOutputQty] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const apiUrl = getApiUrl();

  const loadJobs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`${apiUrl}/api/jobs?department=External&status=in_progress,pending`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const jobsList = data.jobs || [];
        
        const jobsWithWorkflow = await Promise.all(
          jobsList.map(async (job: any) => {
            try {
              const workflowResponse = await fetch(`${apiUrl}/api/workflow/${job.id}`, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              });
              const workflowData = await workflowResponse.json();
              return {
                ...job,
                workflow: workflowData.workflow || []
              };
            } catch (error) {
              return { ...job, workflow: [] };
            }
          })
        );

        setJobs(jobsWithWorkflow);
        setFilteredJobs(jobsWithWorkflow);
      } else {
        toast.error('Failed to load external jobs');
      }
    } catch (error) {
      console.error('Error loading jobs:', error);
      toast.error('Failed to load external jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();

    if (socket) {
      socket.on('external:job_ready', (data: any) => {
        toast.info(`New job ready: ${data.jobId}`);
        loadJobs();
      });

      socket.on('workflow_step_ready', (data: any) => {
        if (data.department === 'External') {
          loadJobs();
        }
      });

      return () => {
        socket.off('external:job_ready');
        socket.off('workflow_step_ready');
      };
    }
  }, [socket]);

  useEffect(() => {
    let filtered = [...jobs];

    if (searchTerm) {
      filtered = filtered.filter(job =>
        job.jobNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.product_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(job => job.workflow_status === statusFilter);
    }

    setFilteredJobs(filtered);
  }, [searchTerm, statusFilter, jobs]);

  const getCurrentStep = (job: ExternalJob) => {
    if (!job.workflow || job.workflow.length === 0) return null;
    return job.workflow.find(
      (step: any) => step.status === 'in_progress' || step.status === 'pending'
    ) || null;
  };

  const handleStartStep = async (job: ExternalJob) => {
    const currentStep = getCurrentStep(job);
    if (!currentStep) {
      toast.error('No active step found');
      return;
    }

    try {
      setStarting(job.id);
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${apiUrl}/api/workflow/${job.id}/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sequenceNumber: currentStep.sequence_number })
      });

      if (response.ok) {
        toast.success(`Started ${currentStep.step_name}`);
        await loadJobs();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to start step');
      }
    } catch (error) {
      toast.error('Failed to start step');
    } finally {
      setStarting(null);
    }
  };

  const handleCompleteStep = async (job: ExternalJob) => {
    const currentStep = getCurrentStep(job);
    if (!currentStep) {
      toast.error('No active step found');
      return;
    }

    try {
      setCompleting(job.id);
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${apiUrl}/api/workflow/${job.id}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sequenceNumber: currentStep.sequence_number,
          outputQty: outputQty ? parseInt(outputQty) : null,
          notes: notes || ''
        })
      });

      if (response.ok) {
        toast.success(`Completed ${currentStep.step_name}`);
        setSelectedJob(null);
        setOutputQty('');
        setNotes('');
        await loadJobs();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to complete step');
      }
    } catch (error) {
      toast.error('Failed to complete step');
    } finally {
      setCompleting(null);
    }
  };

  const getStatusBadge = (status?: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'secondary',
      in_progress: 'default',
      completed: 'outline'
    };
    return (
      <Badge variant={variants[status || 'pending'] || 'default'}>
        {(status || 'pending').replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  return (
    <MainLayout
      currentPage="external-dashboard"
      pageTitle="External Operations Dashboard"
      pageDescription="Manage outsourced operations"
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">External Operations Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage outsourced operations</p>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search jobs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border rounded-md"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : filteredJobs.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              No jobs found
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredJobs.map((job) => {
              const currentStep = getCurrentStep(job);
              return (
                <Card key={job.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{job.jobNumber}</CardTitle>
                        <p className="text-sm text-gray-600 mt-1">
                          {job.product_name || 'N/A'} • Qty: {job.quantity || 'N/A'}
                        </p>
                      </div>
                      {getStatusBadge(job.workflow_status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {currentStep ? (
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm font-medium">Current Step</p>
                          <p className="text-lg">{currentStep.step_name}</p>
                          <p className="text-sm text-gray-600">{currentStep.status_message}</p>
                        </div>
                        <div className="flex gap-2">
                          {currentStep.status === 'pending' && (
                            <Button
                              onClick={() => handleStartStep(job)}
                              disabled={starting === job.id}
                              size="sm"
                            >
                              {starting === job.id ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              ) : (
                                <Play className="w-4 h-4 mr-2" />
                              )}
                              Start
                            </Button>
                          )}
                          {(currentStep.status === 'in_progress' || currentStep.status === 'pending') && (
                            <Button
                              onClick={() => setSelectedJob(job)}
                              variant="outline"
                              size="sm"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Complete
                            </Button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500">No active step</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {selectedJob && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Complete Step</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-medium">{getCurrentStep(selectedJob)?.step_name}</p>
                  <p className="text-sm text-gray-600">Job: {selectedJob.jobNumber}</p>
                </div>
                <div>
                  <Label htmlFor="outputQty">Output Quantity (optional)</Label>
                  <Input
                    id="outputQty"
                    type="number"
                    value={outputQty}
                    onChange={(e) => setOutputQty(e.target.value)}
                    placeholder="Enter quantity"
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter notes"
                    rows={3}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedJob(null);
                      setOutputQty('');
                      setNotes('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => handleCompleteStep(selectedJob)}
                    disabled={completing === selectedJob.id}
                  >
                    {completing === selectedJob.id ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <CheckCircle className="w-4 h-4 mr-2" />
                    )}
                    Complete
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default ExternalDashboard;
