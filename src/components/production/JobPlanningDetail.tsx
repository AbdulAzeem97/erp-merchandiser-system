import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Save,
  CheckCircle,
  FileText,
  TrendingUp,
  AlertTriangle,
  Info,
  Calculator,
  Package,
  Scissors,
  DollarSign,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { MainLayout } from '@/components/layout/MainLayout';
import ClockTimer from '@/components/ui/ClockTimer';
import MaterialSizeSelector from './MaterialSizeSelector';
import { SheetSizeSelector } from './SheetSizeSelector';
import CuttingLayoutCard from './CuttingLayoutCard';
import AdditionalSheetPanel from './AdditionalSheetPanel';
import CostSummaryBox from './CostSummaryBox';
import CuttingVisualization from './CuttingVisualization';
import {
  OptimizationResult,
  SheetOptimization,
  JobProductionPlanning,
  CostSummary,
  WastageValidation
} from '@/types/inventory';

interface JobDetails {
  prepress_job_id: string;
  job_card_id: string;
  job_card_number: string;
  quantity: number;
  priority: string;
  delivery_date: string;
  product: {
    id: string;
    name: string;
    item_code: string;
    type: string;
    material_name: string;
  };
  company: {
    name: string;
    customer_name: string;
  };
  material_id: string | null;
  planning: JobProductionPlanning | null;
  ratioReport: {
    total_sheets: number | null;
    qty_produced: number | null;
    total_ups: number | null;
    efficiency_percentage: number | null;
    created_at: string | null;
  } | null;
}

const JobPlanningDetail: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [jobDetails, setJobDetails] = useState<JobDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [blankWidth, setBlankWidth] = useState<number>(0);
  const [blankHeight, setBlankHeight] = useState<number>(0);
  const [ups, setUps] = useState<number>(1);
  const [selectedSheetSize, setSelectedSheetSize] = useState<any | null>(null);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [selectedOptimization, setSelectedOptimization] = useState<SheetOptimization | null>(null);
  const [selectedLayout, setSelectedLayout] = useState<'horizontal' | 'vertical' | 'smart'>('horizontal');
  const [additionalSheets, setAdditionalSheets] = useState<number>(0);
  const [wastageJustification, setWastageJustification] = useState<string>('');
  const [costSummary, setCostSummary] = useState<CostSummary | null>(null);
  const [wastageValidation, setWastageValidation] = useState<WastageValidation | null>(null);
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationError, setCalculationError] = useState<string | null>(null);

  // Load job details
  useEffect(() => {
    if (jobId) {
      loadJobDetails();
    }
  }, [jobId]);

  const loadJobDetails = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/production/smart-dashboard/jobs/${jobId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setJobDetails(data.job);
          if (data.job.planning) {
            setAdditionalSheets(data.job.planning.additional_sheets || 0);
            setWastageJustification(data.job.planning.wastage_justification || '');
            setSelectedLayout(data.job.planning.cutting_layout_type || 'horizontal');
          }
          
          // If material_id is missing, try to find it from material name
          if (!data.job.material_id && data.job.product.material_name) {
            console.warn('Material ID not found, optimization may not work. Material name:', data.job.product.material_name);
            toast.warning('Material ID not found. Please ensure material is properly configured in inventory.');
          }
        } else {
          console.error('API returned success=false:', data);
          toast.error(data.error || 'Failed to load job details');
          navigate('/production/smart-dashboard');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('API error response:', response.status, errorData);
        toast.error(errorData.message || errorData.error || `Failed to load job details (${response.status})`);
        navigate('/production/smart-dashboard');
      }
    } catch (error) {
      console.error('Error loading job details:', error);
      toast.error('Error loading job details');
      navigate('/production/smart-dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  // Manual calculation - removed auto-calculate

  const calculateOptimization = async () => {
    try {
      if (!jobDetails || !jobDetails.material_id) {
        setCalculationError('Material ID is missing');
        return;
      }

      if (!selectedSheetSize) {
        setCalculationError('Please select a sheet size first');
        return;
      }

      if (blankWidth <= 0 || blankHeight <= 0) {
        setCalculationError('Please enter valid blank dimensions');
        return;
      }

      if (ups <= 0) {
        setCalculationError('UPS must be greater than 0');
        return;
      }

      setIsCalculating(true);
      setCalculationError(null);

      const token = localStorage.getItem('authToken');
      const effectiveQuantity = Math.ceil(jobDetails.quantity / ups);
      
      // Calculate optimization for the selected sheet size
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/production/smart-dashboard/jobs/${jobId}/optimize`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            blankWidth,
            blankHeight,
            requiredQuantity: effectiveQuantity,
            materialId: jobDetails.material_id,
            sheetSizeId: selectedSheetSize.id // Use selected size
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Handle single size optimization result
          if (data.optimization) {
            // Single size result - wrap it in the expected format
            setOptimizationResult({
              optimizations: [data.optimization],
              best: data.optimization
            });
            setSelectedOptimization(data.optimization);
            setSelectedLayout(data.optimization.bestLayout.type);
          } else if (data.best) {
            // Multiple sizes result (backward compatibility)
            setOptimizationResult(data);
            setSelectedOptimization(data.best);
            setSelectedLayout(data.best.bestLayout.type);
          } else {
            setCalculationError('No optimal solution found. Please check your dimensions.');
            return;
          }
          // Reset additional sheets when new optimization is calculated
          setAdditionalSheets(0);
          calculateCost();
          toast.success('Optimization calculated successfully');
        } else {
          setCalculationError(data.error || 'Failed to calculate optimization');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        setCalculationError(errorData.message || errorData.error || 'Failed to calculate optimization');
        toast.error(errorData.message || 'Failed to calculate optimization');
      }
    } catch (error: any) {
      console.error('Error calculating optimization:', error);
      setCalculationError(error.message || 'Error calculating optimization');
      toast.error('Error calculating optimization');
    } finally {
      setIsCalculating(false);
    }
  };

  // Calculate cost when optimization or additional sheets change
  useEffect(() => {
    if (selectedOptimization && additionalSheets >= 0) {
      calculateCost();
    }
  }, [selectedOptimization, additionalSheets]);

  const calculateCost = async () => {
    if (!selectedOptimization) return;

    try {
      const token = localStorage.getItem('authToken');
      // Use ratio report sheets as base if available, otherwise use calculated base
      const baseSheets = jobDetails?.ratioReport?.total_sheets || selectedOptimization.baseRequiredSheets;
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/production/smart-dashboard/jobs/${jobId}/cost`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            baseSheets,
            additionalSheets,
            sheetSizeId: selectedOptimization.size.id
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCostSummary(data.costSummary);
          validateWastage();
        }
      }
    } catch (error) {
      console.error('Error calculating cost:', error);
    }
  };

  const validateWastage = () => {
    if (!selectedOptimization || additionalSheets < 0) return;

    // Use ratio report sheets as base if available, otherwise use calculated base
    const baseSheets = jobDetails?.ratioReport?.total_sheets || selectedOptimization.baseRequiredSheets;
    const wastagePercentage = (additionalSheets / baseSheets) * 100;

    if (wastagePercentage > 25) {
      setWastageValidation({
        isValid: true,
        wastagePercentage: parseFloat(wastagePercentage.toFixed(2)),
        requiresJustification: true,
        requiresConfirmation: true,
        message: 'High wastage detected (>25%). Confirmation required.'
      });
    } else if (wastagePercentage > 10) {
      setWastageValidation({
        isValid: true,
        wastagePercentage: parseFloat(wastagePercentage.toFixed(2)),
        requiresJustification: true,
        requiresConfirmation: false,
        message: 'Wastage exceeds 10%. Justification required.'
      });
    } else if (wastagePercentage >= 3) {
      setWastageValidation({
        isValid: true,
        wastagePercentage: parseFloat(wastagePercentage.toFixed(2)),
        requiresJustification: false,
        requiresConfirmation: false,
        message: 'Wastage within acceptable range (3-10%)'
      });
    } else {
      setWastageValidation({
        isValid: true,
        wastagePercentage: parseFloat(wastagePercentage.toFixed(2)),
        requiresJustification: false,
        requiresConfirmation: false,
        message: 'Low wastage (<3%)'
      });
    }
  };

  const handleSavePlanning = async () => {
    if (!selectedOptimization || !costSummary) {
      toast.error('Please complete optimization first');
      return;
    }

    if (wastageValidation?.requiresJustification && !wastageJustification.trim()) {
      toast.error('Please provide wastage justification');
      return;
    }

    if (wastageValidation?.requiresConfirmation) {
      setShowConfirmationDialog(true);
      return;
    }

    await savePlanning();
  };

  const savePlanning = async () => {
    try {
      setIsSaving(true);
      const token = localStorage.getItem('authToken');
      const selectedLayoutData = selectedOptimization!.layouts[selectedLayout];

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/production/smart-dashboard/jobs/${jobId}/planning`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            selectedSheetSizeId: selectedOptimization!.size.id,
            cuttingLayoutType: selectedLayout,
            gridPattern: selectedLayoutData.gridPattern,
            blanksPerSheet: selectedLayoutData.blanksPerSheet,
            efficiencyPercentage: selectedLayoutData.efficiencyPercentage,
            scrapPercentage: selectedLayoutData.wastagePercentage,
            baseRequiredSheets: jobDetails?.ratioReport?.total_sheets || selectedOptimization!.baseRequiredSheets,
            additionalSheets,
            wastageJustification: wastageJustification || null
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast.success('Planning saved successfully');
          loadJobDetails();
        } else {
          toast.error('Failed to save planning');
        }
      } else {
        toast.error('Failed to save planning');
      }
    } catch (error) {
      console.error('Error saving planning:', error);
      toast.error('Error saving planning');
    } finally {
      setIsSaving(false);
      setShowConfirmationDialog(false);
    }
  };

  const handleApplyPlanning = async () => {
    if (!jobDetails?.planning || jobDetails.planning.planning_status === 'APPLIED') {
      toast.error('Planning must be saved and not already applied');
      return;
    }

    try {
      setIsApplying(true);
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/production/smart-dashboard/jobs/${jobId}/apply`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast.success('Planning applied successfully. Inventory deducted and workflow updated.');
          loadJobDetails();
        } else {
          toast.error(data.error || 'Failed to apply planning');
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to apply planning');
      }
    } catch (error) {
      console.error('Error applying planning:', error);
      toast.error('Error applying planning');
    } finally {
      setIsApplying(false);
    }
  };

  const handlePrintGuide = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/production/smart-dashboard/jobs/${jobId}/cutting-guide-pdf`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // TODO: Generate PDF using cuttingGuidePdfGenerator
          toast.success('Cutting guide data ready for PDF generation');
        }
      }
    } catch (error) {
      console.error('Error generating cutting guide:', error);
      toast.error('Error generating cutting guide');
    }
  };

  if (isLoading || !jobDetails) {
    return (
      <MainLayout currentPage="smart-production-dashboard">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading job details...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  const getStartTime = () => {
    if (jobDetails.planning?.planned_at) {
      return new Date(jobDetails.planning.planned_at);
    }
    return new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago as fallback
  };

  const getSLATimeMinutes = () => {
    // Default 4 hours for production planning
    return 240;
  };

  return (
    <MainLayout currentPage="smart-production-dashboard">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        {/* Header */}
        <div className="bg-white border-b shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/production/smart-dashboard')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Job Planning - {jobDetails.job_card_number}
                </h1>
                <p className="text-sm text-gray-600">
                  {jobDetails.company.customer_name || jobDetails.company.name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {jobDetails.planning && jobDetails.planning.planning_status !== 'APPLIED' && (
                <Button
                  onClick={handleApplyPlanning}
                  disabled={isApplying || jobDetails.planning.planning_status === 'PENDING'}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {isApplying ? 'Applying...' : 'Apply Planning'}
                </Button>
              )}
              {jobDetails.planning && (
                <Button
                  onClick={handlePrintGuide}
                  variant="outline"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Print Guide
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6 max-w-7xl mx-auto">
          {/* Job Information Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Job Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-sm text-gray-500">Customer</Label>
                  <p className="font-medium">{jobDetails.company.customer_name || jobDetails.company.name}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Product</Label>
                  <p className="font-medium">{jobDetails.product.name}</p>
                  <p className="text-sm text-gray-600">{jobDetails.product.item_code}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Quantity</Label>
                  <p className="font-medium">{jobDetails.quantity.toLocaleString()} units</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Material</Label>
                  <p className="font-medium">{jobDetails.product.material_name || 'N/A'}</p>
                </div>
              </div>

              {/* Blank Dimensions Input */}
              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div>
                    <Label htmlFor="blankWidth" className="text-sm font-medium">
                      Blank Width (mm) *
                    </Label>
                    <Input
                      id="blankWidth"
                      type="number"
                      min="1"
                      step="0.1"
                      value={blankWidth || ''}
                      onChange={(e) => setBlankWidth(parseFloat(e.target.value) || 0)}
                      placeholder="e.g., 100"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="blankHeight" className="text-sm font-medium">
                      Blank Height (mm) *
                    </Label>
                    <Input
                      id="blankHeight"
                      type="number"
                      min="1"
                      step="0.1"
                      value={blankHeight || ''}
                      onChange={(e) => setBlankHeight(parseFloat(e.target.value) || 0)}
                      placeholder="e.g., 150"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ups" className="text-sm font-medium">
                      UPS (Units Per Sheet) *
                    </Label>
                    <Input
                      id="ups"
                      type="number"
                      min="1"
                      value={ups || ''}
                      onChange={(e) => setUps(parseInt(e.target.value) || 1)}
                      placeholder="e.g., 1"
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Effective quantity: {jobDetails ? Math.ceil(jobDetails.quantity / (ups || 1)) : 0} sheets
                    </p>
                  </div>
                </div>
              </div>

              {/* SLA Clock */}
              <div className="mt-4 flex justify-center">
                <ClockTimer
                  startTime={getStartTime()}
                  slaTimeMinutes={getSLATimeMinutes()}
                  stageName="Production Planning"
                  size="sm"
                />
              </div>
            </CardContent>
          </Card>

          {/* Ratio Report Data Card */}
          {jobDetails.ratioReport && (
            <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-green-600" />
                  Ratio Report Data
                  <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800">
                    From CSV Upload
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-sm text-gray-600">Total Sheets</Label>
                    <p className="text-lg font-semibold text-green-700">
                      {jobDetails.ratioReport.total_sheets?.toLocaleString() || 'N/A'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">From ratio software</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Quantity Produced</Label>
                    <p className="text-lg font-semibold text-green-700">
                      {jobDetails.ratioReport.qty_produced?.toLocaleString() || 'N/A'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Expected production</p>
                  </div>
                  {jobDetails.ratioReport.total_ups && (
                    <div>
                      <Label className="text-sm text-gray-600">Total UPS</Label>
                      <p className="text-lg font-semibold text-green-700">
                        {jobDetails.ratioReport.total_ups.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Units per sheet</p>
                    </div>
                  )}
                  {jobDetails.ratioReport.efficiency_percentage !== null && jobDetails.ratioReport.efficiency_percentage !== undefined && (
                    <div>
                      <Label className="text-sm text-gray-600">Efficiency</Label>
                      <p className="text-lg font-semibold text-green-700">
                        {typeof jobDetails.ratioReport.efficiency_percentage === 'number' 
                          ? jobDetails.ratioReport.efficiency_percentage.toFixed(1)
                          : parseFloat(jobDetails.ratioReport.efficiency_percentage)?.toFixed(1) || 'N/A'}%
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Production efficiency</p>
                    </div>
                  )}
                </div>
                {jobDetails.ratioReport.created_at && (
                  <div className="mt-4 pt-4 border-t border-green-200">
                    <p className="text-xs text-gray-500">
                      Report uploaded: {new Date(jobDetails.ratioReport.created_at).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Sheet Size Selector - Manual selection with add option */}
          {jobDetails.material_id && (
            <SheetSizeSelector
              materialId={jobDetails.material_id}
              materialName={jobDetails.product.material_name}
              onSizeSelect={(size) => {
                setSelectedSheetSize(size);
                // Clear previous optimization when size changes
                if (size) {
                  setOptimizationResult(null);
                  setSelectedOptimization(null);
                  setCalculationError(null);
                } else {
                  setSelectedSheetSize(null);
                }
              }}
              selectedSizeId={selectedSheetSize?.id}
            />
          )}

          {/* Calculate Button - Only show when size is selected */}
          {jobDetails.material_id && selectedSheetSize && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    {calculationError && (
                      <div className="flex items-center gap-2 text-red-600 text-sm">
                        <AlertTriangle className="h-4 w-4" />
                        <span>{calculationError}</span>
                      </div>
                    )}
                    {!calculationError && !optimizationResult && (
                      <p className="text-sm text-gray-600">
                        Sheet size selected. Enter blank dimensions and click Calculate to see optimization results.
                      </p>
                    )}
                    {!calculationError && optimizationResult && (
                      <p className="text-sm text-green-600">
                        ✓ Optimization calculated. Review results below.
                      </p>
                    )}
                  </div>
                  <Button
                    onClick={calculateOptimization}
                    disabled={isCalculating || !blankWidth || !blankHeight || !ups || !selectedSheetSize}
                    className="ml-4"
                    size="lg"
                  >
                    <Calculator className="h-4 w-4 mr-2" />
                    {isCalculating ? 'Calculating...' : 'Calculate Optimization'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Loading State */}
          {isCalculating && (
            <Card>
              <CardContent className="p-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Calculating optimal sheet sizes and cutting layouts...</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sheet Optimization Results */}
          {optimizationResult && selectedOptimization && !isCalculating && (
            <>
              {/* Optimization Summary */}
              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    Optimization Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-lg border">
                      <Label className="text-xs text-gray-500">Selected Sheet Size</Label>
                      <p className="font-bold text-lg mt-1">
                        {selectedOptimization.size.width_mm} × {selectedOptimization.size.height_mm} mm
                      </p>
                      <p className="text-xs text-gray-600 mt-1">{selectedOptimization.size.size_name}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border">
                      <Label className="text-xs text-gray-500">Base Required Sheets</Label>
                      <p className="font-bold text-lg mt-1">{selectedOptimization.baseRequiredSheets}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        {selectedOptimization.bestLayout.blanksPerSheet} blanks/sheet
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border">
                      <Label className="text-xs text-gray-500">Best Layout Efficiency</Label>
                      <p className="font-bold text-lg mt-1 text-green-600">
                        {selectedOptimization.bestLayout.efficiencyPercentage.toFixed(1)}%
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {selectedOptimization.bestLayout.type} layout
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border">
                      <Label className="text-xs text-gray-500">Wastage</Label>
                      <p className="font-bold text-lg mt-1 text-amber-600">
                        {selectedOptimization.bestLayout.wastagePercentage.toFixed(1)}%
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        Grid: {selectedOptimization.bestLayout.gridPattern}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Layout Cards */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Scissors className="h-5 w-5" />
                    Cutting Layout Options
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <CuttingLayoutCard
                      layout={selectedOptimization.layouts.horizontal}
                      isSelected={selectedLayout === 'horizontal'}
                      isBest={selectedOptimization.bestLayout.type === 'horizontal'}
                      onClick={() => setSelectedLayout('horizontal')}
                    />
                    <CuttingLayoutCard
                      layout={selectedOptimization.layouts.vertical}
                      isSelected={selectedLayout === 'vertical'}
                      isBest={selectedOptimization.bestLayout.type === 'vertical'}
                      onClick={() => setSelectedLayout('vertical')}
                    />
                    <CuttingLayoutCard
                      layout={selectedOptimization.layouts.smart}
                      isSelected={selectedLayout === 'smart'}
                      isBest={selectedOptimization.bestLayout.type === 'smart'}
                      onClick={() => setSelectedLayout('smart')}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Additional Sheets Panel */}
              <AdditionalSheetPanel
                baseRequiredSheets={selectedOptimization.baseRequiredSheets}
                additionalSheets={additionalSheets}
                onAdditionalSheetsChange={setAdditionalSheets}
                wastageValidation={wastageValidation}
                wastageJustification={wastageJustification}
                onWastageJustificationChange={setWastageJustification}
                ratioReportSheets={jobDetails.ratioReport?.total_sheets || null}
              />

              {/* Cost Summary */}
              {costSummary && (
                <CostSummaryBox costSummary={costSummary} />
              )}

              {/* Cutting Visualization */}
              {selectedOptimization && (
                <CuttingVisualization
                  layout={selectedOptimization.layouts[selectedLayout]}
                  sheetSize={{
                    width: selectedOptimization.size.width_mm,
                    height: selectedOptimization.size.height_mm
                  }}
                  blankSize={{
                    width: blankWidth,
                    height: blankHeight
                  }}
                />
              )}

              {/* Action Buttons */}
              <div className="flex gap-4">
                <Button
                  onClick={handleSavePlanning}
                  disabled={isSaving || !costSummary}
                  className="flex-1"
                  size="lg"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save Planning'}
                </Button>
                {jobDetails.planning && jobDetails.planning.planning_status !== 'APPLIED' && (
                  <Button
                    onClick={handleApplyPlanning}
                    disabled={isApplying || jobDetails.planning.planning_status === 'PENDING'}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    size="lg"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {isApplying ? 'Applying...' : 'Apply Planning'}
                  </Button>
                )}
              </div>
            </>
          )}

          {/* Confirmation Dialog */}
          <Dialog open={showConfirmationDialog} onOpenChange={setShowConfirmationDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                  High Wastage Confirmation
                </DialogTitle>
                <DialogDescription>
                  Wastage exceeds 25%. Are you sure you want to proceed?
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <p className="text-sm text-gray-600 mb-2">
                  Wastage Percentage: <strong>{wastageValidation?.wastagePercentage}%</strong>
                </p>
                <p className="text-sm text-gray-600">
                  Additional Sheets: <strong>{additionalSheets}</strong>
                </p>
                {wastageJustification && (
                  <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                    <Label className="text-sm font-medium">Justification:</Label>
                    <p className="text-sm text-gray-700 mt-1">{wastageJustification}</p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmationDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={savePlanning}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Confirm & Save
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </MainLayout>
  );
};

export default JobPlanningDetail;

