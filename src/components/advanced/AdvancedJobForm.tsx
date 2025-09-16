import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Search, 
  Package, 
  Calendar, 
  User, 
  Upload, 
  Eye, 
  Download,
  FileText,
  Image as ImageIcon,
  X,
  CheckCircle,
  AlertCircle,
  Clock,
  MapPin,
  Phone,
  Mail,
  Building,
  Truck,
  DollarSign,
  BarChart3,
  Zap,
  Sparkles,
  Camera,
  Paperclip,
  MessageSquare
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { ProductMaster } from '../../types/erp';
import { PROCESS_SEQUENCES } from '../../data/processSequences';
import { generateJobCardPDF } from '../../utils/pdfGenerator';
import { productsAPI, jobsAPI, companiesAPI } from '@/services/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { fetchProcessSequence } from '../../utils/processSequenceUtils';
import { ProcessPreview } from '../ProcessPreview';

const MERCHANDISER_OPTIONS = ['Abdullah', 'Jaseem', 'Ali', 'Ahmed'];

// Designer options - will be fetched from API
const DESIGNER_OPTIONS = [
  { id: '62081101-7c55-4a1e-bdfb-980e64999a74', name: 'Emma Wilson', email: 'emma.wilson@horizonsourcing.com' },
  { id: '57c715e5-b409-4a3d-98f1-a37ab8b36215', name: 'James Brown', email: 'james.brown@horizonsourcing.com' },
  { id: 'c77488cf-fec8-4b5e-804a-23edcc644bb7', name: 'Lisa Garcia', email: 'lisa.garcia@horizonsourcing.com' }
];

interface AdvancedJobFormProps {
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
  customerInfo: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  shippingMethod: string;
  specialInstructions: string;
  companyId: string;
  merchandiser: string;
  assignedDesigner: string;
}


export const AdvancedJobForm: React.FC<AdvancedJobFormProps> = ({ 
  product: initialProduct, 
  onBack 
}) => {
  const [product, setProduct] = useState<ProductMaster | null>(initialProduct || null);
  const [savedProducts, setSavedProducts] = useState<SavedProduct[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [jobCardData, setJobCardData] = useState<JobCardData>({
    productCode: initialProduct?.product_item_code || '',
    poNumber: '',
    quantity: 1,
    deliveryDate: '',
    customerNotes: '',
    uploadedImages: [],
    customerInfo: {
      name: '',
      email: '',
      phone: '',
      address: ''
    },
    priority: 'Medium',
    shippingMethod: 'Standard',
    specialInstructions: '',
    companyId: '',
    merchandiser: '',
    assignedDesigner: ''
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [formProgress, setFormProgress] = useState(0);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [processSequence, setProcessSequence] = useState<any>(null);
  const [isLoadingProcessSequence, setIsLoadingProcessSequence] = useState(false);

  // Load products from API on component mount
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await productsAPI.getAll({ limit: 100 });
        setSavedProducts(response.products || []);
      } catch (error) {
        console.error('Failed to load products:', error);
        toast.error('Failed to load products');
      }
    };
    loadProducts();
  }, []);

  // Real-time validation
  useEffect(() => {
    const errors: string[] = [];
    
    if (!product) errors.push('Product selection required');
    if (!jobCardData.poNumber.trim()) errors.push('PO Number required');
    if (jobCardData.quantity <= 0) errors.push('Quantity must be greater than 0');
    if (!jobCardData.deliveryDate) errors.push('Delivery date required');
    if (!jobCardData.customerInfo.name.trim()) errors.push('Customer name required');
    if (!jobCardData.merchandiser.trim()) errors.push('Merchandiser required');
    if (!jobCardData.assignedDesigner.trim()) errors.push('Designer assignment required');

    setValidationErrors(errors);

    // Calculate progress
    const totalFields = 10; // Total required fields
    const completedFields = [
      product,
      jobCardData.poNumber.trim(),
      jobCardData.quantity > 0,
      jobCardData.deliveryDate,
      jobCardData.customerInfo.name.trim(),
      jobCardData.customerInfo.email.trim(),
      jobCardData.merchandiser.trim(),
      jobCardData.assignedDesigner.trim(),
      jobCardData.customerInfo.phone.trim(),
      jobCardData.customerInfo.address.trim()
    ].filter(Boolean).length;

    setFormProgress((completedFields / totalFields) * 100);
  }, [product, jobCardData]);

  // Smart search with debouncing
  useEffect(() => {
    if (searchTerm && searchTerm.length > 2) {
      const timer = setTimeout(() => {
        setShowSuggestions(true);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setShowSuggestions(false);
    }
  }, [searchTerm]);

  // Handle product selection from dropdown
  const handleProductSelection = async (productId: string) => {
    const selectedProduct = savedProducts.find(p => p.id === productId);
    if (selectedProduct) {
      setProduct(selectedProduct);
      setSelectedProductId(productId);
      setJobCardData(prev => ({ ...prev, productCode: selectedProduct.product_item_code }));
      setSearchTerm(selectedProduct.product_item_code);
      setShowSuggestions(false);
      
      // Fetch complete product info including saved process selections
      try {
        setIsLoadingProcessSequence(true);
        const completeInfo = await productsAPI.getCompleteProductInfo(selectedProduct.id);
        setProcessSequence(completeInfo.process_sequence);
      } catch (error) {
        console.error('Error loading complete product info:', error);
        // Fallback to filtered process sequence using the new utility function
        await fetchProcessSequence(selectedProduct.product_type, setProcessSequence, setIsLoadingProcessSequence, selectedProduct.id);
      } finally {
        setIsLoadingProcessSequence(false);
      }
      
      toast.success(`Product ${selectedProduct.product_item_code} loaded! ✨`);
    }
  };

  const handleProductSearch = async (code: string = jobCardData.productCode) => {
    if (!code.trim()) {
      toast.error('Please enter a product code');
      return;
    }

    setIsSearching(true);
    try {
      // Check authentication token
      const token = localStorage.getItem('authToken');
      console.log('Auth token exists:', !!token);
      console.log('Token length:', token?.length);
      
      // First try to find exact match by product code
      console.log('Searching for product code:', code);
      const response = await productsAPI.getAll({ 
        search: code,
        limit: 10 
      });
      
      console.log('Search API response:', response);
      console.log('Response products:', response.products);
      console.log('Products length:', response.products?.length || 0);
      
      // Look for exact product code match
      let foundProduct = null;
      if (response.products && response.products.length > 0) {
        console.log('All product codes found:', response.products.map(p => p.product_item_code));
        
        // Try to find exact match first
        foundProduct = response.products.find(p => p.product_item_code === code);
        console.log('Exact match found:', !!foundProduct);
        
        // If no exact match, use first result
        if (!foundProduct) {
          foundProduct = response.products[0];
          console.log('Using first result instead:', foundProduct.product_item_code);
        }
      }
      
      if (foundProduct) {
        setProduct(foundProduct);
        setSelectedProductId(foundProduct.id);
        setShowSuggestions(false);
        
        console.log('Found product:', foundProduct);
        console.log('Product fields:', Object.keys(foundProduct));
        
        // Fetch complete product info including saved process selections
        try {
          setIsLoadingProcessSequence(true);
          const completeInfo = await productsAPI.getCompleteProductInfo(foundProduct.id);
          console.log('Complete product info:', completeInfo);
          console.log('Complete info keys:', Object.keys(completeInfo));
          
          if (completeInfo.process_sequence) {
            setProcessSequence(completeInfo.process_sequence);
          } else {
            // Fallback to filtered process sequence using the new utility function
            await fetchProcessSequence(foundProduct.product_type, setProcessSequence, setIsLoadingProcessSequence, foundProduct.id);
          }
        } catch (processError) {
          console.error('Error loading complete product info:', processError);
          // Fallback to filtered process sequence using the new utility function
          await fetchProcessSequence(foundProduct.product_type, setProcessSequence, setIsLoadingProcessSequence, foundProduct.id);
        } finally {
          setIsLoadingProcessSequence(false);
        }
        
        toast.success(`Product ${foundProduct.product_item_code} found and loaded! ✨`);
      } else {
        toast.error('Product not found. Please create the product first.');
      }
      
    } catch (error) {
      console.error('Search error details:', error);
      console.error('Error message:', error.message);
      console.error('Error response:', error.response);
      console.error('Error status:', error.status);
      
      if (error.status === 401) {
        toast.error('Authentication required. Please log in again.');
      } else if (error.status === 404) {
        toast.error('Product not found. Please create the product first.');
      } else {
        toast.error(`Search failed: ${error.message || 'Unknown error'}`);
      }
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

  const handleCustomerInfoChange = (field: keyof JobCardData['customerInfo'], value: string) => {
    setJobCardData(prev => ({
      ...prev,
      customerInfo: {
        ...prev.customerInfo,
        [field]: value
      }
    }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const validFiles = files.filter(file => file.type.startsWith('image/'));
    if (validFiles.length !== files.length) {
      toast.error('Only image files are allowed');
      return;
    }

    const newPreviews = validFiles.map(file => URL.createObjectURL(file));
    
    setJobCardData(prev => ({
      ...prev,
      uploadedImages: [...prev.uploadedImages, ...validFiles]
    }));
    
    setImagePreviews(prev => [...prev, ...newPreviews]);
    toast.success(`${validFiles.length} image(s) uploaded successfully! 📎`);
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index]);
    
    setJobCardData(prev => ({
      ...prev,
      uploadedImages: prev.uploadedImages.filter((_, i) => i !== index)
    }));
    
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
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
        jobCardData: {
          ...jobCardData,
          customerName: jobCardData.customerInfo.name,
          salesman: jobCardData.merchandiser,
          jobCode: jobCardId
        },
        jobCardId
      });
      
      toast.success('PDF generated and downloaded successfully! 📄');
    } catch (error) {
      console.error('PDF generation failed:', error);
      toast.error('Failed to generate PDF');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleSubmit = async () => {
    if (validationErrors.length > 0) {
      toast.error('Please fix all validation errors');
      return;
    }

    if (!product || !product.id) {
      toast.error('Product is required');
      return;
    }

    if (!jobCardData.deliveryDate) {
      toast.error('Delivery date is required');
      return;
    }

    // Validate date format
    const deliveryDate = new Date(jobCardData.deliveryDate);
    if (isNaN(deliveryDate.getTime())) {
      toast.error('Invalid delivery date format');
      return;
    }

    if (jobCardData.quantity < 1) {
      toast.error('Quantity must be at least 1');
      return;
    }

    setIsGeneratingPDF(true);
    try {
      // Prepare job data for API
      const jobData: any = {
        job_card_id: `JC-${Date.now()}`, // Generate unique job card ID
        product_id: product.id,
        po_number: jobCardData.poNumber,
        quantity: jobCardData.quantity,
        delivery_date: deliveryDate.toISOString(),
        target_date: deliveryDate.toISOString(),
        customer_notes: jobCardData.customerNotes,
        special_instructions: jobCardData.specialInstructions,
        priority: jobCardData.priority.toUpperCase(),
        status: 'PENDING',
        merchandiser: jobCardData.merchandiser,
        customer_name: jobCardData.customerInfo.name,
        customer_email: jobCardData.customerInfo.email,
        customer_phone: jobCardData.customerInfo.phone,
        customer_address: jobCardData.customerInfo.address
      };

      // Only include company_id if it has a valid value
      if (jobCardData.companyId && jobCardData.companyId.trim() !== '') {
        jobData.company_id = jobCardData.companyId;
      }

      // Log the job data being sent
      console.log('Sending job data:', jobData);
      
      // Save job to API
      const savedJob = await jobsAPI.create(jobData);
      
      // Create prepress job automatically
      if (jobCardData.assignedDesigner) {
        try {
          const prepressJobData = {
            jobCardId: savedJob.job.id, // Use the actual job ID from the saved job
            assignedDesignerId: jobCardData.assignedDesigner,
            priority: jobCardData.priority.toUpperCase() === 'URGENT' ? 'CRITICAL' : jobCardData.priority.toUpperCase(),
            dueDate: deliveryDate.toISOString()
          };
          
          console.log('Creating prepress job:', prepressJobData);
          
          // Create prepress job via API
          const prepressJob = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3002'}/api/prepress/jobs`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify(prepressJobData)
          });
          
          if (prepressJob.ok) {
            const createdPrepressJob = await prepressJob.json();
            console.log('Prepress job created:', createdPrepressJob);
            toast.success(`Job assigned to designer successfully! 🎨`);
          } else {
            console.error('Failed to create prepress job:', await prepressJob.text());
            toast.warning('Job created but designer assignment failed');
          }
        } catch (prepressError) {
          console.error('Error creating prepress job:', prepressError);
          toast.warning('Job created but designer assignment failed');
        }
      }
      
      // Generate PDF
      await handleGeneratePDF();
      
      toast.success(`Job Card ${savedJob.job_card_id} created successfully! 🎉`);
      console.log('Job saved:', savedJob);
      onBack();
    } catch (error) {
      toast.error(`Failed to create job card: ${error.message}`);
      console.error('Submit error:', error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgent': return 'bg-red-100 text-red-800 border-red-300';
      case 'High': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'Medium': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Low': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (showPreview) {
    return (
      <motion.div 
        className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="max-w-5xl mx-auto px-6 py-8">
          <Card className="bg-white/80 backdrop-blur-lg shadow-2xl border-white/30">
            <CardHeader className="pb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                    <Eye className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Job Card Preview</CardTitle>
                    <p className="text-gray-600">Review all details before final submission</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Button variant="outline" onClick={() => setShowPreview(false)}>
                    ← Edit Details
                  </Button>
                  <Button 
                    onClick={handleSubmit}
                    disabled={isGeneratingPDF}
                    className="gap-2 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                  >
                    {isGeneratingPDF ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Generating PDF...
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4" />
                        Generate PDF & Submit
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Customer & Job Overview */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="w-5 h-5 text-blue-600" />
                      Customer Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">{jobCardData.customerInfo.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">{jobCardData.customerInfo.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">{jobCardData.customerInfo.phone}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-gray-500 mt-1" />
                      <span className="text-sm text-gray-600">{jobCardData.customerInfo.address}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Package className="w-5 h-5 text-green-600" />
                      Job Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Product Code:</span>
                      <span className="font-mono font-medium">{product?.productItemCode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">PO Number:</span>
                      <span className="font-medium">{jobCardData.poNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Quantity:</span>
                      <span className="font-medium">{jobCardData.quantity.toLocaleString()} units</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Priority:</span>
                      <Badge className={getPriorityColor(jobCardData.priority)}>
                        {jobCardData.priority}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Product Information */}
              {product && (
                <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-purple-600" />
                      Product Specifications
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Main Product Details */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-3 bg-white/50 rounded-lg">
                          <div className="font-medium text-purple-800">{product.brand}</div>
                          <div className="text-sm text-gray-600">Brand</div>
                        </div>
                        <div className="text-center p-3 bg-white/50 rounded-lg">
                          <div className="font-medium text-purple-800">{product.material_name || product.material || 'N/A'}</div>
                          <div className="text-sm text-gray-600">Material</div>
                        </div>
                        <div className="text-center p-3 bg-white/50 rounded-lg">
                          <div className="font-medium text-purple-800">{product.gsm} g/m²</div>
                          <div className="text-sm text-gray-600">GSM</div>
                        </div>
                        <div className="text-center p-3 bg-white/50 rounded-lg">
                          <div className="font-medium text-purple-800">{product.product_type}</div>
                          <div className="text-sm text-gray-600">Type</div>
                        </div>
                      </div>
                      
                      {/* Additional Product Details */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {product.fsc && (
                          <div className="text-center p-3 bg-white/50 rounded-lg">
                            <div className="font-medium text-purple-800">{product.fsc}</div>
                            <div className="text-sm text-gray-600">FSC</div>
                          </div>
                        )}
                        {product.fsc_claim && (
                          <div className="text-center p-3 bg-white/50 rounded-lg">
                            <div className="font-medium text-purple-800">{product.fsc_claim}</div>
                            <div className="text-sm text-gray-600">FSC Claim</div>
                          </div>
                        )}
                        {product.color_specifications && (
                          <div className="text-center p-3 bg-white/50 rounded-lg">
                            <div className="font-medium text-purple-800">{product.color_specifications}</div>
                            <div className="text-sm text-gray-600">Color</div>
                          </div>
                        )}
                      </div>
                      
                      {/* Product Code and Category */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-white/70 rounded-lg border border-purple-200">
                          <div className="font-bold text-purple-900">{product.product_item_code}</div>
                          <div className="text-sm text-gray-600">Product Code</div>
                        </div>
                        {product.category_name && (
                          <div className="text-center p-3 bg-white/70 rounded-lg border border-purple-200">
                            <div className="font-medium text-purple-800">{product.category_name}</div>
                            <div className="text-sm text-gray-600">Category</div>
                          </div>
                        )}
                      </div>
                      
                      {/* Remarks */}
                      {product.remarks && (
                        <div className="p-3 bg-white/70 rounded-lg border border-purple-200">
                          <div className="text-sm text-gray-600 mb-1">Remarks:</div>
                          <div className="text-purple-800">{product.remarks}</div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Process and Department Flow */}
              {product && processSequence?.steps?.length > 0 && (
                <ProcessPreview 
                  selectedProductType={product.product_type}
                  selectedProcessSteps={processSequence.steps}
                />
              )}

              {/* Images */}
              {imagePreviews.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ImageIcon className="w-5 h-5 text-indigo-600" />
                      Attached Images ({imagePreviews.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={preview}
                            alt={`Attachment ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border-2 border-gray-200 group-hover:border-indigo-400 transition-colors"
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <motion.div 
          className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 mb-8 border border-white/20 shadow-xl"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onBack} 
                className="gap-2 hover:bg-white/80"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Advanced Job Card
                </h1>
                <p className="text-gray-600">Create production job order with smart features</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Progress Circle */}
              <div className="relative w-16 h-16">
                <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    d="m18,2.0845 a 15.9155,15.9155 0 0,1 0,31.831 a 15.9155,15.9155 0 0,1 0,-31.831"
                    fill="none"
                    stroke="#E5E7EB"
                    strokeWidth="2"
                  />
                  <path
                    d="m18,2.0845 a 15.9155,15.9155 0 0,1 0,31.831 a 15.9155,15.9155 0 0,1 0,-31.831"
                    fill="none"
                    stroke="url(#jobProgressGradient)"
                    strokeWidth="2"
                    strokeDasharray={`${formProgress}, 100`}
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="jobProgressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#10B981" />
                      <stop offset="100%" stopColor="#06B6D4" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-gray-700">{Math.round(formProgress)}%</span>
                </div>
              </div>
              
              <Button 
                onClick={() => setShowPreview(true)}
                disabled={validationErrors.length > 0}
                className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
              >
                <Eye className="w-4 h-4" />
                Preview & Submit
              </Button>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product Search */}
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-emerald-700">
                    <Search className="w-5 h-5" />
                    Smart Product Search
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Enter product code or search from recent products
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Saved Products Dropdown */}
                  <div className="space-y-2">
                    <Label>Select from Saved Products</Label>
                    <Select value={selectedProductId} onValueChange={handleProductSelection}>
                      <SelectTrigger className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
                        <SelectValue placeholder="Choose a saved product..." />
                      </SelectTrigger>
                      <SelectContent>
                        {savedProducts.length === 0 ? (
                          <div className="p-4 text-center text-gray-500">
                            <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p>No saved products found</p>
                            <p className="text-xs">Create a product first</p>
                          </div>
                        ) : (
                          savedProducts.map(product => (
                            <SelectItem key={product.id} value={product.id}>
                              <div className="flex items-center justify-between w-full">
                                <div>
                                                                <div className="font-mono font-medium">{product.product_item_code}</div>
                              <div className="text-sm text-gray-500">{product.brand} • {product.product_type}</div>
                                </div>
                                <div className="text-xs text-gray-400 ml-4">
                                  {product.updated_at ? new Date(product.updated_at).toLocaleDateString() : new Date(product.created_at || Date.now()).toLocaleDateString()}
                                </div>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="relative">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex-1 h-px bg-gray-200"></div>
                      <span className="text-xs text-gray-500 bg-white px-2">OR SEARCH BY CODE</span>
                      <div className="flex-1 h-px bg-gray-200"></div>
                    </div>
                    
                    <div className="flex gap-3">
                      <div className="flex-1 relative">
                        <Input
                          value={searchTerm || ''}
                          onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setJobCardData(prev => ({ ...prev, productCode: e.target.value }));
                          }}
                          placeholder="Enter product code (e.g., BR-00-139-A)"
                          className="font-mono pr-10"
                        />
                        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      </div>
                      <Button 
                        onClick={() => handleProductSearch()}
                        disabled={isSearching}
                        className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                      >
                        {isSearching ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Zap className="w-4 h-4" />
                        )}
                        {isSearching ? 'Searching...' : 'Search'}
                      </Button>
                    </div>

                    {/* Smart Suggestions */}
                    <AnimatePresence>
                      {showSuggestions && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-gray-200 shadow-xl z-10 max-h-60 overflow-y-auto"
                        >
                          <div className="p-2">
                            <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                              Recent Products
                            </div>
                            {savedProducts
                              .filter(p => 
                                (p.product_item_code || '').toLowerCase().includes((searchTerm || '').toLowerCase()) || 
                                (p.brand || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
                                (p.product_type || '').toLowerCase().includes((searchTerm || '').toLowerCase())
                              )
                              .slice(0, 5)
                              .map((product, index) => (
                              <motion.div
                                key={product.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="px-3 py-3 hover:bg-gray-50 cursor-pointer rounded-lg transition-colors"
                                onClick={() => handleProductSelection(product.id)}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="font-mono font-medium text-gray-900">{product.product_item_code}</div>
                                    <div className="text-sm text-gray-600">{product.brand} • {product.product_type}</div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-xs text-gray-500">{product.updated_at ? new Date(product.updated_at).toLocaleDateString() : new Date(product.created_at || Date.now()).toLocaleDateString()}</div>
                                    <div className="text-xs text-emerald-600">Saved Product</div>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Product Found */}
                  {product && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mt-4 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                        <span className="font-semibold text-emerald-800">Product Found & Loaded</span>
                      </div>
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                        <div><strong>Code:</strong> {product.product_item_code}</div>
                        <div><strong>Brand:</strong> {product.brand}</div>
                        <div><strong>Type:</strong> {product.product_type}</div>
                        <div><strong>Material:</strong> {product.material_name || 'N/A'}</div>
                        <div><strong>GSM:</strong> {product.gsm}</div>
                        <div><strong>Category:</strong> {product.category_name || 'N/A'}</div>
                        <div><strong>FSC:</strong> {product.fsc || 'N/A'}</div>
                        <div><strong>FSC Claim:</strong> {product.fsc_claim || 'N/A'}</div>
                        <div><strong>Color:</strong> {product.color_specifications || 'N/A'}</div>
                        {product.material_code && <div><strong>Material Code:</strong> {product.material_code}</div>}
                        {product.created_at && (
                          <div><strong>Created:</strong> {new Date(product.created_at).toLocaleDateString()}</div>
                        )}
                        {product.remarks && <div className="lg:col-span-3"><strong>Remarks:</strong> {product.remarks}</div>}
                      </div>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Job Details */}
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-700">
                    <Calendar className="w-5 h-5" />
                    Job Order Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="poNumber">PO Number *</Label>
                      <Input
                        id="poNumber"
                        value={jobCardData.poNumber}
                        onChange={(e) => handleInputChange('poNumber', e.target.value)}
                        placeholder="Enter PO number"
                        className={!jobCardData.poNumber.trim() && validationErrors.length > 0 ? 'border-red-300 bg-red-50' : ''}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantity *</Label>
                      <Input
                        id="quantity"
                        type="number"
                        value={jobCardData.quantity || ''}
                        onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 0)}
                        placeholder="Enter quantity"
                        className={jobCardData.quantity <= 0 && validationErrors.length > 0 ? 'border-red-300 bg-red-50' : ''}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="deliveryDate">Delivery Date *</Label>
                      <Input
                        id="deliveryDate"
                        type="date"
                        value={jobCardData.deliveryDate}
                        onChange={(e) => handleInputChange('deliveryDate', e.target.value)}
                        className={!jobCardData.deliveryDate && validationErrors.length > 0 ? 'border-red-300 bg-red-50' : ''}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="merchandiser">Created by Merchandiser *</Label>
                      <Select value={jobCardData.merchandiser} onValueChange={(value) => handleInputChange('merchandiser', value)}>
                        <SelectTrigger className={!jobCardData.merchandiser.trim() && validationErrors.length > 0 ? 'border-red-300 bg-red-50' : ''}>
                          <SelectValue placeholder="Select merchandiser responsible for this job order" />
                        </SelectTrigger>
                        <SelectContent>
                          {MERCHANDISER_OPTIONS.map((name) => (
                            <SelectItem key={name} value={name}>
                              {name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500">
                        This field records the merchandiser who initiated this job order.
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="assignedDesigner">Assign to Designer *</Label>
                      <Select value={jobCardData.assignedDesigner} onValueChange={(value) => handleInputChange('assignedDesigner', value)}>
                        <SelectTrigger className={!jobCardData.assignedDesigner.trim() && validationErrors.length > 0 ? 'border-red-300 bg-red-50' : ''}>
                          <SelectValue placeholder="Select designer for this job" />
                        </SelectTrigger>
                        <SelectContent>
                          {DESIGNER_OPTIONS.map((designer) => (
                            <SelectItem key={designer.id} value={designer.id}>
                              {designer.name} ({designer.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500">
                        This job will be automatically assigned to the selected designer after submission.
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Priority Level</Label>
                      <div className="flex gap-2">
                        {(['Low', 'Medium', 'High', 'Urgent'] as const).map((priority) => (
                          <button
                            key={priority}
                            onClick={() => handleInputChange('priority', priority)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                              jobCardData.priority === priority
                                ? getPriorityColor(priority) + ' border-2'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {priority}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Customer Information */}
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-700">
                    <User className="w-5 h-5" />
                    Customer Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="customerName">Customer Name *</Label>
                      <Input
                        id="customerName"
                        value={jobCardData.customerInfo.name}
                        onChange={(e) => handleCustomerInfoChange('name', e.target.value)}
                        placeholder="Enter customer name"
                        className={!jobCardData.customerInfo.name.trim() && validationErrors.length > 0 ? 'border-red-300 bg-red-50' : ''}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="customerEmail">Email Address</Label>
                      <Input
                        id="customerEmail"
                        type="email"
                        value={jobCardData.customerInfo.email}
                        onChange={(e) => handleCustomerInfoChange('email', e.target.value)}
                        placeholder="customer@example.com"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="customerPhone">Phone Number</Label>
                      <Input
                        id="customerPhone"
                        value={jobCardData.customerInfo.phone}
                        onChange={(e) => handleCustomerInfoChange('phone', e.target.value)}
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="shippingMethod">Shipping Method</Label>
                      <select
                        id="shippingMethod"
                        value={jobCardData.shippingMethod}
                        onChange={(e) => handleInputChange('shippingMethod', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="Standard">Standard Shipping</option>
                        <option value="Express">Express Shipping</option>
                        <option value="Overnight">Overnight</option>
                        <option value="Pickup">Customer Pickup</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="customerAddress">Delivery Address</Label>
                    <Textarea
                      id="customerAddress"
                      value={jobCardData.customerInfo.address}
                      onChange={(e) => handleCustomerInfoChange('address', e.target.value)}
                      placeholder="Enter full delivery address"
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* File Upload & Notes */}
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-700">
                    <Paperclip className="w-5 h-5" />
                    Attachments & Instructions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* File Upload */}
                  <div className="space-y-4">
                    <Label>Upload Reference Images</Label>
                    <div 
                      className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-orange-400 transition-colors cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">Click to upload images or drag and drop</p>
                      <p className="text-sm text-gray-500">PNG, JPG, GIF up to 10MB each</p>
                    </div>
                    
                    {/* Image Previews */}
                    {imagePreviews.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {imagePreviews.map((preview, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={preview}
                              alt={`Upload ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg border-2 border-gray-200"
                            />
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => removeImage(index)}
                              className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Special Instructions */}
                  <div className="space-y-2">
                    <Label htmlFor="specialInstructions" className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Special Instructions & Notes
                    </Label>
                    <Textarea
                      id="specialInstructions"
                      value={jobCardData.specialInstructions}
                      onChange={(e) => handleInputChange('specialInstructions', e.target.value)}
                      placeholder="Enter any special instructions, quality requirements, or additional notes..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <motion.div
            className="lg:col-span-1 space-y-6"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {/* Progress Summary */}
            <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200 sticky top-8">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-indigo-600" />
                  Form Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Completion</span>
                    <span className="text-sm font-semibold">{Math.round(formProgress)}%</span>
                  </div>
                  <Progress value={formProgress} className="h-2" />
                </div>

                {validationErrors.length > 0 && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      <span className="font-medium text-red-700">Validation Errors</span>
                    </div>
                    <ul className="text-sm text-red-600 space-y-1">
                      {validationErrors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <Button
                  onClick={() => setShowPreview(true)}
                  disabled={validationErrors.length > 0}
                  className="w-full gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                >
                  <Eye className="w-4 h-4" />
                  Preview Job Card
                </Button>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5 text-emerald-600" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Estimated Cost:</span>
                  <span className="font-semibold text-emerald-700">₹ 23,500</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Production Time:</span>
                  <span className="font-semibold text-blue-700">7-10 days</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Priority:</span>
                  <Badge className={getPriorityColor(jobCardData.priority)}>
                    {jobCardData.priority}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Process Flow Preview */}
            {product && processSequence && (
              <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Zap className="w-5 h-5 text-orange-600" />
                    Process Flow
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {(() => {
                      const filteredSteps = processSequence?.steps
                        ?.filter((step: any) => step.is_selected || step.isSelected || step.is_compulsory || step.isCompulsory);
                      return filteredSteps?.map((step, index) => (
                        <div key={step.id || `step-${index}`} className="flex items-center gap-2 text-sm">
                          <div className={`w-2 h-2 rounded-full ${
                            (step.isCompulsory || step.is_compulsory) ? 'bg-green-500' : 'bg-blue-500'
                          }`} />
                          <span className={(step.isCompulsory || step.is_compulsory) ? 'text-gray-900' : 'text-gray-700'}>
                            {step.name}
                          </span>
                        </div>
                      ));
                    })()}
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};