import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Package,
  User,
  Building,
  Calendar,
  Clock,
  FileText,
  Download,
  ExternalLink,
  Mail,
  Phone,
  MapPin,
  CheckCircle,
  AlertCircle,
  Loader2,
  Briefcase,
  Tag,
  FileSpreadsheet,
  BarChart3,
  Info,
  Flag,
  Users
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { JobLifecycleTimeline } from '@/components/jobs/JobLifecycleTimeline';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { ItemSpecificationsDisplay } from '@/components/ui/ItemSpecificationsDisplay';
import { jobsAPI, productsAPI } from '@/services/api';
import { toast } from 'sonner';

interface Job {
  id: number;
  jobNumber: string;
  productName: string;
  customerName: string;
  quantity: number;
  priority: string;
  status: string;
  assignedToId?: number;
  assignedDesignerName?: string;
  createdAt: string;
  deliveryDate: string;
  progress: number;
  department?: string;
  current_department?: string;
  workflow_status?: string;
  current_step?: string;
  status_message?: string;
}

interface JobDetailsModalProps {
  job: Job;
  isOpen: boolean;
  onClose: () => void;
}

interface JobDetails {
  id: number;
  jobNumber: string;
  productId: number;
  productCode?: string;
  productName?: string;
  brand?: string;
  material_name?: string;
  category_name?: string;
  gsm?: number;
  fsc?: string;
  fsc_claim?: string;
  color_specifications?: string;
  description?: string;
  quantity: number;
  dueDate: string;
  createdAt: string;
  status: string;
  urgency: string;
  notes?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  customer_address?: string;
  company_name?: string;
  po_number?: string;
  without_po?: boolean;
  assigned_designer_name?: string;
  assigned_designer_email?: string;
  assigned_designer_phone?: string;
  current_department?: string;
  current_step?: string;
  workflow_status?: string;
  status_message?: string;
  created_by_name?: string;
}

interface RatioReport {
  id?: number;
  excel_file_link?: string;
  excel_file_name?: string;
  total_ups?: number;
  total_sheets?: number;
  total_plates?: number;
  qty_produced?: number;
  excess_qty?: number;
  efficiency_percentage?: number;
}

interface ItemSpecifications {
  id?: string;
  excel_file_name?: string;
  excel_file_link?: string;
  item_count?: number;
  total_quantity?: number;
  size_variants?: number;
  color_variants?: number;
  items?: any[];
  raw_excel_data?: any;
}

interface ProductDetails {
  id: number;
  name: string;
  product_item_code?: string;
  sku?: string;
  brand?: string;
  gsm?: number;
  material_name?: string;
  category_name?: string;
  fsc?: string;
  fsc_claim?: string;
  color_specifications?: string;
  description?: string;
  remarks?: string;
  product_type?: string;
}

export const JobDetailsModal: React.FC<JobDetailsModalProps> = ({
  job,
  isOpen,
  onClose
}) => {
  const [jobDetails, setJobDetails] = useState<JobDetails | null>(null);
  const [productDetails, setProductDetails] = useState<ProductDetails | null>(null);
  const [ratioReport, setRatioReport] = useState<RatioReport | null>(null);
  const [itemSpecifications, setItemSpecifications] = useState<ItemSpecifications | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (isOpen && job) {
      loadJobDetails();
    } else {
      // Reset state when modal closes
      setJobDetails(null);
      setProductDetails(null);
      setRatioReport(null);
      setItemSpecifications(null);
      setIsLoading(true);
      setActiveTab('overview');
    }
  }, [isOpen, job]);

  const loadJobDetails = async () => {
    setIsLoading(true);
    try {
      // Fetch job details
      const jobResponse = await jobsAPI.getById(job.id.toString());
      if (jobResponse.job) {
        const details: JobDetails = jobResponse.job;
        setJobDetails(details);

        // Fetch product details
        if (details.productId) {
          try {
            const productResponse = await productsAPI.getById(details.productId.toString());
            if (productResponse.product) {
              setProductDetails(productResponse.product);
            } else {
              // Try complete product info
              const completeResponse = await productsAPI.getCompleteProductInfo(details.productId.toString());
              if (completeResponse.product) {
                setProductDetails(completeResponse.product);
              }
            }
          } catch (error) {
            console.warn('Could not fetch product details:', error);
          }
        }

        // Fetch ratio report
        try {
          const ratioResult = await jobsAPI.getRatioReport(job.id.toString());
          if (ratioResult.success && ratioResult.ratioReport) {
            setRatioReport(ratioResult.ratioReport);
          }
        } catch (error) {
          console.warn('Could not fetch ratio report:', error);
        }

        // Fetch item specifications
        try {
          const itemSpecsResult = await jobsAPI.getItemSpecifications(job.id.toString());
          if (itemSpecsResult.success && itemSpecsResult.itemSpecifications) {
            setItemSpecifications(itemSpecsResult.itemSpecifications);
          }
        } catch (error) {
          console.warn('Could not fetch item specifications:', error);
        }
      }
    } catch (error) {
      console.error('Error loading job details:', error);
      toast.error('Failed to load job details');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'PAUSED':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'REJECTED':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toUpperCase()) {
      case 'HIGH':
      case 'URGENT':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'MEDIUM':
      case 'NORMAL':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'LOW':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Package className="h-6 w-6 text-blue-600" />
              Job Details - {job.jobNumber}
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Status Bar */}
          {jobDetails && (
            <div className="flex items-center gap-2 mt-4 flex-wrap">
              <Badge className={getStatusColor(jobDetails.status)}>
                <CheckCircle className="h-3 w-3 mr-1" />
                {jobDetails.status}
              </Badge>
              <Badge className={getPriorityColor(jobDetails.urgency || job.priority)}>
                <Flag className="h-3 w-3 mr-1" />
                {jobDetails.urgency || job.priority}
              </Badge>
              {jobDetails.current_department && (
                <Badge className="bg-purple-100 text-purple-800 border-purple-300">
                  <Briefcase className="h-3 w-3 mr-1" />
                  {jobDetails.current_department}
                </Badge>
              )}
              {jobDetails.current_step && (
                <Badge className="bg-indigo-100 text-indigo-800 border-indigo-300">
                  <Clock className="h-3 w-3 mr-1" />
                  {jobDetails.current_step}
                </Badge>
              )}
            </div>
          )}
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Loading job details...</span>
          </div>
        ) : jobDetails ? (
          <div className="flex-1 overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
              <TabsList className="px-6 pt-4 pb-0 border-b rounded-none w-full justify-start flex-wrap h-auto">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="product">Product Details</TabsTrigger>
                <TabsTrigger value="customer">Customer</TabsTrigger>
                <TabsTrigger value="files">Files</TabsTrigger>
                <TabsTrigger value="status">Status & Workflow</TabsTrigger>
                <TabsTrigger value="lifecycle">Lifecycle</TabsTrigger>
              </TabsList>

              <div className="overflow-y-auto max-h-[calc(90vh-220px)] px-6 py-4">
                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Job Information Card */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Briefcase className="h-5 w-5" />
                          Job Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <Label className="text-sm text-gray-600">Job Number</Label>
                          <p className="font-semibold">{jobDetails.jobNumber || job.jobNumber}</p>
                        </div>
                        <Separator />
                        <div>
                          <Label className="text-sm text-gray-600">Quantity</Label>
                          <p className="font-semibold">{jobDetails.quantity?.toLocaleString() || job.quantity}</p>
                        </div>
                        <Separator />
                        <div>
                          <Label className="text-sm text-gray-600">Due Date</Label>
                          <p className="font-semibold">{formatDate(jobDetails.dueDate || job.deliveryDate)}</p>
                        </div>
                        <Separator />
                        <div>
                          <Label className="text-sm text-gray-600">Created Date</Label>
                          <p className="font-semibold">{formatDate(jobDetails.createdAt || job.createdAt)}</p>
                        </div>
                        <Separator />
                        {jobDetails.po_number && (
                          <>
                            <div>
                              <Label className="text-sm text-gray-600">PO Number</Label>
                              <p className="font-semibold">{jobDetails.po_number}</p>
                            </div>
                            <Separator />
                          </>
                        )}
                        {jobDetails.assigned_designer_name && (
                          <div>
                            <Label className="text-sm text-gray-600">Assigned Designer</Label>
                            <p className="font-semibold">{jobDetails.assigned_designer_name}</p>
                          </div>
                        )}
                        {jobDetails.created_by_name && (
                          <>
                            <Separator />
                            <div>
                              <Label className="text-sm text-gray-600">Created By</Label>
                              <p className="font-semibold">{jobDetails.created_by_name}</p>
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>

                    {/* Customer Card */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Building className="h-5 w-5" />
                          Customer Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <Label className="text-sm text-gray-600">Customer Name</Label>
                          <p className="font-semibold">{jobDetails.customer_name || jobDetails.company_name || job.customerName || 'N/A'}</p>
                        </div>
                        <Separator />
                        {jobDetails.customer_email && (
                          <>
                            <div>
                              <Label className="text-sm text-gray-600 flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                Email
                              </Label>
                              <p className="font-semibold">{jobDetails.customer_email}</p>
                            </div>
                            <Separator />
                          </>
                        )}
                        {jobDetails.customer_phone && (
                          <>
                            <div>
                              <Label className="text-sm text-gray-600 flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                Phone
                              </Label>
                              <p className="font-semibold">{jobDetails.customer_phone}</p>
                            </div>
                            <Separator />
                          </>
                        )}
                        {jobDetails.customer_address && (
                          <div>
                            <Label className="text-sm text-gray-600 flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              Address
                            </Label>
                            <p className="font-semibold">{jobDetails.customer_address}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Product Summary Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Package className="h-5 w-5" />
                        Product Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <Label className="text-sm text-gray-600">Product Code</Label>
                          <p className="font-semibold">{jobDetails.productCode || productDetails?.product_item_code || productDetails?.sku || 'N/A'}</p>
                        </div>
                        <div>
                          <Label className="text-sm text-gray-600">Product Name</Label>
                          <p className="font-semibold">{jobDetails.productName || productDetails?.name || job.productName || 'N/A'}</p>
                        </div>
                        <div>
                          <Label className="text-sm text-gray-600">Brand</Label>
                          <p className="font-semibold">{jobDetails.brand || productDetails?.brand || 'N/A'}</p>
                        </div>
                        <div>
                          <Label className="text-sm text-gray-600">Material</Label>
                          <p className="font-semibold">{jobDetails.material_name || productDetails?.material_name || 'N/A'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Product Details Tab */}
                <TabsContent value="product" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Package className="h-5 w-5" />
                        Complete Product Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm text-gray-600">Product Code</Label>
                          <p className="font-semibold">{jobDetails.productCode || productDetails?.product_item_code || productDetails?.sku || 'N/A'}</p>
                        </div>
                        <div>
                          <Label className="text-sm text-gray-600">Product Name</Label>
                          <p className="font-semibold">{jobDetails.productName || productDetails?.name || 'N/A'}</p>
                        </div>
                        <div>
                          <Label className="text-sm text-gray-600">Brand</Label>
                          <p className="font-semibold">{jobDetails.brand || productDetails?.brand || 'N/A'}</p>
                        </div>
                        <div>
                          <Label className="text-sm text-gray-600">Material</Label>
                          <p className="font-semibold">{jobDetails.material_name || productDetails?.material_name || 'N/A'}</p>
                        </div>
                        <div>
                          <Label className="text-sm text-gray-600">Category</Label>
                          <p className="font-semibold">{jobDetails.category_name || productDetails?.category_name || 'N/A'}</p>
                        </div>
                        <div>
                          <Label className="text-sm text-gray-600">GSM</Label>
                          <p className="font-semibold">{jobDetails.gsm || productDetails?.gsm || 'N/A'}</p>
                        </div>
                        <div>
                          <Label className="text-sm text-gray-600">FSC</Label>
                          <p className="font-semibold">{jobDetails.fsc || productDetails?.fsc || 'N/A'}</p>
                        </div>
                        <div>
                          <Label className="text-sm text-gray-600">FSC Claim</Label>
                          <p className="font-semibold">{jobDetails.fsc_claim || productDetails?.fsc_claim || 'N/A'}</p>
                        </div>
                      </div>
                      {(jobDetails.color_specifications || productDetails?.color_specifications) && (
                        <>
                          <Separator />
                          <div>
                            <Label className="text-sm text-gray-600">Color Specifications</Label>
                            <p className="font-semibold mt-1">{jobDetails.color_specifications || productDetails?.color_specifications}</p>
                          </div>
                        </>
                      )}
                      {(jobDetails.description || productDetails?.description) && (
                        <>
                          <Separator />
                          <div>
                            <Label className="text-sm text-gray-600">Description</Label>
                            <p className="mt-1 text-sm">{jobDetails.description || productDetails?.description}</p>
                          </div>
                        </>
                      )}
                      {productDetails?.remarks && (
                        <>
                          <Separator />
                          <div>
                            <Label className="text-sm text-gray-600">Remarks</Label>
                            <p className="mt-1 text-sm">{productDetails.remarks}</p>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Customer Tab */}
                <TabsContent value="customer" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Building className="h-5 w-5" />
                        Customer Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm text-gray-600">Customer Name</Label>
                          <p className="font-semibold text-lg">{jobDetails.customer_name || jobDetails.company_name || job.customerName || 'N/A'}</p>
                        </div>
                        {jobDetails.customer_email && (
                          <div>
                            <Label className="text-sm text-gray-600 flex items-center gap-1">
                              <Mail className="h-4 w-4" />
                              Email Address
                            </Label>
                            <p className="font-semibold">{jobDetails.customer_email}</p>
                          </div>
                        )}
                        {jobDetails.customer_phone && (
                          <div>
                            <Label className="text-sm text-gray-600 flex items-center gap-1">
                              <Phone className="h-4 w-4" />
                              Phone Number
                            </Label>
                            <p className="font-semibold">{jobDetails.customer_phone}</p>
                          </div>
                        )}
                        {jobDetails.customer_address && (
                          <div className="md:col-span-2">
                            <Label className="text-sm text-gray-600 flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              Address
                            </Label>
                            <p className="font-semibold mt-1">{jobDetails.customer_address}</p>
                          </div>
                        )}
                      </div>
                      {jobDetails.notes && (
                        <>
                          <Separator />
                          <div>
                            <Label className="text-sm text-gray-600">Customer Notes</Label>
                            <p className="mt-1 text-sm bg-gray-50 p-3 rounded-md">{jobDetails.notes}</p>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Files Tab */}
                <TabsContent value="files" className="space-y-4 mt-4">
                  {/* Ratio Report Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <BarChart3 className="h-5 w-5" />
                        Ratio Report
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {ratioReport ? (
                        <div className="space-y-4">
                          {ratioReport.excel_file_name && (
                            <div>
                              <Label className="text-sm text-gray-600">File Name</Label>
                              <p className="font-semibold">{ratioReport.excel_file_name}</p>
                            </div>
                          )}
                          {ratioReport.excel_file_link && (
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                onClick={() => window.open(ratioReport.excel_file_link, '_blank')}
                                className="gap-2"
                              >
                                <ExternalLink className="h-4 w-4" />
                                View Ratio File
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  const link = document.createElement('a');
                                  link.href = ratioReport.excel_file_link!;
                                  link.download = ratioReport.excel_file_name || 'ratio-report.xlsx';
                                  link.click();
                                }}
                                className="gap-2"
                              >
                                <Download className="h-4 w-4" />
                                Download
                              </Button>
                            </div>
                          )}
                          {(ratioReport.total_ups || ratioReport.total_sheets || ratioReport.total_plates) && (
                            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                              {ratioReport.total_ups !== undefined && (
                                <div>
                                  <Label className="text-sm text-gray-600">Total UPS</Label>
                                  <p className="font-semibold text-lg">{ratioReport.total_ups.toLocaleString()}</p>
                                </div>
                              )}
                              {ratioReport.total_sheets !== undefined && (
                                <div>
                                  <Label className="text-sm text-gray-600">Total Sheets</Label>
                                  <p className="font-semibold text-lg">{ratioReport.total_sheets.toLocaleString()}</p>
                                </div>
                              )}
                              {ratioReport.total_plates !== undefined && (
                                <div>
                                  <Label className="text-sm text-gray-600">Total Plates</Label>
                                  <p className="font-semibold text-lg">{ratioReport.total_plates.toLocaleString()}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <FileSpreadsheet className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                          <p>No ratio report uploaded for this job</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Item Specifications Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <FileText className="h-5 w-5" />
                        Item Specifications
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {itemSpecifications ? (
                        <ItemSpecificationsDisplay
                          itemSpecifications={itemSpecifications}
                          showHeader={false}
                          compact={false}
                        />
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <FileText className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                          <p>No item specifications uploaded for this job</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Status & Workflow Tab */}
                <TabsContent value="status" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Info className="h-5 w-5" />
                        Status & Workflow Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm text-gray-600">Current Status</Label>
                          <div className="mt-1">
                            <Badge className={getStatusColor(jobDetails.status)}>
                              {jobDetails.status}
                            </Badge>
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm text-gray-600">Priority</Label>
                          <div className="mt-1">
                            <Badge className={getPriorityColor(jobDetails.urgency || job.priority)}>
                              {jobDetails.urgency || job.priority}
                            </Badge>
                          </div>
                        </div>
                        {jobDetails.current_department && (
                          <div>
                            <Label className="text-sm text-gray-600">Current Department</Label>
                            <div className="mt-1">
                              <Badge className="bg-purple-100 text-purple-800 border-purple-300">
                                <Briefcase className="h-3 w-3 mr-1" />
                                {jobDetails.current_department}
                              </Badge>
                            </div>
                          </div>
                        )}
                        {jobDetails.current_step && (
                          <div>
                            <Label className="text-sm text-gray-600">Current Step</Label>
                            <div className="mt-1">
                              <Badge className="bg-indigo-100 text-indigo-800 border-indigo-300">
                                <Clock className="h-3 w-3 mr-1" />
                                {jobDetails.current_step}
                              </Badge>
                            </div>
                          </div>
                        )}
                        {jobDetails.workflow_status && (
                          <div>
                            <Label className="text-sm text-gray-600">Workflow Status</Label>
                            <p className="font-semibold mt-1 capitalize">{jobDetails.workflow_status.replace('_', ' ')}</p>
                          </div>
                        )}
                        {job.progress !== undefined && (
                          <div>
                            <Label className="text-sm text-gray-600">Progress</Label>
                            <p className="font-semibold mt-1">{job.progress}%</p>
                          </div>
                        )}
                      </div>
                      {jobDetails.status_message && (
                        <>
                          <Separator />
                          <div>
                            <Label className="text-sm text-gray-600">Status Message</Label>
                            <p className="mt-1 text-sm bg-blue-50 p-3 rounded-md">{jobDetails.status_message}</p>
                          </div>
                        </>
                      )}
                      {jobDetails.assigned_designer_name && (
                        <>
                          <Separator />
                          <div>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Lifecycle Tab */}
                <TabsContent value="lifecycle" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Clock className="h-5 w-5" />
                        Job Lifecycle Timeline
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <JobLifecycleTimeline
                        jobId={job.id}
                        currentDepartment={jobDetails?.current_department}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

              </div>
            </Tabs>
          </div>
        ) : (
          <div className="flex items-center justify-center py-12">
            <AlertCircle className="h-8 w-8 text-red-600" />
            <span className="ml-3 text-gray-600">Failed to load job details</span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
