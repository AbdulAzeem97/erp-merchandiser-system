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
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  Download,
  RefreshCw,
  BarChart3,
  ShoppingCart,
  Warehouse,
  ClipboardList,
  Users,
  DollarSign,
  Activity,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
} from 'lucide-react';
import { MainLayout } from '../layout/MainLayout';
import { authAPI } from '@/services/api';
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
interface InventoryStats {
  total_items: number;
  total_value: number;
  low_stock_count: number;
  recent_transactions: number;
  top_categories: Array<{
    department: string;
    master_category: string;
    control_category: string;
    category_value: number;
  }>;
}

interface InventoryItem {
  item_id: number;
  item_code: string;
  item_name: string;
  unit: string;
  department: string;
  master_category: string;
  control_category: string;
  location_name: string;
  balance_qty: number;
  total_value: number;
  reorder_level: number;
  stock_status: 'OK' | 'LOW_STOCK' | 'REORDER_REQUIRED';
}

interface RecentTransaction {
  txn_id: number;
  item_code: string;
  item_name: string;
  txn_type: string;
  qty: number;
  unit: string;
  ref_no: string;
  department: string;
  txn_date: string;
  created_by: string;
}

interface ReorderAlert {
  item_id: number;
  item_code: string;
  item_name: string;
  current_stock: number;
  reorder_level: number;
  stock_status: string;
}

const InventoryDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  const [reorderAlerts, setReorderAlerts] = useState<ReorderAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterLocation, setFilterLocation] = useState('all');
  const [currentPage, setCurrentPage] = useState('inventory-dashboard');

  // Handle navigation
  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    // Map page names to routes
    const routeMap: Record<string, string> = {
      'inventory-dashboard': '/inventory/dashboard',
      'inventory-items': '/inventory/items',
      'inventory-transactions': '/inventory/transactions',
      'inventory-categories': '/inventory/categories',
      'inventory-reports': '/inventory/reports',
      'procurement-dashboard': '/procurement/dashboard',
      'procurement-suppliers': '/procurement/suppliers',
      'procurement-purchase-orders': '/procurement/purchase-orders',
      'procurement-reports': '/procurement/reports',
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
      const statsResponse = await fetch('/api/inventory/dashboard/stats', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const statsData = await statsResponse.json();
      if (statsData.success) {
        setStats(statsData.stats);
      }

      // Fetch items
      const itemsResponse = await fetch('/api/inventory/items', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const itemsData = await itemsResponse.json();
      if (itemsData.success) {
        setItems(itemsData.items);
      }

      // Fetch recent transactions
      const txnResponse = await fetch('/api/inventory/transactions?limit=10', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const txnData = await txnResponse.json();
      if (txnData.success) {
        setRecentTransactions(txnData.transactions);
      }

      // Fetch reorder alerts
      const alertsResponse = await fetch('/api/inventory/reports/reorder-alerts', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const alertsData = await alertsResponse.json();
      if (alertsData.success) {
        setReorderAlerts(alertsData.report);
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

  const filteredItems = items.filter(item => {
    const matchesSearch = item.item_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.item_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || item.master_category === filterCategory;
    const matchesLocation = filterLocation === 'all' || item.location_name === filterLocation;
    return matchesSearch && matchesCategory && matchesLocation;
  });

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case 'REORDER_REQUIRED': return 'destructive';
      case 'LOW_STOCK': return 'secondary';
      default: return 'default';
    }
  };

  const getStockStatusIcon = (status: string) => {
    switch (status) {
      case 'REORDER_REQUIRED': return <AlertTriangle className="w-4 h-4" />;
      case 'LOW_STOCK': return <TrendingDown className="w-4 h-4" />;
      default: return <TrendingUp className="w-4 h-4" />;
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
          <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
          <p className="text-muted-foreground">
            Monitor and manage your inventory across all locations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={fetchDashboardData} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_items}</div>
              <p className="text-xs text-muted-foreground">
                Active inventory items
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.total_value.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Current inventory value
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.low_stock_count}</div>
              <p className="text-xs text-muted-foreground">
                Items requiring attention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.recent_transactions}</div>
              <p className="text-xs text-muted-foreground">
                Transactions (last 7 days)
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="items">Items</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Top Categories */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Top Categories by Value
                </CardTitle>
                <CardDescription>
                  Highest value inventory categories
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats?.top_categories.slice(0, 5).map((category, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{category.master_category}</p>
                        <p className="text-xs text-muted-foreground">{category.control_category}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">${category.category_value.toLocaleString()}</p>
                        <Progress 
                          value={(category.category_value / (stats?.top_categories[0]?.category_value || 1)) * 100} 
                          className="w-20 h-2 mt-1"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Transactions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="w-5 h-5" />
                  Recent Transactions
                </CardTitle>
                <CardDescription>
                  Latest inventory movements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentTransactions.slice(0, 5).map((txn) => (
                    <div key={txn.txn_id} className="flex items-center justify-between p-2 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          txn.txn_type === 'IN' ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                        <div>
                          <p className="text-sm font-medium">{txn.item_name}</p>
                          <p className="text-xs text-muted-foreground">{txn.ref_no}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {txn.txn_type === 'IN' ? '+' : '-'}{txn.qty} {txn.unit}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(txn.txn_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Items Tab */}
        <TabsContent value="items" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Inventory Items</CardTitle>
              <CardDescription>
                Manage and monitor all inventory items
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search items..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="Printing">Printing</SelectItem>
                    <SelectItem value="Packing Material">Packing Material</SelectItem>
                    <SelectItem value="CTP Materials">CTP Materials</SelectItem>
                    <SelectItem value="Raw Materials">Raw Materials</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterLocation} onValueChange={setFilterLocation}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    <SelectItem value="Main Store">Main Store</SelectItem>
                    <SelectItem value="CTP Room">CTP Room</SelectItem>
                    <SelectItem value="Production Floor">Production Floor</SelectItem>
                    <SelectItem value="Quality Control">Quality Control</SelectItem>
                    <SelectItem value="Finished Goods">Finished Goods</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline">
                  <Filter className="w-4 h-4 mr-2" />
                  More Filters
                </Button>
              </div>

              {/* Items Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item Code</TableHead>
                      <TableHead>Item Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[70px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map((item) => (
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
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium">{item.balance_qty} {item.unit}</p>
                            <p className="text-xs text-muted-foreground">
                              Reorder: {item.reorder_level}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>${item.total_value.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={getStockStatusColor(item.stock_status)}>
                            {getStockStatusIcon(item.stock_status)}
                            <span className="ml-1">{item.stock_status.replace('_', ' ')}</span>
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
                                Edit Item
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Activity className="mr-2 h-4 w-4" />
                                View History
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

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>
                All inventory movements and transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>User</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentTransactions.map((txn) => (
                      <TableRow key={txn.txn_id}>
                        <TableCell>{new Date(txn.txn_date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant={txn.txn_type === 'IN' ? 'default' : 'secondary'}>
                            {txn.txn_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium">{txn.item_name}</p>
                            <p className="text-xs text-muted-foreground">{txn.item_code}</p>
                          </div>
                        </TableCell>
                        <TableCell>{txn.qty} {txn.unit}</TableCell>
                        <TableCell className="font-mono">{txn.ref_no}</TableCell>
                        <TableCell>{txn.department}</TableCell>
                        <TableCell>{txn.created_by}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                Reorder Alerts
              </CardTitle>
              <CardDescription>
                Items that need attention for restocking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reorderAlerts.map((alert) => (
                  <motion.div
                    key={alert.item_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-4 rounded-lg border border-orange-200 bg-orange-50"
                  >
                    <div className="flex items-center gap-4">
                      <AlertTriangle className="w-5 h-5 text-orange-500" />
                      <div>
                        <p className="font-medium">{alert.item_name}</p>
                        <p className="text-sm text-muted-foreground">{alert.item_code}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        Current: {alert.current_stock} | Reorder: {alert.reorder_level}
                      </p>
                      <Badge variant="destructive">{alert.stock_status.replace('_', ' ')}</Badge>
                    </div>
                    <Button size="sm" variant="outline">
                      Create PO
                    </Button>
                  </motion.div>
                ))}
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
                  Generate and download inventory reports
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start" variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Item-wise Consolidated Report
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Category-wise Summary
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Reorder Alerts Report
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Monthly Movement Report
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Custom Reports</CardTitle>
                <CardDescription>
                  Create custom inventory reports
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
                      <SelectItem value="item-ledger">Item Ledger</SelectItem>
                      <SelectItem value="department-usage">Department Usage</SelectItem>
                      <SelectItem value="value-analysis">Value Analysis</SelectItem>
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

export default InventoryDashboard;