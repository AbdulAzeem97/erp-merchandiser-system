import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Factory,
  Package,
  Clock,
  Search,
  Filter,
  RefreshCw,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Calendar,
  User,
  Zap,
  Eye
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useSocket } from '@/services/socketService.tsx';
import { MainLayout } from '@/components/layout/MainLayout';
import ClockTimer from '@/components/ui/ClockTimer';
import { SmartDashboardJob } from '@/types/inventory';

interface SmartProductionDashboardProps {
  onLogout?: () => void;
}

const planningStatusColors = {
  PENDING: 'bg-gray-100 text-gray-800 border-gray-300',
  PLANNED: 'bg-blue-100 text-blue-800 border-blue-300',
  LOCKED: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  APPLIED: 'bg-green-100 text-green-800 border-green-300'
};

const priorityColors = {
  LOW: 'bg-gray-100 text-gray-800',
  MEDIUM: 'bg-blue-100 text-blue-800',
  HIGH: 'bg-orange-100 text-orange-800',
  CRITICAL: 'bg-red-100 text-red-800',
  URGENT: 'bg-red-100 text-red-800'
};

const SmartProductionDashboard: React.FC<SmartProductionDashboardProps> = ({ onLogout }) => {
  const navigate = useNavigate();
  const { socket, isConnected } = useSocket();
  const [jobs, setJobs] = useState<SmartDashboardJob[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<SmartDashboardJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Load jobs
  const loadJobs = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/production/smart-dashboard/jobs`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setJobs(data.jobs || []);
          setFilteredJobs(data.jobs || []);
        } else {
          toast.error('Failed to load jobs');
        }
      } else {
        toast.error('Failed to load jobs');
      }
    } catch (error) {
      console.error('Error loading jobs:', error);
      toast.error('Error loading jobs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  // Filter jobs
  useEffect(() => {
    let filtered = jobs;

    if (searchTerm) {
      filtered = filtered.filter(job =>
        job.job_card_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.product_item_code?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(job => job.planning_status === statusFilter);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(job => job.priority === priorityFilter);
    }

    setFilteredJobs(filtered);
  }, [jobs, searchTerm, statusFilter, priorityFilter]);

  // WebSocket updates
  useEffect(() => {
    if (socket && isConnected) {
      socket.on('job_planning_updated', () => {
        loadJobs();
      });

      socket.on('job_planning_applied', () => {
        loadJobs();
      });

      socket.on('job_status_changed', () => {
        loadJobs();
      });

      return () => {
        socket.off('job_planning_updated');
        socket.off('job_planning_applied');
        socket.off('job_status_changed');
      };
    }
  }, [socket, isConnected]);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysUntilDue = (dueDate: string) => {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleViewJob = (job: SmartDashboardJob) => {
    navigate(`/production/smart-dashboard/${job.prepress_job_id}`);
  };

  return (
    <MainLayout
      currentPage="smart-production-dashboard"
      onLogout={onLogout}
      isLoading={isLoading}
    >
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 p-8 shadow-2xl"
        >
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-3">
                <h1 className="text-4xl font-bold text-white tracking-tight flex items-center gap-3">
                  <Factory className="h-10 w-10" />
                  Smart Production Dashboard
                </h1>
                <p className="text-blue-100 text-lg">
                  Sheet planning, optimization, and cutting layout management
                </p>
                <div className="flex items-center gap-4 mt-4">
                  <Badge className={`${isConnected ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'} text-white border-0`}>
                    {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
                  </Badge>
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                    {filteredJobs.length} Jobs
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={loadJobs}
                  variant="secondary"
                  size="sm"
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="p-6 space-y-6">
          {/* Filters */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1">
                  <label htmlFor="search" className="text-sm font-semibold text-gray-700 mb-2 block">
                    Search Jobs
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="search"
                      placeholder="Search by job number, customer, or product..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-white/50 border-gray-200"
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <label htmlFor="status-filter" className="text-sm font-semibold text-gray-700 mb-2 block">
                    Planning Status
                  </label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="bg-white/50 border-gray-200">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="PLANNED">Planned</SelectItem>
                      <SelectItem value="LOCKED">Locked</SelectItem>
                      <SelectItem value="APPLIED">Applied</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <label htmlFor="priority-filter" className="text-sm font-semibold text-gray-700 mb-2 block">
                    Priority
                  </label>
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="bg-white/50 border-gray-200">
                      <SelectValue placeholder="All Priorities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priority</SelectItem>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="CRITICAL">Critical</SelectItem>
                      <SelectItem value="URGENT">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Jobs List */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Package className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <span className="text-gray-900">Post-CTP Jobs</span>
                    <Badge variant="secondary" className="ml-3 bg-blue-100 text-blue-800">
                      {filteredJobs.length}
                    </Badge>
                  </div>
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {filteredJobs.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
                  <p className="text-gray-500">
                    {jobs.length === 0
                      ? 'No jobs have completed CTP yet.'
                      : 'No jobs match your current filters.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredJobs.map((job, index) => {
                    const daysUntilDue = getDaysUntilDue(job.delivery_date);
                    const isUrgent = daysUntilDue !== null && daysUntilDue <= 2;

                    return (
                      <motion.div
                        key={job.prepress_job_id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.02, y: -4 }}
                        onClick={() => handleViewJob(job)}
                        className="bg-white border border-gray-200 rounded-lg overflow-hidden cursor-pointer hover:shadow-lg hover:border-blue-400 transition-all duration-300"
                      >
                        {/* Header with Status */}
                        <div className={`${planningStatusColors[job.planning_status]} px-4 py-2 flex items-center justify-between`}>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">
                              {job.planning_status.replace('_', ' ')}
                            </span>
                          </div>
                          <Badge className={`${priorityColors[job.priority as keyof typeof priorityColors] || priorityColors.MEDIUM} border-0`}>
                            {job.priority}
                          </Badge>
                        </div>

                        {/* Body */}
                        <div className="p-4 space-y-3">
                          {/* Job ID */}
                          <div className="flex items-center gap-2 border-b pb-2">
                            <Package className="h-4 w-4 text-blue-600" />
                            <h3 className="font-bold text-lg text-gray-900">{job.job_card_number}</h3>
                          </div>

                          {/* Job Info */}
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-500">Customer:</span>
                              <span className="font-medium text-gray-900 text-right truncate max-w-[150px]">
                                {job.customer_name || job.company_name}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-500">Product:</span>
                              <span className="font-medium text-gray-900 text-right truncate max-w-[150px]">
                                {job.product_item_code}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-500">Quantity:</span>
                              <span className="font-medium text-gray-900">
                                {job.quantity.toLocaleString()} units
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-500">Material:</span>
                              <span className="font-medium text-gray-900 text-right truncate max-w-[150px]">
                                {job.material_name || 'N/A'}
                              </span>
                            </div>
                          </div>

                          {/* Planning Info */}
                          {job.planning_status !== 'PENDING' && (
                            <div className="bg-blue-50 p-2 rounded border border-blue-200">
                              <div className="text-xs space-y-1">
                                {job.final_total_sheets && (
                                  <div className="flex justify-between">
                                    <span className="text-blue-600">Total Sheets:</span>
                                    <span className="font-semibold">{job.final_total_sheets}</span>
                                  </div>
                                )}
                                {job.material_cost && (
                                  <div className="flex justify-between">
                                    <span className="text-blue-600">Cost:</span>
                                    <span className="font-semibold">
                                      ${job.material_cost.toFixed(2)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Due Date */}
                          <div className={`flex items-center justify-between p-2 rounded ${
                            isUrgent ? 'bg-red-50' : 'bg-gray-50'
                          }`}>
                            <div className="flex items-center gap-1">
                              <Clock className={`h-4 w-4 ${isUrgent ? 'text-red-600' : 'text-gray-600'}`} />
                              <span className="text-xs text-gray-600">Due:</span>
                            </div>
                            <span className={`text-sm font-semibold ${
                              isUrgent ? 'text-red-600' : 'text-gray-900'
                            }`}>
                              {formatDate(job.delivery_date)}
                              {daysUntilDue !== null && (
                                <span className="ml-1">({daysUntilDue}d)</span>
                              )}
                            </span>
                          </div>

                          {/* Action Button */}
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewJob(job);
                            }}
                            className="w-full"
                            variant={job.planning_status === 'PENDING' ? 'default' : 'outline'}
                          >
                            {job.planning_status === 'PENDING' ? (
                              <>
                                <TrendingUp className="h-4 w-4 mr-2" />
                                Plan Job
                              </>
                            ) : (
                              <>
                                <Eye className="h-4 w-4 mr-2" />
                                View Planning
                              </>
                            )}
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default SmartProductionDashboard;

