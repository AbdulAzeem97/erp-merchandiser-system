import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Scissors, Grid3x3, TrendingUp, AlertTriangle } from 'lucide-react';

interface CuttingLayoutDisplayProps {
  gridPattern?: string;
  cuttingLayoutType?: string;
  blanksPerSheet?: number;
  efficiencyPercentage?: number;
  scrapPercentage?: number;
  blankWidth?: number;
  blankHeight?: number;
  blankSizeUnit?: string;
  sheetWidth?: number;
  sheetHeight?: number;
}

export const CuttingLayoutDisplay: React.FC<CuttingLayoutDisplayProps> = ({
  gridPattern,
  cuttingLayoutType,
  blanksPerSheet,
  efficiencyPercentage,
  scrapPercentage,
  blankWidth,
  blankHeight,
  blankSizeUnit = 'mm',
  sheetWidth,
  sheetHeight
}) => {
  // Parse grid pattern (e.g., "25x11", "11x25", "1 × 5", "1 x 5", "8 × 5")
  // IMPORTANT: Grid pattern format is "blanksPerRow × blanksPerColumn"
  // Where blanksPerRow = number of columns (blanks side by side)
  // And blanksPerColumn = number of rows (blanks stacked)
  const parseGridPattern = (pattern?: string) => {
    if (!pattern) return null;
    // Handle various formats: "25x11", "1 × 5", "1 x 5", "25 x 11", "8 × 5"
    // Replace multiplication symbol (×) with 'x' and normalize
    const normalized = pattern.replace(/×/g, 'x').replace(/\s+/g, '').toLowerCase();
    const parts = normalized.split('x');
    if (parts.length === 2) {
      const blanksPerRow = parseInt(parts[0].trim(), 10); // This is actually columns
      const blanksPerColumn = parseInt(parts[1].trim(), 10); // This is actually rows
      if (!isNaN(blanksPerRow) && !isNaN(blanksPerColumn) && blanksPerRow > 0 && blanksPerColumn > 0) {
        return {
          rows: blanksPerColumn, // blanksPerColumn = number of rows
          cols: blanksPerRow     // blanksPerRow = number of columns
        };
      }
    }
    return null;
  };

  const grid = parseGridPattern(gridPattern);
  const displayUnit = blankSizeUnit || 'mm';
  
  // Convert to numbers and handle null/undefined
  const blankWidthNum = blankWidth !== undefined && blankWidth !== null 
    ? (typeof blankWidth === 'number' ? blankWidth : (isNaN(parseFloat(blankWidth)) ? null : parseFloat(blankWidth)))
    : null;
  const blankHeightNum = blankHeight !== undefined && blankHeight !== null
    ? (typeof blankHeight === 'number' ? blankHeight : (isNaN(parseFloat(blankHeight)) ? null : parseFloat(blankHeight)))
    : null;
  const sheetWidthNum = sheetWidth ? (typeof sheetWidth === 'number' ? sheetWidth : parseFloat(sheetWidth)) : null;
  const sheetHeightNum = sheetHeight ? (typeof sheetHeight === 'number' ? sheetHeight : parseFloat(sheetHeight)) : null;
  
  const displayWidth = displayUnit === 'inches' && blankWidthNum 
    ? (blankWidthNum / 25.4).toFixed(2) 
    : blankWidthNum ? blankWidthNum.toFixed(2) : 'N/A';
  const displayHeight = displayUnit === 'inches' && blankHeightNum 
    ? (blankHeightNum / 25.4).toFixed(2) 
    : blankHeightNum ? blankHeightNum.toFixed(2) : 'N/A';

  // Determine layout type (horizontal or vertical)
  const layoutType = cuttingLayoutType || 'horizontal';
  
  // If blank size is missing but we have sheet size and grid, estimate blank size
  let estimatedBlankWidth = blankWidthNum;
  let estimatedBlankHeight = blankHeightNum;
  
  if ((!blankWidthNum || !blankHeightNum) && sheetWidthNum && sheetHeightNum && grid && grid.rows > 0 && grid.cols > 0) {
    // Estimate blank size from sheet size and grid pattern
    estimatedBlankWidth = estimatedBlankWidth || (sheetWidthNum / grid.cols);
    estimatedBlankHeight = estimatedBlankHeight || (sheetHeightNum / grid.rows);
    console.log('Estimated blank size from sheet and grid:', {
      sheetWidth: sheetWidthNum,
      sheetHeight: sheetHeightNum,
      grid: grid,
      estimatedBlankWidth,
      estimatedBlankHeight
    });
  }
  
  // Calculate actual sheet dimensions (use provided sheet size or calculate from grid)
  const actualSheetWidth = sheetWidthNum || (estimatedBlankWidth && grid ? estimatedBlankWidth * grid.cols : 1000);
  const actualSheetHeight = sheetHeightNum || (estimatedBlankHeight && grid ? estimatedBlankHeight * grid.rows : 1400);
  
  // Calculate used dimensions
  const usedWidth = estimatedBlankWidth && grid ? estimatedBlankWidth * grid.cols : 0;
  const usedHeight = estimatedBlankHeight && grid ? estimatedBlankHeight * grid.rows : 0;
  
  // Calculate wastage
  const wastageWidth = Math.max(0, actualSheetWidth - usedWidth);
  const wastageHeight = Math.max(0, actualSheetHeight - usedHeight);

  // Calculate scale for visualization (matching CuttingVisualization style)
  const maxDisplaySize = 400;
  const scaleX = maxDisplaySize / actualSheetWidth;
  const scaleY = maxDisplaySize / actualSheetHeight;
  const scale = Math.min(scaleX, scaleY);

  const displaySheetWidth = actualSheetWidth * scale;
  const displaySheetHeight = actualSheetHeight * scale;
  const displayBlankWidth = (estimatedBlankWidth || 0) * scale;
  const displayBlankHeight = (estimatedBlankHeight || 0) * scale;
  const displayWastageWidth = wastageWidth * scale;
  const displayWastageHeight = wastageHeight * scale;
  const displayUsedWidth = usedWidth * scale;
  const displayUsedHeight = usedHeight * scale;

  // Always show the card if we have any planning data
  const hasPlanningData = gridPattern || cuttingLayoutType || blanksPerSheet;

  if (!hasPlanningData) {
    return null; // Don't render if no planning data at all
  }

  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log('CuttingLayoutDisplay props:', {
      gridPattern,
      blankWidth,
      blankHeight,
      blankWidthNum,
      blankHeightNum,
      grid,
      sheetWidth,
      sheetHeight
    });
  }

  return (
    <Card className="bg-white">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Scissors className="h-5 w-5 text-blue-600" />
          Visual Layout (Approved by Job Planning)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Grid Pattern Visualization */}
        {grid && grid.rows > 0 && grid.cols > 0 && estimatedBlankWidth !== null && estimatedBlankHeight !== null && estimatedBlankWidth > 0 && estimatedBlankHeight > 0 ? (
          <div className="flex flex-col items-center gap-4">
            {/* SVG Visualization - Matching Job Planning style */}
            <div className="border-2 border-gray-300 rounded-lg p-4 bg-white w-full">
              <svg
                width={displaySheetWidth + 20}
                height={displaySheetHeight + 20}
                viewBox={`0 0 ${actualSheetWidth + 20} ${actualSheetHeight + 20}`}
                className="border border-gray-200 rounded"
              >
                {/* Sheet outline */}
                <rect
                  x="10"
                  y="10"
                  width={actualSheetWidth}
                  height={actualSheetHeight}
                  fill="#f3f4f6"
                  stroke="#6b7280"
                  strokeWidth="2"
                />

                {/* Grid of blanks */}
                {/* Note: grid.rows = blanksPerColumn, grid.cols = blanksPerRow */}
                {Array.from({ length: grid.rows }).map((_, rowIndex) =>
                  Array.from({ length: grid.cols }).map((_, colIndex) => {
                    // For horizontal layout: blank width goes horizontally, height goes vertically
                    // For vertical layout: blank height goes horizontally, width goes vertically (rotated)
                    const x = 10 + colIndex * (layoutType === 'horizontal' ? estimatedBlankWidth : estimatedBlankHeight);
                    const y = 10 + rowIndex * (layoutType === 'horizontal' ? estimatedBlankHeight : estimatedBlankWidth);
                    const w = layoutType === 'horizontal' ? estimatedBlankWidth : estimatedBlankHeight;
                    const h = layoutType === 'horizontal' ? estimatedBlankHeight : estimatedBlankWidth;

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
                        {colIndex < grid.cols - 1 && (
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
                        {rowIndex < grid.rows - 1 && (
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
                {wastageWidth > 0 && (
                  <rect
                    x={10 + usedWidth}
                    y={10}
                    width={wastageWidth}
                    height={actualSheetHeight}
                    fill="#fee2e2"
                    stroke="#dc2626"
                    strokeWidth="1"
                    strokeDasharray="2,2"
                    opacity="0.5"
                  />
                )}
                {wastageHeight > 0 && (
                  <rect
                    x={10}
                    y={10 + usedHeight}
                    width={usedWidth}
                    height={wastageHeight}
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
                Grid Pattern: <span className="font-bold">{gridPattern}</span>
              </p>
              <p className="text-xs text-gray-600">
                Sheet: {actualSheetWidth.toFixed(0)} × {actualSheetHeight.toFixed(0)} mm | 
                Blank: {estimatedBlankWidth.toFixed(0)} × {estimatedBlankHeight.toFixed(0)} mm
                {(!blankWidthNum || !blankHeightNum) && estimatedBlankWidth && estimatedBlankHeight && (
                  <span className="text-yellow-600 ml-1">(estimated)</span>
                )}
              </p>
            </div>

            {/* Layout Information */}
            <div className="grid grid-cols-2 gap-4 w-full">
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-1">
                  <Grid3x3 className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">Grid Pattern</span>
                </div>
                <p className="text-2xl font-bold text-blue-700">{gridPattern}</p>
                <p className="text-xs text-gray-600 mt-1">
                  {grid.rows} rows × {grid.cols} columns
                </p>
              </div>

              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-1">
                  <Scissors className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-gray-700">Blanks per Sheet</span>
                </div>
                <p className="text-2xl font-bold text-green-700">{blanksPerSheet || 'N/A'}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
            <Scissors className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm font-medium mb-2">Layout visualization unavailable</p>
            <p className="text-xs text-gray-500">
              {!grid || !grid.rows || !grid.cols 
                ? 'Grid pattern data is missing or invalid.'
                : blankWidthNum === null || blankHeightNum === null || blankWidthNum === 0 || blankHeightNum === 0
                ? 'Blank size information is required for visualization.'
                : 'Unable to render visualization. Please check data.'}
            </p>
            {grid && grid.rows > 0 && grid.cols > 0 && (
              <div className="mt-2 text-xs space-y-1">
                <p className="text-gray-400">Grid: {grid.rows} rows × {grid.cols} columns</p>
                {estimatedBlankWidth !== null && estimatedBlankHeight !== null && estimatedBlankWidth > 0 && estimatedBlankHeight > 0 ? (
                  <p className={blankWidthNum && blankHeightNum ? "text-green-600" : "text-yellow-600"}>
                    Blank: {estimatedBlankWidth.toFixed(0)}mm × {estimatedBlankHeight.toFixed(0)}mm
                    {(!blankWidthNum || !blankHeightNum) && " (estimated from sheet size)"}
                  </p>
                ) : (
                  <div className="space-y-1">
                    <p className="text-red-500 font-medium">Blank size: Not available</p>
                    <p className="text-gray-500 text-xs">
                      {blankWidth === undefined && blankHeight === undefined 
                        ? 'Blank size data not provided to component'
                        : blankWidthNum === null || blankHeightNum === null
                        ? `Received: width=${blankWidth}, height=${blankHeight}`
                        : 'Blank size values are zero or invalid'}
                      {sheetWidthNum && sheetHeightNum && (
                        <span className="block mt-1">Sheet size available: {sheetWidthNum.toFixed(0)}mm × {sheetHeightNum.toFixed(0)}mm</span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            )}
            {gridPattern && (
              <p className="text-xs mt-2 font-semibold text-gray-700">Grid Pattern: {gridPattern}</p>
            )}
          </div>
        )}

        {/* Layout Type and Efficiency */}
        <div className="grid grid-cols-2 gap-3">
          {cuttingLayoutType && (
            <div>
              <span className="text-xs text-gray-600">Layout Type</span>
              <Badge className="mt-1 bg-indigo-100 text-indigo-800 border-indigo-300">
                {cuttingLayoutType.charAt(0).toUpperCase() + cuttingLayoutType.slice(1)}
              </Badge>
            </div>
          )}
          
          {efficiencyPercentage !== undefined && efficiencyPercentage !== null && (
            <div>
              <span className="text-xs text-gray-600">Efficiency</span>
              <div className="flex items-center gap-2 mt-1">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="font-semibold text-green-700">
                  {typeof efficiencyPercentage === 'number' 
                    ? efficiencyPercentage.toFixed(1) 
                    : parseFloat(efficiencyPercentage).toFixed(1)}%
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Blank Size Display */}
        {(blankWidth || blankHeight) && (
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <span className="text-xs text-gray-600 block mb-2">Blank Size</span>
            <div className="flex items-center gap-4">
              <div>
                <span className="text-sm text-gray-500">Width:</span>
                <span className="ml-2 font-semibold text-gray-900">
                  {displayWidth} {displayUnit === 'inches' ? '"' : 'mm'}
                </span>
              </div>
              <div>
                <span className="text-sm text-gray-500">Height:</span>
                <span className="ml-2 font-semibold text-gray-900">
                  {displayHeight} {displayUnit === 'inches' ? '"' : 'mm'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Scrap/Wastage Warning */}
        {scrapPercentage !== undefined && scrapPercentage !== null && scrapPercentage > 10 && (
          <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <span className="text-sm text-yellow-800">
              Scrap: {typeof scrapPercentage === 'number' 
                ? scrapPercentage.toFixed(1) 
                : parseFloat(scrapPercentage).toFixed(1)}%
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

