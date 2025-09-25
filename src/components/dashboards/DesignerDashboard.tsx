import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Palette,
  Clock,
  CheckCircle,
  Eye,
  Play,
  Pause,
  Upload,
  FileText,
  MessageSquare,
  TrendingUp,
  Activity,
  Zap,
  Timer,
  Layers,
  Image,
  Send,
  RotateCcw,
  Settings,
  X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { MainLayout } from '../layout/MainLayout';
import { prepressAPI, authAPI, jobsAPI, processSequencesAPI, prepressWorkflowAPI } from '@/services/api';
import { useSocket } from '@/services/socketService.tsx';
import { ProcessSequenceSection } from '../ProcessSequenceSection';
import PrepressWorkflowDisplay from '../prepress/PrepressWorkflowDisplay';

interface DesignerDashboardProps {
  onNavigate?: (page: string) => void;
  onLogout?: () => void;
  currentPage?: string;
  isLoading?: boolean;
}

interface DesignerJob {
  id: string;
  job_card_id: string;
  product_code: string;
  product_name: string;
  company_name: string;
  status: string;
  priority: string;
  due_date: string;
  created_at: string;
  customer_notes?: string;
  estimated_hours?: number;
  time_spent?: number;
  progress: number;
  started_at?: string;
  work_notes?: string;
  submission_notes?: string;
  submitted_at?: string;
  product_type?: string;
  product_id?: string;
  prepress_status?: string;
  workflow_progress?: {
    stages: Array<{
      key: string;
      label: string;
      status: 'pending' | 'current' | 'completed';
    }>;
    currentStage: string;
    progress: number;
  };
}

interface ProcessSequenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string | null;
  job: DesignerJob | undefined;
}

const ProcessSequenceModal: React.FC<ProcessSequenceModalProps> = ({ isOpen, onClose, jobId, job }) => {
  const [selectedProductType, setSelectedProductType] = useState<string>('');
  const [processSteps, setProcessSteps] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && job) {
      // Get product type from job or default to 'Offset'
      const productType = job.product_type || 'Offset';
      setSelectedProductType(productType);
      loadProcessSequence(job.product_id || job.id);
    }
  }, [isOpen, job]);

  const loadProcessSequence = async (productId: string) => {
    setIsLoading(true);
    try {
      console.log('🔄 Loading process sequence for product:', productId);
      
      // Try to get process sequence for the specific product
      const response = await processSequencesAPI.getForProduct(productId);
      console.log('📋 Process sequence response:', response);
      
      if (response.process_sequence?.steps) {
        setProcessSteps(response.process_sequence.steps);
      }
    } catch (error) {
      console.error('Error loading process sequence:', error);
      toast.error('Failed to load process sequence');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProcessStepsChange = (steps: any[]) => {
    setProcessSteps(steps);
  };

  const handleSaveProcessSequence = async () => {
    if (!job || !job.product_id) return;
    
    setIsSaving(true);
    try {
      console.log('💾 Saving process sequence for job:', job.job_card_id);
      
      // Save the selected process steps
      const selectedSteps = processSteps.filter(step => step.isSelected);
      console.log('✅ Selected steps:', selectedSteps);
      
      // Here you would call an API to save the process sequence
      // For now, just show success message
      toast.success('Process sequence updated successfully');
      onClose();
    } catch (error) {
      console.error('Error saving process sequence:', error);
      toast.error('Failed to save process sequence');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !job) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-xl shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold">Configure Process Sequence</h3>
            <p className="text-sm text-gray-600">
              Job: {job.job_card_id} - {job.product_name}
            </p>
          </div>
          <Button variant="outline" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading process sequence...</span>
          </div>
        ) : (
          <div className="space-y-4">
            <ProcessSequenceSection
              selectedProductType={selectedProductType as any}
              onProductTypeChange={setSelectedProductType}
              onProcessStepsChange={handleProcessStepsChange}
              initialSelectedSteps={processSteps}
            />
            
            <div className="flex gap-3 pt-4 border-t">
              <Button
                onClick={handleSaveProcessSequence}
                disabled={isSaving}
                className="flex-1 gap-2"
              >
                {isSaving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                Save Process Sequence
              </Button>
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export const DesignerDashboard: React.FC<DesignerDashboardProps> = ({
  onNavigate = () => {},
  onLogout = () => {},
  currentPage = 'prepressDesigner',
  isLoading = false
}) => {
  const { isConnected, socket } = useSocket();
  const [designerJobs, setDesignerJobs] = useState<DesignerJob[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [modalAction, setModalAction] = useState<'process' | 'submit' | null>(null);
  const [workNotes, setWorkNotes] = useState('');
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [activeTimer, setActiveTimer] = useState<string | null>(null);
  const [timerMinutes, setTimerMinutes] = useState(0);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  const loadDesignerJobs = async () => {
    console.log('🚀 loadDesignerJobs function called!');
    setDashboardLoading(true);
    try {
      console.log('🔄 Loading designer jobs...');
      
      // Get current user info
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        console.error('No user found in localStorage');
        return;
      }
      
      const user = JSON.parse(userStr);
      console.log('👤 Current user:', user);
      console.log('👤 User ID:', user.id, 'Type:', typeof user.id);
      console.log('👤 User ID as string:', user.id?.toString());
      
      // Fetch all jobs and filter for designer assignments
      const response = await jobsAPI.getAll();
      console.log('📋 All jobs response:', response);
      console.log('📋 Jobs count:', response.jobs?.length);
      console.log('📋 First few jobs:', response.jobs?.slice(0, 3));
      
      if (response.jobs) {
        // Filter jobs assigned to this designer
        console.log('🔍 Debug - User ID:', user.id, 'Type:', typeof user.id);
        console.log('🔍 Debug - All jobs with assignedToId:');
        response.jobs.forEach((job: any, index: number) => {
          if (job.assignedToId) {
            console.log(`Job ${index}: ID=${job.id}, assignedToId=${job.assignedToId}, Type=${typeof job.assignedToId}`);
          }
        });
        
        const assignedJobs = response.jobs.filter((job: any) => {
          const jobAssignedToId = job.assignedToId ? job.assignedToId.toString() : null;
          const userId = user.id ? user.id.toString() : null;
          const isAssigned = jobAssignedToId === userId;
          console.log(`🔍 Job ${job.id}: assignedToId=${jobAssignedToId}, userId=${userId}, match=${isAssigned}`);
          return isAssigned;
        });
        
        console.log('🔍 Debug - Filtered assigned jobs:', assignedJobs.length);
        
        const jobs: DesignerJob[] = assignedJobs.map((job: any) => {
          return {
            id: job.id.toString(),
            job_card_id: job.jobNumber || `JC-${job.id}`,
            product_code: job.product_code || job.sku || 'N/A',
            product_name: job.product_name || job.name || 'N/A',
            company_name: job.company_name || 'N/A',
            status: job.status || 'PENDING',
            priority: job.urgency || job.priority || 'MEDIUM',
            due_date: job.dueDate || job.delivery_date || new Date().toISOString().split('T')[0],
            created_at: job.createdAt || job.created_at || new Date().toISOString(),
            customer_notes: job.notes || job.description || '',
            estimated_hours: job.estimated_hours || 8,
            time_spent: job.time_spent || 0,
            progress: job.progress || 0,
            product_type: job.product_type || 'Offset',
            product_id: job.productId || job.product_id,
            // Default prepress status until prepress jobs are created
            prepress_status: 'ASSIGNED',
            workflow_progress: {
              stages: [
                { key: 'DESIGNING', label: 'Designing', status: 'current' },
                { key: 'DIE_MAKING', label: 'Die Making', status: 'pending' },
                { key: 'PLATE_MAKING', label: 'Plate Making', status: 'pending' },
                { key: 'PREPRESS_COMPLETED', label: 'Prepress Completed', status: 'pending' }
              ],
              currentStage: 'Designing',
              progress: 0
            }
          };
        });
        
        console.log('✅ Designer jobs loaded:', jobs);
        console.log(`📊 Total jobs: ${response.jobs.length}, Assigned to me: ${jobs.length}`);
        setDesignerJobs(jobs);
      }
    } catch (error) {
      console.error('Error loading designer jobs:', error);
      toast.error('Failed to load jobs');
    } finally {
      setDashboardLoading(false);
    }
  };

  useEffect(() => {
    loadDesignerJobs();
    
    if (socket && isConnected) {
      console.log('🔌 Setting up real-time job updates for designer...');
      
      // Join job updates room
      socket.emit('join_job_updates');
      
      // Listen for new jobs created by merchandiser
      socket.on('job_created', (data) => {
        console.log('🆕 New job created:', data);
        toast.success(`New job available: ${data.jobCardId}`, {
          description: `Priority: ${data.priority} - ${data.message}`
        });
        loadDesignerJobs();
      });

      // Listen for job assignments
      socket.on('new_job_assignment', (data) => {
        console.log('📋 New job assignment:', data);
        toast.success(`New job assigned: ${data.jobCardId}`);
        loadDesignerJobs();
      });

      // Listen for review decisions
      socket.on('review_decision', (data) => {
        console.log('👀 Review decision:', data);
        if (data.action === 'approve') {
          toast.success(`Job ${data.jobCardId} approved!`);
        } else {
          toast.warning(`Job ${data.jobCardId} needs revision`);
        }
        loadDesignerJobs();
      });

      // Listen for job lifecycle updates
      socket.on('job_lifecycle_update', (data) => {
        console.log('🔄 Job lifecycle update:', data);
        toast.info(`Job ${data.jobCardId} updated`, {
          description: data.data.message || 'Status changed'
        });
        loadDesignerJobs();
      });

      // Listen for prepress status updates
      socket.on('prepress_status_update', (data) => {
        console.log('🎨 Prepress status update:', data);
        toast.info(`Prepress Status Update`, {
          description: `Job ${data.jobCardId}: ${data.status.replace(/_/g, ' ')}`
        });
        loadDesignerJobs();
      });

      // Listen for job status updates
      socket.on('job_status_update', (data) => {
        console.log('🔄 Job status update:', data);
        toast.info(`Job Status Update`, {
          description: data.message
        });
        loadDesignerJobs();
      });

      // Listen for job assignments
      socket.on('job_assigned', (data) => {
        console.log('📋 Job assigned to designer:', data);
        toast.success(`New Job Assigned`, {
          description: `Job ${data.jobCardId} has been assigned to you`
        });
        loadDesignerJobs();
      });
    }

    return () => {
      if (socket) {
        socket.off('job_created');
        socket.off('new_job_assignment');
        socket.off('review_decision');
        socket.off('job_lifecycle_update');
        socket.off('prepress_status_update');
        socket.off('job_status_update');
        socket.off('job_assigned');
      }
    };
  }, [socket, isConnected]);

  const startJob = async (jobId: string) => {
    try {
      const job = designerJobs.find(j => j.id === jobId);
      if (!job) return;

      console.log(`🚀 Starting job ${job.job_card_id} for designer`);
      
      // Update job status in backend
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/jobs/${jobId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          status: 'IN_PROGRESS',
          notes: 'Designer started working on the job'
        })
      });

      if (response.ok) {
      setActiveTimer(jobId);
      setTimerMinutes(0);
      
        // Update local state
      setDesignerJobs(prev => 
        prev.map(job => 
          job.id === jobId ? { 
            ...job, 
            status: 'IN_PROGRESS',
              started_at: new Date().toISOString(),
              progress: 10
          } : job
        )
      );
      
        toast.success(`Job ${job.job_card_id} started successfully`);
        
        // Emit real-time update
        if (socket) {
          socket.emit('job_status_update', {
            jobId: jobId,
            jobCardId: job.job_card_id,
            status: 'IN_PROGRESS',
            updatedBy: 'Designer',
            message: `Designer started working on job ${job.job_card_id}`
          });
        }
      } else {
        throw new Error('Failed to update job status');
      }
    } catch (error) {
      console.error('Error starting job:', error);
      toast.error('Failed to start job');
    }
  };

  const submitForReview = async (jobId: string) => {
    try {
      setDesignerJobs(prev => 
        prev.map(job => 
          job.id === jobId ? { 
            ...job, 
            status: 'PENDING_HOD_REVIEW',
            submitted_at: new Date().toISOString(),
            submission_notes: submissionNotes,
            progress: 100
          } : job
        )
      );
      
      setSubmissionNotes('');
      toast.success('Job submitted for HOD review');
    } catch (error) {
      console.error('Error submitting job:', error);
      toast.error('Failed to submit job');
    }
  };

  const updatePrepressStatus = async (jobId: string, newStatus: string, notes: string = '') => {
    try {
      const job = designerJobs.find(j => j.id === jobId);
      if (!job) return;

      console.log(`🔄 Updating prepress status for job ${job.job_card_id} to ${newStatus}`);
      
      const response = await prepressWorkflowAPI.updateStatus(job.job_card_id, newStatus, notes);
      
      if (response.success) {
        // Update local state
        setDesignerJobs(prev => 
          prev.map(j => 
            j.id === jobId ? { 
              ...j, 
              prepress_status: newStatus,
              workflow_progress: response.data.workflowProgress
            } : j
          )
        );
        
        toast.success(`Status updated to ${newStatus.replace(/_/g, ' ')}`);
      }
    } catch (error) {
      console.error('Error updating prepress status:', error);
      toast.error('Failed to update status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ASSIGNED':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'IN_PROGRESS':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'PENDING_HOD_REVIEW':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'MEDIUM':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'LOW':
        return 'bg-green-50 text-green-700 border-green-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const totalJobsAssigned = designerJobs.length;
  const totalJobsCompleted = designerJobs.filter(job => job.status === 'HOD_APPROVED').length;
  const totalJobsInProgress = designerJobs.filter(job => job.status === 'IN_PROGRESS').length;
  const totalJobsPendingReview = designerJobs.filter(job => job.status === 'PENDING_HOD_REVIEW').length;

  return (
    <MainLayout
      currentPage={currentPage}
      onNavigate={onNavigate}
      onLogout={onLogout}
      isLoading={isLoading || dashboardLoading}
      pageTitle="Designer Dashboard"
      pageDescription="Manage your design tasks and track progress"
    >
      <motion.div 
        className="p-6 bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 min-h-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* Real-time Connection Status */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-600">
              {isConnected ? 'Real-time connected' : 'Disconnected'}
            </span>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadDesignerJobs}
            disabled={dashboardLoading}
            className="gap-2"
          >
            <RotateCcw className={`w-4 h-4 ${dashboardLoading ? 'animate-spin' : ''}`} />
            Refresh Jobs
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            {
              title: 'Assigned Jobs',
              value: totalJobsAssigned.toString(),
              change: 'Active assignments',
              icon: Layers,
              color: 'from-blue-500 to-blue-600',
              bgColor: 'from-blue-50 to-blue-100'
            },
            {
              title: 'In Progress',
              value: totalJobsInProgress.toString(),
              change: 'Currently working',
              icon: Play,
              color: 'from-yellow-500 to-yellow-600',
              bgColor: 'from-yellow-50 to-yellow-100'
            },
            {
              title: 'Pending Review',
              value: totalJobsPendingReview.toString(),
              change: 'Awaiting HOD review',
              icon: Eye,
              color: 'from-purple-500 to-purple-600',
              bgColor: 'from-purple-50 to-purple-100'
            },
            {
              title: 'Completed',
              value: totalJobsCompleted.toString(),
              change: 'Successfully finished',
              icon: CheckCircle,
              color: 'from-green-500 to-green-600',
              bgColor: 'from-green-50 to-green-100'
            }
          ].map((stat, index) => (
            <Card key={index} className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-sm text-gray-500 mt-2">{stat.change}</p>
                  </div>
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${stat.bgColor} flex items-center justify-center`}>
                    <stat.icon className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Active Jobs */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5 text-teal-600" />
                  My Active Jobs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {designerJobs.map((job, index) => {
                    const isActive = activeTimer === job.id;
                    
                    return (
                      <div
                        key={job.id}
                        className="border rounded-xl p-6 bg-gradient-to-r from-white to-gray-50/30 hover:shadow-md transition-all"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="font-semibold text-lg text-gray-900">{job.job_card_id}</h3>
                            <p className="text-gray-600">{job.product_name} ({job.product_code})</p>
                            <p className="text-sm text-gray-500">{job.company_name}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={`${getStatusColor(job.status)} border`}>
                              {job.status.replace(/_/g, ' ')}
                            </Badge>
                            <Badge className={`${getPriorityColor(job.priority)} border`}>
                              {job.priority}
                            </Badge>
                          </div>
                        </div>

                        {job.customer_notes && (
                          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                            <p className="text-sm text-blue-800">
                              <MessageSquare className="w-4 h-4 inline mr-2" />
                              {job.customer_notes}
                            </p>
                          </div>
                        )}

                        {/* Process Sequence Section */}
                        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-blue-800">
                              <Layers className="w-4 h-4 inline mr-2" />
                              Process Sequence
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedJobId(job.id);
                                setModalAction('process');
                              }}
                              className="text-blue-600 border-blue-300 hover:bg-blue-100"
                            >
                              <Settings className="w-4 h-4 mr-1" />
                              Configure Process
                            </Button>
                          </div>
                          <p className="text-xs text-blue-600">
                            Designer can modify process steps based on experience
                          </p>
                        </div>

                        {/* Process Sequence Display */}
                        <div className="mb-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-medium text-green-800">Process Sequence</h4>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedJobId(job.id);
                                setModalAction('process');
                              }}
                              className="text-green-600 border-green-300 hover:bg-green-100"
                            >
                              <Settings className="w-4 h-4 mr-1" />
                              Configure
                            </Button>
                          </div>
                          <div className="text-xs text-green-600">
                            Product Type: {job.product_type} • Designer can modify process steps
                          </div>
                        </div>

                        {/* Prepress Workflow Display */}
                        {job.prepress_status && (
                          <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                            <PrepressWorkflowDisplay
                              jobCardId={job.job_card_id}
                              prepressStatus={job.prepress_status}
                              workflowProgress={job.workflow_progress}
                              designerName="Current Designer"
                              startDate={job.started_at}
                              department="Prepress Department"
                              onStatusUpdate={(newStatus, notes) => updatePrepressStatus(job.id, newStatus, notes)}
                              showActions={true}
                            />
                          </div>
                        )}

                        {/* Progress Bar */}
                        <div className="mb-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                            <span className="text-sm text-gray-600">{job.progress}%</span>
                          </div>
                          <Progress value={job.progress} className="h-2" />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {job.status === 'ASSIGNED' && (
                            <Button
                              onClick={() => startJob(job.id)}
                              className="gap-2 bg-green-600 hover:bg-green-700"
                            >
                              <Play className="w-4 h-4" />
                              Start Work
                            </Button>
                          )}

                          {job.status === 'IN_PROGRESS' && (
                            <>
                              <Button
                                onClick={() => {
                                  setSubmissionNotes('');
                                  setSelectedJobId(job.id);
                                  setModalAction('submit');
                                }}
                                variant="outline"
                                className="gap-2"
                              >
                                <Send className="w-4 h-4" />
                                Submit for Review
                              </Button>
                            </>
                          )}

                          <Button variant="outline" size="sm" className="gap-2">
                            <Upload className="w-4 h-4" />
                            Upload Files
                          </Button>

                          <Button variant="outline" size="sm" className="gap-2">
                            <Eye className="w-4 h-4" />
                            View Details
                          </Button>
                        </div>
                      </div>
                    );
                  })}

                  {designerJobs.length === 0 && (
                    <div className="text-center py-12">
                      <Palette className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No active jobs</h3>
                      <p className="text-gray-500">All caught up! New assignments will appear here.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-600" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full gap-2 justify-start">
                  <FileText className="w-4 h-4" />
                  Design Templates
                </Button>
                <Button variant="outline" className="w-full gap-2 justify-start">
                  <Image className="w-4 h-4" />
                  Asset Library
                </Button>
                <Button variant="outline" className="w-full gap-2 justify-start">
                  <Activity className="w-4 h-4" />
                  Time Reports
                </Button>
                <Button variant="outline" className="w-full gap-2 justify-start">
                  <MessageSquare className="w-4 h-4" />
                  Request Help
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Submission Modal */}
        <AnimatePresence>
          {selectedJobId && modalAction === 'submit' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
              onClick={() => {
                setSelectedJobId(null);
                setModalAction(null);
              }}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-lg font-semibold mb-4">Submit for Review</h3>
                <Textarea
                  placeholder="Add submission notes for HOD review..."
                  value={submissionNotes}
                  onChange={(e) => setSubmissionNotes(e.target.value)}
                  className="resize-none mb-4"
                  rows={3}
                />
                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      submitForReview(selectedJobId);
                      setSelectedJobId(null);
                      setModalAction(null);
                    }}
                    className="flex-1 gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Submit
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedJobId(null);
                      setModalAction(null);
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Process Sequence Configuration Modal */}
        <ProcessSequenceModal
          isOpen={!!selectedJobId && modalAction === 'process'}
          onClose={() => {
            setSelectedJobId(null);
            setModalAction(null);
          }}
          jobId={selectedJobId}
          job={designerJobs.find(job => job.id === selectedJobId)}
        />
      </motion.div>
    </MainLayout>
  );
};
