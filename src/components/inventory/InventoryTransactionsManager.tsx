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
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  MoreHorizontal,
  Package,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Save,
  X,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  ArrowRightLeft,
  Calendar,
  User,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';

// Types
interface InventoryTransaction {
  txn_id: number;
  item_id: number;
  location_id: number;
  txn_type: string;
  txn_date: string;
  qty: number;
  unit: string;
  ref_no: string;
  department: string;
  job_card_no: string;
  remarks: string;
  unit_cost: number;
  total_value: number;
  created_by: string;
  created_at: string;
  item_code: string;
  item_name: string;
  location_name: string;
  department_name: string;
  master_category: string;
  control_category: string;
}

interface InventoryItem {
  item_id: number;
  item_code: string;
  item_name: string;
  unit: string;
  balance_qty: number;
}

interface Location {
  location_id: number;
  location_name: string;
  location_code: string;
}

const InventoryTransactionsManager: React.FC = () => {
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    item_id: '',
    location_id: '',
    txn_type: '',
    txn_date: new Date().toISOString().split('T')[0],
    qty: '',
    unit: '',
    ref_no: '',
    department: '',
    job_card_no: '',
    remarks: '',
    unit_cost: '',
    created_by: '',
  });

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch transactions
      const transactionsResponse = await fetch('/api/inventory/transactions', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const transactionsData = await transactionsResponse.json();
      if (transactionsData.success) {
        setTransactions(transactionsData.transactions);
      }

      // Fetch items
      const itemsResponse = await fetch('/api/inventory/items', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const itemsData = await itemsResponse.json();
      if (itemsData.success) {
        setItems(itemsData.items);
      }

      // Fetch locations
      const locationsResponse = await fetch('/api/inventory/locations', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const locationsData = await locationsResponse.json();
      if (locationsData.success) {
        setLocations(locationsData.locations);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter transactions
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.item_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.ref_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.job_card_no.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || transaction.txn_type === filterType;
    const matchesDateFrom = !filterDateFrom || new Date(transaction.txn_date) >= new Date(filterDateFrom);
    const matchesDateTo = !filterDateTo || new Date(transaction.txn_date) <= new Date(filterDateTo);
    return matchesSearch && matchesType && matchesDateFrom && matchesDateTo;
  });

  // Reset form
  const resetForm = () => {
    setFormData({
      item_id: '',
      location_id: '',
      txn_type: '',
      txn_date: new Date().toISOString().split('T')[0],
      qty: '',
      unit: '',
      ref_no: '',
      department: '',
      job_card_no: '',
      remarks: '',
      unit_cost: '',
      created_by: '',
    });
  };

  // Handle add transaction
  const handleAddTransaction = async () => {
    try {
      const response = await fetch('/api/inventory/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...formData,
          item_id: parseInt(formData.item_id),
          location_id: parseInt(formData.location_id),
          qty: parseFloat(formData.qty),
          unit_cost: parseFloat(formData.unit_cost),
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Transaction added successfully');
        setIsAddDialogOpen(false);
        resetForm();
        fetchData();
      } else {
        toast.error(data.error || 'Failed to add transaction');
      }
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast.error('Failed to add transaction');
    }
  };

  // Get transaction type icon
  const getTransactionTypeIcon = (type: string) => {
    switch (type) {
      case 'IN': return <ArrowDown className="w-4 h-4 text-green-500" />;
      case 'OUT': return <ArrowUp className="w-4 h-4 text-red-500" />;
      case 'ADJUSTMENT': return <RotateCcw className="w-4 h-4 text-blue-500" />;
      case 'TRANSFER': return <ArrowRightLeft className="w-4 h-4 text-purple-500" />;
      case 'OPENING_BALANCE': return <Package className="w-4 h-4 text-gray-500" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  // Get transaction type color
  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'IN': return 'default';
      case 'OUT': return 'secondary';
      case 'ADJUSTMENT': return 'default';
      case 'TRANSFER': return 'secondary';
      case 'OPENING_BALANCE': return 'secondary';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory Transactions</h1>
          <p className="text-muted-foreground">
            Track and manage all inventory movements and transactions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={fetchData} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Transaction
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Inventory Transaction</DialogTitle>
                <DialogDescription>
                  Record a new inventory movement or transaction
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="item_id">Item *</Label>
                    <Select value={formData.item_id} onValueChange={(value) => setFormData({ ...formData, item_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select item" />
                      </SelectTrigger>
                      <SelectContent>
                        {items.map((item) => (
                          <SelectItem key={item.item_id} value={item.item_id.toString()}>
                            {item.item_code} - {item.item_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location_id">Location *</Label>
                    <Select value={formData.location_id} onValueChange={(value) => setFormData({ ...formData, location_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map((location) => (
                          <SelectItem key={location.location_id} value={location.location_id.toString()}>
                            {location.location_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="txn_type">Transaction Type *</Label>
                    <Select value={formData.txn_type} onValueChange={(value) => setFormData({ ...formData, txn_type: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="IN">IN - Stock In</SelectItem>
                        <SelectItem value="OUT">OUT - Stock Out</SelectItem>
                        <SelectItem value="ADJUSTMENT">ADJUSTMENT - Stock Adjustment</SelectItem>
                        <SelectItem value="TRANSFER">TRANSFER - Stock Transfer</SelectItem>
                        <SelectItem value="OPENING_BALANCE">OPENING_BALANCE - Opening Balance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="txn_date">Transaction Date *</Label>
                    <Input
                      id="txn_date"
                      type="date"
                      value={formData.txn_date}
                      onChange={(e) => setFormData({ ...formData, txn_date: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="qty">Quantity *</Label>
                    <Input
                      id="qty"
                      type="number"
                      step="0.01"
                      value={formData.qty}
                      onChange={(e) => setFormData({ ...formData, qty: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit">Unit *</Label>
                    <Input
                      id="unit"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      placeholder="e.g., PCS, LTR"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit_cost">Unit Cost</Label>
                    <Input
                      id="unit_cost"
                      type="number"
                      step="0.01"
                      value={formData.unit_cost}
                      onChange={(e) => setFormData({ ...formData, unit_cost: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ref_no">Reference Number</Label>
                    <Input
                      id="ref_no"
                      value={formData.ref_no}
                      onChange={(e) => setFormData({ ...formData, ref_no: e.target.value })}
                      placeholder="e.g., GRN-001, ISS-001"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      placeholder="e.g., Production, Purchase"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="job_card_no">Job Card Number</Label>
                  <Input
                    id="job_card_no"
                    value={formData.job_card_no}
                    onChange={(e) => setFormData({ ...formData, job_card_no: e.target.value })}
                    placeholder="e.g., JC-2024-001"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="remarks">Remarks</Label>
                  <Textarea
                    id="remarks"
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    placeholder="Additional notes or comments"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="created_by">Created By</Label>
                  <Input
                    id="created_by"
                    value={formData.created_by}
                    onChange={(e) => setFormData({ ...formData, created_by: e.target.value })}
                    placeholder="User name"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleAddTransaction}>
                  <Save className="w-4 h-4 mr-2" />
                  Add Transaction
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="IN">IN - Stock In</SelectItem>
                <SelectItem value="OUT">OUT - Stock Out</SelectItem>
                <SelectItem value="ADJUSTMENT">ADJUSTMENT</SelectItem>
                <SelectItem value="TRANSFER">TRANSFER</SelectItem>
                <SelectItem value="OPENING_BALANCE">OPENING_BALANCE</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              placeholder="From Date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="w-40"
            />
            <Input
              type="date"
              placeholder="To Date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="w-40"
            />
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              More Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Transactions ({filteredTransactions.length})</CardTitle>
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
                  <TableHead>Location</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Job Card</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead className="w-[70px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.txn_id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        {new Date(transaction.txn_date).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getTransactionTypeColor(transaction.txn_type)}>
                        {getTransactionTypeIcon(transaction.txn_type)}
                        <span className="ml-1">{transaction.txn_type}</span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">{transaction.item_name}</p>
                        <p className="text-xs text-muted-foreground">{transaction.item_code}</p>
                      </div>
                    </TableCell>
                    <TableCell>{transaction.location_name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {transaction.txn_type === 'IN' ? (
                          <TrendingUp className="w-4 h-4 text-green-500" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-500" />
                        )}
                        <span className="font-medium">{transaction.qty}</span>
                        <span className="text-muted-foreground">{transaction.unit}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">{transaction.ref_no}</TableCell>
                    <TableCell>{transaction.department}</TableCell>
                    <TableCell className="font-mono">{transaction.job_card_no}</TableCell>
                    <TableCell>${transaction.total_value.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4 text-muted-foreground" />
                        {transaction.created_by}
                      </div>
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
                            Edit Transaction
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <FileText className="mr-2 h-4 w-4" />
                            View Item History
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
    </div>
  );
};

export default InventoryTransactionsManager;
