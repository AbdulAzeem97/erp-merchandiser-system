import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Package, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { getApiUrl } from '@/utils/apiConfig';

interface MaterialSize {
  id: string | number;
  size_name: string;
  width_mm: number;
  height_mm: number;
  unit_cost?: number | null;
  is_default: boolean;
  available_stock?: number;
}

interface SheetSizeSelectorProps {
  materialId: string | null;
  materialName: string;
  onSizeSelect: (size: MaterialSize | null) => void;
  selectedSizeId?: string | number | null;
}

export const SheetSizeSelector: React.FC<SheetSizeSelectorProps> = ({
  materialId,
  materialName,
  onSizeSelect,
  selectedSizeId
}) => {
  const [sizes, setSizes] = useState<MaterialSize[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newSize, setNewSize] = useState({
    size_name: '',
    width_mm: '',
    height_mm: '',
    unit_cost: ''
  });

  useEffect(() => {
    if (materialId) {
      fetchSizes();
    } else {
      setSizes([]);
      onSizeSelect(null);
    }
  }, [materialId]);

  const fetchSizes = async () => {
    if (!materialId) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const apiUrl = getApiUrl();
      const response = await fetch(
        `${apiUrl}/api/production/smart-dashboard/materials/${materialId}/sizes`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSizes(data.sizes || []);
          // Auto-select default size if available
          if (data.sizes && data.sizes.length > 0) {
            const defaultSize = data.sizes.find((s: MaterialSize) => s.is_default) || data.sizes[0];
            if (!selectedSizeId) {
              onSizeSelect(defaultSize);
            } else {
              const selected = data.sizes.find((s: MaterialSize) => s.id.toString() === selectedSizeId.toString());
              if (selected) {
                onSizeSelect(selected);
              } else {
                // Selected size not found, use default
                onSizeSelect(defaultSize);
              }
            }
          } else {
            onSizeSelect(null);
          }
        } else {
          console.error('API returned success=false:', data);
          toast.error(data.error || 'Failed to load sheet sizes');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to fetch sizes:', response.status, errorData);
        toast.error(errorData.message || errorData.error || `Failed to load sheet sizes (${response.status})`);
      }
    } catch (error) {
      console.error('Error fetching sizes:', error);
      toast.error('Failed to load sheet sizes');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSize = async () => {
    if (!materialId) {
      toast.error('Material ID is required');
      return;
    }

    if (!newSize.size_name || !newSize.width_mm || !newSize.height_mm) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const apiUrl = getApiUrl();
      const response = await fetch(
        `${apiUrl}/api/production/smart-dashboard/materials/${materialId}/sizes`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            size_name: newSize.size_name,
            width_mm: parseFloat(newSize.width_mm),
            height_mm: parseFloat(newSize.height_mm),
            unit_cost: newSize.unit_cost ? parseFloat(newSize.unit_cost) : null,
            is_default: sizes.length === 0 ? true : false
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast.success(`Sheet size "${data.size.size_name}" added successfully`);
          setShowAddDialog(false);
          setNewSize({ size_name: '', width_mm: '', height_mm: '', unit_cost: '' });
          // Refresh sizes list
          await fetchSizes();
          // Select the newly added size
          if (data.size) {
            onSizeSelect(data.size);
          }
        } else {
          toast.error(data.error || 'Failed to add sheet size');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to add size:', response.status, errorData);
        toast.error(errorData.message || errorData.error || `Failed to add sheet size (${response.status})`);
      }
    } catch (error: any) {
      console.error('Error adding size:', error);
      toast.error('Failed to add sheet size');
    }
  };

  if (!materialId) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-gray-600">Please select a material first</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Sheet Size Selection
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAddDialog(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Size
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Loading sizes...</p>
            </div>
          ) : sizes.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-gray-600 mb-4">
                No sheet sizes available for {materialName}
              </p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Size
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <Label>Select Sheet Size *</Label>
              <Select
                value={selectedSizeId?.toString() || ''}
                onValueChange={(value) => {
                  const size = sizes.find(s => s.id.toString() === value);
                  if (size) {
                    onSizeSelect(size);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a sheet size" />
                </SelectTrigger>
                <SelectContent>
                  {sizes.map((size) => (
                    <SelectItem key={size.id} value={size.id.toString()}>
                      <div className="flex items-center justify-between w-full">
                        <span>{size.size_name}</span>
                        <div className="flex items-center gap-2 ml-4">
                          {size.is_default && (
                            <Badge variant="secondary" className="text-xs">Default</Badge>
                          )}
                          <span className="text-xs text-gray-500">
                            {size.width_mm} × {size.height_mm} mm
                          </span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {selectedSizeId && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  {(() => {
                    const selected = sizes.find(s => s.id.toString() === selectedSizeId.toString());
                    if (!selected) return null;
                    return (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="font-medium">{selected.size_name}</span>
                        </div>
                        <div className="text-sm text-gray-600 ml-6">
                          Dimensions: {selected.width_mm} × {selected.height_mm} mm
                          {selected.unit_cost && (
                            <span className="ml-4">Cost: ${selected.unit_cost.toFixed(2)}</span>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Size Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Sheet Size</DialogTitle>
            <DialogDescription>
              Add a new sheet size for {materialName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="size_name">Size Name *</Label>
              <Input
                id="size_name"
                value={newSize.size_name}
                onChange={(e) => setNewSize({ ...newSize, size_name: e.target.value })}
                placeholder="e.g., Standard Sheet, A4, Custom"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="width_mm">Width (mm) *</Label>
                <Input
                  id="width_mm"
                  type="number"
                  min="1"
                  step="0.1"
                  value={newSize.width_mm}
                  onChange={(e) => setNewSize({ ...newSize, width_mm: e.target.value })}
                  placeholder="e.g., 1000"
                />
              </div>
              <div>
                <Label htmlFor="height_mm">Height (mm) *</Label>
                <Input
                  id="height_mm"
                  type="number"
                  min="1"
                  step="0.1"
                  value={newSize.height_mm}
                  onChange={(e) => setNewSize({ ...newSize, height_mm: e.target.value })}
                  placeholder="e.g., 1400"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="unit_cost">Unit Cost (Optional)</Label>
              <Input
                id="unit_cost"
                type="number"
                min="0"
                step="0.01"
                value={newSize.unit_cost}
                onChange={(e) => setNewSize({ ...newSize, unit_cost: e.target.value })}
                placeholder="e.g., 10.50"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSize}>
              <Plus className="h-4 w-4 mr-2" />
              Add Size
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

