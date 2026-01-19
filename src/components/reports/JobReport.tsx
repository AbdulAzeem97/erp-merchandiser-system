import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Download,
  FileText,
  Filter,
  RefreshCw,
  Calendar,
  Search,
  X,
  BarChart3,
  TrendingUp,
  Package,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { jobsAPI, authAPI } from '@/services/api';
import { toast } from 'sonner';

interface Job {
  id: number;
  jobNumber: string;
  product_code?: string;
  brand?: string;
  customer_name?: string;
  company_name?: string;
  po_number?: string;
  without_po?: boolean;
  quantity: number;
  dueDate: string;
  status: string;
  urgency: string;
  current_department?: string;
  created_by_name?: string;
  createdAt: string;
  product_name?: string;
  material_name?: string;
  gsm?: number;
  assigned_designer_name?: string;
  customer_email?: string;
  customer_phone?: string;
}

interface AssistantMerchandiser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
}

interface ReportStatistics {
  total: number;
  byStatus: Record<string, number>;
  byDepartment: Record<string, number>;
  withPO: number;
  withoutPO: number;
  byBrand: Record<string, number>;
  byPriority: Record<string, number>;
}

export const JobReport: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [statistics, setStatistics] = useState<ReportStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [brands, setBrands] = useState<string[]>([]);
  const [assistants, setAssistants] = useState<AssistantMerchandiser[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Filter states
  const [filters, setFilters] = useState({
    po_status: 'all',
    status: 'all',
    brand: 'all',
    date_from: '',
    date_to: '',
    department: 'all',
    assistant_merchandiser_id: 'all',
    created_by_id: 'all'
  });

  // Departments list
  const departments = [
    'Prepress',
    'Cutting',
    'Production',
    'Offset Printing',
    'Lamination',
    'QA',
    'Dispatch'
  ];

  // Job statuses
  const jobStatuses = [
    'PENDING',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED',
    'ON_HOLD',
    'REVISIONS_REQUIRED',
    'APPROVED_BY_QA',
    'SUBMITTED_TO_QA'
  ];

  useEffect(() => {
    const user = authAPI.getCurrentUser();
    setCurrentUser(user);
    loadBrands();
    if (user?.role === 'SENIOR_MERCHANDISER') {
      loadAssistants();
    }
    loadReport();
  }, []);

  useEffect(() => {
    loadReport();
  }, [filters]);

  const loadBrands = async () => {
    try {
      const response = await jobsAPI.getReportBrands();
      if (response.success) {
        setBrands(response.brands || []);
      }
    } catch (error) {
      console.error('Error loading brands:', error);
    }
  };

  const loadAssistants = async () => {
    try {
      const response = await jobsAPI.getReportAssistants();
      if (response.success) {
        setAssistants(response.assistants || []);
      }
    } catch (error) {
      console.error('Error loading assistants:', error);
    }
  };

  const loadReport = async () => {
    try {
      setIsLoading(true);
      const reportFilters: any = {};

      if (filters.po_status !== 'all') {
        reportFilters.po_status = filters.po_status;
      }
      if (filters.status !== 'all') {
        reportFilters.status = filters.status;
      }
      if (filters.brand !== 'all') {
        reportFilters.brand = filters.brand;
      }
      if (filters.date_from) {
        reportFilters.date_from = filters.date_from;
      }
      if (filters.date_to) {
        reportFilters.date_to = filters.date_to;
      }
      if (filters.department !== 'all') {
        reportFilters.department = filters.department;
      }
      if (filters.assistant_merchandiser_id !== 'all') {
        reportFilters.assistant_merchandiser_id = filters.assistant_merchandiser_id;
      }
      if (filters.created_by_id !== 'all') {
        reportFilters.created_by_id = filters.created_by_id;
      }

      const response = await jobsAPI.getJobReport(reportFilters);
      
      if (response.success) {
        setJobs(response.data || []);
        setFilteredJobs(response.data || []);
        setStatistics(response.statistics || null);
      }
    } catch (error: any) {
      console.error('Error loading report:', error);
      toast.error(error.response?.message || 'Failed to load job report');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      const reportFilters: any = {};

      if (filters.po_status !== 'all') reportFilters.po_status = filters.po_status;
      if (filters.status !== 'all') reportFilters.status = filters.status;
      if (filters.brand !== 'all') reportFilters.brand = filters.brand;
      if (filters.date_from) reportFilters.date_from = filters.date_from;
      if (filters.date_to) reportFilters.date_to = filters.date_to;
      if (filters.department !== 'all') reportFilters.department = filters.department;
      if (filters.assistant_merchandiser_id !== 'all') reportFilters.assistant_merchandiser_id = filters.assistant_merchandiser_id;
      if (filters.created_by_id !== 'all') reportFilters.created_by_id = filters.created_by_id;

      const blob = await jobsAPI.exportJobReportCSV(reportFilters);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `job_report_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Report exported to CSV successfully!');
    } catch (error: any) {
      console.error('Error exporting CSV:', error);
      toast.error(error.message || 'Failed to export CSV');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      const reportFilters: any = {};

      if (filters.po_status !== 'all') reportFilters.po_status = filters.po_status;
      if (filters.status !== 'all') reportFilters.status = filters.status;
      if (filters.brand !== 'all') reportFilters.brand = filters.brand;
      if (filters.date_from) reportFilters.date_from = filters.date_from;
      if (filters.date_to) reportFilters.date_to = filters.date_to;
      if (filters.department !== 'all') reportFilters.department = filters.department;
      if (filters.assistant_merchandiser_id !== 'all') reportFilters.assistant_merchandiser_id = filters.assistant_merchandiser_id;
      if (filters.created_by_id !== 'all') reportFilters.created_by_id = filters.created_by_id;

      const blob = await jobsAPI.exportJobReportPDF(reportFilters);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `job_report_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Report exported to PDF successfully!');
    } catch (error: any) {
      console.error('Error exporting PDF:', error);
      toast.error(error.message || 'Failed to export PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const handleClearFilters = () => {
    setFilters({
      po_status: 'all',
      status: 'all',
      brand: 'all',
      date_from: '',
      date_to: '',
      department: 'all',
      assistant_merchandiser_id: 'all',
      created_by_id: 'all'
    });
  };

  const getStatusColor = (status: string) => {
    const statusMap: Record<string, string> = {
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'IN_PROGRESS': 'bg-blue-100 text-blue-800',
      'COMPLETED': 'bg-green-100 text-green-800',
      'CANCELLED': 'bg-red-100 text-red-800',
      'ON_HOLD': 'bg-orange-100 text-orange-800',
      'REVISIONS_REQUIRED': 'bg-purple-100 text-purple-800',
      'APPROVED_BY_QA': 'bg-emerald-100 text-emerald-800',
      'SUBMITTED_TO_QA': 'bg-cyan-100 text-cyan-800'
    };
    return statusMap[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const priorityMap: Record<string, string> = {
      'LOW': 'bg-gray-100 text-gray-800',
      'NORMAL': 'bg-blue-100 text-blue-800',
      'MEDIUM': 'bg-yellow-100 text-yellow-800',
      'HIGH': 'bg-orange-100 text-orange-800',
      'URGENT': 'bg-red-100 text-red-800'
    };
    return priorityMap[priority] || 'bg-gray-100 text-gray-800';
  };

  const isSeniorMerchandiser = currentUser?.role === 'SENIOR_MERCHANDISER';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Job Reports</h2>
          <p className="text-gray-600 mt-1">Comprehensive job reporting with advanced filtering</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={loadReport} variant="outline" size="sm" disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={handleExportCSV} disabled={isExporting || isLoading} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={handleExportPDF} disabled={isExporting || isLoading} className="bg-blue-600 hover:bg-blue-700">
            <FileText className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Filter Panel */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              Filters
            </CardTitle>
            <Button onClick={handleClearFilters} variant="ghost" size="sm">
              <X className="w-4 h-4 mr-2" />
              Clear All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* PO Status Filter */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">PO Status</label>
              <Select
                value={filters.po_status}
                onValueChange={(value) => setFilters({ ...filters, po_status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="with_po">With PO</SelectItem>
                  <SelectItem value="without_po">Without PO</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Status</label>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters({ ...filters, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {jobStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Brand Filter */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Brand</label>
              <Select
                value={filters.brand}
                onValueChange={(value) => setFilters({ ...filters, brand: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Brands</SelectItem>
                  {brands.map((brand) => (
                    <SelectItem key={brand} value={brand}>
                      {brand}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Department Filter */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Department</label>
              <Select
                value={filters.department}
                onValueChange={(value) => setFilters({ ...filters, department: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date From */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Date From</label>
              <Input
                type="date"
                value={filters.date_from}
                onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
              />
            </div>

            {/* Date To */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Date To</label>
              <Input
                type="date"
                value={filters.date_to}
                onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
              />
            </div>

            {/* Assistant Merchandiser Filter (Senior only) */}
            {isSeniorMerchandiser && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Assistant Merchandiser</label>
                <Select
                  value={filters.assistant_merchandiser_id}
                  onValueChange={(value) => setFilters({ ...filters, assistant_merchandiser_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Assistants</SelectItem>
                    <SelectItem value={currentUser?.id?.toString()}>My Jobs</SelectItem>
                    {assistants.map((assistant) => (
                      <SelectItem key={assistant.id} value={assistant.id.toString()}>
                        {assistant.firstName} {assistant.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Jobs</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.total}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">With PO</p>
                  <p className="text-2xl font-bold text-green-600">{statistics.withPO}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Without PO</p>
                  <p className="text-2xl font-bold text-amber-600">{statistics.withoutPO}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-amber-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{statistics.byStatus.PENDING || 0}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Report Table */}
      <Card>
        <CardHeader>
          <CardTitle>Job Report ({filteredJobs.length} jobs)</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin mr-2" />
              Loading report...
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-gray-500">
              <AlertCircle className="w-6 h-6 mr-2" />
              No jobs found matching the filters
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Job Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Brand
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      PO Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priority
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredJobs.map((job, index) => {
                    const isWithoutPO = job.without_po === true || !job.po_number || job.po_number.trim() === '';
                    return (
                      <motion.tr
                        key={job.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`hover:bg-gray-50 ${isWithoutPO ? 'bg-amber-50' : ''}`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{job.jobNumber}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{job.product_code || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{job.brand || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{job.customer_name || job.company_name || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isWithoutPO ? (
                            <Badge className="bg-amber-100 text-amber-800">No PO</Badge>
                          ) : (
                            <span className="text-sm text-gray-900">{job.po_number || 'N/A'}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={getStatusColor(job.status)}>
                            {job.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{job.current_department || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{job.created_by_name || 'System'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(job.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(job.dueDate).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{job.quantity.toLocaleString()}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={getPriorityColor(job.urgency)}>
                            {job.urgency}
                          </Badge>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

