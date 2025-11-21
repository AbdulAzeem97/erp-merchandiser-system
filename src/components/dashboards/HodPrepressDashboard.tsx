import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PieChart, 
  Pie, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  AreaChart,
  Area,
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  Cell 
} from 'recharts';
import { 
  Package,
  Clock,
  User,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
  Calendar,
  Filter,
  Search,
  Bell,
  Settings,
  LogOut,
  FileText,
  Download,
  Activity,
  TrendingUp,
  Play,
  TrendingDown,
  Zap,
  Target,
  Award,
  BarChart3,
  UserPlus,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  Palette,
  Shield,
  RefreshCw,
  Layers,
  MonitorSpeaker,
  ExternalLink,
  XCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GoogleDrivePreview } from '../ui/GoogleDrivePreview';
import { ItemSpecificationsDisplay } from '../ui/ItemSpecificationsDisplay';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { MainLayout } from '../layout/MainLayout';
import BackendStatusIndicator from '../BackendStatusIndicator';
import { authAPI, jobsAPI, prepressWorkflowAPI, processSequencesAPI, usersAPI } from '@/services/api';
import { useSocket } from '@/services/socketService.tsx';
import PrepressWorkflowDisplay from '../prepress/PrepressWorkflowDisplay';
import ProcessSequenceModal from '../designer/ProcessSequenceModal';

interface HodPrepressDashboardProps {
  onNavigate?: (page: string) => void;
  onLogout?: () => void;
  currentPage?: string;
  isLoading?: boolean;
}

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

interface HODJob {
  id: string;
  job_card_id: string;
  jobNumber?: string;
  product_code: string;
  product_name: string;
  company_name: string;
  status: string;
  priority: string;
  due_date: string;
  created_at: string;
  assigned_designer?: string;
  assigned_designer_id?: string;
  designer_id?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  customer_address?: string;
  customer_notes?: string;
  client_layout_link?: string;
  final_design_link?: string;
  estimated_hours?: number;
  time_spent?: number;
  progress: number;
  started_at?: string;
  work_notes?: string;
  submission_notes?: string;
  submitted_at?: string;
  completed_at?: string;
  hod_notes?: string;
  // Complete product information
  product_type?: string;
  product_brand?: string;
  product_gsm?: number;
  product_material?: string;
  product_category?: string;
  product_fsc?: string;
  product_fsc_claim?: string;
  product_color?: string;
  product_remarks?: string;
  // Complete job details
  quantity?: number;
  po_number?: string;
  delivery_address?: string;
  special_instructions?: string;
  // Process sequence information
  process_sequence?: {
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
  // Prepress workflow
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
    excel_file_link?: string;
  };
}

interface Designer {
  id: string;
  name: string;
  email: string;
  active_jobs?: number;
  completed_today?: number;
}

// Mock data - to be replaced with real API calls
const mockPrepressJobs = [
  {
    id: 'pj-001',
    job_card_id: 'JC-001234',
    product_code: 'BR-00-139-A',
    company_name: 'JCP Brand',
    status: 'ASSIGNED',
    priority: 'HIGH',
    due_date: '2024-01-15',
    created_at: '2024-01-10',
    assigned_designer: 'Emma Wilson',
    designer_id: '8',
    progress: 25,
    customer_notes: 'Custom packaging design required'
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
    assigned_designer: 'James Brown',
    designer_id: '57c715e5-b409-4a3d-98f1-a37ab8b36215',
    progress: 60
  },
  {
    id: 'pj-003',
    job_card_id: 'JC-001236',
    product_code: 'BR-00-141-C',
    company_name: 'Adidas',
    status: 'HOD_REVIEW',
    priority: 'LOW',
    due_date: '2024-01-20',
    created_at: '2024-01-12',
    assigned_designer: 'Lisa Garcia',
    designer_id: 'c77488cf-fec8-4b5e-804a-23edcc644bb7',
    progress: 95
  },
  {
    id: 'pj-004',
    job_card_id: 'JC-001237',
    product_code: 'BR-00-142-D',
    company_name: 'Puma',
    status: 'PENDING',
    priority: 'HIGH',
    due_date: '2024-01-22',
    created_at: '2024-01-13',
    assigned_designer: null,
    designer_id: null,
    progress: 0
  }
];

const mockDesigners = [
  { id: '8', name: 'Emma Wilson', email: 'emma.wilson@horizonsourcing.com' },
  { id: '9', name: 'Alex Kumar', email: 'alex.kumar@horizonsourcing.com' },
  { id: '10', name: 'Sarah Johnson', email: 'sarah.johnson@horizonsourcing.com' }
];

const statusColors = {
  'PENDING': 'bg-gray-100 text-gray-800 border-gray-300',
  'ASSIGNED': 'bg-blue-100 text-blue-800 border-blue-300',
  'IN_PROGRESS': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'PAUSED': 'bg-orange-100 text-orange-800 border-orange-300',
  'HOD_REVIEW': 'bg-purple-100 text-purple-800 border-purple-300',
  'COMPLETED': 'bg-green-100 text-green-800 border-green-300',
  'REJECTED': 'bg-red-100 text-red-800 border-red-300'
};

const priorityColors = {
  'LOW': 'bg-green-100 text-green-800 border-green-300',
  'MEDIUM': 'bg-blue-100 text-blue-800 border-blue-300',
  'HIGH': 'bg-orange-100 text-orange-800 border-orange-300',
  'CRITICAL': 'bg-red-100 text-red-800 border-red-300'
};

// Mock productivity data
const weeklyProductivity = [
  { day: 'Mon', completed: 12, assigned: 15, inProgress: 8 },
  { day: 'Tue', completed: 15, assigned: 18, inProgress: 10 },
  { day: 'Wed', completed: 18, assigned: 20, inProgress: 12 },
  { day: 'Thu', completed: 14, assigned: 16, inProgress: 9 },
  { day: 'Fri', completed: 20, assigned: 22, inProgress: 14 },
  { day: 'Sat', completed: 8, assigned: 10, inProgress: 6 },
  { day: 'Sun', completed: 5, assigned: 8, inProgress: 4 }
];

export const HodPrepressDashboard: React.FC<HodPrepressDashboardProps> = ({ 
  onNavigate = () => {}, 
  onLogout = () => {},
  currentPage = 'prepressHOD',
  isLoading = false
}) => {
  const { isConnected, socket } = useSocket();
  const [prepressJobs, setPrepressJobs] = useState<HODJob[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<HODJob[]>([]);
  const [designers, setDesigners] = useState<Designer[]>([]);
  const [selectedStatus, setSelectedStatus] = useState('all'); // Show all jobs by default for HOD
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedDesigner, setSelectedDesigner] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [assigningJobId, setAssigningJobId] = useState<string | null>(null);
  const [reassigningJobId, setReassigningJobId] = useState<string | null>(null);
  const [newDesignerId, setNewDesignerId] = useState<string>('');
  const [isReassignDialogOpen, setIsReassignDialogOpen] = useState(false);
  const [selectedJobForReassign, setSelectedJobForReassign] = useState<HODJob | null>(null);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [isProcessSequenceModalOpen, setIsProcessSequenceModalOpen] = useState(false);
  const [selectedJobForProcessEdit, setSelectedJobForProcessEdit] = useState<HODJob | null>(null);
  const [jobProcessSequences, setJobProcessSequences] = useState<{[jobId: string]: any}>({});
  const [ratioReport, setRatioReport] = useState<RatioReport | null>(null);
  const [isRatioReportOpen, setIsRatioReportOpen] = useState(false);
  const [markedItems, setMarkedItems] = useState<Set<number>>(new Set());
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [selectedJobForStatusUpdate, setSelectedJobForStatusUpdate] = useState<HODJob | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [isDesignUploadDialogOpen, setIsDesignUploadDialogOpen] = useState(false);
  const [finalDesignLink, setFinalDesignLink] = useState('');
  const [isItemSpecsModalOpen, setIsItemSpecsModalOpen] = useState(false);
  const [selectedJobForItemSpecs, setSelectedJobForItemSpecs] = useState<HODJob | null>(null);
  const [isProcessSequenceViewModalOpen, setIsProcessSequenceViewModalOpen] = useState(false);
  const [selectedJobForProcessView, setSelectedJobForProcessView] = useState<HODJob | null>(null);
  const [ctpMachines, setCtpMachines] = useState<Array<{id: string; machine_code: string; machine_name: string; machine_type: string; manufacturer?: string; model?: string; location?: string; max_plate_size?: string}>>([]);
  const [isPlateInfoDialogOpen, setIsPlateInfoDialogOpen] = useState(false);
  const [selectedJobForPlateInfo, setSelectedJobForPlateInfo] = useState<HODJob | null>(null);
  const [machinePlatePairs, setMachinePlatePairs] = useState<Array<{machineId: string; plateCount: number | ''}>>([{machineId: '', plateCount: ''}]);
  const [machineSearchTerm, setMachineSearchTerm] = useState<string>('');

  // Load CTP machines
  const loadCTPMachines = async () => {
    try {
      console.log('🔄 Loading CTP machines...');
      const machinesResponse = await jobsAPI.getCTPMachines();
      console.log('📦 CTP machines response:', machinesResponse);
      if (machinesResponse.success && machinesResponse.machines) {
        const machinesWithStringIds = machinesResponse.machines.map((m: any) => ({
          ...m,
          id: String(m.id) // Ensure ID is string for consistency
        }));
        setCtpMachines(machinesWithStringIds);
        console.log('✅ CTP machines loaded:', machinesWithStringIds);
      } else {
        console.warn('⚠️ No machines in response:', machinesResponse);
      }
    } catch (error) {
      console.error('❌ Error loading CTP machines:', error);
      toast.error('Failed to load CTP machines');
    }
  };

  // Load all jobs and designers
  const loadHODData = async () => {
    setLoading(true);
    try {
      console.log('🔄 Loading HOD data...');
      
      // Load CTP machines if not already loaded
      if (ctpMachines.length === 0) {
        await loadCTPMachines();
      }
      
      // Load all jobs with complete details
      const jobsResponse = await jobsAPI.getAll();
      console.log('📋 All jobs response:', jobsResponse);
      
      if (jobsResponse.jobs) {
        const jobs: HODJob[] = await Promise.all(jobsResponse.jobs.map(async (job: any) => {
          // Fetch complete product information and process sequence for each job
          let completeProductInfo = null;
          let processSequence = null;
          
          try {
            // Fetch complete product information
            if (job.productId) {
              const productResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/products/${job.productId}/complete-process-info`, {
                headers: {
                  'Authorization': `Bearer ${localStorage.getItem('authToken')}`
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
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
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
            console.log('Could not fetch complete product info for job:', job.jobNumber);
          }

          // Fetch item specifications for this job
          let itemSpecifications = null;
          try {
            const itemSpecsResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/jobs/${job.id}/item-specifications`, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
              }
            });
            if (itemSpecsResponse.ok) {
              const itemSpecsResult = await itemSpecsResponse.json();
              if (itemSpecsResult.success && itemSpecsResult.itemSpecifications) {
                itemSpecifications = itemSpecsResult.itemSpecifications;
                console.log(`📋 Item specifications for job ${job.id}:`, itemSpecifications);
              }
            } else if (itemSpecsResponse.status === 404) {
              // Job doesn't have item specifications - this is normal, don't log as error
              // Silently continue without item specifications
            } else {
              console.warn(`⚠️ Could not fetch item specifications for job ${job.id}: Status ${itemSpecsResponse.status}`);
            }
          } catch (error) {
            // Only log non-404 errors
            if (error instanceof TypeError && !error.message.includes('404')) {
              console.warn(`⚠️ Could not fetch item specifications for job ${job.id}:`, error);
            }
          }

          const product = completeProductInfo?.product || completeProductInfo || {};
          
          return {
            id: job.id.toString(),
            job_card_id: job.jobNumber || `JC-${job.id}`,
            product_code: job.product_code || job.sku || product.product_item_code || 'N/A',
            product_name: job.product_name || job.name || product.name || 'N/A',
            company_name: job.company_name || 'N/A',
            status: job.status || 'PENDING',
            priority: job.urgency || job.priority || 'MEDIUM',
            due_date: job.dueDate || job.delivery_date || new Date().toISOString().split('T')[0],
            created_at: job.createdAt || job.created_at || new Date().toISOString(),
            assigned_designer: job.assigned_designer_name || job.assigned_designer || null,
            assigned_designer_id: job.assigned_designer_id || null,
            customer_name: job.customer_name || job.company_name || 'N/A',
            customer_email: job.customer_email || 'N/A',
            customer_phone: job.customer_phone || 'N/A',
            customer_address: job.customer_address || 'N/A',
            customer_notes: job.notes || job.description || '',
            client_layout_link: job.client_layout_link || '',
            final_design_link: job.final_design_link || '',
            estimated_hours: job.estimated_hours || 8,
            time_spent: job.time_spent || 0,
            progress: job.progress || 0,
            // Complete product information from API
            product_type: product.product_type || job.product_type || 'Offset',
            product_brand: product.brand || job.brand || 'N/A',
            product_gsm: product.gsm || job.gsm || 0,
            product_material: product.material_name || job.material_name || 'N/A',
            product_category: product.category_name || job.category_name || 'N/A',
            product_fsc: product.fsc || job.fsc || 'N/A',
            product_fsc_claim: product.fsc_claim || job.fsc_claim || 'N/A',
            product_color: product.color_specifications || product.color || job.color_specifications || 'N/A',
            product_remarks: product.remarks || job.remarks || 'N/A',
            // Job details
            quantity: job.quantity || 0,
            po_number: job.po_number || 'N/A',
            delivery_address: job.delivery_address || 'N/A',
            special_instructions: job.special_instructions || 'N/A',
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
            // Prepress workflow
            prepress_status: 'ASSIGNED',
            workflow_progress: {
              stages: [
                { key: 'DESIGNING', label: 'Designing', status: 'pending' },
                { key: 'DIE_MAKING', label: 'Die Making', status: 'pending' },
                { key: 'PLATE_MAKING', label: 'Plate Making', status: 'pending' },
                { key: 'PREPRESS_COMPLETED', label: 'Prepress Completed', status: 'pending' }
              ],
              currentStage: 'Designing',
              progress: 0
            },
            // Item Specifications
            itemSpecifications: itemSpecifications || null,
            // Plate and Machine Information (from job data if available)
            required_plate_count: job.required_plate_count || undefined,
            ctp_machine_id: job.ctp_machine_id || undefined,
            ctp_machine: (job.ctp_machine_id && job.ctp_machine_name) ? {
              id: job.ctp_machine_id,
              machine_code: job.ctp_machine_code || '',
              machine_name: job.ctp_machine_name || '',
              machine_type: job.ctp_machine_type || 'CTP',
              manufacturer: job.ctp_machine_manufacturer,
              model: job.ctp_machine_model,
              location: job.ctp_machine_location,
              max_plate_size: job.ctp_machine_max_plate_size
            } : undefined
          };
        }));
        
        console.log('✅ HOD jobs loaded:', jobs);
        setPrepressJobs(jobs);
        setFilteredJobs(jobs);
      }
      
      // Load real designers from API
      try {
        console.log('👥 Fetching real designers from API...');
        const designersResponse = await usersAPI.getDesigners();
        if (designersResponse.success && designersResponse.designers) {
          const realDesigners = designersResponse.designers.map(designer => ({
            id: designer.id.toString(),
            name: designer.fullName,
            email: designer.email
          }));
          console.log('✅ Real designers loaded:', realDesigners);
          setDesigners(realDesigners);
        } else {
          console.log('⚠️ Failed to load designers, using mock data');
          setDesigners(mockDesigners);
        }
      } catch (designerError) {
        console.log('⚠️ Error loading designers, using mock data:', designerError);
        setDesigners(mockDesigners);
      }
      
    } catch (error) {
      console.error('Error loading HOD data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Load ratio report for a specific job
  const loadRatioReport = async (jobId: string) => {
    try {
      console.log('🔄 Loading ratio report for job:', jobId);
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/jobs/${jobId}/ratio-report`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ API call successful');
        console.log('🔄 API Response:', data);
        if (data.success) {
          setRatioReport(data.ratioReport);
          setIsRatioReportOpen(true);
          setMarkedItems(new Set()); // Reset marked items when opening new report
          console.log('📊 Ratio report loaded:', data.ratioReport);
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

  // Toggle marked item in ratio report
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

  // Safe render function to handle any data type
  const safeRender = (value: any): string => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'string' || typeof value === 'number') return String(value);
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  // Download ratio report as PDF
  const downloadRatioReportPDF = async () => {
    if (!ratioReport) return;
    
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/jobs/${ratioReport.job_card_id}/ratio-report-pdf`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ratio-report-${ratioReport.job_number || 'report'}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Ratio report PDF downloaded successfully!');
      } else {
        toast.error('Failed to download PDF');
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Error downloading PDF');
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadHODData();
    
    if (socket && isConnected) {
      console.log('🔌 Setting up real-time updates for HOD...');
      
      // Join job updates room
      socket.emit('join_job_updates');
      
      // Listen for new jobs created by merchandiser
      socket.on('job_created', (data) => {
        console.log('🆕 New job created:', data);
        toast.success(`New job available: ${data.jobCardId}`, {
          description: `Priority: ${data.priority} - ${data.message}`
        });
        loadHODData();
      });

      // Listen for prepress status updates
      socket.on('prepress_status_update', (data) => {
        console.log('🎨 Prepress status update:', data);
        toast.info(`Prepress Status Update`, {
          description: `Job ${data.jobCardId}: ${data.status.replace(/_/g, ' ')} by ${data.designer}`
        });
        loadHODData();
      });

      // Listen for job status updates
      socket.on('job_status_update', (data) => {
        console.log('🔄 Job status update:', data);
        toast.info(`Job Status Update`, {
          description: data.message
        });
        loadHODData();
      });

      // Listen for job assignments
      socket.on('job_assigned', (data) => {
        console.log('📋 Job assigned:', data);
        toast.success(`Job Assigned`, {
          description: data.message
        });
        loadHODData();
      });

      // Listen for process sequence updates
      socket.on('process_sequence_updated', (data) => {
        console.log('⚙️ Process sequence updated:', data);
        toast.success(`Process Sequence Updated`, {
          description: `Job ${data.jobId} process sequence has been updated`
        });
        loadHODData();
      });
    }

    return () => {
      if (socket) {
        socket.off('job_created');
        socket.off('prepress_status_update');
        socket.off('job_status_update');
        socket.off('job_assigned');
        socket.off('process_sequence_updated');
      }
    };
  }, [socket, isConnected]);

  // Statistics
  const stats = {
    total: prepressJobs.length,
    pending: prepressJobs.filter(job => job.status === 'PENDING').length,
    assigned: prepressJobs.filter(job => job.status === 'ASSIGNED').length,
    inProgress: prepressJobs.filter(job => job.status === 'IN_PROGRESS').length,
    inReview: prepressJobs.filter(job => job.status === 'HOD_REVIEW').length,
    completed: prepressJobs.filter(job => job.status === 'COMPLETED').length,
    overdue: prepressJobs.filter(job => {
      const dueDate = new Date(job.due_date);
      const today = new Date();
      return dueDate < today && job.status !== 'COMPLETED';
    }).length
  };

  // Chart data
  const statusData = Object.entries(statusColors).map(([status, _]) => ({
    name: status.replace('_', ' '),
    value: prepressJobs.filter(job => job.status === status).length,
    color: status === 'PENDING' ? '#6B7280' :
           status === 'ASSIGNED' ? '#3B82F6' :
           status === 'IN_PROGRESS' ? '#F59E0B' : 
           status === 'HOD_REVIEW' ? '#8B5CF6' :
           status === 'COMPLETED' ? '#10B981' : '#EF4444'
  })).filter(item => item.value > 0);

  // Designer workload data
  const designerWorkload = designers.map(designer => ({
    name: designer.name.split(' ')[0],
    assigned: prepressJobs.filter(job => job.designer_id === designer.id && job.status === 'ASSIGNED').length,
    inProgress: prepressJobs.filter(job => job.designer_id === designer.id && job.status === 'IN_PROGRESS').length,
    completed: prepressJobs.filter(job => job.designer_id === designer.id && job.status === 'COMPLETED').length
  }));

  // Filter jobs
  useEffect(() => {
    let filtered = prepressJobs;

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(job => job.status === selectedStatus);
    }

    if (selectedPriority !== 'all') {
      filtered = filtered.filter(job => job.priority === selectedPriority);
    }

    if (selectedDesigner !== 'all') {
      filtered = filtered.filter(job => job.designer_id === selectedDesigner);
    }

    if (searchTerm) {
      filtered = filtered.filter(job => 
        job.job_card_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.product_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (job.assigned_designer && job.assigned_designer.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredJobs(filtered);
  }, [prepressJobs, selectedStatus, selectedPriority, selectedDesigner, searchTerm]);

  // API functions
  const assignDesigner = async (jobId: string, designerId: string) => {
    try {
      const job = prepressJobs.find(j => j.id === jobId);
      const designer = designers.find(d => d.id === designerId);
      
      if (!job || !designer) return;

      console.log(`👤 Assigning job ${job.job_card_id} to designer ${designer.name}`);
      
      // Update job assignment in backend
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/jobs/${jobId}/assign`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          assigned_designer_id: designerId,
          notes: `Job assigned to ${designer.name} by HOD`
        })
      });

      if (response.ok) {
        // Update local state
      setPrepressJobs(prev => 
        prev.map(job => 
          job.id === jobId ? { 
            ...job, 
              assigned_designer_id: designerId,
              assigned_designer: designer.name,
              status: 'ASSIGNED'
          } : job
        )
      );
        
        setFilteredJobs(prev => 
          prev.map(job => 
            job.id === jobId ? { 
              ...job, 
              assigned_designer_id: designerId,
              assigned_designer: designer.name,
              status: 'ASSIGNED'
            } : job
          )
        );
        
      setAssigningJobId(null);
        toast.success(`Job ${job.job_card_id} assigned to ${designer.name}`);
        
        // Emit real-time update
        if (socket) {
          socket.emit('job_assigned', {
            jobId: jobId,
            jobCardId: job.job_card_id,
            designerId: designerId,
            designerName: designer.name,
            assignedBy: 'HOD',
            message: `Job ${job.job_card_id} assigned to ${designer.name}`
          });
        }
      } else {
        throw new Error('Failed to assign designer');
      }
    } catch (error) {
      console.error('Error assigning designer:', error);
      toast.error('Failed to assign designer');
    }
  };

  const startJobAsHOD = async (jobId: string) => {
    try {
      const job = prepressJobs.find(j => j.id === jobId);
      if (!job) return;

      // Get current HOD user info
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const hodUserId = userData.id;
      const hodUserName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'HOD Prepress';

      console.log(`🚀 HOD starting job ${job.job_card_id} - HOD User ID: ${hodUserId}`);
      
      // First, assign HOD as the designer
      const assignResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/jobs/${jobId}/assign`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          assigned_designer_id: hodUserId,
          notes: 'HOD assigned themselves as designer and started working on the job'
        })
      });

      if (!assignResponse.ok) {
        throw new Error('Failed to assign HOD as designer');
      }

      // Then update job status to IN_PROGRESS
      const statusResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/jobs/${jobId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          status: 'IN_PROGRESS',
          notes: 'HOD started working on the job'
        })
      });

      if (statusResponse.ok) {
        // Update local state
        setPrepressJobs(prev => 
          prev.map(job => 
            job.id === jobId ? { 
              ...job, 
              status: 'IN_PROGRESS',
              started_at: new Date().toISOString(),
              progress: 10,
              assigned_designer: hodUserName,
              assigned_designer_id: hodUserId.toString()
            } : job
          )
        );
        
        setFilteredJobs(prev => 
          prev.map(job => 
            job.id === jobId ? { 
              ...job, 
              status: 'IN_PROGRESS',
              started_at: new Date().toISOString(),
              progress: 10,
              assigned_designer: hodUserName,
              assigned_designer_id: hodUserId.toString()
            } : job
          )
        );
        
        toast.success(`Job ${job.job_card_id} started by HOD`);
        
        // Emit real-time update
        if (socket) {
          socket.emit('job_status_update', {
            jobId: jobId,
            jobCardId: job.job_card_id,
            status: 'IN_PROGRESS',
            assignedDesignerId: hodUserId,
            assignedDesignerName: hodUserName,
            updatedBy: 'HOD',
            message: `HOD (${hodUserName}) started working on job ${job.job_card_id}`
          });
          
          socket.emit('job_assigned', {
            jobId: jobId,
            jobCardId: job.job_card_id,
            designerId: hodUserId,
            designerName: hodUserName,
            assignedBy: 'HOD',
            message: `Job ${job.job_card_id} assigned to HOD (${hodUserName})`
          });
        }
        
        // Reload data to get updated info from server
        loadHODData();
      } else {
        throw new Error('Failed to update job status');
      }
    } catch (error) {
      console.error('Error starting job as HOD:', error);
      toast.error('Failed to start job');
    }
  };

  const updateJobStatus = async (jobId: string, status: string, notes: string = '', designLink: string = '') => {
    try {
      setLoading(true);
      const job = prepressJobs.find(j => j.id === jobId);
      if (!job) return;

      // For SUBMITTED_TO_QA, use the dedicated submit-to-qa endpoint (same as designer)
      if (status === 'SUBMITTED_TO_QA') {
        if (!designLink.trim()) {
          toast.error('Final design link is required to submit to QA');
          setLoading(false);
          return;
        }

        const submitResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api'}/jobs/${jobId}/submit-to-qa`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          },
          body: JSON.stringify({
            finalDesignLink: designLink.trim(),
            status: 'SUBMITTED_TO_QA',
            notes: notes || 'Submitted to QA by HOD'
          })
        });

        if (submitResponse.ok) {
          toast.success('Job submitted to QA successfully! 🎨');
          
          // Update local state
          setPrepressJobs(prev => 
            prev.map(job => 
              job.id === jobId ? { 
                ...job, 
                status: 'SUBMITTED_TO_QA',
                final_design_link: designLink.trim(),
                submitted_at: new Date().toISOString(),
                submission_notes: notes
              } : job
            )
          );
          
          setFilteredJobs(prev => 
            prev.map(job => 
              job.id === jobId ? { 
                ...job, 
                status: 'SUBMITTED_TO_QA',
                final_design_link: designLink.trim(),
                submitted_at: new Date().toISOString(),
                submission_notes: notes
              } : job
            )
          );
          
          // Emit real-time update
          if (socket) {
            socket.emit('job_status_update', {
              jobId: jobId,
              jobCardId: job.job_card_id,
              status: 'SUBMITTED_TO_QA',
              updatedBy: 'HOD',
              message: `Job ${job.job_card_id} submitted to QA by HOD`
            });
          }
          
          // Close dialogs and reload data
          setIsStatusDialogOpen(false);
          setIsDesignUploadDialogOpen(false);
          setSelectedJobForStatusUpdate(null);
          setNewStatus('');
          setStatusNotes('');
          setFinalDesignLink('');
          loadHODData();
          setLoading(false);
          return;
        } else {
          const errorData = await submitResponse.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to submit to QA');
        }
      }

      // For other statuses, use the regular status update endpoint
      // Prepare request body
      const requestBody: any = {
        status: status,
        notes: notes || `Status updated to ${status} by HOD`
      };

      // Add final design link if provided (for COMPLETED status)
      if (designLink.trim()) {
        requestBody.finalDesignLink = designLink.trim();
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/jobs/${jobId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        // Update local state
        setPrepressJobs(prev => 
          prev.map(job => 
            job.id === jobId ? { 
              ...job, 
              status: status,
              final_design_link: designLink.trim() || job.final_design_link,
              ...(status === 'IN_PROGRESS' && !job.started_at ? { started_at: new Date().toISOString() } : {}),
              ...(status === 'COMPLETED' ? { completed_at: new Date().toISOString() } : {})
            } : job
          )
        );
        
        setFilteredJobs(prev => 
          prev.map(job => 
            job.id === jobId ? { 
              ...job, 
              status: status,
              final_design_link: designLink.trim() || job.final_design_link,
              ...(status === 'IN_PROGRESS' && !job.started_at ? { started_at: new Date().toISOString() } : {}),
              ...(status === 'COMPLETED' ? { completed_at: new Date().toISOString() } : {})
            } : job
          )
        );
        
        toast.success(`Job status updated to ${status.replace('_', ' ')}`);
        
        // Emit real-time update
        if (socket) {
          socket.emit('job_status_update', {
            jobId: jobId,
            jobCardId: job.job_card_id,
            status: status,
            updatedBy: 'HOD',
            message: `Job ${job.job_card_id} status updated to ${status} by HOD`
          });
        }
        
        // Close dialogs and reload data
        setIsStatusDialogOpen(false);
        setIsDesignUploadDialogOpen(false);
        setSelectedJobForStatusUpdate(null);
        setNewStatus('');
        setStatusNotes('');
        setFinalDesignLink('');
        loadHODData();
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update job status');
      }
    } catch (error) {
      console.error('Error updating job status:', error);
      toast.error('Failed to update job status');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitWithDesign = async () => {
    if (!selectedJobForStatusUpdate) {
      toast.error('No job selected');
      return;
    }

    if (!finalDesignLink.trim()) {
      toast.error('Please provide a final design link');
      return;
    }

    if (!newStatus) {
      toast.error('Status is required');
      return;
    }

    // Update job status with design link
    await updateJobStatus(
      selectedJobForStatusUpdate.id,
      newStatus,
      statusNotes,
      finalDesignLink.trim()
    );
  };

  const handleStatusUpdateClick = (job: HODJob) => {
    setSelectedJobForStatusUpdate(job);
    setNewStatus(job.status || '');
    setStatusNotes('');
    setFinalDesignLink(job.final_design_link || '');
    setIsStatusDialogOpen(true);
  };

  const approveJob = async (jobId: string) => {
    try {
      setLoading(true);
      // Real API call would go here
      setPrepressJobs(prev => 
        prev.map(job => 
          job.id === jobId ? { ...job, status: 'COMPLETED' } : job
        )
      );
      toast.success('Job approved successfully');
    } catch (error) {
      toast.error('Failed to approve job');
    } finally {
      setLoading(false);
    }
  };

  const rejectJob = async (jobId: string) => {
    try {
      setLoading(true);
      // Real API call would go here
      setPrepressJobs(prev => 
        prev.map(job => 
          job.id === jobId ? { ...job, status: 'REJECTED' } : job
        )
      );
      toast.success('Job rejected and sent back to designer');
    } catch (error) {
      toast.error('Failed to reject job');
    } finally {
      setLoading(false);
    }
  };

  const handleReassignClick = (job: HODJob) => {
    setSelectedJobForReassign(job);
    setNewDesignerId(job.designer_id || '');
    setIsReassignDialogOpen(true);
  };

  const handleReassignSubmit = async () => {
    if (!selectedJobForReassign || !newDesignerId) {
      toast.error('Please select a designer');
      return;
    }
    
    await reassignJob(selectedJobForReassign.id, newDesignerId);
    setIsReassignDialogOpen(false);
    setSelectedJobForReassign(null);
    setNewDesignerId('');
  };

  const reassignJob = async (jobId: string, newDesignerId: string) => {
    try {
      setLoading(true);
      const designer = designers.find(d => d.id === newDesignerId);
      
      if (!designer) {
        toast.error('Designer not found');
        return;
      }

      console.log(`🔄 Reassigning job ${jobId} to designer ${designer.name} (ID: ${newDesignerId})`);
      
      // Call the reassignment API
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api'}/job-assignment/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          jobCardId: jobId,
          assignedDesignerId: parseInt(newDesignerId),
          isReassignment: true,
          priority: 'MEDIUM',
          dueDate: null,
          notes: `Reassigned by HOD to ${designer.name}`
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Job reassigned successfully:', result);
        
        // Update local state
        setPrepressJobs(prev => 
          prev.map(job => 
            job.id === jobId ? { 
              ...job, 
              designer_id: newDesignerId,
              assigned_designer: designer.name,
              status: 'ASSIGNED'
            } : job
          )
        );
        
        toast.success(`Job reassigned to ${designer.name}`);
      } else {
        const errorData = await response.json();
        console.error('❌ Failed to reassign job:', errorData);
        toast.error(`Failed to reassign job: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Error reassigning job:', error);
      toast.error('Failed to reassign job');
    } finally {
      setLoading(false);
    }
  };

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleEditProcessSequence = (job: HODJob) => {
    console.log('Opening process sequence modal for job:', job);
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
    
    // Reload jobs to reflect changes
    loadHODData();
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

  return (
    <MainLayout
      currentPage={currentPage}
      onNavigate={onNavigate}
      onLogout={onLogout}
      isLoading={loading}
      pageTitle="Prepress HOD Dashboard"
      pageDescription="Manage design team, review jobs, and monitor progress"
    >
      <motion.div 
        className="p-6 bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 min-h-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* Beautiful Enhanced Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 p-8 shadow-2xl rounded-2xl mb-8"
        >
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-3">
                <h1 className="text-4xl font-bold text-white tracking-tight">HOD Prepress Dashboard</h1>
                <p className="text-blue-100 text-lg">Manage all prepress jobs and designer assignments</p>
                <div className="flex items-center gap-4 mt-4">
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                    <Users className="h-4 w-4" />
                    <span className="text-sm font-medium">HOD Prepress Manager</span>
              </div>
                  <Badge className={`${isConnected ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'} text-white border-0`}>
                    {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
                  </Badge>
              </div>
            </div>
              <div className="flex flex-wrap items-center gap-3">
              <Button 
                  onClick={loadHODData} 
                  variant="secondary" 
                size="sm" 
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Jobs
                </Button>
                <Button 
                onClick={onLogout} 
                  variant="secondary" 
                  size="sm"
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
              >
                  <LogOut className="h-4 w-4 mr-2" />
                Logout
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

        {/* Enhanced Stats Cards */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-6 mb-8"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.05, y: -5 }}
            className="h-full"
          >
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300 border-0 overflow-hidden h-full">
              <div className="absolute top-0 right-0 w-20 h-20 bg-blue-100/50 rounded-full -translate-y-10 translate-x-10"></div>
              <CardContent className="p-6 relative">
              <div className="flex items-center justify-between">
                <div>
                    <p className="text-blue-600 text-sm font-medium mb-1">Total Jobs</p>
                    <p className="text-3xl font-bold text-blue-900">{stats.total}</p>
                </div>
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Package className="w-6 h-6 text-blue-600" />
                  </div>
              </div>
            </CardContent>
          </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.05, y: -5 }}
            className="h-full"
          >
            <Card className="bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 border-0 overflow-hidden h-full">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gray-100/50 rounded-full -translate-y-10 translate-x-10"></div>
              <CardContent className="p-6 relative">
              <div className="flex items-center justify-between">
                <div>
                    <p className="text-gray-600 text-sm font-medium mb-1">Pending</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.pending}</p>
                </div>
                  <div className="p-3 bg-gray-100 rounded-xl">
                    <Clock className="w-6 h-6 text-gray-600" />
                  </div>
              </div>
            </CardContent>
          </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.05, y: -5 }}
            className="h-full"
          >
            <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300 border-0 overflow-hidden h-full">
              <div className="absolute top-0 right-0 w-20 h-20 bg-blue-100/50 rounded-full -translate-y-10 translate-x-10"></div>
              <CardContent className="p-6 relative">
              <div className="flex items-center justify-between">
                <div>
                    <p className="text-blue-600 text-sm font-medium mb-1">Assigned</p>
                    <p className="text-3xl font-bold text-blue-900">{stats.assigned}</p>
                </div>
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <UserPlus className="w-6 h-6 text-blue-600" />
                  </div>
              </div>
            </CardContent>
          </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.05, y: -5 }}
            className="h-full"
          >
            <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200 shadow-lg hover:shadow-xl transition-all duration-300 border-0 overflow-hidden h-full">
              <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-100/50 rounded-full -translate-y-10 translate-x-10"></div>
              <CardContent className="p-6 relative">
              <div className="flex items-center justify-between">
                <div>
                    <p className="text-yellow-600 text-sm font-medium mb-1">In Progress</p>
                    <p className="text-3xl font-bold text-yellow-900">{stats.inProgress}</p>
                </div>
                  <div className="p-3 bg-yellow-100 rounded-xl">
                    <Activity className="w-6 h-6 text-yellow-600" />
                  </div>
              </div>
            </CardContent>
          </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            whileHover={{ scale: 1.05, y: -5 }}
            className="h-full"
          >
            <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300 border-0 overflow-hidden h-full">
              <div className="absolute top-0 right-0 w-20 h-20 bg-purple-100/50 rounded-full -translate-y-10 translate-x-10"></div>
              <CardContent className="p-6 relative">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-600 text-sm font-medium mb-1">In Review</p>
                    <p className="text-3xl font-bold text-purple-900">{stats.inReview}</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <Eye className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
          </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            whileHover={{ scale: 1.05, y: -5 }}
            className="h-full"
          >
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-lg hover:shadow-xl transition-all duration-300 border-0 overflow-hidden h-full">
              <div className="absolute top-0 right-0 w-20 h-20 bg-green-100/50 rounded-full -translate-y-10 translate-x-10"></div>
              <CardContent className="p-6 relative">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-600 text-sm font-medium mb-1">Completed</p>
                    <p className="text-3xl font-bold text-green-900">{stats.completed}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-xl">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            whileHover={{ scale: 1.05, y: -5 }}
            className="h-full"
          >
            <Card className="bg-gradient-to-br from-red-50 to-rose-50 border-red-200 shadow-lg hover:shadow-xl transition-all duration-300 border-0 overflow-hidden h-full">
              <div className="absolute top-0 right-0 w-20 h-20 bg-red-100/50 rounded-full -translate-y-10 translate-x-10"></div>
              <CardContent className="p-6 relative">
              <div className="flex items-center justify-between">
                <div>
                    <p className="text-red-600 text-sm font-medium mb-1">Overdue</p>
                    <p className="text-3xl font-bold text-red-900">{stats.overdue}</p>
                </div>
                  <div className="p-3 bg-red-100 rounded-xl">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  </div>
              </div>
            </CardContent>
          </Card>
          </motion.div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Enhanced Filters and Search */}
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-200">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Filter className="w-5 h-5 text-blue-600" />
                    </div>
                    Filters & Search
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="Search jobs..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                      />
                    </div>
                    
                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                      <SelectTrigger className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20">
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="PENDING">Pending Assignment</SelectItem>
                        <SelectItem value="ASSIGNED">Assigned</SelectItem>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem value="HOD_REVIEW">Ready for Review</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                        <SelectItem value="REJECTED">Rejected</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                      <SelectTrigger className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20">
                        <SelectValue placeholder="All Priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Priority</SelectItem>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="CRITICAL">Critical</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={selectedDesigner} onValueChange={setSelectedDesigner}>
                      <SelectTrigger className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20">
                        <SelectValue placeholder="All Designers" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Designers</SelectItem>
                        {designers.map(designer => (
                          <SelectItem key={designer.id} value={designer.id}>
                            {designer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button variant="outline" className="gap-2">
                      <Calendar className="w-4 h-4" />
                      Due Date
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Enhanced Jobs List */}
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Package className="w-5 h-5 text-blue-600" />
                      </div>
                      All Prepress Jobs
                      <Badge variant="outline" className="ml-2">
                        {filteredJobs.length}
                      </Badge>
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (expandedJobId) {
                            setExpandedJobId(null);
                          } else {
                            // Expand first job if none are expanded
                            if (filteredJobs.length > 0) {
                              setExpandedJobId(filteredJobs[0].id);
                            }
                          }
                        }}
                        className="bg-white/50 hover:bg-white/80 border-gray-200 hover:border-blue-300 transition-all duration-200"
                      >
                        {expandedJobId ? (
                          <>
                            <Eye className="w-4 h-4 mr-1" />
                            Collapse All
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4 mr-1" />
                            Expand First
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <AnimatePresence>
                      {filteredJobs.map((job, index) => (
                        <motion.div
                          key={job.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ delay: index * 0.05 }}
                          whileHover={{ scale: 1.02, y: -2 }}
                          className="bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-xl p-4 sm:p-6 hover:shadow-xl hover:bg-white/80 transition-all duration-300"
                        >
                          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              {/* Enhanced Compact Header - Responsive */}
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                                    <Package className="w-4 h-4 text-blue-600" />
                                  </div>
                                  <h3 className="font-bold text-lg sm:text-xl text-gray-900 truncate">
                                    {job.job_card_id}
                                  </h3>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <Badge className={`${statusColors[job.status]} shadow-sm text-xs`}>
                                    {job.status.replace('_', ' ')}
                                  </Badge>
                                  <Badge className={`${priorityColors[job.priority]} shadow-sm text-xs`}>
                                    {job.priority}
                                  </Badge>
                                  {getDaysUntilDue(job.due_date) <= 2 && (
                                    <Badge className="bg-red-500 text-white border-0 shadow-sm animate-pulse text-xs">
                                      <Zap className="w-3 h-3 mr-1" />
                                      URGENT
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              
                              {/* Compact Summary View - Responsive Grid */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-sm text-gray-600 mb-4">
                                <div className="flex flex-col">
                                  <span className="font-medium text-gray-500 mb-1 text-xs">Product</span>
                                  <span className="text-gray-900">{job.product_code}</span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-medium text-gray-500 mb-1 text-xs">Customer</span>
                                  <span className="text-gray-900 truncate">{job.customer_name || job.company_name}</span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-medium text-gray-500 mb-1 text-xs">Designer</span>
                                  {job.assigned_designer ? (
                                    <span className="text-blue-600 font-medium">{job.assigned_designer}</span>
                                  ) : (
                                    <span className="text-red-600 font-medium">Unassigned</span>
                                  )}
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-medium text-gray-500 mb-1 text-xs">Due Date</span>
                                  <span className={getDaysUntilDue(job.due_date) <= 2 ? 'text-red-600 font-medium' : 'text-gray-900'}>
                                    {new Date(job.due_date).toLocaleDateString()} ({getDaysUntilDue(job.due_date)}d)
                                  </span>
                                </div>
                              </div>

                              {/* Expandable Details - Clean and Organized */}
                              {expandedJobId === job.id && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="space-y-4 mt-4 pt-4 border-t border-gray-200"
                                >
                                  {/* Essential Info Grid - Responsive */}
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                                    {/* Product Info */}
                                    <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                                      <h4 className="font-semibold text-gray-800 mb-3 text-sm">Product Info</h4>
                                      <div className="space-y-2 text-sm">
                                        <div><span className="font-medium text-gray-600">Name:</span> <span className="text-gray-900 ml-2">{job.product_name}</span></div>
                                        <div><span className="font-medium text-gray-600">Type:</span> <span className="text-gray-900 ml-2">{job.product_type}</span></div>
                                        <div><span className="font-medium text-gray-600">Material:</span> <span className="text-gray-900 ml-2">{job.product_material}</span></div>
                                        <div><span className="font-medium text-gray-600">GSM:</span> <span className="text-gray-900 ml-2">{job.product_gsm} g/m²</span></div>
                                      </div>
                                    </div>

                                    {/* Job Details */}
                                    <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
                                      <h4 className="font-semibold text-gray-800 mb-3 text-sm">Job Details</h4>
                                      <div className="space-y-2 text-sm">
                                        <div><span className="font-medium text-gray-600">Quantity:</span> <span className="text-gray-900 ml-2">{job.quantity} units</span></div>
                                        <div><span className="font-medium text-gray-600">PO Number:</span> <span className="text-gray-900 ml-2">{job.po_number}</span></div>
                                        {job.customer_email && job.customer_email !== 'N/A' && (
                                          <div><span className="font-medium text-gray-600">Email:</span> <span className="text-gray-900 ml-2">{job.customer_email}</span></div>
                                        )}
                                        {job.customer_phone && job.customer_phone !== 'N/A' && (
                                          <div><span className="font-medium text-gray-600">Phone:</span> <span className="text-gray-900 ml-2">{job.customer_phone}</span></div>
                                        )}
                                      </div>
                                    </div>

                                    {/* Google Drive Links */}
                                    {(job.client_layout_link || job.final_design_link) && (
                                      <div className="bg-purple-50 p-3 sm:p-4 rounded-lg">
                                        <h4 className="font-semibold text-gray-800 mb-3 text-sm flex items-center gap-2">
                                          <ExternalLink className="h-4 w-4" />
                                          Design Links
                                        </h4>
                                        <div className="space-y-2">
                                          {job.client_layout_link && (
                                            <GoogleDrivePreview
                                              url={job.client_layout_link}
                                              label="Client Layout"
                                              showThumbnail={true}
                                              showPreview={false}
                                            />
                                          )}
                                          {job.final_design_link && (
                                            <GoogleDrivePreview
                                              url={job.final_design_link}
                                              label="Final Design"
                                              showThumbnail={true}
                                              showPreview={false}
                                            />
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  {/* Action Buttons - Quick Access to Details */}
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {/* Item Specifications Button */}
                                    {job.itemSpecifications && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          setSelectedJobForItemSpecs(job);
                                          setIsItemSpecsModalOpen(true);
                                        }}
                                        className="w-full justify-start gap-2 bg-white hover:bg-blue-50 border-blue-200 hover:border-blue-300 text-blue-700"
                                      >
                                        <FileText className="h-4 w-4" />
                                        View Item Specifications
                                      </Button>
                                    )}

                                    {/* Process Sequence Button */}
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={async () => {
                                        setSelectedJobForProcessView(job);
                                        await fetchJobProcessSequence(job.id);
                                        setIsProcessSequenceViewModalOpen(true);
                                      }}
                                      className="w-full justify-start gap-2 bg-white hover:bg-green-50 border-green-200 hover:border-green-300 text-green-700"
                                    >
                                      <Layers className="h-4 w-4" />
                                      View Process Sequence
                                    </Button>

                                    {/* Ratio Report Button */}
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => loadRatioReport(job.id)}
                                      className="w-full justify-start gap-2 bg-white hover:bg-purple-50 border-purple-200 hover:border-purple-300 text-purple-700"
                                    >
                                      <BarChart3 className="h-4 w-4" />
                                      View Ratio Report
                                    </Button>

                                    {/* Plate & Machine Info Button */}
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedJobForPlateInfo(job);
                                        // Initialize with existing machine if available, otherwise start with empty
                                        if (job.ctp_machine_id && job.required_plate_count) {
                                          setMachinePlatePairs([{
                                            machineId: String(job.ctp_machine_id),
                                            plateCount: job.required_plate_count
                                          }]);
                                        } else {
                                          setMachinePlatePairs([{machineId: '', plateCount: ''}]);
                                        }
                                        setMachineSearchTerm('');
                                        setIsPlateInfoDialogOpen(true);
                                      }}
                                      className="w-full justify-start gap-2 bg-white hover:bg-indigo-50 border-indigo-200 hover:border-indigo-300 text-indigo-700"
                                    >
                                      <MonitorSpeaker className="h-4 w-4" />
                                      {job.required_plate_count || job.ctp_machine ? 'Update Plate Info' : 'Add Plate Info'}
                                    </Button>
                                  </div>

                                  {/* Plate & Machine Info Display */}
                                  {(job.required_plate_count || job.ctp_machine) && (
                                    <div className="bg-indigo-50 p-3 sm:p-4 rounded-lg border border-indigo-200">
                                      <h4 className="font-semibold text-gray-800 mb-3 text-sm flex items-center gap-2">
                                        <MonitorSpeaker className="h-4 w-4" />
                                        Plate & Machine Information
                                      </h4>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                        {job.required_plate_count && (
                                          <div>
                                            <span className="font-medium text-gray-600">Required Plates:</span>
                                            <span className="ml-2 text-gray-900 font-semibold">{job.required_plate_count} plates</span>
                                          </div>
                                        )}
                                        {job.ctp_machine && (
                                          <div>
                                            <span className="font-medium text-gray-600">CTP Machine:</span>
                                            <span className="ml-2 text-gray-900 font-semibold">{job.ctp_machine.machine_name} ({job.ctp_machine.machine_code})</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {/* Special Instructions - If exists */}
                                  {job.special_instructions && job.special_instructions !== 'N/A' && (
                                    <div className="bg-yellow-50 p-3 sm:p-4 rounded-lg border border-yellow-200">
                                      <h4 className="font-semibold text-gray-800 mb-2 text-sm">Special Instructions</h4>
                                      <p className="text-sm text-gray-700">{job.special_instructions}</p>
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
                              {/* Enhanced View/Expand Button */}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={async () => {
                                  if (expandedJobId === job.id) {
                                    setExpandedJobId(null);
                                  } else {
                                    setExpandedJobId(job.id);
                                    // Fetch process sequence when expanding
                                    await fetchJobProcessSequence(job.id);
                                  }
                                }}
                                className="w-full bg-white/50 hover:bg-white/80 border-gray-200 hover:border-blue-300 transition-all duration-200"
                              >
                                {expandedJobId === job.id ? (
                                  <>
                                    <Eye className="w-4 h-4 mr-1" />
                                    Hide Details
                                  </>
                                ) : (
                                  <>
                                    <Eye className="w-4 h-4 mr-1" />
                                    View Details
                                  </>
                                )}
                              </Button>

                              {job.status === 'PENDING' && (
                                <div className="space-y-2">
                                  {assigningJobId === job.id ? (
                                    <div className="space-y-1">
                                      <Select onValueChange={(value) => assignDesigner(job.id, value)}>
                                        <SelectTrigger className="text-xs">
                                          <SelectValue placeholder="Select Designer" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {designers.map(designer => (
                                            <SelectItem key={designer.id} value={designer.id}>
                                              {designer.name}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        onClick={() => setAssigningJobId(null)}
                                        className="w-full text-xs"
                                      >
                                        Cancel
                                      </Button>
                                    </div>
                                  ) : (
                                    <div className="space-y-1">
                                    <Button 
                                      size="sm"
                                      onClick={() => setAssigningJobId(job.id)}
                                      disabled={loading}
                                      className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200 w-full"
                                    >
                                      <UserPlus className="w-4 h-4" />
                                        Assign Designer
                                    </Button>
                                      <Button
                                        variant="default"
                                        size="sm"
                                        onClick={() => startJobAsHOD(job.id)}
                                        className="w-full text-xs bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                                      >
                                        <Play className="w-3 h-3 mr-1" />
                                        Start Myself
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {job.status === 'HOD_REVIEW' && (
                                <div className="space-y-2">
                                  <Button 
                                    size="sm"
                                    onClick={() => approveJob(job.id)}
                                    disabled={loading}
                                    className="gap-2 bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg transition-all duration-200 w-full"
                                  >
                                    <ThumbsUp className="w-4 h-4" />
                                    Approve
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => rejectJob(job.id)}
                                    disabled={loading}
                                    className="gap-2 hover:bg-red-50 hover:border-red-200 hover:text-red-700 transition-all duration-200 w-full"
                                  >
                                    <ThumbsDown className="w-4 h-4" />
                                    Reject
                                  </Button>
                                </div>
                              )}

                              {/* Status Update Button - Show for jobs assigned to HOD or IN_PROGRESS jobs */}
                              {(job.assigned_designer_id === JSON.parse(localStorage.getItem('user') || '{}').id?.toString() || 
                                  job.status === 'IN_PROGRESS' || 
                                  job.status === 'ASSIGNED') && 
                               job.status !== 'COMPLETED' && 
                               job.status !== 'HOD_REVIEW' && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleStatusUpdateClick(job)}
                                  disabled={loading}
                                  className="gap-2 w-full bg-white/50 hover:bg-white/80 border-gray-200 hover:border-blue-300 transition-all duration-200"
                                >
                                  <RefreshCw className="w-4 h-4" />
                                  Update Status
                                </Button>
                              )}

                              {job.assigned_designer && job.status !== 'COMPLETED' && job.status !== 'HOD_REVIEW' && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleReassignClick(job)}
                                  disabled={loading}
                                  className="gap-2 w-full bg-white/50 hover:bg-white/80 border-gray-200 hover:border-orange-300 transition-all duration-200"
                                >
                                  <RotateCcw className="w-4 h-4" />
                                  Reassign
                                </Button>
                              )}

                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="gap-2 w-full bg-white/50 hover:bg-white/80 border-gray-200 hover:border-purple-300 transition-all duration-200"
                                onClick={() => handleEditProcessSequence(job)}
                              >
                                <Settings className="w-4 h-4" />
                                Edit Process
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    
                    {filteredJobs.length === 0 && (
                      <div className="text-center py-12">
                        <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
                        <p className="text-gray-600">No prepress jobs match your current filters.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <motion.div
            className="lg:col-span-1 space-y-6"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {/* Status Distribution */}
            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                  Status Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Designer Workload */}
            <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Designer Workload
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={designerWorkload}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="assigned" fill="#3B82F6" name="Assigned" />
                      <Bar dataKey="inProgress" fill="#F59E0B" name="In Progress" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Weekly Productivity */}
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  This Week
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weeklyProductivity.slice(-7)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <Tooltip />
                      <Area 
                        type="monotone" 
                        dataKey="completed" 
                        stroke="#10B981" 
                        fill="#10B981" 
                        fillOpacity={0.6}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Avg. Daily Completion:</span>
                    <span className="font-semibold text-green-700">13.1</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Team Efficiency:</span>
                    <span className="font-semibold text-blue-700">89%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-600" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full gap-2 hover:bg-yellow-50">
                  <FileText className="w-4 h-4" />
                  Export Report
                </Button>
                <Button variant="outline" className="w-full gap-2 hover:bg-blue-50">
                  <Settings className="w-4 h-4" />
                  Manage Designers
                </Button>
                <Button variant="outline" className="w-full gap-2 hover:bg-purple-50">
                  <Activity className="w-4 h-4" />
                  View Analytics
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>

      {/* Job Reassignment Dialog */}
      <Dialog open={isReassignDialogOpen} onOpenChange={setIsReassignDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reassign Job to Designer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Job: {selectedJobForReassign?.jobNumber}</Label>
              <p className="text-sm text-gray-500">
                Currently assigned to: {selectedJobForReassign?.assigned_designer || 'No designer'}
              </p>
            </div>
            <div>
              <Label htmlFor="designer">Select New Designer</Label>
              <Select value={newDesignerId} onValueChange={setNewDesignerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select designer" />
                </SelectTrigger>
                <SelectContent>
                  {designers.map((designer) => (
                    <SelectItem key={designer.id} value={designer.id}>
                      {designer.name} ({designer.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsReassignDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleReassignSubmit} disabled={loading}>
                {loading ? 'Reassigning...' : 'Reassign Job'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Process Sequence Modal */}
      <ProcessSequenceModal
        isOpen={isProcessSequenceModalOpen}
        onClose={() => setIsProcessSequenceModalOpen(false)}
        jobId={selectedJobForProcessEdit?.id || ''}
        jobCardId={selectedJobForProcessEdit?.jobNumber || ''}
        productType={selectedJobForProcessEdit?.product_type || 'Offset'}
        onSave={handleSaveProcessSequence}
      />

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
              {/* Order Information */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-3">Order Information</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div><strong>Factory:</strong> {ratioReport.factory_name}</div>
                  <div><strong>PO Number:</strong> {ratioReport.po_number}</div>
                  <div><strong>Job Number:</strong> {ratioReport.job_number}</div>
                  <div><strong>Brand:</strong> {ratioReport.brand_name}</div>
                  <div><strong>Item:</strong> {ratioReport.item_name}</div>
                  <div><strong>Report Date:</strong> {new Date(ratioReport.report_date).toLocaleDateString()}</div>
                </div>
              </div>

              {/* Production Metrics */}
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-800 mb-3">Production Metrics</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {typeof ratioReport.total_ups === 'number' ? ratioReport.total_ups : ratioReport.total_ups || 'N/A'}
                    </div>
                    <div className="text-sm text-green-700">Total UPS</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {typeof ratioReport.total_sheets === 'number' ? ratioReport.total_sheets : ratioReport.total_sheets || 'N/A'}
                    </div>
                    <div className="text-sm text-green-700">Total Sheets</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {typeof ratioReport.total_plates === 'number' ? ratioReport.total_plates : ratioReport.total_plates || 'N/A'}
                    </div>
                    <div className="text-sm text-green-700">Total Plates</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {typeof ratioReport.qty_produced === 'number' ? ratioReport.qty_produced : ratioReport.qty_produced || 'N/A'}
                    </div>
                    <div className="text-sm text-green-700">Qty Produced</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {typeof ratioReport.excess_qty === 'number' ? ratioReport.excess_qty : ratioReport.excess_qty || 'N/A'}
                    </div>
                    <div className="text-sm text-orange-700">Excess Qty</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {typeof ratioReport.efficiency_percentage === 'number' 
                        ? ratioReport.efficiency_percentage.toFixed(1) 
                        : ratioReport.efficiency_percentage || 'N/A'}%
                    </div>
                    <div className="text-sm text-blue-700">Efficiency</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {typeof ratioReport.excess_percentage === 'number' 
                        ? ratioReport.excess_percentage.toFixed(1) 
                        : ratioReport.excess_percentage || 'N/A'}%
                    </div>
                    <div className="text-sm text-purple-700">Excess %</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-indigo-600">
                      {typeof ratioReport.required_order_qty === 'number' ? ratioReport.required_order_qty : ratioReport.required_order_qty || 'N/A'}
                    </div>
                    <div className="text-sm text-indigo-700">Required Qty</div>
                  </div>
                </div>
              </div>

              {/* Color Details Table */}
              {ratioReport.color_details && ratioReport.color_details.length > 0 && (
                <div className="bg-white border rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between bg-gray-50 p-3 border-b">
                    <h4 className="font-medium">Color Details</h4>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        {markedItems.size} / {ratioReport.color_details.length} Completed
                      </span>
                    </div>
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
                              className={`
                                ${isMarked ? 'bg-green-100 border-l-4 border-green-500' : index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                                cursor-pointer hover:bg-blue-50 transition-colors duration-200
                              `}
                              onClick={() => toggleMarkedItem(index)}
                            >
                              <td className="px-3 py-2">
                                {isMarked ? (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                ) : (
                                  <div className="h-4 w-4 border-2 border-gray-300 rounded-full" />
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
                                <span className={detail.excessQty > 0 ? 'text-orange-600 font-medium' : 'text-green-600'}>
                                  {safeRender(detail.excessQty)}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="bg-gray-50 p-3 text-xs text-gray-600 border-t">
                    💡 Click on any row to mark it as completed. Marked items will be highlighted in green.
                  </div>
                </div>
              )}

              {/* Plate Distribution */}
              {ratioReport.plate_distribution && Object.keys(ratioReport.plate_distribution).length > 0 && (
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-xl border border-yellow-200">
                  <h4 className="font-semibold text-yellow-800 mb-4 flex items-center gap-2">
                    <Layers className="h-5 w-5" />
                    Plate Distribution
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(ratioReport.plate_distribution).map(([plate, count], index) => (
                      <motion.div
                        key={plate}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white/70 backdrop-blur-sm p-4 rounded-lg border border-yellow-200 hover:shadow-md transition-all duration-300 hover:scale-105"
                      >
                        <div className="text-center">
                          <div className="text-2xl font-bold text-yellow-600 mb-1">{safeRender(count)}</div>
                          <div className="text-sm text-yellow-700 font-medium">Plate {safeRender(plate)}</div>
                          <div className="w-full bg-yellow-200 rounded-full h-2 mt-2">
                            <motion.div
                              className="bg-gradient-to-r from-yellow-400 to-orange-400 h-2 rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(100, (Number(count) / 10) * 100)}%` }}
                              transition={{ delay: index * 0.1 + 0.3, duration: 0.8 }}
                            />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 justify-center">
                <Button
                  onClick={downloadRatioReportPDF}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF Report
                </Button>
                {ratioReport.excel_file_link && (
                  <Button
                    variant="outline"
                    onClick={() => window.open(ratioReport.excel_file_link, '_blank')}
                    className="border-green-300 text-green-700 hover:bg-green-50 px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    View Excel Source
                  </Button>
                )}
              </div>

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

      {/* Status Update Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Job Status</DialogTitle>
          </DialogHeader>
          {selectedJobForStatusUpdate && (
            <div className="space-y-4">
              <div>
                <Label>Job Number</Label>
                <p className="text-sm font-medium">{selectedJobForStatusUpdate.job_card_id}</p>
              </div>
              <div>
                <Label htmlFor="status-select">New Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger id="status-select">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ASSIGNED">Assigned</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="PAUSED">Paused</SelectItem>
                    <SelectItem value="HOD_REVIEW">Submit for HOD Review</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="SUBMITTED_TO_QA">Submit to QA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status-notes">Notes (Optional)</Label>
                <Textarea
                  id="status-notes"
                  placeholder="Add any notes about this status update..."
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsStatusDialogOpen(false);
                    setSelectedJobForStatusUpdate(null);
                    setNewStatus('');
                    setStatusNotes('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (newStatus && selectedJobForStatusUpdate) {
                      // If status requires design link (COMPLETED or SUBMITTED_TO_QA), always open design upload dialog
                      if (newStatus === 'COMPLETED' || newStatus === 'SUBMITTED_TO_QA') {
                        // Always open design upload dialog for COMPLETED and SUBMITTED_TO_QA
                        // This ensures design link is always provided (same as designer functionality)
                        setIsStatusDialogOpen(false);
                        setIsDesignUploadDialogOpen(true);
                      } else {
                        // For other statuses, update directly without design link requirement
                        updateJobStatus(selectedJobForStatusUpdate.id, newStatus, statusNotes, '');
                      }
                    }
                  }}
                  disabled={!newStatus || loading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {newStatus === 'COMPLETED' || newStatus === 'SUBMITTED_TO_QA' ? 'Continue' : 'Update Status'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Design Upload Dialog - For COMPLETED and SUBMITTED_TO_QA status */}
      <Dialog open={isDesignUploadDialogOpen} onOpenChange={setIsDesignUploadDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {newStatus === 'COMPLETED' ? 'Complete Job' : 'Submit to QA'}
            </DialogTitle>
          </DialogHeader>
          {selectedJobForStatusUpdate && (
            <div className="space-y-4">
              <div>
                <Label>Job Number</Label>
                <p className="text-sm font-medium">{selectedJobForStatusUpdate.job_card_id}</p>
              </div>
              
              {/* Client Layout Link Display */}
              {selectedJobForStatusUpdate.client_layout_link && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Client Layout</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <a
                      href={selectedJobForStatusUpdate.client_layout_link}
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
                <Label htmlFor="final-design-link">Final Design Link (Google Drive) *</Label>
                <Input
                  id="final-design-link"
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
              
              <div>
                <Label htmlFor="design-notes">Notes (Optional)</Label>
                <Textarea
                  id="design-notes"
                  placeholder="Add any notes about the design..."
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDesignUploadDialogOpen(false);
                    setFinalDesignLink('');
                    // Reopen status dialog
                    setIsStatusDialogOpen(true);
                  }}
                >
                  Back
                </Button>
                <Button
                  onClick={handleSubmitWithDesign}
                  disabled={!finalDesignLink.trim() || loading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {newStatus === 'COMPLETED' ? 'Complete Job' : 'Submit to QA'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Item Specifications Modal */}
      <Dialog open={isItemSpecsModalOpen} onOpenChange={setIsItemSpecsModalOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Item Specifications - {selectedJobForItemSpecs?.job_card_id}
            </DialogTitle>
          </DialogHeader>
          {selectedJobForItemSpecs?.itemSpecifications && (
            <div className="mt-4">
              <ItemSpecificationsDisplay
                itemSpecifications={selectedJobForItemSpecs.itemSpecifications}
                showHeader={true}
                compact={false}
                maxItems={1000}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Process Sequence View Modal */}
      <Dialog open={isProcessSequenceViewModalOpen} onOpenChange={setIsProcessSequenceViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Process Sequence - {selectedJobForProcessView?.job_card_id}
            </DialogTitle>
          </DialogHeader>
          {selectedJobForProcessView && (
            <div className="mt-4">
              {(() => {
                const savedProcessSequence = jobProcessSequences[selectedJobForProcessView.id];
                
                if (savedProcessSequence && savedProcessSequence.steps) {
                  const selectedSteps = savedProcessSequence.steps.filter((step: any) => step.isSelected);
                  const totalSteps = savedProcessSequence.steps.length;
                  
                  return (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                        <div>
                          <p className="text-sm font-medium text-green-800">
                            {selectedSteps.length} of {totalSteps} steps selected
                          </p>
                          <p className="text-xs text-green-600 mt-1">
                            Product Type: {selectedJobForProcessView.product_type}
                          </p>
                        </div>
                        {savedProcessSequence.lastUpdated && (
                          <div className="text-xs text-green-600">
                            Updated: {new Date(savedProcessSequence.lastUpdated).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        {savedProcessSequence.steps.map((step: any) => (
                          <div 
                            key={step.id}
                            className={`flex items-center justify-between p-4 rounded-lg border ${
                              step.isSelected
                                ? 'bg-green-50 border-green-300' 
                                : 'bg-gray-50 border-gray-200'
                            }`}
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${
                                step.isSelected
                                  ? 'bg-green-600 text-white' 
                                  : 'bg-gray-400 text-white'
                              }`}>
                                {step.order}
                              </div>
                              <div className="flex-1">
                                <p className={`font-medium ${step.isSelected ? 'text-green-800' : 'text-gray-500'}`}>
                                  {step.name}
                                </p>
                                {step.estimatedHours && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    Estimated: {step.estimatedHours} hours
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {step.isSelected && (
                                <Badge className="bg-green-600 text-white">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Selected
                                </Badge>
                              )}
                              {step.isCompulsory && (
                                <Badge variant="outline" className="border-blue-300 text-blue-700">
                                  Required
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div className="text-center py-12">
                      <Layers className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Process Sequence</h3>
                      <p className="text-gray-600 mb-4">No process sequence configured for this job.</p>
                      <Button
                        onClick={() => {
                          setIsProcessSequenceViewModalOpen(false);
                          handleEditProcessSequence(selectedJobForProcessView);
                        }}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Configure Process Sequence
                      </Button>
                    </div>
                  );
                }
              })()}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Plate & Machine Info Dialog */}
      <Dialog open={isPlateInfoDialogOpen} onOpenChange={setIsPlateInfoDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MonitorSpeaker className="h-5 w-5" />
              Plate & Machine Information - {selectedJobForPlateInfo?.job_card_id}
            </DialogTitle>
          </DialogHeader>
          {selectedJobForPlateInfo && (
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="machine-search">Search CTP Machine</Label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="machine-search"
                    type="text"
                    value={machineSearchTerm}
                    onChange={(e) => setMachineSearchTerm(e.target.value)}
                    placeholder="Search machines by name, code, or model..."
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>CTP Machines & Plate Counts *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setMachinePlatePairs([...machinePlatePairs, {machineId: '', plateCount: ''}]);
                    }}
                    className="text-xs"
                  >
                    <UserPlus className="w-3 h-3 mr-1" />
                    Add Machine
                  </Button>
                </div>

                {machinePlatePairs.map((pair, index) => {
                  const filteredMachines = ctpMachines.filter(machine => 
                    !machineSearchTerm || 
                    machine.machine_name.toLowerCase().includes(machineSearchTerm.toLowerCase()) ||
                    machine.machine_code.toLowerCase().includes(machineSearchTerm.toLowerCase()) ||
                    (machine.model && machine.model.toLowerCase().includes(machineSearchTerm.toLowerCase())) ||
                    (machine.manufacturer && machine.manufacturer.toLowerCase().includes(machineSearchTerm.toLowerCase()))
                  );

                  return (
                    <div key={index} className="flex gap-2 items-start p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex-1 space-y-2">
                        <div>
                          <Label htmlFor={`machine-${index}`} className="text-xs text-gray-600">
                            CTP Machine {index + 1} *
                          </Label>
                          <Select 
                            value={pair.machineId} 
                            onValueChange={(value) => {
                              const updated = [...machinePlatePairs];
                              updated[index].machineId = value;
                              setMachinePlatePairs(updated);
                            }}
                          >
                            <SelectTrigger id={`machine-${index}`} className="mt-1">
                              <SelectValue placeholder="Select CTP machine" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                              {filteredMachines.length === 0 ? (
                                <div className="p-4 text-center text-sm text-gray-500">
                                  {loading ? 'Loading machines...' : 'No machines available'}
                                </div>
                              ) : (
                                filteredMachines.map(machine => (
                                  <SelectItem key={machine.id} value={String(machine.id)}>
                                    <div className="flex flex-col">
                                      <span className="font-medium">{machine.machine_name}</span>
                                      <span className="text-xs text-gray-500">
                                        {machine.machine_code} • {machine.manufacturer || 'N/A'} {machine.model || ''} • {machine.location || 'N/A'}
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor={`plates-${index}`} className="text-xs text-gray-600">
                            Number of Plates *
                          </Label>
                          <Input
                            id={`plates-${index}`}
                            type="number"
                            min="0"
                            value={pair.plateCount}
                            onChange={(e) => {
                              const value = e.target.value;
                              const updated = [...machinePlatePairs];
                              updated[index].plateCount = value === '' ? '' : parseInt(value, 10);
                              setMachinePlatePairs(updated);
                            }}
                            placeholder="e.g., 6"
                            className="mt-1"
                          />
                        </div>
                      </div>
                      {machinePlatePairs.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const updated = machinePlatePairs.filter((_, i) => i !== index);
                            setMachinePlatePairs(updated);
                          }}
                          className="mt-6 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>

              <p className="text-xs text-gray-500">
                Add one or more CTP machines and specify the number of plates required for each machine
              </p>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsPlateInfoDialogOpen(false);
                    setSelectedJobForPlateInfo(null);
                    setMachinePlatePairs([{machineId: '', plateCount: ''}]);
                    setMachineSearchTerm('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    // Validate all pairs have both machine and plate count
                    const invalidPairs = machinePlatePairs.filter(
                      pair => !pair.machineId || pair.plateCount === '' || Number(pair.plateCount) <= 0
                    );

                    if (invalidPairs.length > 0) {
                      toast.error('Please provide both machine and plate count for all entries');
                      return;
                    }

                    try {
                      setLoading(true);
                      const machines = machinePlatePairs.map(pair => ({
                        ctp_machine_id: Number(pair.machineId),
                        plate_count: Number(pair.plateCount)
                      }));

                      const response = await jobsAPI.updatePlateInfo(selectedJobForPlateInfo.id, {
                        machines: machines
                      });

                      if (response.success) {
                        toast.success(`Plate information updated successfully for ${machines.length} machine(s)! 🎨`);
                        
                        // Reload data to get updated info
                        loadHODData();
                        
                        // Close dialog
                        setIsPlateInfoDialogOpen(false);
                        setSelectedJobForPlateInfo(null);
                        setMachinePlatePairs([{machineId: '', plateCount: ''}]);
                        setMachineSearchTerm('');
                      } else {
                        throw new Error(response.error || 'Failed to update plate info');
                      }
                    } catch (error: any) {
                      console.error('Error updating plate info:', error);
                      toast.error(error.message || 'Failed to update plate information');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading || machinePlatePairs.some(pair => !pair.machineId || pair.plateCount === '' || Number(pair.plateCount) <= 0)}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {loading ? 'Updating...' : 'Save Plate Info'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};
