import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Download,
  Eye,
  X,
  FileSpreadsheet,
  Package,
  Palette,
  Ruler,
  Hash
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { getApiUrl } from '@/utils/apiConfig';
import * as XLSX from 'xlsx';

interface ItemSpecificationsExcelUploadProps {
  value?: string;
  onChange: (excelLink: string, parsedData: any) => void;
  parsedData?: any;
  label?: string;
  required?: boolean;
}

// Parse Excel file for item specifications
// Expected format: Item Code, Color, Size, Secondary Code, Quantity, Decimal Value
const parseItemSpecificationsExcel = async (file: File): Promise<any> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        // Get first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON array (array of arrays)
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1, 
          defval: '',
          raw: false 
        }) as any[][];
        
        console.log('📊 Excel data loaded:', jsonData.length, 'rows');
        console.log('📊 First 5 rows:', jsonData.slice(0, 5));
        
        // Parse data - skip header row if exists, otherwise start from first row
        const items: any[] = [];
        const sizes = new Set<string>();
        const colors = new Set<string>();
        const materials = new Set<string>();
        let totalQuantity = 0;
        
        // Start from row 0 (assuming no header, or detect header)
        let startRow = 0;
        
        // Check if first row looks like headers (contains text like "Size", "Color", etc.)
        if (jsonData.length > 0) {
          const firstRow = jsonData[0].map((cell: any) => String(cell || '').toLowerCase().trim());
          const isHeader = firstRow.some(cell => 
            cell.includes('size') || cell.includes('color') || cell.includes('quantity')
          );
          if (isHeader) {
            startRow = 1;
            console.log('📊 Skipping header row');
          }
        }
        
        // Parse each row
        for (let i = startRow; i < jsonData.length; i++) {
          const row = jsonData[i];
          
          // Skip empty rows
          if (!row || row.length === 0 || row.every((cell: any) => !cell || String(cell).trim() === '')) {
            continue;
          }
          
          // Expected format: Item Code, Color, Size, Secondary Code, Quantity, Decimal Value
          // Columns: 0=ItemCode, 1=Color, 2=Size, 3=SecondaryCode, 4=Quantity, 5=DecimalValue
          const itemCode = String(row[0] || '').trim();
          const color = String(row[1] || '').trim();
          const size = String(row[2] || '').trim();
          const secondaryCode = String(row[3] || '').trim(); // This could be Material code
          const quantity = parseFloat(String(row[4] || '0')) || 0;
          const decimalValue = parseFloat(String(row[5] || '0')) || 0;
          
          // Skip if essential fields are missing
          if (!itemCode || !color || !size || quantity <= 0) {
            console.warn(`⚠️ Skipping row ${i + 1}: missing essential data`, row);
            continue;
          }
          
          // Collect unique values
          sizes.add(size);
          colors.add(color);
          if (secondaryCode) {
            materials.add(secondaryCode);
          }
          
          totalQuantity += quantity;
          
          items.push({
            itemCode,
            color,
            size,
            quantity,
            secondaryCode, // Material code or specification code
            decimalValue, // Could be weight, ratio, or other specification
            material: secondaryCode || 'N/A', // Map secondary code to material
            specifications: {
              itemCode,
              secondaryCode,
              decimalValue
            }
          });
        }
        
        console.log(`✅ Parsed ${items.length} items`);
        console.log(`📊 Sizes: ${Array.from(sizes).join(', ')}`);
        console.log(`📊 Colors: ${Array.from(colors).join(', ')}`);
        console.log(`📊 Total Quantity: ${totalQuantity}`);
        
        const parsedData = {
          fileName: file.name,
          uploadedAt: new Date().toISOString(),
          itemCount: items.length,
          items: items,
          specifications: {
            sizes: Array.from(sizes),
            colors: Array.from(colors),
            materials: Array.from(materials),
            quantities: items.map((item: any) => item.quantity)
          },
          summary: {
            totalItems: items.length,
            totalQuantity: totalQuantity,
            sizeVariants: sizes.size,
            colorVariants: colors.size,
            materialVariants: materials.size
          },
          rawData: jsonData // Keep raw data for reference
        };
        
        resolve(parsedData);
      } catch (error) {
        console.error('❌ Error parsing Excel:', error);
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsBinaryString(file);
  });
};

const ItemSpecificationsExcelUpload: React.FC<ItemSpecificationsExcelUploadProps> = ({
  value = '',
  onChange,
  parsedData,
  label = 'Item Specifications Excel File',
  required = false
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      toast.error('Please upload a valid Excel file (.xlsx or .xls)');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // First, parse the Excel file to validate and extract data
      setUploadProgress(10);
      let parsedData = null;
      try {
        parsedData = await parseItemSpecificationsExcel(file);
        setUploadProgress(30);
      } catch (parseError) {
        console.error('Error parsing Excel:', parseError);
        toast.error('Failed to parse Excel file. Please check the format.');
        throw parseError;
      }

      if (!parsedData || parsedData.itemCount === 0) {
        toast.error('Excel file is empty or no valid items found.');
        throw new Error('No valid items found in Excel file');
      }

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Create FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'item_specifications');

      // Upload to Google Drive/Server
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/upload/excel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: formData
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.ok) {
        const result = await response.json();
        
        // Include parsed data with the file URL
        onChange(result.fileUrl, parsedData);
        toast.success(`Item specifications uploaded successfully! ${parsedData.itemCount} items parsed 📊`);
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveFile = () => {
    onChange('', null);
    toast.info('File removed');
  };

  const handleViewFile = () => {
    if (parsedData && parsedData.items && parsedData.items.length > 0) {
      setIsViewModalOpen(true);
    } else {
      toast.info('No items data available to view');
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {value && (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Uploaded
          </Badge>
        )}
      </div>

      {!value ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          <Card className="border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <FileSpreadsheet className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Upload Item Specifications
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Upload Excel file containing item details: sizes, quantities, colors, materials, etc.
                </p>
                
                <div className="space-y-2 mb-4">
                  <div className="text-xs text-gray-500">
                    <strong>Expected format:</strong> Item Code, Color, Size, Secondary Code, Quantity, Decimal Value
                  </div>
                  <div className="text-xs text-gray-500">
                    <strong>Example:</strong> 200071419373, Black, XS, 7316030644125, 67, 0.1
                  </div>
                  <div className="text-xs text-gray-500">
                    <strong>Supported formats:</strong> .xlsx, .xls (Max 10MB)
                  </div>
                </div>

                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {isUploading ? 'Uploading...' : 'Choose Excel File'}
                </Button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              {isUploading && (
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <motion.div
                      className="bg-blue-600 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-2 text-center">
                    Uploading... {uploadProgress}%
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-green-50 border border-green-200 rounded-lg p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <FileText className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium text-green-800">
                  {parsedData?.fileName || 'Item Specifications.xlsx'}
                </h4>
                <p className="text-sm text-green-600">
                  {parsedData?.itemCount || 'Multiple'} items • {parsedData?.summary?.totalQuantity || 'Various'} total quantity
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewFile}
                className="border-green-300 text-green-700 hover:bg-green-100"
              >
                <Eye className="h-4 w-4 mr-1" />
                View
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRemoveFile}
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                <X className="h-4 w-4 mr-1" />
                Remove
              </Button>
            </div>
          </div>

          {parsedData && (
            <div className="mt-3 pt-3 border-t border-green-200">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-green-700 font-medium">Items:</span>
                  <div className="text-green-600">{parsedData.summary?.totalItems || 'N/A'}</div>
                </div>
                <div>
                  <span className="text-green-700 font-medium">Sizes:</span>
                  <div className="text-green-600">{parsedData.summary?.sizeVariants || 'N/A'}</div>
                </div>
                <div>
                  <span className="text-green-700 font-medium">Colors:</span>
                  <div className="text-green-600">{parsedData.summary?.colorVariants || 'N/A'}</div>
                </div>
                <div>
                  <span className="text-green-700 font-medium">Total Qty:</span>
                  <div className="text-green-600">{parsedData.summary?.totalQuantity || 'N/A'}</div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}

      <div className="text-xs text-gray-500">
        💡 This file contains detailed item specifications that will be used throughout the production workflow.
      </div>

      {/* View Items Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-6xl w-[95vw] max-h-[90vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-blue-600" />
              Item Specifications - {parsedData?.fileName || 'Excel File'}
            </DialogTitle>
            <DialogDescription>
              View all items from the uploaded Excel file ({parsedData?.itemCount || 0} items)
            </DialogDescription>
          </DialogHeader>
          
          <div className="px-6 pt-4 pb-6 flex-1 overflow-hidden flex flex-col">
          {/* Summary Stats */}
          {parsedData?.summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 flex-shrink-0">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Package className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-gray-600">Total Items</span>
                </div>
                <div className="text-2xl font-bold text-blue-600">{parsedData.summary.totalItems}</div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Hash className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-600">Total Quantity</span>
                </div>
                <div className="text-2xl font-bold text-green-600">{parsedData.summary.totalQuantity.toLocaleString()}</div>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Ruler className="h-4 w-4 text-purple-600" />
                  <span className="text-sm text-gray-600">Sizes</span>
                </div>
                <div className="text-2xl font-bold text-purple-600">{parsedData.summary.sizeVariants}</div>
              </div>
              <div className="bg-pink-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Palette className="h-4 w-4 text-pink-600" />
                  <span className="text-sm text-gray-600">Colors</span>
                </div>
                <div className="text-2xl font-bold text-pink-600">{parsedData.summary.colorVariants}</div>
              </div>
            </div>
          )}

          {/* Items Table - Scrollable */}
          <div className="flex-1 overflow-y-auto border rounded-lg min-h-0">
            <table className="w-full border-collapse">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="border-b border-gray-200 px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Item Code
                  </th>
                  <th className="border-b border-gray-200 px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Color
                  </th>
                  <th className="border-b border-gray-200 px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="border-b border-gray-200 px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Secondary Code
                  </th>
                  <th className="border-b border-gray-200 px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="border-b border-gray-200 px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Decimal Value
                  </th>
                  <th className="border-b border-gray-200 px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Material
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {parsedData?.items && parsedData.items.length > 0 ? (
                  parsedData.items.map((item: any, index: number) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-gray-900">
                        {item.itemCode}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge variant="outline" className="bg-gray-50">
                          {item.color}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {item.size}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-gray-600">
                        {item.secondaryCode || '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {item.quantity.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        {item.decimalValue || 0}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        {item.material || '-'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      No items data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer with close button */}
          <div className="flex justify-end gap-2 mt-4 pt-4 border-t flex-shrink-0">
            <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
              Close
            </Button>
          </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ItemSpecificationsExcelUpload;
