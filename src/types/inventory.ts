// Inventory Management Types

export interface MaterialCategory {
  id: string;
  name: string;
  description?: string;
  code?: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface InventoryMaterial {
  id: string;
  material_id: string;
  category_id?: string;
  unit_of_measurement: 'sheets' | 'kg' | 'rolls' | 'pcs' | 'meters' | 'liters';
  unit_cost: number;
  minimum_stock_level: number;
  reorder_level: number;
  maximum_stock_level: number;
  lead_time_days: number;
  supplier_code?: string;
  storage_location?: string;
  is_active: number;
  created_at: string;
  updated_at: string;
  
  // Joined fields
  material_name?: string;
  material_code?: string;
  material_type?: string;
  category_name?: string;
}

export interface InventoryStock {
  id: string;
  inventory_material_id: string;
  current_stock: number;
  reserved_stock: number;
  available_stock: number;
  last_stock_update: string;
  stock_value: number;
  location?: string;
  batch_number?: string;
  expiry_date?: string;
  created_at: string;
  updated_at: string;
  stock_status?: 'CRITICAL' | 'LOW' | 'NORMAL' | 'OVERSTOCK';
}

export interface StockMovement {
  id: string;
  inventory_stock_id: string;
  movement_type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'RESERVATION' | 'RELEASE';
  quantity: number;
  reference_type?: 'PURCHASE' | 'JOB' | 'ADJUSTMENT' | 'RETURN';
  reference_id?: string;
  unit_cost?: number;
  total_cost?: number;
  reason?: string;
  performed_by: string;
  performed_at: string;
  notes?: string;
  
  // Joined fields
  performed_by_name?: string;
  material_name?: string;
}

export interface JobMaterialRequirement {
  id: string;
  job_card_id: string;
  inventory_material_id: string;
  required_quantity: number;
  allocated_quantity: number;
  status: 'PENDING' | 'PARTIALLY_ALLOCATED' | 'FULLY_ALLOCATED' | 'INSUFFICIENT_STOCK';
  priority: number;
  special_requirements?: string;
  created_at: string;
  updated_at: string;
  
  // Joined fields
  material_name?: string;
  material_code?: string;
  unit_of_measurement?: string;
  current_stock?: number;
  available_stock?: number;
}

export interface JobMaterialAllocation {
  id: string;
  job_material_requirement_id: string;
  inventory_stock_id: string;
  allocated_quantity: number;
  allocation_date: string;
  allocated_by: string;
  status: 'ALLOCATED' | 'ISSUED' | 'RETURNED';
  notes?: string;
}

export interface InventoryJobApproval {
  id: string;
  job_card_id: string;
  requested_by?: string;
  reviewed_by?: string;
  status: 'PENDING' | 'APPROVED' | 'PARTIALLY_APPROVED' | 'REJECTED' | 'PENDING_PROCUREMENT';
  approval_date?: string;
  approval_percentage: number;
  special_approval_reason?: string;
  procurement_required: number;
  estimated_fulfillment_date?: string;
  remarks?: string;
  created_at: string;
  updated_at: string;
}

export interface PurchaseRequest {
  id: string;
  request_number: string;
  status: 'PENDING' | 'APPROVED' | 'ORDERED' | 'RECEIVED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  requested_by: string;
  approved_by?: string;
  total_estimated_cost: number;
  supplier?: string;
  expected_delivery_date?: string;
  request_reason?: string;
  created_at: string;
  updated_at: string;
  
  // Joined fields
  requested_by_name?: string;
  approved_by_name?: string;
  items?: PurchaseRequestItem[];
}

export interface PurchaseRequestItem {
  id: string;
  purchase_request_id: string;
  inventory_material_id: string;
  requested_quantity: number;
  estimated_unit_cost?: number;
  estimated_total_cost?: number;
  reason?: string;
  job_card_ids?: string;
  
  // Joined fields
  material_name?: string;
  material_code?: string;
  unit_of_measurement?: string;
}

export interface Supplier {
  id: string;
  name: string;
  code: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  payment_terms?: string;
  lead_time_days: number;
  rating: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface StockAlert {
  id: string;
  inventory_material_id: string;
  alert_type: 'LOW_STOCK' | 'REORDER_POINT' | 'OVERSTOCK' | 'EXPIRY_WARNING';
  current_level?: number;
  threshold_level?: number;
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
  acknowledged_by?: string;
  acknowledged_at?: string;
  created_at: string;
  
  // Joined fields
  material_name?: string;
  material_code?: string;
  unit_of_measurement?: string;
  acknowledged_by_name?: string;
}

export interface InventoryTransaction {
  id: string;
  transaction_type: 'JOB_ACCEPTANCE' | 'STOCK_ISSUE' | 'PURCHASE_RECEIVED' | 'STOCK_ADJUSTMENT';
  reference_id?: string;
  performed_by: string;
  transaction_date: string;
  description?: string;
  metadata?: string;
}

// API Response Types
export interface InventoryDashboard {
  stats: {
    total_materials: number;
    low_stock_items: number;
    reorder_items: number;
    total_stock_value: number;
    active_alerts: number;
  };
  recent_movements: StockMovement[];
}

export interface StockAvailability {
  available: boolean;
  current_stock: number;
  available_stock: number;
  reserved_stock?: number;
  required_quantity: number;
  shortage: number;
  minimum_stock_level?: number;
  reorder_level?: number;
  status: 'SUFFICIENT' | 'INSUFFICIENT' | 'NO_STOCK_RECORD';
  material_name?: string;
  unit?: string;
}

export interface JobMaterialAnalysis {
  job_card_id: string;
  overall_status: 'FULLY_AVAILABLE' | 'PARTIALLY_AVAILABLE' | 'INSUFFICIENT_STOCK';
  available_percentage: number;
  procurement_needed: boolean;
  material_statuses: Array<{
    inventory_material_id: string;
    material_name: string;
    required_quantity: number;
    allocated_quantity: number;
    available_stock: number;
    status: string;
    shortage: number;
  }>;
  can_proceed: boolean;
  recommendation: string;
}

export interface StockSummary {
  category_name: string;
  material_count: number;
  total_stock: number;
  total_reserved: number;
  total_value: number;
  low_stock_count: number;
}

// Form Types
export interface CreateMaterialForm {
  material_id: string;
  category_id?: string;
  unit_of_measurement: string;
  unit_cost: number;
  minimum_stock_level: number;
  reorder_level: number;
  maximum_stock_level: number;
  lead_time_days: number;
  supplier_code?: string;
  storage_location?: string;
}

export interface StockReceiveForm {
  inventory_material_id: string;
  quantity: number;
  unit_cost: number;
  reference_id: string;
  notes?: string;
}

export interface StockAdjustmentForm {
  inventory_material_id: string;
  adjustment_quantity: number;
  reason: string;
}

export interface JobApprovalForm {
  status: 'APPROVED' | 'PARTIALLY_APPROVED' | 'REJECTED' | 'PENDING_PROCUREMENT';
  approval_percentage?: number;
  special_approval_reason?: string;
  remarks?: string;
}

export interface PurchaseRequestForm {
  materials: Array<{
    inventory_material_id: string;
    quantity: number;
    estimated_unit_cost?: number;
    job_card_ids?: string[];
  }>;
  reason: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  supplier?: string;
  expected_delivery_date?: string;
}

// Enhanced Job with Inventory Info
export interface JobWithInventory {
  id: string;
  job_card_id: string;
  product_item_code?: string;
  brand?: string;
  company_name?: string;
  status: string;
  priority: string;
  delivery_date: string;
  approval_status?: string;
  approval_percentage?: number;
  approval_remarks?: string;
  material_requirements?: JobMaterialRequirement[];
  inventory_approval?: InventoryJobApproval;
}

// Filter and Search Types
export interface InventoryFilters {
  category_id?: string;
  low_stock?: boolean;
  material_type?: string;
  status?: string;
  alert_type?: string;
  date_range?: {
    start: string;
    end: string;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginationResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Material Size Types
export interface MaterialSize {
  id: string;
  inventory_material_id: string;
  size_name: string;
  width_mm: number;
  height_mm: number;
  unit_cost?: number;
  is_default: boolean;
  is_active: boolean;
  current_stock?: number;
  reserved_stock?: number;
  available_stock?: number;
  created_at: string;
  updated_at: string;
}

export interface MaterialWithSizes extends InventoryMaterial {
  sizes?: MaterialSize[];
  has_multiple_sizes: boolean;
  default_size?: MaterialSize;
}

// Sheet Layout Types
export interface CuttingLayout {
  type: 'horizontal' | 'vertical' | 'smart';
  blanksPerRow: number;
  blanksPerColumn: number;
  blanksPerSheet: number;
  usedWidth: number;
  usedHeight: number;
  wastageWidth: number;
  wastageHeight: number;
  wastageArea: number;
  wastagePercentage: number;
  efficiencyPercentage: number;
  gridPattern: string;
}

export interface LayoutOptions {
  horizontal: CuttingLayout;
  vertical: CuttingLayout;
  smart: CuttingLayout;
  best: CuttingLayout;
}

// Sheet Optimization Types
export interface SheetOptimization {
  size: {
    id: string;
    size_name: string;
    width_mm: number;
    height_mm: number;
    unit_cost?: number;
    available_stock: number;
    current_stock: number;
    reserved_stock: number;
  };
  layouts: LayoutOptions;
  bestLayout: CuttingLayout;
  baseRequiredSheets: number;
  totalSheets: number;
  efficiency: number;
  wastage: number;
  hasStock: boolean;
  stockShortage: number;
}

export interface OptimizationResult {
  optimizations: SheetOptimization[];
  best: SheetOptimization;
  hasMultipleSizes: boolean;
}

// Production Planning Types
export interface JobProductionPlanning {
  id: string;
  job_card_id: string;
  selected_material_size_id?: string;
  selected_sheet_size_id?: string;
  cutting_layout_type?: 'horizontal' | 'vertical' | 'smart';
  grid_pattern?: string;
  blanks_per_sheet?: number;
  efficiency_percentage?: number;
  scrap_percentage?: number;
  base_required_sheets?: number;
  additional_sheets: number;
  final_total_sheets?: number;
  material_cost?: number;
  wastage_justification?: string;
  planning_status: 'PENDING' | 'PLANNED' | 'LOCKED' | 'APPLIED';
  planned_at?: string;
  planned_by?: string;
  created_at: string;
  updated_at: string;
}

// Cost Calculation Types
export interface CostSummary {
  baseSheets: number;
  additionalSheets: number;
  totalSheets: number;
  costPerSheet: number;
  materialCost: number;
  wastageCost: number;
  totalCost: number;
}

export interface WastageValidation {
  isValid: boolean;
  wastagePercentage: number;
  requiresJustification: boolean;
  requiresConfirmation: boolean;
  message: string;
}

// Smart Dashboard Job Types
export interface SmartDashboardJob {
  prepress_job_id: string;
  job_card_id: string;
  job_card_number: string;
  product_name: string;
  product_item_code: string;
  product_type: string;
  customer_name: string;
  company_name: string;
  quantity: number;
  priority: string;
  delivery_date: string;
  prepress_status: string;
  plate_generated: boolean;
  plate_generated_at: string;
  created_at: string;
  material_name: string;
  planning_status: 'PENDING' | 'PLANNED' | 'LOCKED' | 'APPLIED';
  final_total_sheets?: number;
  material_cost?: number;
}

// Cutting Guide Types
export interface CuttingGuide {
  jobNumber: string;
  company: string;
  product: string;
  quantity: number;
  sheetSize: {
    name: string;
    width: number;
    height: number;
  };
  layout: {
    type: string;
    gridPattern: string;
    blanksPerSheet: number;
    efficiency: number;
    scrap: number;
  };
  sheets: {
    base: number;
    additional: number;
    total: number;
  };
  cost: number;
}