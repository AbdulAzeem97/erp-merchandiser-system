/* CTP (Computer-to-Plate) Department Dashboard */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  CheckCircle,
  Clock,
  Printer,
  FileText,
  User,
  Layers,
  AlertCircle,
  Eye,
  RefreshCw,
  Download,
  ExternalLink,
  Calendar,
  Hash,
  Sparkles,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MainLayout } from '../layout/MainLayout';
import { toast } from 'sonner';

interface CTPJob {
  id: string;
  job_card_id: string;
  job_card_number: string;
  product_name: string;
  product_item_code: string;
  customer_name: string;
  company_name: string;
  quantity: number;
  designer_name: string;
  final_pdf_link: string;
  plate_size: string;
  plate_count: number;
  required_plate_count?: number;
  material: string;
  ctp_notes: string;
  status: string;
  plate_generated: boolean;
  plate_generated_at: string;
  created_at: string;
  completed_at: string;
  ctp_machine_id?: number;
  ctp_machine_code?: string;
  ctp_machine_name?: string;
  ctp_machine_type?: string;
  ctp_machine_manufacturer?: string;
  ctp_machine_model?: string;
  ctp_machine_location?: string;
  ctp_machine_max_plate_size?: string;
}

interface CTPDashboardProps {
  onLogout?: () => void;
  onNavigate?: (page: string) => void;
}

const CTPDashboard: React.FC<CTPDashboardProps> = ({ onLogout, onNavigate }) => {
  const [jobs, setJobs] = useState<CTPJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<CTPJob | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [ctpNotes, setCtpNotes] = useState('');
  const [user, setUser] = useState<any>(null);

  // Load user data
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  // Load CTP jobs (QA approved jobs)
  const loadCTPJobs = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api'}/ctp/jobs`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ CTP Jobs loaded:', data);
        console.log('✅ CTP Jobs count:', data.jobs?.length);
        console.log('✅ CTP Jobs data:', data.jobs);
        
        // Debug: Log plate and machine info for each job
        if (data.jobs && data.jobs.length > 0) {
          data.jobs.forEach((job: CTPJob, index: number) => {
            console.log(`🔍 CTP Job ${index + 1} (${job.job_card_number}):`, {
              id: job.id,
              required_plate_count: job.required_plate_count,
              plate_count: job.plate_count,
              ctp_machine_id: job.ctp_machine_id,
              ctp_machine_name: job.ctp_machine_name,
              ctp_machine_code: job.ctp_machine_code,
              ctp_machine_type: job.ctp_machine_type,
              ctp_machine_location: job.ctp_machine_location,
              status: job.status
            });
          });
        }
        
        setJobs(data.jobs || []);
        toast.success(`Loaded ${data.jobs?.length || 0} jobs for CTP`);
      } else {
        const errorText = await response.text();
        console.error('Failed to load CTP jobs:', errorText);
        toast.error('Failed to load jobs');
      }
    } catch (error) {
      console.error('Error loading CTP jobs:', error);
      toast.error('Error loading jobs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCTPJobs();
  }, []);

  // Generate plate for job
  const handleGeneratePlate = async (job: CTPJob) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api'}/ctp/jobs/${job.id}/generate-plate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          plate_count: job.plate_count,
          notes: ctpNotes
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('✅ Plate generated successfully!');
        loadCTPJobs(); // Refresh the list
        setIsDetailsOpen(false);
        setSelectedJob(null);
      } else {
        const error = await response.json();
        toast.error(`Failed to generate plate: ${error.message}`);
      }
    } catch (error) {
      console.error('Error generating plate:', error);
      toast.error('Error generating plate');
    }
  };

  // Print plate tag
  const handlePrintPlateTag = async (job: CTPJob) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api'}/ctp/jobs/${job.id}/print-tag`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        // Open print dialog or download the tag
        if (data.tagContent) {
          // Create a printable version
          const printWindow = window.open('', '_blank');
          if (printWindow) {
            printWindow.document.write(`
              <html>
                <head>
                  <title>Plate Tag - ${job.job_card_number}</title>
                  <style>
                    body { 
                      font-family: 'Courier New', monospace; 
                      padding: 20px;
                      max-width: 400px;
                      margin: 0 auto;
                    }
                    .tag {
                      border: 2px solid #000;
                      padding: 15px;
                      background: white;
                    }
                    pre {
                      margin: 0;
                      white-space: pre-wrap;
                      font-size: 12px;
                      line-height: 1.4;
                    }
                    @media print {
                      body { padding: 0; }
                      .no-print { display: none; }
                    }
                  </style>
                </head>
                <body>
                  <div class="tag">
                    <pre>${data.tagContent}</pre>
                  </div>
                  <div class="no-print" style="margin-top: 20px; text-align: center;">
                    <button onclick="window.print()" style="padding: 10px 20px; font-size: 14px; cursor: pointer;">
                      Print Tag
                    </button>
                    <button onclick="window.close()" style="padding: 10px 20px; font-size: 14px; cursor: pointer; margin-left: 10px;">
                      Close
                    </button>
                  </div>
                </body>
              </html>
            `);
            printWindow.document.close();
          }
        }
        
        toast.success('🖨️ Plate tag ready to print!');
      } else {
        toast.error('Failed to generate plate tag');
      }
    } catch (error) {
      console.error('Error printing plate tag:', error);
      toast.error('Error printing plate tag');
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    if (onLogout) {
      onLogout();
    } else {
      window.location.href = '/';
    }
  };

  const handleNavigate = (page: string) => {
    if (onNavigate) {
      onNavigate(page);
    } else {
      window.location.href = `/${page}`;
    }
  };

  const pendingJobs = jobs.filter(job => !job.plate_generated);
  const completedJobs = jobs.filter(job => job.plate_generated);

  return (
    <MainLayout
      currentPage="ctp-dashboard"
      onNavigate={handleNavigate}
      onLogout={handleLogout}
      isLoading={isLoading}
    >
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-100">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-indigo-700 to-blue-800 p-8 shadow-2xl"
        >
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-3">
                <h1 className="text-4xl font-bold text-white tracking-tight flex items-center gap-3">
                  <Layers className="h-10 w-10" />
                  CTP Department Dashboard
                </h1>
                <p className="text-purple-100 text-lg">Computer-to-Plate Operations & Plate Management</p>
                <div className="flex items-center gap-4 mt-4">
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                    <User className="h-4 w-4" />
                    <span className="text-sm font-medium">{user?.firstName} {user?.lastName}</span>
                  </div>
                  <Badge className="bg-green-500 text-white border-0">
                    CTP Operator
                  </Badge>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  onClick={loadCTPJobs}
                  variant="secondary"
                  size="sm"
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Jobs
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="p-6 space-y-6">
          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Pending Jobs</p>
                    <p className="text-4xl font-bold">{pendingJobs.length}</p>
                  </div>
                  <Clock className="h-10 w-10 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">Plates Generated</p>
                    <p className="text-4xl font-bold">{completedJobs.length}</p>
                  </div>
                  <CheckCircle className="h-10 w-10 text-green-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">Total Plates</p>
                    <p className="text-4xl font-bold">{jobs.reduce((sum, job) => sum + (job.plate_count || 0), 0)}</p>
                  </div>
                  <Layers className="h-10 w-10 text-purple-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Pending Jobs List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Package className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <span className="text-gray-900">Pending for Plate Generation</span>
                      <Badge variant="secondary" className="ml-3 bg-purple-100 text-purple-800">
                        {pendingJobs.length}
                      </Badge>
                    </div>
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {pendingJobs.length === 0 ? (
                  <div className="text-center py-12">
                    <Layers className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No pending jobs</h3>
                    <p className="text-gray-500">All jobs have been processed for CTP.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                    {pendingJobs.map((job, index) => (
                      <motion.div
                        key={job.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05, duration: 0.3 }}
                        whileHover={{ scale: 1.02, y: -4 }}
                        className="bg-white border-2 border-purple-200 rounded-xl overflow-hidden hover:shadow-xl hover:border-purple-400 transition-all duration-300"
                      >
                        {/* Card Header */}
                        <div className="bg-gradient-to-r from-purple-500 to-indigo-500 px-4 py-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-white" />
                              <span className="font-bold text-white">{job.job_card_number}</span>
                            </div>
                            <Badge className="bg-white/20 backdrop-blur-sm text-white border-0">
                              {job.plate_count || job.required_plate_count || 0} Plates
                            </Badge>
                          </div>
                        </div>

                        {/* Card Body */}
                        <div className="p-4 space-y-3">
                          <div>
                            <Label className="text-xs text-gray-500">Product</Label>
                            <p className="font-semibold text-gray-900">{job.product_name}</p>
                            <p className="text-sm text-gray-600">{job.product_item_code}</p>
                          </div>

                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Customer:</span>
                            <span className="font-medium text-gray-900">{job.customer_name || job.company_name}</span>
                          </div>

                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Quantity:</span>
                            <span className="font-medium text-gray-900">{job.quantity.toLocaleString()} units</span>
                          </div>

                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Designer:</span>
                            <span className="font-medium text-purple-600">{job.designer_name}</span>
                          </div>

                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Status:</span>
                            <Badge className="bg-green-100 text-green-800 border-0">
                              {job.status.replace('_', ' ')}
                            </Badge>
                          </div>

                          {(job.ctp_machine_name || job.ctp_machine_code) && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-500">Machine:</span>
                              <span className="font-medium text-gray-900">
                                {job.ctp_machine_name || job.ctp_machine_code}
                              </span>
                            </div>
                          )}

                          {job.required_plate_count && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-500">Required Plates:</span>
                              <span className="font-medium text-purple-600">{job.required_plate_count}</span>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex gap-2 pt-3 border-t">
                            <Button
                              onClick={() => {
                                console.log('🔍 CTP: Opening job details for:', job.job_card_number);
                                console.log('🔍 CTP: Job data:', {
                                  id: job.id,
                                  required_plate_count: job.required_plate_count,
                                  plate_count: job.plate_count,
                                  ctp_machine_id: job.ctp_machine_id,
                                  ctp_machine_name: job.ctp_machine_name,
                                  ctp_machine_code: job.ctp_machine_code,
                                  ctp_machine_type: job.ctp_machine_type,
                                  ctp_machine_location: job.ctp_machine_location,
                                  status: job.status
                                });
                                setSelectedJob(job);
                                setCtpNotes(job.ctp_notes || '');
                                setIsDetailsOpen(true);
                              }}
                              variant="outline"
                              size="sm"
                              className="flex-1 text-blue-600 border-blue-300 hover:bg-blue-50"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Details
                            </Button>
                            <Button
                              onClick={() => handleGeneratePlate(job)}
                              size="sm"
                              className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                            >
                              <Sparkles className="h-3 w-3 mr-1" />
                              Generate Plate
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

          {/* Completed Jobs */}
          {completedJobs.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-200">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <span className="text-gray-900">Plates Generated</span>
                      <Badge variant="secondary" className="ml-3 bg-green-100 text-green-800">
                        {completedJobs.length}
                      </Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    {completedJobs.map((job, index) => (
                      <motion.div
                        key={job.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05, duration: 0.3 }}
                        className="bg-white border border-green-200 rounded-lg p-4 hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <CheckCircle className="h-5 w-5 text-green-500" />
                              <div>
                                <p className="font-bold text-gray-900">{job.job_card_number}</p>
                                <p className="text-sm text-gray-600">{job.product_name}</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right mr-4">
                              <Badge className="bg-green-100 text-green-800 border-0">
                                {job.plate_count || job.required_plate_count || 0} Plates
                              </Badge>
                              {(job.ctp_machine_name || job.ctp_machine_code) && (
                                <p className="text-xs text-gray-600 mt-1">
                                  Machine: {job.ctp_machine_name || job.ctp_machine_code}
                                </p>
                              )}
                              <p className="text-xs text-gray-500 mt-1">{formatDate(job.plate_generated_at)}</p>
                            </div>
                            <Button
                              onClick={() => handlePrintPlateTag(job)}
                              size="sm"
                              variant="outline"
                              className="border-purple-300 text-purple-600 hover:bg-purple-50"
                            >
                              <Printer className="h-4 w-4 mr-2" />
                              Print Tag
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>

      {/* Job Details Modal */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Layers className="h-6 w-6 text-purple-600" />
              CTP Job Details - {selectedJob?.job_card_number}
            </DialogTitle>
          </DialogHeader>

          {selectedJob && (
            <div className="space-y-6">
              {/* Status Banner */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border-2 border-green-200">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-semibold text-green-800">QA Approved - Ready for Plate Generation</span>
                </div>
              </div>

              {/* Job Information */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm text-gray-500">Job Card Number</Label>
                    <p className="text-lg font-bold text-gray-900">{selectedJob.job_card_number}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Product Name</Label>
                    <p className="font-semibold text-gray-900">{selectedJob.product_name}</p>
                    <p className="text-sm text-gray-600">{selectedJob.product_item_code}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Customer</Label>
                    <p className="font-medium text-gray-900">{selectedJob.customer_name || selectedJob.company_name}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Quantity</Label>
                    <p className="text-xl font-bold text-purple-600">{selectedJob.quantity.toLocaleString()} units</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-sm text-gray-500">Designer</Label>
                    <p className="font-medium text-gray-900">{selectedJob.designer_name}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Status</Label>
                    <Badge className="bg-green-100 text-green-800 border-0">
                      {selectedJob.status.replace('_', ' ')}
                    </Badge>
                    <p className="text-xs text-gray-500">{formatDate(selectedJob.created_at)}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Material</Label>
                    <p className="font-medium text-gray-900">{selectedJob.material || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Plate Information */}
              <div className="bg-purple-50 p-4 rounded-lg border-2 border-purple-200">
                <h4 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  Plate Specifications
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Plate Size:</span>
                    <span className="ml-2 font-semibold text-gray-900">{selectedJob.plate_size || 'Standard'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Number of Plates:</span>
                    <span className="ml-2 font-semibold text-purple-600 text-lg">
                      {selectedJob.plate_count || selectedJob.required_plate_count || 0}
                    </span>
                  </div>
                  {selectedJob.required_plate_count && selectedJob.required_plate_count !== selectedJob.plate_count && (
                    <div>
                      <span className="text-gray-600">Required Plates:</span>
                      <span className="ml-2 font-semibold text-blue-600">{selectedJob.required_plate_count}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Machine Information */}
              {(selectedJob.ctp_machine_id || selectedJob.ctp_machine_name || selectedJob.ctp_machine_code) && (
                <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                    <Printer className="h-5 w-5" />
                    CTP Machine Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {selectedJob.ctp_machine_id && (
                      <div>
                        <span className="text-gray-600">Machine ID:</span>
                        <span className="ml-2 font-semibold text-gray-900">{selectedJob.ctp_machine_id}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-600">Machine Name:</span>
                      <span className="ml-2 font-semibold text-gray-900">
                        {selectedJob.ctp_machine_name || selectedJob.ctp_machine_code || 'N/A'}
                      </span>
                    </div>
                    {selectedJob.ctp_machine_code && (
                      <div>
                        <span className="text-gray-600">Machine Code:</span>
                        <span className="ml-2 font-semibold text-gray-900">{selectedJob.ctp_machine_code}</span>
                      </div>
                    )}
                    {selectedJob.ctp_machine_type && (
                      <div>
                        <span className="text-gray-600">Machine Type:</span>
                        <span className="ml-2 font-semibold text-gray-900">{selectedJob.ctp_machine_type}</span>
                      </div>
                    )}
                    {selectedJob.ctp_machine_manufacturer && (
                      <div>
                        <span className="text-gray-600">Manufacturer:</span>
                        <span className="ml-2 font-semibold text-gray-900">{selectedJob.ctp_machine_manufacturer}</span>
                      </div>
                    )}
                    {selectedJob.ctp_machine_model && (
                      <div>
                        <span className="text-gray-600">Model:</span>
                        <span className="ml-2 font-semibold text-gray-900">{selectedJob.ctp_machine_model}</span>
                      </div>
                    )}
                    {selectedJob.ctp_machine_location && (
                      <div>
                        <span className="text-gray-600">Location:</span>
                        <span className="ml-2 font-semibold text-gray-900">{selectedJob.ctp_machine_location}</span>
                      </div>
                    )}
                    {selectedJob.ctp_machine_max_plate_size && (
                      <div>
                        <span className="text-gray-600">Max Plate Size:</span>
                        <span className="ml-2 font-semibold text-gray-900">{selectedJob.ctp_machine_max_plate_size}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Design Links */}
              {selectedJob.final_pdf_link && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Final Design Files
                  </h4>
                  <div className="space-y-2">
                    <a
                      href={selectedJob.final_pdf_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download Final PDF</span>
                    </a>
                  </div>
                </div>
              )}

              {/* CTP Notes */}
              <div>
                <Label htmlFor="ctp-notes" className="text-sm font-medium text-gray-700">
                  CTP Notes (Optional)
                </Label>
                <Textarea
                  id="ctp-notes"
                  placeholder="Add any notes about plate generation, special requirements, etc..."
                  value={ctpNotes}
                  onChange={(e) => setCtpNotes(e.target.value)}
                  className="mt-2"
                  rows={3}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  onClick={() => setIsDetailsOpen(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Close
                </Button>
                <Button
                  onClick={() => handleGeneratePlate(selectedJob)}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Plate & Update Status
                </Button>
                <Button
                  onClick={() => handlePrintPlateTag(selectedJob)}
                  variant="outline"
                  className="flex-1 border-purple-300 text-purple-600 hover:bg-purple-50"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print Plate Tag
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default CTPDashboard;

