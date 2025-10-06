import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Download,
  RefreshCw,
  BarChart3,
  FileText,
  TrendingUp,
  TrendingDown,
  Package,
  AlertTriangle,
  Calendar,
  Filter,
  Eye,
  Printer,
  Mail,
  Building2,
  DollarSign,
  Users,
  ShoppingCart,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';

// Types
interface SupplierPerformanceReport {
  supplier_id: number;
  supplier_name: string;
  total_orders: number;
  total_value: number;
  average_delivery_time: number;
  on_time_delivery_rate: number;
  quality_rating: number;
  last_order_date: string;
  status: string;
}

interface PurchaseOrderReport {
  po_id: number;
  po_number: string;
  supplier_name: string;
  po_date: string;
  expected_delivery_date: string;
  actual_delivery_date: string;
  status: string;
  total_amount: number;
  currency: string;
  items_count: number;
  received_items: number;
  pending_items: number;
  created_by: string;
}

interface RequisitionReport {
  req_id: number;
  req_number: string;
  department: string;
  requested_by: string;
  request_date: string;
  status: string;
  total_amount: number;
  items_count: number;
  approved_by: string;
  approved_date: string;
  po_created: boolean;
  po_number: string;
}

interface CostAnalysisReport {
  category: string;
  total_requisitions: number;
  total_orders: number;
  total_value: number;
  average_order_value: number;
  top_supplier: string;
  top_supplier_value: number;
  cost_trend: string;
}

const ProcurementReportsManager: React.FC = () => {
  const [supplierPerformance, setSupplierPerformance] = useState<SupplierPerformanceReport[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderReport[]>([]);
  const [requisitions, setRequisitions] = useState<RequisitionReport[]>([]);
  const [costAnalysis, setCostAnalysis] = useState<CostAnalysisReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeReport, setActiveReport] = useState('supplier-performance');

  // Filters
  const [filters, setFilters] = useState({
    supplier_id: '',
    department: '',
    status: '',
    date_from: '',
    date_to: '',
    category: '',
  });

  // Fetch supplier performance report
  const fetchSupplierPerformance = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.supplier_id) params.append('supplier_id', filters.supplier_id);
      if (filters.date_from) params.append('date_from', filters.date_from);
      if (filters.date_to) params.append('date_to', filters.date_to);

      const response = await fetch(`/api/procurement/reports/supplier-performance?${params}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (data.success) {
        setSupplierPerformance(data.report);
      }
    } catch (error) {
      console.error('Error fetching supplier performance report:', error);
      toast.error('Failed to load supplier performance report');
    } finally {
      setLoading(false);
    }
  };

  // Fetch purchase order report
  const fetchPurchaseOrderReport = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.supplier_id) params.append('supplier_id', filters.supplier_id);
      if (filters.status) params.append('status', filters.status);
      if (filters.date_from) params.append('date_from', filters.date_from);
      if (filters.date_to) params.append('date_to', filters.date_to);

      const response = await fetch(`/api/procurement/reports/purchase-orders?${params}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (data.success) {
        setPurchaseOrders(data.report);
      }
    } catch (error) {
      console.error('Error fetching purchase order report:', error);
      toast.error('Failed to load purchase order report');
    } finally {
      setLoading(false);
    }
  };

  // Fetch requisition report
  const fetchRequisitionReport = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.department) params.append('department', filters.department);
      if (filters.status) params.append('status', filters.status);
      if (filters.date_from) params.append('date_from', filters.date_from);
      if (filters.date_to) params.append('date_to', filters.date_to);

      const response = await fetch(`/api/procurement/reports/requisitions?${params}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (data.success) {
        setRequisitions(data.report);
      }
    } catch (error) {
      console.error('Error fetching requisition report:', error);
      toast.error('Failed to load requisition report');
    } finally {
      setLoading(false);
    }
  };

  // Fetch cost analysis report
  const fetchCostAnalysis = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.category) params.append('category', filters.category);
      if (filters.date_from) params.append('date_from', filters.date_from);
      if (filters.date_to) params.append('date_to', filters.date_to);

      const response = await fetch(`/api/procurement/reports/cost-analysis?${params}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (data.success) {
        setCostAnalysis(data.report);
      }
    } catch (error) {
      console.error('Error fetching cost analysis report:', error);
      toast.error('Failed to load cost analysis report');
    } finally {
      setLoading(false);
    }
  };

  // Load report based on active report
  const loadReport = () => {
    switch (activeReport) {
      case 'supplier-performance':
        fetchSupplierPerformance();
        break;
      case 'purchase-orders':
        fetchPurchaseOrderReport();
        break;
      case 'requisitions':
        fetchRequisitionReport();
        break;
      case 'cost-analysis':
        fetchCostAnalysis();
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    loadReport();
  }, [activeReport, filters]);

  // Export to CSV
  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Report exported successfully');
  };

  // Export to PDF (placeholder)
  const exportToPDF = (reportType: string) => {
    toast.info('PDF export feature coming soon');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'default';
      case 'PENDING': return 'secondary';
      case 'REJECTED': return 'destructive';
      case 'DRAFT': return 'secondary';
      case 'SENT': return 'default';
      case 'RECEIVED': return 'default';
      case 'CANCELLED': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED': return <CheckCircle className="w-4 h-4" />;
      case 'PENDING': return <Clock className="w-4 h-4" />;
      case 'REJECTED': return <XCircle className="w-4 h-4" />;
      case 'DRAFT': return <FileText className="w-4 h-4" />;
      case 'SENT': return <Mail className="w-4 h-4" />;
      case 'RECEIVED': return <Package className="w-4 h-4" />;
      case 'CANCELLED': return <XCircle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Procurement Reports</h1>
          <p className="text-muted-foreground">
            Generate and analyze procurement reports and analytics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={loadReport} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Report Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Report Type</CardTitle>
          <CardDescription>
            Choose the type of procurement report you want to generate
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              variant={activeReport === 'supplier-performance' ? 'default' : 'outline'}
              onClick={() => setActiveReport('supplier-performance')}
              className="h-20 flex flex-col items-center justify-center"
            >
              <Building2 className="w-6 h-6 mb-2" />
              Supplier Performance
            </Button>
            <Button
              variant={activeReport === 'purchase-orders' ? 'default' : 'outline'}
              onClick={() => setActiveReport('purchase-orders')}
              className="h-20 flex flex-col items-center justify-center"
            >
              <ShoppingCart className="w-6 h-6 mb-2" />
              Purchase Orders
            </Button>
            <Button
              variant={activeReport === 'requisitions' ? 'default' : 'outline'}
              onClick={() => setActiveReport('requisitions')}
              className="h-20 flex flex-col items-center justify-center"
            >
              <FileText className="w-6 h-6 mb-2" />
              Requisitions
            </Button>
            <Button
              variant={activeReport === 'cost-analysis' ? 'default' : 'outline'}
              onClick={() => setActiveReport('cost-analysis')}
              className="h-20 flex flex-col items-center justify-center"
            >
              <BarChart3 className="w-6 h-6 mb-2" />
              Cost Analysis
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="supplier_id">Supplier</Label>
              <Select value={filters.supplier_id} onValueChange={(value) => setFilters({ ...filters, supplier_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All Suppliers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Suppliers</SelectItem>
                  <SelectItem value="1">Supplier 1</SelectItem>
                  <SelectItem value="2">Supplier 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select value={filters.department} onValueChange={(value) => setFilters({ ...filters, department: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Departments</SelectItem>
                  <SelectItem value="Production">Production</SelectItem>
                  <SelectItem value="Printing">Printing</SelectItem>
                  <SelectItem value="CTP">CTP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date_from">From Date</Label>
              <Input
                type="date"
                value={filters.date_from}
                onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date_to">To Date</Label>
              <Input
                type="date"
                value={filters.date_to}
                onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                {activeReport === 'supplier-performance' && 'Supplier Performance Report'}
                {activeReport === 'purchase-orders' && 'Purchase Order Report'}
                {activeReport === 'requisitions' && 'Requisition Report'}
                {activeReport === 'cost-analysis' && 'Cost Analysis Report'}
              </CardTitle>
              <CardDescription>
                {activeReport === 'supplier-performance' && 'Performance metrics and analytics for suppliers'}
                {activeReport === 'purchase-orders' && 'Detailed analysis of purchase orders and deliveries'}
                {activeReport === 'requisitions' && 'Requisition tracking and approval status'}
                {activeReport === 'cost-analysis' && 'Cost breakdown and spending analysis by category'}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (activeReport === 'supplier-performance') exportToCSV(supplierPerformance, 'supplier-performance-report');
                  if (activeReport === 'purchase-orders') exportToCSV(purchaseOrders, 'purchase-orders-report');
                  if (activeReport === 'requisitions') exportToCSV(requisitions, 'requisitions-report');
                  if (activeReport === 'cost-analysis') exportToCSV(costAnalysis, 'cost-analysis-report');
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportToPDF(activeReport)}
              >
                <Printer className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <RefreshCw className="w-8 h-8 animate-spin" />
            </div>
          ) : (
            <div className="rounded-md border">
              {/* Supplier Performance Report */}
              {activeReport === 'supplier-performance' && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Total Orders</TableHead>
                      <TableHead>Total Value</TableHead>
                      <TableHead>Avg Delivery Time</TableHead>
                      <TableHead>On-Time Rate</TableHead>
                      <TableHead>Quality Rating</TableHead>
                      <TableHead>Last Order</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {supplierPerformance.map((supplier) => (
                      <TableRow key={supplier.supplier_id}>
                        <TableCell className="font-medium">{supplier.supplier_name}</TableCell>
                        <TableCell>{supplier.total_orders}</TableCell>
                        <TableCell className="font-medium">${supplier.total_value.toLocaleString()}</TableCell>
                        <TableCell>{supplier.average_delivery_time} days</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {supplier.on_time_delivery_rate >= 90 ? (
                              <TrendingUp className="w-4 h-4 text-green-500" />
                            ) : (
                              <TrendingDown className="w-4 h-4 text-red-500" />
                            )}
                            {supplier.on_time_delivery_rate}%
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }, (_, i) => (
                              <div
                                key={i}
                                className={`w-3 h-3 rounded-full ${
                                  i < supplier.quality_rating ? 'bg-yellow-400' : 'bg-gray-200'
                                }`}
                              />
                            ))}
                            <span className="ml-1">({supplier.quality_rating})</span>
                          </div>
                        </TableCell>
                        <TableCell>{new Date(supplier.last_order_date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(supplier.status)}>
                            {getStatusIcon(supplier.status)}
                            <span className="ml-1">{supplier.status}</span>
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {/* Purchase Order Report */}
              {activeReport === 'purchase-orders' && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>PO Number</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>PO Date</TableHead>
                      <TableHead>Expected Delivery</TableHead>
                      <TableHead>Actual Delivery</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Total Amount</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Received</TableHead>
                      <TableHead>Pending</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchaseOrders.map((po) => (
                      <TableRow key={po.po_id}>
                        <TableCell className="font-mono font-medium">{po.po_number}</TableCell>
                        <TableCell>{po.supplier_name}</TableCell>
                        <TableCell>{new Date(po.po_date).toLocaleDateString()}</TableCell>
                        <TableCell>{new Date(po.expected_delivery_date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {po.actual_delivery_date ? new Date(po.actual_delivery_date).toLocaleDateString() : 'Pending'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(po.status)}>
                            {getStatusIcon(po.status)}
                            <span className="ml-1">{po.status}</span>
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">${po.total_amount.toLocaleString()} {po.currency}</TableCell>
                        <TableCell>{po.items_count}</TableCell>
                        <TableCell className="text-green-600">{po.received_items}</TableCell>
                        <TableCell className="text-orange-600">{po.pending_items}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {/* Requisition Report */}
              {activeReport === 'requisitions' && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Req Number</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Requested By</TableHead>
                      <TableHead>Request Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Total Amount</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Approved By</TableHead>
                      <TableHead>PO Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requisitions.map((req) => (
                      <TableRow key={req.req_id}>
                        <TableCell className="font-mono font-medium">{req.req_number}</TableCell>
                        <TableCell>{req.department}</TableCell>
                        <TableCell>{req.requested_by}</TableCell>
                        <TableCell>{new Date(req.request_date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(req.status)}>
                            {getStatusIcon(req.status)}
                            <span className="ml-1">{req.status}</span>
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">${req.total_amount.toLocaleString()}</TableCell>
                        <TableCell>{req.items_count}</TableCell>
                        <TableCell>{req.approved_by || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant={req.po_created ? 'default' : 'secondary'}>
                            {req.po_created ? (
                              <>
                                <CheckCircle className="w-3 h-3 mr-1" />
                                {req.po_number}
                              </>
                            ) : (
                              <>
                                <Clock className="w-3 h-3 mr-1" />
                                Pending
                              </>
                            )}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {/* Cost Analysis Report */}
              {activeReport === 'cost-analysis' && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead>Total Requisitions</TableHead>
                      <TableHead>Total Orders</TableHead>
                      <TableHead>Total Value</TableHead>
                      <TableHead>Avg Order Value</TableHead>
                      <TableHead>Top Supplier</TableHead>
                      <TableHead>Top Supplier Value</TableHead>
                      <TableHead>Cost Trend</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {costAnalysis.map((category, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{category.category}</TableCell>
                        <TableCell>{category.total_requisitions}</TableCell>
                        <TableCell>{category.total_orders}</TableCell>
                        <TableCell className="font-medium">${category.total_value.toLocaleString()}</TableCell>
                        <TableCell>${category.average_order_value.toLocaleString()}</TableCell>
                        <TableCell>{category.top_supplier}</TableCell>
                        <TableCell>${category.top_supplier_value.toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {category.cost_trend === 'increasing' ? (
                              <TrendingUp className="w-4 h-4 text-red-500" />
                            ) : category.cost_trend === 'decreasing' ? (
                              <TrendingDown className="w-4 h-4 text-green-500" />
                            ) : (
                              <div className="w-4 h-4 bg-gray-400 rounded-full" />
                            )}
                            <span className="capitalize">{category.cost_trend}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProcurementReportsManager;
