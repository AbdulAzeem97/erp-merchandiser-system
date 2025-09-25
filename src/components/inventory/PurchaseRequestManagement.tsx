import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Alert, AlertDescription } from '../ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  ShoppingCart, 
  Plus, 
  FileText,
  Calendar,
  DollarSign,
  User,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Truck,
  Search,
  Filter
} from 'lucide-react';
import { PurchaseRequest, PurchaseRequestForm, InventoryMaterial } from '../../types/inventory';
import { formatCurrency, formatDate } from '../../utils/formatting';
import { inventoryAPI } from '../../services/api';

interface PurchaseRequestManagementProps {
  className?: string;
}

export default function PurchaseRequestManagement({ className = '' }: PurchaseRequestManagementProps) {
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>([]);
  const [materials, setMaterials] = useState<InventoryMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  
  const [createForm, setCreateForm] = useState<PurchaseRequestForm>({
    materials: [{ inventory_material_id: '', quantity: 0, estimated_unit_cost: 0 }],
    reason: '',
    priority: 'MEDIUM'
  });

  useEffect(() => {
    fetchPurchaseRequests();
    fetchMaterials();
  }, []);

  const fetchPurchaseRequests = async () => {
    try {
      const data = await inventoryAPI.getPurchaseRequests();
      setPurchaseRequests(data.purchase_requests || []);
    } catch (error) {
      console.error('Error fetching purchase requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMaterials = async () => {
    try {
      const data = await inventoryAPI.getMaterials();
      setMaterials(data.materials || []);
    } catch (error) {
      console.error('Error fetching materials:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge className="bg-yellow-500 text-white">Pending</Badge>;
      case 'APPROVED':
        return <Badge className="bg-green-500 text-white">Approved</Badge>;
      case 'ORDERED':
        return <Badge className="bg-blue-500 text-white">Ordered</Badge>;
      case 'RECEIVED':
        return <Badge className="bg-green-600 text-white">Received</Badge>;
      case 'CANCELLED':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return <Badge className="bg-red-500 text-white">Urgent</Badge>;
      case 'HIGH':
        return <Badge className="bg-orange-500 text-white">High</Badge>;
      case 'MEDIUM':
        return <Badge className="bg-blue-500 text-white">Medium</Badge>;
      case 'LOW':
        return <Badge className="bg-gray-500 text-white">Low</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'APPROVED':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'ORDERED':
        return <ShoppingCart className="h-4 w-4 text-blue-500" />;
      case 'RECEIVED':
        return <Truck className="h-4 w-4 text-green-600" />;
      case 'CANCELLED':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const addMaterialRow = () => {
    setCreateForm(prev => ({
      ...prev,
      materials: [...prev.materials, { inventory_material_id: '', quantity: 0, estimated_unit_cost: 0 }]
    }));
  };

  const removeMaterialRow = (index: number) => {
    setCreateForm(prev => ({
      ...prev,
      materials: prev.materials.filter((_, i) => i !== index)
    }));
  };

  const updateMaterial = (index: number, field: string, value: any) => {
    setCreateForm(prev => ({
      ...prev,
      materials: prev.materials.map((material, i) => 
        i === index ? { ...material, [field]: value } : material
      )
    }));
  };

  const handleCreateRequest = async () => {
    try {
      await inventoryAPI.createPurchaseRequest(createForm);
      setShowCreateDialog(false);
      setCreateForm({
        materials: [{ inventory_material_id: '', quantity: 0, estimated_unit_cost: 0 }],
        reason: '',
        priority: 'MEDIUM'
      });
      fetchPurchaseRequests();
    } catch (error) {
      console.error('Error creating purchase request:', error);
    }
  };

  const filteredRequests = purchaseRequests.filter(request => {
    const matchesSearch = !searchTerm || 
      request.request_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.requested_by_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.supplier?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'ALL' || request.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const totalEstimatedCost = createForm.materials.reduce((sum, material) => 
    sum + (material.quantity * (material.estimated_unit_cost || 0)), 0
  );

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-16 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Purchase Requests</h2>
          <p className="text-muted-foreground">Manage material procurement requests</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Request
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Requests</p>
                <p className="text-2xl font-bold">{purchaseRequests.length}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Approval</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {purchaseRequests.filter(r => r.status === 'PENDING').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">
                  {purchaseRequests.filter(r => ['APPROVED', 'ORDERED'].includes(r.status)).length}
                </p>
              </div>
              <ShoppingCart className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(purchaseRequests.reduce((sum, r) => sum + r.total_estimated_cost, 0))}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search requests..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="ORDERED">Ordered</SelectItem>
                <SelectItem value="RECEIVED">Received</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Purchase Requests List */}
      {filteredRequests.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Purchase Requests</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || filterStatus !== 'ALL' 
                ? 'No requests match your current filters.'
                : 'No purchase requests have been created yet.'
              }
            </p>
            <Button onClick={() => setShowCreateDialog(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create First Request
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <Card key={request.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(request.status)}
                    <div>
                      <h3 className="text-lg font-semibold">{request.request_number}</h3>
                      <p className="text-sm text-muted-foreground">
                        Requested by {request.requested_by_name} • {formatDate(request.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getPriorityBadge(request.priority)}
                    {getStatusBadge(request.status)}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                    <p className="text-lg font-semibold">{formatCurrency(request.total_estimated_cost)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Supplier</p>
                    <p className="text-lg font-semibold">{request.supplier || 'TBD'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Expected Delivery</p>
                    <p className="text-lg font-semibold">
                      {request.expected_delivery_date ? formatDate(request.expected_delivery_date) : 'TBD'}
                    </p>
                  </div>
                </div>

                {request.request_reason && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-muted-foreground">Reason</p>
                    <p className="text-sm">{request.request_reason}</p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    {request.approved_by_name && (
                      <span>Approved by {request.approved_by_name}</span>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">
                      <FileText className="h-4 w-4 mr-2" />
                      Details
                    </Button>
                    {request.status === 'PENDING' && (
                      <>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Button size="sm" variant="destructive">
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Purchase Request Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Create Purchase Request
            </DialogTitle>
            <DialogDescription>
              Request materials for procurement to maintain inventory levels
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Request Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Request Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select 
                      value={createForm.priority} 
                      onValueChange={(value) => setCreateForm(prev => ({ ...prev, priority: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="URGENT">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="supplier">Preferred Supplier (Optional)</Label>
                    <Input
                      id="supplier"
                      placeholder="Enter supplier name"
                      value={createForm.supplier || ''}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, supplier: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">Reason for Request</Label>
                  <Textarea
                    id="reason"
                    placeholder="Explain why these materials are needed..."
                    value={createForm.reason}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, reason: e.target.value }))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Materials */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  Materials Required
                  <Button type="button" onClick={addMaterialRow} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Material
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {createForm.materials.map((material, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                      <div className="space-y-2">
                        <Label>Material</Label>
                        <Select 
                          value={material.inventory_material_id} 
                          onValueChange={(value) => updateMaterial(index, 'inventory_material_id', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select material" />
                          </SelectTrigger>
                          <SelectContent>
                            {materials.map((mat) => (
                              <SelectItem key={mat.id} value={mat.id}>
                                {mat.material_name} ({mat.material_code})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Quantity</Label>
                        <Input
                          type="number"
                          min="1"
                          value={material.quantity || ''}
                          onChange={(e) => updateMaterial(index, 'quantity', parseInt(e.target.value) || 0)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Est. Unit Cost</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={material.estimated_unit_cost || ''}
                          onChange={(e) => updateMaterial(index, 'estimated_unit_cost', parseFloat(e.target.value) || 0)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Actions</Label>
                        <div className="flex items-center space-x-2">
                          <div className="text-sm font-medium">
                            Total: {formatCurrency(material.quantity * (material.estimated_unit_cost || 0))}
                          </div>
                          {createForm.materials.length > 1 && (
                            <Button
                              type="button"
                              onClick={() => removeMaterialRow(index)}
                              size="sm"
                              variant="outline"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {createForm.materials.length > 0 && (
                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold">Total Estimated Cost:</span>
                      <span className="text-xl font-bold">{formatCurrency(totalEstimatedCost)}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleCreateRequest} className="flex-1">
                Create Purchase Request
              </Button>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
