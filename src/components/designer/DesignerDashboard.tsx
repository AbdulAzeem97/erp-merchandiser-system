/* CACHE_BUST_VERSION_2 - FORCE_RELOAD_NOW */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateRatioReportPDF } from '@/utils/ratioReportPdfGenerator';
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
  Shield,
  ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GoogleDrivePreview } from '../ui/GoogleDrivePreview';
import ModernColorPicker from '../ui/ModernColorPicker';
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

interface RatioReport {
  id: number;
  job_card_id: number;
  excel_file_link: string;
  excel_file_name: string;
  factory_name: string;
  po_number: string;
  job_number: string;
  brand_name: string;
  item_name: string;
  report_date: string;
  total_ups: number;
  total_sheets: number;
  total_plates: number;
  qty_produced: number;
  excess_qty: number;
  efficiency_percentage: number;
  excess_percentage: number;
  required_order_qty: number;
  color_details: Array<{
    color: string;
    size: string;
    requiredQty: number;
    plate: string;
    ups: number;
    sheets: number;
    qtyProduced: number;
    excessQty: number;
  }>;
  plate_distribution: Record<string, number>;
  color_efficiency: Record<string, number>;
  raw_excel_data: any;
  created_at: string;
}

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
  client_layout_link: string;
  final_design_link: string;
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
  // Item Specifications
  itemSpecifications?: {
    id: string;
    excel_file_name: string;
    item_count: number;
    total_quantity: number;
    size_variants: number;
    color_variants: number;
    items: Array<{
      item_code: string;
      color: string;
      size: string;
      quantity: number;
      secondary_code?: string;
      decimal_value?: number;
      material?: string;
    }>;
  };
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
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [isEditingColor, setIsEditingColor] = useState(false);
  const [ratioReport, setRatioReport] = useState<RatioReport | null>(null);
  const [isRatioReportOpen, setIsRatioReportOpen] = useState(false);
  const [markedItems, setMarkedItems] = useState<Set<number>>(new Set());
  const [newStatus, setNewStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [isProcessSequenceModalOpen, setIsProcessSequenceModalOpen] = useState(false);
  const [selectedJobForProcessEdit, setSelectedJobForProcessEdit] = useState<DesignerJob | null>(null);
  const [jobProcessSequences, setJobProcessSequences] = useState<{[jobId: string]: any}>({});
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isSubmitToQADialogOpen, setIsSubmitToQADialogOpen] = useState(false);
  const [finalDesignLink, setFinalDesignLink] = useState('');

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

          // Fetch item specifications for this job
          let itemSpecifications = null;
          try {
            const itemSpecsResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/jobs/${job.id}/item-specifications`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            if (itemSpecsResponse.ok) {
              const itemSpecsResult = await itemSpecsResponse.json();
              if (itemSpecsResult.success && itemSpecsResult.itemSpecifications) {
                itemSpecifications = itemSpecsResult.itemSpecifications;
                console.log(`📋 Item specifications for job ${job.id}:`, itemSpecifications);
              }
            }
          } catch (error) {
            console.warn(`⚠️ Could not fetch item specifications for job ${job.id}:`, error);
          }

          const product = completeProductInfo?.product || completeProductInfo || {};
          
          // Return job with complete product information and process sequence
          return {
            ...job,
            // Job ID mapping (ensure we have the correct job ID)
            id: job.id.toString(),
            job_card_id: job.jobNumber || `JC-${job.id}`,
            // Complete product information from API
            product_name: product.name || job.product_name || 'N/A',
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
            due_date: job.dueDate || job.due_date, // Add due date mapping
            // Additional complete information
            customer_name: job.customerName || job.company_name || 'N/A',
            client_layout_link: job.clientLayoutLink || job.client_layout_link || '',
            final_design_link: job.finalDesignLink || job.final_design_link || '',
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
            // Item Specifications
            itemSpecifications: itemSpecifications || null,
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
        
        // Filter jobs to only show: PENDING, ASSIGNED, IN_PROGRESS, and REJECTED (revised from QA)
        // Exclude: APPROVED_BY_QA, SUBMITTED_TO_QA, COMPLETED, HOD_REVIEW, PAUSED, and other statuses
        const allowedStatuses = ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'REJECTED'];
        const excludedStatuses = ['APPROVED_BY_QA', 'SUBMITTED_TO_QA', 'COMPLETED', 'HOD_REVIEW', 'PAUSED'];
        const filteredDesignerJobs = designerJobsWithCompleteInfo.filter((job: DesignerJob) => {
          const jobStatus = (job.status || job.prepress_status || '').toUpperCase();
          // Exclude explicitly excluded statuses first
          if (excludedStatuses.includes(jobStatus)) {
            return false;
          }
          // Only include allowed statuses
          return allowedStatuses.includes(jobStatus);
        });
        
        console.log(`📊 Filtered jobs: ${filteredDesignerJobs.length} out of ${designerJobsWithCompleteInfo.length} total jobs`);
        console.log('📊 Allowed statuses:', allowedStatuses);
        console.log('📊 Filtered job statuses:', filteredDesignerJobs.map((j: DesignerJob) => j.status || j.prepress_status));
        
        setJobs(filteredDesignerJobs);
        setFilteredJobs(filteredDesignerJobs);
        
        // Calculate stats based on filtered jobs only
        const jobStats = {
          total_jobs: filteredDesignerJobs.length,
          assigned_jobs: filteredDesignerJobs.filter((job: DesignerJob) => (job.status === 'ASSIGNED' || job.status === 'PENDING')).length,
          in_progress_jobs: filteredDesignerJobs.filter((job: DesignerJob) => job.status === 'IN_PROGRESS').length,
          completed_jobs: 0, // Not showing completed jobs in designer portal
          paused_jobs: 0, // Not showing paused jobs in designer portal
          hod_review_jobs: 0, // Not showing HOD review jobs in designer portal
          revised_jobs: filteredDesignerJobs.filter((job: DesignerJob) => job.status === 'REJECTED').length
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

  // Load ratio report for a specific job
  const loadRatioReport = async (jobId: string) => {
    try {
      toast.info('Loading ratio report...');
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/jobs/${jobId}/ratio-report`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.ratioReport) {
          console.log('📊 Ratio Report Data:', data.ratioReport);
          console.log('📊 Raw Excel Data:', data.ratioReport.raw_excel_data);
          console.log('📊 Color Details:', data.ratioReport.color_details);
          
          // Open modal with report data
          setRatioReport(data.ratioReport);
          setMarkedItems(new Set()); // Reset marked items
          setIsRatioReportOpen(true);
          toast.success('Ratio report loaded! 📊');
        } else {
          toast.info('No ratio report found for this job');
        }
      } else if (response.status === 404) {
        toast.info('No ratio report uploaded for this job yet');
      } else {
        toast.error('Failed to load ratio report');
      }
    } catch (error) {
      console.error('Error loading ratio report:', error);
      toast.error('Error loading ratio report');
    }
  };

  // Toggle marked item
  const toggleMarkedItem = (index: number) => {
    setMarkedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  // Download PDF of ratio report
  const downloadRatioReportPDF = () => {
    if (ratioReport) {
      generateRatioReportPDF(ratioReport);
      toast.success('PDF downloaded! 📄');
    }
  };

  // Helper to safely render values (convert objects to strings)
  const safeRender = (value: any): string => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'object') {
      console.warn('⚠️ Attempting to render object as string:', value);
      return JSON.stringify(value);
    }
    return String(value);
  };

  // Filter jobs
  useEffect(() => {
    let filtered = jobs;

    if (searchTerm) {
      filtered = filtered.filter(job =>
        job.job_card_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.product_name.toLowerCase().includes(searchTerm.toLowerCase())
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

  const handleSubmitToQA = async () => {
    if (!selectedJob || !finalDesignLink.trim()) {
      toast.error('Please provide a final design link');
      return;
    }

    try {
      // Update job with final design link and status
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api'}/jobs/${selectedJob.id}/submit-to-qa`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          finalDesignLink: finalDesignLink.trim(),
          status: 'SUBMITTED_TO_QA'
        })
      });

      if (response.ok) {
        toast.success('Job submitted to QA successfully! 🎨');
        setIsSubmitToQADialogOpen(false);
        setFinalDesignLink('');
        loadJobs(); // Refresh the jobs list
      } else {
        const errorData = await response.json();
        toast.error(`Failed to submit to QA: ${errorData.error}`);
      }
    } catch (error) {
      console.error('❌ Error submitting to QA:', error);
      toast.error('Failed to submit to QA');
    }
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
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="ASSIGNED">Assigned</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="REJECTED">Revised from QA</SelectItem>
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredJobs.map((job, index) => (
                  <motion.div
                    key={job.prepress_job_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.02, y: -4 }}
                    onClick={() => setSelectedJob(job)}
                    className="bg-white border border-gray-200 rounded-lg overflow-hidden cursor-pointer hover:shadow-lg hover:border-blue-400 transition-all duration-300"
                  >
                    {/* Card Header with Status Banner */}
                    <div className={`${statusColors[job.status]} px-4 py-2 flex items-center justify-between`}>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(job.status)}
                        <span className="font-semibold text-sm">{job.status.replace('_', ' ')}</span>
                      </div>
                      <Badge className={`${priorityColors[job.priority]} border-0`}>
                        {getPriorityIcon(job.priority)}
                        <span className="ml-1">{job.priority}</span>
                      </Badge>
                    </div>

                    {/* Card Body */}
                    <div className="p-4 space-y-3">
                      {/* Job ID */}
                      <div className="flex items-center gap-2 border-b pb-2">
                        <Package className="h-4 w-4 text-blue-600" />
                        <h3 className="font-bold text-lg text-gray-900">{job.job_card_id || job.job_card_number}</h3>
                      </div>

                      {/* Key Info Grid */}
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Product:</span>
                          <span className="font-medium text-gray-900 text-right">{job.product_item_code}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Brand:</span>
                          <span className="font-medium text-gray-900 text-right">{job.product_brand || 'N/A'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Customer:</span>
                          <span className="font-medium text-gray-900 text-right truncate max-w-[150px]">{job.customer_name || job.company_name}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Quantity:</span>
                          <span className="font-medium text-gray-900">{job.quantity.toLocaleString()} units</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Material:</span>
                          <span className="font-medium text-gray-900 text-right truncate max-w-[150px]">{job.product_material || 'N/A'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Color:</span>
                          <span className="font-medium text-gray-900">{job.product_color || 'N/A'}</span>
                        </div>
                      </div>

                      {/* Due Date Highlight */}
                      <div className={`flex items-center justify-between p-2 rounded ${getDaysUntilDue(job.due_date) <= 2 ? 'bg-red-50' : 'bg-gray-50'}`}>
                        <div className="flex items-center gap-1">
                          <Clock className={`h-4 w-4 ${getDaysUntilDue(job.due_date) <= 2 ? 'text-red-600' : 'text-gray-600'}`} />
                          <span className="text-xs text-gray-600">Due Date:</span>
                        </div>
                        <span className={`text-sm font-semibold ${getDaysUntilDue(job.due_date) <= 2 ? 'text-red-600' : 'text-gray-900'}`}>
                          {formatDate(job.due_date)} ({getDaysUntilDue(job.due_date)}d)
                        </span>
                      </div>

                      {/* Quick Actions */}
                      <div className="flex gap-2 pt-2">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedJob(job);
                          }}
                          variant="outline"
                          size="sm"
                          className="flex-1 text-blue-600 border-blue-300 hover:bg-blue-50"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Details
                        </Button>
                        {job.status === 'IN_PROGRESS' && (
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedJob(job);
                              setIsSubmitToQADialogOpen(true);
                            }}
                            size="sm"
                            className="flex-1 bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Submit
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        </motion.div>
        </div>
      </div>

      {/* Job Details Modal - shown when clicking on a job card */}
      <Dialog open={!!selectedJob && !isStatusDialogOpen && !isSubmitToQADialogOpen} onOpenChange={(open) => !open && setSelectedJob(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Job Details - {selectedJob?.job_card_id || selectedJob?.job_card_number}
            </DialogTitle>
          </DialogHeader>

          {selectedJob && (
            <div className="space-y-4">
              {/* Status and Priority */}
              <div className="flex items-center gap-3">
                <Badge className={`${statusColors[selectedJob.status]}`}>
                  {getStatusIcon(selectedJob.status)}
                  <span className="ml-1">{selectedJob.status.replace('_', ' ')}</span>
                </Badge>
                <Badge className={`${priorityColors[selectedJob.priority]}`}>
                  {getPriorityIcon(selectedJob.priority)}
                  <span className="ml-1">{selectedJob.priority}</span>
                </Badge>
                {getDaysUntilDue(selectedJob.due_date) <= 2 && (
                  <Badge className="bg-red-500 text-white animate-pulse">
                    <Zap className="h-3 w-3 mr-1" />
                    URGENT - {getDaysUntilDue(selectedJob.due_date)}d remaining
                  </Badge>
                )}
              </div>

              {/* Product Specifications */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-3">Product Specifications</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                  <div><span className="font-medium text-gray-600">Name:</span> <span className="text-gray-900">{selectedJob.product_name}</span></div>
                  <div><span className="font-medium">Brand:</span> {selectedJob.product_brand}</div>
                  <div><span className="font-medium">Type:</span> {selectedJob.product_type}</div>
                  <div><span className="font-medium">Material:</span> {selectedJob.product_material}</div>
                  <div><span className="font-medium">GSM:</span> {selectedJob.product_gsm} g/m²</div>
                  <div><span className="font-medium">Category:</span> {selectedJob.product_category}</div>
                  <div><span className="font-medium">FSC:</span> {selectedJob.product_fsc}</div>
                  <div><span className="font-medium">FSC Claim:</span> {selectedJob.product_fsc_claim}</div>
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">Color:</span> 
                                  <div className="flex items-center space-x-2">
                      <span className="text-sm">{selectedJob.product_color}</span>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                          setSelectedColor(selectedJob.product_color);
                                        setIsEditingColor(true);
                                      }}
                                      className="h-6 w-6 p-0"
                                    >
                                      <Palette className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                          </div>
                {selectedJob.product_remarks && selectedJob.product_remarks !== 'N/A' && (
                                <div className="mt-2 text-sm">
                    <span className="font-medium">Remarks:</span> {selectedJob.product_remarks}
                          </div>
                              )}
                        </div>

                            {/* Google Drive Links Section */}
              {(selectedJob.client_layout_link || selectedJob.final_design_link) && (
                              <div className="bg-blue-50 p-3 rounded-lg mt-3">
                                <h4 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                                  <ExternalLink className="h-4 w-4" />
                                  Google Drive Links
                                </h4>
                                <div className="space-y-3">
                    {selectedJob.client_layout_link && (
                                    <GoogleDrivePreview
                        url={selectedJob.client_layout_link}
                                      label="Client Layout"
                                      showThumbnail={true}
                                      showPreview={true}
                                    />
                                  )}
                    {selectedJob.final_design_link && (
                                    <GoogleDrivePreview
                        url={selectedJob.final_design_link}
                                      label="Final Design"
                                      showThumbnail={true}
                                      showPreview={true}
                                    />
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Customer Information */}
                            <div className="bg-purple-50 p-3 rounded-lg">
                              <h4 className="font-medium text-gray-800 mb-2">Customer Information</h4>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                  <div><span className="font-medium">Name:</span> {selectedJob.customer_name || selectedJob.company_name}</div>
                  {selectedJob.customer_email && selectedJob.customer_email !== 'N/A' && (
                    <div><span className="font-medium">Email:</span> {selectedJob.customer_email}</div>
                  )}
                  {selectedJob.customer_phone && selectedJob.customer_phone !== 'N/A' && (
                    <div><span className="font-medium">Phone:</span> {selectedJob.customer_phone}</div>
                  )}
                  {selectedJob.customer_address && selectedJob.customer_address !== 'N/A' && (
                                  <div className="col-span-2">
                      <span className="font-medium">Address:</span> {selectedJob.customer_address}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Item Specifications */}
                            {selectedJob.itemSpecifications && selectedJob.itemSpecifications.items && selectedJob.itemSpecifications.items.length > 0 && (
                              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                  <Package className="h-4 w-4" />
                                  Item Specifications
                                </h4>
                                <div className="mb-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                  <div className="bg-white p-2 rounded">
                                    <span className="text-gray-600 text-xs">Total Items</span>
                                    <div className="font-bold text-gray-900">{selectedJob.itemSpecifications.item_count || selectedJob.itemSpecifications.items.length}</div>
                                  </div>
                                  <div className="bg-white p-2 rounded">
                                    <span className="text-gray-600 text-xs">Total Quantity</span>
                                    <div className="font-bold text-gray-900">{selectedJob.itemSpecifications.total_quantity?.toLocaleString() || selectedJob.itemSpecifications.items.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0).toLocaleString()}</div>
                                  </div>
                                  <div className="bg-white p-2 rounded">
                                    <span className="text-gray-600 text-xs">Sizes</span>
                                    <div className="font-bold text-gray-900">{selectedJob.itemSpecifications.size_variants || new Set(selectedJob.itemSpecifications.items.map((i: any) => i.size)).size}</div>
                                  </div>
                                  <div className="bg-white p-2 rounded">
                                    <span className="text-gray-600 text-xs">Colors</span>
                                    <div className="font-bold text-gray-900">{selectedJob.itemSpecifications.color_variants || new Set(selectedJob.itemSpecifications.items.map((i: any) => i.color)).size}</div>
                                  </div>
                                </div>
                                <div className="max-h-60 overflow-y-auto border rounded-lg bg-white">
                                  <table className="w-full text-xs">
                                    <thead className="bg-gray-100 sticky top-0">
                                      <tr>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-700">Item Code</th>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-700">Color</th>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-700">Size</th>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-700">Quantity</th>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-700">Secondary Code</th>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-700">Material</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                      {selectedJob.itemSpecifications.items.slice(0, 50).map((item: any, index: number) => (
                                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                          <td className="px-3 py-2 font-mono text-gray-900">{item.item_code}</td>
                                          <td className="px-3 py-2">
                                            <Badge variant="outline" className="bg-gray-50">{item.color}</Badge>
                                          </td>
                                          <td className="px-3 py-2 font-medium text-gray-900">{item.size}</td>
                                          <td className="px-3 py-2 font-semibold text-gray-900">{item.quantity?.toLocaleString() || '0'}</td>
                                          <td className="px-3 py-2 font-mono text-gray-600">{item.secondary_code || '-'}</td>
                                          <td className="px-3 py-2 text-gray-600">{item.material || '-'}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                  {selectedJob.itemSpecifications.items.length > 50 && (
                                    <div className="px-3 py-2 text-center text-xs text-gray-500 bg-gray-50">
                                      Showing first 50 of {selectedJob.itemSpecifications.items.length} items
                                    </div>
                                  )}
                                </div>
                                {selectedJob.itemSpecifications.excel_file_name && (
                                  <div className="mt-2 text-xs text-gray-600">
                                    <span className="font-medium">File:</span> {selectedJob.itemSpecifications.excel_file_name}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Job Details */}
                            <div className="bg-blue-50 p-3 rounded-lg">
                              <h4 className="font-medium text-gray-800 mb-2">Job Details</h4>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                  <div><span className="font-medium">Quantity:</span> {selectedJob.quantity} units</div>
                  <div><span className="font-medium">PO Number:</span> {selectedJob.po_number}</div>
                                <div><span className="font-medium">Priority:</span> 
                                  <span className={`ml-1 px-2 py-1 rounded text-xs ${
                      selectedJob.priority === 'HIGH' ? 'bg-red-100 text-red-800' :
                      selectedJob.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-green-100 text-green-800'
                                  }`}>
                      {selectedJob.priority}
                                  </span>
                                </div>
                  {selectedJob.delivery_address && selectedJob.delivery_address !== 'N/A' && (
                                  <div className="col-span-2">
                      <span className="font-medium">Delivery Address:</span> {selectedJob.delivery_address}
                                  </div>
                                )}
                  {selectedJob.special_instructions && selectedJob.special_instructions !== 'N/A' && (
                                  <div className="col-span-2">
                      <span className="font-medium">Special Instructions:</span> {selectedJob.special_instructions}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Ratio Report Section */}
                            <div className="bg-purple-50 p-3 rounded-lg mt-3">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium text-gray-800 flex items-center gap-2">
                                  <BarChart3 className="h-4 w-4" />
                                  Production Ratio Report
                                </h4>
                                <Button
                    onClick={() => loadRatioReport(selectedJob.id)}
                                  variant="outline"
                                  size="sm"
                                  className="text-purple-700 border-purple-300 hover:bg-purple-100"
                                >
                                  <BarChart3 className="h-3 w-3 mr-1" />
                                  View Report
                                </Button>
                              </div>
                              <p className="text-xs text-gray-600">
                                View production metrics, color details, and efficiency data for this job
                              </p>
                            </div>

                            {/* Process Sequence Display */}
              {selectedJob.process_sequence && selectedJob.process_sequence.steps && Array.isArray(selectedJob.process_sequence.steps) && selectedJob.process_sequence.steps.length > 0 && (
                              <div className="p-2 bg-green-50 rounded-lg border border-green-200">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="text-sm font-medium text-green-800">Process Sequence</h4>
                    <span className="text-xs text-green-600">Product Type: {selectedJob.product_type}</span>
                                </div>
                                <div className="text-xs text-green-600 mb-2">
                                  Process steps configured for this product type. You can modify as needed.
                                </div>
                                <div className="flex flex-wrap gap-1">
                    {selectedJob.process_sequence.steps.map((step, idx) => (
                      <Badge key={step.id || idx} variant="outline" className="text-xs">
                        {typeof step === 'object' && step.name ? `${step.name} (${step.estimatedHours || 0}h)` : String(step)}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Prepress Workflow Status */}
              {selectedJob.prepress_status && (
                              <div className="p-2 bg-blue-50 rounded-lg border border-blue-200">
                                <h4 className="text-sm font-medium text-blue-800 mb-2">Prepress Workflow</h4>
                                <div className="text-xs text-blue-600">
                    Current Status: {selectedJob.prepress_status} | Progress: {typeof selectedJob.workflow_progress === 'object' && selectedJob.workflow_progress?.progress !== undefined ? selectedJob.workflow_progress.progress : 0}%
                                </div>
                              </div>
                            )}

              {selectedJob.customer_notes && (
                              <div className="mb-2">
                                <span className="text-sm font-medium text-gray-700">Customer Notes:</span>
                  <p className="text-sm text-gray-600">{selectedJob.customer_notes}</p>
                          </div>
                        )}

              {selectedJob.progress > 0 && (
                          <div className="mb-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm text-gray-600">Progress</span>
                    <span className="text-sm font-medium">{selectedJob.progress}%</span>
                            </div>
                  <Progress value={selectedJob.progress} className="h-2" />
                          </div>
                        )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  onClick={() => {
                    setIsStatusDialogOpen(true);
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Update Status
                </Button>
                {selectedJob.status === 'IN_PROGRESS' && (
                  <Button
                    onClick={() => {
                      setIsSubmitToQADialogOpen(true);
                    }}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Submit to QA
                  </Button>
                )}
              </div>
                      </div>
          )}
        </DialogContent>
      </Dialog>

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
                    updateJobStatus(selectedJob.id, newStatus, statusNotes);
                  }
                }}
              >
                Update Status
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Submit to QA Dialog */}
      <Dialog open={isSubmitToQADialogOpen} onOpenChange={setIsSubmitToQADialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit to QA</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Job: {selectedJob?.job_card_number}</Label>
            </div>
            
            {/* Client Layout Link Display */}
            {selectedJob?.client_layout_link && (
              <div>
                <Label className="text-sm font-medium text-gray-600">Client Layout</Label>
                <div className="flex items-center gap-2 mt-1">
                  <a
                    href={selectedJob.client_layout_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View Client Layout
                  </a>
                </div>
              </div>
            )}
            
            <div>
              <Label htmlFor="finalDesignLink">Final Design Link (Google Drive)</Label>
              <Input
                id="finalDesignLink"
                type="url"
                value={finalDesignLink}
                onChange={(e) => setFinalDesignLink(e.target.value)}
                placeholder="https://drive.google.com/file/d/..."
                className="font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Upload your final design (PDF/AI) to Google Drive and paste the shareable link here
              </p>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsSubmitToQADialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitToQA}
                disabled={!finalDesignLink.trim()}
                className="bg-green-600 hover:bg-green-700"
              >
                Submit to QA
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
                          <p className="font-medium">{formatDate(jobDetailsData.due_date)}</p>
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

      {/* Color Picker Modal */}
      <Dialog open={isEditingColor} onOpenChange={setIsEditingColor}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Edit Color - {selectedJob?.job_card_number}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-800 mb-2">Product Information</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div><strong>Product:</strong> {selectedJob?.product_name}</div>
                <div><strong>Current Color:</strong> {selectedJob?.product_color}</div>
              </div>
            </div>
            
            <ModernColorPicker
              value={selectedColor}
              onChange={setSelectedColor}
              label="Select New Color"
              placeholder="Choose a color for this product"
              showPreview={true}
            />
            
            <div className="bg-blue-50 p-3 rounded-lg">
              <h5 className="font-medium text-blue-800 mb-2">Color Guidelines</h5>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Use brand-specific colors when available</li>
                <li>• Consider print limitations and color accuracy</li>
                <li>• Verify color specifications with client requirements</li>
              </ul>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsEditingColor(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                // Here you would typically save the color to the backend
                toast.success(`Color updated to ${selectedColor}`);
                setIsEditingColor(false);
                // Update the job data with new color
                if (selectedJob) {
                  const updatedJobs = jobs.map(job => 
                    job.id === selectedJob.id 
                      ? { ...job, product_color: selectedColor }
                      : job
                  );
                  setJobs(updatedJobs);
                }
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Palette className="h-4 w-4 mr-2" />
              Update Color
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Ratio Report Modal */}
      <Dialog open={isRatioReportOpen} onOpenChange={setIsRatioReportOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Production Ratio Report - {ratioReport?.job_number}
            </DialogTitle>
          </DialogHeader>
          
          {ratioReport && (
            <div className="space-y-6">
              {/* Instructions and Actions */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border-2 border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-blue-900 flex items-center gap-2">
                    <span className="text-2xl">📋</span>
                    How to use this report
                  </h4>
                  <Button
                    onClick={downloadRatioReportPDF}
                    variant="outline"
                    size="sm"
                    className="bg-white hover:bg-blue-50"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                </div>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Click on any row in the Color Details table to mark it as processed</li>
                  <li>• Marked items will turn green with a checkmark ✓</li>
                  <li>• This helps you track which items you've already worked on</li>
                  <li>• Your progress is shown in the header: {markedItems.size}/{ratioReport.color_details?.length || 0} items completed</li>
                </ul>
              </div>

              {/* Order Information */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-3">Order Information</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div><strong>Factory:</strong> {safeRender(ratioReport.factory_name)}</div>
                  <div><strong>PO Number:</strong> {safeRender(ratioReport.po_number)}</div>
                  <div><strong>Job Number:</strong> {safeRender(ratioReport.job_number)}</div>
                  <div><strong>Brand:</strong> {safeRender(ratioReport.brand_name)}</div>
                  <div><strong>Item:</strong> {safeRender(ratioReport.item_name)}</div>
                  <div><strong>Report Date:</strong> {ratioReport.report_date ? new Date(ratioReport.report_date).toLocaleDateString() : 'N/A'}</div>
                </div>
              </div>

              {/* Production Metrics */}
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-800 mb-3">Production Metrics</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {/* CACHE_BUST_2025_01_01 */}{ratioReport.total_ups !== null && ratioReport.total_ups !== undefined ? ratioReport.total_ups : 'N/A'}
                    </div>
                    <div className="text-sm text-green-700">Total UPS</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {/* CACHE_BUST_2025_01_01 */}{ratioReport.total_sheets !== null && ratioReport.total_sheets !== undefined ? ratioReport.total_sheets : 'N/A'}
                    </div>
                    <div className="text-sm text-green-700">Total Sheets</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {/* CACHE_BUST_2025_01_01 */}{ratioReport.total_plates !== null && ratioReport.total_plates !== undefined ? ratioReport.total_plates : 'N/A'}
                    </div>
                    <div className="text-sm text-green-700">Total Plates</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {/* CACHE_BUST_2025_01_01 */}{ratioReport.qty_produced !== null && ratioReport.qty_produced !== undefined ? ratioReport.qty_produced : 'N/A'}
                    </div>
                    <div className="text-sm text-green-700">Qty Produced</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {/* CACHE_BUST_2025_01_01 */}{ratioReport.excess_qty !== null && ratioReport.excess_qty !== undefined ? ratioReport.excess_qty : 'N/A'}
                    </div>
                    <div className="text-sm text-orange-700">Excess Qty</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {(ratioReport.efficiency_percentage !== null && ratioReport.efficiency_percentage !== undefined && typeof ratioReport.efficiency_percentage === 'number')
                        ? `${ratioReport.efficiency_percentage.toFixed(1)}%`
                        : 'N/A'
                      }
                    </div>
                    <div className="text-sm text-blue-700">Efficiency</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {(ratioReport.excess_percentage !== null && ratioReport.excess_percentage !== undefined && typeof ratioReport.excess_percentage === 'number')
                        ? `${ratioReport.excess_percentage.toFixed(1)}%`
                        : 'N/A'
                      }
                    </div>
                    <div className="text-sm text-purple-700">Excess %</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-indigo-600">
                      {/* CACHE_BUST_2025_01_01 */}{ratioReport.required_order_qty !== null && ratioReport.required_order_qty !== undefined ? ratioReport.required_order_qty : 'N/A'}
                    </div>
                    <div className="text-sm text-indigo-700">Required Qty</div>
                  </div>
                </div>
              </div>

              {/* Color Details Table */}
              {ratioReport.color_details && Array.isArray(ratioReport.color_details) && ratioReport.color_details.length > 0 && (
                <div className="bg-white border rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between bg-gray-50 p-3 border-b">
                    <h4 className="font-medium">Color Details</h4>
                    <span className="text-xs text-gray-600">
                      💡 Click on any row to mark it as processed ({markedItems.size}/{ratioReport.color_details.length})
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left">Status</th>
                          <th className="px-3 py-2 text-left">Color</th>
                          <th className="px-3 py-2 text-left">Size</th>
                          <th className="px-3 py-2 text-left">Required Qty</th>
                          <th className="px-3 py-2 text-left">Plate</th>
                          <th className="px-3 py-2 text-left">UPS</th>
                          <th className="px-3 py-2 text-left">Sheets</th>
                          <th className="px-3 py-2 text-left">Qty Produced</th>
                          <th className="px-3 py-2 text-left">Excess Qty</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ratioReport.color_details.map((detail, index) => {
                          const isMarked = markedItems.has(index);
                          return (
                          <tr 
                            key={index} 
                            onClick={() => toggleMarkedItem(index)}
                            className={`cursor-pointer transition-all duration-200 ${
                              isMarked 
                                ? 'bg-green-100 hover:bg-green-200 border-l-4 border-green-500' 
                                : index % 2 === 0 
                                  ? 'bg-white hover:bg-blue-50' 
                                  : 'bg-gray-50 hover:bg-blue-50'
                            }`}
                          >
                            <td className="px-3 py-2 text-center">
                              {isMarked ? (
                                <span className="text-green-600 font-bold text-lg">✓</span>
                              ) : (
                                <span className="text-gray-300">○</span>
                              )}
                            </td>
                            <td className="px-3 py-2">{safeRender(detail.color)}</td>
                            <td className="px-3 py-2">{safeRender(detail.size)}</td>
                            <td className="px-3 py-2">{safeRender(detail.requiredQty)}</td>
                            <td className="px-3 py-2 font-medium text-blue-600">{safeRender(detail.plate)}</td>
                            <td className="px-3 py-2">{safeRender(detail.ups)}</td>
                            <td className="px-3 py-2">{safeRender(detail.sheets)}</td>
                            <td className="px-3 py-2">{safeRender(detail.qtyProduced)}</td>
                            <td className="px-3 py-2">
                              <span className={(typeof detail.excessQty === 'number' && detail.excessQty > 0) ? 'text-orange-600 font-medium' : 'text-green-600'}>
                                {safeRender(detail.excessQty)}
                              </span>
                            </td>
                          </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Plate Distribution - Enhanced Modern UI */}
              {ratioReport.plate_distribution && typeof ratioReport.plate_distribution === 'object' && Object.keys(ratioReport.plate_distribution).length > 0 && (() => {
                const plateEntries = Object.entries(ratioReport.plate_distribution);
                const totalCount = plateEntries.reduce((sum, [, count]) => sum + (typeof count === 'number' ? count : 0), 0);
                const plateColors = [
                  'from-blue-500 to-blue-600',
                  'from-purple-500 to-purple-600',
                  'from-pink-500 to-pink-600',
                  'from-orange-500 to-orange-600',
                  'from-teal-500 to-teal-600',
                  'from-indigo-500 to-indigo-600',
                  'from-red-500 to-red-600',
                  'from-green-500 to-green-600'
                ];
                
                return (
                  <div className="bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 p-6 rounded-xl border-2 border-orange-200 shadow-lg">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg shadow-md">
                          <BarChart3 className="w-6 h-6 text-white" />
                      </div>
                        <div>
                          <h4 className="text-xl font-bold text-gray-800">Plate Distribution Analysis</h4>
                          <p className="text-sm text-gray-600">Total of {totalCount} items across {plateEntries.length} plates</p>
                  </div>
                </div>
                      <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 shadow-md px-4 py-2 text-sm">
                        {plateEntries.length} Plates
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {plateEntries.map(([plate, count], index) => {
                        const percentage = totalCount > 0 ? ((typeof count === 'number' ? count : 0) / totalCount * 100).toFixed(1) : 0;
                        const colorGradient = plateColors[index % plateColors.length];
                        
                        return (
                          <motion.div
                            key={plate}
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ delay: index * 0.1, duration: 0.3 }}
                            whileHover={{ scale: 1.05, y: -5 }}
                            className="group relative"
                          >
                            <div className={`relative bg-gradient-to-br ${colorGradient} p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden`}>
                              {/* Background decoration */}
                              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-12 translate-x-12"></div>
                              <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-8 -translate-x-8"></div>
                              
                              {/* Content */}
                              <div className="relative z-10">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                                      <Package className="w-5 h-5 text-white" />
                                    </div>
                                    <span className="text-white/90 text-sm font-medium">Plate</span>
                                  </div>
                                  <Badge className="bg-white/20 backdrop-blur-sm text-white border-0 text-xs">
                                    {percentage}%
                                  </Badge>
                                </div>
                                
                                <div className="text-center py-4">
                                  <div className="text-5xl font-black text-white mb-1 drop-shadow-lg">
                                    {safeRender(plate)}
                                  </div>
                                  <div className="text-3xl font-bold text-white/90">
                                    {safeRender(count)}
                                  </div>
                                  <div className="text-sm text-white/70 mt-1">
                                    items
                                  </div>
                                </div>
                                
                                {/* Progress bar */}
                                <div className="mt-4 bg-white/20 rounded-full h-2 overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${percentage}%` }}
                                    transition={{ delay: index * 0.1 + 0.3, duration: 0.8, ease: "easeOut" }}
                                    className="h-full bg-white/80 rounded-full"
                                  />
                                </div>
                              </div>
                              
                              {/* Hover effect overlay */}
                              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all duration-300 rounded-xl"></div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                    
                    {/* Summary footer */}
                    <div className="mt-6 pt-4 border-t-2 border-orange-200">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"></div>
                          <span className="text-gray-700 font-medium">Production Efficiency Indicator</span>
                        </div>
                        <span className="text-gray-600">
                          Average: {(totalCount / plateEntries.length).toFixed(1)} items/plate
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Excel File Link */}
              {ratioReport.excel_file_link && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-800 mb-2">Source File</h4>
                  <a 
                    href={ratioReport.excel_file_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    {ratioReport.excel_file_name || 'Download Excel Report'}
                  </a>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default DesignerDashboard;
