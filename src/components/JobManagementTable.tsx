import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Edit, 
  Trash2, 
  Download, 
  Eye, 
  Plus,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { jobsAPI, productsAPI } from '../services/api';
import { JobEditForm } from './JobEditForm';
import { generateJobCardPDF } from '../utils/pdfGenerator';
import { toast } from 'sonner';
import { getApiUrl, getApiBaseUrl } from '@/utils/apiConfig';

interface Job {
  id: number;
  jobNumber: string;
  productId: number;
  productCode?: string;
  brand?: string;
  companyName?: string;
  quantity: number;
  dueDate: string;
  status: string;
  urgency: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  assigned_designer_name?: string;
  assigned_designer_email?: string;
  assigned_designer_phone?: string;
  assigned_designer?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  customer_address?: string;
  product_code?: string;
  material_name?: string;
  category_name?: string;
  company_name?: string;
  po_number?: string;
  without_po?: boolean;
  client_layout_link?: string;
  final_design_link?: string;
  fsc?: string;
  fsc_claim?: string;
  gsm?: number;
  current_department?: string;
  current_step?: string;
  workflow_status?: string;
  status_message?: string;
  created_by_name?: string;
  createdById?: number;
}

interface JobManagementTableProps {
  onCreateJob: () => void;
  onEditJob: (job: Job) => void;
}

const statusConfig = {
  'PENDING': { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  'IN_PROGRESS': { color: 'bg-blue-100 text-blue-800', icon: RefreshCw },
  'COMPLETED': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
  'CANCELLED': { color: 'bg-red-100 text-red-800', icon: XCircle }
};

const urgencyConfig = {
  'LOW': { color: 'bg-gray-100 text-gray-800' },
  'NORMAL': { color: 'bg-blue-100 text-blue-800' },
  'HIGH': { color: 'bg-orange-100 text-orange-800' },
  'URGENT': { color: 'bg-red-100 text-red-800' }
};

// Helper function to infer department from status (fallback)
const getDepartmentFromStatus = (status: string): string | null => {
  const statusUpper = status.toUpperCase();
  if (statusUpper.includes('APPROVED_BY_QA') || statusUpper.includes('SUBMITTED_TO_QA') || statusUpper.includes('QA')) {
    return 'Prepress';
  }
  if (statusUpper.includes('CTP') || statusUpper.includes('PLATE')) {
    return 'Prepress';
  }
  if (statusUpper.includes('COMPLETED')) {
    return 'Production';
  }
  if (statusUpper.includes('PENDING') || statusUpper.includes('IN_PROGRESS')) {
    return 'Prepress'; // Default to Prepress for new jobs
  }
  return null;
};

export const JobManagementTable: React.FC<JobManagementTableProps> = ({ 
  onCreateJob, 
  onEditJob 
}) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [urgencyFilter, setUrgencyFilter] = useState('ALL');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [jobToEdit, setJobToEdit] = useState<Job | null>(null);
  const [generatingPDF, setGeneratingPDF] = useState<number | null>(null);
  
  // Infinite scroll state
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [totalJobs, setTotalJobs] = useState(0);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Load jobs (initial load or reset)
  const loadJobs = useCallback(async (page: number = 1, append: boolean = false) => {
    try {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }
      
      const response = await jobsAPI.getAll({ page, limit: 50 });
      const jobsData = response.jobs || [];
      const pagination = response.pagination || {};
      
      console.log('📋 Jobs loaded:', jobsData.length);
      console.log('📋 Pagination:', pagination);
      
      if (append) {
        setJobs(prev => [...prev, ...jobsData]);
      } else {
        setJobs(jobsData);
      }
      
      setCurrentPage(page);
      setHasMore(pagination.hasMore || false);
      setTotalJobs(pagination.total || 0);
    } catch (error) {
      console.error('Error loading jobs:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);
  
  // Load more jobs (for infinite scroll)
  const loadMoreJobs = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    
    const nextPage = currentPage + 1;
    await loadJobs(nextPage, true);
  }, [currentPage, hasMore, isLoadingMore, loadJobs]);

  // Filter jobs
  useEffect(() => {
    let filtered = jobs;

    if (searchTerm) {
      filtered = filtered.filter(job => 
        job.jobNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.product_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.customer_phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(job => job.status === statusFilter);
    }

    if (urgencyFilter !== 'ALL') {
      filtered = filtered.filter(job => job.urgency === urgencyFilter);
    }

    setFilteredJobs(filtered);
  }, [jobs, searchTerm, statusFilter, urgencyFilter]);

  // Reset pagination when filters change
  useEffect(() => {
    // Reset to page 1 and reload when filters change
    setCurrentPage(1);
    setHasMore(true);
    loadJobs(1, false);
  }, [searchTerm, statusFilter, urgencyFilter, loadJobs]);

  // Load jobs on component mount
  useEffect(() => {
    loadJobs(1, false);
  }, []);

  // Infinite scroll detection
  useEffect(() => {
    const container = tableContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const scrollBottom = scrollHeight - scrollTop - clientHeight;
      
      // Load more when within 200px of bottom
      if (scrollBottom < 200 && hasMore && !isLoadingMore && !isLoading) {
        loadMoreJobs();
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [hasMore, isLoadingMore, isLoading, loadMoreJobs]);

  // Handle job deletion
  const handleDeleteJob = async (job: Job) => {
    try {
      await jobsAPI.delete(job.id.toString());
      await loadJobs(); // Reload jobs after deletion
      setShowDeleteDialog(false);
      setJobToDelete(null);
    } catch (error) {
      console.error('Error deleting job:', error);
    }
  };

  // Handle job edit
  const handleEditJob = (job: Job) => {
    setJobToEdit(job);
    setShowEditForm(true);
  };

  // Handle job save after edit
  const handleJobSave = (updatedJob: Job) => {
    setJobs(prev => prev.map(job => job.id === updatedJob.id ? updatedJob : job));
    setShowEditForm(false);
    setJobToEdit(null);
  };

  // Helper function to convert attachment to File object
  const convertAttachmentToFile = async (attachment: any): Promise<File> => {
    try {
      // Fetch the file from the server
      const apiBaseUrl = getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/upload/file/${attachment.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch file');
      }
      
      const blob = await response.blob();
      
      // Create a File object from the blob
      const file = new File([blob], attachment.fileName, {
        type: attachment.fileType,
        lastModified: new Date(attachment.uploadedAt).getTime()
      });
      
      return file;
    } catch (error) {
      console.error('Error converting attachment to file:', error);
      // Return a placeholder file if conversion fails
      return new File([''], attachment.fileName, { type: attachment.fileType });
    }
  };

  // Handle PDF download
  const handleDownloadPDF = async (job: Job) => {
    setGeneratingPDF(job.id);
    try {
      // Fetch complete product information
      const productResponse = await productsAPI.getCompleteProductInfo(job.productId.toString());
      const product = productResponse.product;
      const processSequence = productResponse.process_sequence;

      // Fetch job attachments (uploaded images)
      let uploadedImages: File[] = [];
      try {
        const attachmentsResponse = await jobsAPI.getAttachments(job.id.toString());
        const attachments = attachmentsResponse.attachments || [];
        
        // Filter for image files only
        const imageAttachments = attachments.filter((att: any) => 
          att.fileType && att.fileType.startsWith('image/')
        );
        
        // Convert attachments to File objects
        uploadedImages = await Promise.all(
          imageAttachments.map((att: any) => convertAttachmentToFile(att))
        );
        
        console.log(`Found ${uploadedImages.length} uploaded images for job ${job.jobNumber}`);
      } catch (error) {
        console.error('Error fetching job attachments:', error);
        // Continue without images if fetching fails
      }

      // Fetch ratio report data if available
      let ratioData = null;
      try {
        const apiBaseUrl = getApiBaseUrl();
        const ratioResponse = await fetch(`${apiBaseUrl}/jobs/${job.id}/ratio-report`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        });
        if (ratioResponse.ok) {
          const ratioResult = await ratioResponse.json();
          if (ratioResult.success && ratioResult.ratioReport) {
            const report = ratioResult.ratioReport;
            ratioData = {
              colorDetails: report.color_details || [],
              summary: {
                totalUPS: report.total_ups,
                totalSheets: report.total_sheets,
                totalPlates: report.total_plates,
                qtyProduced: report.qty_produced,
                excessQty: report.excess_qty,
                efficiency: report.efficiency_percentage,
                requiredOrderQty: report.required_order_qty
              },
              rawData: report.raw_excel_data || {}
            };
            console.log('✅ Ratio report data loaded for PDF');
          }
        }
      } catch (error) {
        console.warn('⚠️ Could not fetch ratio report:', error);
        // Continue without ratio data
      }

      // Fetch item specifications data if available
      let itemSpecificationsData = null;
      try {
        const itemSpecsResponse = await fetch(`${apiBaseUrl}/jobs/${job.id}/item-specifications`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        });
        if (itemSpecsResponse.ok) {
          const itemSpecsResult = await itemSpecsResponse.json();
          if (itemSpecsResult.success && itemSpecsResult.itemSpecifications) {
            const specs = itemSpecsResult.itemSpecifications;
            // Get items from the response (already fetched from database)
            let items = [];
            if (specs.items && Array.isArray(specs.items)) {
              // Items are already in the response from database
              items = specs.items.map((item: any) => ({
                itemCode: item.item_code,
                color: item.color,
                size: item.size,
                quantity: item.quantity,
                secondaryCode: item.secondary_code,
                decimalValue: item.decimal_value,
                material: item.material,
                specifications: typeof item.specifications === 'string' ? JSON.parse(item.specifications) : (item.specifications || {})
              }));
            } else {
              // Fallback: try to get from raw_excel_data
              try {
                if (specs.raw_excel_data) {
                  let rawData = specs.raw_excel_data;
                  if (typeof rawData === 'string') {
                    rawData = JSON.parse(rawData);
                  }
                  if (rawData.items && Array.isArray(rawData.items)) {
                    items = rawData.items;
                  }
                }
              } catch (e) {
                console.warn('Could not parse items from raw data');
              }
            }
            
            itemSpecificationsData = {
              items: items,
              summary: {
                totalItems: specs.item_count || items.length || 0,
                totalQuantity: specs.total_quantity || items.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || 0,
                sizeVariants: specs.size_variants || new Set(items.map((i: any) => i.size)).size || 0,
                colorVariants: specs.color_variants || new Set(items.map((i: any) => i.color)).size || 0
              }
            };
            console.log('✅ Item specifications data loaded for PDF');
          }
        }
      } catch (error) {
        console.warn('⚠️ Could not fetch item specifications:', error);
        // Continue without item specifications data
      }

      // Create complete job card data from the job information
      const jobCardData = {
        productCode: job.product_code || product?.product_item_code || '',
        poNumber: job.po_number || `PO-${job.id.toString().padStart(6, '0')}`, // Use actual PO number or generate fallback
        quantity: job.quantity,
        deliveryDate: job.dueDate,
        customerNotes: job.notes || '',
        uploadedImages: uploadedImages, // Use actual uploaded images
        merchandiser: 'System Generated',
        customerName: job.customer_name || job.company_name || 'Customer',
        salesman: 'System',
        jobCode: job.jobNumber, // Keep job number as job code
        priority: job.urgency,
        status: job.status,
        // Add missing fields for complete PDF generation
        customerInfo: {
          name: job.customer_name || job.company_name || 'Customer',
          email: job.customer_email || 'customer@example.com',
          phone: job.customer_phone || '+1-234-567-8900',
          address: job.customer_address || 'Customer Address'
        },
        specialInstructions: job.notes || 'Standard processing',
        shippingMethod: 'Standard',
        dimensions: {
          width: 0,
          height: 0
        },
        // Add new fields for complete PDF generation
        clientLayoutLink: job.client_layout_link || '',
        finalDesignLink: job.final_design_link || '',
        assignedDesigner: (job.assigned_designer_name || job.assigned_designer) ? {
          name: job.assigned_designer_name || job.assigned_designer || 'Unknown Designer',
          email: job.assigned_designer_email || 'designer@example.com',
          phone: job.assigned_designer_phone || ''
        } : undefined,
        material: job.material_name || product?.material_name || 'N/A',
        fsc: job.fsc || product?.fsc || 'No',
        fscClaim: job.fsc_claim || product?.fsc_claim || 'Not Applicable',
        brand: job.brand || product?.brand || 'N/A',
        gsm: job.gsm || product?.gsm || 0,
        category: job.category_name || product?.category_name || 'N/A',
        ratioData: ratioData, // Include ratio Excel data
        itemSpecificationsData: itemSpecificationsData // Include item specifications data
      };

      // Create complete product with process sequence and all required fields
      const completeProduct = {
        ...product,
        processSequence: processSequence,
        // Ensure all required product fields are present
        product_item_code: product?.product_item_code || job.product_code || '',
        name: product?.name || job.product_name || '',
        brand: product?.brand || job.brand || '',
        gsm: product?.gsm || job.gsm || 0,
        description: product?.description || job.product_description || '',
        // Add default values for missing fields
        productType: 'Offset',
        material_name: job.material_name || 'Standard Material',
        color_specifications: 'As per Approved Sample/Artwork',
        remarks: product?.remarks || job.remarks || ''
      };

      // Generate PDF using the same generator as job creation
      await generateJobCardPDF({
        product: completeProduct,
        jobCardData,
        jobCardId: job.jobNumber
      });

      toast.success('PDF generated and downloaded successfully! 📄');

    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF. Trying fallback method...');
      
      // Fallback to simple download if PDF generation fails
      try {
        const apiBaseUrl = getApiBaseUrl();
        const response = await fetch(`${apiBaseUrl}/jobs/${job.id}/pdf`);
        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `job-${job.jobNumber}.html`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          toast.success('Fallback PDF downloaded successfully!');
        } else {
          toast.error('Failed to download PDF');
        }
      } catch (fallbackError) {
        console.error('Fallback PDF download also failed:', fallbackError);
        toast.error('Failed to download PDF');
      }
    } finally {
      setGeneratingPDF(null);
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig];
    if (config) {
      const IconComponent = config.icon;
      return <IconComponent className="w-4 h-4" />;
    }
    return <AlertCircle className="w-4 h-4" />;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold">Job Management</CardTitle>
          <div className="flex items-center gap-2">
            <Button onClick={loadJobs} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={onCreateJob} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Job
            </Button>
          </div>
        </div>
        
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mt-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search jobs, products, customers..."
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
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Priority</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
              <SelectItem value="NORMAL">Normal</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="URGENT">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" />
            Loading jobs...
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-gray-500">
            <AlertCircle className="w-6 h-6 mr-2" />
            No jobs found
          </div>
        ) : (
          <div 
            ref={tableContainerRef}
            className="overflow-x-auto lg:overflow-x-visible max-h-[600px] overflow-y-auto"
          >
            <table className="w-full table-auto">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32 min-w-32">
                    Job Number
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40 min-w-40">
                    Product
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48 min-w-48">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32 min-w-32">
                    PO Number
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32 min-w-32">
                    Created By
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24 min-w-24">
                    Quantity
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28 min-w-28">
                    Due Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32 min-w-32">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28 min-w-28">
                    Priority
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32 min-w-32">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredJobs.map((job, index) => {
                  const isWithoutPO = job.without_po === true || (job.without_po === undefined && (!job.po_number || job.po_number.trim() === ''));
                  return (
                  <motion.tr
                    key={job.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`transition-colors ${isWithoutPO ? 'bg-amber-50 hover:bg-amber-100' : 'hover:bg-gray-50'}`}
                  >
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono font-medium text-gray-900">
                        {job.jobNumber}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900">
                        {job.product_code || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {job.brand || 'N/A'}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900">
                        {job.customer_name || job.company_name || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {job.customer_email || 'No email'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {job.customer_phone || 'No phone'}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {isWithoutPO ? (
                        <div className="flex items-center space-x-1">
                          <AlertCircle className="w-4 h-4 text-amber-600" />
                          <span className="text-sm text-amber-700 font-medium">No PO</span>
                          <Badge variant="outline" className="ml-2 border-amber-300 text-amber-700 bg-amber-50 text-xs">
                            PO Pending
                          </Badge>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-900">{job.po_number || 'N/A'}</span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{job.created_by_name || 'System'}</span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {job.quantity.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(job.dueDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-1">
                        <Badge 
                          className={`${statusConfig[job.status as keyof typeof statusConfig]?.color || 'bg-gray-100 text-gray-800'} flex items-center gap-1 w-fit`}
                        >
                          {getStatusIcon(job.status)}
                          {job.status}
                        </Badge>
                        {(job.current_department || getDepartmentFromStatus(job.status)) && (
                          <Badge className="bg-purple-100 text-purple-800 text-xs w-fit">
                            {job.current_department || getDepartmentFromStatus(job.status)}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <Badge 
                        className={`${urgencyConfig[job.urgency as keyof typeof urgencyConfig]?.color || 'bg-gray-100 text-gray-800'} w-fit`}
                      >
                        {job.urgency}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditJob(job)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadPDF(job)}
                          disabled={generatingPDF === job.id}
                        >
                          {generatingPDF === job.id ? (
                            <div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setJobToDelete(job);
                            setShowDeleteDialog(true);
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                  );
                })}
              </tbody>
            </table>
            
            {/* Infinite scroll loading indicator */}
            {isLoadingMore && (
              <div className="flex items-center justify-center py-4 border-t">
                <RefreshCw className="w-5 h-5 animate-spin mr-2 text-blue-600" />
                <span className="text-sm text-gray-600">Loading more jobs...</span>
              </div>
            )}
            
            {/* End of list indicator */}
            {!hasMore && jobs.length > 0 && (
              <div className="flex items-center justify-center py-4 border-t">
                <span className="text-sm text-gray-500">No more jobs to load</span>
              </div>
            )}
          </div>
        )}
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Job</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-600">
              Are you sure you want to delete job <strong>{jobToDelete?.jobNumber}</strong>? 
              This action cannot be undone.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => jobToDelete && handleDeleteJob(jobToDelete)}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Job Edit Form */}
      {showEditForm && jobToEdit && (
        <JobEditForm
          job={jobToEdit}
          onSave={handleJobSave}
          onCancel={() => {
            setShowEditForm(false);
            setJobToEdit(null);
          }}
          onClose={() => {
            setShowEditForm(false);
            setJobToEdit(null);
          }}
        />
      )}
    </Card>
  );
};
