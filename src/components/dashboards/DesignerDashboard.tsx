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
  RotateCcw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { MainLayout } from '../layout/MainLayout';
import { prepressAPI, authAPI } from '@/services/api';
import { useSocket } from '@/services/socketService.tsx';

interface DesignerDashboardProps {
  onNavigate?: (page: string) => void;
  onLogout?: () => void;
  currentPage?: string;
  isLoading?: boolean;
}

const mockDesignerJobs = [
  {
    id: 'pj-001',
    job_card_id: 'JC-001234',
    product_code: 'BR-00-139-A',
    company_name: 'JCP Brand',
    status: 'ASSIGNED',
    priority: 'HIGH',
    due_date: '2024-01-15',
    created_at: '2024-01-10',
    customer_notes: 'Custom packaging design required',
    estimated_hours: 8,
    time_spent: 0,
    progress: 0
  },
  {
    id: 'pj-002', 
    job_card_id: 'JC-001235',
    product_code: 'BR-00-140-B',
    company_name: 'Nike',
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    due_date: '2024-01-18',
    created_at: '2024-01-11',
    started_at: '2024-01-12T09:00:00Z',
    estimated_hours: 6,
    time_spent: 3.5,
    progress: 60,
    work_notes: 'Initial concept approved, working on final design'
  }
];

export const DesignerDashboard: React.FC<DesignerDashboardProps> = ({
  onNavigate = () => {},
  onLogout = () => {},
  currentPage = 'prepressDesigner',
  isLoading = false
}) => {
  const { isConnected, socket } = useSocket();
  const [designerJobs, setDesignerJobs] = useState(mockDesignerJobs);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [workNotes, setWorkNotes] = useState('');
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [activeTimer, setActiveTimer] = useState<string | null>(null);
  const [timerMinutes, setTimerMinutes] = useState(0);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  const loadDesignerJobs = async () => {
    setDashboardLoading(true);
    try {
      // In real implementation, this would fetch from API
    } catch (error) {
      console.error('Error loading designer jobs:', error);
      toast.error('Failed to load jobs');
    } finally {
      setDashboardLoading(false);
    }
  };

  useEffect(() => {
    loadDesignerJobs();
    
    if (socket) {
      socket.on('new_job_assignment', (data) => {
        toast.success(`New job assigned: ${data.jobCardId}`);
        loadDesignerJobs();
      });

      socket.on('review_decision', (data) => {
        if (data.action === 'approve') {
          toast.success(`Job ${data.jobCardId} approved!`);
        } else {
          toast.warning(`Job ${data.jobCardId} needs revision`);
        }
        loadDesignerJobs();
      });
    }

    return () => {
      if (socket) {
        socket.off('new_job_assignment');
        socket.off('review_decision');
      }
    };
  }, [socket]);

  const startJob = async (jobId: string) => {
    try {
      setActiveTimer(jobId);
      setTimerMinutes(0);
      
      setDesignerJobs(prev => 
        prev.map(job => 
          job.id === jobId ? { 
            ...job, 
            status: 'IN_PROGRESS',
            started_at: new Date().toISOString()
          } : job
        )
      );
      
      toast.success('Job started successfully');
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
                            <p className="text-gray-600">{job.product_code} - {job.company_name}</p>
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

                        {/* Progress Bar */}
                        <div className="mb-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-700">Progress</span>
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
                                onClick={() => setSelectedJobId(job.id)}
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
          {selectedJobId && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
              onClick={() => setSelectedJobId(null)}
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
                    }}
                    className="flex-1 gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Submit
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedJobId(null)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </MainLayout>
  );
};