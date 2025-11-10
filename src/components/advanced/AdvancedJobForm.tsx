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
import { productsAPI, jobsAPI, companiesAPI, usersAPI } from '@/services/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { fetchProcessSequence } from '../../utils/processSequenceUtils';
import { ProcessPreview } from '../ProcessPreview';
import RatioExcelUpload from '../ui/RatioExcelUpload';
import ItemSpecificationsExcelUpload from '../ui/ItemSpecificationsExcelUpload';

const MERCHANDISER_OPTIONS = ['Abdullah', 'Jaseem', 'Ali', 'Ahmed'];

// Designer options - will be fetched from API
const DESIGNER_OPTIONS = [
  { id: '8', name: 'Emma Wilson', email: 'emma.wilson@horizonsourcing.com' },
  { id: '9', name: 'Alex Kumar', email: 'alex.kumar@horizonsourcing.com' },
  { id: '10', name: 'Sarah Johnson', email: 'sarah.johnson@horizonsourcing.com' }
];

// Customer/Company names list
const CUSTOMER_NAMES = [
  'ABDUL WAHID OMER & COMPANY',
  'AL ABBAS GARMENTS ( PVT ) LTD',
  'AL KARAM TEXTILE MILLS ( PVT)',
  'CROWN TEXTILE',
  'GRACE APPAREL ( PVT ) LTD.',
  'ASAS APPAREL',
  'RAJBY INDUSTRIES',
  'YUNUS TEXTILE MILLS LIMITED',
  'CRESOX (PVT.) LIMITED',
  'NAJMA APPARELS',
  'SIDDIQSONS LIMITED ( DENIM )',
  'FRIENDS APPAREL',
  'SOORTY ENTERPRISES (PVT) LTD',
  'THE DYERS',
  'PELIKAN KNITWEAR',
  'MEZAN EXPORTS',
  'KLASH (PVT) LTD',
  'EASTERN GARMENTS (PVT) LTD',
  'ROYAL GARMENTS INDUSTRIES (PVT) L',
  'MIMA KNIT ( PVT ) LTD.',
  'NAZ TEXTILE PVT. LTD',
  'INTERLOOP LIMITED',
  'BUKSH INDUSTRIES (PVT) LTD',
  'POLANI TEXTILE',
  'KINGS APPARELS INDUSTRIES (PVT',
  'BK TEXTILE',
  'ASCO INTERNATIONAL ( PVT ) LTD',
  'FATIMA APPAREL',
  'DENIM CLOTHING COMPANY',
  'TAJIR IMPEX',
  'ARTISTIC APPARELS (PVT) LTD',
  'COMFORT APPAREL',
  'AMNA APPAREL',
  'MARTIN DOW LIMITED',
  'COTTON WEB LIMITED',
  'COTTON SMITH',
  'TAJ INDUSTRIES',
  'NISHAT MILLS LIMITED',
  'ANIS APPAREL',
  'KAM INTERNATIONAL',
  'NIZAMIA APPARELS',
  'GLOBAL EXPORT',
  'AFRAZ KNIT & STITCHED',
  'AL AMIN EXPORTS',
  'HUMERA INDUSTRIES',
  'SHAHPUR APPAREL',
  'GUL AHMED TEXTILE MILLS LTD',
  'Z.M.ENTERPRISES',
  'DANIYAL ENTERPRISES',
  'FAZAL INDUSTRIES',
  'COMBINED APPAREL',
  'ZBH CLOTHING',
  'AZMAT GARMENT',
  'CASUAL SPORTWEAR',
  'AHMED TEXTILE & GENERAL MILLS',
  'NFK EXPORTS (PVT) LTD',
  'M.A. INDUSTRIES',
  'FASHOINWEAR (PVT) LTD',
  'KNIT & STITCH',
  'MYM KNITWEAR',
  'AL MUSTAFA FASHION APPAREL',
  'SHAFI (PVT) LIMITED',
  'TEXTILE CONNECTIONS',
  'KEYSTONE ENTERPRISES',
  'ZAHID ABID & CO',
  'SHAHEEN KNITWEAR',
  'ARTISTIC DENIM MILLS LTD.',
  'AMNA ASHRAF APPARELS',
  'AL-MUNAF CORPORATION',
  'MASOOD TEXTILES MILLS LTD',
  'RIZWAN INTERNATIONAL',
  'SHAN FOODS (PVT) LTD.',
  'SADAQAT LIMITED',
  'BIZFLO INTERNATIONAL',
  'THREE STARS HOSIERY MILLS (PVT) MULTAN',
  'METROTEX INDUSTRIES',
  'GnB SOX MILL',
  'INTERNATIONAL TEXTILE LTD',
  'ELITE',
  'HI-KNIT (PVT) LTD',
  'MEHRAN FOOD AND SPICES',
  'SASSI INTERNATIONAL',
  'ARTISTIC FABRIC & GARMENT INDUSTRIES ( PVT ) LTD.',
  'ORIENT TEXTILE MILLS  LTD',
  'TIME KNITS',
  'SHEIKH OF SIALKOT PVT LTD',
  'LUCKY TEXTILE MILLS LIMITED',
  'NOVA LEATHERS',
  'WEARME APPAREL',
  'TOWELLERS LIMITED',
  'HASSAN INDUSTRIES',
  'DIGITAL APPAREL (PVT) LTD',
  'SHAFI APPARELS',
  'APPAREL MERCHANDIZING',
  'HOME CARE TEXTILE',
  'NISHAT CHUNIAN LTD',
  'NOOR APPAREL',
  'CLASSIC GARMENTS',
  'AZIZ SONS',
  'FIRHAJ FOOTWEAR (PVT) LTD',
  'SAAD TEXTILE MILLS (PVT) LTD',
  'KASHIF APPAREL',
  'SHAHID TRADERS',
  'RUSTAM TOWEL ( PRIVATE ) LIMITED',
  'PRIME APPAREL',
  'FAISAL HOSIERY WORKS',
  'AZAN INTERNATIONAL',
  'TAIS (PVT) LIMITED',
  'M.I INDUSTRIES',
  'AMOUR TEXTILE (PVT) LTD',
  'LUCKY KNITS (PVT) LIMITED',
  'CIS GARMENTS (PVT) LTD',
  'SALMAN INDUSTRIES',
  'KAY & EMMS (PVT) LTD.',
  'ALMAJEED ENTERPRISES',
  'FIVE STAR APPARELS',
  'MUGHEES TEXTILES EXPORTER',
  'Apparel Manufactures (Pvt) Ltd.',
  'ASHRAF ENTERPRISE',
  'BANI APPAREL',
  'IBRAHIM EXPORTS',
  'PARAAGON TEXTILE',
  'W BROTHERS',
  'AL SHIRKAT INDUSTRIES ( PVT ) LTD.',
  'AL AZMAT PVT LTD',
  'ZUBISMA APPAREAL',
  'JILANI EXPORTS',
  'JAS INDUSTRIES PVT LTD',
  'ARTISTIC MILLINERS PVT (LTD)',
  'TM EXPORT',
  'S.H.Z TETXTILE',
  'AL-AMEERA APPAREL PVT LTD',
  'A M MERCHANDISING (PVT) LTD.',
  'DENIM INTERNATIONAL',
  'LIBERTY MILLS LIMITED',
  'RAJWANI APPAREL PVT LTD',
  'BILLS INC',
  'JB INDUSTRIES',
  'REBORN TEXTILE',
  'JNS TEXTILE',
  'SANA TEXTILE',
  'MIANOOR TEXTILE INDUSTRIES PVT LTD',
  'CRESCENT BAHUMAN LIMITED',
  'GALAXY KNITWEAR COMPANY',
  'AXIS TEXTILE INDUSTRIES'
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
  clientLayoutLink: string;
  itemSpecificationsExcelLink?: string;
  itemSpecificationsData?: any;
  ratioExcelLink?: string;
  ratioData?: any;
}


export const AdvancedJobForm: React.FC<AdvancedJobFormProps> = ({ 
  product: initialProduct, 
  onBack 
}) => {
  const [product, setProduct] = useState<ProductMaster | null>(initialProduct || null);
  const [savedProducts, setSavedProducts] = useState<SavedProduct[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  
  // Fetch complete product info when initial product is provided
  useEffect(() => {
    if (initialProduct && initialProduct.id) {
      const fetchCompleteInfo = async () => {
        try {
          const completeProductInfo = await productsAPI.getCompleteProductInfo(initialProduct.id);
          const completeProduct = completeProductInfo.product || completeProductInfo || initialProduct;
          
          // Map API response fields to expected frontend field names
          const mappedProduct = {
            ...completeProduct,
            fsc: completeProduct.fscCertified ? 'Yes' : 'No',
            fsc_claim: completeProduct.fscLicense || '',
            product_item_code: completeProduct.sku || completeProduct.product_item_code,
            product_type: completeProduct.product_type || 'Offset',
            material_name: completeProduct.material_name || 'N/A',
            category_name: completeProduct.category_name || 'N/A',
            color_specifications: completeProduct.color_specifications || completeProduct.color || 'As per Approved Sample/Artwork',
            remarks: completeProduct.remarks || ''
          };
          
          setProduct(mappedProduct);
          console.log('Loaded complete product info for initial product:', mappedProduct);
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
    assignedDesigner: '',
    clientLayoutLink: ''
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [formProgress, setFormProgress] = useState(0);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [designers, setDesigners] = useState<any[]>([]);
  const [isLoadingDesigners, setIsLoadingDesigners] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [processSequence, setProcessSequence] = useState<any>(null);
  const [isLoadingProcessSequence, setIsLoadingProcessSequence] = useState(false);

  // Load designers from API on component mount
  useEffect(() => {
    const fetchDesigners = async () => {
      setIsLoadingDesigners(true);
      try {
        const response = await usersAPI.getDesigners();
        if (response.success) {
          setDesigners(response.designers);
        }
      } catch (error) {
        console.error('Error fetching designers:', error);
        toast.error('Failed to load designers');
      } finally {
        setIsLoadingDesigners(false);
      }
    };

    fetchDesigners();
  }, []);

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
    if (!jobCardData.assignedDesigner.trim() || jobCardData.assignedDesigner === 'loading' || jobCardData.assignedDesigner === 'no-designers') errors.push('Designer assignment required');

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
      jobCardData.assignedDesigner.trim() && jobCardData.assignedDesigner !== 'loading' && jobCardData.assignedDesigner !== 'no-designers',
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
        console.log('Complete product info for selected product:', completeInfo);
        
        // Update product with complete information if available
        if (completeInfo.product || completeInfo) {
          const completeProduct = completeInfo.product || completeInfo;
          console.log('Updating selected product with complete info:', completeProduct);
          
          // Map API response fields to expected frontend field names
          const mappedProduct = {
            ...completeProduct,
            fsc: completeProduct.fscCertified ? 'Yes' : 'No',
            fsc_claim: completeProduct.fscLicense || '',
            product_item_code: completeProduct.sku || completeProduct.product_item_code,
            product_type: completeProduct.product_type || 'Offset',
            material_name: completeProduct.material_name || 'N/A',
            category_name: completeProduct.category_name || 'N/A',
            color_specifications: completeProduct.color_specifications || completeProduct.color || 'As per Approved Sample/Artwork',
            remarks: completeProduct.remarks || ''
          };
          
          console.log('Mapped selected product for display:', mappedProduct);
          setProduct(mappedProduct);
        }
        
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
          
          // Update product with complete information if available
          if (completeInfo.product || completeInfo) {
            const completeProduct = completeInfo.product || completeInfo;
            console.log('Updating product with complete info:', completeProduct);
            
            // Map API response fields to expected frontend field names
            const mappedProduct = {
              ...completeProduct,
              fsc: completeProduct.fscCertified ? 'Yes' : 'No',
              fsc_claim: completeProduct.fscLicense || '',
              product_item_code: completeProduct.sku || completeProduct.product_item_code,
              product_type: completeProduct.product_type || 'Offset',
              material_name: completeProduct.material_name || 'N/A',
              category_name: completeProduct.category_name || 'N/A',
              color_specifications: completeProduct.color_specifications || completeProduct.color || 'As per Approved Sample/Artwork',
              remarks: completeProduct.remarks || ''
            };
            
            console.log('Mapped product for display:', mappedProduct);
            setProduct(mappedProduct);
          }
          
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


  // Calculate working days (excluding Sundays) between today and delivery date
  const calculateWorkingDays = (deliveryDate: string): number => {
    if (!deliveryDate) return 0;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const delivery = new Date(deliveryDate);
    delivery.setHours(0, 0, 0, 0);
    
    if (delivery < today) return 0;
    
    let workingDays = 0;
    const current = new Date(today);
    
    // Count from tomorrow to delivery date (inclusive)
    // This excludes today from the count
    current.setDate(current.getDate() + 1);
    
    while (current <= delivery) {
      // Sunday is day 0 in JavaScript Date
      if (current.getDay() !== 0) {
        workingDays++;
      }
      current.setDate(current.getDate() + 1);
    }
    
    return workingDays;
  };

  // Calculate priority based on working days
  const calculatePriorityFromWorkingDays = (workingDays: number): 'Low' | 'Medium' | 'High' | 'Urgent' => {
    if (workingDays <= 2) return 'Urgent';
    if (workingDays <= 5) return 'High';
    if (workingDays <= 8) return 'Medium';
    return 'Low';
  };

  const handleInputChange = (field: keyof JobCardData, value: any) => {
    // Ensure assignedDesigner is stored as string for consistent comparison
    if (field === 'assignedDesigner') {
      value = String(value).trim();
      console.log('🎨 Designer selected:', value);
      console.log('🎨 Available designers:', designers.map(d => ({ id: d.id, stringId: String(d.id), fullName: d.fullName })));
    }
    
    setJobCardData(prev => {
      const updated = {
        ...prev,
        [field]: value
      };
      
      // Auto-calculate priority when delivery date changes
      if (field === 'deliveryDate' && value) {
        const workingDays = calculateWorkingDays(value);
        const autoPriority = calculatePriorityFromWorkingDays(workingDays);
        updated.priority = autoPriority;
        console.log(`📅 Delivery date: ${value}, Working days: ${workingDays}, Auto-priority: ${autoPriority}`);
      }
      
      return updated;
    });
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
      // Generate a consistent job ID that will be used for both PDF and job creation
      const timestamp = Date.now();
      const jobCardId = `JC-${timestamp}`;
      
      // Use the fetched process sequence
      let completeProduct = product;
      if (product && processSequence) {
        completeProduct = {
          ...product,
          processSequence: processSequence
        };
      }
      
      // Fetch assigned designer information
      let assignedDesignerInfo: { name: string; email: string; phone?: string } | undefined = undefined;
      
      // Ensure designers are loaded, if not, try to fetch them
      let designersToUse = designers;
      if (designersToUse.length === 0 && jobCardData.assignedDesigner) {
        console.log('⚠️ Designers array is empty, fetching designers...');
        try {
          const response = await usersAPI.getDesigners();
          if (response.success && response.designers) {
            designersToUse = response.designers;
            console.log('✅ Designers fetched successfully:', designersToUse.length);
          }
        } catch (error) {
          console.error('Error fetching designers:', error);
        }
      }
      
      if (jobCardData.assignedDesigner && jobCardData.assignedDesigner.trim() && jobCardData.assignedDesigner !== 'loading' && jobCardData.assignedDesigner !== 'no-designers') {
        console.log('🔍 Looking for designer with ID:', jobCardData.assignedDesigner);
        console.log('📋 Available designers:', designersToUse.map(d => ({ id: d.id, fullName: d.fullName })));
        
        // Try multiple comparison methods to handle different ID formats
        // Normalize both sides for comparison
        const selectedDesignerId = String(jobCardData.assignedDesigner).trim();
        const selectedDesigner = designersToUse.find(d => {
          const designerId = String(d.id).trim();
          return designerId === selectedDesignerId ||
                 designerId === String(parseInt(selectedDesignerId)) ||
                 parseInt(designerId) === parseInt(selectedDesignerId);
        });
        
        if (selectedDesigner) {
          console.log('✅ Found designer:', selectedDesigner);
          assignedDesignerInfo = {
            name: selectedDesigner.fullName || `${selectedDesigner.firstName || ''} ${selectedDesigner.lastName || ''}`.trim() || 'Unknown Designer',
            email: selectedDesigner.email || 'designer@example.com',
            phone: selectedDesigner.phone || ''
          };
          console.log('📄 Designer info for PDF:', assignedDesignerInfo);
        } else {
          console.warn('⚠️ Designer not found in local array! Selected ID:', jobCardData.assignedDesigner);
          console.warn('⚠️ Available designer IDs:', designersToUse.map(d => ({ id: d.id, type: typeof d.id, string: d.id.toString() })));
          console.warn('⚠️ Selected designer type:', typeof jobCardData.assignedDesigner);
          
          // Fallback: Try to fetch designer directly from API
          try {
            console.log('🔄 Trying to fetch designer directly from API...');
            const designerResponse = await usersAPI.getById(jobCardData.assignedDesigner);
            if (designerResponse && designerResponse.user) {
              const designer = designerResponse.user;
              console.log('✅ Fetched designer from API:', designer);
              assignedDesignerInfo = {
                name: `${designer.firstName || ''} ${designer.lastName || ''}`.trim() || designer.username || 'Unknown Designer',
                email: designer.email || 'designer@example.com',
                phone: designer.phone || ''
              };
              console.log('📄 Designer info for PDF (from API):', assignedDesignerInfo);
            }
          } catch (apiError) {
            console.error('❌ Failed to fetch designer from API:', apiError);
          }
        }
      } else {
        console.log('ℹ️ No designer selected or invalid selection');
      }
      
      // Debug: Log what we're passing to PDF
      console.log('📄 Generating PDF with jobCardData:', {
        assignedDesigner: assignedDesignerInfo,
        hasDesigner: !!assignedDesignerInfo,
        designerType: typeof assignedDesignerInfo
      });
      
      // Normalize ratio data structure for PDF (flatten rawData if needed)
      let normalizedRatioData = jobCardData.ratioData;
      if (normalizedRatioData && normalizedRatioData.rawData && !normalizedRatioData.colorDetails) {
        // Flatten structure: move rawData.colorDetails to top level if needed
        normalizedRatioData = {
          ...normalizedRatioData,
          colorDetails: normalizedRatioData.rawData.colorDetails || [],
          summary: normalizedRatioData.summary || normalizedRatioData.rawData.summary || {}
        };
      }
      
      await generateJobCardPDF({
        product: completeProduct,
        jobCardData: {
          ...jobCardData,
          customerName: jobCardData.customerInfo.name,
          salesman: jobCardData.merchandiser,
          jobCode: jobCardId,
          assignedDesigner: assignedDesignerInfo,
          priority: jobCardData.priority, // Include priority level
          ratioData: normalizedRatioData, // Include normalized ratio Excel data
          itemSpecificationsData: jobCardData.itemSpecificationsData, // Include item specifications data
          specialInstructions: jobCardData.specialInstructions, // Include remarks from job form
          customerInfo: jobCardData.customerInfo // Include full customer info for tabular display
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
        client_layout_link: jobCardData.clientLayoutLink,
        customer_phone: jobCardData.customerInfo.phone,
        customer_address: jobCardData.customerInfo.address,
        assigned_designer_id: jobCardData.assignedDesigner || null
      };

      // Only include company_id if it has a valid value
      if (jobCardData.companyId && jobCardData.companyId.trim() !== '') {
        jobData.company_id = jobCardData.companyId;
      }

      // Log the job data being sent
      console.log('Sending job data:', jobData);
      
      // Save job to API
      const savedJob = await jobsAPI.create(jobData);
      
      // Save item specifications if provided
      if (jobCardData.itemSpecificationsData && jobCardData.itemSpecificationsExcelLink) {
        try {
          const itemSpecsData = {
            excel_file_link: jobCardData.itemSpecificationsExcelLink,
            excel_file_name: jobCardData.itemSpecificationsData.fileName || 'Item_Specifications.xlsx',
            po_number: jobCardData.poNumber,
            job_number: savedJob.job.job_card_id,
            brand_name: product.brand || '',
            item_name: product.name || '',
            uploaded_at: new Date().toISOString(),
            item_count: jobCardData.itemSpecificationsData.itemCount || 0,
            total_quantity: jobCardData.itemSpecificationsData.summary?.totalQuantity || 0,
            size_variants: jobCardData.itemSpecificationsData.summary?.sizeVariants || 0,
            color_variants: jobCardData.itemSpecificationsData.summary?.colorVariants || 0,
            specifications: jobCardData.itemSpecificationsData.specifications || {},
            raw_excel_data: jobCardData.itemSpecificationsData || {},
            items: jobCardData.itemSpecificationsData.items || [] // Include individual items for database storage
          };

          const itemSpecsResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api'}/jobs/${savedJob.job.id}/item-specifications`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(itemSpecsData)
          });

          if (itemSpecsResponse.ok) {
            console.log('✅ Item specifications saved successfully');
          } else {
            console.warn('⚠️ Failed to save item specifications');
          }
        } catch (error) {
          console.error('❌ Error saving item specifications:', error);
        }
      }
      
      // Save ratio report if provided
      if (jobCardData.ratioData && jobCardData.ratioExcelLink) {
        try {
          const ratioReportData = {
            excel_file_link: jobCardData.ratioExcelLink,
            excel_file_name: 'Ratio_Report.xlsx', // You can extract this from the file if needed
            factory_name: jobCardData.ratioData.factoryName || '',
            po_number: jobCardData.poNumber,
            job_number: jobData.job_card_id,
            brand_name: product.brand || '',
            item_name: product.name || '',
            report_date: new Date().toISOString().split('T')[0],
            total_ups: jobCardData.ratioData.rawData?.summary?.totalUPS || jobCardData.ratioData.totalUPS || null,
            total_sheets: jobCardData.ratioData.totalSheets || null,
            total_plates: jobCardData.ratioData.totalPlates || null,
            qty_produced: jobCardData.ratioData.rawData?.summary?.qtyProduced || jobCardData.ratioData.qtyProduced || null,
            excess_qty: jobCardData.ratioData.excessQuantity || null,
            efficiency_percentage: jobCardData.ratioData.productionEfficiency || null,
            excess_percentage: jobCardData.ratioData.excessPercentage || (jobCardData.ratioData.excessQuantity && jobCardData.ratioData.rawData?.summary?.requiredOrderQty ? ((jobCardData.ratioData.excessQuantity / jobCardData.ratioData.rawData.summary.requiredOrderQty) * 100).toFixed(2) : null),
            required_order_qty: jobCardData.ratioData.rawData?.summary?.requiredOrderQty || jobCardData.ratioData.requiredOrderQty || null,
            color_details: jobCardData.ratioData.rawData?.colorDetails || [],
            plate_distribution: jobCardData.ratioData.plateDistribution || {},
            color_efficiency: jobCardData.ratioData.colorEfficiency || {},
            raw_excel_data: jobCardData.ratioData.rawData || {}
          };

          const ratioResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api'}/jobs/${savedJob.job.id}/ratio-report`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify(ratioReportData)
          });

          if (ratioResponse.ok) {
            console.log('Ratio report saved successfully');
            toast.success('Ratio report saved successfully! 📊');
          } else {
            console.error('Failed to save ratio report:', await ratioResponse.text());
            toast.warning('Job created but ratio report failed to save');
          }
        } catch (error) {
          console.error('Error saving ratio report:', error);
          toast.warning('Job created but ratio report failed to save');
        }
      }
      
      // Create prepress job automatically
      if (jobCardData.assignedDesigner) {
        try {
          const authToken = localStorage.getItem('authToken');
          if (!authToken) {
            console.warn('No auth token found, skipping prepress job creation');
            toast.warning('Job created but designer assignment failed - authentication required');
          } else {
            const prepressJobData = {
              jobCardId: savedJob.job.id, // Use the actual job ID from the saved job
              assignedDesignerId: jobCardData.assignedDesigner,
              priority: jobCardData.priority.toUpperCase() === 'URGENT' ? 'CRITICAL' : jobCardData.priority.toUpperCase(),
              dueDate: deliveryDate.toISOString()
            };

            console.log('Creating prepress job:', prepressJobData);

            // Create prepress job via API service
            try {
              const prepressJobResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api'}/prepress/jobs`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(prepressJobData)
              });
            
              if (prepressJobResponse.ok) {
                const createdPrepressJob = await prepressJobResponse.json();
                console.log('Prepress job created:', createdPrepressJob);
                toast.success(`Job assigned to designer successfully! 🎨`);
              } else {
                const errorText = await prepressJobResponse.text();
                console.error('Failed to create prepress job:', errorText);
                toast.warning('Job created but designer assignment failed');
              }
            } catch (prepressApiError) {
              console.error('Error calling prepress API:', prepressApiError);
              toast.warning('Job created but designer assignment failed');
            }
          }
        } catch (prepressError) {
          console.error('Error creating prepress job:', prepressError);
          toast.warning('Job created but designer assignment failed');
        }
      }
      
      // Generate PDF with the actual job ID from the saved job
      const jobCardId = savedJob.job.jobNumber || savedJob.job.job_card_id || jobCardData.jobCardId;
      
      // Use the fetched process sequence
      let completeProduct = product;
      if (product && processSequence) {
        completeProduct = {
          ...product,
          processSequence: processSequence
        };
      }
      
      // Fetch assigned designer information for PDF
      let assignedDesignerInfo: { name: string; email: string; phone?: string } | undefined = undefined;
      
      // Ensure designers are loaded, if not, try to fetch them
      let designersToUse = designers;
      if (designersToUse.length === 0 && jobCardData.assignedDesigner) {
        console.log('⚠️ Designers array is empty in handleSubmit, fetching designers...');
        try {
          const response = await usersAPI.getDesigners();
          if (response.success && response.designers) {
            designersToUse = response.designers;
            console.log('✅ Designers fetched successfully in handleSubmit:', designersToUse.length);
          }
        } catch (error) {
          console.error('Error fetching designers in handleSubmit:', error);
        }
      }
      
      if (jobCardData.assignedDesigner && jobCardData.assignedDesigner.trim() && jobCardData.assignedDesigner !== 'loading' && jobCardData.assignedDesigner !== 'no-designers') {
        console.log('🔍 [handleSubmit] Looking for designer with ID:', jobCardData.assignedDesigner);
        console.log('📋 [handleSubmit] Available designers:', designersToUse.map(d => ({ id: d.id, fullName: d.fullName })));
        
        // Normalize both sides for comparison
        const selectedDesignerId = String(jobCardData.assignedDesigner).trim();
        const selectedDesigner = designersToUse.find(d => {
          const designerId = String(d.id).trim();
          return designerId === selectedDesignerId ||
                 designerId === String(parseInt(selectedDesignerId)) ||
                 parseInt(designerId) === parseInt(selectedDesignerId);
        });
        
        if (selectedDesigner) {
          console.log('✅ [handleSubmit] Found designer:', selectedDesigner);
          assignedDesignerInfo = {
            name: selectedDesigner.fullName || `${selectedDesigner.firstName || ''} ${selectedDesigner.lastName || ''}`.trim() || 'Unknown Designer',
            email: selectedDesigner.email || 'designer@example.com',
            phone: selectedDesigner.phone || ''
          };
          console.log('📄 [handleSubmit] Designer info for PDF:', assignedDesignerInfo);
        } else {
          console.warn('⚠️ [handleSubmit] Designer not found in local array! Selected ID:', jobCardData.assignedDesigner);
          
          // Fallback: Try to fetch designer directly from API
          try {
            console.log('🔄 [handleSubmit] Trying to fetch designer directly from API...');
            const designerResponse = await usersAPI.getById(jobCardData.assignedDesigner);
            if (designerResponse && designerResponse.user) {
              const designer = designerResponse.user;
              console.log('✅ [handleSubmit] Fetched designer from API:', designer);
              assignedDesignerInfo = {
                name: `${designer.firstName || ''} ${designer.lastName || ''}`.trim() || designer.username || 'Unknown Designer',
                email: designer.email || 'designer@example.com',
                phone: designer.phone || ''
              };
              console.log('📄 [handleSubmit] Designer info for PDF (from API):', assignedDesignerInfo);
            }
          } catch (apiError) {
            console.error('❌ [handleSubmit] Failed to fetch designer from API:', apiError);
          }
        }
      } else {
        console.log('ℹ️ [handleSubmit] No designer selected or invalid selection');
      }
      
      // Normalize ratio data structure for PDF (flatten rawData if needed)
      let normalizedRatioData = jobCardData.ratioData;
      if (normalizedRatioData && normalizedRatioData.rawData && !normalizedRatioData.colorDetails) {
        // Flatten structure: move rawData.colorDetails to top level if needed
        normalizedRatioData = {
          ...normalizedRatioData,
          colorDetails: normalizedRatioData.rawData.colorDetails || [],
          summary: normalizedRatioData.summary || normalizedRatioData.rawData.summary || {}
        };
      }
      
      console.log('📄 [handleSubmit] Generating PDF with jobCardData:', {
        assignedDesigner: assignedDesignerInfo,
        hasDesigner: !!assignedDesignerInfo,
        designerType: typeof assignedDesignerInfo,
        hasRatioData: !!normalizedRatioData,
        hasItemSpecsData: !!jobCardData.itemSpecificationsData,
        ratioDataItems: normalizedRatioData?.colorDetails?.length || 0,
        itemSpecsItems: jobCardData.itemSpecificationsData?.items?.length || 0
      });
      
      // Log ratio data details
      if (normalizedRatioData) {
        console.log('📊 Ratio Data for PDF:', {
          hasColorDetails: !!normalizedRatioData.colorDetails,
          colorDetailsCount: normalizedRatioData.colorDetails?.length || 0,
          summary: normalizedRatioData.summary,
          hasRawData: !!normalizedRatioData.rawData
        });
      } else {
        console.warn('⚠️ No ratio data found in jobCardData');
      }
      
      // Log item specifications data details
      if (jobCardData.itemSpecificationsData) {
        console.log('📋 Item Specifications Data for PDF:', {
          hasItems: !!jobCardData.itemSpecificationsData.items,
          itemsCount: jobCardData.itemSpecificationsData.items?.length || 0,
          summary: jobCardData.itemSpecificationsData.summary
        });
      } else {
        console.warn('⚠️ No item specifications data found in jobCardData');
      }
      
      await generateJobCardPDF({
        product: completeProduct,
        jobCardData: {
          ...jobCardData,
          customerName: jobCardData.customerInfo.name,
          salesman: jobCardData.merchandiser,
          jobCode: jobCardId,
          assignedDesigner: assignedDesignerInfo,
          priority: jobCardData.priority, // Include priority level
          ratioData: normalizedRatioData, // Include normalized ratio Excel data
          itemSpecificationsData: jobCardData.itemSpecificationsData, // Include item specifications data
          specialInstructions: jobCardData.specialInstructions, // Include remarks from job form
          customerInfo: jobCardData.customerInfo // Include full customer info for tabular display
        },
        jobCardId
      });
      
      toast.success(`Job Card ${jobCardId} created successfully! 🎉`);
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
                          placeholder="Enter product code (any format)"
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
                        <SelectTrigger className={(!jobCardData.assignedDesigner.trim() || jobCardData.assignedDesigner === 'loading' || jobCardData.assignedDesigner === 'no-designers') && validationErrors.length > 0 ? 'border-red-300 bg-red-50' : ''}>
                          <SelectValue placeholder="Select designer for this job" />
                        </SelectTrigger>
                        <SelectContent>
                          {isLoadingDesigners ? (
                            <SelectItem value="loading" disabled>Loading designers...</SelectItem>
                          ) : designers.length > 0 ? (
                            designers.map((designer) => (
                              <SelectItem key={designer.id} value={designer.id.toString()}>
                                {designer.fullName} ({designer.email})
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-designers" disabled>No designers available</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500">
                        This job will be automatically assigned to the selected designer after submission.
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Priority Level</Label>
                      <div className="flex items-center gap-3">
                        {jobCardData.deliveryDate ? (
                          <>
                            <Badge className={getPriorityColor(jobCardData.priority)}>
                              {jobCardData.priority}
                            </Badge>
                            <span className="text-sm text-gray-600">
                              (Auto-calculated: {calculateWorkingDays(jobCardData.deliveryDate)} working days)
                            </span>
                          </>
                        ) : (
                          <Badge variant="outline" className="text-gray-500">
                            Set delivery date to calculate priority
                          </Badge>
                        )}
                      </div>
                      {jobCardData.deliveryDate && (
                        <p className="text-xs text-gray-500">
                          Priority is automatically calculated based on working days until delivery (excluding Sundays).
                        </p>
                      )}
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
                      <Select 
                        value={jobCardData.customerInfo.name} 
                        onValueChange={(value) => handleCustomerInfoChange('name', value)}
                      >
                        <SelectTrigger 
                          id="customerName"
                          className={!jobCardData.customerInfo.name.trim() && validationErrors.length > 0 ? 'border-red-300 bg-red-50' : ''}
                        >
                          <SelectValue placeholder="Select customer name" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {CUSTOMER_NAMES.map((customerName) => (
                            <SelectItem key={customerName} value={customerName}>
                              {customerName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                        <option value="Detain">Detain</option>
                        <option value="Overnight">Overnight</option>
                        <option value="Same Day">Same Day</option>
                        <option value="By Road">By Road</option>
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

                  {/* Client Layout Link */}
                  <div className="space-y-2">
                    <Label htmlFor="clientLayoutLink" className="flex items-center gap-2">
                      <Paperclip className="w-4 h-4" />
                      Client Layout Link (Google Drive)
                    </Label>
                    <Input
                      id="clientLayoutLink"
                      type="url"
                      value={jobCardData.clientLayoutLink}
                      onChange={(e) => handleInputChange('clientLayoutLink', e.target.value)}
                      placeholder="https://drive.google.com/file/d/..."
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-gray-500">
                      Upload client layout to Google Drive and paste the shareable link here
                    </p>
                  </div>

                  {/* Item Specifications & Ratio Optimization */}
                  <div className="space-y-4">
                    <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg">
                      <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Item Specifications & Production Planning
                      </h4>
                      <p className="text-sm text-blue-700 mb-3">
                        Upload item specifications for all jobs, plus ratio optimization for variable items:
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* All Jobs - Item Specifications */}
                        <div className="bg-white p-3 rounded-lg border border-blue-200">
                          <h5 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                            <FileText className="h-4 w-4 text-blue-600" />
                            All Jobs - Item Specifications
                          </h5>
                          <p className="text-xs text-gray-600 mb-2">
                            Required for all jobs: sizes, quantities, colors, materials
                          </p>
                          <div className="text-xs text-blue-600 font-medium">
                            📋 Item specifications Excel required
                          </div>
                        </div>
                        
                        {/* Variable Items - Ratio Optimization */}
                        <div className="bg-white p-3 rounded-lg border border-blue-200">
                          <h5 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                            <Zap className="h-4 w-4 text-orange-600" />
                            Variable Items - Ratio Optimization
                          </h5>
                          <p className="text-xs text-gray-600 mb-2">
                            Additional optimization for complex variable items
                          </p>
                          <div className="text-xs text-orange-600 font-medium">
                            📊 Ratio optimization Excel (optional)
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Item Specifications Excel Upload - Required for ALL jobs */}
                    <div className="space-y-2">
                      <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                        <h5 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Item Specifications (Required for All Jobs)
                        </h5>
                        <ItemSpecificationsExcelUpload
                          value={jobCardData.itemSpecificationsExcelLink || ''}
                          onChange={(excelLink, parsedData) => {
                            handleInputChange('itemSpecificationsExcelLink', excelLink);
                            handleInputChange('itemSpecificationsData', parsedData);
                          }}
                          parsedData={jobCardData.itemSpecificationsData}
                          label="Upload Item Specifications Excel File"
                          required={true}
                        />
                        <div className="mt-2 space-y-1">
                          <p className="text-xs text-blue-700">
                            📋 Upload Excel file containing: sizes, quantities, colors, materials, specifications
                          </p>
                          <p className="text-xs text-blue-600 font-medium">
                            ⚡ This data will flow through: Designer → QA → Production for all jobs
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Ratio Excel Upload - Optional for variable items */}
                    {product && product.product_type && ['Offset', 'Screen Print', 'Digital', 'Heat Transfer Label'].includes(product.product_type) && (
                      <div className="space-y-2">
                        <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg">
                          <h5 className="font-medium text-orange-800 mb-2 flex items-center gap-2">
                            <Upload className="h-4 w-4" />
                            Variable Items - Ratio Optimization (Optional)
                          </h5>
                          <RatioExcelUpload
                            value={jobCardData.ratioExcelLink || ''}
                            onChange={(excelLink, parsedData) => {
                              handleInputChange('ratioExcelLink', excelLink);
                              handleInputChange('ratioData', parsedData);
                            }}
                            parsedData={jobCardData.ratioData}
                            label="Upload Ratio Optimization Excel File (Optional)"
                          />
                          <div className="mt-2 space-y-1">
                            <p className="text-xs text-orange-700">
                              📋 Upload Excel file for advanced optimization: plate usage, material efficiency, production ratios
                            </p>
                            <p className="text-xs text-orange-600 font-medium">
                              ⚡ This provides additional optimization data for complex variable items
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* For other product types */}
                    {product && product.product_type && !['Offset', 'Screen Print', 'Digital', 'Heat Transfer Label'].includes(product.product_type) && (
                      <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                        <h5 className="font-medium text-green-800 mb-2 flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          Constant Items - Standard Specifications
                        </h5>
                        <p className="text-xs text-green-700">
                          ✅ {product.product_type} products typically use constant specifications. Ratio optimization not needed.
                        </p>
                        <p className="text-xs text-green-600 mt-1">
                          📝 Item specifications Excel is still required above for production planning.
                        </p>
                      </div>
                    )}
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
