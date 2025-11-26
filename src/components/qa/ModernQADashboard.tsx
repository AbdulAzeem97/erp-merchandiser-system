/* CACHE_BUST_QA_V3 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateRatioReportPDF } from '@/utils/ratioReportPdfGenerator';
import { 
  CheckCircle, 
  XCircle, 
  Eye, 
  Clock, 
  User, 
  FileText, 
  ExternalLink,
  RefreshCw,
  Filter,
  Search,
  LogOut,
  Settings,
  Bell,
  Menu,
  X,
  Calendar,
  Package,
  Building,
  Mail,
  Phone,
  MapPin,
  Download,
  Upload,
  Star,
  AlertTriangle,
  CheckCircle2,
  MoreVertical,
  ChevronRight,
  ChevronDown,
  Play,
  Pause,
  RotateCcw,
  Target
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { jobsAPI } from '@/services/api';
import { GoogleDrivePreview } from '@/components/ui/GoogleDrivePreview';
import { ItemSpecificationsDisplay } from '@/components/ui/ItemSpecificationsDisplay';
import { BarChart3 } from 'lucide-react';

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

interface QAJob {
  id: string;
  jobNumber: string;
  productName: string;
  customerName: string;
  designerName: string;
  merchandiserName: string;
  clientLayoutLink: string;
  finalDesignLink: string;
  status: string;
  priority: string;
  dueDate: string;
  createdAt: string;
  submittedAt: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  quantity?: number;
  poNumber?: string;
  brand?: string;
  gsm?: number;
  materialName?: string;
  categoryName?: string;
  fsc?: boolean;
  fscClaim?: string;
  qaNotes?: string;
  // Plate and Machine Information
  required_plate_count?: number;
  ctp_machine_id?: number;
  ctp_machine_code?: string;
  ctp_machine_name?: string;
  ctp_machine_type?: string;
  ctp_machine_manufacturer?: string;
  ctp_machine_model?: string;
  ctp_machine_location?: string;
  ctp_machine_max_plate_size?: string;
  // Multiple machines array
  machines?: Array<{
    id: number;
    machine_code: string;
    machine_name: string;
    machine_type: string;
    manufacturer?: string;
    model?: string;
    location?: string;
    max_plate_size?: string;
    plate_count: number;
  }>;
  // Blank Size Information
  blank_width_mm?: number;
  blank_height_mm?: number;
  blank_width_inches?: number;
  blank_height_inches?: number;
  blank_size_unit?: 'mm' | 'inches';
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

const ModernQADashboard: React.FC = () => {
  const [jobs, setJobs] = useState<QAJob[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<QAJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedJob, setSelectedJob] = useState<QAJob | null>(null);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [qaNotes, setQaNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');
  const [isSplitScreenOpen, setIsSplitScreenOpen] = useState(false);
  const [ratioReport, setRatioReport] = useState<RatioReport | null>(null);
  const [isRatioReportOpen, setIsRatioReportOpen] = useState(false);

  useEffect(() => {
    loadUser();
    loadQAJobs();
  }, []);

  useEffect(() => {
    filterJobs();
  }, [jobs, searchTerm, statusFilter, priorityFilter]);

  const loadUser = () => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  };

  const loadQAJobs = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Loading QA jobs...');
      
      const response = await jobsAPI.getAll({ status: 'SUBMITTED_TO_QA' });
      console.log('📊 API Response:', response);
      
      if (response.jobs) {
        // Fetch item specifications for each job
        const qaJobsWithSpecs = await Promise.all(response.jobs.map(async (job: any) => {
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

          return {
            id: job.id.toString(),
            jobNumber: job.jobNumber,
            productName: job.product_name || 'N/A',
            customerName: job.customer_name || 'N/A',
            designerName: job.assigned_designer_name || 'N/A',
            merchandiserName: job.createdBy || 'N/A',
            clientLayoutLink: job.client_layout_link || '',
            finalDesignLink: job.final_design_link || '',
            status: job.status,
            priority: job.urgency,
            dueDate: job.dueDate,
            createdAt: job.createdAt,
            submittedAt: job.updatedAt,
            customerEmail: job.customer_email,
            customerPhone: job.customer_phone,
            customerAddress: job.customer_address,
            quantity: job.quantity,
            poNumber: job.po_number,
            brand: job.brand,
            gsm: job.gsm,
            materialName: job.material_name,
            categoryName: job.category_name,
            fsc: job.fsc,
            fscClaim: job.fsc_claim,
            qaNotes: job.qa_notes,
            required_plate_count: job.required_plate_count,
            ctp_machine_id: job.ctp_machine_id,
            ctp_machine_code: job.ctp_machine_code,
            ctp_machine_name: job.ctp_machine_name,
            ctp_machine_type: job.ctp_machine_type,
            ctp_machine_manufacturer: job.ctp_machine_manufacturer,
            ctp_machine_model: job.ctp_machine_model,
            ctp_machine_location: job.ctp_machine_location,
            ctp_machine_max_plate_size: job.ctp_machine_max_plate_size,
            // Multiple machines array
            machines: job.machines || [],
            // Blank Size Information
            blank_width_mm: job.blank_width_mm,
            blank_height_mm: job.blank_height_mm,
            blank_width_inches: job.blank_width_inches,
            blank_height_inches: job.blank_height_inches,
            blank_size_unit: job.blank_size_unit || 'mm',
            itemSpecifications: itemSpecifications || null
          };
        }));
        
        setJobs(qaJobsWithSpecs);
        console.log('✅ QA Jobs loaded:', qaJobsWithSpecs.length);
        toast.success(`Loaded ${qaJobsWithSpecs.length} jobs for review`);
      } else {
        console.log('❌ No jobs found or API error');
        toast.error('No jobs found for review');
      }
    } catch (error) {
      console.error('❌ Error loading QA jobs:', error);
      toast.error('Failed to load QA jobs');
    } finally {
      setIsLoading(false);
    }
  };

  // Load ratio report for a specific job
  const loadRatioReport = async (jobId: string) => {
    try {
      toast.info('Generating PDF report...');
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/jobs/${jobId}/ratio-report`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.ratioReport) {
          // Generate and download PDF
          generateRatioReportPDF(data.ratioReport);
          toast.success('PDF report downloaded successfully! 📄');
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

  const filterJobs = () => {
    let filtered = jobs;

    if (searchTerm) {
      filtered = filtered.filter(job =>
        job.jobNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.designerName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(job => job.status === statusFilter);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(job => job.priority === priorityFilter);
    }

    setFilteredJobs(filtered);
  };

  const handleApprove = async () => {
    if (!selectedJob) return;

    try {
      setIsProcessing(true);
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api'}/jobs/${selectedJob.id}/qa-approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ qaNotes: qaNotes.trim() })
      });

      if (response.ok) {
        toast.success('Job approved by QA! ✅');
        setIsReviewDialogOpen(false);
        setSelectedJob(null);
        setQaNotes('');
        loadQAJobs();
      } else {
        const errorData = await response.json();
        toast.error(`Failed to approve job: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error approving job:', error);
      toast.error('Failed to approve job');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedJob) return;

    try {
      setIsProcessing(true);
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api'}/jobs/${selectedJob.id}/qa-reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ qaNotes: qaNotes.trim() })
      });

      if (response.ok) {
        toast.success('Job returned for revisions! 🔄');
        setIsReviewDialogOpen(false);
        setSelectedJob(null);
        setQaNotes('');
        loadQAJobs();
      } else {
        const errorData = await response.json();
        toast.error(`Failed to reject job: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error rejecting job:', error);
      toast.error('Failed to reject job');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const handlePreviewFile = (url: string, title: string) => {
    setPreviewUrl(url);
    setPreviewTitle(title);
    setIsPreviewModalOpen(true);
  };

  const handleSplitScreenPreview = () => {
    if (selectedJob) {
      setIsSplitScreenOpen(true);
    }
  };

  // Convert Google Drive links to direct preview URLs
  const convertToPreviewUrl = (url: string) => {
    if (!url) return '';
    
    // Extract file ID from Google Drive URL
    const fileIdMatch = url.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
    if (fileIdMatch) {
      const fileId = fileIdMatch[1];
      return `https://drive.google.com/file/d/${fileId}/preview`;
    }
    
    // If it's already a preview URL or different format, return as is
    return url;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'NORMAL': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'LOW': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'URGENT': return <AlertTriangle className="w-3 h-3" />;
      case 'HIGH': return <Star className="w-3 h-3" />;
      default: return <Clock className="w-3 h-3" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={{ width: sidebarOpen ? 280 : 0 }}
        className="bg-white border-r border-gray-200 overflow-hidden"
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">QA Prepress</h1>
                <p className="text-sm text-gray-500">Quality Assurance</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* User Profile */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 mb-6">
            <div className="flex items-center space-x-3">
              <Avatar className="w-12 h-12">
                <AvatarFallback className="bg-blue-500 text-white">
                  {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{user?.firstName} {user?.lastName}</p>
                <p className="text-sm text-gray-500">{user?.role}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            <Button variant="ghost" className="w-full justify-start" onClick={loadQAJobs}>
              <RefreshCw className="w-4 h-4 mr-3" />
              Refresh Jobs
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <Settings className="w-4 h-4 mr-3" />
              Settings
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <Bell className="w-4 h-4 mr-3" />
              Notifications
            </Button>
            <Separator className="my-4" />
            <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-3" />
              Logout
            </Button>
          </nav>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden"
              >
                <Menu className="w-5 h-5" />
              </Button>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">QA Dashboard</h2>
                <p className="text-gray-600">Review and approve design submissions</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="px-3 py-1">
                {filteredJobs.length} Jobs Pending
              </Badge>
              <Button onClick={loadQAJobs} variant="outline" className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search jobs, customers, products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="SUBMITTED_TO_QA">Submitted to QA</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="URGENT">Urgent</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="NORMAL">Normal</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex">
          {/* Jobs List */}
          <div className={`${selectedJob ? 'w-1/2' : 'w-full'} p-6 transition-all duration-300`}>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
                  <p className="text-gray-600">Loading QA jobs...</p>
                </div>
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No jobs to review</h3>
                <p className="text-gray-600">All caught up! No jobs are currently submitted for QA review.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredJobs.map((job, index) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card 
                    className={`hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500 cursor-pointer ${
                      selectedJob?.id === job.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                    }`}
                    onClick={() => setSelectedJob(job)}
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <CardTitle className="text-lg">{job.jobNumber}</CardTitle>
                            <Badge className={getPriorityColor(job.priority)}>
                              {getPriorityIcon(job.priority)}
                              <span className="ml-1">{job.priority}</span>
                            </Badge>
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              {job.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                            <div className="flex items-center space-x-2">
                              <Package className="w-4 h-4" />
                              <span>{job.productName}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Building className="w-4 h-4" />
                              <span>{job.customerName}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <User className="w-4 h-4" />
                              <span>{job.designerName}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedJob(expandedJob === job.id ? null : job.id);
                            }}
                          >
                            {expandedJob === job.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            {expandedJob === job.id ? 'Collapse' : 'View Details'}
                          </Button>
                          
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedJob(job);
                              setIsReviewDialogOpen(true);
                            }}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Review
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                    <AnimatePresence>
                      {expandedJob === job.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <CardContent className="pt-0">
                            <Separator className="mb-4" />
                            
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              {/* Job Details */}
                              <div className="space-y-4">
                                <h4 className="font-semibold text-gray-900 flex items-center">
                                  <FileText className="w-4 h-4 mr-2" />
                                  Job Details
                                </h4>
                                
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <Label className="text-gray-500">Quantity</Label>
                                    <p className="font-medium">{job.quantity} units</p>
                                  </div>
                                  <div>
                                    <Label className="text-gray-500">PO Number</Label>
                                    <p className="font-medium">{job.poNumber || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <Label className="text-gray-500">Brand</Label>
                                    <p className="font-medium">{job.brand || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <Label className="text-gray-500">GSM</Label>
                                    <p className="font-medium">{job.gsm || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <Label className="text-gray-500">Material</Label>
                                    <p className="font-medium">{job.materialName || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <Label className="text-gray-500">Category</Label>
                                    <p className="font-medium">{job.categoryName || 'N/A'}</p>
                                  </div>
                                  {job.required_plate_count && (
                                    <div>
                                      <Label className="text-gray-500">Required Plates</Label>
                                      <p className="font-medium text-purple-600">{job.required_plate_count}</p>
                                    </div>
                                  )}
                                  {job.ctp_machine_name && (
                                    <div>
                                      <Label className="text-gray-500">CTP Machine</Label>
                                      <p className="font-medium">{job.ctp_machine_name}</p>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Item Specifications */}
                              {job.itemSpecifications && (
                                <div className="col-span-2">
                                  <ItemSpecificationsDisplay
                                    itemSpecifications={job.itemSpecifications}
                                    showHeader={true}
                                    compact={false}
                                    maxItems={100}
                                  />
                                </div>
                              )}

                              {/* Customer Details */}
                              <div className="space-y-4">
                                <h4 className="font-semibold text-gray-900 flex items-center">
                                  <Building className="w-4 h-4 mr-2" />
                                  Customer Information
                                </h4>
                                
                                <div className="space-y-3 text-sm">
                                  <div className="flex items-center space-x-2">
                                    <Building className="w-4 h-4 text-gray-400" />
                                    <span>{job.customerName}</span>
                                  </div>
                                  {job.customerEmail && (
                                    <div className="flex items-center space-x-2">
                                      <Mail className="w-4 h-4 text-gray-400" />
                                      <span>{job.customerEmail}</span>
                                    </div>
                                  )}
                                  {job.customerPhone && (
                                    <div className="flex items-center space-x-2">
                                      <Phone className="w-4 h-4 text-gray-400" />
                                      <span>{job.customerPhone}</span>
                                    </div>
                                  )}
                                  {job.customerAddress && (
                                    <div className="flex items-center space-x-2">
                                      <MapPin className="w-4 h-4 text-gray-400" />
                                      <span className="text-xs">{job.customerAddress}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Google Drive Links */}
                            <div className="mt-6">
                              <h4 className="font-semibold text-gray-900 flex items-center mb-4">
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Design Files
                              </h4>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {job.clientLayoutLink && (
                                  <div>
                                    <Label className="text-gray-500 mb-2 block">Client Layout</Label>
                                    <GoogleDrivePreview url={job.clientLayoutLink} />
                                  </div>
                                )}
                                
                                {job.finalDesignLink && (
                                  <div>
                                    <Label className="text-gray-500 mb-2 block">Final Design</Label>
                                    <GoogleDrivePreview url={job.finalDesignLink} />
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Timeline */}
                            <div className="mt-6">
                              <h4 className="font-semibold text-gray-900 flex items-center mb-4">
                                <Clock className="w-4 h-4 mr-2" />
                                Timeline
                              </h4>
                              
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Created:</span>
                                  <span>{formatDate(job.createdAt)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Submitted to QA:</span>
                                  <span>{formatDate(job.submittedAt)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Due Date:</span>
                                  <span className={getDaysUntilDue(job.dueDate) < 0 ? 'text-red-600' : getDaysUntilDue(job.dueDate) < 3 ? 'text-orange-600' : 'text-gray-900'}>
                                    {formatDate(job.dueDate)} ({getDaysUntilDue(job.dueDate)} days)
                                  </span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
          </div>

          {/* Job Details Panel */}
          {selectedJob && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="w-1/2 border-l border-gray-200 bg-white"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Job Details</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedJob(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {/* Job Info */}
                <div className="space-y-4 mb-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-500">Job ID</Label>
                      <p className="font-semibold">{selectedJob.jobNumber}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Status</Label>
                      <Badge className="bg-green-50 text-green-700 border-green-200">
                        {selectedJob.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-gray-500">Client</Label>
                      <p className="font-medium">{selectedJob.customerName}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Product</Label>
                      <p className="font-medium">{selectedJob.productName}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Designer</Label>
                      <p className="font-medium">{selectedJob.designerName}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Priority</Label>
                      <Badge className={getPriorityColor(selectedJob.priority)}>
                        {getPriorityIcon(selectedJob.priority)}
                        <span className="ml-1">{selectedJob.priority}</span>
                      </Badge>
                    </div>
                    {selectedJob.machines && selectedJob.machines.length > 0 ? (
                      <div>
                        <Label className="text-gray-500">Total Plates</Label>
                        <p className="font-medium text-purple-600">{selectedJob.machines.reduce((sum, m) => sum + (m.plate_count || 0), 0)}</p>
                      </div>
                    ) : (
                      <>
                        {selectedJob.required_plate_count && (
                          <div>
                            <Label className="text-gray-500">Required Plates</Label>
                            <p className="font-medium text-purple-600">{selectedJob.required_plate_count}</p>
                          </div>
                        )}
                        {selectedJob.ctp_machine_name && (
                          <div>
                            <Label className="text-gray-500">CTP Machine</Label>
                            <p className="font-medium">{selectedJob.ctp_machine_name}</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Plate and Machine Information */}
                {((selectedJob.machines && selectedJob.machines.length > 0) || selectedJob.required_plate_count || selectedJob.ctp_machine_name) && (
                  <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <h4 className="font-semibold text-purple-900 mb-3 flex items-center">
                      <Package className="w-4 h-4 mr-2" />
                      Plate & Machine Information
                    </h4>
                    
                    {/* Multiple Machines Display */}
                    {selectedJob.machines && selectedJob.machines.length > 0 ? (
                      <div className="space-y-3">
                        {selectedJob.machines.map((machine, index) => (
                          <div key={machine.id || index} className="bg-white p-3 rounded border border-purple-200">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="font-semibold text-gray-900 text-base">
                                  {machine.machine_name} ({machine.machine_code})
                                </div>
                                <div className="text-sm text-gray-600 mt-1">
                                  {machine.machine_type} • {machine.location || 'N/A'}
                                </div>
                                {machine.manufacturer && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    {machine.manufacturer} {machine.model || ''}
                                  </div>
                                )}
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-purple-600 text-lg">{machine.plate_count} plates</div>
                              </div>
                            </div>
                            {machine.max_plate_size && (
                              <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-purple-100">
                                Max Plate Size: {machine.max_plate_size}
                              </div>
                            )}
                          </div>
                        ))}
                        <div className="text-sm text-gray-700 mt-3 pt-3 border-t border-purple-200 font-semibold">
                          Total Plates: <span className="text-purple-600 text-lg">{selectedJob.machines.reduce((sum, m) => sum + (m.plate_count || 0), 0)}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {selectedJob.required_plate_count && (
                          <div>
                            <Label className="text-gray-600">Required Plate Count</Label>
                            <p className="font-semibold text-purple-600 text-lg">{selectedJob.required_plate_count}</p>
                          </div>
                        )}
                        {selectedJob.ctp_machine_name && (
                          <div>
                            <Label className="text-gray-600">Machine Name</Label>
                            <p className="font-semibold text-gray-900">{selectedJob.ctp_machine_name}</p>
                          </div>
                        )}
                        {selectedJob.ctp_machine_code && (
                          <div>
                            <Label className="text-gray-600">Machine Code</Label>
                            <p className="font-medium text-gray-900">{selectedJob.ctp_machine_code}</p>
                          </div>
                        )}
                        {selectedJob.ctp_machine_type && (
                          <div>
                            <Label className="text-gray-600">Machine Type</Label>
                            <p className="font-medium text-gray-900">{selectedJob.ctp_machine_type}</p>
                          </div>
                        )}
                        {selectedJob.ctp_machine_manufacturer && (
                          <div>
                            <Label className="text-gray-600">Manufacturer</Label>
                            <p className="font-medium text-gray-900">{selectedJob.ctp_machine_manufacturer}</p>
                          </div>
                        )}
                        {selectedJob.ctp_machine_model && (
                          <div>
                            <Label className="text-gray-600">Model</Label>
                            <p className="font-medium text-gray-900">{selectedJob.ctp_machine_model}</p>
                          </div>
                        )}
                        {selectedJob.ctp_machine_location && (
                          <div>
                            <Label className="text-gray-600">Location</Label>
                            <p className="font-medium text-gray-900">{selectedJob.ctp_machine_location}</p>
                          </div>
                        )}
                        {selectedJob.ctp_machine_max_plate_size && (
                          <div>
                            <Label className="text-gray-600">Max Plate Size</Label>
                            <p className="font-medium text-gray-900">{selectedJob.ctp_machine_max_plate_size}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Blank Size Information */}
                {(selectedJob.blank_width_mm || selectedJob.blank_width_inches) && (
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-4 flex items-center">
                      <Target className="w-4 h-4 mr-2" />
                      Blank Size
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedJob.blank_width_mm && selectedJob.blank_height_mm && (
                        <div>
                          <Label className="text-gray-600">Dimensions (mm)</Label>
                          <p className="font-semibold text-green-700 text-lg">
                            {selectedJob.blank_width_mm} × {selectedJob.blank_height_mm} mm
                          </p>
                        </div>
                      )}
                      {selectedJob.blank_width_inches && selectedJob.blank_height_inches && (
                        <div>
                          <Label className="text-gray-600">Dimensions (inches)</Label>
                          <p className="font-semibold text-green-700 text-lg">
                            {typeof selectedJob.blank_width_inches === 'number' ? selectedJob.blank_width_inches.toFixed(2) : parseFloat(selectedJob.blank_width_inches).toFixed(2)} × {typeof selectedJob.blank_height_inches === 'number' ? selectedJob.blank_height_inches.toFixed(2) : parseFloat(selectedJob.blank_height_inches).toFixed(2)} inches
                          </p>
                        </div>
                      )}
                      {selectedJob.blank_size_unit && (
                        <div className="col-span-2">
                          <Label className="text-gray-600">Input Unit</Label>
                          <p className="font-medium text-gray-900">{selectedJob.blank_size_unit.toUpperCase()}</p>
                        </div>
                      )}
                    </div>
                    {selectedJob.blank_width_mm && selectedJob.blank_height_mm && selectedJob.blank_width_inches && selectedJob.blank_height_inches && (
                      <div className="mt-3 p-2 bg-white rounded border border-green-300">
                        <p className="text-xs text-gray-600">
                          <strong>Complete:</strong> {selectedJob.blank_width_mm} × {selectedJob.blank_height_mm} mm 
                          ({typeof selectedJob.blank_width_inches === 'number' ? selectedJob.blank_width_inches.toFixed(2) : parseFloat(selectedJob.blank_width_inches).toFixed(2)} × {typeof selectedJob.blank_height_inches === 'number' ? selectedJob.blank_height_inches.toFixed(2) : parseFloat(selectedJob.blank_height_inches).toFixed(2)} inches)
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Previous Remarks */}
                {selectedJob.qaNotes && (
                  <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h4 className="font-semibold text-yellow-800 mb-2">Previous Remarks</h4>
                    <p className="text-yellow-700 text-sm">{selectedJob.qaNotes}</p>
                  </div>
                )}

                {/* File Links */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Design Files
                  </h4>
                  
                  <div className="space-y-3">
                    {selectedJob.clientLayoutLink && (
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <FileText className="w-5 h-5 text-blue-500" />
                          <div>
                            <p className="font-medium">Initial Layout</p>
                            <p className="text-sm text-gray-500">Merchandiser upload</p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePreviewFile(selectedJob.clientLayoutLink, 'Initial Layout')}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Preview
                        </Button>
                      </div>
                    )}
                    
                    {selectedJob.finalDesignLink && (
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <FileText className="w-5 h-5 text-green-500" />
                          <div>
                            <p className="font-medium">Final Design</p>
                            <p className="text-sm text-gray-500">Designer upload</p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePreviewFile(selectedJob.finalDesignLink, 'Final Design')}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Preview
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Ratio Report Section */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Production Ratio Report
                  </h4>
                  
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-purple-800">Production Metrics & Color Details</p>
                        <p className="text-sm text-purple-600">View production efficiency, plate distribution, and color breakdown</p>
                      </div>
                      <Button
                        onClick={() => loadRatioReport(selectedJob.id)}
                        variant="outline"
                        size="sm"
                        className="text-purple-700 border-purple-300 hover:bg-purple-100"
                      >
                        <BarChart3 className="w-4 h-4 mr-2" />
                        View Report
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button
                    onClick={handleSplitScreenPreview}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    disabled={!selectedJob.clientLayoutLink || !selectedJob.finalDesignLink}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Compare Both Files Side-by-Side
                  </Button>
                  
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => setIsReviewDialogOpen(true)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      onClick={() => setIsReviewDialogOpen(true)}
                      variant="destructive"
                      className="flex-1 bg-red-600 hover:bg-red-700"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Review Dialog */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Eye className="w-5 h-5 mr-2" />
              Review Job: {selectedJob?.jobNumber}
            </DialogTitle>
          </DialogHeader>
          
          {selectedJob && (
            <div className="space-y-6">
              {/* Job Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-gray-500">Product</Label>
                    <p className="font-medium">{selectedJob.productName}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Customer</Label>
                    <p className="font-medium">{selectedJob.customerName}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Designer</Label>
                    <p className="font-medium">{selectedJob.designerName}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Priority</Label>
                    <Badge className={getPriorityColor(selectedJob.priority)}>
                      {selectedJob.priority}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Design Files */}
              <div>
                <Label className="text-base font-semibold mb-3 block">Design Files</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedJob.clientLayoutLink && (
                    <div>
                      <Label className="text-gray-500 mb-2 block">Client Layout</Label>
                      <GoogleDrivePreview url={selectedJob.clientLayoutLink} />
                    </div>
                  )}
                  
                  {selectedJob.finalDesignLink && (
                    <div>
                      <Label className="text-gray-500 mb-2 block">Final Design</Label>
                      <GoogleDrivePreview url={selectedJob.finalDesignLink} />
                    </div>
                  )}
                </div>
              </div>

              {/* QA Notes */}
              <div>
                <Label htmlFor="qa-notes" className="text-base font-semibold mb-3 block">
                  QA Notes
                </Label>
                <Textarea
                  id="qa-notes"
                  placeholder="Add your review notes, feedback, or approval comments..."
                  value={qaNotes}
                  onChange={(e) => setQaNotes(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => setIsReviewDialogOpen(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isProcessing}
              className="bg-red-600 hover:bg-red-700"
            >
              {isProcessing ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="w-4 h-4 mr-2" />
              )}
              Reject & Return
            </Button>
            <Button
              onClick={handleApprove}
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={isPreviewModalOpen} onOpenChange={setIsPreviewModalOpen}>
        <DialogContent className="max-w-4xl h-[70vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Eye className="w-5 h-5 mr-2" />
                {previewTitle}
              </div>
              {previewUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(previewUrl, '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open Direct
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1">
            {previewUrl ? (
              <iframe
                src={convertToPreviewUrl(previewUrl)}
                className="w-full h-full border-0 rounded-lg"
                title={previewTitle}
                onError={(e) => {
                  console.log('Iframe error, falling back to direct link');
                  window.open(previewUrl, '_blank');
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
                <p className="text-gray-500">No preview available</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Split Screen Preview */}
      <Dialog open={isSplitScreenOpen} onOpenChange={setIsSplitScreenOpen}>
        <DialogContent className="max-w-[98vw] w-[98vw] h-[98vh] max-h-[98vh] p-0">
          {/* Compact Header */}
          <div className="flex items-center justify-between p-3 bg-gray-50 border-b">
            <h3 className="text-sm font-semibold text-gray-700">
              Split Screen Preview - {selectedJob?.jobNumber}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSplitScreenOpen(false)}
              className="h-6 w-6 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          {selectedJob && (
            <div className="flex h-[calc(98vh-60px)]">
              {/* Left Frame - Initial Layout */}
              <div className="flex-1 relative">
                {/* Floating label */}
                <div className="absolute top-2 left-2 z-10 bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">
                  Initial Layout (Merchandiser)
                </div>
                {/* Floating button */}
                {selectedJob.clientLayoutLink && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(selectedJob.clientLayoutLink, '_blank')}
                    className="absolute top-2 right-2 z-10 bg-white/90 hover:bg-white"
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Open Direct
                  </Button>
                )}
                {selectedJob.clientLayoutLink ? (
                  <iframe
                    src={convertToPreviewUrl(selectedJob.clientLayoutLink)}
                    className="w-full h-full border-0"
                    title="Initial Layout"
                    onError={(e) => {
                      console.log('Iframe error, falling back to direct link');
                      window.open(selectedJob.clientLayoutLink, '_blank');
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-50">
                    <p className="text-gray-500">No initial layout available</p>
                  </div>
                )}
              </div>
              
              {/* Right Frame - Final Design */}
              <div className="flex-1 relative">
                {/* Floating label */}
                <div className="absolute top-2 left-2 z-10 bg-green-600 text-white px-2 py-1 rounded text-xs font-medium">
                  Final Design (Designer)
                </div>
                {/* Floating button */}
                {selectedJob.finalDesignLink && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(selectedJob.finalDesignLink, '_blank')}
                    className="absolute top-2 right-2 z-10 bg-white/90 hover:bg-white"
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Open Direct
                  </Button>
                )}
                {selectedJob.finalDesignLink ? (
                  <iframe
                    src={convertToPreviewUrl(selectedJob.finalDesignLink)}
                    className="w-full h-full border-0"
                    title="Final Design"
                    onError={(e) => {
                      console.log('Iframe error, falling back to direct link');
                      window.open(selectedJob.finalDesignLink, '_blank');
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-50">
                    <p className="text-gray-500">No final design available</p>
                  </div>
                )}
              </div>
            </div>
          )}
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
                      {ratioReport.total_ups !== null && ratioReport.total_ups !== undefined ? ratioReport.total_ups : 'N/A'}
                    </div>
                    <div className="text-sm text-green-700">Total UPS</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {ratioReport.total_sheets !== null && ratioReport.total_sheets !== undefined ? ratioReport.total_sheets : 'N/A'}
                    </div>
                    <div className="text-sm text-green-700">Total Sheets</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {ratioReport.total_plates !== null && ratioReport.total_plates !== undefined ? ratioReport.total_plates : 'N/A'}
                    </div>
                    <div className="text-sm text-green-700">Total Plates</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {ratioReport.qty_produced !== null && ratioReport.qty_produced !== undefined ? ratioReport.qty_produced : 'N/A'}
                    </div>
                    <div className="text-sm text-green-700">Qty Produced</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {ratioReport.excess_qty !== null && ratioReport.excess_qty !== undefined ? ratioReport.excess_qty : 'N/A'}
                    </div>
                    <div className="text-sm text-orange-700">Excess Qty</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {(ratioReport.efficiency_percentage !== null && ratioReport.efficiency_percentage !== undefined && typeof ratioReport.efficiency_percentage === 'number')
                        ? `${ratioReport.efficiency_percentage.toFixed(1)}%`
                        : 'N/A'}
                    </div>
                    <div className="text-sm text-blue-700">Efficiency</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {(ratioReport.excess_percentage !== null && ratioReport.excess_percentage !== undefined && typeof ratioReport.excess_percentage === 'number')
                        ? `${ratioReport.excess_percentage.toFixed(1)}%`
                        : 'N/A'}
                    </div>
                    <div className="text-sm text-purple-700">Excess %</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-indigo-600">
                      {ratioReport.required_order_qty !== null && ratioReport.required_order_qty !== undefined ? ratioReport.required_order_qty : 'N/A'}
                    </div>
                    <div className="text-sm text-indigo-700">Required Qty</div>
                  </div>
                </div>
              </div>

              {/* Color Details Table */}
              {ratioReport.color_details && ratioReport.color_details.length > 0 && (
                <div className="bg-white border rounded-lg overflow-hidden">
                  <h4 className="font-medium bg-gray-50 p-3 border-b">Color Details</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
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
                        {ratioReport.color_details.map((detail, index) => (
                          <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-3 py-2">{detail.color || 'N/A'}</td>
                            <td className="px-3 py-2">{detail.size || 'N/A'}</td>
                            <td className="px-3 py-2">{detail.requiredQty !== null && detail.requiredQty !== undefined ? detail.requiredQty : 'N/A'}</td>
                            <td className="px-3 py-2 font-medium text-blue-600">{detail.plate || 'N/A'}</td>
                            <td className="px-3 py-2">{detail.ups !== null && detail.ups !== undefined ? detail.ups : 'N/A'}</td>
                            <td className="px-3 py-2">{detail.sheets !== null && detail.sheets !== undefined ? detail.sheets : '-'}</td>
                            <td className="px-3 py-2">{detail.qtyProduced !== null && detail.qtyProduced !== undefined ? detail.qtyProduced : 'N/A'}</td>
                            <td className="px-3 py-2">
                              <span className={(detail.excessQty !== null && detail.excessQty > 0) ? 'text-orange-600 font-medium' : 'text-green-600'}>
                                {detail.excessQty !== null && detail.excessQty !== undefined ? detail.excessQty : 'N/A'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Plate Distribution */}
              {ratioReport.plate_distribution && Object.keys(ratioReport.plate_distribution).length > 0 && (
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-medium text-yellow-800 mb-3">Plate Distribution</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(ratioReport.plate_distribution).map(([plate, count]) => (
                      <div key={plate} className="text-center">
                        <div className="text-xl font-bold text-yellow-600">{count}</div>
                        <div className="text-sm text-yellow-700">Plate {plate}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
    </div>
  );
};

export default ModernQADashboard;
