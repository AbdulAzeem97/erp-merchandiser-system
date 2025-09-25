
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, FileText, Upload, Eye, Search, Package, Calendar, User, Image as ImageIcon, X, Download } from 'lucide-react';
import { toast } from 'sonner';
import { ProductMaster } from '../types/erp';
import { PROCESS_SEQUENCES } from '../data/processSequences';
import { generateJobCardPDF, generatePreviewPDF } from '../utils/pdfGenerator';
import { productsAPI } from '../services/api';

const MERCHANDISER_OPTIONS = ['Abdullah', 'Jaseem', 'Ali', 'Ahmed'];

interface JobCardFormProps {
  product?: ProductMaster;
  onBack: () => void;
}

interface JobCardData {
  productCode: string;
  poNumber: string;
  quantity: number;
  deliveryDate: string;
  customerNotes: string;
  uploadedImages: File[];
  merchandiser: string;
}

export const JobCardForm: React.FC<JobCardFormProps> = ({ product: initialProduct, onBack }) => {
  const [product, setProduct] = useState<ProductMaster | null>(initialProduct || null);
  
  // Fetch complete product info when initial product is provided
  useEffect(() => {
    if (initialProduct && initialProduct.id) {
      const fetchCompleteInfo = async () => {
        try {
          const completeProductInfo = await productsAPI.getCompleteProductInfo(initialProduct.id);
          const productToUse = completeProductInfo.product || completeProductInfo || initialProduct;
          setProduct(productToUse);
          console.log('Loaded complete product info for initial product:', productToUse);
        } catch (error) {
          console.warn('Could not fetch complete product info for initial product:', error);
          // Keep the initial product as is
        }
      };
      fetchCompleteInfo();
    }
  }, [initialProduct]);
  const [jobCardData, setJobCardData] = useState<JobCardData>({
    productCode: initialProduct?.product_item_code || '',
    poNumber: '',
    quantity: 0,
    deliveryDate: '',
    customerNotes: '',
    uploadedImages: [],
    merchandiser: ''
  });
  const [isSearching, setIsSearching] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const [processSequence, setProcessSequence] = useState<any>(null);
  const [isLoadingProcessSequence, setIsLoadingProcessSequence] = useState(false);

  const fetchProcessSequence = async (productId: string) => {
    setIsLoadingProcessSequence(true);
    try {
      const completeInfo = await productsAPI.getCompleteProductInfo(productId);
      console.log('Fetched complete info:', completeInfo);
      console.log('Process sequence:', completeInfo.process_sequence);
      setProcessSequence(completeInfo.process_sequence);
    } catch (error) {
      console.error('Failed to fetch process sequence:', error);
      // Fallback to static data
      const fallbackSequence = PROCESS_SEQUENCES.find(seq => seq.product_type === product?.product_type);
      console.log('Using fallback sequence:', fallbackSequence);
      setProcessSequence(fallbackSequence);
    } finally {
      setIsLoadingProcessSequence(false);
    }
  };

  const handleProductSearch = async () => {
    if (!jobCardData.productCode.trim()) {
      toast.error('Please enter a product code');
      return;
    }

    setIsSearching(true);
    try {
      // First, search for the product by code
      const products = await productsAPI.getAll();
      const foundProduct = products.find(p => p.product_item_code === jobCardData.productCode);
      
      if (foundProduct) {
        // Get complete product information including material_name, category_name, etc.
        try {
          const completeProductInfo = await productsAPI.getCompleteProductInfo(foundProduct.id);
          console.log('Complete product info:', completeProductInfo);
          
          // Use the complete product info if available, otherwise fall back to basic product
          const productToUse = completeProductInfo.product || completeProductInfo || foundProduct;
          setProduct(productToUse);
          
          // Fetch the process sequence with selected steps
          await fetchProcessSequence(foundProduct.id);
          toast.success('Product found and loaded');
        } catch (completeInfoError) {
          console.warn('Could not fetch complete product info, using basic product:', completeInfoError);
          setProduct(foundProduct);
          await fetchProcessSequence(foundProduct.id);
          toast.success('Product found and loaded (basic info)');
        }
      } else {
        toast.error('Product not found');
      }
    } catch (error) {
      toast.error('Product not found');
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleInputChange = (field: keyof JobCardData, value: any) => {
    setJobCardData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // Validate file types
    const validFiles = files.filter(file => file.type.startsWith('image/'));
    if (validFiles.length !== files.length) {
      toast.error('Only image files are allowed');
      return;
    }

    // Create preview URLs
    const newPreviews = validFiles.map(file => URL.createObjectURL(file));
    
    setJobCardData(prev => ({
      ...prev,
      uploadedImages: [...prev.uploadedImages, ...validFiles]
    }));
    
    setImagePreviews(prev => [...prev, ...newPreviews]);
    toast.success(`${validFiles.length} image(s) uploaded`);
  };

  const removeImage = (index: number) => {
    // Revoke object URL to prevent memory leaks
    URL.revokeObjectURL(imagePreviews[index]);
    
    setJobCardData(prev => ({
      ...prev,
      uploadedImages: prev.uploadedImages.filter((_, i) => i !== index)
    }));
    
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    // Validation
    if (!product) {
      toast.error('Please search and select a product first');
      return;
    }
    if (!jobCardData.poNumber.trim()) {
      toast.error('PO Number is required');
      return;
    }
    if (jobCardData.quantity <= 0) {
      toast.error('Quantity must be greater than 0');
      return;
    }
    if (!jobCardData.deliveryDate) {
      toast.error('Delivery Date is required');
      return;
    }
    if (!jobCardData.merchandiser.trim()) {
      toast.error('Merchandiser is required');
      return;
    }

    console.log('Job Card Data:', { product, jobCardData });
    setShowPreview(true);
  };

  const handleGeneratePDF = async () => {
    if (!product) {
      toast.error('Product information is missing');
      return;
    }

    setIsGeneratingPDF(true);
    try {
      const jobCardId = `JC-${Date.now().toString().slice(-6)}`;
      
      // Use the fetched process sequence
      let completeProduct = product;
      if (product && processSequence) {
        completeProduct = {
          ...product,
          processSequence: processSequence
        };
      }
      
      await generateJobCardPDF({
        product: completeProduct,
        jobCardData,
        jobCardId
      });
      
      toast.success('PDF generated and downloaded successfully!');
    } catch (error) {
      console.error('PDF generation failed:', error);
      toast.error('Failed to generate PDF');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleGeneratePreviewPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      await generatePreviewPDF('job-card-preview');
      toast.success('Preview PDF generated and downloaded!');
    } catch (error) {
      console.error('Preview PDF generation failed:', error);
      toast.error('Failed to generate preview PDF');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const confirmJobCard = async () => {
    if (!product) {
      toast.error('Product information is missing');
      return;
    }

    // Generate PDF first
    await handleGeneratePDF();
    
    // Save to database (simulate)
    toast.success('Job Card created successfully!');
    console.log('Final Job Card:', { product, jobCardData });
    
    // Navigate back
    setShowPreview(false);
    onBack();
  };

  // Fetch process sequence when product is loaded
  useEffect(() => {
    if (product?.id && !processSequence) {
      fetchProcessSequence(product.id);
    }
  }, [product?.id]);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      imagePreviews.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  if (showPreview) {
    const jobCardId = `JC-${Date.now().toString().slice(-6)}`;
    const currentDate = new Date().toLocaleDateString();
    const estimatedCompletionDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString();
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-slate-100 p-6">
        <div className="max-w-6xl mx-auto space-y-6" id="job-card-preview">
          <div className="flex items-center justify-between bg-card rounded-lg p-6 border shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Eye className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-foreground">Detailed Job Card Preview</h1>
                <p className="text-sm text-muted-foreground">Job ID: {jobCardId} • Created: {currentDate}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowPreview(false)}>
                ← Edit Details
              </Button>
              <Button 
                variant="outline" 
                onClick={handleGeneratePreviewPDF} 
                disabled={isGeneratingPDF}
                className="gap-2 border-blue-300 text-blue-600 hover:bg-blue-50"
              >
                <Download className="w-4 h-4" />
                {isGeneratingPDF ? 'Generating...' : 'Download Preview PDF'}
              </Button>
              <Button 
                onClick={confirmJobCard} 
                disabled={isGeneratingPDF}
                className="gap-2 bg-green-600 hover:bg-green-700"
              >
                <FileText className="w-4 h-4" />
                {isGeneratingPDF ? 'Generating...' : 'Generate PDF & Submit'}
              </Button>
            </div>
          </div>

          {/* Header Info Card */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl text-blue-800">Job Card #{jobCardId}</CardTitle>
                  <p className="text-blue-600">ERP Job Management System</p>
                </div>
                <div className="text-right text-sm text-blue-700">
                  <p><strong>Created:</strong> {currentDate}</p>
                  <p><strong>Created by:</strong> {jobCardData.merchandiser}</p>
                  <p><strong>Status:</strong> <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge></p>
                </div>
              </div>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Job Details - Enhanced */}
            <Card className="lg:col-span-1">
              <CardHeader className="bg-blue-50">
                <CardTitle className="flex items-center gap-2 text-blue-800">
                  <FileText className="w-5 h-5" />
                  Job Order Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="grid grid-cols-1 gap-3">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Product Code</p>
                    <p className="font-mono text-lg font-semibold text-gray-900">{product?.product_item_code}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">PO Number</p>
                    <p className="text-lg font-semibold text-gray-900">{jobCardData.poNumber}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-xs font-medium text-green-600 uppercase tracking-wide">Quantity</p>
                      <p className="text-lg font-bold text-green-800">{jobCardData.quantity.toLocaleString()}</p>
                    </div>
                    <div className="p-3 bg-orange-50 rounded-lg">
                      <p className="text-xs font-medium text-orange-600 uppercase tracking-wide">Priority</p>
                      <p className="text-lg font-bold text-orange-800">Standard</p>
                    </div>
                  </div>
                  <div className="p-3 bg-red-50 rounded-lg">
                    <p className="text-xs font-medium text-red-600 uppercase tracking-wide">Delivery Date</p>
                    <p className="text-lg font-semibold text-red-800">{new Date(jobCardData.deliveryDate).toLocaleDateString()}</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="text-xs font-medium text-purple-600 uppercase tracking-wide">Est. Completion</p>
                    <p className="text-lg font-semibold text-purple-800">{estimatedCompletionDate}</p>
                  </div>
                </div>
                {jobCardData.customerNotes && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-xs font-medium text-yellow-700 uppercase tracking-wide mb-2">Customer Notes</p>
                    <p className="text-sm text-yellow-800 leading-relaxed">{jobCardData.customerNotes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Product Specifications - Enhanced */}
            <Card className="lg:col-span-1">
              <CardHeader className="bg-green-50">
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <Package className="w-5 h-5" />
                  Product Specifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="text-sm font-medium text-gray-600">Brand</span>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">{product?.brand}</Badge>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="text-sm font-medium text-gray-600">Material</span>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">{product?.material_name || 'N/A'}</Badge>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="text-sm font-medium text-gray-600">GSM</span>
                    <Badge variant="outline" className="font-mono">{product?.gsm}</Badge>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="text-sm font-medium text-gray-600">Product Type</span>
                    <Badge variant="secondary" className="bg-purple-100 text-purple-800">{product?.product_type}</Badge>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="text-sm font-medium text-gray-600">Category</span>
                    <Badge variant="secondary" className="bg-orange-100 text-orange-800">{product?.category_name || 'N/A'}</Badge>
                  </div>
                </div>
                
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs font-medium text-blue-700 uppercase tracking-wide mb-2">Color Specification</p>
                  <p className="text-sm text-blue-800">{product?.color_specifications || product?.color || 'As per Approved Sample/Artwork'}</p>
                </div>
                
                {product?.remarks && (
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-xs font-medium text-gray-700 uppercase tracking-wide mb-2">Remarks</p>
                    <p className="text-sm text-gray-800">{product?.remarks}</p>
                  </div>
                )}
                
                <div className="flex gap-2 flex-wrap">
                  <Badge variant={product?.fsc === 'Yes' ? 'default' : 'secondary'} className="px-3 py-1">
                    FSC: {product?.fsc}
                  </Badge>
                  {product?.fsc === 'Yes' && product?.fsc_claim && (
                    <Badge variant="outline" className="px-3 py-1">{product?.fsc_claim}</Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Process Flow & Timeline */}
            <Card className="lg:col-span-1">
              <CardHeader className="bg-purple-50">
                <CardTitle className="flex items-center gap-2 text-purple-800">
                  <User className="w-5 h-5" />
                  Process Flow - {product?.product_type}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  {isLoadingProcessSequence ? (
                    <div className="text-center py-4 text-gray-500">Loading process steps...</div>
                  ) : (
                    (() => {
                      console.log('Process sequence in display:', processSequence);
                      console.log('All steps:', processSequence?.steps);
                      const filteredSteps = processSequence?.steps
                        ?.filter((step: any) => step.is_selected || step.isSelected || step.is_compulsory || step.isCompulsory);
                      console.log('Filtered steps:', filteredSteps);
                      return filteredSteps?.map((step: any, index: number) => (
                        <div 
                          key={step.id} 
                          className="flex items-center gap-3 p-3 rounded-lg border-l-4 bg-purple-50 border-l-purple-500 border border-purple-200"
                        >
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-purple-500 text-white">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <span className="font-medium text-gray-900">{step.name}</span>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="default" className="text-xs bg-purple-500">
                                Process Step
                              </Badge>
                              <span className="text-xs text-gray-500">Est. 2-4 hrs</span>
                            </div>
                          </div>
                        </div>
                      ));
                    })()
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cost Estimation */}
          <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200">
            <CardHeader>
              <CardTitle className="text-yellow-800">Cost Estimation & Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-white rounded-lg border">
                  <div className="text-2xl font-bold text-green-600">₹ 12,500</div>
                  <div className="text-sm text-gray-500">Material Cost</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg border">
                  <div className="text-2xl font-bold text-blue-600">₹ 8,200</div>
                  <div className="text-sm text-gray-500">Labor Cost</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg border">
                  <div className="text-2xl font-bold text-purple-600">7-10 Days</div>
                  <div className="text-sm text-gray-500">Production Time</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg border border-2 border-orange-300">
                  <div className="text-2xl font-bold text-orange-600">₹ 20,700</div>
                  <div className="text-sm text-gray-500">Total Estimate</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {jobCardData.uploadedImages.length > 0 && (
            <Card>
              <CardHeader className="bg-indigo-50">
                <CardTitle className="text-indigo-800">
                  📎 Attached Files & Images ({jobCardData.uploadedImages.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Attachment ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border-2 border-gray-200 group-hover:border-indigo-400 transition-colors"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg transition-all flex items-center justify-center">
                        <span className="text-white text-xs opacity-0 group-hover:opacity-100">View</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Footer */}
          <Card className="bg-gray-50 border-gray-200">
            <CardContent className="p-4">
              <div className="flex justify-between items-center text-sm text-gray-600">
                <p>Generated by ERP Job Management System</p>
                <p>Page 1 of 1 • {new Date().toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between bg-card rounded-lg p-6 border shadow-sm">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={onBack} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Create Job Card</h1>
              <p className="text-sm text-muted-foreground">Job Order Management System</p>
            </div>
          </div>
          <Button onClick={handleSubmit} className="gap-2">
            <Eye className="w-4 h-4" />
            Preview & Submit
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Product Search & Job Details */}
          <div className="space-y-6">
            <Card className="border-2 border-dashed border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Search className="w-5 h-5" />
                  Product Search & Lookup
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Enter product code to fetch existing product information
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label htmlFor="productCode">Product Code</Label>
                    <Input
                      id="productCode"
                      value={jobCardData.productCode}
                      onChange={(e) => handleInputChange('productCode', e.target.value)}
                      placeholder="Enter product code (e.g., BR-00-139-A)"
                      className="font-mono"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button 
                      onClick={handleProductSearch}
                      disabled={isSearching}
                      className="gap-2"
                    >
                      <Search className="w-4 h-4" />
                      {isSearching ? 'Searching...' : 'Search'}
                    </Button>
                  </div>
                </div>
                
                {product && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="w-4 h-4 text-green-600" />
                      <span className="font-medium text-green-800">Product Found</span>
                    </div>
                    <p className="text-sm text-green-700">
                      {product.product_item_code} - {product.brand} ({product.product_type})
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Job Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="poNumber">PO Number *</Label>
                  <Input
                    id="poNumber"
                    value={jobCardData.poNumber}
                    onChange={(e) => handleInputChange('poNumber', e.target.value)}
                    placeholder="Enter PO number"
                  />
                </div>
                
                <div>
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={jobCardData.quantity || ''}
                    onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 0)}
                    placeholder="Enter quantity"
                  />
                </div>
                
                <div>
                  <Label htmlFor="deliveryDate">Delivery Date *</Label>
                  <Input
                    id="deliveryDate"
                    type="date"
                    value={jobCardData.deliveryDate}
                    onChange={(e) => handleInputChange('deliveryDate', e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="merchandiser">Created by Merchandiser *</Label>
                  <Select value={jobCardData.merchandiser} onValueChange={(value) => handleInputChange('merchandiser', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Please select the merchandiser who is responsible for creating this job order" />
                    </SelectTrigger>
                    <SelectContent>
                      {MERCHANDISER_OPTIONS.map((name) => (
                        <SelectItem key={name} value={name}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    This field records the merchandiser who initiated this job order.
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="customerNotes">Customer Notes</Label>
                  <Textarea
                    id="customerNotes"
                    value={jobCardData.customerNotes}
                    onChange={(e) => handleInputChange('customerNotes', e.target.value)}
                    placeholder="Additional instructions or notes"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  Image Upload
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="imageUpload">Upload Images</Label>
                  <div className="mt-2">
                    <input
                      id="imageUpload"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById('imageUpload')?.click()}
                      className="w-full gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      Choose Images
                    </Button>
                  </div>
                </div>
                
                {jobCardData.uploadedImages.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">
                      Uploaded Images ({jobCardData.uploadedImages.length})
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative">
                          <img
                            src={preview}
                            alt={`Upload ${index + 1}`}
                            className="w-full h-20 object-cover rounded border"
                          />
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removeImage(index)}
                            className="absolute top-1 right-1 w-6 h-6 p-0"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Product Summary & Process Flow */}
          {product && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Product Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Product Code</p>
                    <p className="font-mono text-sm">{product.product_item_code}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Brand</p>
                    <p className="text-sm">{product.brand}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Material</p>
                    <p className="text-sm">{product.material}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">GSM</p>
                    <p className="text-sm">{product.gsm}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Color</p>
                    <p className="text-sm">{product.color}</p>
                  </div>
                  {product.remarks && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Remarks</p>
                      <p className="text-sm">{product.remarks}</p>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Badge variant={product.fsc === 'Yes' ? 'default' : 'secondary'}>
                      FSC: {product.fsc}
                    </Badge>
                    {product.fsc === 'Yes' && product.fsc_claim && (
                      <Badge variant="outline">{product.fsc_claim}</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Process Flow - {product.product_type}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {(() => {
                      const filteredSteps = processSequence?.steps
                        ?.filter((step: any) => step.is_selected || step.isSelected || step.is_compulsory || step.isCompulsory);
                      return filteredSteps?.map((step, index) => (
                        <div 
                          key={step.id} 
                          className={`flex items-center gap-3 p-2 rounded-lg border ${
                            step.is_compulsory || step.isCompulsory
                              ? 'bg-primary/5 border-primary/20' 
                              : 'bg-muted/50'
                          }`}
                        >
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            step.is_compulsory || step.isCompulsory ? 'bg-primary text-primary-foreground' : 'bg-muted-foreground/20'
                          }`}>
                            <span className="text-xs font-medium">{index + 1}</span>
                          </div>
                          <span className="text-sm font-medium flex-1">{step.name}</span>
                          <Badge 
                            variant={step.is_compulsory || step.isCompulsory ? 'default' : 'outline'} 
                            className="text-xs"
                          >
                            {step.is_compulsory || step.isCompulsory ? 'Required' : 'Selected'}
                          </Badge>
                        </div>
                      ));
                    })()}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
