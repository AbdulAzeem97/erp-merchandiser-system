import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Save, 
  X, 
  Factory, 
  ArrowLeft, 
  CheckCircle, 
  AlertCircle, 
  Info,
  Lightbulb,
  Zap,
  Target,
  Clock,
  TrendingUp,
  Palette,
  FileText,
  Layers,
  Settings,
  Sparkles
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { ProductMaster, PRODUCT_TYPES, BRANDS, MATERIALS } from '../../types/erp';
import { ProcessSequenceSection } from '../ProcessSequenceSection';
import { ProcessPreview } from '../ProcessPreview';
import { productsAPI } from '@/services/api';

interface AdvancedProductFormProps {
  onProductSaved?: (product: ProductMaster) => void;
  onBack?: () => void;
}

interface ValidationError {
  field: string;
  message: string;
}

interface FormStep {
  id: string;
  title: string;
  description: string;
  fields: string[];
  icon: any;
}

const FORM_STEPS: FormStep[] = [
  {
    id: 'basic',
    title: 'Basic Information',
    description: 'Product identification and core details',
    fields: ['product_item_code', 'brand'],
    icon: Info
  },
  {
    id: 'specifications',
    title: 'Specifications',
    description: 'Technical specifications and materials',
    fields: ['material_id', 'gsm', 'color'],
    icon: Settings
  },
  {
    id: 'compliance',
    title: 'Compliance & Quality',
    description: 'Certifications and quality standards',
    fields: ['fsc', 'fsc_claim'],
    icon: CheckCircle
  },
  {
    id: 'process',
    title: 'Process Configuration',
    description: 'Production workflow and sequence',
    fields: ['product_type'],
    icon: Factory
  },
  {
    id: 'finalization',
    title: 'Review & Finalize',
    description: 'Final review and additional notes',
    fields: ['remarks'],
    icon: Sparkles
  }
];

export const AdvancedProductForm: React.FC<AdvancedProductFormProps> = ({ 
  onProductSaved, 
  onBack 
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<ProductMaster>({
    id: '',
    product_item_code: '',
    brand: '',
    material_id: '',
    gsm: 0,
    color: '',
    remarks: '',
    fsc: 'No',
    fsc_claim: '',
    product_type: 'Offset',
    is_active: true,
    created_at: '',
    updated_at: ''
  });
  
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [formProgress, setFormProgress] = useState(0);
  const [smartSuggestions, setSmartSuggestions] = useState<string[]>([]);
  const [selectedProcessSteps, setSelectedProcessSteps] = useState<any[]>([]);
  const [materials, setMaterials] = useState<{id: string, name: string}[]>([]);
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(true);

  // Fetch materials from API
  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        setIsLoadingMaterials(true);
        console.log('🔄 Fetching materials from API...');
        const response = await productsAPI.getMaterials();
        console.log('📦 Materials response:', response);
        setMaterials(response.materials || []);
        console.log('✅ Materials loaded:', response.materials?.length || 0);
      } catch (error) {
        console.error('❌ Error fetching materials:', error);
        toast.error('Failed to load materials');
      } finally {
        setIsLoadingMaterials(false);
      }
    };

    fetchMaterials();
  }, []);

  // Smart validation
  const validateField = (field: keyof ProductMaster, value: any): string | null => {
    switch (field) {
      case 'product_item_code':
        if (!value || !value.toString().trim()) return 'Product Item Code is required';
        if (!/^[A-Z]{2}-\d{2}-\d{3}-[A-Z]$/.test(value.toString())) {
          return 'Invalid format. Use: XX-XX-XXX-X (e.g., BR-00-139-A)';
        }
        return null;
      case 'brand':
        if (!value) return 'Brand selection is required';
        return null;
      case 'material_id':
        if (!value) return 'Material selection is required';
        return null;
      case 'gsm':
        if (!value || !value.toString().trim()) return 'GSM is required';
        const gsmNum = parseInt(value.toString());
        if (isNaN(gsmNum) || gsmNum < 25 || gsmNum > 1500) {
          return 'GSM must be between 25 and 1500';
        }
        return null;
      case 'color':
        if (!value || !value.toString().trim()) return 'Color specification is required';
        if (value.toString().length < 3) return 'Color description too short';
        return null;
      case 'fsc_claim':
        if (formData.fsc === 'Yes' && !value) {
          return 'FSC Claim is required when FSC is Yes';
        }
        return null;
      default:
        return null;
    }
  };

  // Real-time validation - only validate current step fields
  useEffect(() => {
    const errors: ValidationError[] = [];
    const currentStepData = FORM_STEPS[currentStep];
    
    // Only validate fields for the current step
    currentStepData.fields.forEach(field => {
      const value = formData[field as keyof ProductMaster];
      const error = validateField(field as keyof ProductMaster, value);
      if (error) {
        errors.push({ field: field as keyof ProductMaster, message: error });
      }
    });
    
    setValidationErrors(errors);

    // Update progress based on all steps
    const totalFields = FORM_STEPS.reduce((total, step) => total + step.fields.length, 0);
    const completedFields = FORM_STEPS.reduce((completed, step) => {
      return completed + step.fields.filter(field => {
        const value = formData[field as keyof ProductMaster];
        return value && value.toString().trim();
      }).length;
    }, 0);
    setFormProgress((completedFields / totalFields) * 100);
  }, [formData, currentStep]);

  // Smart suggestions based on input
  useEffect(() => {
    const suggestions: string[] = [];
    
    if (formData.brand === 'JCP' && formData.material_id === 'C1S') {
      suggestions.push('Consider GSM 350-400 for optimal printing quality');
    }
    
    if (formData.gsm && formData.gsm > 300) {
      suggestions.push('High GSM detected - ensure proper die cutting configuration');
    }
    
    if (formData.color.toLowerCase().includes('pantone')) {
      suggestions.push('Pantone colors require special ink procurement');
    }
    
    setSmartSuggestions(suggestions);
  }, [formData]);

  const handleInputChange = (field: keyof ProductMaster, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Auto-complete suggestions
    if (field === 'product_item_code' && value.toString().length === 2) {
      // Auto suggest format - defer to avoid state update during render
      setTimeout(() => {
        toast.info('Format: XX-XX-XXX-X (e.g., BR-00-139-A)');
      }, 0);
    }
  };

  const validateCurrentStep = (): boolean => {
    // Since validationErrors now only contains current step errors, we can directly check
    return validationErrors.length === 0;
  };

  const nextStep = () => {
    if (validateCurrentStep()) {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      if (currentStep < FORM_STEPS.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    } else {
      toast.error('Please fix validation errors before proceeding');
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSave = async () => {
    // Validate all steps before saving
    const allErrors: ValidationError[] = [];
    FORM_STEPS.forEach(step => {
      step.fields.forEach(field => {
        const value = formData[field as keyof ProductMaster];
        const error = validateField(field as keyof ProductMaster, value);
        if (error) {
          allErrors.push({ field: field as keyof ProductMaster, message: error });
        }
      });
    });
    
    if (allErrors.length > 0) {
      toast.error(`Please fix ${allErrors.length} validation errors before saving`);
      return;
    }

    setIsSaving(true);
    try {
      // Find the selected material from the fetched materials
      const selectedMaterial = materials.find(m => m.id === formData.material_id);
      
      console.log('🔍 Debug - formData.material_id:', formData.material_id);
      console.log('🔍 Debug - materials array:', materials);
      console.log('🔍 Debug - selectedMaterial:', selectedMaterial);

      // Updated field names to match backend schema
      const productData: any = {
        sku: formData.product_item_code,
        brand: formData.brand,
        gsm: parseInt(formData.gsm.toString()) || null,
        description: formData.remarks || '',
        category_id: 1 // Default category for now
      };

      console.log('✅ Sending updated product data with correct field names');
      
      if (formData.color_specifications || formData.color) {
        productData.color_specifications = formData.color_specifications || formData.color;
      }
      
      if (formData.remarks) {
        productData.remarks = formData.remarks;
      }
      
      if (formData.fsc) {
        productData.fsc = formData.fsc;
      }
      
      if (formData.fsc_claim) {
        productData.fsc_claim = formData.fsc_claim;
      }

      // Re-enable category_id for complete product information
      productData.category_id = 1; // Default category ID as integer

      // Save product to API
      console.log('Sending product data:', productData);
      console.log('Auth token:', localStorage.getItem('authToken') ? 'Present' : 'Missing');
      const savedProduct = await productsAPI.create(productData);
      
      console.log('Product saved:', savedProduct);
      
      // Save process selections if product was created and we have selections
      const productId = savedProduct?.product?.id || savedProduct?.id;
      if (productId && selectedProcessSteps.length > 0) {
        try {
          const processSelections = selectedProcessSteps.map(step => ({
            step_id: step.id,
            is_selected: step.isSelected || false
          }));
          
          await productsAPI.saveProcessSelections(productId, processSelections);
          console.log('Process selections saved for product:', productId);
        } catch (processError) {
          console.error('Failed to save process selections:', processError);
          toast.error('Product saved but failed to save process selections');
        }
      }
      
      // Check if savedProduct exists and has the expected structure
      if (savedProduct && savedProduct.product && savedProduct.product.sku) {
        toast.success(`Product ${savedProduct.product.sku} saved successfully! 🎉`);
      } else if (savedProduct && savedProduct.sku) {
        toast.success(`Product ${savedProduct.sku} saved successfully! 🎉`);
      } else {
        toast.success('Product saved successfully! 🎉');
      }
      
      if (onProductSaved) {
        onProductSaved(formData);
      }
    } catch (error) {
      console.error('Save error:', error);
      console.error('Error response:', error.response);
      if (error.response && error.response.details) {
        console.error('Validation details:', error.response.details);
      }
      
      const errorMessage = error.message || 'Failed to save product';
      
      // Check if it's a validation error with details
      if (error.response && error.response.details && Array.isArray(error.response.details)) {
        const validationErrors = error.response.details;
        console.log('Processing validation errors:', validationErrors);
        const errorMessages = validationErrors.map(err => err.message || err).join(', ');
        toast.error(`Validation Error: ${errorMessages}`);
        
        // Focus the first field that has an error
        if (validationErrors[0] && validationErrors[0].field) {
          const fieldName = validationErrors[0].field;
          const fieldInput = document.querySelector(`input[name="${fieldName}"], select[name="${fieldName}"], textarea[name="${fieldName}"]`) as HTMLElement;
          if (fieldInput) {
            setTimeout(() => fieldInput.focus(), 0);
          }
        }
      } else if (errorMessage.includes('Product code already exists')) {
        toast.error('Product code already exists. Please use a different code.');
        // Focus the product code field to help user fix the issue
        const productCodeField = document.querySelector('input[id*="productItemCode"]') as HTMLElement;
        if (productCodeField) {
          setTimeout(() => productCodeField.focus(), 0);
        }
      } else if (errorMessage.includes('Reference error')) {
        toast.error('Invalid material or category selected. Please check your selections.');
      } else if (errorMessage.includes('Validation error')) {
        toast.error('Please check all required fields and try again.');
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const getFieldError = (field: string): string | undefined => {
    return validationErrors.find(error => error.field === field)?.message;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Advanced Header */}
        <motion.div 
          className="modern-card p-8 mb-8 shadow-2xl overflow-hidden relative"
          variants={itemVariants}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-indigo-50/50"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Button 
                onClick={onBack} 
                className="btn-secondary-modern"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 via-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg hover:scale-105 transition-transform duration-200">
                <Factory className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-display-3 font-bold text-gradient mb-2">
                  Advanced Product Master
                </h1>
                <p className="text-body text-slate-600 flex items-center gap-2">
                  <span>Step {currentStep + 1} of {FORM_STEPS.length}</span>
                  <span className="w-1 h-1 bg-slate-400 rounded-full"></span>
                  <span>{FORM_STEPS[currentStep].description}</span>
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              {/* Modern Progress Circle */}
              <div className="modern-card p-4 bg-gradient-to-br from-slate-50 to-blue-50/50">
                <div className="relative w-20 h-20">
                  <svg className="w-20 h-20 transform -rotate-90 filter drop-shadow-sm" viewBox="0 0 36 36">
                    <path
                      d="m18,2.0845 a 15.9155,15.9155 0 0,1 0,31.831 a 15.9155,15.9155 0 0,1 0,-31.831"
                      fill="none"
                      stroke="#E2E8F0"
                      strokeWidth="3"
                    />
                    <path
                      d="m18,2.0845 a 15.9155,15.9155 0 0,1 0,31.831 a 15.9155,15.9155 0 0,1 0,-31.831"
                      fill="none"
                      stroke="url(#modernProgressGradient)"
                      strokeWidth="3"
                      strokeDasharray={`${formProgress}, 100`}
                      strokeLinecap="round"
                      className="filter drop-shadow-sm"
                    />
                    <defs>
                      <linearGradient id="modernProgressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#3B82F6" />
                        <stop offset="50%" stopColor="#6366F1" />
                        <stop offset="100%" stopColor="#8B5CF6" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg font-bold text-slate-800">{Math.round(formProgress)}%</span>
                    <span className="text-caption text-slate-500">Complete</span>
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={handleSave} 
                disabled={isSaving || validationErrors.length > 0}
                className="btn-primary-modern"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving Product...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Product
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Step Navigation */}
          <motion.div className="lg:col-span-1" variants={itemVariants}>
            <Card className="bg-white/60 backdrop-blur-sm border-white/30 sticky top-8">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="w-5 h-5 text-indigo-600" />
                  Progress Steps
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {FORM_STEPS.map((step, index) => (
                  <motion.div
                    key={step.id}
                    className={`p-3 rounded-xl cursor-pointer transition-all ${
                      index === currentStep
                        ? 'bg-gradient-to-r from-indigo-100 to-purple-100 border-2 border-indigo-300'
                        : completedSteps.has(index)
                        ? 'bg-green-50 border-2 border-green-200'
                        : 'bg-gray-50 border-2 border-transparent hover:border-gray-200'
                    }`}
                    onClick={() => {
                      if (completedSteps.has(index) || index <= currentStep) {
                        setCurrentStep(index);
                      }
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        index === currentStep
                          ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
                          : completedSteps.has(index)
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {completedSteps.has(index) ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          React.createElement(step.icon, { className: "w-4 h-4" })
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{step.title}</div>
                        <div className="text-xs text-gray-500 mt-1">{step.description}</div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>

            {/* Smart Suggestions */}
            {smartSuggestions.length > 0 && (
              <motion.div 
                className="mt-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-yellow-600" />
                      Smart Suggestions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {smartSuggestions.map((suggestion, index) => (
                      <div key={index} className="flex items-start gap-2 text-sm text-yellow-800">
                        <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-2 flex-shrink-0" />
                        <span>{suggestion}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </motion.div>

          {/* Form Content */}
          <motion.div className="lg:col-span-3" variants={itemVariants}>
            <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-xl">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center">
                      {React.createElement(FORM_STEPS[currentStep].icon, { className: "w-5 h-5 text-indigo-600" })}
                    </div>
                    <div>
                      <CardTitle className="text-xl">{FORM_STEPS[currentStep].title}</CardTitle>
                      <p className="text-gray-600 text-sm">{FORM_STEPS[currentStep].description}</p>
                    </div>
                  </div>
                  
                  <Badge variant="outline" className="bg-white/50">
                    Step {currentStep + 1} of {FORM_STEPS.length}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Step Content */}
                    {currentStep === 0 && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="productItemCode" className="flex items-center gap-2">
                              Product Item Code *
                              <Info className="w-4 h-4 text-blue-500" />
                            </Label>
                            <Input
                              id="productItemCode"
                              value={formData.product_item_code}
                              onChange={(e) => handleInputChange('product_item_code', e.target.value.toUpperCase())}
                              placeholder="BR-00-139-A"
                              className={`font-mono ${getFieldError('product_item_code') ? 'border-red-300 bg-red-50' : ''}`}
                            />
                            {getFieldError('product_item_code') && (
                              <motion.p 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-sm text-red-600 flex items-center gap-1"
                              >
                                <AlertCircle className="w-3 h-3" />
                                {getFieldError('product_item_code')}
                              </motion.p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="brand">Brand *</Label>
                            <Select value={formData.brand} onValueChange={(value) => handleInputChange('brand', value)}>
                              <SelectTrigger className={getFieldError('brand') ? 'border-red-300 bg-red-50' : ''}>
                                <SelectValue placeholder="Select brand" />
                              </SelectTrigger>
                              <SelectContent>
                                {BRANDS.map(brand => (
                                  <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {getFieldError('brand') && (
                              <motion.p 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-sm text-red-600 flex items-center gap-1"
                              >
                                <AlertCircle className="w-3 h-3" />
                                {getFieldError('brand')}
                              </motion.p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {currentStep === 1 && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="material">Material *</Label>
                            <Select value={formData.material_id} onValueChange={(value) => handleInputChange('material_id', value)}>
                              <SelectTrigger className={getFieldError('material_id') ? 'border-red-300 bg-red-50' : ''}>
                                <SelectValue placeholder="Select material" />
                              </SelectTrigger>
                              <SelectContent>
                                {isLoadingMaterials ? (
                                  <SelectItem value="loading-materials" disabled>Loading materials...</SelectItem>
                                ) : (
                                  materials.map(material => (
                                    <SelectItem key={material.id} value={material.name}>{material.name}</SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                            {getFieldError('material_id') && (
                              <motion.p 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-sm text-red-600 flex items-center gap-1"
                              >
                                <AlertCircle className="w-3 h-3" />
                                {getFieldError('material_id')}
                              </motion.p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="gsm">GSM (g/m²) *</Label>
                            <Input
                              id="gsm"
                              value={formData.gsm}
                              onChange={(e) => handleInputChange('gsm', parseInt(e.target.value) || 0)}
                              placeholder="350"
                              type="number"
                              min="50"
                              max="1000"
                              className={getFieldError('gsm') ? 'border-red-300 bg-red-50' : ''}
                            />
                            {getFieldError('gsm') && (
                              <motion.p 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-sm text-red-600 flex items-center gap-1"
                              >
                                <AlertCircle className="w-3 h-3" />
                                {getFieldError('gsm')}
                              </motion.p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="color" className="flex items-center gap-2">
                            Color Specification *
                            <Palette className="w-4 h-4 text-purple-500" />
                          </Label>
                          <Input
                            id="color"
                            value={formData.color}
                            onChange={(e) => handleInputChange('color', e.target.value)}
                            placeholder="As per Approved Sample/Artwork"
                            className={getFieldError('color') ? 'border-red-300 bg-red-50' : ''}
                          />
                          {getFieldError('color') && (
                            <motion.p 
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="text-sm text-red-600 flex items-center gap-1"
                            >
                              <AlertCircle className="w-3 h-3" />
                              {getFieldError('color')}
                            </motion.p>
                          )}
                        </div>
                      </div>
                    )}

                    {currentStep === 2 && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="fsc">FSC Certified</Label>
                            <Select value={formData.fsc} onValueChange={(value: 'Yes' | 'No') => handleInputChange('fsc', value)}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select FSC status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Yes">Yes</SelectItem>
                                <SelectItem value="No">No</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="fsc_claim">FSC Claim</Label>
                            <Select 
                              value={formData.fsc_claim} 
                              onValueChange={(value: 'Recycled' | 'Mixed') => handleInputChange('fsc_claim', value)}
                              disabled={formData.fsc === 'No'}
                            >
                              <SelectTrigger className={getFieldError('fsc_claim') ? 'border-red-300 bg-red-50' : ''}>
                                <SelectValue placeholder="Select FSC claim" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Recycled">Recycled</SelectItem>
                                <SelectItem value="Mixed">Mixed</SelectItem>
                              </SelectContent>
                            </Select>
                            {getFieldError('fsc_claim') && (
                              <motion.p 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-sm text-red-600 flex items-center gap-1"
                              >
                                <AlertCircle className="w-3 h-3" />
                                {getFieldError('fsc_claim')}
                              </motion.p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {currentStep === 3 && (
                      <div className="space-y-6">
                        <ProcessSequenceSection 
                          selectedProductType={formData.product_type}
                          onProductTypeChange={(productType) => handleInputChange('product_type', productType)}
                          onProcessStepsChange={setSelectedProcessSteps}
                        />
                        
                        {formData.product_type && selectedProcessSteps.length > 0 && (
                          <ProcessPreview 
                            selectedProductType={formData.product_type}
                            selectedProcessSteps={selectedProcessSteps}
                          />
                        )}
                      </div>
                    )}

                    {currentStep === 4 && (
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <Label htmlFor="remarks" className="flex items-center gap-2">
                            Additional Notes & Remarks
                            <FileText className="w-4 h-4 text-green-500" />
                          </Label>
                          <Textarea
                            id="remarks"
                            value={formData.remarks}
                            onChange={(e) => handleInputChange('remarks', e.target.value)}
                            placeholder="Enter any additional specifications, special instructions, or remarks"
                            rows={4}
                            className="resize-none"
                          />
                        </div>

                        {/* Summary */}
                        <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200">
                          <h3 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                            <CheckCircle className="w-5 h-5" />
                            Product Summary
                          </h3>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div><strong>Product Code:</strong> {formData.product_item_code}</div>
                            <div><strong>Brand:</strong> {formData.brand}</div>
                            <div><strong>Material:</strong> {materials.find(m => m.id === formData.material_id)?.name || 'Not selected'}</div>
                            <div><strong>GSM:</strong> {formData.gsm}</div>
                            <div><strong>Color:</strong> {formData.color}</div>
                            <div><strong>FSC:</strong> {formData.fsc}</div>
                            <div><strong>Product Type:</strong> {formData.product_type}</div>
                          </div>
                        </div>

                        {/* Process Preview */}
                        {formData.product_type && selectedProcessSteps.length > 0 && (
                          <ProcessPreview 
                            selectedProductType={formData.product_type}
                            selectedProcessSteps={selectedProcessSteps}
                          />
                        )}
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>

                {/* Navigation */}
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
                  <Button
                    variant="outline"
                    onClick={prevStep}
                    disabled={currentStep === 0}
                    className="gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Previous
                  </Button>

                  <div className="flex items-center gap-2">
                    {validationErrors.length > 0 && (
                      <Badge variant="destructive" className="gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {validationErrors.length} errors
                      </Badge>
                    )}
                  </div>

                  {currentStep < FORM_STEPS.length - 1 ? (
                    <Button
                      onClick={nextStep}
                      disabled={!validateCurrentStep()}
                      className="gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                    >
                      Next
                      <Zap className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSave}
                      disabled={isSaving || validationErrors.length > 0}
                      className="gap-2 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
                    >
                      {isSaving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Complete & Save
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};
