import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Package, Search, Download, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface ItemSpecification {
  item_code: string;
  color: string;
  size: string;
  quantity: number;
  secondary_code?: string;
  decimal_value?: number;
  material?: string;
  specifications?: any;
}

interface ItemSpecificationsData {
  id?: string;
  excel_file_name?: string;
  item_count?: number;
  total_quantity?: number;
  size_variants?: number;
  color_variants?: number;
  items?: ItemSpecification[];
  excel_file_link?: string;
}

interface ItemSpecificationsDisplayProps {
  itemSpecifications: ItemSpecificationsData | null;
  showHeader?: boolean;
  compact?: boolean;
  maxItems?: number;
  onExport?: () => void;
}

export const ItemSpecificationsDisplay: React.FC<ItemSpecificationsDisplayProps> = ({
  itemSpecifications,
  showHeader = true,
  compact = false,
  maxItems = 100,
  onExport
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterColor, setFilterColor] = useState('');
  const [filterSize, setFilterSize] = useState('');
  const [expanded, setExpanded] = useState(!compact);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // Get items from itemSpecifications
  const items = useMemo(() => {
    if (!itemSpecifications) return [];
    
    // Try to get items from items array first, then from raw_excel_data
    if (itemSpecifications.items && Array.isArray(itemSpecifications.items)) {
      return itemSpecifications.items;
    }
    
    // Fallback to raw_excel_data if items array doesn't exist
    if (itemSpecifications.raw_excel_data && itemSpecifications.raw_excel_data.items) {
      return itemSpecifications.raw_excel_data.items;
    }
    
    return [];
  }, [itemSpecifications]);

  // Get unique colors and sizes for filtering
  const uniqueColors = useMemo(() => {
    const colors = new Set<string>();
    items.forEach(item => {
      if (item.color) colors.add(item.color);
    });
    return Array.from(colors).sort();
  }, [items]);

  const uniqueSizes = useMemo(() => {
    const sizes = new Set<string>();
    items.forEach(item => {
      if (item.size) sizes.add(item.size);
    });
    return Array.from(sizes).sort();
  }, [items]);

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = !searchTerm || 
        item.item_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.color?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.size?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.secondary_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.material?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesColor = !filterColor || item.color === filterColor;
      const matchesSize = !filterSize || item.size === filterSize;
      
      return matchesSearch && matchesColor && matchesSize;
    });
  }, [items, searchTerm, filterColor, filterSize]);

  // Pagination
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredItems.slice(0, maxItems).slice(start, end);
  }, [filteredItems, currentPage, maxItems]);

  const totalPages = Math.ceil(Math.min(filteredItems.length, maxItems) / itemsPerPage);

  // Calculate summary stats
  const summary = useMemo(() => {
    const totalQuantity = filteredItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const uniqueSizesCount = new Set(filteredItems.map(item => item.size)).size;
    const uniqueColorsCount = new Set(filteredItems.map(item => item.color)).size;
    
    return {
      totalItems: filteredItems.length,
      totalQuantity,
      sizeVariants: uniqueSizesCount,
      colorVariants: uniqueColorsCount
    };
  }, [filteredItems]);

  if (!itemSpecifications || items.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-6 text-center text-gray-500">
          <Package className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p>No item specifications available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border">
      {showHeader && (
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="w-5 h-5" />
              Item Specifications
            </CardTitle>
            <div className="flex items-center gap-2">
              {onExport && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onExport}
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export
                </Button>
              )}
              {compact && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpanded(!expanded)}
                  className="gap-2"
                >
                  {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  {expanded ? 'Collapse' : 'Expand'}
                </Button>
              )}
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <Label className="text-gray-600 text-xs">Total Items</Label>
              <p className="font-bold text-gray-900 text-lg">
                {itemSpecifications.item_count || summary.totalItems}
              </p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
              <Label className="text-gray-600 text-xs">Total Quantity</Label>
              <p className="font-bold text-gray-900 text-lg">
                {(itemSpecifications.total_quantity || summary.totalQuantity).toLocaleString()}
              </p>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
              <Label className="text-gray-600 text-xs">Sizes</Label>
              <p className="font-bold text-gray-900 text-lg">
                {itemSpecifications.size_variants || summary.sizeVariants}
              </p>
            </div>
            <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
              <Label className="text-gray-600 text-xs">Colors</Label>
              <p className="font-bold text-gray-900 text-lg">
                {itemSpecifications.color_variants || summary.colorVariants}
              </p>
            </div>
          </div>
        </CardHeader>
      )}

      {(expanded || !compact) && (
        <CardContent className="pt-0">
          {/* Search and Filters */}
          <div className="space-y-4 mb-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by item code, color, size, material..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10"
                />
              </div>
              {uniqueColors.length > 0 && (
                <select
                  value={filterColor}
                  onChange={(e) => {
                    setFilterColor(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 border rounded-md text-sm"
                >
                  <option value="">All Colors</option>
                  {uniqueColors.map(color => (
                    <option key={color} value={color}>{color}</option>
                  ))}
                </select>
              )}
              {uniqueSizes.length > 0 && (
                <select
                  value={filterSize}
                  onChange={(e) => {
                    setFilterSize(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 border rounded-md text-sm"
                >
                  <option value="">All Sizes</option>
                  {uniqueSizes.map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              )}
              {(filterColor || filterSize || searchTerm) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterColor('');
                    setFilterSize('');
                    setCurrentPage(1);
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>

            {filteredItems.length !== items.length && (
              <div className="text-sm text-gray-600">
                Showing {filteredItems.length} of {items.length} items
              </div>
            )}
          </div>

          {/* Items Table */}
          <div className="border rounded-lg overflow-hidden">
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-gray-100 z-10">
                  <TableRow>
                    <TableHead className="font-semibold">Item Code</TableHead>
                    <TableHead className="font-semibold">Color</TableHead>
                    <TableHead className="font-semibold">Size</TableHead>
                    <TableHead className="font-semibold text-right">Quantity</TableHead>
                    <TableHead className="font-semibold">Secondary Code</TableHead>
                    <TableHead className="font-semibold">Material</TableHead>
                    {!compact && <TableHead className="font-semibold">Decimal Value</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={compact ? 6 : 7} className="text-center text-gray-500 py-8">
                        No items found matching your filters
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedItems.map((item, index) => (
                      <TableRow key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <TableCell className="font-mono text-sm">{item.item_code}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-gray-50">
                            {item.color}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{item.size}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {item.quantity?.toLocaleString() || '0'}
                        </TableCell>
                        <TableCell className="font-mono text-sm text-gray-600">
                          {item.secondary_code || '-'}
                        </TableCell>
                        <TableCell className="text-gray-600">{item.material || '-'}</TableCell>
                        {!compact && (
                          <TableCell className="text-gray-600">
                            {(() => {
                              const decimalVal = item.decimal_value;
                              if (decimalVal === undefined || decimalVal === null || decimalVal === '') {
                                return '-';
                              }
                              const numVal = typeof decimalVal === 'number' 
                                ? decimalVal 
                                : parseFloat(String(decimalVal));
                              return isNaN(numVal) ? '-' : numVal.toFixed(2);
                            })()}
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t">
                <div className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}

            {/* Show more indicator */}
            {filteredItems.length > maxItems && (
              <div className="px-4 py-2 text-center text-xs text-gray-500 bg-gray-50 border-t">
                Showing first {maxItems} of {filteredItems.length} items
              </div>
            )}
          </div>

          {/* File Info */}
          {itemSpecifications.excel_file_name && (
            <div className="mt-4 text-xs text-gray-600 flex items-center gap-2">
              <span className="font-medium">File:</span>
              <span>{itemSpecifications.excel_file_name}</span>
              {itemSpecifications.excel_file_link && (
                <a
                  href={itemSpecifications.excel_file_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  (View Original)
                </a>
              )}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default ItemSpecificationsDisplay;

