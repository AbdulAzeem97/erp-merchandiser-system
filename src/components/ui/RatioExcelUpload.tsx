import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Download,
  BarChart3,
  TrendingUp,
  Package,
  Calculator,
  Eye,
  X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { RatioExcelParser, ParsedRatioData } from '@/utils/ratioExcelParser';

interface RatioExcelUploadProps {
  value?: string;
  onChange: (excelLink: string, parsedData?: ParsedRatioData) => void;
  parsedData?: ParsedRatioData;
  label?: string;
  className?: string;
}

const RatioExcelUpload: React.FC<RatioExcelUploadProps> = ({
  value = '',
  onChange,
  parsedData,
  label = 'Ratio Excel Report',
  className = ''
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewData, setPreviewData] = useState<ParsedRatioData | null>(null);
  const [excelContent, setExcelContent] = useState('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
      toast.error('Please upload an Excel file (.xlsx or .xls)');
      return;
    }

    setIsProcessing(true);
    try {
      // Parse the Excel file using the xlsx library
      const parsed = await RatioExcelParser.parseExcelFile(file);
      
      if (!parsed) {
        toast.error('Failed to parse Excel data');
        setIsProcessing(false);
        return;
      }
      
      setPreviewData(parsed);
      setExcelContent(file.name);
      toast.success('Excel file parsed successfully!');
      
    } catch (error) {
      console.error('Error processing Excel:', error);
      toast.error('Error processing Excel file');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleSaveData = () => {
    if (previewData) {
      // In a real implementation, you would upload the Excel file to Google Drive here
      // For now, we'll simulate it
      const excelLink = `https://drive.google.com/file/d/sample-ratio-excel-${Date.now()}/view`;
      onChange(excelLink, previewData);
      toast.success('Ratio data saved successfully!');
      setPreviewData(null);
      setExcelContent('');
    }
  };

  const handleClearData = () => {
    setPreviewData(null);
    setExcelContent('');
    onChange('');
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <Label className="text-sm font-medium text-gray-700">{label}</Label>
      
      {/* Upload Area */}
      <Card className={`transition-all duration-200 ${
        isDragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200'
      }`}>
        <CardContent className="p-6">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
              isDragOver 
                ? 'border-blue-400 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className="space-y-4">
              <div className="flex justify-center">
                <Upload className={`w-12 h-12 ${isDragOver ? 'text-blue-500' : 'text-gray-400'}`} />
              </div>
              
              <div>
                <p className="text-lg font-medium text-gray-900">
                  Upload Ratio Excel Report
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Drag and drop your Excel file here, or click to browse
                </p>
              </div>
              
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="mt-4"
              >
                <FileText className="w-4 h-4 mr-2" />
                {isProcessing ? 'Processing...' : 'Choose File'}
              </Button>
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileInput}
                className="hidden"
              />
              
              <p className="text-xs text-gray-500">
                Supports Excel files (.xlsx, .xls) from ratio optimization software
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview Data */}
      <AnimatePresence>
        {previewData && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-green-200 bg-green-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center text-green-800">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Excel Ratio Data Parsed Successfully
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Summary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div className="text-center p-3 bg-white rounded-lg">
                    <Package className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                    <div className="text-2xl font-bold text-blue-600">{previewData.totalSheets}</div>
                    <div className="text-xs text-gray-600">Total Sheets</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg">
                    <BarChart3 className="w-6 h-6 mx-auto mb-2 text-green-500" />
                    <div className="text-2xl font-bold text-green-600">{previewData.totalPlates}</div>
                    <div className="text-xs text-gray-600">Total Plates</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg">
                    <TrendingUp className="w-6 h-6 mx-auto mb-2 text-purple-500" />
                    <div className="text-2xl font-bold text-purple-600">{previewData.productionEfficiency.toFixed(1)}%</div>
                    <div className="text-xs text-gray-600">Efficiency</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg">
                    <Calculator className="w-6 h-6 mx-auto mb-2 text-orange-500" />
                    <div className="text-2xl font-bold text-orange-600">{previewData.excessQuantity}</div>
                    <div className="text-xs text-gray-600">Excess Qty</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg">
                    <Package className="w-6 h-6 mx-auto mb-2 text-indigo-500" />
                    <div className="text-2xl font-bold text-indigo-600">{previewData.rawData?.summary?.requiredOrderQty || 0}</div>
                    <div className="text-xs text-gray-600">Required Qty</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg">
                    <Package className="w-6 h-6 mx-auto mb-2 text-teal-500" />
                    <div className="text-2xl font-bold text-teal-600">{previewData.rawData?.summary?.qtyProduced || 0}</div>
                    <div className="text-xs text-gray-600">Total Produced</div>
                  </div>
                </div>

                {/* Quick Color Details Preview */}
                <div className="mt-4">
                  <h5 className="text-sm font-semibold text-gray-700 mb-2">Color Details Preview</h5>
                  <div className="max-h-32 overflow-y-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-200 px-2 py-1 text-left">Color</th>
                          <th className="border border-gray-200 px-2 py-1 text-left">Size</th>
                          <th className="border border-gray-200 px-2 py-1 text-center">Plate</th>
                          <th className="border border-gray-200 px-2 py-1 text-center">Qty</th>
                          <th className="border border-gray-200 px-2 py-1 text-center">Excess</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.rawData?.colorDetails?.slice(0, 5).map((item: any, index: number) => (
                          <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="border border-gray-200 px-2 py-1">{item.color}</td>
                            <td className="border border-gray-200 px-2 py-1">{item.size}</td>
                            <td className="border border-gray-200 px-2 py-1 text-center font-semibold text-blue-600">{item.plate}</td>
                            <td className="border border-gray-200 px-2 py-1 text-center">{item.qtyProduced}</td>
                            <td className="border border-gray-200 px-2 py-1 text-center">
                              {item.excessQty > 0 ? (
                                <span className="text-orange-600">{item.excessQty}</span>
                              ) : (
                                <span className="text-green-600">0</span>
                              )}
                            </td>
                          </tr>
                        ))}
                        {previewData.rawData?.colorDetails?.length > 5 && (
                          <tr className="bg-blue-50">
                            <td colSpan={5} className="border border-gray-200 px-2 py-1 text-center text-blue-600 font-medium">
                              ... and {previewData.rawData.colorDetails.length - 5} more rows
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2 pt-4">
                  <Button
                    type="button"
                    onClick={() => setIsPreviewOpen(true)}
                    variant="outline"
                    className="flex-1"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Full Table View
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSaveData}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Save Data
                  </Button>
                  <Button
                    type="button"
                    onClick={handleClearData}
                    variant="outline"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Current Data Display */}
      {parsedData && (
        <Card className="border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div>
                  <p className="font-medium text-gray-900">Ratio Data Loaded</p>
                  <p className="text-sm text-gray-600">
                    {parsedData.totalSheets} sheets, {parsedData.totalPlates} plates, {parsedData.productionEfficiency.toFixed(1)}% efficiency
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700">
                Ready for Production
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview Modal */}
      {isPreviewOpen && previewData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Ratio Data Preview - Complete Analysis</CardTitle>
                <Button variant="ghost" onClick={() => setIsPreviewOpen(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600">{previewData.totalSheets}</div>
                  <div className="text-sm text-gray-600">Total Sheets</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-3xl font-bold text-green-600">{previewData.totalPlates}</div>
                  <div className="text-sm text-gray-600">Total Plates</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-3xl font-bold text-purple-600">{previewData.productionEfficiency.toFixed(1)}%</div>
                  <div className="text-sm text-gray-600">Efficiency</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-3xl font-bold text-orange-600">{previewData.excessQuantity}</div>
                  <div className="text-sm text-gray-600">Excess Qty</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-3xl font-bold text-indigo-600">{previewData.rawData?.summary?.requiredOrderQty || 0}</div>
                  <div className="text-sm text-gray-600">Required Qty</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-3xl font-bold text-teal-600">{previewData.rawData?.summary?.qtyProduced || 0}</div>
                  <div className="text-sm text-gray-600">Total Produced</div>
                </div>
              </div>

              {/* Plate Distribution */}
              <div>
                <h4 className="font-semibold mb-3">Plate Distribution</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(previewData.plateDistribution).map(([plate, data]) => (
                    <div key={plate} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Plate {plate}</span>
                        <Badge variant="outline">{data.sheets} sheets</Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        Colors: {data.colors.join(', ')}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        UPS: {data.totalUPS}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Color Details Table */}
              <div>
                <h4 className="font-semibold mb-3">Color Details</h4>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300 text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Color</th>
                        <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Size</th>
                        <th className="border border-gray-300 px-3 py-2 text-center font-semibold">Required Qty</th>
                        <th className="border border-gray-300 px-3 py-2 text-center font-semibold">Plate</th>
                        <th className="border border-gray-300 px-3 py-2 text-center font-semibold">UPS</th>
                        <th className="border border-gray-300 px-3 py-2 text-center font-semibold">Sheets</th>
                        <th className="border border-gray-300 px-3 py-2 text-center font-semibold">Qty Produced</th>
                        <th className="border border-gray-300 px-3 py-2 text-center font-semibold">Excess Qty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.rawData?.colorDetails?.map((item: any, index: number) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="border border-gray-300 px-3 py-2 font-medium">{item.color}</td>
                          <td className="border border-gray-300 px-3 py-2">{item.size}</td>
                          <td className="border border-gray-300 px-3 py-2 text-center">{item.requiredQty}</td>
                          <td className="border border-gray-300 px-3 py-2 text-center font-semibold text-blue-600">{item.plate}</td>
                          <td className="border border-gray-300 px-3 py-2 text-center">{item.ups}</td>
                          <td className="border border-gray-300 px-3 py-2 text-center">{item.sheets || '-'}</td>
                          <td className="border border-gray-300 px-3 py-2 text-center">{item.qtyProduced}</td>
                          <td className="border border-gray-300 px-3 py-2 text-center">
                            {item.excessQty > 0 ? (
                              <span className="text-orange-600 font-medium">{item.excessQty}</span>
                            ) : (
                              <span className="text-green-600">0</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {/* Total Summary Row */}
                      <tr className="bg-blue-50 border-t-2 border-blue-300">
                        <td className="border border-gray-300 px-3 py-2 font-bold text-gray-700">Total Summary</td>
                        <td className="border border-gray-300 px-3 py-2"></td>
                        <td className="border border-gray-300 px-3 py-2 text-center font-bold">
                          {previewData.rawData?.summary?.requiredOrderQty || 0}
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-center font-bold text-blue-600">
                          {previewData.totalPlates}
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-center font-bold">
                          {previewData.rawData?.summary?.totalUPS || 0}
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-center font-bold">
                          {previewData.totalSheets}
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-center font-bold">
                          {previewData.rawData?.summary?.qtyProduced || 0}
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-center font-bold">
                          {previewData.excessQuantity > 0 ? (
                            <span className="text-orange-600">{previewData.excessQuantity}</span>
                          ) : (
                            <span className="text-green-600">0</span>
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Color Efficiency */}
              <div>
                <h4 className="font-semibold mb-3">Color Efficiency Summary</h4>
                <div className="space-y-2">
                  {Object.entries(previewData.colorEfficiency).map(([colorSize, data]) => (
                    <div key={colorSize} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">{colorSize}</span>
                      <div className="flex items-center space-x-4">
                        <Badge variant={data.efficiency >= 90 ? "default" : "secondary"}>
                          {data.efficiency.toFixed(1)}%
                        </Badge>
                        {data.excessQty > 0 && (
                          <span className="text-xs text-orange-600">
                            +{data.excessQty} excess
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default RatioExcelUpload;
