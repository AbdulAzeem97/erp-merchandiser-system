import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Palette,
  Clock,
  CheckCircle,
  AlertCircle,
  Play,
  Pause,
  Eye,
  Edit,
  Calendar,
  User,
  Building,
  Package,
  Target,
  TrendingUp,
  BarChart3,
  Filter,
  Search,
  RefreshCw,
  Bell,
  Settings,
  LogOut,
  Plus,
  FileText,
  Download,
  Upload,
  MessageSquare,
  Star,
  Flag,
  Zap,
  Activity,
  PieChart,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Timer,
  Award,
  Crown,
  Shield
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useSocket } from '@/services/socketService.tsx';
import { MainLayout } from '../layout/MainLayout';
import { authAPI, processSequencesAPI, jobsAPI } from '@/services/api';
import { getProcessSequence } from '@/data/processSequences';
import ProcessSequenceModal from './ProcessSequenceModal';

interface DesignerJob {
  id: string;
  prepress_job_id: string;
  job_card_number: string;
  job_card_id: string;
  status: 'ASSIGNED' | 'IN_PROGRESS' | 'PAUSED' | 'HOD_REVIEW' | 'COMPLETED' | 'REJECTED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  due_date: string;
  assigned_at: string;
  updated_at: string;
  company_name: string;
  product_name: string;
  product_item_code: string;
  quantity: number;
  delivery_date: string;
  customer_notes: string;
  special_instructions: string;
  notes: string;
  // Complete product information
  product_type: string;
  product_brand: string;
  product_material: string;
  product_gsm: number;
  product_fsc: string;
  product_fsc_claim: string;
  product_color: string;
  product_remarks: string;
  product_category: string;
  // Additional complete information
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  po_number: string;
  delivery_address: string;
  assigned_designer_name: string;
  // Process sequence information
  process_sequence: {
    id: string | null;
    productType: string;
    steps: Array<{
      id: number;
      name: string;
      sequenceOrder: number;
      isRequired: boolean;
      estimatedHours: number;
    }>;
  };
  // Prepress workflow information
  prepress_status: string;
  workflow_progress: {
    stages: Array<{
      key: string;
      label: string;
      status: 'pending' | 'current' | 'completed';
    }>;
    currentStage: string;
    progress: number;
  };
  progress: number;
}

interface DesignerStats {
  total_jobs: number;
  assigned_jobs: number;
  in_progress_jobs: number;
  completed_jobs: number;
  paused_jobs: number;
  hod_review_jobs: number;
}

interface DesignerDashboardProps {
  onLogout?: () => void;
  onNavigate?: (page: string) => void;
}

const statusColors = {
  ASSIGNED: 'bg-blue-100 text-blue-800 border-blue-300',
  IN_PROGRESS: 'bg-green-100 text-green-800 border-green-300',
  PAUSED: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  HOD_REVIEW: 'bg-purple-100 text-purple-800 border-purple-300',
  COMPLETED: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  REJECTED: 'bg-red-100 text-red-800 border-red-300'
};

const priorityColors = {
  LOW: 'bg-gray-100 text-gray-800 border-gray-300',
  MEDIUM: 'bg-blue-100 text-blue-800 border-blue-300',
  HIGH: 'bg-orange-100 text-orange-800 border-orange-300',
  CRITICAL: 'bg-red-100 text-red-800 border-red-300'
};

const DesignerDashboard: React.FC<DesignerDashboardProps> = ({ onLogout, onNavigate }) => {
  const { socket, isConnected } = useSocket();
  const [jobs, setJobs] = useState<DesignerJob[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<DesignerJob[]>([]);
  const [stats, setStats] = useState<DesignerStats>({
    total_jobs: 0,
    assigned_jobs: 0,
    in_progress_jobs: 0,
    completed_jobs: 0,
    paused_jobs: 0,
    hod_review_jobs: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedJob, setSelectedJob] = useState<DesignerJob | null>(null);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isJobDetailsOpen, setIsJobDetailsOpen] = useState(false);
  const [jobDetailsData, setJobDetailsData] = useState<DesignerJob | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [isProcessSequenceModalOpen, setIsProcessSequenceModalOpen] = useState(false);
  const [selectedJobForProcessEdit, setSelectedJobForProcessEdit] = useState<DesignerJob | null>(null);
  const [jobProcessSequences, setJobProcessSequences] = useState<{[jobId: string]: any}>({});
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  // Load user data on component mount
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(userData);
  }, []);

  // Handle logout function
  const handleLogout = () => {
    authAPI.logout();
    if (onLogout) {
      onLogout();
    } else {
      window.location.href = '/';
    }
  };

  // Handle navigation function
  const handleNavigate = (page: string) => {
    if (onNavigate) {
      onNavigate(page);
    } else {
      // Default navigation logic or routing
      console.log(`Navigate to: ${page}`);
    }
  };

  // Handle view job details
  const handleViewJobDetails = async (job: DesignerJob) => {
    try {
      setJobDetailsData(job);
      setIsJobDetailsOpen(true);
      
      // Fetch process sequence for this job
      await fetchJobProcessSequence(job.id);
    } catch (error) {
      console.error('Error loading job details:', error);
      toast.error('Failed to load job details');
    }
  };

  // Load designer jobs
  const loadJobs = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('authToken');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      console.log('🔄 Designer Dashboard: Loading jobs...');
      console.log('🔄 User ID:', user.id);
      console.log('🔄 Token present:', !!token);
      
      if (!user.id) {
        toast.error('User information not found');
        return;
      }

      // Fetch jobs assigned to this designer using the new API endpoint
      const response = await jobsAPI.getAssignedToDesigner(user.id.toString());
      
      console.log('🔄 API Response:', response);
      
      if (response.success) {
        const assignedJobs = response.jobs || [];
        console.log('🔄 Assigned Jobs Count:', assignedJobs.length);
        
        // Fetch complete product information and process sequence for each assigned job
        const designerJobsWithCompleteInfo = await Promise.all(assignedJobs.map(async (job: any) => {
          let completeProductInfo = null;
          let processSequence = null;
          
          try {
            // Fetch complete product information
            if (job.productId) {
              const productResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/products/${job.productId}/complete-process-info`, {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });
              if (productResponse.ok) {
                completeProductInfo = await productResponse.json();
                console.log(`📦 Complete product info for job ${job.id}:`, completeProductInfo);
              }
            }

            // Fetch process sequence for the product type
            if (completeProductInfo?.product?.product_type) {
              try {
                const processResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/process-sequences/by-product-type?product_type=${encodeURIComponent(completeProductInfo.product.product_type)}&product_id=${job.productId}`, {
                  headers: {
                    'Authorization': `Bearer ${token}`
                  }
                });
                if (processResponse.ok) {
                  processSequence = await processResponse.json();
                  console.log(`🔄 Process sequence for job ${job.id}:`, processSequence);
                }
              } catch (error) {
                console.error(`Error fetching process sequence for job ${job.id}:`, error);
              }
            }
          } catch (error) {
            console.error(`Error fetching product info for job ${job.id}:`, error);
          }

          const product = completeProductInfo?.product || completeProductInfo || {};
          
          // Return job with complete product information and process sequence
          return {
            ...job,
            // Job ID mapping (ensure we have the correct job ID)
            id: job.id.toString(),
            job_card_id: job.jobNumber || `JC-${job.id}`,
            // Complete product information from API
            product_name: product.name || job.productName || 'N/A',
            product_item_code: product.product_item_code || job.productCode || job.sku || 'N/A',
            product_type: product.product_type || job.productType || 'Offset',
            product_brand: product.brand || job.brand || 'N/A',
            product_material: product.material_name || job.materialName || 'N/A',
            product_gsm: product.gsm || job.gsm || 0,
            product_fsc: product.fsc || job.fsc || 'N/A',
            product_fsc_claim: product.fsc_claim || job.fscClaim || 'N/A',
            product_color: product.color_specifications || product.color || job.colorSpecifications || 'N/A',
            product_remarks: product.remarks || job.remarks || '',
            product_category: product.category_name || job.categoryName || 'N/A',
            due_date: job.dueDate, // Add due date mapping
            // Additional complete information
            customer_name: job.customerName || job.companyName || 'N/A',
            customer_email: job.customerEmail || 'N/A',
            customer_phone: job.customerPhone || 'N/A',
            customer_address: job.customerAddress || 'N/A',
            po_number: job.poNumber || 'N/A',
            delivery_address: job.delivery_address || 'N/A',
            special_instructions: job.special_instructions || '',
            assigned_designer_name: job.assigned_designer_name || 'N/A',
            // Process sequence information
            process_sequence: processSequence || {
              id: null,
              productType: product.product_type || 'Offset',
              steps: [
                { id: 1, name: 'Designing', sequenceOrder: 1, isRequired: true, estimatedHours: 4 },
                { id: 2, name: 'Die Making', sequenceOrder: 2, isRequired: true, estimatedHours: 2 },
                { id: 3, name: 'Plate Making', sequenceOrder: 3, isRequired: true, estimatedHours: 1 }
              ]
            },
            // Prepress workflow information
            prepress_status: job.prepress_status || 'PENDING',
            workflow_progress: job.workflow_progress || {
              stages: [
                { key: 'designing', label: 'Designing', status: 'pending' as const },
                { key: 'die_making', label: 'Die Making', status: 'pending' as const },
                { key: 'plate_making', label: 'Plate Making', status: 'pending' as const }
              ],
              currentStage: 'designing',
              progress: 0
            }
          };
        }));
        
        setJobs(designerJobsWithCompleteInfo);
        setFilteredJobs(designerJobsWithCompleteInfo);
        
        // Calculate stats
        const jobStats = {
          total_jobs: designerJobsWithCompleteInfo.length,
          assigned_jobs: designerJobsWithCompleteInfo.filter((job: DesignerJob) => job.status === 'ASSIGNED').length,
          in_progress_jobs: designerJobsWithCompleteInfo.filter((job: DesignerJob) => job.status === 'IN_PROGRESS').length,
          completed_jobs: designerJobsWithCompleteInfo.filter((job: DesignerJob) => job.status === 'COMPLETED').length,
          paused_jobs: designerJobsWithCompleteInfo.filter((job: DesignerJob) => job.status === 'PAUSED').length,
          hod_review_jobs: designerJobsWithCompleteInfo.filter((job: DesignerJob) => job.status === 'HOD_REVIEW').length
        };
        setStats(jobStats);
        
        console.log('✅ Jobs loaded successfully with complete information:', jobStats);
        console.log('✅ Current jobs state:', designerJobsWithCompleteInfo);
        console.log('✅ Looking for JC-1757336985212:', designerJobsWithCompleteInfo.find((job: any) => job.jobNumber === 'JC-1757336985212'));
      } else {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        toast.error('Failed to load jobs');
      }
    } catch (error) {
      console.error('❌ Error loading jobs:', error);
      toast.error('Error loading jobs');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter jobs
  useEffect(() => {
    let filtered = jobs;

    if (searchTerm) {
      filtered = filtered.filter(job =>
        job.job_card_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.productName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(job => job.status === statusFilter);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(job => job.priority === priorityFilter);
    }

    setFilteredJobs(filtered);
  }, [jobs, searchTerm, statusFilter, priorityFilter]);

  // Update job status
  const updateJobStatus = async (jobId: string, status: string, notes: string) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/jobs/${jobId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status, notes })
      });

      if (response.ok) {
        toast.success('Job status updated successfully');
        setIsStatusDialogOpen(false);
        setNewStatus('');
        setStatusNotes('');
        loadJobs(); // Reload jobs
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update job status');
      }
    } catch (error) {
      console.error('Error updating job status:', error);
      toast.error('Error updating job status');
    }
  };

  // Socket event handlers
  useEffect(() => {
    if (socket && isConnected) {
      console.log('🎧 Designer Dashboard: Setting up Socket.io event listeners');
      
      // Listen for job assignments
      socket.on('job_assigned', (data) => {
        console.log('📨 Designer Dashboard: Received job_assigned event:', data);
        toast.success(`New job assigned: ${data.jobCardId}`);
        loadJobs();
      });

      // Listen for jobs assigned specifically to this designer
      socket.on('job_assigned_to_me', (data) => {
        console.log('📨 Designer Dashboard: Received job_assigned_to_me event:', data);
        toast.success(`You have been assigned job: ${data.jobCardId}`);
        loadJobs();
      });

      // Listen for process sequence updates
      socket.on('process_sequence_updated', (data) => {
        console.log('⚙️ Designer Dashboard: Received process_sequence_updated event:', data);
        toast.success(`Process sequence updated for job: ${data.jobId}`);
        loadJobs();
      });

      // Listen for job status updates
      socket.on('job_status_updated', (data) => {
        console.log('📨 Designer Dashboard: Received job_status_updated event:', data);
        toast.info(`Job status updated: ${data.jobCardId}`);
        loadJobs();
      });

      // Listen for new jobs created (for HOD/Admin visibility)
      socket.on('job_created', (data) => {
        console.log('📨 Designer Dashboard: Received job_created event:', data);
        toast.info(`New job created: ${data.jobCardId}`);
        // Only reload if user is HOD or Admin
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user.role === 'HOD_PREPRESS' || user.role === 'ADMIN') {
          loadJobs();
        }
      });

      // Listen for new jobs ready for assignment
      socket.on('new_job_for_assignment', (data) => {
        console.log('📨 Designer Dashboard: Received new_job_for_assignment event:', data);
        toast.info(`New job ready for assignment: ${data.jobCardId}`);
        // Only reload if user is HOD or Admin
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user.role === 'HOD_PREPRESS' || user.role === 'ADMIN') {
          loadJobs();
        }
      });

      return () => {
        console.log('🧹 Designer Dashboard: Cleaning up Socket.io event listeners');
        socket.off('job_assigned');
        socket.off('job_assigned_to_me');
        socket.off('job_status_updated');
        socket.off('job_created');
        socket.off('new_job_for_assignment');
      };
    } else {
      console.log('❌ Designer Dashboard: Socket not connected, skipping event listeners');
    }
  }, [socket, isConnected]);

  useEffect(() => {
    loadJobs();
  }, []);

  // Fallback: Auto-refresh every 30 seconds if Socket.io is not connected
  useEffect(() => {
    if (!isConnected) {
      console.log('🔄 Socket.io not connected, setting up fallback auto-refresh');
      const interval = setInterval(() => {
        console.log('🔄 Fallback auto-refresh triggered');
        loadJobs();
      }, 30000); // 30 seconds

      return () => clearInterval(interval);
    }
  }, [isConnected]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ASSIGNED': return <Clock className="h-4 w-4" />;
      case 'IN_PROGRESS': return <Play className="h-4 w-4" />;
      case 'PAUSED': return <Pause className="h-4 w-4" />;
      case 'HOD_REVIEW': return <Eye className="h-4 w-4" />;
      case 'COMPLETED': return <CheckCircle className="h-4 w-4" />;
      case 'REJECTED': return <XCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'LOW': return <Flag className="h-4 w-4" />;
      case 'MEDIUM': return <Flag className="h-4 w-4" />;
      case 'HIGH': return <AlertTriangle className="h-4 w-4" />;
      case 'CRITICAL': return <Zap className="h-4 w-4" />;
      default: return <Flag className="h-4 w-4" />;
    }
  };

  const handleEditProcessSequence = (job: DesignerJob) => {
    console.log('Opening process sequence modal for job:', job);
    console.log('Job ID:', job.id, 'Job Card ID:', job.job_card_id);
    setSelectedJobForProcessEdit(job);
    setIsProcessSequenceModalOpen(true);
  };


  const handleSaveProcessSequence = (steps: any[]) => {
    console.log('Process sequence saved:', steps);
    toast.success('Process sequence updated successfully');
    
    // Update the job process sequence in state
    if (selectedJobForProcessEdit) {
      setJobProcessSequences(prev => ({
        ...prev,
        [selectedJobForProcessEdit.id]: {
          ...prev[selectedJobForProcessEdit.id],
          steps: steps,
          lastUpdated: new Date().toISOString()
        }
      }));
    }
    
    // Reload jobs to get updated data
    loadJobs();
  };

  const fetchJobProcessSequence = async (jobId: string) => {
    try {
      console.log('🔄 Fetching process sequence for job:', jobId);
      const response = await processSequencesAPI.getForJob(jobId);
      console.log('✅ Process sequence fetched:', response);
      
      const processSequence = (response as any).process_sequence || response;
      
      setJobProcessSequences(prev => ({
        ...prev,
        [jobId]: processSequence
      }));
      
      return processSequence;
    } catch (error) {
      console.error('❌ Error fetching process sequence:', error);
      return null;
    }
  };

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <MainLayout
      currentPage="designer-dashboard"
      onNavigate={handleNavigate}
      onLogout={handleLogout}
      isLoading={isLoading}
    >
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        {/* Beautiful Enhanced Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 p-8 shadow-2xl"
        >
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-3">
                <h1 className="text-4xl font-bold text-white tracking-tight">Designer Dashboard</h1>
                <p className="text-blue-100 text-lg">Manage your design assignments and track progress</p>
                <div className="flex items-center gap-4 mt-4">
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                    <User className="h-4 w-4" />
                    <span className="text-sm font-medium">{user?.firstName} {user?.lastName}</span>
                  </div>
                  <Badge className={`${isConnected ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'} text-white border-0`}>
            {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </Badge>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button 
                  onClick={loadJobs} 
                  variant="secondary" 
                  size="sm"
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
                >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Jobs
          </Button>
                <Button 
                  onClick={() => onNavigate('profile')} 
                  variant="secondary" 
                  size="sm"
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
                >
                  <User className="h-4 w-4 mr-2" />
                  Profile
          </Button>
        </div>
            </div>
          </div>
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-20 translate-x-20"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-16 -translate-x-16"></div>
          <div className="absolute top-1/2 right-1/4 w-2 h-2 bg-white/30 rounded-full"></div>
          <div className="absolute top-1/3 left-1/3 w-1 h-1 bg-white/40 rounded-full"></div>
        </motion.div>

        <div className="p-6 space-y-8">
        {/* Enhanced Stats Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6"
        >
          <motion.div
            whileHover={{ scale: 1.05, y: -5 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 border-0 overflow-hidden">
              <CardContent className="p-6 relative">
                <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10"></div>
                <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Jobs</p>
                  <p className="text-3xl font-bold">{stats.total_jobs}</p>
                </div>
                <Package className="h-8 w-8 text-blue-200" />
                  </div>
              </div>
            </CardContent>
          </Card>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05, y: -5 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 border-0 overflow-hidden">
              <CardContent className="p-6 relative">
                <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10"></div>
                <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                      <p className="text-emerald-100 text-sm font-medium">In Progress</p>
                  <p className="text-3xl font-bold">{stats.in_progress_jobs}</p>
                </div>
                    <Play className="h-8 w-8 text-emerald-200" />
                  </div>
              </div>
            </CardContent>
          </Card>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05, y: -5 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 border-0 overflow-hidden">
              <CardContent className="p-6 relative">
                <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10"></div>
                <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                      <p className="text-amber-100 text-sm font-medium">Assigned</p>
                  <p className="text-3xl font-bold">{stats.assigned_jobs}</p>
                </div>
                    <Clock className="h-8 w-8 text-amber-200" />
                  </div>
              </div>
            </CardContent>
          </Card>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05, y: -5 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="bg-gradient-to-br from-violet-500 via-violet-600 to-violet-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 border-0 overflow-hidden">
              <CardContent className="p-6 relative">
                <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10"></div>
                <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                      <p className="text-violet-100 text-sm font-medium">HOD Review</p>
                  <p className="text-3xl font-bold">{stats.hod_review_jobs}</p>
                </div>
                    <Eye className="h-8 w-8 text-violet-200" />
                  </div>
              </div>
            </CardContent>
          </Card>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05, y: -5 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="bg-gradient-to-br from-green-500 via-green-600 to-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 border-0 overflow-hidden">
              <CardContent className="p-6 relative">
                <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10"></div>
                <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                      <p className="text-green-100 text-sm font-medium">Completed</p>
                  <p className="text-3xl font-bold">{stats.completed_jobs}</p>
                </div>
                    <CheckCircle className="h-8 w-8 text-green-200" />
                  </div>
              </div>
            </CardContent>
          </Card>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05, y: -5 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 border-0 overflow-hidden">
              <CardContent className="p-6 relative">
                <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10"></div>
                <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Paused</p>
                  <p className="text-3xl font-bold">{stats.paused_jobs}</p>
                </div>
                <Pause className="h-8 w-8 text-orange-200" />
                  </div>
              </div>
            </CardContent>
          </Card>
          </motion.div>
        </motion.div>

        {/* Enhanced Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1">
                  <Label htmlFor="search" className="text-sm font-semibold text-gray-700 mb-2 block">Search Jobs</Label>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                      id="search"
                      placeholder="Search by job number, product name, or customer..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                  />
                </div>
              </div>
                <div className="flex-1">
                  <Label htmlFor="status-filter" className="text-sm font-semibold text-gray-700 mb-2 block">Filter by Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20">
                      <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="ASSIGNED">Assigned</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="PAUSED">Paused</SelectItem>
                  <SelectItem value="HOD_REVIEW">HOD Review</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                </SelectContent>
              </Select>
                </div>
                <div className="flex-1">
                  <Label htmlFor="priority-filter" className="text-sm font-semibold text-gray-700 mb-2 block">Filter by Priority</Label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20">
                      <SelectValue placeholder="All Priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                </SelectContent>
              </Select>
                </div>
            </div>
          </CardContent>
        </Card>
        </motion.div>

        {/* Enhanced Jobs List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Package className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <span className="text-gray-900">My Jobs</span>
                    <Badge variant="secondary" className="ml-3 bg-blue-100 text-blue-800">
                      {filteredJobs.length}
              </Badge>
                  </div>
            </CardTitle>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                    {filteredJobs.filter(job => job.status === 'IN_PROGRESS').length} Active
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (expandedJobId) {
                        setExpandedJobId(null);
                      } else {
                        // Expand first job if none are expanded
                        if (filteredJobs.length > 0) {
                          setExpandedJobId(filteredJobs[0].prepress_job_id);
                        }
                      }
                    }}
                    className="bg-white/50 hover:bg-white/80 border-gray-200"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    {expandedJobId ? 'Collapse All' : 'Expand First'}
                  </Button>
                </div>
              </div>
          </CardHeader>
          <CardContent>
            {filteredJobs.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
                <p className="text-gray-500">No jobs match your current filters.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredJobs.map((job, index) => (
                  <motion.div
                    key={job.prepress_job_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    className="bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-xl p-6 hover:shadow-xl hover:bg-white/80 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        {/* Enhanced Compact Header */}
                        <div className="flex items-center gap-4 mb-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <Package className="h-5 w-5 text-blue-600" />
                            </div>
                            <h3 className="font-bold text-xl text-gray-900">
                              {job.job_card_id || job.job_card_number}
                          </h3>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={`${statusColors[job.status]} shadow-sm`}>
                            {getStatusIcon(job.status)}
                              <span className="ml-1 font-medium">{job.status.replace('_', ' ')}</span>
                          </Badge>
                            <Badge className={`${priorityColors[job.priority]} shadow-sm`}>
                            {getPriorityIcon(job.priority)}
                              <span className="ml-1 font-medium">{job.priority}</span>
                          </Badge>
                            {getDaysUntilDue(job.due_date) <= 2 && (
                              <Badge className="bg-red-500 text-white border-0 shadow-sm animate-pulse">
                                <Zap className="h-3 w-3 mr-1" />
                                URGENT
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        {/* Compact Summary View */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                          <div>
                            <span className="font-medium">Product:</span> {job.product_item_code}
                          </div>
                          <div>
                            <span className="font-medium">Customer:</span> {job.customer_name || job.company_name}
                          </div>
                          <div>
                            <span className="font-medium">Quantity:</span> {job.quantity.toLocaleString()} units
                          </div>
                          <div>
                            <span className="font-medium">Due Date:</span> 
                            <span className={getDaysUntilDue(job.dueDate) <= 2 ? 'text-red-600 font-medium ml-1' : 'ml-1'}>
                              {formatDate(job.dueDate)} ({getDaysUntilDue(job.dueDate)}d)
                            </span>
                          </div>
                        </div>

                        {/* Expandable Details */}
                        {expandedJobId === job.prepress_job_id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-3"
                          >
                            {/* Complete Product Details */}
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <h4 className="font-medium text-gray-800 mb-2">Product Specifications</h4>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                                <div><span className="font-medium">Name:</span> {job.product_name}</div>
                                <div><span className="font-medium">Brand:</span> {job.product_brand}</div>
                                <div><span className="font-medium">Type:</span> {job.product_type}</div>
                                <div><span className="font-medium">Material:</span> {job.product_material}</div>
                                <div><span className="font-medium">GSM:</span> {job.product_gsm} g/m²</div>
                                <div><span className="font-medium">Category:</span> {job.product_category}</div>
                                <div><span className="font-medium">FSC:</span> {job.product_fsc}</div>
                                <div><span className="font-medium">FSC Claim:</span> {job.product_fsc_claim}</div>
                                <div><span className="font-medium">Color:</span> {job.product_color}</div>
                          </div>
                              {job.product_remarks && job.product_remarks !== 'N/A' && (
                                <div className="mt-2 text-sm">
                                  <span className="font-medium">Remarks:</span> {job.product_remarks}
                          </div>
                              )}
                        </div>

                            {/* Customer Information */}
                            <div className="bg-purple-50 p-3 rounded-lg">
                              <h4 className="font-medium text-gray-800 mb-2">Customer Information</h4>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                                <div><span className="font-medium">Name:</span> {job.customer_name || job.company_name}</div>
                                {job.customer_email && job.customer_email !== 'N/A' && (
                                  <div><span className="font-medium">Email:</span> {job.customer_email}</div>
                                )}
                                {job.customer_phone && job.customer_phone !== 'N/A' && (
                                  <div><span className="font-medium">Phone:</span> {job.customer_phone}</div>
                                )}
                                {job.customer_address && job.customer_address !== 'N/A' && (
                                  <div className="col-span-2">
                                    <span className="font-medium">Address:</span> {job.customer_address}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Job Details */}
                            <div className="bg-blue-50 p-3 rounded-lg">
                              <h4 className="font-medium text-gray-800 mb-2">Job Details</h4>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                                <div><span className="font-medium">Quantity:</span> {job.quantity} units</div>
                                <div><span className="font-medium">PO Number:</span> {job.po_number}</div>
                                <div><span className="font-medium">Priority:</span> 
                                  <span className={`ml-1 px-2 py-1 rounded text-xs ${
                                    job.priority === 'HIGH' ? 'bg-red-100 text-red-800' :
                                    job.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-green-100 text-green-800'
                                  }`}>
                                    {job.priority}
                                  </span>
                                </div>
                                {job.delivery_address && job.delivery_address !== 'N/A' && (
                                  <div className="col-span-2">
                                    <span className="font-medium">Delivery Address:</span> {job.delivery_address}
                                  </div>
                                )}
                                {job.special_instructions && job.special_instructions !== 'N/A' && (
                                  <div className="col-span-2">
                                    <span className="font-medium">Special Instructions:</span> {job.special_instructions}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Process Sequence Display */}
                            {job.process_sequence && (
                              <div className="p-2 bg-green-50 rounded-lg border border-green-200">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="text-sm font-medium text-green-800">Process Sequence</h4>
                                  <span className="text-xs text-green-600">Product Type: {job.product_type}</span>
                                </div>
                                <div className="text-xs text-green-600 mb-2">
                                  Process steps configured for this product type. You can modify as needed.
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {job.process_sequence.steps.map((step, idx) => (
                                    <Badge key={step.id} variant="outline" className="text-xs">
                                      {step.name} ({step.estimatedHours}h)
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Prepress Workflow Status */}
                            {job.prepress_status && (
                              <div className="p-2 bg-blue-50 rounded-lg border border-blue-200">
                                <h4 className="text-sm font-medium text-blue-800 mb-2">Prepress Workflow</h4>
                                <div className="text-xs text-blue-600">
                                  Current Status: {job.prepress_status} | Progress: {job.workflow_progress?.progress || 0}%
                                </div>
                              </div>
                            )}

                        {job.customer_notes && (
                              <div className="mb-2">
                                <span className="text-sm font-medium text-gray-700">Customer Notes:</span>
                                <p className="text-sm text-gray-600">{job.customer_notes}</p>
                          </div>
                            )}
                          </motion.div>
                        )}

                        {job.progress > 0 && (
                          <div className="mb-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm text-gray-600">Progress</span>
                              <span className="text-sm font-medium">{job.progress}%</span>
                            </div>
                            <Progress value={job.progress} className="h-2" />
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-3 ml-4 min-w-[140px]">
                        {/* Enhanced Action Buttons */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setExpandedJobId(expandedJobId === job.prepress_job_id ? null : job.prepress_job_id);
                          }}
                          className="bg-white/50 hover:bg-white/80 border-gray-200 hover:border-blue-300 transition-all duration-200"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          {expandedJobId === job.prepress_job_id ? 'Collapse' : 'View Details'}
                        </Button>
                        
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedJob(job);
                            setNewStatus(job.status);
                            setIsStatusDialogOpen(true);
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Update Status
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditProcessSequence(job)}
                          className="bg-white/50 hover:bg-white/80 border-gray-200 hover:border-purple-300 transition-all duration-200"
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Edit Process
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        </motion.div>

      {/* Status Update Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Job Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Job: {selectedJob?.job_card_number}</Label>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ASSIGNED">Assigned</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="PAUSED">Paused</SelectItem>
                  <SelectItem value="HOD_REVIEW">Submit for HOD Review</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this status update..."
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (selectedJob && newStatus) {
                    updateJobStatus(selectedJob.prepress_job_id, newStatus, statusNotes);
                  }
                }}
              >
                Update Status
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Job Details Modal */}
      <Dialog open={isJobDetailsOpen} onOpenChange={setIsJobDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Job Details: {jobDetailsData?.job_card_number}
            </DialogTitle>
          </DialogHeader>
          
          {jobDetailsData && (
            <div className="space-y-6">
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="product">Product Info</TabsTrigger>
                  <TabsTrigger value="customer">Customer Info</TabsTrigger>
                  <TabsTrigger value="process">Process Sequence</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          Job Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Job Card Number</Label>
                          <p className="font-semibold">{jobDetailsData.job_card_number}</p>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-sm font-medium text-gray-500">Status</Label>
                            <div className="mt-1">
                              <Badge className={statusColors[jobDetailsData.status]}>
                                {getStatusIcon(jobDetailsData.status)}
                                <span className="ml-1">{jobDetailsData.status.replace('_', ' ')}</span>
                              </Badge>
                            </div>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-500">Priority</Label>
                            <div className="mt-1">
                              <Badge className={priorityColors[jobDetailsData.priority]}>
                                {getPriorityIcon(jobDetailsData.priority)}
                                <span className="ml-1">{jobDetailsData.priority}</span>
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <Separator />
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Assigned Date</Label>
                          <p className="font-medium">{formatDate(jobDetailsData.assigned_at)}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Due Date</Label>
                          <p className="font-medium">{formatDate(jobDetailsData.dueDate)}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Last Updated</Label>
                          <p className="font-medium">{formatDate(jobDetailsData.updated_at)}</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Activity className="h-5 w-5" />
                          Quick Stats
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Quantity</Label>
                          <p className="text-2xl font-bold text-blue-600">{jobDetailsData.quantity?.toLocaleString()}</p>
                        </div>
                        <Separator />
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Delivery Date</Label>
                          <p className="font-medium">{formatDate(jobDetailsData.delivery_date)}</p>
                        </div>
                        <Separator />
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Job ID</Label>
                          <p className="font-mono text-sm">{jobDetailsData.prepress_job_id}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Notes Section */}
                  {(jobDetailsData.customer_notes || jobDetailsData.special_instructions || jobDetailsData.notes) && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <MessageSquare className="h-5 w-5" />
                          Notes & Instructions
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {jobDetailsData.customer_notes && (
                          <div>
                            <Label className="text-sm font-medium text-blue-600">Customer Notes</Label>
                            <div className="mt-1 p-3 bg-blue-50 rounded-lg border border-blue-200">
                              <p className="text-sm">{jobDetailsData.customer_notes}</p>
                            </div>
                          </div>
                        )}
                        {jobDetailsData.special_instructions && (
                          <div>
                            <Label className="text-sm font-medium text-orange-600">Special Instructions</Label>
                            <div className="mt-1 p-3 bg-orange-50 rounded-lg border border-orange-200">
                              <p className="text-sm">{jobDetailsData.special_instructions}</p>
                            </div>
                          </div>
                        )}
                        {jobDetailsData.notes && (
                          <div>
                            <Label className="text-sm font-medium text-gray-600">Internal Notes</Label>
                            <div className="mt-1 p-3 bg-gray-50 rounded-lg border border-gray-200">
                              <p className="text-sm">{jobDetailsData.notes}</p>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Product Info Tab */}
                <TabsContent value="product" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Product Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Product Name</Label>
                          <p className="font-semibold text-lg">{jobDetailsData.product_name}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Item Code</Label>
                          <p className="font-mono font-semibold">{jobDetailsData.product_item_code}</p>
                        </div>
                      </div>
                      <Separator />
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Quantity</Label>
                          <p className="text-xl font-bold text-blue-600">{jobDetailsData.quantity?.toLocaleString()} pieces</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Delivery Date</Label>
                          <p className="font-semibold">{formatDate(jobDetailsData.delivery_date)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Customer Info Tab */}
                <TabsContent value="customer" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Building className="h-5 w-5" />
                        Customer Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Customer Name</Label>
                        <p className="text-xl font-bold text-blue-600">{jobDetailsData.company_name}</p>
                      </div>
                      <Separator />
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Product</Label>
                        <p className="font-semibold">{jobDetailsData.product_name} ({jobDetailsData.product_item_code})</p>
                      </div>
                      {jobDetailsData.customer_notes && (
                        <>
                          <Separator />
                          <div>
                            <Label className="text-sm font-medium text-gray-500">Customer Requirements</Label>
                            <div className="mt-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
                              <p className="text-sm leading-relaxed">{jobDetailsData.customer_notes}</p>
                            </div>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Process Sequence Tab */}
                <TabsContent value="process" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        Production Process Sequence
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {(() => {
                        const savedProcessSequence = jobProcessSequences[jobDetailsData.id];
                        
                        if (savedProcessSequence && savedProcessSequence.steps) {
                          // Show saved process sequence
                          const selectedSteps = savedProcessSequence.steps.filter((step: any) => step.isSelected);
                          const totalSteps = savedProcessSequence.steps.length;
                          
                          return (
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm text-gray-600">
                                    Product Type: <span className="font-semibold text-blue-600">{savedProcessSequence.product_type}</span>
                                  </p>
                                  {savedProcessSequence.lastUpdated && (
                                    <p className="text-xs text-green-600 mt-1">
                                      Last Updated: {new Date(savedProcessSequence.lastUpdated).toLocaleString()}
                                    </p>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  <Badge variant="outline">
                                    {selectedSteps.length} Selected
                                  </Badge>
                                  <Badge variant="secondary">
                                    {totalSteps} Total Steps
                                  </Badge>
                                </div>
                              </div>
                              
                              <div className="grid gap-2">
                                {savedProcessSequence.steps.map((step: any, index: number) => (
                                  <div 
                                    key={step.id}
                                    className={`flex items-center justify-between p-3 rounded-lg border ${
                                      step.isSelected
                                        ? 'bg-green-50 border-green-200' 
                                        : 'bg-gray-50 border-gray-200'
                                    }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                                        step.isSelected
                                          ? 'bg-green-600 text-white' 
                                          : 'bg-gray-400 text-white'
                                      }`}>
                                        {step.order}
                                      </div>
                                      <span className={`font-medium ${step.isSelected ? 'text-green-800' : 'text-gray-500'}`}>
                                        {step.name}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {step.isSelected && (
                                        <Badge variant="default" className="text-xs bg-green-600">
                                          Selected
                                        </Badge>
                                      )}
                                      {step.isCompulsory && (
                                        <Badge variant="secondary" className="text-xs">
                                          Required
                                        </Badge>
                                      )}
                                      <Badge variant="outline" className="text-xs">
                                        Step {step.order}
                                      </Badge>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              
                              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <p className="text-sm text-blue-800">
                                  <strong>Note:</strong> This shows the current process sequence configuration for this job. 
                                  You can edit it using the "Edit Process" button.
                                </p>
                              </div>
                            </div>
                          );
                        } else {
                          // Show default process sequence
                          const productType = jobDetailsData.product_type || 'Offset';
                        const processSequence = getProcessSequence(productType);
                        
                        if (!processSequence) {
                          return (
                            <div className="text-center py-8">
                              <Target className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                              <p className="text-gray-500">No process sequence found for this product type</p>
                              <p className="text-sm text-gray-400 mt-1">Product Type: {productType}</p>
                            </div>
                          );
                        }

                        return (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <p className="text-sm text-gray-600">
                                Product Type: <span className="font-semibold text-blue-600">{processSequence.productType}</span>
                              </p>
                              <Badge variant="outline">
                                {processSequence.steps.length} Total Steps
                              </Badge>
                            </div>
                            <div className="grid gap-2">
                              {processSequence.steps.map((step, index) => (
                                <div 
                                  key={step.id}
                                  className={`flex items-center justify-between p-3 rounded-lg border ${
                                    step.isCompulsory 
                                      ? 'bg-blue-50 border-blue-200' 
                                      : 'bg-gray-50 border-gray-200'
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                                      step.isCompulsory 
                                        ? 'bg-blue-600 text-white' 
                                        : 'bg-gray-400 text-white'
                                    }`}>
                                      {step.order}
                                    </div>
                                    <span className="font-medium">{step.name}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {step.isCompulsory && (
                                      <Badge variant="secondary" className="text-xs">
                                        Required
                                      </Badge>
                                    )}
                                    <Badge variant="outline" className="text-xs">
                                      Step {step.order}
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                              
                              <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                                <p className="text-sm text-yellow-800">
                                  <strong>Note:</strong> This shows the default process sequence. 
                                  No custom configuration has been saved for this job yet.
                                </p>
                            </div>
                          </div>
                        );
                        }
                      })()}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Process Sequence Modal */}
      <ProcessSequenceModal
        isOpen={isProcessSequenceModalOpen}
        onClose={() => setIsProcessSequenceModalOpen(false)}
        jobId={selectedJobForProcessEdit?.id || ''}
        jobCardId={selectedJobForProcessEdit?.job_card_id || selectedJobForProcessEdit?.job_card_number || ''}
        productType={selectedJobForProcessEdit?.product_type || 'Offset'}
        onSave={handleSaveProcessSequence}
      />
        </div>
      </div>
    </MainLayout>
  );
};

export default DesignerDashboard;
