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
  FileSpreadsheet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface ItemSpecificationsExcelUploadProps {
  value?: string;
  onChange: (excelLink: string, parsedData: any) => void;
  parsedData?: any;
  label?: string;
  required?: boolean;
}

const ItemSpecificationsExcelUpload: React.FC<ItemSpecificationsExcelUploadProps> = ({
  value = '',
  onChange,
  parsedData,
  label = 'Item Specifications Excel File',
  required = false
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
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

      // Upload to Google Drive (simulated)
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/upload/excel`, {
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
        
        // Parse Excel data (simulated parsing)
        const mockParsedData = {
          fileName: file.name,
          uploadedAt: new Date().toISOString(),
          itemCount: Math.floor(Math.random() * 20) + 5, // Mock item count
          specifications: {
            sizes: ['S', 'M', 'L', 'XL'],
            colors: ['Red', 'Blue', 'Green', 'Black'],
            quantities: [100, 150, 200, 75],
            materials: ['Cotton', 'Polyester', 'Blend']
          },
          summary: {
            totalItems: Math.floor(Math.random() * 20) + 5,
            totalQuantity: Math.floor(Math.random() * 1000) + 500,
            sizeVariants: 4,
            colorVariants: 4
          }
        };

        onChange(result.fileUrl, mockParsedData);
        toast.success('Item specifications uploaded successfully! 📊');
      } else {
        throw new Error('Upload failed');
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
    if (value) {
      window.open(value, '_blank');
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
                    <strong>Expected columns:</strong> Size, Color, Quantity, Material, Specifications
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
    </div>
  );
};

export default ItemSpecificationsExcelUpload;
