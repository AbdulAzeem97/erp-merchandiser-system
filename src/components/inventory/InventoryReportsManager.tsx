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
} from 'lucide-react';
import { toast } from 'sonner';

// Types
interface ItemWiseReport {
  item_id: number;
  item_code: string;
  item_name: string;
  unit: string;
  department: string;
  master_category: string;
  control_category: string;
  location_name: string;
  opening_qty: number;
  in_qty: number;
  out_qty: number;
  balance_qty: number;
  unit_cost: number;
  total_value: number;
  last_txn_date: string;
}

interface CategoryWiseReport {
  department: string;
  master_category: string;
  control_category: string;
  total_items: number;
  total_opening: number;
  total_in: number;
  total_out: number;
  total_balance: number;
  total_value: number;
}

interface ReorderAlert {
  item_id: number;
  item_code: string;
  item_name: string;
  current_stock: number;
  reorder_level: number;
  stock_status: string;
}

interface ItemLedger {
  txn_date: string;
  txn_type: string;
  ref_no: string;
  qty: number;
  unit: string;
  department: string;
  job_card_no: string;
  remarks: string;
  unit_cost: number;
  total_value: number;
  created_by: string;
  created_at: string;
  location_name: string;
}

const InventoryReportsManager: React.FC = () => {
  const [itemWiseReport, setItemWiseReport] = useState<ItemWiseReport[]>([]);
  const [categoryWiseReport, setCategoryWiseReport] = useState<CategoryWiseReport[]>([]);
  const [reorderAlerts, setReorderAlerts] = useState<ReorderAlert[]>([]);
  const [itemLedger, setItemLedger] = useState<ItemLedger[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeReport, setActiveReport] = useState('item-wise');

  // Filters
  const [filters, setFilters] = useState({
    department: '',
    master_category: '',
    control_category: '',
    location_id: '',
    date_from: '',
    date_to: '',
    stock_status: '',
  });

  // Fetch item-wise report
  const fetchItemWiseReport = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.department) params.append('department', filters.department);
      if (filters.master_category) params.append('master_category', filters.master_category);
      if (filters.control_category) params.append('control_category', filters.control_category);
      if (filters.location_id) params.append('location_id', filters.location_id);

      const response = await fetch(`/api/inventory/reports/item-wise?${params}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (data.success) {
        setItemWiseReport(data.report);
      }
    } catch (error) {
      console.error('Error fetching item-wise report:', error);
      toast.error('Failed to load item-wise report');
    } finally {
      setLoading(false);
    }
  };

  // Fetch category-wise report
  const fetchCategoryWiseReport = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.department) params.append('department', filters.department);

      const response = await fetch(`/api/inventory/reports/category-wise?${params}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (data.success) {
        setCategoryWiseReport(data.report);
      }
    } catch (error) {
      console.error('Error fetching category-wise report:', error);
      toast.error('Failed to load category-wise report');
    } finally {
      setLoading(false);
    }
  };

  // Fetch reorder alerts
  const fetchReorderAlerts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.stock_status) params.append('stock_status', filters.stock_status);

      const response = await fetch(`/api/inventory/reports/reorder-alerts?${params}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (data.success) {
        setReorderAlerts(data.report);
      }
    } catch (error) {
      console.error('Error fetching reorder alerts:', error);
      toast.error('Failed to load reorder alerts');
    } finally {
      setLoading(false);
    }
  };

  // Fetch item ledger
  const fetchItemLedger = async (itemId: number) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.date_from) params.append('date_from', filters.date_from);
      if (filters.date_to) params.append('date_to', filters.date_to);

      const response = await fetch(`/api/inventory/reports/item-ledger/${itemId}?${params}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (data.success) {
        setItemLedger(data.report);
      }
    } catch (error) {
      console.error('Error fetching item ledger:', error);
      toast.error('Failed to load item ledger');
    } finally {
      setLoading(false);
    }
  };

  // Load report based on active report
  const loadReport = () => {
    switch (activeReport) {
      case 'item-wise':
        fetchItemWiseReport();
        break;
      case 'category-wise':
        fetchCategoryWiseReport();
        break;
      case 'reorder-alerts':
        fetchReorderAlerts();
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

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case 'REORDER_REQUIRED': return 'destructive';
      case 'LOW_STOCK': return 'secondary';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory Reports</h1>
          <p className="text-muted-foreground">
            Generate and analyze inventory reports and analytics
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
            Choose the type of inventory report you want to generate
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              variant={activeReport === 'item-wise' ? 'default' : 'outline'}
              onClick={() => setActiveReport('item-wise')}
              className="h-20 flex flex-col items-center justify-center"
            >
              <Package className="w-6 h-6 mb-2" />
              Item-wise Consolidated
            </Button>
            <Button
              variant={activeReport === 'category-wise' ? 'default' : 'outline'}
              onClick={() => setActiveReport('category-wise')}
              className="h-20 flex flex-col items-center justify-center"
            >
              <BarChart3 className="w-6 h-6 mb-2" />
              Category-wise Summary
            </Button>
            <Button
              variant={activeReport === 'reorder-alerts' ? 'default' : 'outline'}
              onClick={() => setActiveReport('reorder-alerts')}
              className="h-20 flex flex-col items-center justify-center"
            >
              <AlertTriangle className="w-6 h-6 mb-2" />
              Reorder Alerts
            </Button>
            <Button
              variant={activeReport === 'item-ledger' ? 'default' : 'outline'}
              onClick={() => setActiveReport('item-ledger')}
              className="h-20 flex flex-col items-center justify-center"
            >
              <FileText className="w-6 h-6 mb-2" />
              Item Ledger
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
              <Label htmlFor="department">Department</Label>
              <Select value={filters.department} onValueChange={(value) => setFilters({ ...filters, department: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Departments</SelectItem>
                  <SelectItem value="Printing">Printing</SelectItem>
                  <SelectItem value="Production">Production</SelectItem>
                  <SelectItem value="CTP">CTP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="master_category">Master Category</Label>
              <Select value={filters.master_category} onValueChange={(value) => setFilters({ ...filters, master_category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  <SelectItem value="Printing">Printing</SelectItem>
                  <SelectItem value="Packing Material">Packing Material</SelectItem>
                  <SelectItem value="CTP Materials">CTP Materials</SelectItem>
                  <SelectItem value="Raw Materials">Raw Materials</SelectItem>
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
                {activeReport === 'item-wise' && 'Item-wise Consolidated Report'}
                {activeReport === 'category-wise' && 'Category-wise Summary Report'}
                {activeReport === 'reorder-alerts' && 'Reorder Alerts Report'}
                {activeReport === 'item-ledger' && 'Item Ledger Report'}
              </CardTitle>
              <CardDescription>
                {activeReport === 'item-wise' && 'Detailed inventory status for all items'}
                {activeReport === 'category-wise' && 'Summary of inventory by categories'}
                {activeReport === 'reorder-alerts' && 'Items that need attention for restocking'}
                {activeReport === 'item-ledger' && 'Transaction history for specific items'}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (activeReport === 'item-wise') exportToCSV(itemWiseReport, 'item-wise-report');
                  if (activeReport === 'category-wise') exportToCSV(categoryWiseReport, 'category-wise-report');
                  if (activeReport === 'reorder-alerts') exportToCSV(reorderAlerts, 'reorder-alerts-report');
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
              {/* Item-wise Report */}
              {activeReport === 'item-wise' && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item Code</TableHead>
                      <TableHead>Item Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Opening</TableHead>
                      <TableHead>In</TableHead>
                      <TableHead>Out</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Unit Cost</TableHead>
                      <TableHead>Total Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {itemWiseReport.map((item) => (
                      <TableRow key={item.item_id}>
                        <TableCell className="font-mono">{item.item_code}</TableCell>
                        <TableCell className="font-medium">{item.item_name}</TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm">{item.master_category}</p>
                            <p className="text-xs text-muted-foreground">{item.control_category}</p>
                          </div>
                        </TableCell>
                        <TableCell>{item.location_name}</TableCell>
                        <TableCell>{item.opening_qty}</TableCell>
                        <TableCell className="text-green-600">{item.in_qty}</TableCell>
                        <TableCell className="text-red-600">{item.out_qty}</TableCell>
                        <TableCell className="font-medium">{item.balance_qty}</TableCell>
                        <TableCell>${item.unit_cost.toFixed(2)}</TableCell>
                        <TableCell className="font-medium">${item.total_value.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {/* Category-wise Report */}
              {activeReport === 'category-wise' && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Department</TableHead>
                      <TableHead>Master Category</TableHead>
                      <TableHead>Control Category</TableHead>
                      <TableHead>Total Items</TableHead>
                      <TableHead>Total Opening</TableHead>
                      <TableHead>Total In</TableHead>
                      <TableHead>Total Out</TableHead>
                      <TableHead>Total Balance</TableHead>
                      <TableHead>Total Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categoryWiseReport.map((category, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{category.department}</TableCell>
                        <TableCell>{category.master_category}</TableCell>
                        <TableCell>{category.control_category}</TableCell>
                        <TableCell>{category.total_items}</TableCell>
                        <TableCell>{category.total_opening}</TableCell>
                        <TableCell className="text-green-600">{category.total_in}</TableCell>
                        <TableCell className="text-red-600">{category.total_out}</TableCell>
                        <TableCell className="font-medium">{category.total_balance}</TableCell>
                        <TableCell className="font-medium">${category.total_value.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {/* Reorder Alerts Report */}
              {activeReport === 'reorder-alerts' && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item Code</TableHead>
                      <TableHead>Item Name</TableHead>
                      <TableHead>Current Stock</TableHead>
                      <TableHead>Reorder Level</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reorderAlerts.map((alert) => (
                      <TableRow key={alert.item_id}>
                        <TableCell className="font-mono">{alert.item_code}</TableCell>
                        <TableCell className="font-medium">{alert.item_name}</TableCell>
                        <TableCell className="font-medium">{alert.current_stock}</TableCell>
                        <TableCell>{alert.reorder_level}</TableCell>
                        <TableCell>
                          <Badge variant={getStockStatusColor(alert.stock_status)}>
                            {alert.stock_status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline">
                            Create PO
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {/* Item Ledger Report */}
              {activeReport === 'item-ledger' && (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Select an item to view its transaction ledger</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Use the item-wise report to find item IDs, then select an item to view its detailed transaction history
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InventoryReportsManager;
