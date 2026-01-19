import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Printer,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  Pause,
  XCircle,
  Search,
  Filter,
  RefreshCw,
  Building2,
  Calendar,
  Package,
  FileText,
  MessageSquare,
  Users,
  Edit,
  Eye,
  Play,
  Monitor,
  Settings,
  FileCheck
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { getApiUrl } from '@/utils/apiConfig';
import { useSocket } from '@/services/socketService.tsx';
import { MainLayout } from '@/components/layout/MainLayout';
import { GoogleDrivePreview } from '@/components/ui/GoogleDrivePreview';
import { RealTimeStatusPanel } from './RealTimeStatusPanel';
import { JobProgressModal } from './JobProgressModal';
import { PlateProgressTracker } from './PlateProgressTracker';
import { ProductionMetrics } from './ProductionMetrics';

interface OffsetPrintingMachine {
  id: number;
  machine_code: string;
  machine_name: string;
  machine_type: string;
  manufacturer?: string;
  model?: string;
  location?: string;
  max_plate_size?: string;
  plate_count: number;
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
  plate_distribution: Record<string, number | { sheets: number; colors: string[]; totalUPS: number }>;
  color_efficiency: Record<string, number>;
  raw_excel_data: any;
  created_at: string;
}

interface OffsetPrintingJob {
  id: string;
  job_card_id: string;
  jobNumber: string;
  quantity: number;
  priority: string;
  delivery_date: string;
  createdAt: string;
  received_at_offset: string;
  // Product
  product_name: string;
  product_code: string;
  product_brand?: string;
  material_name?: string;
  // Company/Customer
  company_name: string;
  customer_name?: string;
  // Designs
  client_layout_link?: string;
  final_design_link?: string;
  // Ratio
  ratio_excel_link?: string;
  ratio_report_data?: any;
  ratio_report?: RatioReport;
  // Item Specs
  item_specifications_excel_link?: string;
  item_specifications_data?: any;
  // Machines (from designer selection)
  machines: OffsetPrintingMachine[];
  // Planning
  blank_width_mm?: number;
  blank_height_mm?: number;
  blank_width_inches?: number;
  blank_height_inches?: number;
  blank_size_unit?: string;
  final_total_sheets?: number;
  blanks_per_sheet?: number;
  // Assignment
  assignment_id?: string;
  assigned_machine_id?: number;
  assigned_operator_id?: number;
  assigned_operator_name?: string;
  offset_status?: string;
  offset_comments?: string;
  offset_started_at?: string;
  offset_completed_at?: string;
  // Prepress
  prepress_job_id?: string;
  required_plate_count?: number;
}

interface OffsetPrintingDashboardProps {
  onLogout?: () => void;
}

const statusConfig = {
  'Pending': { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  'Assigned': { color: 'bg-blue-100 text-blue-800', icon: User },
  'Setup': { color: 'bg-purple-100 text-purple-800', icon: Settings },
  'Printing': { color: 'bg-green-100 text-green-800', icon: Play },
  'Quality Check': { color: 'bg-indigo-100 text-indigo-800', icon: FileCheck },
  'Completed': { color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle },
  'On Hold': { color: 'bg-orange-100 text-orange-800', icon: Pause },
  'Rejected': { color: 'bg-red-100 text-red-800', icon: XCircle }
};

const OffsetPrintingDashboard: React.FC<OffsetPrintingDashboardProps> = ({ onLogout }) => {
  const { socket, isConnected } = useSocket();
  const [jobs, setJobs] = useState<OffsetPrintingJob[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<OffsetPrintingJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Handle navigation (for MainLayout compatibility)
  const handleNavigate = (page: string) => {
    // If navigating to a different route, use window.location
    if (page.startsWith('/')) {
      window.location.href = page;
    }
  };
  
  // Handle logout
  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      // Default logout behavior
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
  };
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [machineFilter, setMachineFilter] = useState('all');
  const [selectedJob, setSelectedJob] = useState<OffsetPrintingJob | null>(null);
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isCommentDialogOpen, setIsCommentDialogOpen] = useState(false);
  const [availableOperators, setAvailableOperators] = useState<any[]>([]);
  const [assignmentData, setAssignmentData] = useState({
    machineId: '',
    operatorId: '',
    comments: ''
  });
  const [statusData, setStatusData] = useState({
    status: '',
    comments: ''
  });
  const [commentText, setCommentText] = useState('');
  const [isJobProgressModalOpen, setIsJobProgressModalOpen] = useState(false);
  const [selectedJobForProgress, setSelectedJobForProgress] = useState<OffsetPrintingJob | null>(null);
  const [ratioReports, setRatioReports] = useState<Map<number, RatioReport>>(new Map());

  const apiUrl = getApiUrl();

  // Load Offset Printing jobs
  const loadJobs = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`${apiUrl}/api/offset-printing/jobs`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const jobsList = data.jobs || [];
        setJobs(jobsList);
        setFilteredJobs(jobsList);
        
        // Load ratio reports for jobs that have them
        const ratioReportPromises = jobsList
          .filter((job: OffsetPrintingJob) => job.ratio_report || job.job_card_id)
          .map((job: OffsetPrintingJob) => {
            // If ratio_report is already included, use it
            if (job.ratio_report) {
              return Promise.resolve({ jobCardId: parseInt(job.job_card_id), ratioReport: job.ratio_report });
            }
            // Otherwise, fetch it
            return loadRatioReport(parseInt(job.job_card_id))
              .then(ratioReport => ({ jobCardId: parseInt(job.job_card_id), ratioReport }))
              .catch(() => ({ jobCardId: parseInt(job.job_card_id), ratioReport: null }));
          });
        
        const ratioReportResults = await Promise.all(ratioReportPromises);
        const newRatioReports = new Map(ratioReports);
        ratioReportResults.forEach(({ jobCardId, ratioReport }) => {
          if (ratioReport) {
            newRatioReports.set(jobCardId, ratioReport);
          }
        });
        setRatioReports(newRatioReports);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to load offset printing jobs');
      }
    } catch (error) {
      console.error('Error loading offset printing jobs:', error);
      toast.error('Failed to load offset printing jobs');
    } finally {
      setIsLoading(false);
    }
  };

  // Load ratio report for a specific job
  const loadRatioReport = async (jobCardId: number): Promise<RatioReport | null> => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${apiUrl}/api/jobs/${jobCardId}/ratio-report`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.ratioReport) {
          return data.ratioReport as RatioReport;
        }
      }
      return null;
    } catch (error) {
      console.error(`Error loading ratio report for job ${jobCardId}:`, error);
      return null;
    }
  };

  // Extract plate information from ratio report
  const extractPlateInfo = (ratioReport: RatioReport | null): { plates: string[]; targetSheets: Record<string, number> } => {
    if (!ratioReport) {
      return { plates: [], targetSheets: {} };
    }

    const plates: string[] = [];
    const targetSheets: Record<string, number> = {};

    // Extract unique plate labels from color_details
    if (ratioReport.color_details && Array.isArray(ratioReport.color_details)) {
      const plateSet = new Set<string>();
      
      // First pass: collect all unique plate labels
      ratioReport.color_details.forEach((detail) => {
        if (detail.plate && detail.plate.trim()) {
          plateSet.add(detail.plate.trim().toUpperCase());
        }
      });

      // Sort plates alphabetically (A, B, C, etc.)
      plates.push(...Array.from(plateSet).sort());

      // Second pass: calculate target sheets for each plate
      // Sum all sheets values from color_details where plate === plateLabel
      plates.forEach((plateLabel) => {
        const sheetsForPlate = ratioReport.color_details
          .filter((detail) => detail.plate && detail.plate.trim().toUpperCase() === plateLabel)
          .reduce((sum, detail) => sum + (detail.sheets || 0), 0);
        
        targetSheets[plateLabel] = sheetsForPlate;
      });
    }

    // Fallback: if no color_details or no sheets calculated, try plate_distribution
    if (plates.length === 0 && ratioReport.plate_distribution) {
      Object.keys(ratioReport.plate_distribution).forEach((plateKey) => {
        const plateData = ratioReport.plate_distribution[plateKey];
        if (typeof plateData === 'object' && plateData !== null && 'sheets' in plateData) {
          // Complex format: {A: {sheets: 50, colors: [...], totalUPS: 18}}
          plates.push(plateKey.toUpperCase());
          targetSheets[plateKey.toUpperCase()] = (plateData as any).sheets || 0;
        } else if (typeof plateData === 'number') {
          // Simple format: {A: 3} - this is just count, not sheets
          // We can't determine sheets from this, so skip
        }
      });
    }

    return { plates, targetSheets };
  };

  // Load available operators
  const loadOperators = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${apiUrl}/api/offset-printing/operators`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAvailableOperators(data.operators || []);
      }
    } catch (error) {
      console.error('Error loading operators:', error);
    }
  };

  // Filter jobs
  useEffect(() => {
    let filtered = jobs;

    if (searchTerm) {
      filtered = filtered.filter(job => {
        const jobId = job.jobNumber || `JC-${job.job_card_id || job.id}` || '';
        return jobId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (job.product_code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (job.company_name || job.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(job => (job.offset_status || 'Pending') === statusFilter);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(job => job.priority === priorityFilter);
    }

    if (machineFilter !== 'all') {
      filtered = filtered.filter(job => job.assigned_machine_id?.toString() === machineFilter);
    }

    setFilteredJobs(filtered);
  }, [jobs, searchTerm, statusFilter, priorityFilter, machineFilter]);

  // Load data on mount
  useEffect(() => {
    loadJobs();
    loadOperators();
  }, []);

  // Socket listeners
  useEffect(() => {
    if (socket && isConnected) {
      const handleJobReady = (data: any) => {
        setTimeout(() => {
          toast.info(`New job ready for offset printing: ${data.jobId}`);
          loadJobs();
        }, 0);
      };

      const handleJobAssigned = (data: any) => {
        setTimeout(() => {
          toast.success('Job assigned successfully');
          loadJobs();
        }, 0);
      };

      const handleStatusUpdated = (data: any) => {
        setTimeout(() => {
          toast.info('Offset printing status updated');
          loadJobs();
        }, 0);
      };

      socket.on('offset_printing:job_ready', handleJobReady);
      socket.on('offset_printing:job_assigned', handleJobAssigned);
      socket.on('offset_printing:status_updated', handleStatusUpdated);

      // Real-time progress update listeners
      const handleProgressUpdated = (data: any) => {
        toast.success(`Progress updated for Plate ${data.plateNumber}`);
        loadJobs();
      };

      const handlePlateCompleted = (data: any) => {
        toast.success(`Plate ${data.plateNumber} completed!`);
        loadJobs();
      };

      const handleMetricsUpdated = (data: any) => {
        loadJobs();
      };

      socket.on('offset_printing:progress_updated', handleProgressUpdated);
      socket.on('offset_printing:plate_completed', handlePlateCompleted);
      socket.on('offset_printing:metrics_updated', handleMetricsUpdated);

      return () => {
        socket.off('offset_printing:job_ready', handleJobReady);
        socket.off('offset_printing:job_assigned', handleJobAssigned);
        socket.off('offset_printing:status_updated', handleStatusUpdated);
        socket.off('offset_printing:progress_updated', handleProgressUpdated);
        socket.off('offset_printing:plate_completed', handlePlateCompleted);
        socket.off('offset_printing:metrics_updated', handleMetricsUpdated);
      };
    }
  }, [socket, isConnected]);

  // Assign job to machine and operator
  const handleAssign = async () => {
    if (!selectedJob || !assignmentData.machineId || !assignmentData.operatorId) {
      toast.error('Please select a machine and operator');
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${apiUrl}/api/offset-printing/assign`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jobId: selectedJob.id,
          machineId: parseInt(assignmentData.machineId),
          operatorId: parseInt(assignmentData.operatorId),
          comments: assignmentData.comments
        })
      });

      if (response.ok) {
        toast.success('Job assigned successfully');
        setIsAssignmentDialogOpen(false);
        setAssignmentData({ machineId: '', operatorId: '', comments: '' });
        loadJobs();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to assign job');
      }
    } catch (error) {
      console.error('Error assigning job:', error);
      toast.error('Failed to assign job');
    }
  };

  // Update status
  const handleUpdateStatus = async () => {
    if (!selectedJob || !statusData.status) {
      toast.error('Please select a status');
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${apiUrl}/api/offset-printing/update-status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jobId: selectedJob.id,
          status: statusData.status,
          comments: statusData.comments
        })
      });

      if (response.ok) {
        toast.success('Status updated successfully');
        setIsStatusDialogOpen(false);
        setStatusData({ status: '', comments: '' });
        loadJobs();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  // Add comment
  const handleAddComment = async () => {
    if (!selectedJob || !commentText.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${apiUrl}/api/offset-printing/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jobId: selectedJob.id,
          comment: commentText
        })
      });

      if (response.ok) {
        toast.success('Comment added successfully');
        setIsCommentDialogOpen(false);
        setCommentText('');
        loadJobs();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to add comment');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    }
  };

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['Pending'];
    const Icon = config.icon;
    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {status}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      'CRITICAL': 'bg-red-100 text-red-800',
      'HIGH': 'bg-orange-100 text-orange-800',
      'MEDIUM': 'bg-yellow-100 text-yellow-800',
      'LOW': 'bg-blue-100 text-blue-800'
    };
    return (
      <Badge className={colors[priority as keyof typeof colors] || colors['MEDIUM']}>
        {priority}
      </Badge>
    );
  };

  return (
    <MainLayout 
      currentPage="offset-printing-dashboard"
      onNavigate={handleNavigate}
      onLogout={handleLogout}
      pageTitle="Offset Printing Dashboard"
      pageDescription="Manage offset printing jobs and assignments"
    >
      <div className="p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Printer className="h-6 w-6 sm:h-8 sm:w-8" />
              Offset Printing Dashboard
            </h1>
            <p className="text-gray-600 mt-1">Manage offset printing jobs and assignments</p>
          </div>
          <Button onClick={loadJobs} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Real-Time Status Panel */}
        <RealTimeStatusPanel />

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label>Search</Label>
                <div className="relative mt-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Job number, product, customer..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {Object.keys(statusConfig).map(status => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Priority</Label>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="CRITICAL">Critical</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="LOW">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Machine</Label>
                <Select value={machineFilter} onValueChange={setMachineFilter}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Machines</SelectItem>
                    {Array.from(new Set(jobs.flatMap(j => j.machines || []).map(m => m.id.toString()))).map(machineId => {
                      const machine = jobs.flatMap(j => j.machines || []).find(m => m.id.toString() === machineId);
                      return machine ? (
                        <SelectItem key={machineId} value={machineId}>{machine.machine_name}</SelectItem>
                      ) : null;
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Jobs List */}
        {isLoading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
              <p className="mt-2 text-gray-600">Loading jobs...</p>
            </CardContent>
          </Card>
        ) : filteredJobs.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Printer className="h-12 w-12 mx-auto text-gray-400" />
              <p className="mt-2 text-gray-600">No jobs found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredJobs.map((job) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4 sm:p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      {/* Left Column - Job Info */}
                      <div className="lg:col-span-2 space-y-4">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{job.jobNumber}</h3>
                            <p className="text-sm text-gray-600">{job.product_name} ({job.product_code})</p>
                            <p className="text-sm text-gray-600">{job.company_name}</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {getStatusBadge(job.offset_status || 'Pending')}
                            {getPriorityBadge(job.priority)}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Quantity</p>
                            <p className="font-medium">{job.quantity.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Delivery Date</p>
                            <p className="font-medium">{new Date(job.delivery_date).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Received</p>
                            <p className="font-medium">{new Date(job.received_at_offset).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Plates</p>
                            <p className="font-medium">{job.required_plate_count || 'N/A'}</p>
                          </div>
                        </div>

                        {/* Designer-Selected Machines */}
                        {job.machines && job.machines.length > 0 && (
                          <div className="bg-indigo-50 p-3 rounded-lg">
                            <h4 className="font-semibold text-gray-800 mb-2 text-sm flex items-center gap-2">
                              <Monitor className="h-4 w-4" />
                              Designer-Selected Machines
                            </h4>
                            <div className="space-y-2">
                              {job.machines.map((machine) => (
                                <div key={machine.id} className="flex items-center justify-between text-sm">
                                  <div>
                                    <span className="font-medium">{machine.machine_name}</span>
                                    <span className="text-gray-600 ml-2">({machine.machine_code})</span>
                                    {machine.location && (
                                      <span className="text-gray-500 ml-2">- {machine.location}</span>
                                    )}
                                  </div>
                                  <Badge variant="outline">{machine.plate_count} plates</Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Assignment Info */}
                        {job.assigned_operator_name && (
                          <div className="bg-blue-50 p-3 rounded-lg">
                            <p className="text-sm">
                              <span className="font-medium">Assigned to:</span> {job.assigned_operator_name}
                              {job.assigned_machine_id && (
                                <>
                                  {' on '}
                                  {job.machines?.find(m => m.id === job.assigned_machine_id)?.machine_name || 'Machine'}
                                </>
                              )}
                            </p>
                          </div>
                        )}

                        {/* Design Links */}
                        {(job.client_layout_link || job.final_design_link) && (
                          <div className="bg-purple-50 p-3 rounded-lg">
                            <h4 className="font-semibold text-gray-800 mb-2 text-sm flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              Design Files
                            </h4>
                            <div className="space-y-2">
                              {job.client_layout_link && (
                                <GoogleDrivePreview
                                  url={job.client_layout_link}
                                  label="Initial Design"
                                  showThumbnail={true}
                                  showPreview={true}
                                />
                              )}
                              {job.final_design_link && (
                                <GoogleDrivePreview
                                  url={job.final_design_link}
                                  label="Final Design"
                                  showThumbnail={true}
                                  showPreview={true}
                                />
                              )}
                            </div>
                          </div>
                        )}

                        {/* Ratio Report */}
                        {(job.ratio_report || ratioReports.get(parseInt(job.job_card_id))) && (() => {
                          const ratioReport = job.ratio_report || ratioReports.get(parseInt(job.job_card_id));
                          const plateInfo = extractPlateInfo(ratioReport || null);
                          return (
                            <div className="bg-yellow-50 p-3 rounded-lg">
                              <h4 className="font-semibold text-gray-800 mb-2 text-sm flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Ratio Report
                              </h4>
                              {ratioReport && (
                                <div className="space-y-2 text-sm">
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <span className="text-gray-600">Total Plates:</span>
                                      <span className="font-medium ml-2">{ratioReport.total_plates || 'N/A'}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-600">Total Sheets:</span>
                                      <span className="font-medium ml-2">{ratioReport.total_sheets || 'N/A'}</span>
                                    </div>
                                  </div>
                                  {plateInfo.plates.length > 0 && (
                                    <div className="mt-2">
                                      <p className="text-gray-600 mb-1">Plates & Target Sheets:</p>
                                      <div className="flex flex-wrap gap-2">
                                        {plateInfo.plates.map((plate) => (
                                          <Badge key={plate} variant="outline" className="bg-white">
                                            Plate {plate}: {plateInfo.targetSheets[plate] || 0} sheets
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {ratioReport.excel_file_link && (
                                    <div className="mt-2">
                                      <GoogleDrivePreview
                                        url={ratioReport.excel_file_link}
                                        label="Ratio Excel File"
                                        showThumbnail={true}
                                        showPreview={true}
                                      />
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>

                      {/* Right Column - Actions */}
                      <div className="space-y-2">
                        <Button
                          onClick={() => {
                            setSelectedJob(job);
                            setIsAssignmentDialogOpen(true);
                          }}
                          className="w-full"
                          variant="outline"
                          disabled={job.offset_status === 'Completed'}
                        >
                          <User className="h-4 w-4 mr-2" />
                          Assign
                        </Button>
                        <Button
                          onClick={() => {
                            setSelectedJob(job);
                            setIsStatusDialogOpen(true);
                          }}
                          className="w-full"
                          variant="outline"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Update Status
                        </Button>
                        <Button
                          onClick={() => {
                            setSelectedJob(job);
                            setIsCommentDialogOpen(true);
                          }}
                          className="w-full"
                          variant="outline"
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Add Comment
                        </Button>
                        {job.assignment_id && (
                          <Button
                            onClick={() => {
                              setSelectedJobForProgress(job);
                              setIsJobProgressModalOpen(true);
                            }}
                            className="w-full"
                            variant="outline"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Progress
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Job Progress Modal */}
        {selectedJobForProgress && (() => {
          const ratioReport = selectedJobForProgress.ratio_report || ratioReports.get(parseInt(selectedJobForProgress.job_card_id));
          const plateInfo = extractPlateInfo(ratioReport || null);
          return (
            <JobProgressModal
              isOpen={isJobProgressModalOpen}
              onClose={() => {
                setIsJobProgressModalOpen(false);
                setSelectedJobForProgress(null);
              }}
              jobId={parseInt(selectedJobForProgress.job_card_id)}
              assignmentId={selectedJobForProgress.assignment_id ? parseInt(selectedJobForProgress.assignment_id) : undefined}
              totalPlates={selectedJobForProgress.required_plate_count || plateInfo.plates.length || 0}
              plateLabels={plateInfo.plates.length > 0 ? plateInfo.plates : undefined}
              targetSheetsMap={Object.keys(plateInfo.targetSheets).length > 0 ? plateInfo.targetSheets : undefined}
            />
          );
        })()}

        {/* Assignment Dialog */}
        <Dialog open={isAssignmentDialogOpen} onOpenChange={setIsAssignmentDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Assign Job to Machine and Operator</DialogTitle>
            </DialogHeader>
            {selectedJob && (
              <div className="space-y-4">
                <div>
                  <Label>Select Machine (Designer-Selected)</Label>
                  <Select
                    value={assignmentData.machineId}
                    onValueChange={(value) => setAssignmentData({ ...assignmentData, machineId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select machine" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedJob.machines?.map((machine) => (
                        <SelectItem key={machine.id} value={machine.id.toString()}>
                          {machine.machine_name} ({machine.machine_code}) - {machine.plate_count} plates
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Select Operator</Label>
                  <Select
                    value={assignmentData.operatorId}
                    onValueChange={(value) => setAssignmentData({ ...assignmentData, operatorId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select operator" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableOperators.map((operator) => (
                        <SelectItem key={operator.id} value={operator.id.toString()}>
                          {operator.firstName} {operator.lastName} ({operator.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Comments</Label>
                  <Textarea
                    value={assignmentData.comments}
                    onChange={(e) => setAssignmentData({ ...assignmentData, comments: e.target.value })}
                    placeholder="Add assignment notes..."
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsAssignmentDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAssign}>
                    Assign
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Status Update Dialog */}
        <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Status</DialogTitle>
            </DialogHeader>
            {selectedJob && (
              <div className="space-y-4">
                <div>
                  <Label>Status</Label>
                  <Select
                    value={statusData.status}
                    onValueChange={(value) => setStatusData({ ...statusData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(statusConfig).map(status => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Comments</Label>
                  <Textarea
                    value={statusData.comments}
                    onChange={(e) => setStatusData({ ...statusData, comments: e.target.value })}
                    placeholder="Add status update notes..."
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateStatus}>
                    Update
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Comment Dialog */}
        <Dialog open={isCommentDialogOpen} onOpenChange={setIsCommentDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Comment</DialogTitle>
            </DialogHeader>
            {selectedJob && (
              <div className="space-y-4">
                <div>
                  <Label>Comment</Label>
                  <Textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add a comment..."
                    rows={4}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCommentDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddComment}>
                    Add Comment
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
};

export default OffsetPrintingDashboard;

