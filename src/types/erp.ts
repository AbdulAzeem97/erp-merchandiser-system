export interface ProductMaster {
  id: string;
  product_item_code: string;
  brand: string;
  material_id?: string;
  material_name?: string;
  material_code?: string;
  gsm: number;
  product_type: ProductType;
  category_id?: string;
  category_name?: string;
  fsc?: string;
  fsc_claim?: string;
  color_specifications?: string;
  color?: string; // Alias for color_specifications
  remarks?: string;
  is_active: boolean;
  created_by?: string;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
  processSequence?: ProcessSequence; // Add process sequence for PDF generation
}

export type ProductType = 'Offset' | 'Heat Transfer Label' | 'PFL' | 'Woven' | 'Thermal' | 'Leather Patch' | 'Digital' | 'Screen Print' | 'Embroidery';

export interface ProcessStep {
  id: string;
  name: string;
  isCompulsory: boolean;
  isSelected: boolean;
  is_compulsory?: boolean; // Database field name
  is_selected?: boolean; // Database field name
  order: number;
  step_order?: number; // Database field name
}

export interface ProcessSequence {
  productType: ProductType;
  steps: ProcessStep[];
}

export const PRODUCT_TYPES: ProductType[] = [
  'Offset',
  'Heat Transfer Label', 
  'PFL',
  'Woven',
  'Thermal',
  'Leather Patch',
  'Digital',
  'Screen Print',
  'Embroidery'
];

export const BRANDS = ['JCP', 'GAP', 'H&M', 'Target', 'Walmart', 'Amazon', 'Nike', 'Adidas'];
export const MATERIALS = ['C1S', 'C2S', 'Kraft', 'Art Paper', 'Duplex', 'Corrugated', 'Coated Paper'];