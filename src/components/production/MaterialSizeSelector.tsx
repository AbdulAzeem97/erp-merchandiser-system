import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, TrendingUp, AlertCircle, Package } from 'lucide-react';
import { MaterialSize, OptimizationResult } from '@/types/inventory';
import { toast } from 'sonner';
import { getApiUrl } from '@/utils/apiConfig';

interface MaterialSizeSelectorProps {
  materialId: string;
  materialName: string;
  blankWidth: number; // mm
  blankHeight: number; // mm
  requiredQuantity: number;
  onSizeSelect: (size: MaterialSize, optimization: any) => void;
}

export const MaterialSizeSelector: React.FC<MaterialSizeSelectorProps> = ({
  materialId,
  materialName,
  blankWidth,
  blankHeight,
  requiredQuantity,
  onSizeSelect
}) => {
  const [sizes, setSizes] = useState<MaterialSize[]>([]);
  const [optimizations, setOptimizations] = useState<any[]>([]);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMaterialSizes();
  }, [materialId, blankWidth, blankHeight, requiredQuantity]);

  const fetchMaterialSizes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const apiUrl = getApiUrl();
      const response = await fetch(
        `${apiUrl}/api/production/smart-dashboard/materials/${materialId}/sizes?blankWidth=${blankWidth}&blankHeight=${blankHeight}&quantity=${requiredQuantity}`,
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
          setOptimizations(data.optimizations || []);
          
          // Auto-select best size
          if (data.optimizations && data.optimizations.length > 0) {
            const best = data.optimizations[0];
            setSelectedSize(best.size.id);
            onSizeSelect(best.size, best);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching material sizes:', error);
      toast.error('Error fetching material sizes');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading available sizes...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (sizes.length === 0) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-amber-600">
            <AlertCircle className="h-4 w-4" />
            <p className="text-sm">
              No sizes available for {materialName}. Using default material configuration.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Available Sheet Sizes</h3>
        <Badge variant="outline">{sizes.length} size{sizes.length !== 1 ? 's' : ''} available</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {optimizations.map((opt, index) => {
          const isSelected = selectedSize === opt.size.id;
          const isBest = index === 0;
          const hasStock = opt.availableStock > 0;

          return (
            <Card
              key={opt.size.id}
              className={`cursor-pointer transition-all ${
                isSelected
                  ? 'border-2 border-blue-500 shadow-lg'
                  : 'border hover:border-gray-400'
              } ${isBest && !isSelected ? 'border-green-300' : ''} ${
                !hasStock ? 'opacity-60' : ''
              }`}
              onClick={() => {
                setSelectedSize(opt.size.id);
                onSizeSelect(opt.size, opt);
              }}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">{opt.size.size_name}</CardTitle>
                  <div className="flex gap-1">
                    {isBest && (
                      <Badge className="bg-green-500 text-white">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Best
                      </Badge>
                    )}
                    {isSelected && (
                      <Badge className="bg-blue-500 text-white">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Selected
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Dimensions:</span>
                  <span className="font-medium">
                    {opt.size.width_mm} × {opt.size.height_mm} mm
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Blanks/Sheet:</span>
                  <span className="font-medium">{opt.layout.blanksPerSheet}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Efficiency:</span>
                  <span className="font-medium text-green-600">
                    {opt.layout.efficiencyPercentage.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Wastage:</span>
                  <span className="font-medium text-orange-600">
                    {opt.layout.wastagePercentage.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Required Sheets:</span>
                  <span className="font-medium">{opt.totalSheets}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Available Stock:</span>
                  <span className={`font-medium ${
                    hasStock ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {opt.availableStock}
                    {!hasStock && opt.stockShortage > 0 && (
                      <span className="ml-1 text-xs">(Short: {opt.stockShortage})</span>
                    )}
                  </span>
                </div>
                {opt.size.unit_cost && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cost/Sheet:</span>
                    <span className="font-medium">${opt.size.unit_cost.toFixed(2)}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default MaterialSizeSelector;

