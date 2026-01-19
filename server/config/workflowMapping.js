/**
 * Workflow Step to Department Mapping
 * Maps step names to their corresponding departments
 * Used when process_steps table doesn't have department information
 */

export const STEP_DEPARTMENT_MAPPING = {
  // Prepress Department Steps
  'Design': 'Prepress',
  'Design Review': 'Prepress',
  'Pre-Press Setup': 'Prepress',
  'Prepress Setup': 'Prepress',
  'File Preparation': 'Prepress',
  'QA Review (Design)': 'Prepress',
  'QA Review': 'Prepress',
  'CTP': 'Prepress',
  'Plate Making': 'Prepress',
  'Plate Generation': 'Prepress',
  
  // Production Press Department Steps
  'Printing': 'Production',
  'Main Printing': 'Production',
  'Production Run': 'Production',
  'Screen Preparation': 'Production',
  'Stencil Creation': 'Production',
  'Ink Mixing': 'Production',
  'Ink Preparation': 'Production',
  'Setup Registration': 'Production',
  'Machine Setup': 'Production',
  'Color Matching': 'Production',
  'Test Print': 'Production',
  'Curing/Drying': 'Production',
  'Drying': 'Production',
  
  // Cutting Department Steps (Separate from Production)
  'Cutting': 'Cutting',
  'Die Cutting': 'Cutting',
  'Paper Cutting': 'Cutting',
  'Press Cutting': 'Cutting',
  'Trimming': 'Cutting',
  
  // Production Finishing Department Steps
  'Finishing': 'Finishing',
  'Lamination': 'Finishing',
  'Lamination Matte': 'Finishing',
  'Lamination Gloss': 'Finishing',
  'Lamination Soft Touch': 'Finishing',
  'UV Coating': 'Finishing',
  'UV': 'Finishing',
  'Varnishing': 'Finishing',
  'Varnish Matt': 'Finishing',
  'Varnish Gloss': 'Finishing',
  'Varnish Soft Touch': 'Finishing',
  'Embossing': 'Finishing',
  'Debossing': 'Finishing',
  'Foil Stamping': 'Finishing',
  'Foil Matte': 'Finishing',
  'Foil Gloss': 'Finishing',
  'Screen Printing': 'Production',
  'Creasing': 'Finishing',
  'Folding': 'Finishing',
  'Perforation': 'Finishing',
  'Scoring': 'Finishing',
  'Gluing': 'Finishing',
  'Pasting': 'Finishing',
  'Inlay Pasting': 'Finishing',
  'Two Way Tape': 'Finishing',
  'Two way tape': 'Finishing',
  'Binding': 'Finishing',
  'Corner Rounding': 'Finishing',
  'Hole Punching': 'Finishing',
  'String Attachment': 'Finishing',
  'Breaking': 'Finishing',
  'Piggy Sticker': 'Finishing',
  'RFID': 'Finishing',
  'Eyelet': 'Finishing',
  
  // Offset Printing Department Steps (Separate from Production)
  'Offset Printing': 'Offset Printing',
  
  // Production Press Department Steps (Separate from Finishing)
  'Digital Printing': 'Production',
  
  // Quality Assurance Department Steps (Separate from Production)
  'Quality Check': 'QA',
  'Quality Inspection': 'QA',
  'Final QA': 'QA',
  'QA Review (Final)': 'QA',
  'Ready': 'QA',
  
  // Logistics/Dispatch Department Steps (Separate from Production)
  'Packaging': 'Logistics',
  'Packing': 'Logistics',
  'Final Count': 'Logistics',
  'Shipping Prep': 'Logistics',
  'Dispatch': 'Logistics',
  
  // Inventory Department Steps
  'Material Procurement': 'Inventory',
  'Material Issuance': 'Inventory',
  'Excess': 'Inventory',
  
  // External Operations
  'Out Source': 'External',
};

/**
 * Steps that require QA review
 */
export const QA_REQUIRED_STEPS = [
  'Design',
  'Design Review',
  'QA Review',
  'QA Review (Design)',
  'Quality Check',
  'Quality Inspection',
  'Final QA',
  'QA Review (Final)',
];

/**
 * Steps that auto-complete after certain actions
 * e.g., CTP auto-completes after plate generation
 */
export const AUTO_ACTION_STEPS = {
  'CTP': 'plate_generated', // Auto-complete when plate is generated
  'Plate Making': 'plate_generated',
  'Plate Generation': 'plate_generated',
};

/**
 * Get department for a step name
 * @param {string} stepName - Name of the step
 * @returns {string} Department name
 */
export function getDepartmentForStep(stepName) {
  // Try exact match first
  if (STEP_DEPARTMENT_MAPPING[stepName]) {
    return STEP_DEPARTMENT_MAPPING[stepName];
  }
  
  // Try case-insensitive match
  const stepLower = stepName.toLowerCase();
  for (const [key, dept] of Object.entries(STEP_DEPARTMENT_MAPPING)) {
    if (key.toLowerCase() === stepLower) {
      return dept;
    }
  }
  
  // Try partial match (e.g., "Design" matches "Design Review")
  for (const [key, dept] of Object.entries(STEP_DEPARTMENT_MAPPING)) {
    if (stepLower.includes(key.toLowerCase()) || key.toLowerCase().includes(stepLower)) {
      return dept;
    }
  }
  
  // Default to Prepress if contains design/ctp/plate
  if (stepLower.includes('design') || stepLower.includes('ctp') || stepLower.includes('plate')) {
    return 'Prepress';
  }
  
  // Default to Cutting if contains cut/die/trim (but not finish)
  if ((stepLower.includes('cut') || stepLower.includes('die') || stepLower.includes('trim')) && !stepLower.includes('finish')) {
    return 'Cutting';
  }
  
  // Default to Offset Printing if contains "offset printing"
  if (stepLower.includes('offset printing') || (stepLower.includes('offset') && stepLower.includes('print'))) {
    return 'Offset Printing';
  }
  
  // Default to Production if contains print (but not finishing operations or offset)
  if (stepLower.includes('print') && !stepLower.includes('finish') && !stepLower.includes('varnish') && !stepLower.includes('lamination') && !stepLower.includes('offset')) {
    return 'Production';
  }
  
  // Default to Finishing if contains finish/varnish/lamination/uv/foil/emboss
  if (stepLower.includes('finish') || stepLower.includes('varnish') || 
      stepLower.includes('lamination') || stepLower.includes('uv') || 
      stepLower.includes('foil') || stepLower.includes('emboss') ||
      stepLower.includes('deboss') || stepLower.includes('pasting') ||
      stepLower.includes('breaking') || stepLower.includes('rfid') ||
      stepLower.includes('eyelet') || stepLower.includes('piggy')) {
    return 'Finishing';
  }
  
  // Default to QA if contains quality/qa/ready
  if (stepLower.includes('quality') || stepLower.includes('qa') || stepLower.includes('ready')) {
    return 'QA';
  }
  
  // Default to Logistics if contains pack/dispatch/shipping
  if (stepLower.includes('pack') || stepLower.includes('dispatch') || stepLower.includes('shipping')) {
    return 'Logistics';
  }
  
  // Default to Inventory if contains material/procurement/issuance/excess
  if (stepLower.includes('material') || stepLower.includes('procurement') || 
      stepLower.includes('issuance') || stepLower.includes('excess')) {
    return 'Inventory';
  }
  
  // Default fallback
  return 'Prepress';
}

/**
 * Check if step requires QA
 * @param {string} stepName - Name of the step
 * @returns {boolean}
 */
export function requiresQA(stepName) {
  return QA_REQUIRED_STEPS.some(qaStep => 
    stepName.toLowerCase().includes(qaStep.toLowerCase()) ||
    qaStep.toLowerCase().includes(stepName.toLowerCase())
  );
}

/**
 * Check if step has auto-action
 * @param {string} stepName - Name of the step
 * @returns {string|null} Auto-action type or null
 */
export function getAutoAction(stepName) {
  const stepLower = stepName.toLowerCase();
  for (const [key, action] of Object.entries(AUTO_ACTION_STEPS)) {
    if (stepLower.includes(key.toLowerCase())) {
      return action;
    }
  }
  return null;
}

