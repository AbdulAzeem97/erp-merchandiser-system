import dbAdapter from '../database/adapter.js';
import materialSizeService from './materialSizeService.js';

class SheetOptimizationService {
  /**
   * Main optimization engine - finds best sheet size and layout for a job
   * @param {string} jobId - Job ID
   * @param {object} blankDimensions - {width, height} in mm
   * @param {number} requiredQuantity - Required quantity
   * @param {string} materialId - Material ID
   * @param {string|number} [specificSizeId] - Optional: calculate only for this specific size
   */
  async optimizeSheetSelection(jobId, blankDimensions, requiredQuantity, materialId, specificSizeId = null) {
    try {
      // Get all available sizes for the material
      const { sizes, hasMultipleSizes } = await materialSizeService.getMaterialSizes(materialId);
      
      if (!sizes || sizes.length === 0) {
        throw new Error('No sheet sizes available for this material');
      }

      // Filter to specific size if provided
      let sizesToProcess = sizes;
      if (specificSizeId) {
        const specificSize = sizes.find(s => s.id.toString() === specificSizeId.toString());
        if (!specificSize) {
          throw new Error(`Sheet size with ID ${specificSizeId} not found`);
        }
        sizesToProcess = [specificSize];
      }

      const { width: blankWidth, height: blankHeight } = blankDimensions;
      const optimizations = [];

      // Calculate optimization for each size (or just the selected one)
      for (const size of sizesToProcess) {
        const layouts = materialSizeService.getAllLayouts(
          size.width_mm,
          size.height_mm,
          blankWidth,
          blankHeight
        );

        const bestLayout = layouts.best;
        const totalSheets = Math.ceil(requiredQuantity / bestLayout.blanksPerSheet);
        const baseRequiredSheets = totalSheets;

        optimizations.push({
          size: {
            id: size.id,
            size_name: size.size_name,
            width_mm: size.width_mm,
            height_mm: size.height_mm,
            unit_cost: size.unit_cost,
            available_stock: size.available_stock,
            current_stock: size.current_stock,
            reserved_stock: size.reserved_stock
          },
          layouts: {
            horizontal: layouts.horizontal,
            vertical: layouts.vertical,
            smart: layouts.smart
          },
          bestLayout: bestLayout,
          baseRequiredSheets: baseRequiredSheets,
          totalSheets: baseRequiredSheets, // Will be updated with additional sheets
          efficiency: bestLayout.efficiencyPercentage,
          wastage: bestLayout.wastagePercentage,
          hasStock: size.available_stock >= baseRequiredSheets,
          stockShortage: Math.max(0, baseRequiredSheets - size.available_stock)
        });
      }

      // Sort by efficiency (highest first), then by stock availability
      optimizations.sort((a, b) => {
        if (Math.abs(b.efficiency - a.efficiency) > 0.01) {
          return b.efficiency - a.efficiency;
        }
        // Prefer options with stock
        if (a.hasStock !== b.hasStock) {
          return a.hasStock ? -1 : 1;
        }
        return a.stockShortage - b.stockShortage;
      });

      // If only one size was calculated (specific size selected), return it directly
      if (specificSizeId && optimizations.length === 1) {
        return {
          optimization: optimizations[0], // Single optimization result
          optimizations, // Also include array for compatibility
          best: optimizations[0],
          hasMultipleSizes: false
        };
      }

      return {
        optimizations,
        best: optimizations[0],
        hasMultipleSizes
      };
    } catch (error) {
      console.error('Error optimizing sheet selection:', error);
      throw error;
    }
  }

  /**
   * Calculate all possible cutting layouts for a sheet size
   */
  calculateAllLayouts(sheetSize, blankSize) {
    return materialSizeService.getAllLayouts(
      sheetSize.width_mm,
      sheetSize.height_mm,
      blankSize.width,
      blankSize.height
    );
  }

  /**
   * Compare layouts and rank by efficiency
   */
  compareLayouts(layouts) {
    return layouts.sort((a, b) => b.efficiencyPercentage - a.efficiencyPercentage);
  }

  /**
   * Validate stock availability for a size
   */
  async validateStockAvailability(sizeId, requiredSheets) {
    try {
      const result = await dbAdapter.query(
        `SELECT 
          COALESCE(SUM(ist.available_stock), 0) as available_stock
         FROM material_sizes ms
         LEFT JOIN inventory_stock ist ON ist.material_size_id = ms.id
         WHERE ms.id = $1
         GROUP BY ms.id`,
        [sizeId]
      );

      const availableStock = parseInt(result.rows[0]?.available_stock || 0);
      
      return {
        available: availableStock >= requiredSheets,
        availableStock,
        requiredSheets,
        shortage: Math.max(0, requiredSheets - availableStock)
      };
    } catch (error) {
      console.error('Error validating stock availability:', error);
      throw error;
    }
  }

  /**
   * Get job planning data if exists
   */
  async getJobPlanning(jobCardId) {
    try {
      const result = await dbAdapter.query(
        `SELECT * FROM job_production_planning 
         WHERE job_card_id = $1`,
        [jobCardId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const planning = result.rows[0];
      return {
        id: planning.id,
        job_card_id: planning.job_card_id,
        selected_material_size_id: planning.selected_material_size_id,
        selected_sheet_size_id: planning.selected_sheet_size_id,
        cutting_layout_type: planning.cutting_layout_type,
        grid_pattern: planning.grid_pattern,
        blanks_per_sheet: planning.blanks_per_sheet,
        efficiency_percentage: parseFloat(planning.efficiency_percentage || 0),
        scrap_percentage: parseFloat(planning.scrap_percentage || 0),
        base_required_sheets: planning.base_required_sheets,
        additional_sheets: planning.additional_sheets || 0,
        final_total_sheets: planning.final_total_sheets,
        material_cost: planning.material_cost ? parseFloat(planning.material_cost) : null,
        wastage_justification: planning.wastage_justification,
        planning_status: planning.planning_status,
        planned_at: planning.planned_at,
        planned_by: planning.planned_by
      };
    } catch (error) {
      console.error('Error getting job planning:', error);
      throw error;
    }
  }
}

export default new SheetOptimizationService();

