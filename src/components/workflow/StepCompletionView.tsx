import React, { useState, useEffect } from 'react';
import { api, authAPI } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Play, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getApiUrl } from '@/utils/apiConfig';

interface WorkflowStep {
  id: string;
  sequence_number: number;
  step_name: string;
  department: string;
  status: string;
  status_message: string;
  started_at?: string;
  completed_at?: string;
  output_qty?: number;
}

interface Job {
  id: number;
  jobNumber: string;
  product_name?: string;
  current_step?: string;
  current_department?: string;
  workflow_status?: string;
  workflow?: WorkflowStep[];
}

const StepCompletionView: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState<number | null>(null);
  const [starting, setStarting] = useState<number | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [outputQty, setOutputQty] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Load current user
  useEffect(() => {
    const loadUser = async () => {
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          setUser(JSON.parse(userStr));
        } else {
          // Try to get from API
          const currentUser = await authAPI.getCurrentUser();
          setUser(currentUser);
        }
      } catch (error) {
        console.error('Error loading user:', error);
      }
    };
    loadUser();
  }, []);

  // Get user's department from role
  const getUserDepartment = () => {
    const role = user?.role || '';
    if (role.includes('FINISHING')) return 'Finishing';
    if (role.includes('LOGISTICS')) return 'Logistics';
    if (role.includes('PREPRESS')) return 'Prepress';
    if (role.includes('CUTTING')) return 'Cutting';
    if (role.includes('OFFSET')) return 'Offset Printing';
    if (role.includes('DIGITAL')) return 'Digital Printing';
    if (role.includes('PRODUCTION')) return 'Production';
    if (role.includes('INVENTORY')) return 'Inventory';
    if (role.includes('EXTERNAL')) return 'External';
    return null;
  };

  const loadJobs = async () => {
    try {
      setLoading(true);
      // Get jobs where current_department matches user's department
      const department = getUserDepartment();
      if (!department) {
        toast.error('Your role does not have an associated department.');
        return;
      }

      // Fetch jobs filtered by department
      const token = localStorage.getItem('authToken');
      const apiUrl = getApiUrl();
      const response = await fetch(
        `${apiUrl}/api/jobs?department=${encodeURIComponent(department)}&workflow_status=in_progress,pending`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load jobs');
      }

      const data = await response.json();

      // Load workflow for each job
      const jobsWithWorkflow = await Promise.all(
        (data.jobs || []).map(async (job: any) => {
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
    } catch (error: any) {
      console.error('Error loading jobs:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to load jobs',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, [user]);

  const getCurrentStep = (job: Job): WorkflowStep | null => {
    if (!job.workflow || job.workflow.length === 0) return null;
    return job.workflow.find(
      step => step.status === 'in_progress' || step.status === 'pending'
    ) || null;
  };

  const handleStartStep = async (job: Job) => {
    const currentStep = getCurrentStep(job);
    if (!currentStep) {
      toast.error('No active step found for this job');
      return;
    }

    try {
      setStarting(job.id);
      const token = localStorage.getItem('authToken');
      const apiUrl = getApiUrl();
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
    } catch (error: any) {
      toast.error('Failed to start step');
    } finally {
      setStarting(null);
    }
  };

  const handleCompleteStep = async (job: Job) => {
    const currentStep = getCurrentStep(job);
    if (!currentStep) {
      toast.error('No active step found for this job');
      return;
    }

    try {
      setCompleting(job.id);
      const token = localStorage.getItem('authToken');
      const apiUrl = getApiUrl();
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
    } catch (error: any) {
      toast.error('Failed to complete step');
    } finally {
      setCompleting(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'secondary',
      in_progress: 'default',
      completed: 'outline',
      inactive: 'secondary'
    };
    return (
      <Badge variant={variants[status] || 'default'}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Step Completion</h1>
        <p className="text-gray-600 mt-1">
          Manage workflow steps for jobs in your department ({getUserDepartment()})
        </p>
      </div>

      <div className="grid gap-4">
        {jobs.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              No jobs found in your department
            </CardContent>
          </Card>
        ) : (
          jobs.map((job) => {
            const currentStep = getCurrentStep(job);
            return (
              <Card key={job.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{job.jobNumber}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        {job.product_name || 'N/A'}
                      </p>
                    </div>
                    {getStatusBadge(job.workflow_status || 'pending')}
                  </div>
                </CardHeader>
                <CardContent>
                  {currentStep ? (
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium">Current Step</p>
                        <p className="text-lg">{currentStep.step_name}</p>
                        <p className="text-sm text-gray-600">
                          {currentStep.department} • {currentStep.status_message}
                        </p>
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
          })
        )}
      </div>

      {/* Complete Step Modal/Dialog */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Complete Step</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-medium">
                  {getCurrentStep(selectedJob)?.step_name}
                </p>
                <p className="text-sm text-gray-600">
                  Job: {selectedJob.jobNumber}
                </p>
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
  );
};

export default StepCompletionView;
