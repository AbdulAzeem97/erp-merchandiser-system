import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { MainLayout } from '../layout/MainLayout';
import { authAPI } from '@/services/api';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  ShoppingCart,
  Users,
  FileText,
  Package,
  Plus,
  Search,
  Filter,
  Download,
  RefreshCw,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  CheckCircle,
  Clock,
  XCircle,
  Truck,
  DollarSign,
  Activity,
  Building2,
  ClipboardList,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

// Types
interface ProcurementStats {
  total_suppliers: number;
  pending_requisitions: number;
  active_pos: number;
  pending_grns: number;
  total_purchase_value: number;
  top_suppliers: Array<{
    supplier_name: string;
    supplier_code: string;
    po_count: number;
    total_value: number;
  }>;
}

interface Supplier {
  supplier_id: number;
  supplier_code: string;
  supplier_name: string;
  contact_person: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  country: string;
  payment_terms: string;
  credit_limit: number;
  currency: string;
  is_active: boolean;
}

interface PurchaseRequisition {
  requisition_id: number;
  requisition_number: string;
  requested_by: string;
  department: string;
  requisition_date: string;
  required_date: string;
  priority: string;
  status: string;
  total_estimated_cost: number;
  item_count: number;
}

interface PurchaseOrder {
  po_id: number;
  po_number: string;
  supplier_name: string;
  supplier_code: string;
  po_date: string;
  expected_delivery_date: string;
  status: string;
  total_amount: number;
  item_count: number;
}

const ProcurementDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<ProcurementStats | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [requisitions, setRequisitions] = useState<PurchaseRequisition[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState('procurement-dashboard');

  // Handle navigation
  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    const routeMap: Record<string, string> = {
      'procurement-dashboard': '/procurement/dashboard',
      'procurement-suppliers': '/procurement/suppliers',
      'procurement-purchase-orders': '/procurement/purchase-orders',
      'procurement-reports': '/procurement/reports',
      'inventory-dashboard': '/inventory/dashboard',
      'inventory-items': '/inventory/items',
      'inventory-transactions': '/inventory/transactions',
      'inventory-categories': '/inventory/categories',
      'inventory-reports': '/inventory/reports',
    };
    if (routeMap[page]) {
      navigate(routeMap[page]);
    }
  };

  // Handle logout
  const handleLogout = () => {
    authAPI.logout();
    navigate('/');
  };

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch stats
      const statsResponse = await fetch('/api/procurement/dashboard/stats', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const statsData = await statsResponse.json();
      if (statsData.success) {
        setStats(statsData.stats);
      }

      // Fetch suppliers
      const suppliersResponse = await fetch('/api/procurement/suppliers', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const suppliersData = await suppliersResponse.json();
      if (suppliersData.success) {
        setSuppliers(suppliersData.suppliers);
      }

      // Fetch requisitions
      const requisitionsResponse = await fetch('/api/procurement/requisitions', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const requisitionsData = await requisitionsResponse.json();
      if (requisitionsData.success) {
        setRequisitions(requisitionsData.requisitions);
      }

      // Fetch purchase orders
      const posResponse = await fetch('/api/procurement/purchase-orders', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const posData = await posResponse.json();
      if (posData.success) {
        setPurchaseOrders(posData.purchase_orders);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = supplier.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.supplier_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.contact_person.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && supplier.is_active) ||
                         (filterStatus === 'inactive' && !supplier.is_active);
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'secondary';
      case 'SUBMITTED': return 'default';
      case 'APPROVED': return 'default';
      case 'SENT': return 'default';
      case 'ACKNOWLEDGED': return 'default';
      case 'PARTIALLY_RECEIVED': return 'secondary';
      case 'RECEIVED': return 'default';
      case 'CANCELLED': return 'destructive';
      case 'REJECTED': return 'destructive';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DRAFT': return <FileText className="w-4 h-4" />;
      case 'SUBMITTED': return <Clock className="w-4 h-4" />;
      case 'APPROVED': return <CheckCircle className="w-4 h-4" />;
      case 'SENT': return <Truck className="w-4 h-4" />;
      case 'ACKNOWLEDGED': return <CheckCircle className="w-4 h-4" />;
      case 'PARTIALLY_RECEIVED': return <Package className="w-4 h-4" />;
      case 'RECEIVED': return <CheckCircle className="w-4 h-4" />;
      case 'CANCELLED': return <XCircle className="w-4 h-4" />;
      case 'REJECTED': return <XCircle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'secondary';
      case 'NORMAL': return 'default';
      case 'HIGH': return 'default';
      case 'URGENT': return 'destructive';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <MainLayout
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      >
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout
      currentPage={currentPage}
      onNavigate={handleNavigate}
      onLogout={handleLogout}
    >
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Procurement Management</h1>
          <p className="text-muted-foreground">
            Manage suppliers, purchase orders, and procurement processes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={fetchDashboardData} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Requisition
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Suppliers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_suppliers}</div>
              <p className="text-xs text-muted-foreground">
                Active suppliers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Requisitions</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.pending_requisitions}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting approval
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active POs</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active_pos}</div>
              <p className="text-xs text-muted-foreground">
                In progress
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending GRNs</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.pending_grns}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting receipt
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Purchase Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.total_purchase_value.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Last 30 days
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
          <TabsTrigger value="requisitions">Requisitions</TabsTrigger>
          <TabsTrigger value="purchase-orders">Purchase Orders</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Top Suppliers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Top Suppliers by Value
                </CardTitle>
                <CardDescription>
                  Highest value suppliers (last 30 days)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats?.top_suppliers.slice(0, 5).map((supplier, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{supplier.supplier_name}</p>
                        <p className="text-xs text-muted-foreground">{supplier.supplier_code}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">${supplier.total_value.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{supplier.po_count} POs</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Latest procurement activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {requisitions.slice(0, 5).map((req) => (
                    <div key={req.requisition_id} className="flex items-center justify-between p-2 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <div>
                          <p className="text-sm font-medium">{req.requisition_number}</p>
                          <p className="text-xs text-muted-foreground">{req.department}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={getStatusColor(req.status)}>
                          {getStatusIcon(req.status)}
                          <span className="ml-1">{req.status}</span>
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          ${req.total_estimated_cost.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Suppliers Tab */}
        <TabsContent value="suppliers" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Suppliers</CardTitle>
              <CardDescription>
                Manage your supplier relationships
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search suppliers..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline">
                  <Filter className="w-4 h-4 mr-2" />
                  More Filters
                </Button>
              </div>

              {/* Suppliers Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Supplier Code</TableHead>
                      <TableHead>Supplier Name</TableHead>
                      <TableHead>Contact Person</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Payment Terms</TableHead>
                      <TableHead>Credit Limit</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[70px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSuppliers.map((supplier) => (
                      <TableRow key={supplier.supplier_id}>
                        <TableCell className="font-mono">{supplier.supplier_code}</TableCell>
                        <TableCell className="font-medium">{supplier.supplier_name}</TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm">{supplier.contact_person}</p>
                            <p className="text-xs text-muted-foreground">{supplier.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm">{supplier.city}, {supplier.state}</p>
                            <p className="text-xs text-muted-foreground">{supplier.country}</p>
                          </div>
                        </TableCell>
                        <TableCell>{supplier.payment_terms}</TableCell>
                        <TableCell>${supplier.credit_limit.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={supplier.is_active ? 'default' : 'secondary'}>
                            {supplier.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Supplier
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <ShoppingCart className="mr-2 h-4 w-4" />
                                Create PO
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Requisitions Tab */}
        <TabsContent value="requisitions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Purchase Requisitions</CardTitle>
              <CardDescription>
                Manage purchase requisitions and approvals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Requisition #</TableHead>
                      <TableHead>Requested By</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[70px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requisitions.map((req) => (
                      <TableRow key={req.requisition_id}>
                        <TableCell className="font-mono">{req.requisition_number}</TableCell>
                        <TableCell>{req.requested_by}</TableCell>
                        <TableCell>{req.department}</TableCell>
                        <TableCell>{new Date(req.requisition_date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant={getPriorityColor(req.priority)}>
                            {req.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>{req.item_count}</TableCell>
                        <TableCell>${req.total_estimated_cost.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(req.status)}>
                            {getStatusIcon(req.status)}
                            <span className="ml-1">{req.status}</span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <ShoppingCart className="mr-2 h-4 w-4" />
                                Create PO
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
                                <XCircle className="mr-2 h-4 w-4" />
                                Reject
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Purchase Orders Tab */}
        <TabsContent value="purchase-orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Purchase Orders</CardTitle>
              <CardDescription>
                Track and manage purchase orders
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>PO Number</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>PO Date</TableHead>
                      <TableHead>Expected Delivery</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[70px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchaseOrders.map((po) => (
                      <TableRow key={po.po_id}>
                        <TableCell className="font-mono">{po.po_number}</TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium">{po.supplier_name}</p>
                            <p className="text-xs text-muted-foreground">{po.supplier_code}</p>
                          </div>
                        </TableCell>
                        <TableCell>{new Date(po.po_date).toLocaleDateString()}</TableCell>
                        <TableCell>{new Date(po.expected_delivery_date).toLocaleDateString()}</TableCell>
                        <TableCell>{po.item_count}</TableCell>
                        <TableCell>${po.total_amount.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(po.status)}>
                            {getStatusIcon(po.status)}
                            <span className="ml-1">{po.status.replace('_', ' ')}</span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit PO
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Package className="mr-2 h-4 w-4" />
                                Create GRN
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <Download className="mr-2 h-4 w-4" />
                                Download PDF
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Quick Reports</CardTitle>
                <CardDescription>
                  Generate and download procurement reports
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start" variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Supplier Performance Report
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Purchase Order Summary
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Requisition Analysis
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Cost Analysis Report
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Custom Reports</CardTitle>
                <CardDescription>
                  Create custom procurement reports
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="report-type">Report Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select report type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="supplier-analysis">Supplier Analysis</SelectItem>
                      <SelectItem value="purchase-trends">Purchase Trends</SelectItem>
                      <SelectItem value="cost-breakdown">Cost Breakdown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date-range">Date Range</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select date range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="last-7-days">Last 7 Days</SelectItem>
                      <SelectItem value="last-30-days">Last 30 Days</SelectItem>
                      <SelectItem value="last-3-months">Last 3 Months</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Generate Report
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
    </MainLayout>
  );
};

export default ProcurementDashboard;
