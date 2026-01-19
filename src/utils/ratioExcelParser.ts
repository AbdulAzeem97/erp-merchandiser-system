// Ratio Excel Parser Utility
// Parses UPS optimization reports from Excel workbook format (.xlsx)

import * as XLSX from 'xlsx';

export interface RatioExcelData {
  orderInfo: {
    factory: string;
    po: string;
    job: string;
    brand: string;
    item: string;
    date: string;
  };
  summary: {
    totalUPS: number;
    totalSheets: number;
    requiredOrderQty: number;
    totalPlates: number;
    qtyProduced: number;
    excessQty: number;
    efficiency: number;
    excessPercent: number;
  };
  colorDetails: Array<{
    epNo?: string;
    itemCode?: string;
    itemDescription?: string;
    price?: string;
    color: string;
    size: string;
    requiredQty: number;
    plate: string;
    ups: number;
    sheets: number;
    qtyProduced: number;
    excessQty: number;
  }>;
}

export interface ParsedRatioData {
  totalSheets: number;
  totalPlates: number;
  productionEfficiency: number;
  excessQuantity: number;
  excessPercentage: number;
  plateDistribution: { [plate: string]: { sheets: number; colors: string[]; totalUPS: number } };
  colorEfficiency: { [colorSize: string]: { efficiency: number; excessQty: number } };
  rawData: RatioExcelData;
}

export class RatioExcelParser {
  /**
   * Parse Excel workbook content and extract production data
   * This method handles both .xlsx files and Excel data arrays
   */
  static parseExcel(excelData: any[][]): ParsedRatioData | null {
    try {
      if (!excelData || excelData.length === 0) {
        throw new Error('Excel data is empty');
      }

      // Find the start of color details (look for the specific header row)
      let colorStartIndex = -1;
      let headerRow = -1;
      
      console.log('Searching for color details section...');
      
      for (let i = 0; i < excelData.length; i++) {
        const row = excelData[i];
        if (row && row.length >= 8) {
          // Convert row to lowercase strings for comparison
          const rowCells = row.map(cell => String(cell || '').toLowerCase().trim());
          
          // Look for the exact header pattern: Color, Size, Required Qty, Plate, UPS, Sheets, Qty Produced, Excess Qty
          if (rowCells[0] === 'color' && 
              rowCells[1] === 'size' && 
              rowCells[2] === 'required qty' && 
              rowCells[3] === 'plate' && 
              rowCells[4] === 'ups' && 
              rowCells[5] === 'sheets' && 
              rowCells[6] === 'qty produced' && 
              rowCells[7] === 'excess qty') {
            colorStartIndex = i + 1;
            headerRow = i;
            console.log(`Found color details header at row ${i}:`, row);
            break;
          }
          
          // Also check for variations in the header
          if (rowCells[0].includes('color') && 
              rowCells[1].includes('size') && 
              rowCells[2].includes('required') && 
              rowCells[3].includes('plate') && 
              rowCells[4].includes('ups') && 
              rowCells[5].includes('sheets') && 
              rowCells[6].includes('produced') && 
              rowCells[7].includes('excess')) {
            colorStartIndex = i + 1;
            headerRow = i;
            console.log(`Found color details header (variation) at row ${i}:`, row);
            break;
          }
        }
      }

      if (colorStartIndex === -1) {
        console.log('Could not find exact header, trying flexible matching...');
        
        // More flexible approach: look for rows that contain key terms
        for (let i = 0; i < excelData.length; i++) {
          const row = excelData[i];
          if (row && row.length >= 8) {
            const rowText = row.map(cell => String(cell || '').toLowerCase()).join(' ');
            
            // Check if this row contains most of the expected headers
            const hasColor = rowText.includes('color');
            const hasSize = rowText.includes('size');
            const hasRequired = rowText.includes('required');
            const hasPlate = rowText.includes('plate');
            const hasUPS = rowText.includes('ups');
            const hasSheets = rowText.includes('sheets');
            const hasProduced = rowText.includes('produced');
            const hasExcess = rowText.includes('excess');
            
            const matchCount = [hasColor, hasSize, hasRequired, hasPlate, hasUPS, hasSheets, hasProduced, hasExcess].filter(Boolean).length;
            
            if (matchCount >= 6) { // At least 6 out of 8 headers match
              colorStartIndex = i + 1;
              headerRow = i;
              console.log(`Found color details header (flexible match) at row ${i} with ${matchCount}/8 matches:`, row);
              break;
            }
          }
        }
        
        if (colorStartIndex === -1) {
          throw new Error('Could not find color details section in Excel. Expected headers: Color, Size, Required Qty, Plate, UPS, Sheets, Qty Produced, Excess Qty');
        }
      }

      // Find column indices from header row dynamically
      const headerRowData = excelData[headerRow];
      const findColumnIndex = (searchTerms: string[]): number => {
        for (let col = 0; col < headerRowData.length; col++) {
          const cellValue = String(headerRowData[col] || '').toLowerCase().trim();
          for (const term of searchTerms) {
            if (cellValue === term.toLowerCase() || cellValue.includes(term.toLowerCase())) {
              return col;
            }
          }
        }
        return -1;
      };

      // Find compulsory columns (Color, Size, Required Qty)
      const colorColIndex = findColumnIndex(['color']);
      const sizeColIndex = findColumnIndex(['size']);
      const requiredQtyColIndex = findColumnIndex(['required qty', 'required']);
      
      // Find optional columns (EP_NO, ITEM_CODE, ITEM_DESCRIPTION, PRICE)
      const epNoColIndex = findColumnIndex(['ep no', 'ep number', 'ep_no', 'ep']);
      const itemCodeColIndex = findColumnIndex(['item code', 'item_code', 'code']);
      const itemDescriptionColIndex = findColumnIndex(['item description', 'item_desc', 'description', 'item_description']);
      const priceColIndex = findColumnIndex(['price']);
      
      // Find other optional columns
      const plateColIndex = findColumnIndex(['plate']);
      const upsColIndex = findColumnIndex(['ups']);
      const sheetsColIndex = findColumnIndex(['sheets']);
      const qtyProducedColIndex = findColumnIndex(['qty produced', 'produced']);
      const excessQtyColIndex = findColumnIndex(['excess qty', 'excess']);

      console.log('Column indices found from header:', {
        epNo: epNoColIndex,
        itemCode: itemCodeColIndex,
        itemDescription: itemDescriptionColIndex,
        price: priceColIndex,
        color: colorColIndex,
        size: sizeColIndex,
        requiredQty: requiredQtyColIndex,
        plate: plateColIndex,
        ups: upsColIndex,
        sheets: sheetsColIndex,
        qtyProduced: qtyProducedColIndex,
        excessQty: excessQtyColIndex
      });

      // Validate that we found the compulsory columns
      if (colorColIndex === -1 || sizeColIndex === -1 || requiredQtyColIndex === -1) {
        throw new Error('Could not find compulsory columns (Color, Size, Required Qty) in header row');
      }

      // Parse color details
      const colorDetails = [];
      console.log(`Starting color details parsing from row ${colorStartIndex}`);
      
      for (let i = colorStartIndex; i < excelData.length; i++) {
        const row = excelData[i];
        if (!row || row.length === 0) continue;
        
        // Check for data in the Color column (not first column, as first columns may be empty)
        const colorCell = colorColIndex >= 0 && colorColIndex < row.length 
          ? String(row[colorColIndex] || '').trim() 
          : '';
        
        // Skip empty rows and summary rows (check Color column, not first column)
        const firstCell = String(row[0] || '').trim();
        if ((!colorCell && !firstCell) || 
            firstCell.toLowerCase().includes('total') ||
            firstCell.toLowerCase().includes('summary') ||
            firstCell.toLowerCase().includes('generated') ||
            colorCell.toLowerCase().includes('total') ||
            colorCell.toLowerCase().includes('summary')) {
          console.log(`Skipping row ${i}: empty or summary row (Color: "${colorCell}", First: "${firstCell}")`);
          continue;
        }

        // Parse color detail row using found column indices
        const maxColIndex = Math.max(
          epNoColIndex, itemCodeColIndex, itemDescriptionColIndex, priceColIndex,
          colorColIndex, sizeColIndex, requiredQtyColIndex, plateColIndex, 
          upsColIndex, sheetsColIndex, qtyProducedColIndex, excessQtyColIndex
        );
        
        if (row.length > maxColIndex) {
          const colorDetail: any = {
            // Optional fields - only include if column exists
            ...(epNoColIndex >= 0 && { epNo: String(row[epNoColIndex] || '').trim() }),
            ...(itemCodeColIndex >= 0 && { itemCode: String(row[itemCodeColIndex] || '').trim() }),
            ...(itemDescriptionColIndex >= 0 && { itemDescription: String(row[itemDescriptionColIndex] || '').trim() }),
            ...(priceColIndex >= 0 && { price: String(row[priceColIndex] || '').trim() }),
            // Compulsory fields
            color: colorColIndex >= 0 ? String(row[colorColIndex] || '').trim() : '',
            size: sizeColIndex >= 0 ? String(row[sizeColIndex] || '').trim() : '',
            requiredQty: requiredQtyColIndex >= 0 ? this.parseNumber(row[requiredQtyColIndex]) : 0,
            plate: plateColIndex >= 0 ? String(row[plateColIndex] || '').trim() : '',
            ups: upsColIndex >= 0 ? this.parseNumber(row[upsColIndex]) : 0,
            sheets: sheetsColIndex >= 0 ? this.parseNumber(row[sheetsColIndex]) : 0,
            qtyProduced: qtyProducedColIndex >= 0 ? this.parseNumber(row[qtyProducedColIndex]) : 0,
            excessQty: excessQtyColIndex >= 0 ? this.parseNumber(row[excessQtyColIndex]) : 0
          };
          
          console.log(`Parsed color detail at row ${i}:`, colorDetail);
          
          // Only add if we have valid compulsory data (color, size, required qty)
          if (colorDetail.color && colorDetail.size && colorDetail.requiredQty !== null && colorDetail.requiredQty !== undefined) {
            colorDetails.push(colorDetail);
          } else {
            console.log(`Skipping row ${i}: missing compulsory data - Color: "${colorDetail.color}", Size: "${colorDetail.size}", Required Qty: ${colorDetail.requiredQty}`);
          }
        } else {
          console.log(`Skipping row ${i}: insufficient columns (${row.length} < required)`);
        }
      }

      if (colorDetails.length === 0) {
        throw new Error('No valid color details found in Excel');
      }

      // Parse summary metrics from the production metrics section (before color details)
      let summaryMetrics = null;
      console.log('Searching for production metrics section...');
      
      // Look for the metrics section before the color details
      for (let i = 0; i < colorStartIndex; i++) {
        const row = excelData[i];
        if (row && row.length > 0) {
          const firstCell = String(row[0] || '').toLowerCase();
          
          // Look for "Metric" header or similar
          if (firstCell.includes('metric') || firstCell.includes('value')) {
            console.log(`Found metrics section at row ${i}:`, row);
            
            // Parse the next few rows for metrics
            for (let j = i + 1; j < Math.min(i + 10, colorStartIndex); j++) {
              const metricRow = excelData[j];
              if (metricRow && metricRow.length >= 4) {
                const metricName = String(metricRow[0] || '').toLowerCase();
                const metricValue = String(metricRow[1] || '').toLowerCase();
                const metricName2 = String(metricRow[2] || '').toLowerCase();
                const metricValue2 = String(metricRow[3] || '').toLowerCase();
                
                if (!summaryMetrics) {
                  summaryMetrics = {};
                }
                
                // Parse left column metrics
                if (metricName.includes('no. of ups') || metricName.includes('number of ups')) {
                  summaryMetrics.totalUPS = this.parseNumber(metricValue);
                } else if (metricName.includes('total plates')) {
                  summaryMetrics.totalPlates = this.parseNumber(metricValue);
                } else if (metricName.includes('qty produced')) {
                  summaryMetrics.qtyProduced = this.parseNumber(metricValue);
                } else if (metricName.includes('efficiency')) {
                  summaryMetrics.efficiency = this.parseNumber(metricValue);
                } else if (metricName.includes('excess %')) {
                  summaryMetrics.excessPercent = this.parseNumber(metricValue);
                }
                
                // Parse right column metrics
                if (metricName2.includes('total sheets')) {
                  summaryMetrics.totalSheets = this.parseNumber(metricValue2);
                } else if (metricName2.includes('required order qty')) {
                  summaryMetrics.requiredOrderQty = this.parseNumber(metricValue2);
                } else if (metricName2.includes('excess qty')) {
                  summaryMetrics.excessQty = this.parseNumber(metricValue2);
                }
              }
            }
            break;
          }
        }
      }

      // Parse summary data from the last few rows (Total Summary row)
      let summaryData = null;
      console.log('Searching for total summary row...');
      
      for (let i = excelData.length - 1; i >= Math.max(0, excelData.length - 10); i--) {
        const row = excelData[i];
        if (row && row.length > 0) {
          const firstCell = String(row[0] || '').toLowerCase();
          const secondCell = String(row[1] || '').toLowerCase();
          
          // Look for "Total Summary" row
          if ((firstCell.includes('total') && secondCell.includes('summary')) ||
              firstCell.includes('total summary')) {
            console.log(`Found total summary row at ${i}:`, row);
            
            if (row.length >= 8) {
              // Based on the image: Total Summary row has format: [empty, Required Qty, Total Plates, UPS, Sheets, Qty Produced, Excess Qty]
              summaryData = {
                requiredOrderQty: this.parseNumber(row[1]), // Required Qty
                totalPlates: this.parseNumber(row[2]),      // Total Plates  
                totalUPS: this.parseNumber(row[3]),         // UPS
                totalSheets: this.parseNumber(row[4]),      // Sheets
                qtyProduced: this.parseNumber(row[5]),      // Qty Produced
                excessQty: this.parseNumber(row[6])         // Excess Qty
              };
              console.log('Parsed total summary data:', summaryData);
              break;
            }
          }
        }
      }

      // Merge data from metrics section, total summary row, and calculated values
      const finalSummaryData = {
        // Use metrics section data first, then total summary, then calculated
        requiredOrderQty: summaryMetrics?.requiredOrderQty || summaryData?.requiredOrderQty || 
                         colorDetails.reduce((sum, item) => sum + (item.requiredQty || 0), 0),
        
        totalPlates: summaryMetrics?.totalPlates || summaryData?.totalPlates || 
                    new Set(colorDetails.map(item => item.plate).filter(plate => plate && plate.trim())).size,
        
        totalUPS: summaryMetrics?.totalUPS || summaryData?.totalUPS || 
                 colorDetails.reduce((sum, item) => sum + (item.ups || 0), 0),
        
        totalSheets: summaryMetrics?.totalSheets || summaryData?.totalSheets || 
                    colorDetails.reduce((sum, item) => sum + (item.sheets || 0), 0),
        
        qtyProduced: summaryMetrics?.qtyProduced || summaryData?.qtyProduced || 
                    colorDetails.reduce((sum, item) => sum + (item.qtyProduced || 0), 0),
        
        excessQty: summaryMetrics?.excessQty || summaryData?.excessQty || 
                  colorDetails.reduce((sum, item) => sum + (item.excessQty || 0), 0),
        
        efficiency: summaryMetrics?.efficiency || null,
        excessPercent: summaryMetrics?.excessPercent || null
      };
      
      console.log('Final merged summary data:', finalSummaryData);

      // Calculate efficiency (use provided values or calculate)
      const efficiency = finalSummaryData.efficiency || 
        (finalSummaryData.qtyProduced > 0 
          ? ((finalSummaryData.qtyProduced - finalSummaryData.excessQty) / finalSummaryData.qtyProduced * 100)
          : 0);

      const excessPercent = finalSummaryData.excessPercent || 
        (finalSummaryData.qtyProduced > 0 
          ? (finalSummaryData.excessQty / finalSummaryData.qtyProduced * 100)
          : 0);

      // Create plate distribution
      const plateDistribution: { [plate: string]: { sheets: number; colors: string[]; totalUPS: number } } = {};
      colorDetails.forEach(item => {
        const plate = item.plate && item.plate.trim() ? item.plate.trim() : 'Unknown';
        const colorSize = `${item.color} ${item.size}`.trim();
        
        if (!plateDistribution[plate]) {
          plateDistribution[plate] = { sheets: 0, colors: [], totalUPS: 0 };
        }
        plateDistribution[plate].sheets += (item.sheets || 0);
        plateDistribution[plate].colors.push(colorSize);
        plateDistribution[plate].totalUPS += (item.ups || 0);
      });

      // Create color efficiency
      const colorEfficiency: { [colorSize: string]: { efficiency: number; excessQty: number } } = {};
      colorDetails.forEach(item => {
        const colorSize = `${item.color} ${item.size}`.trim();
        const qtyProduced = item.qtyProduced || 0;
        const excessQty = item.excessQty || 0;
        
        const itemEfficiency = qtyProduced > 0 
          ? ((qtyProduced - excessQty) / qtyProduced * 100)
          : 0;
        colorEfficiency[colorSize] = {
          efficiency: itemEfficiency,
          excessQty: excessQty
        };
      });

      return {
        totalSheets: finalSummaryData.totalSheets,
        totalPlates: finalSummaryData.totalPlates,
        productionEfficiency: efficiency,
        excessQuantity: finalSummaryData.excessQty,
        excessPercentage: excessPercent,
        plateDistribution,
        colorEfficiency,
        rawData: {
          orderInfo: {
            factory: 'Unknown',
            po: 'Unknown',
            job: 'Unknown',
            brand: 'Unknown',
            item: 'Unknown',
            date: new Date().toISOString()
          },
          summary: {
            ...finalSummaryData,
            efficiency,
            excessPercent
          },
          colorDetails
        }
      };

    } catch (error) {
      console.error('Error parsing Excel data:', error);
      return null;
    }
  }

  /**
   * Parse number from Excel cell value
   */
  private static parseNumber(value: any): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value.replace(/[^\d.-]/g, ''));
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }

  /**
   * Parse Excel file from File object (for file uploads)
   */
  static async parseExcelFile(file: File): Promise<ParsedRatioData | null> {
    try {
      console.log('Parsing Excel file:', file.name);
      
      // Read the file as ArrayBuffer
      const data = await file.arrayBuffer();
      
      // Parse the Excel workbook
      const workbook = XLSX.read(data, { type: 'array' });
      
      // Get the first worksheet
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert worksheet to JSON array (array of arrays)
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1, 
        defval: '',
        raw: false 
      }) as any[][];
      
      console.log('Excel data loaded:', jsonData.length, 'rows');
      console.log('First 10 rows of Excel data:', jsonData.slice(0, 10));
      
      // Validate Excel data format first
      const validation = this.validateExcel(jsonData);
      if (!validation.isValid) {
        console.error('Excel validation failed:', validation.errors);
        // Continue anyway for debugging
      }
      
      // Parse the Excel data
      return this.parseExcel(jsonData);
      
    } catch (error) {
      console.error('Error parsing Excel file:', error);
      return null;
    }
  }

  /**
   * Validate Excel data format
   */
  static validateExcel(excelData: any[][]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!excelData || excelData.length === 0) {
      errors.push('Excel data is empty');
      return { isValid: false, errors };
    }

    // Check for required headers - look for the color details section
    let hasColorHeader = false;
    for (let i = 0; i < excelData.length; i++) {
      const row = excelData[i];
      if (row && row.length >= 8) {
        const rowCells = row.map(cell => String(cell || '').toLowerCase().trim());
        if (rowCells[0] === 'color' && rowCells[1] === 'size' && rowCells[2].includes('required')) {
          hasColorHeader = true;
          break;
        }
      }
    }

    if (!hasColorHeader) {
      errors.push('Excel does not contain required color details headers (Color, Size, Required Qty, Plate, UPS, Sheets, Qty Produced, Excess Qty)');
    }

    // Check for data rows with numeric values
    let hasDataRows = false;
    for (let i = 0; i < excelData.length; i++) {
      const row = excelData[i];
      if (row && row.length >= 8) {
        const firstCell = String(row[0] || '').trim();
        // Skip header rows and empty rows
        if (firstCell && !firstCell.toLowerCase().includes('color') && !firstCell.toLowerCase().includes('total')) {
          const hasNumericData = row.slice(2, 8).some(cell => this.parseNumber(cell) > 0);
          if (hasNumericData) {
            hasDataRows = true;
            break;
          }
        }
      }
    }

    if (!hasDataRows) {
      errors.push('Excel does not contain valid data rows with numeric values');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Generate Excel template data for testing (matches the exact format from image)
   */
  static generateTemplate(): any[][] {
    return [
      ['HORIZON SOURCING PVT LIMITED', '', '', '', '', '', '', 'Date: 9/27/2025'],
      ['UPS OPTIMIZATION REPORT'],
      [''],
      ['Order Information'],
      ['Factory', 'Rajby'],
      ['PO', 'PO-156'],
      ['Job', 'JOB-156'],
      ['Brand', 'Bershka'],
      ['Item', 'Hangtags'],
      [''],
      ['Metric', 'Value', 'Metric', 'Value'],
      ['No. of UPS', 18, 'Total Sheets', 9],
      ['Total Plates', 4, 'Required Order Qty', 153],
      ['Qty Produced', 162, 'Excess Qty', 9],
      ['Efficiency', '94.4%', 'Excess %', '5.56%'],
      [''],
      ['Color', 'Size', 'Required Qty', 'Plate', 'UPS', 'Sheets', 'Qty Produced', 'Excess Qty'],
      ['DK JET', '20PS', 8, 'A', 2, 5, 10, 2],
      ['DK JET', '2PS', 17, 'A', 4, 20, 20, 3],
      ['DK JET', '20P', 20, 'A', 4, 20, 20, 0],
      ['LT AQUAMARINE', '26WS', 20, 'A', 4, 20, 20, 0],
      ['MED HARVEST', '20WS', 20, 'A', 4, 20, 20, 0],
      ['MED HARVEST', '22WS', 12, 'B', 7, 2, 14, 2],
      ['MED HARVEST', '20WL', 21, 'B', 11, 22, 22, 1],
      ['DK JET', '18PS', 17, 'C', 18, 1, 18, 1],
      ['MED HARVEST', '24WS', 18, 'D', 18, 1, 18, 0],
      [''],
      ['Total Summary', 153, 4, 18, 9, 162, 9],
      ['Generated by Horizon Sourcing', 'Page 1 of 1']
    ];
  }
}
