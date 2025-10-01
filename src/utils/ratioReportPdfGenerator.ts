import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface RatioReportData {
  id: number;
  job_card_id: number;
  excel_file_link: string;
  excel_file_name: string;
  factory_name: string;
  po_number: string;
  job_number: string;
  brand_name: string;
  item_name: string;
  report_date: string;
  total_ups: number | null;
  total_sheets: number | null;
  total_plates: number | null;
  qty_produced: number | null;
  excess_qty: number | null;
  efficiency_percentage: number | null;
  excess_percentage: number | null;
  required_order_qty: number | null;
  color_details: Array<{
    color: string;
    size: string;
    requiredQty: number;
    plate: string;
    ups: number;
    sheets: number;
    qtyProduced: number;
    excessQty: number;
  }>;
  plate_distribution: Record<string, number>;
  color_efficiency: Record<string, number>;
  raw_excel_data: any;
  created_at: string;
}

export const generateRatioReportPDF = (ratioReport: any): void => {
  console.log('🔍 PDF Generator - Full ratio report data:', ratioReport);
  console.log('🔍 PDF Generator - total_ups:', ratioReport.total_ups, 'type:', typeof ratioReport.total_ups);
  console.log('🔍 PDF Generator - total_sheets:', ratioReport.total_sheets, 'type:', typeof ratioReport.total_sheets);
  console.log('🔍 PDF Generator - total_plates:', ratioReport.total_plates, 'type:', typeof ratioReport.total_plates);
  console.log('🔍 PDF Generator - qty_produced:', ratioReport.qty_produced, 'type:', typeof ratioReport.qty_produced);
  console.log('🔍 PDF Generator - required_order_qty:', ratioReport.required_order_qty, 'type:', typeof ratioReport.required_order_qty);
  console.log('🔍 PDF Generator - plate_distribution:', ratioReport.plate_distribution);
  console.log('🔍 PDF Generator - color_details:', ratioReport.color_details);
  
  // Calculate summary values from color_details or plate_distribution if null
  let calculatedTotalUps = ratioReport.total_ups;
  let calculatedTotalPlates = ratioReport.total_plates;
  let calculatedQtyProduced = ratioReport.qty_produced;
  let calculatedExcessQty = ratioReport.excess_qty;
  let calculatedRequiredQty = ratioReport.required_order_qty;
  
  // Try to get total UPS from plate_distribution (it's the SAME value for all plates, not a sum!)
  if ((calculatedTotalUps === null || calculatedTotalUps === undefined) && 
      ratioReport.plate_distribution && typeof ratioReport.plate_distribution === 'object') {
    const plateValues = Object.values(ratioReport.plate_distribution);
    if (plateValues.length > 0 && plateValues[0] && typeof plateValues[0] === 'object' && 'totalUPS' in plateValues[0]) {
      // Total UPS is the same for all plates, just take it from the first plate
      calculatedTotalUps = (plateValues[0] as any).totalUPS;
    }
  }
  
  if (ratioReport.color_details && Array.isArray(ratioReport.color_details) && ratioReport.color_details.length > 0) {
    if (calculatedQtyProduced === null || calculatedQtyProduced === undefined) {
      calculatedQtyProduced = ratioReport.color_details.reduce((sum: number, d: any) => sum + (d.qtyProduced || 0), 0);
    }
    if (calculatedExcessQty === null || calculatedExcessQty === undefined) {
      calculatedExcessQty = ratioReport.color_details.reduce((sum: number, d: any) => sum + (d.excessQty || 0), 0);
    }
    if (calculatedRequiredQty === null || calculatedRequiredQty === undefined) {
      calculatedRequiredQty = ratioReport.color_details.reduce((sum: number, d: any) => sum + (d.requiredQty || 0), 0);
    }
    if (calculatedTotalPlates === null || calculatedTotalPlates === undefined) {
      const uniquePlates = new Set(ratioReport.color_details.map((d: any) => d.plate).filter(Boolean));
      calculatedTotalPlates = uniquePlates.size;
    }
  }
  
  console.log('📊 PDF Generator - Calculated values:', {
    calculatedTotalUps,
    calculatedTotalPlates,
    calculatedQtyProduced,
    calculatedExcessQty,
    calculatedRequiredQty
  });
  
  const doc = new jsPDF();
  
  // Header
  doc.setFillColor(41, 128, 185);
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('PRODUCTION RATIO REPORT', 105, 18, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('UPS Optimization & Production Metrics', 105, 28, { align: 'center' });
  
  let yPos = 50;
  
  // Order Information Section
  doc.setFillColor(240, 248, 255);
  doc.rect(10, yPos, 190, 8, 'F');
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Order Information', 15, yPos + 6);
  
  yPos += 15;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const orderInfo = [
    ['Factory:', ratioReport.factory_name || 'N/A', 'PO Number:', ratioReport.po_number || 'N/A'],
    ['Job Number:', ratioReport.job_number || 'N/A', 'Report Date:', new Date(ratioReport.report_date).toLocaleDateString()],
    ['Brand:', ratioReport.brand_name || 'N/A', 'Item:', ratioReport.item_name || 'N/A']
  ];
  
  autoTable(doc, {
    startY: yPos,
    head: [],
    body: orderInfo,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 35 },
      1: { cellWidth: 60 },
      2: { fontStyle: 'bold', cellWidth: 35 },
      3: { cellWidth: 60 }
    }
  });
  
  yPos = (doc as any).lastAutoTable.finalY + 10;
  
  // Production Metrics Section
  doc.setFillColor(240, 255, 240);
  doc.rect(10, yPos, 190, 8, 'F');
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Production Metrics', 15, yPos + 6);
  
  yPos += 15;
  
  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'number') return value.toString();
    if (typeof value === 'string') return value;
    return 'N/A';
  };

  const formatPercentage = (value: any): string => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'number') return `${value.toFixed(1)}%`;
    return 'N/A';
  };

  const metricsData = [
    ['Total UPS', formatValue(calculatedTotalUps)],
    ['Total Sheets', formatValue(ratioReport.total_sheets)],
    ['Total Plates', formatValue(calculatedTotalPlates)],
    ['Qty Produced', formatValue(calculatedQtyProduced)],
    ['Required Order Qty', formatValue(calculatedRequiredQty)],
    ['Excess Qty', formatValue(calculatedExcessQty)],
    ['Efficiency', formatPercentage(ratioReport.efficiency_percentage)],
    ['Excess %', formatPercentage(ratioReport.excess_percentage)]
  ];
  
  autoTable(doc, {
    startY: yPos,
    head: [['Metric', 'Value']],
    body: metricsData,
    theme: 'grid',
    headStyles: { fillColor: [76, 175, 80], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 10, cellPadding: 4 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 80 },
      1: { cellWidth: 110, halign: 'right' }
    }
  });
  
  yPos = (doc as any).lastAutoTable.finalY + 15;
  
  // Color Details Section
  if (ratioReport.color_details && ratioReport.color_details.length > 0) {
    doc.setFillColor(255, 248, 240);
    doc.rect(10, yPos, 190, 8, 'F');
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Color Details Breakdown', 15, yPos + 6);
    
    yPos += 15;
    
    const colorDetailsData = ratioReport.color_details.map(detail => [
      detail.color || 'N/A',
      detail.size || 'N/A',
      formatValue(detail.requiredQty),
      detail.plate || 'N/A',
      formatValue(detail.ups),
      formatValue(detail.sheets) === 'N/A' ? '-' : formatValue(detail.sheets),
      formatValue(detail.qtyProduced),
      formatValue(detail.excessQty)
    ]);
    
    autoTable(doc, {
      startY: yPos,
      head: [['Color', 'Size', 'Required Qty', 'Plate', 'UPS', 'Sheets', 'Qty Produced', 'Excess Qty']],
      body: colorDetailsData,
      theme: 'striped',
      headStyles: { fillColor: [255, 152, 0], textColor: 255, fontStyle: 'bold', halign: 'center' },
      styles: { fontSize: 9, cellPadding: 3, halign: 'center' },
      columnStyles: {
        0: { cellWidth: 28 },
        1: { cellWidth: 20 },
        2: { cellWidth: 25 },
        3: { cellWidth: 18, fontStyle: 'bold', textColor: [41, 128, 185] },
        4: { cellWidth: 18 },
        5: { cellWidth: 20 },
        6: { cellWidth: 28 },
        7: { cellWidth: 25 }
      }
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 15;
  }
  
  // Plate Distribution Section (if it fits on the page)
  if (ratioReport.plate_distribution && Object.keys(ratioReport.plate_distribution).length > 0) {
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFillColor(255, 243, 224);
    doc.rect(10, yPos, 190, 8, 'F');
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Plate Distribution', 15, yPos + 6);
    
    yPos += 15;
    
    // Use simple plate distribution if available, otherwise transform complex format
    const plateDist = (ratioReport as any).plate_distribution_simple || ratioReport.plate_distribution || {};
    
    const plateData = Object.entries(plateDist).map(([plate, data]) => {
      // Handle both simple number format and complex object format
      let count: string;
      if (typeof data === 'number') {
        count = data.toString();
      } else if (data && typeof data === 'object' && 'colors' in data) {
        // Complex format: count the number of colors for this plate
        count = (data as any).colors?.length?.toString() || '0';
      } else {
        count = formatValue(data);
      }
      
      return [`Plate ${plate}`, count];
    });
    
    autoTable(doc, {
      startY: yPos,
      head: [['Plate', 'Count']],
      body: plateData,
      theme: 'grid',
      headStyles: { fillColor: [255, 193, 7], textColor: 0, fontStyle: 'bold' },
      styles: { fontSize: 10, cellPadding: 4 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 95 },
        1: { cellWidth: 95, halign: 'center' }
      }
    });
  }
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Generated on ${new Date().toLocaleString()} | Page ${i} of ${pageCount}`,
      105,
      285,
      { align: 'center' }
    );
  }
  
  // Save the PDF
  const fileName = `Ratio_Report_${ratioReport.job_number}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};

