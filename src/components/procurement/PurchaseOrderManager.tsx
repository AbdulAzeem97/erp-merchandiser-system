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
  RefreshCw,
  Save,
  X,
  FileText,
  Calendar,
  User,
  Building2,
  DollarSign,
  Package,
  CheckCircle,
  Clock,
  AlertCircle,
  Download,
  Send,
  Printer,
} from 'lucide-react';
import { toast } from 'sonner';

// Types
interface PurchaseOrder {
  po_id: number;
  po_number: string;
  supplier_id: number;
  supplier_name: string;
  po_date: string;
  expected_delivery_date: string;
  status: string;
  total_amount: number;
  currency: string;
  terms: string;
  notes: string;
  created_by: string;
  created_at: string;
  approved_by: string;
  approved_at: string;
  items: PurchaseOrderItem[];
}

interface PurchaseOrderItem {
  item_id: number;
  item_code: string;
  item_name: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  unit: string;
  received_qty: number;
  pending_qty: number;
}

interface Supplier {
  supplier_id: number;
  supplier_name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  is_active: boolean;
}

interface Requisition {
  req_id: number;
  req_number: string;
  department: string;
  requested_by: string;
  request_date: string;
  status: string;
  total_amount: number;
  items: any[];
}

const PurchaseOrderManager: React.FC = () => {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSupplier, setFilterSupplier] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    supplier_id: '',
    po_date: new Date().toISOString().split('T')[0],
    expected_delivery_date: '',
    currency: 'USD',
    terms: '',
    notes: '',
    requisition_id: '',
  });

  const [poItems, setPoItems] = useState<PurchaseOrderItem[]>([]);

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch purchase orders
      const poResponse = await fetch('/api/procurement/purchase-orders', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const poData = await poResponse.json();
      if (poData.success) {
        setPurchaseOrders(poData.purchaseOrders);
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
      const reqResponse = await fetch('/api/procurement/requisitions', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const reqData = await reqResponse.json();
      if (reqData.success) {
        setRequisitions(reqData.requisitions);
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

  // Filter purchase orders
  const filteredPOs = purchaseOrders.filter(po => {
    const matchesSearch = po.po_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         po.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         po.created_by.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || po.status === filterStatus;
    const matchesSupplier = filterSupplier === 'all' || po.supplier_id.toString() === filterSupplier;
    return matchesSearch && matchesStatus && matchesSupplier;
  });

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'secondary';
      case 'PENDING_APPROVAL': return 'default';
      case 'APPROVED': return 'default';
      case 'SENT': return 'default';
      case 'PARTIALLY_RECEIVED': return 'secondary';
      case 'FULLY_RECEIVED': return 'default';
      case 'CANCELLED': return 'destructive';
      default: return 'secondary';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DRAFT': return <FileText className="w-4 h-4" />;
      case 'PENDING_APPROVAL': return <Clock className="w-4 h-4" />;
      case 'APPROVED': return <CheckCircle className="w-4 h-4" />;
      case 'SENT': return <Send className="w-4 h-4" />;
      case 'PARTIALLY_RECEIVED': return <Package className="w-4 h-4" />;
      case 'FULLY_RECEIVED': return <CheckCircle className="w-4 h-4" />;
      case 'CANCELLED': return <AlertCircle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  // Handle add PO
  const handleAddPO = async () => {
    try {
      const response = await fetch('/api/procurement/purchase-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...formData,
          supplier_id: parseInt(formData.supplier_id),
          items: poItems,
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Purchase order created successfully');
        setIsAddDialogOpen(false);
        resetForm();
        fetchData();
      } else {
        toast.error(data.error || 'Failed to create purchase order');
      }
    } catch (error) {
      console.error('Error creating purchase order:', error);
      toast.error('Failed to create purchase order');
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      supplier_id: '',
      po_date: new Date().toISOString().split('T')[0],
      expected_delivery_date: '',
      currency: 'USD',
      terms: '',
      notes: '',
      requisition_id: '',
    });
    setPoItems([]);
  };

  // Add item to PO
  const addItemToPO = () => {
    setPoItems([...poItems, {
      item_id: 0,
      item_code: '',
      item_name: '',
      description: '',
      quantity: 0,
      unit_price: 0,
      total_price: 0,
      unit: '',
      received_qty: 0,
      pending_qty: 0,
    }]);
  };

  // Update PO item
  const updatePOItem = (index: number, field: string, value: any) => {
    const updatedItems = [...poItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // Calculate total price
    if (field === 'quantity' || field === 'unit_price') {
      updatedItems[index].total_price = updatedItems[index].quantity * updatedItems[index].unit_price;
    }
    
    setPoItems(updatedItems);
  };

  // Remove PO item
  const removePOItem = (index: number) => {
    setPoItems(poItems.filter((_, i) => i !== index));
  };

  // View PO details
  const viewPODetails = (po: PurchaseOrder) => {
    setSelectedPO(po);
    setIsViewDialogOpen(true);
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
          <h1 className="text-3xl font-bold tracking-tight">Purchase Orders</h1>
          <p className="text-muted-foreground">
            Manage purchase orders and supplier relationships
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
                Create PO
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Purchase Order</DialogTitle>
                <DialogDescription>
                  Create a new purchase order for supplier procurement
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="supplier_id">Supplier *</Label>
                    <Select value={formData.supplier_id} onValueChange={(value) => setFormData({ ...formData, supplier_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select supplier" />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers.map((supplier) => (
                          <SelectItem key={supplier.supplier_id} value={supplier.supplier_id.toString()}>
                            {supplier.supplier_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="requisition_id">Based on Requisition</Label>
                    <Select value={formData.requisition_id} onValueChange={(value) => setFormData({ ...formData, requisition_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select requisition" />
                      </SelectTrigger>
                      <SelectContent>
                        {requisitions.map((req) => (
                          <SelectItem key={req.req_id} value={req.req_id.toString()}>
                            {req.req_number} - {req.department}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="po_date">PO Date *</Label>
                    <Input
                      id="po_date"
                      type="date"
                      value={formData.po_date}
                      onChange={(e) => setFormData({ ...formData, po_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expected_delivery_date">Expected Delivery</Label>
                    <Input
                      id="expected_delivery_date"
                      type="date"
                      value={formData.expected_delivery_date}
                      onChange={(e) => setFormData({ ...formData, expected_delivery_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                        <SelectItem value="PKR">PKR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="terms">Terms & Conditions</Label>
                  <Textarea
                    id="terms"
                    value={formData.terms}
                    onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                    placeholder="Payment terms, delivery conditions, etc."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional notes or comments"
                    rows={2}
                  />
                </div>

                {/* PO Items */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-lg font-semibold">Purchase Order Items</Label>
                    <Button type="button" variant="outline" onClick={addItemToPO}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Item
                    </Button>
                  </div>
                  
                  {poItems.length > 0 && (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Item Code</TableHead>
                            <TableHead>Item Name</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Unit</TableHead>
                            <TableHead>Unit Price</TableHead>
                            <TableHead>Total Price</TableHead>
                            <TableHead className="w-[70px]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {poItems.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                <Input
                                  value={item.item_code}
                                  onChange={(e) => updatePOItem(index, 'item_code', e.target.value)}
                                  placeholder="Item code"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={item.item_name}
                                  onChange={(e) => updatePOItem(index, 'item_name', e.target.value)}
                                  placeholder="Item name"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={item.description}
                                  onChange={(e) => updatePOItem(index, 'description', e.target.value)}
                                  placeholder="Description"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => updatePOItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                                  placeholder="0"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={item.unit}
                                  onChange={(e) => updatePOItem(index, 'unit', e.target.value)}
                                  placeholder="PCS, LTR"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={item.unit_price}
                                  onChange={(e) => updatePOItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                                  placeholder="0.00"
                                />
                              </TableCell>
                              <TableCell className="font-medium">
                                ${item.total_price.toFixed(2)}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removePOItem(index)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleAddPO}>
                  <Save className="w-4 h-4 mr-2" />
                  Create PO
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
                  placeholder="Search purchase orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="PENDING_APPROVAL">Pending Approval</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="SENT">Sent</SelectItem>
                <SelectItem value="PARTIALLY_RECEIVED">Partially Received</SelectItem>
                <SelectItem value="FULLY_RECEIVED">Fully Received</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterSupplier} onValueChange={setFilterSupplier}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by supplier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Suppliers</SelectItem>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.supplier_id} value={supplier.supplier_id.toString()}>
                    {supplier.supplier_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Purchase Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Purchase Orders ({filteredPOs.length})</CardTitle>
          <CardDescription>
            All purchase orders and their current status
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
                  <TableHead>Status</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[70px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPOs.map((po) => (
                  <TableRow key={po.po_id}>
                    <TableCell className="font-mono font-medium">{po.po_number}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                        {po.supplier_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        {new Date(po.po_date).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      {po.expected_delivery_date ? new Date(po.expected_delivery_date).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(po.status)}>
                        {getStatusIcon(po.status)}
                        <span className="ml-1">{po.status.replace('_', ' ')}</span>
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        {po.total_amount.toLocaleString()} {po.currency}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4 text-muted-foreground" />
                        {po.created_by}
                      </div>
                    </TableCell>
                    <TableCell>{new Date(po.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => viewPODetails(po)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit PO
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="mr-2 h-4 w-4" />
                            Download PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Send className="mr-2 h-4 w-4" />
                            Send to Supplier
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Printer className="mr-2 h-4 w-4" />
                            Print PO
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Cancel PO
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

      {/* View PO Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Purchase Order Details</DialogTitle>
            <DialogDescription>
              Complete information for purchase order {selectedPO?.po_number}
            </DialogDescription>
          </DialogHeader>
          {selectedPO && (
            <div className="space-y-6">
              {/* PO Header Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">PO Information</h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">PO Number:</span> {selectedPO.po_number}</p>
                    <p><span className="font-medium">Supplier:</span> {selectedPO.supplier_name}</p>
                    <p><span className="font-medium">PO Date:</span> {new Date(selectedPO.po_date).toLocaleDateString()}</p>
                    <p><span className="font-medium">Expected Delivery:</span> {selectedPO.expected_delivery_date ? new Date(selectedPO.expected_delivery_date).toLocaleDateString() : 'N/A'}</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Status & Amount</h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Status:</span> 
                      <Badge variant={getStatusColor(selectedPO.status)} className="ml-2">
                        {selectedPO.status.replace('_', ' ')}
                      </Badge>
                    </p>
                    <p><span className="font-medium">Total Amount:</span> {selectedPO.total_amount.toLocaleString()} {selectedPO.currency}</p>
                    <p><span className="font-medium">Created By:</span> {selectedPO.created_by}</p>
                    <p><span className="font-medium">Created:</span> {new Date(selectedPO.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* PO Items */}
              <div>
                <h3 className="font-semibold mb-2">Purchase Order Items</h3>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item Code</TableHead>
                        <TableHead>Item Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead>Unit Price</TableHead>
                        <TableHead>Total Price</TableHead>
                        <TableHead>Received</TableHead>
                        <TableHead>Pending</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedPO.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-mono">{item.item_code}</TableCell>
                          <TableCell className="font-medium">{item.item_name}</TableCell>
                          <TableCell>{item.description}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{item.unit}</TableCell>
                          <TableCell>${item.unit_price.toFixed(2)}</TableCell>
                          <TableCell className="font-medium">${item.total_price.toFixed(2)}</TableCell>
                          <TableCell className="text-green-600">{item.received_qty}</TableCell>
                          <TableCell className="text-orange-600">{item.pending_qty}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Terms and Notes */}
              {(selectedPO.terms || selectedPO.notes) && (
                <div className="grid grid-cols-2 gap-4">
                  {selectedPO.terms && (
                    <div>
                      <h3 className="font-semibold mb-2">Terms & Conditions</h3>
                      <p className="text-sm text-muted-foreground">{selectedPO.terms}</p>
                    </div>
                  )}
                  {selectedPO.notes && (
                    <div>
                      <h3 className="font-semibold mb-2">Notes</h3>
                      <p className="text-sm text-muted-foreground">{selectedPO.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
            <Button>
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PurchaseOrderManager;
