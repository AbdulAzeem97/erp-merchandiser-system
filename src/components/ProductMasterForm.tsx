import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Save, X, Factory } from 'lucide-react';
import { toast } from 'sonner';
import { ProductMaster, PRODUCT_TYPES, BRANDS, MATERIALS } from '../types/erp';
import { ProcessSequenceSection } from './ProcessSequenceSection';

interface ProductMasterFormProps {
  onProductSaved?: (product: ProductMaster) => void;
  onBack?: () => void;
}

export const ProductMasterForm: React.FC<ProductMasterFormProps> = ({ onProductSaved, onBack }) => {
  const [formData, setFormData] = useState<ProductMaster>({
    id: '',
    product_item_code: 'BR-00-139-A',
    brand: 'JCP',
    material_name: 'C1S',
    gsm: 350,
    color_specifications: 'As per Approved Sample/Artwork',
    remarks: 'Print on Uncoated Side',
    fsc: 'Yes',
    fsc_claim: 'Recycled',
    product_type: 'Offset',
    is_active: true,
    created_at: '',
    updated_at: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleInputChange = (field: keyof ProductMaster, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    // Validation
    if (!formData.product_item_code.trim()) {
      toast.error('Product Code is required');
      return;
    }
    if (!formData.brand) {
      toast.error('Brand is required');
      return;
    }
    if (!formData.material_name) {
      toast.error('Material is required');
      return;
    }

    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Saving product master:', formData);
      toast.success('Product saved successfully! Opening Job Card Form...');
      
      // Call parent callback to handle navigation
      if (onProductSaved) {
        onProductSaved(formData);
      }
    } catch (error) {
      toast.error('Failed to save product');
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (onBack) {
      onBack();
    } else {
      console.log('Cancelling form');
      // Reset form or navigate away
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between bg-card rounded-lg p-6 border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Factory className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Create New Product Master</h1>
              <p className="text-sm text-muted-foreground">Job Order Automation Module</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleCancel} className="gap-2">
              <X className="w-4 h-4" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="gap-2">
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Product'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Product Details Card */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                Product Information
                <Badge variant="secondary" className="text-xs">Required</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="productItemCode" className="text-sm font-medium">
                    Product Code
                  </Label>
                  <Input
                    id="productItemCode"
                    value={formData.product_item_code}
                    onChange={(e) => handleInputChange('product_item_code', e.target.value)}
                    placeholder="Enter product code (any format)"
                    className="font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="brand" className="text-sm font-medium">
                    Brand
                  </Label>
                  <Select value={formData.brand} onValueChange={(value) => handleInputChange('brand', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select brand" />
                    </SelectTrigger>
                    <SelectContent>
                      {BRANDS.map(brand => (
                        <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="material" className="text-sm font-medium">
                    Material
                  </Label>
                  <Select value={formData.material_name} onValueChange={(value) => handleInputChange('material_name', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select material" />
                    </SelectTrigger>
                    <SelectContent>
                      {MATERIALS.map(material => (
                        <SelectItem key={material} value={material}>{material}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gsm" className="text-sm font-medium">
                    GSM
                  </Label>
                  <Input
                    id="gsm"
                    value={formData.gsm}
                    onChange={(e) => handleInputChange('gsm', e.target.value)}
                    placeholder="e.g., 350"
                    type="number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fsc" className="text-sm font-medium">
                    FSC
                  </Label>
                  <Select value={formData.fsc} onValueChange={(value: 'Yes' | 'No') => handleInputChange('fsc', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select FSC status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fscClaim" className="text-sm font-medium">
                    FSC Claim
                  </Label>
                  <Select 
                    value={formData.fsc_claim} 
                    onValueChange={(value: 'Recycled' | 'Mixed') => handleInputChange('fsc_claim', value)}
                    disabled={formData.fsc === 'No'}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select FSC claim" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Recycled">Recycled</SelectItem>
                      <SelectItem value="Mixed">Mixed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="color" className="text-sm font-medium">
                  Color
                </Label>
                <Input
                  id="color"
                  value={formData.color_specifications}
                  onChange={(e) => handleInputChange('color_specifications', e.target.value)}
                  placeholder="e.g., As per Approved Sample/Artwork"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="remarks" className="text-sm font-medium">
                  Remarks
                </Label>
                <Textarea
                  id="remarks"
                  value={formData.remarks}
                  onChange={(e) => handleInputChange('remarks', e.target.value)}
                  placeholder="Additional notes or specifications"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Process Sequence Card */}
          <ProcessSequenceSection 
            selectedProductType={formData.product_type}
            onProductTypeChange={(productType) => handleInputChange('product_type', productType)}
          />
        </div>
      </div>
    </div>
  );
};
