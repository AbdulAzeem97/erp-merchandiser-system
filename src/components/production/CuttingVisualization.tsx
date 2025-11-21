import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Scissors } from 'lucide-react';
import { CuttingLayout } from '@/types/inventory';

interface CuttingVisualizationProps {
  layout: CuttingLayout;
  sheetSize: { width: number; height: number };
  blankSize: { width: number; height: number };
}

export const CuttingVisualization: React.FC<CuttingVisualizationProps> = ({
  layout,
  sheetSize,
  blankSize
}) => {
  // Calculate scale for visualization
  const maxDisplaySize = 400;
  const scaleX = maxDisplaySize / sheetSize.width;
  const scaleY = maxDisplaySize / sheetSize.height;
  const scale = Math.min(scaleX, scaleY);

  const displayWidth = sheetSize.width * scale;
  const displayHeight = sheetSize.height * scale;
  const displayBlankWidth = blankSize.width * scale;
  const displayBlankHeight = blankSize.height * scale;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scissors className="h-5 w-5" />
          Cutting Layout Visualization
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-4">
          {/* SVG Visualization */}
          <div className="border-2 border-gray-300 rounded-lg p-4 bg-white">
            <svg
              width={displayWidth + 20}
              height={displayHeight + 20}
              viewBox={`0 0 ${sheetSize.width + 20} ${sheetSize.height + 20}`}
              className="border border-gray-200 rounded"
            >
              {/* Sheet outline */}
              <rect
                x="10"
                y="10"
                width={sheetSize.width}
                height={sheetSize.height}
                fill="#f3f4f6"
                stroke="#6b7280"
                strokeWidth="2"
              />

              {/* Grid of blanks */}
              {Array.from({ length: layout.blanksPerColumn }).map((_, rowIndex) =>
                Array.from({ length: layout.blanksPerRow }).map((_, colIndex) => {
                  const x = 10 + colIndex * (layout.type === 'horizontal' ? blankSize.width : blankSize.height);
                  const y = 10 + rowIndex * (layout.type === 'horizontal' ? blankSize.height : blankSize.width);
                  const w = layout.type === 'horizontal' ? blankSize.width : blankSize.height;
                  const h = layout.type === 'horizontal' ? blankSize.height : blankSize.width;

                  return (
                    <g key={`${rowIndex}-${colIndex}`}>
                      <rect
                        x={x}
                        y={y}
                        width={w}
                        height={h}
                        fill="#dbeafe"
                        stroke="#3b82f6"
                        strokeWidth="1"
                      />
                      {/* Cut lines */}
                      {colIndex < layout.blanksPerRow - 1 && (
                        <line
                          x1={x + w}
                          y1={y}
                          x2={x + w}
                          y2={y + h}
                          stroke="#ef4444"
                          strokeWidth="1"
                          strokeDasharray="4,4"
                        />
                      )}
                      {rowIndex < layout.blanksPerColumn - 1 && (
                        <line
                          x1={x}
                          y1={y + h}
                          x2={x + w}
                          y2={y + h}
                          stroke="#ef4444"
                          strokeWidth="1"
                          strokeDasharray="4,4"
                        />
                      )}
                    </g>
                  );
                })
              )}

              {/* Wastage areas */}
              {layout.wastageWidth > 0 && (
                <rect
                  x={10 + layout.usedWidth}
                  y={10}
                  width={layout.wastageWidth}
                  height={sheetSize.height}
                  fill="#fee2e2"
                  stroke="#dc2626"
                  strokeWidth="1"
                  strokeDasharray="2,2"
                  opacity="0.5"
                />
              )}
              {layout.wastageHeight > 0 && (
                <rect
                  x={10}
                  y={10 + layout.usedHeight}
                  width={layout.usedWidth}
                  height={layout.wastageHeight}
                  fill="#fee2e2"
                  stroke="#dc2626"
                  strokeWidth="1"
                  strokeDasharray="2,2"
                  opacity="0.5"
                />
              )}
            </svg>
          </div>

          {/* Legend */}
          <div className="flex gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-200 border border-blue-500"></div>
              <span>Blank Area</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-200 border border-red-500 opacity-50"></div>
              <span>Wastage Area</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-gray-500"></div>
              <span>Sheet Outline</span>
            </div>
          </div>

          {/* Layout Info */}
          <div className="text-center space-y-1">
            <p className="text-sm font-medium text-gray-700">
              Grid Pattern: <span className="font-bold">{layout.gridPattern}</span>
            </p>
            <p className="text-xs text-gray-600">
              Sheet: {sheetSize.width} × {sheetSize.height} mm | 
              Blank: {blankSize.width} × {blankSize.height} mm
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CuttingVisualization;

