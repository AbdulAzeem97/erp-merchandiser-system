import dbAdapter from '../database/adapter.js';

class MaterialSizeService {
  /**
   * Get all available sizes for a material
   * Returns single size if material has only one size, multiple if it has many
   */
  async getMaterialSizes(inventoryMaterialId) {
    try {
      // Check if material has multiple sizes
      const sizeCount = await dbAdapter.query(
        `SELECT COUNT(*) as count FROM material_sizes 
         WHERE inventory_material_id = $1 AND is_active = 1`,
        [inventoryMaterialId]
      );

      const count = parseInt(sizeCount.rows[0]?.count || 0);

      if (count === 0) {
        // No sizes defined - return null (material doesn't use sizes)
        return { hasMultipleSizes: false, sizes: [] };
      }

      // Check if inventory_stock table exists
      const tableCheck = await dbAdapter.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'inventory_stock'
        )
      `);
      const hasInventoryStock = tableCheck.rows[0].exists;

      // Fetch all sizes with stock information (if table exists)
      let result;
      if (hasInventoryStock) {
        result = await dbAdapter.query(
          `SELECT 
            ms.*,
            COALESCE(SUM(ist.current_stock), 0) as current_stock,
            COALESCE(SUM(ist.reserved_stock), 0) as reserved_stock,
            COALESCE(SUM(ist.available_stock), 0) as available_stock
           FROM material_sizes ms
           LEFT JOIN inventory_stock ist ON ist.material_size_id = ms.id 
             AND ist.inventory_material_id = ms.inventory_material_id
           WHERE ms.inventory_material_id = $1 AND ms.is_active = 1
           GROUP BY ms.id
           ORDER BY ms.is_default DESC, ms.width_mm DESC, ms.height_mm DESC`,
          [inventoryMaterialId]
        );
      } else {
        // No inventory_stock table - just get sizes without stock info
        result = await dbAdapter.query(
          `SELECT 
            ms.*,
            0 as current_stock,
            0 as reserved_stock,
            0 as available_stock
           FROM material_sizes ms
           WHERE ms.inventory_material_id = $1 AND ms.is_active = 1
           ORDER BY ms.is_default DESC, ms.width_mm DESC, ms.height_mm DESC`,
          [inventoryMaterialId]
        );
      }

      return {
        hasMultipleSizes: count > 1,
        sizes: result.rows.map(row => ({
          id: row.id,
          inventory_material_id: row.inventory_material_id,
          size_name: row.size_name,
          width_mm: parseFloat(row.width_mm),
          height_mm: parseFloat(row.height_mm),
          unit_cost: row.unit_cost ? parseFloat(row.unit_cost) : null,
          is_default: row.is_default === 1,
          is_active: row.is_active === 1,
          current_stock: parseInt(row.current_stock) || 0,
          reserved_stock: parseInt(row.reserved_stock) || 0,
          available_stock: parseInt(row.available_stock) || 0,
          created_at: row.created_at,
          updated_at: row.updated_at
        }))
      };
    } catch (error) {
      console.error('Error fetching material sizes:', error);
      throw error;
    }
  }

  /**
   * Find best size for a blank dimension (lowest wastage)
   */
  async findBestSize(inventoryMaterialId, blankWidth, blankHeight, requiredQuantity) {
    try {
      const { sizes } = await this.getMaterialSizes(inventoryMaterialId);
      
      if (!sizes || sizes.length === 0) {
        return null;
      }

      const optimizations = sizes.map(size => {
        const layout = this.calculateOptimalLayout(
          size.width_mm,
          size.height_mm,
          blankWidth,
          blankHeight
        );
        
        const totalSheets = Math.ceil(requiredQuantity / layout.blanksPerSheet);
        
        return {
          size: size,
          layout: layout,
          totalSheets: totalSheets,
          wastagePercentage: layout.wastagePercentage,
          efficiencyPercentage: layout.efficiencyPercentage,
          availableStock: size.available_stock || 0,
          hasStock: (size.available_stock || 0) >= totalSheets
        };
      });

      // Sort by efficiency (highest first), then by available stock
      optimizations.sort((a, b) => {
        if (Math.abs(b.efficiencyPercentage - a.efficiencyPercentage) > 0.01) {
          return b.efficiencyPercentage - a.efficiencyPercentage;
        }
        return b.availableStock - a.availableStock;
      });

      return optimizations[0]; // Best option
    } catch (error) {
      console.error('Error finding best size:', error);
      throw error;
    }
  }

  /**
   * Calculate optimal layout for a sheet size
   * Returns best of horizontal, vertical, or mixed layouts
   */
  calculateOptimalLayout(sheetWidth, sheetHeight, blankWidth, blankHeight) {
    // Horizontal layout
    const horizontal = {
      type: 'horizontal',
      blanksPerRow: Math.floor(sheetWidth / blankWidth),
      blanksPerColumn: Math.floor(sheetHeight / blankHeight),
    };
    horizontal.blanksPerSheet = horizontal.blanksPerRow * horizontal.blanksPerColumn;
    horizontal.usedWidth = horizontal.blanksPerRow * blankWidth;
    horizontal.usedHeight = horizontal.blanksPerColumn * blankHeight;
    horizontal.wastageWidth = sheetWidth - horizontal.usedWidth;
    horizontal.wastageHeight = sheetHeight - horizontal.usedHeight;
    horizontal.wastageArea = (horizontal.wastageWidth * sheetHeight) + 
                            (horizontal.wastageHeight * horizontal.usedWidth);
    horizontal.wastagePercentage = (horizontal.wastageArea / (sheetWidth * sheetHeight)) * 100;
    horizontal.efficiencyPercentage = 100 - horizontal.wastagePercentage;
    horizontal.gridPattern = `${horizontal.blanksPerRow} × ${horizontal.blanksPerColumn}`;

    // Vertical layout (rotated)
    const vertical = {
      type: 'vertical',
      blanksPerRow: Math.floor(sheetWidth / blankHeight),
      blanksPerColumn: Math.floor(sheetHeight / blankWidth),
    };
    vertical.blanksPerSheet = vertical.blanksPerRow * vertical.blanksPerColumn;
    vertical.usedWidth = vertical.blanksPerRow * blankHeight;
    vertical.usedHeight = vertical.blanksPerColumn * blankWidth;
    vertical.wastageWidth = sheetWidth - vertical.usedWidth;
    vertical.wastageHeight = sheetHeight - vertical.usedHeight;
    vertical.wastageArea = (vertical.wastageWidth * sheetHeight) + 
                          (vertical.wastageHeight * vertical.usedWidth);
    vertical.wastagePercentage = (vertical.wastageArea / (sheetWidth * sheetHeight)) * 100;
    vertical.efficiencyPercentage = 100 - vertical.wastagePercentage;
    vertical.gridPattern = `${vertical.blanksPerRow} × ${vertical.blanksPerColumn}`;

    // Smart layout (best combination of horizontal and vertical)
    const smart = this.calculateSmartLayout(sheetWidth, sheetHeight, blankWidth, blankHeight, horizontal, vertical);

    // Return best layout
    const layouts = [horizontal, vertical, smart];
    layouts.sort((a, b) => b.efficiencyPercentage - a.efficiencyPercentage);
    
    return layouts[0];
  }

  /**
   * Get all layouts for a sheet size (horizontal, vertical, smart)
   */
  getAllLayouts(sheetWidth, sheetHeight, blankWidth, blankHeight) {
    const horizontal = this.calculateLayout('horizontal', sheetWidth, sheetHeight, blankWidth, blankHeight);
    const vertical = this.calculateLayout('vertical', sheetWidth, sheetHeight, blankWidth, blankHeight);
    
    // Smart layout: Try to combine horizontal and vertical orientations to maximize blanks
    const smart = this.calculateSmartLayout(sheetWidth, sheetHeight, blankWidth, blankHeight, horizontal, vertical);

    // Find the best layout
    const layouts = [horizontal, vertical, smart];
    layouts.sort((a, b) => b.efficiencyPercentage - a.efficiencyPercentage);
    const best = layouts[0];

    return {
      horizontal,
      vertical,
      smart,
      best
    };
  }

  /**
   * Calculate smart layout by combining horizontal and vertical orientations
   * This tries different combinations to maximize the number of blanks per sheet
   */
  calculateSmartLayout(sheetWidth, sheetHeight, blankWidth, blankHeight, horizontal, vertical) {
    let bestLayout = {
      type: 'smart',
      blanksPerSheet: 0,
      efficiencyPercentage: 0,
      wastagePercentage: 100,
      gridPattern: '',
      blanksPerRow: 0,
      blanksPerColumn: 0,
      usedWidth: 0,
      usedHeight: 0,
      wastageWidth: 0,
      wastageHeight: 0,
      wastageArea: 0
    };

    // Strategy 1: Fill rows with horizontal, then use remaining space for vertical
    for (let hRows = 0; hRows <= horizontal.blanksPerColumn; hRows++) {
      const hUsedHeight = hRows * blankHeight;
      const remainingHeight = sheetHeight - hUsedHeight;
      
      if (remainingHeight < blankWidth) continue; // Not enough space for vertical
      
      const vRows = Math.floor(remainingHeight / blankWidth);
      if (vRows <= 0) continue;
      
      // Validate that horizontal blanks fit in width
      const hUsedWidth = horizontal.blanksPerRow * blankWidth;
      if (hUsedWidth > sheetWidth) continue; // Horizontal doesn't fit
      
      // Validate that vertical blanks fit in width
      const vUsedWidth = vertical.blanksPerRow * blankHeight;
      if (vUsedWidth > sheetWidth) continue; // Vertical doesn't fit
      
      // Both must fit within sheet width - use the maximum
      const usedWidth = Math.max(hUsedWidth, vUsedWidth);
      if (usedWidth > sheetWidth) continue; // Width exceeds sheet boundary
      
      const hBlanks = hRows * horizontal.blanksPerRow;
      const vBlanks = vRows * vertical.blanksPerRow;
      const totalBlanks = hBlanks + vBlanks;
      
      const usedHeight = hUsedHeight + (vRows * blankWidth);
      if (usedHeight > sheetHeight) continue; // Height exceeds sheet boundary
      
      // Double-check: ensure no blank exceeds boundaries
      if (hUsedWidth > sheetWidth || vUsedWidth > sheetWidth || usedHeight > sheetHeight) {
        continue;
      }
      
      const wastageWidth = sheetWidth - usedWidth;
      const wastageHeight = sheetHeight - usedHeight;
      const wastageArea = (wastageWidth * sheetHeight) + (wastageHeight * usedWidth);
      const totalArea = sheetWidth * sheetHeight;
      const wastagePercentage = (wastageArea / totalArea) * 100;
      const efficiencyPercentage = 100 - wastagePercentage;
      
      if (totalBlanks > bestLayout.blanksPerSheet || 
          (totalBlanks === bestLayout.blanksPerSheet && efficiencyPercentage > bestLayout.efficiencyPercentage)) {
        bestLayout = {
          type: 'smart',
          blanksPerSheet: totalBlanks,
          blanksPerRow: Math.max(horizontal.blanksPerRow, vertical.blanksPerRow), // Max for display
          blanksPerColumn: hRows + vRows,
          usedWidth,
          usedHeight,
          wastageWidth,
          wastageHeight,
          wastageArea,
          wastagePercentage: parseFloat(wastagePercentage.toFixed(2)),
          efficiencyPercentage: parseFloat(efficiencyPercentage.toFixed(2)),
          gridPattern: `${hRows > 0 ? `${horizontal.blanksPerRow}H` : ''}${vRows > 0 ? `${vertical.blanksPerRow}V` : ''} (${hRows}H+${vRows}V rows)`
        };
      }
    }

    // Strategy 2: Fill columns with vertical, then use remaining space for horizontal
    for (let vCols = 0; vCols <= vertical.blanksPerColumn; vCols++) {
      const vUsedHeight = vCols * blankWidth;
      const remainingHeight = sheetHeight - vUsedHeight;
      
      if (remainingHeight < blankHeight) continue; // Not enough space for horizontal
      
      const hRows = Math.floor(remainingHeight / blankHeight);
      if (hRows <= 0) continue;
      
      // Validate that vertical blanks fit in width
      const vUsedWidth = vertical.blanksPerRow * blankHeight;
      if (vUsedWidth > sheetWidth) continue; // Vertical doesn't fit
      
      // Validate that horizontal blanks fit in width
      const hUsedWidth = horizontal.blanksPerRow * blankWidth;
      if (hUsedWidth > sheetWidth) continue; // Horizontal doesn't fit
      
      // Both must fit within sheet width - use the maximum
      const usedWidth = Math.max(hUsedWidth, vUsedWidth);
      if (usedWidth > sheetWidth) continue; // Width exceeds sheet boundary
      
      const vBlanks = vCols * vertical.blanksPerRow;
      const hBlanks = hRows * horizontal.blanksPerRow;
      const totalBlanks = hBlanks + vBlanks;
      
      const usedHeight = vUsedHeight + (hRows * blankHeight);
      if (usedHeight > sheetHeight) continue; // Height exceeds sheet boundary
      
      // Double-check: ensure no blank exceeds boundaries
      if (hUsedWidth > sheetWidth || vUsedWidth > sheetWidth || usedHeight > sheetHeight) {
        continue;
      }
      
      const wastageWidth = sheetWidth - usedWidth;
      const wastageHeight = sheetHeight - usedHeight;
      const wastageArea = (wastageWidth * sheetHeight) + (wastageHeight * usedWidth);
      const totalArea = sheetWidth * sheetHeight;
      const wastagePercentage = (wastageArea / totalArea) * 100;
      const efficiencyPercentage = 100 - wastagePercentage;
      
      if (totalBlanks > bestLayout.blanksPerSheet || 
          (totalBlanks === bestLayout.blanksPerSheet && efficiencyPercentage > bestLayout.efficiencyPercentage)) {
        bestLayout = {
          type: 'smart',
          blanksPerSheet: totalBlanks,
          blanksPerRow: Math.max(horizontal.blanksPerRow, vertical.blanksPerRow), // Max for display
          blanksPerColumn: vCols + hRows,
          usedWidth,
          usedHeight,
          wastageWidth,
          wastageHeight,
          wastageArea,
          wastagePercentage: parseFloat(wastagePercentage.toFixed(2)),
          efficiencyPercentage: parseFloat(efficiencyPercentage.toFixed(2)),
          gridPattern: `${vCols > 0 ? `${vertical.blanksPerRow}V` : ''}${hRows > 0 ? `${horizontal.blanksPerRow}H` : ''} (${vCols}V+${hRows}H rows)`
        };
      }
    }

    // Strategy 3: Try alternating rows (horizontal, vertical, horizontal, ...)
    const maxRows = Math.max(horizontal.blanksPerColumn, vertical.blanksPerColumn);
    for (let totalRows = 2; totalRows <= maxRows; totalRows++) {
      let hRows = Math.floor(totalRows / 2);
      let vRows = totalRows - hRows;
      
      // Try both patterns: H-V-H... and V-H-V...
      for (const pattern of [
        { hRows, vRows },
        { hRows: vRows, vRows: hRows }
      ]) {
        const hUsedHeight = pattern.hRows * blankHeight;
        const vUsedHeight = pattern.vRows * blankWidth;
        const totalUsedHeight = hUsedHeight + vUsedHeight;
        
        if (totalUsedHeight > sheetHeight) continue; // Height exceeds sheet boundary
        
        // Validate that horizontal blanks fit in width
        const hUsedWidth = horizontal.blanksPerRow * blankWidth;
        if (hUsedWidth > sheetWidth) continue; // Horizontal doesn't fit
        
        // Validate that vertical blanks fit in width
        const vUsedWidth = vertical.blanksPerRow * blankHeight;
        if (vUsedWidth > sheetWidth) continue; // Vertical doesn't fit
        
        // Both must fit within sheet width - use the maximum
        const usedWidth = Math.max(hUsedWidth, vUsedWidth);
        if (usedWidth > sheetWidth) continue; // Width exceeds sheet boundary
        
        const hBlanks = pattern.hRows * horizontal.blanksPerRow;
        const vBlanks = pattern.vRows * vertical.blanksPerRow;
        const totalBlanks = hBlanks + vBlanks;
        
        // Double-check: ensure no blank exceeds boundaries
        if (hUsedWidth > sheetWidth || vUsedWidth > sheetWidth || totalUsedHeight > sheetHeight) {
          continue;
        }
        
        const wastageWidth = sheetWidth - usedWidth;
        const wastageHeight = sheetHeight - totalUsedHeight;
        const wastageArea = (wastageWidth * sheetHeight) + (wastageHeight * usedWidth);
        const totalArea = sheetWidth * sheetHeight;
        const wastagePercentage = (wastageArea / totalArea) * 100;
        const efficiencyPercentage = 100 - wastagePercentage;
        
        if (totalBlanks > bestLayout.blanksPerSheet || 
            (totalBlanks === bestLayout.blanksPerSheet && efficiencyPercentage > bestLayout.efficiencyPercentage)) {
          bestLayout = {
            type: 'smart',
            blanksPerSheet: totalBlanks,
            blanksPerRow: Math.max(horizontal.blanksPerRow, vertical.blanksPerRow), // Max for display
            blanksPerColumn: totalRows,
            usedWidth,
            usedHeight: totalUsedHeight,
            wastageWidth,
            wastageHeight,
            wastageArea,
            wastagePercentage: parseFloat(wastagePercentage.toFixed(2)),
            efficiencyPercentage: parseFloat(efficiencyPercentage.toFixed(2)),
            gridPattern: `${pattern.hRows}H+${pattern.vRows}V (alternating)`
          };
        }
      }
    }

    // If smart layout didn't improve, use the better of horizontal/vertical
    if (bestLayout.blanksPerSheet <= Math.max(horizontal.blanksPerSheet, vertical.blanksPerSheet)) {
      const better = horizontal.efficiencyPercentage > vertical.efficiencyPercentage ? horizontal : vertical;
      return {
        ...better,
        type: 'smart',
        gridPattern: `Smart: ${better.gridPattern}`
      };
    }

    return bestLayout;
  }

  /**
   * Calculate a specific layout type
   */
  calculateLayout(type, sheetWidth, sheetHeight, blankWidth, blankHeight) {
    let blanksPerRow, blanksPerColumn;
    
    if (type === 'horizontal') {
      blanksPerRow = Math.floor(sheetWidth / blankWidth);
      blanksPerColumn = Math.floor(sheetHeight / blankHeight);
    } else { // vertical
      blanksPerRow = Math.floor(sheetWidth / blankHeight);
      blanksPerColumn = Math.floor(sheetHeight / blankWidth);
    }

    const blanksPerSheet = blanksPerRow * blanksPerColumn;
    const usedWidth = blanksPerRow * (type === 'horizontal' ? blankWidth : blankHeight);
    const usedHeight = blanksPerColumn * (type === 'horizontal' ? blankHeight : blankWidth);
    const wastageWidth = sheetWidth - usedWidth;
    const wastageHeight = sheetHeight - usedHeight;
    const wastageArea = (wastageWidth * sheetHeight) + (wastageHeight * usedWidth);
    const totalArea = sheetWidth * sheetHeight;
    const wastagePercentage = (wastageArea / totalArea) * 100;
    const efficiencyPercentage = 100 - wastagePercentage;

    return {
      type,
      blanksPerRow,
      blanksPerColumn,
      blanksPerSheet,
      usedWidth,
      usedHeight,
      wastageWidth,
      wastageHeight,
      wastageArea,
      wastagePercentage: parseFloat(wastagePercentage.toFixed(2)),
      efficiencyPercentage: parseFloat(efficiencyPercentage.toFixed(2)),
      gridPattern: `${blanksPerRow} × ${blanksPerColumn}`
    };
  }
}

export default new MaterialSizeService();

