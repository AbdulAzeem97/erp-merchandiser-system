import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  Factory, 
  RefreshCw,
  Calendar,
  User,
  Package,
  Building2,
  Clock,
  CheckCircle,
  AlertCircle,
  Play,
  Pause,
  Square,
  FileText,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { jobsAPI, productsAPI, companiesAPI, usersAPI } from '@/services/api';
import SmartSidebar from '@/components/layout/SmartSidebar';
import { authAPI } from '@/services/api';
import { useSocket } from '@/services/socketService.tsx';

interface Job {
  id: string;
  job_card_id: string;
  product_id: string;
  product_name?: string;
  product_code?: string;
  company_id: string;
  company_name?: string;
  assigned_designer_id?: string;
  designer_name?: string;
  status: string;
  priority: string;
  progress: number;
  quantity: number;
  delivery_date: string;
  description: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  attachments?: JobAttachment[];
  current_department?: string;
  current_step?: string;
  workflow_status?: string;
  status_message?: string;
  po_number?: string;
  without_po?: boolean;
  created_by_name?: string;
  createdById?: number;
}

interface JobAttachment {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  fileType: string;
  uploadedBy: string;
  uploadedAt: string;
}

interface Product {
  id: string;
  product_item_code: string;
  brand: string;
  type: string;
  material_name?: string;
  gsm: number;
}

interface Company {
  id: string;
  name: string;
  contact_person: string;
  email: string;
}

interface Designer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

const JobsModule: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [designers, setDesigners] = useState<Designer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState('jobs');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const socket = useSocket();

  // Form state
  const [formData, setFormData] = useState({
    product_id: '',
    company_id: '',
    assigned_designer_id: '',
    status: 'pending',
    priority: 'medium',
    progress: 0,
    quantity: 1,
    delivery_date: '',
    description: ''
  });

  // Product search state
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    loadData();
    loadCurrentUser();
  }, []);

  // Real-time updates
  useEffect(() => {
    if (socket && socket.connected && currentUser) {
      // Join job updates room
      socket.emit('join_job_updates');

      // Listen for job updates
      socket.on('jobUpdated', (data) => {
        const updatedJob = data.data;
        setJobs(prevJobs => 
          prevJobs.map(job => 
            job.id === updatedJob.id ? { ...job, ...updatedJob } : job
          )
        );
        toast.info(`Job ${updatedJob.job_card_id} has been updated`);
      });

      // Listen for new jobs
      socket.on('jobCreated', (data) => {
        const newJob = data.data;
        setJobs(prevJobs => [newJob, ...prevJobs]);
        toast.success(`New job created: ${newJob.job_card_id}`);
      });

      return () => {
        socket.off('jobUpdated');
        socket.off('jobCreated');
      };
    }
  }, [socket, currentUser]);

  useEffect(() => {
    if (productSearchTerm) {
      const filtered = products.filter(product =>
        product.product_item_code.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
        product.brand.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
        product.type.toLowerCase().includes(productSearchTerm.toLowerCase())
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts([]);
    }
  }, [productSearchTerm, products]);

  const loadCurrentUser = async () => {
    try {
      const user = await authAPI.getCurrentUser();
      setCurrentUser(user);
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [jobsRes, productsRes, companiesRes, designersRes] = await Promise.all([
        jobsAPI.getAll(),
        productsAPI.getAll(),
        companiesAPI.getAll(),
        usersAPI.getByRole('DESIGNER')
      ]);
      
      const jobsData = jobsRes.jobs || jobsRes.data || [];
      console.log('📋 JobsModule: Loaded jobs:', jobsData.length);
      console.log('📋 JobsModule: First job sample:', jobsData[0] ? {
        id: jobsData[0].id,
        job_card_id: jobsData[0].job_card_id || jobsData[0].jobNumber,
        status: jobsData[0].status,
        current_department: jobsData[0].current_department,
        current_step: jobsData[0].current_step,
        workflow_status: jobsData[0].workflow_status,
        status_message: jobsData[0].status_message
      } : 'No jobs');
      
      setJobs(jobsData);
      setProducts(productsRes.data || productsRes.products || []);
      setCompanies(companiesRes.data || companiesRes.companies || []);
      setDesigners(designersRes.data || designersRes.users || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load jobs data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const response = await jobsAPI.create(formData);
      toast.success('Job created successfully');
      setIsCreateModalOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error creating job:', error);
      toast.error('Failed to create job');
    }
  };

  const handleUpdate = async () => {
    if (!selectedJob) return;
    
    try {
      await jobsAPI.update(selectedJob.id, formData);
      toast.success('Job updated successfully');
      setIsEditModalOpen(false);
      setSelectedJob(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error updating job:', error);
      toast.error('Failed to update job');
    }
  };

  const handleDelete = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job?')) return;
    
    try {
      await jobsAPI.delete(jobId);
      toast.success('Job deleted successfully');
      loadData();
    } catch (error) {
      console.error('Error deleting job:', error);
      toast.error('Failed to delete job');
    }
  };

  const handleEdit = async (job: Job) => {
    setSelectedJob(job);
    setFormData({
      product_id: job.product_id,
      company_id: job.company_id,
      assigned_designer_id: job.assigned_designer_id || '',
      status: job.status,
      priority: job.priority,
      progress: job.progress,
      quantity: job.quantity,
      delivery_date: job.delivery_date.split('T')[0],
      description: job.description
    });

    // Load full product details for the job
    if (job.product_id) {
      try {
        const productResponse = await productsAPI.getById(job.product_id);
        if (productResponse.product) {
          setSelectedProduct(productResponse.product);
          setProductSearchTerm(productResponse.product.product_item_code || '');
        }
      } catch (error) {
        console.error('Error loading product details:', error);
        toast.error('Failed to load product details');
      }
    }

    // Load existing attachments
    try {
      const attachmentsResponse = await fetch(`/api/jobs/${job.id}/attachments`);
      if (attachmentsResponse.ok) {
        const attachmentsData = await attachmentsResponse.json();
        // Store attachments for display in the edit modal
        setSelectedJob(prev => ({
          ...prev,
          attachments: attachmentsData.attachments || []
        }));
      }
    } catch (error) {
      console.error('Error loading job attachments:', error);
    }

    setIsEditModalOpen(true);
  };

  const handleView = (job: Job) => {
    setSelectedJob(job);
    setIsViewModalOpen(true);
  };

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setFormData({ ...formData, product_id: product.id });
    setProductSearchTerm(product.product_item_code);
    setFilteredProducts([]);
  };

  const resetForm = () => {
    setFormData({
      product_id: '',
      company_id: '',
      assigned_designer_id: '',
      status: 'pending',
      priority: 'medium',
      progress: 0,
      quantity: 1,
      delivery_date: '',
      description: ''
    });
    setSelectedProduct(null);
    setProductSearchTerm('');
  };

  // Filter jobs based on user role
  const getFilteredJobs = () => {
    let filtered = jobs.filter(job => {
      const matchesSearch = 
        job.job_card_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (job.product_name && job.product_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (job.company_name && job.company_name.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = 
        filterStatus === 'all' || job.status === filterStatus;
      
      const matchesPriority = 
        filterPriority === 'all' || job.priority === filterPriority;
      
      return matchesSearch && matchesStatus && matchesPriority;
    });

    // Role-based filtering
    if (currentUser?.role === 'MERCHANDISER') {
      // Merchandisers can only see jobs they created
      filtered = filtered.filter(job => job.created_by === currentUser.id);
    } else if (currentUser?.role === 'DESIGNER') {
      // Designers can only see jobs assigned to them
      filtered = filtered.filter(job => job.assigned_designer_id === currentUser.id);
    }
    // HEAD_MERCHANDISER, HOD_PREPRESS, and ADMIN can see all jobs

    return filtered;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'on_hold': return 'bg-orange-100 text-orange-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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

  const JobForm = ({ isEdit = false }) => (
    <div className="space-y-4">
      {/* Product Selection */}
      <div>
        <Label htmlFor="product_search">Product *</Label>
        <div className="relative">
          <Input
            id="product_search"
            value={productSearchTerm}
            onChange={(e) => setProductSearchTerm(e.target.value)}
            placeholder="Search products by code, brand, or type..."
            required
          />
          {filteredProducts.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  onClick={() => handleProductSelect(product)}
                >
                  <div className="font-medium">{product.product_item_code}</div>
                  <div className="text-sm text-gray-600">{product.brand} - {product.type}</div>
                  <div className="text-xs text-gray-500">{product.material_name} - {product.gsm} g/m²</div>
                </div>
              ))}
            </div>
          )}
        </div>
        {selectedProduct && (
          <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
            <div className="text-sm font-medium text-green-800">Selected: {selectedProduct.product_item_code}</div>
            <div className="text-xs text-green-600">{selectedProduct.brand} - {selectedProduct.type}</div>
            {selectedProduct.material_name && (
              <div className="text-xs text-green-600">Material: {selectedProduct.material_name}</div>
            )}
            {selectedProduct.gsm && (
              <div className="text-xs text-green-600">GSM: {selectedProduct.gsm} g/m²</div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="company_id">Company *</Label>
          <Select value={formData.company_id} onValueChange={(value) => setFormData({ ...formData, company_id: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select company" />
            </SelectTrigger>
            <SelectContent>
              {companies.map((company) => (
                <SelectItem key={company.id} value={company.id}>
                  {company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="assigned_designer_id">Assign to Designer</Label>
          <Select value={formData.assigned_designer_id} onValueChange={(value) => setFormData({ ...formData, assigned_designer_id: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select designer (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="no-designer">No designer assigned</SelectItem>
              {designers.map((designer) => (
                <SelectItem key={designer.id} value={designer.id}>
                  {designer.first_name} {designer.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="status">Status</Label>
          <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="on_hold">On Hold</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="priority">Priority</Label>
          <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="quantity">Quantity</Label>
          <Input
            id="quantity"
            type="number"
            min="1"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="delivery_date">Delivery Date *</Label>
          <Input
            id="delivery_date"
            type="date"
            value={formData.delivery_date}
            onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="progress">Progress (%)</Label>
          <Input
            id="progress"
            type="number"
            min="0"
            max="100"
            value={formData.progress}
            onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) || 0 })}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Job description and requirements..."
          rows={3}
        />
      </div>

      {/* Existing Attachments */}
      {isEdit && selectedJob?.attachments && selectedJob.attachments.length > 0 && (
        <div>
          <Label className="text-sm font-medium text-gray-700">Existing Attachments</Label>
          <div className="mt-2 space-y-2">
            {selectedJob.attachments.map((attachment) => (
              <div key={attachment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileText className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">{attachment.fileName}</p>
                    <p className="text-xs text-gray-500">
                      {(attachment.fileSize / 1024).toFixed(1)} KB • {attachment.fileType}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`/api/upload/file/${attachment.id}`, '_blank')}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-2 pt-4">
        <Button variant="outline" onClick={() => {
          setIsCreateModalOpen(false);
          setIsEditModalOpen(false);
          resetForm();
        }}>
          Cancel
        </Button>
        <Button onClick={isEdit ? handleUpdate : handleCreate}>
          {isEdit ? 'Update' : 'Create'} Job
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <SmartSidebar 
        currentView={currentView}
        onNavigate={setCurrentView}
        userRole={currentUser?.role || "MERCHANDISER"}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      
      <div className={`p-6 transition-all duration-300 ${isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-70'}`}>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Jobs Management</h1>
              <p className="text-gray-600 mt-1">
                {currentUser?.role === 'MERCHANDISER' 
                  ? 'Manage your assigned jobs' 
                  : 'Manage all production jobs'
                }
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" onClick={loadData} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => {
                    resetForm();
                    setIsCreateModalOpen(true);
                  }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Job
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Job</DialogTitle>
                  </DialogHeader>
                  <JobForm />
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search jobs..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterPriority} onValueChange={setFilterPriority}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Jobs Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Factory className="w-5 h-5 mr-2" />
                Jobs ({getFilteredJobs().length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                  Loading jobs...
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Job ID</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>PO Number</TableHead>
                        <TableHead>Created By</TableHead>
                        <TableHead>Designer</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Progress</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getFilteredJobs().map((job) => {
                        const isWithoutPO = job.without_po === true || (job.without_po === undefined && (!job.po_number || job.po_number.trim() === ''));
                        return (
                        <TableRow 
                          key={job.id}
                          className={isWithoutPO ? 'bg-amber-50 hover:bg-amber-100' : ''}
                        >
                          <TableCell className="font-medium">{job.job_card_id}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{job.product_code}</div>
                              <div className="text-sm text-gray-500">{job.product_name}</div>
                            </div>
                          </TableCell>
                          <TableCell>{job.company_name || 'N/A'}</TableCell>
                          <TableCell>
                            {isWithoutPO ? (
                              <div className="flex items-center space-x-1">
                                <AlertCircle className="w-4 h-4 text-amber-600" />
                                <span className="text-amber-700 font-medium">No PO</span>
                                <Badge variant="outline" className="ml-2 border-amber-300 text-amber-700 bg-amber-50 text-xs">
                                  PO Pending
                                </Badge>
                              </div>
                            ) : (
                              <span className="text-gray-900">{job.po_number || 'N/A'}</span>
                            )}
                          </TableCell>
                          <TableCell>{job.created_by_name || 'System'}</TableCell>
                          <TableCell>{job.designer_name || 'Unassigned'}</TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <Badge className={getStatusColor(job.status)}>
                                {job.status.replace('_', ' ').toUpperCase()}
                              </Badge>
                              {(job.current_department || getDepartmentFromStatus(job.status)) && (
                                <Badge className="bg-purple-100 text-purple-800 text-xs w-fit">
                                  <Building2 className="w-3 h-3 mr-1 inline" />
                                  {job.current_department || getDepartmentFromStatus(job.status)}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getPriorityColor(job.priority)}>
                              {job.priority.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full" 
                                  style={{ width: `${job.progress}%` }}
                                />
                              </div>
                              <span className="text-sm">{job.progress}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span>{new Date(job.delivery_date).toLocaleDateString()}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleView(job)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(job)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(job.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Job</DialogTitle>
          </DialogHeader>
          <JobForm isEdit={true} />
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Job Details</DialogTitle>
          </DialogHeader>
          {selectedJob && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Job ID</Label>
                  <p className="text-lg font-semibold">{selectedJob.job_card_id}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Status</Label>
                  <div className="flex flex-col gap-2">
                    <Badge className={getStatusColor(selectedJob.status)}>
                      {selectedJob.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                    {selectedJob.current_department && (
                      <Badge className="bg-purple-100 text-purple-800 w-fit">
                        <Building2 className="w-3 h-3 mr-1 inline" />
                        Department: {selectedJob.current_department}
                      </Badge>
                    )}
                    {selectedJob.current_step && (
                      <Badge className="bg-blue-100 text-blue-800 w-fit">
                        Step: {selectedJob.current_step}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Product</Label>
                  <p className="font-medium">{selectedJob.product_code}</p>
                  <p className="text-sm text-gray-600">{selectedJob.product_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Company</Label>
                  <p>{selectedJob.company_name || 'N/A'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Assigned Designer</Label>
                  <p>{selectedJob.designer_name || 'Unassigned'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Priority</Label>
                  <Badge className={getPriorityColor(selectedJob.priority)}>
                    {selectedJob.priority.toUpperCase()}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Quantity</Label>
                  <p>{selectedJob.quantity}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Progress</Label>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${selectedJob.progress}%` }}
                      />
                    </div>
                    <span className="text-sm">{selectedJob.progress}%</span>
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Delivery Date</Label>
                <p>{new Date(selectedJob.delivery_date).toLocaleDateString()}</p>
              </div>
              {selectedJob.status_message && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Status Message</Label>
                  <p className="text-sm bg-blue-50 p-3 rounded italic">{selectedJob.status_message}</p>
                </div>
              )}
              {selectedJob.description && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Description</Label>
                  <p>{selectedJob.description}</p>
                </div>
              )}
              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Created</Label>
                  <p className="text-sm">{new Date(selectedJob.created_at).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <Label className="text-sm font-medium text-gray-500">Last Updated</Label>
                  <p className="text-sm">{new Date(selectedJob.updated_at).toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default JobsModule;
