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
  Package, 
  Plus, 
  Minus,
  TrendingUp,
  TrendingDown,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Package2,
  Truck
} from 'lucide-react';
import { InventoryMaterial, InventoryStock, StockReceiveForm, StockAdjustmentForm } from '../../types/inventory';
import { formatCurrency, formatDate } from '../../utils/formatting';
import { inventoryAPI } from '../../services/api';

interface StockManagementProps {
  className?: string;
}

export default function StockManagement({ className = '' }: StockManagementProps) {
  const [materials, setMaterials] = useState<(InventoryMaterial & InventoryStock)[]>([]);
  const [filteredMaterials, setFilteredMaterials] = useState<(InventoryMaterial & InventoryStock)[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [selectedMaterial, setSelectedMaterial] = useState<(InventoryMaterial & InventoryStock) | null>(null);
  
  // Forms
  const [receiveForm, setReceiveForm] = useState<StockReceiveForm>({
    inventory_material_id: '',
    quantity: 0,
    unit_cost: 0,
    reference_id: ''
  });
  
  const [adjustmentForm, setAdjustmentForm] = useState<StockAdjustmentForm>({
    inventory_material_id: '',
    adjustment_quantity: 0,
    reason: ''
  });

  const [showReceiveDialog, setShowReceiveDialog] = useState(false);
  const [showAdjustmentDialog, setShowAdjustmentDialog] = useState(false);

  useEffect(() => {
    fetchMaterials();
  }, []);

  useEffect(() => {
    filterMaterials();
  }, [materials, searchTerm, filterStatus]);

  const fetchMaterials = async () => {
    try {
      const data = await inventoryAPI.getMaterials();
      setMaterials(data.materials || []);
    } catch (error) {
      console.error('Error fetching materials:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterMaterials = () => {
    let filtered = [...materials];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(material =>
        material.material_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        material.material_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        material.category_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (filterStatus !== 'ALL') {
      filtered = filtered.filter(material => material.stock_status === filterStatus);
    }

    setFilteredMaterials(filtered);
  };

  const getStockStatusBadge = (status: string | undefined) => {
    switch (status) {
      case 'CRITICAL':
        return <Badge variant="destructive">Critical</Badge>;
      case 'LOW':
        return <Badge className="bg-orange-500 text-white">Low Stock</Badge>;
      case 'NORMAL':
        return <Badge className="bg-green-500 text-white">Normal</Badge>;
      case 'OVERSTOCK':
        return <Badge className="bg-blue-500 text-white">Overstock</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const handleReceiveStock = async () => {
    try {
      await inventoryAPI.receiveStock(receiveForm);
      setShowReceiveDialog(false);
      setReceiveForm({
        inventory_material_id: '',
        quantity: 0,
        unit_cost: 0,
        reference_id: ''
      });
      fetchMaterials(); // Refresh the list
    } catch (error) {
      console.error('Error receiving stock:', error);
    }
  };

  const handleStockAdjustment = async () => {
    try {
      await inventoryAPI.adjustStock(adjustmentForm);
      setShowAdjustmentDialog(false);
      setAdjustmentForm({
        inventory_material_id: '',
        adjustment_quantity: 0,
        reason: ''
      });
      fetchMaterials(); // Refresh the list
    } catch (error) {
      console.error('Error adjusting stock:', error);
    }
  };

  const openReceiveDialog = (material?: InventoryMaterial & InventoryStock) => {
    if (material) {
      setReceiveForm(prev => ({
        ...prev,
        inventory_material_id: material.id
      }));
    }
    setShowReceiveDialog(true);
  };

  const openAdjustmentDialog = (material?: InventoryMaterial & InventoryStock) => {
    if (material) {
      setAdjustmentForm(prev => ({
        ...prev,
        inventory_material_id: material.id
      }));
    }
    setShowAdjustmentDialog(true);
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
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
          <h2 className="text-3xl font-bold tracking-tight">Stock Management</h2>
          <p className="text-muted-foreground">Monitor and manage inventory stock levels</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => openReceiveDialog()} className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Receive Stock
          </Button>
          <Button onClick={() => openAdjustmentDialog()} variant="outline" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Adjust Stock
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search materials..."
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
                <SelectItem value="ALL">All Stock Levels</SelectItem>
                <SelectItem value="CRITICAL">Critical</SelectItem>
                <SelectItem value="LOW">Low Stock</SelectItem>
                <SelectItem value="NORMAL">Normal</SelectItem>
                <SelectItem value="OVERSTOCK">Overstock</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stock Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Materials</p>
                <p className="text-2xl font-bold">{materials.length}</p>
              </div>
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Critical Stock</p>
                <p className="text-2xl font-bold text-red-600">
                  {materials.filter(m => m.stock_status === 'CRITICAL').length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Low Stock</p>
                <p className="text-2xl font-bold text-orange-600">
                  {materials.filter(m => m.stock_status === 'LOW').length}
                </p>
              </div>
              <Package2 className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(materials.reduce((sum, m) => sum + (m.stock_value || 0), 0))}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Materials Grid */}
      {filteredMaterials.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Materials Found</h3>
            <p className="text-muted-foreground">
              {searchTerm || filterStatus !== 'ALL' 
                ? 'Try adjusting your filters or search term.'
                : 'No materials have been configured yet.'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMaterials.map((material) => (
            <Card key={material.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg truncate">{material.material_name}</CardTitle>
                  {getStockStatusBadge(material.stock_status)}
                </div>
                <CardDescription>
                  {material.material_code} • {material.category_name}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Stock Levels */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-2xl font-bold text-blue-600">{material.current_stock || 0}</p>
                    <p className="text-xs text-muted-foreground">Current</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-orange-600">{material.reserved_stock || 0}</p>
                    <p className="text-xs text-muted-foreground">Reserved</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">{material.available_stock || 0}</p>
                    <p className="text-xs text-muted-foreground">Available</p>
                  </div>
                </div>

                {/* Stock Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Stock Level</span>
                    <span>{material.current_stock || 0} / {material.maximum_stock_level} {material.unit_of_measurement}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${
                        (material.current_stock || 0) <= material.minimum_stock_level 
                          ? 'bg-red-500' 
                          : (material.current_stock || 0) <= material.reorder_level 
                          ? 'bg-orange-500' 
                          : 'bg-green-500'
                      }`}
                      style={{ 
                        width: `${Math.min(100, ((material.current_stock || 0) / material.maximum_stock_level) * 100)}%` 
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Min: {material.minimum_stock_level}</span>
                    <span>Reorder: {material.reorder_level}</span>
                    <span>Max: {material.maximum_stock_level}</span>
                  </div>
                </div>

                {/* Stock Value */}
                <div className="pt-2 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Stock Value</span>
                    <span className="font-semibold">{formatCurrency(material.stock_value || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Unit Cost</span>
                    <span className="text-sm">{formatCurrency(material.unit_cost || 0)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button 
                    size="sm" 
                    onClick={() => openReceiveDialog(material)}
                    className="flex-1"
                  >
                    <TrendingUp className="h-4 w-4 mr-1" />
                    Receive
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => openAdjustmentDialog(material)}
                    className="flex-1"
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Adjust
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Receive Stock Dialog */}
      <Dialog open={showReceiveDialog} onOpenChange={setShowReceiveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Receive Stock
            </DialogTitle>
            <DialogDescription>
              Add new stock to inventory from purchase or transfer
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="material-select">Material</Label>
              <Select 
                value={receiveForm.inventory_material_id} 
                onValueChange={(value) => setReceiveForm(prev => ({ ...prev, inventory_material_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select material" />
                </SelectTrigger>
                <SelectContent>
                  {materials.map((material) => (
                    <SelectItem key={material.id} value={material.id}>
                      {material.material_name} ({material.material_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={receiveForm.quantity || ''}
                  onChange={(e) => setReceiveForm(prev => ({ 
                    ...prev, 
                    quantity: parseInt(e.target.value) || 0 
                  }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit-cost">Unit Cost</Label>
                <Input
                  id="unit-cost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={receiveForm.unit_cost || ''}
                  onChange={(e) => setReceiveForm(prev => ({ 
                    ...prev, 
                    unit_cost: parseFloat(e.target.value) || 0 
                  }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reference-id">Reference ID</Label>
              <Input
                id="reference-id"
                placeholder="PO number, invoice, or reference"
                value={receiveForm.reference_id}
                onChange={(e) => setReceiveForm(prev => ({ 
                  ...prev, 
                  reference_id: e.target.value 
                }))}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleReceiveStock} className="flex-1">
                Receive Stock
              </Button>
              <Button variant="outline" onClick={() => setShowReceiveDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stock Adjustment Dialog */}
      <Dialog open={showAdjustmentDialog} onOpenChange={setShowAdjustmentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Stock Adjustment
            </DialogTitle>
            <DialogDescription>
              Adjust stock levels for corrections or discrepancies
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="material-adjust-select">Material</Label>
              <Select 
                value={adjustmentForm.inventory_material_id} 
                onValueChange={(value) => setAdjustmentForm(prev => ({ ...prev, inventory_material_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select material" />
                </SelectTrigger>
                <SelectContent>
                  {materials.map((material) => (
                    <SelectItem key={material.id} value={material.id}>
                      {material.material_name} ({material.material_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="adjustment-quantity">Adjustment Quantity</Label>
              <Input
                id="adjustment-quantity"
                type="number"
                placeholder="Positive to add, negative to subtract"
                value={adjustmentForm.adjustment_quantity || ''}
                onChange={(e) => setAdjustmentForm(prev => ({ 
                  ...prev, 
                  adjustment_quantity: parseInt(e.target.value) || 0 
                }))}
              />
              <p className="text-sm text-muted-foreground">
                Use positive numbers to add stock, negative to remove
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="adjustment-reason">Reason for Adjustment</Label>
              <Textarea
                id="adjustment-reason"
                placeholder="Explain the reason for this stock adjustment..."
                value={adjustmentForm.reason}
                onChange={(e) => setAdjustmentForm(prev => ({ 
                  ...prev, 
                  reason: e.target.value 
                }))}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleStockAdjustment} className="flex-1">
                Apply Adjustment
              </Button>
              <Button variant="outline" onClick={() => setShowAdjustmentDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}