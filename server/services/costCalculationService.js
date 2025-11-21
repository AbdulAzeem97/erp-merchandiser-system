import dbAdapter from '../database/adapter.js';

class CostCalculationService {
  /**
   * Calculate material cost from sheet count
   */
  async calculateMaterialCost(sheetSizeId, totalSheets) {
    try {
      // Check if inventory_materials table exists
      const tableCheck = await dbAdapter.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'inventory_materials'
        )
      `);
      const hasInventoryMaterials = tableCheck.rows[0].exists;

      let query;
      if (hasInventoryMaterials) {
        query = `
          SELECT 
            ms.unit_cost,
            im.unit_cost as material_unit_cost
          FROM material_sizes ms
          LEFT JOIN inventory_materials im ON ms.inventory_material_id = im.id
          WHERE ms.id = $1
        `;
      } else {
        query = `
          SELECT 
            ms.unit_cost,
            NULL as material_unit_cost
          FROM material_sizes ms
          WHERE ms.id = $1
        `;
      }

      const result = await dbAdapter.query(query, [sheetSizeId]);

      if (result.rows.length === 0) {
        throw new Error('Sheet size not found');
      }

      const row = result.rows[0];
      // Use size-specific cost if available, otherwise use material cost, default to 0
      const costPerSheet = parseFloat(row.unit_cost || row.material_unit_cost || 0);
      const totalCost = costPerSheet * totalSheets;

      return {
        costPerSheet,
        totalCost: parseFloat(totalCost.toFixed(2)),
        totalSheets
      };
    } catch (error) {
      console.error('Error calculating material cost:', error);
      throw error;
    }
  }

  /**
   * Calculate wastage cost
   */
  calculateWastageCost(additionalSheets, costPerSheet) {
    const wastageCost = additionalSheets * costPerSheet;
    return parseFloat(wastageCost.toFixed(2));
  }

  /**
   * Get total cost calculation
   */
  async getTotalCost(baseSheets, additionalSheets, sheetSizeId) {
    try {
      const totalSheets = baseSheets + additionalSheets;
      const materialCostData = await this.calculateMaterialCost(sheetSizeId, totalSheets);
      const wastageCost = this.calculateWastageCost(additionalSheets, materialCostData.costPerSheet);

      return {
        baseSheets,
        additionalSheets,
        totalSheets,
        costPerSheet: materialCostData.costPerSheet,
        materialCost: materialCostData.totalCost,
        wastageCost,
        totalCost: parseFloat((materialCostData.totalCost).toFixed(2))
      };
    } catch (error) {
      console.error('Error calculating total cost:', error);
      throw error;
    }
  }

  /**
   * Validate wastage percentage and determine if justification is needed
   */
  validateWastagePercentage(additionalSheets, baseSheets) {
    if (baseSheets === 0) {
      return {
        isValid: false,
        message: 'Base sheets cannot be zero',
        requiresJustification: false,
        requiresConfirmation: false
      };
    }

    const wastagePercentage = (additionalSheets / baseSheets) * 100;

    if (wastagePercentage > 25) {
      return {
        isValid: true,
        wastagePercentage: parseFloat(wastagePercentage.toFixed(2)),
        requiresJustification: true,
        requiresConfirmation: true,
        message: 'High wastage detected (>25%). Confirmation required.'
      };
    } else if (wastagePercentage > 10) {
      return {
        isValid: true,
        wastagePercentage: parseFloat(wastagePercentage.toFixed(2)),
        requiresJustification: true,
        requiresConfirmation: false,
        message: 'Wastage exceeds 10%. Justification required.'
      };
    } else if (wastagePercentage >= 3) {
      return {
        isValid: true,
        wastagePercentage: parseFloat(wastagePercentage.toFixed(2)),
        requiresJustification: false,
        requiresConfirmation: false,
        message: 'Wastage within acceptable range (3-10%)'
      };
    } else {
      return {
        isValid: true,
        wastagePercentage: parseFloat(wastagePercentage.toFixed(2)),
        requiresJustification: false,
        requiresConfirmation: false,
        message: 'Low wastage (<3%)'
      };
    }
  }

  /**
   * Get cost summary for a job planning
   */
  async getCostSummary(jobCardId) {
    try {
      const result = await dbAdapter.query(
        `SELECT 
          base_required_sheets,
          additional_sheets,
          final_total_sheets,
          material_cost,
          selected_sheet_size_id
         FROM job_production_planning
         WHERE job_card_id = $1`,
        [jobCardId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const planning = result.rows[0];
      
      if (!planning.selected_sheet_size_id) {
        return null;
      }

      const costData = await this.getTotalCost(
        planning.base_required_sheets,
        planning.additional_sheets || 0,
        planning.selected_sheet_size_id
      );

      return {
        ...costData,
        material_cost: planning.material_cost ? parseFloat(planning.material_cost) : costData.totalCost
      };
    } catch (error) {
      console.error('Error getting cost summary:', error);
      throw error;
    }
  }
}

export default new CostCalculationService();

