import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, TrendingUp } from 'lucide-react';
import { CuttingLayout } from '@/types/inventory';

interface CuttingLayoutCardProps {
  layout: CuttingLayout;
  isSelected: boolean;
  isBest: boolean;
  onClick: () => void;
}

export const CuttingLayoutCard: React.FC<CuttingLayoutCardProps> = ({
  layout,
  isSelected,
  isBest,
  onClick
}) => {
  return (
    <Card
      className={`cursor-pointer transition-all ${
        isSelected
          ? 'border-2 border-blue-500 shadow-lg'
          : 'border hover:border-gray-400'
      } ${isBest && !isSelected ? 'border-green-300' : ''}`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold capitalize">{layout.type} Layout</h4>
          <div className="flex gap-1">
            {isBest && (
              <Badge className="bg-green-500 text-white text-xs">
                <TrendingUp className="h-3 w-3 mr-1" />
                Best
              </Badge>
            )}
            {isSelected && (
              <Badge className="bg-blue-500 text-white text-xs">
                <CheckCircle className="h-3 w-3 mr-1" />
                Selected
              </Badge>
            )}
          </div>
        </div>

        {/* Grid Pattern Visual */}
        <div className="mb-4 p-3 bg-gray-50 rounded border border-gray-200">
          <div className="text-center mb-2">
            <span className="text-2xl font-bold text-gray-700">{layout.gridPattern}</span>
          </div>
          <div className="text-xs text-center text-gray-500">
            {layout.blanksPerRow} × {layout.blanksPerColumn} grid
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Blanks/Sheet:</span>
            <span className="font-medium">{layout.blanksPerSheet}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Efficiency:</span>
            <span className="font-medium text-green-600">
              {layout.efficiencyPercentage.toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Scrap:</span>
            <span className="font-medium text-orange-600">
              {layout.wastagePercentage.toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Wastage:</span>
            <span className="font-medium text-gray-700">
              {layout.wastageWidth.toFixed(0)} × {layout.wastageHeight.toFixed(0)} mm
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CuttingLayoutCard;

