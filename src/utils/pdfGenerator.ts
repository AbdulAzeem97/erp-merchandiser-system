import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ProductMaster, ProcessStep } from '../types/erp';
import { PROCESS_SEQUENCES } from '../data/processSequences';

interface JobCardData {
  productCode: string;
  poNumber: string;
  quantity: number;
  deliveryDate: string;
  customerNotes: string;
  uploadedImages: File[];
  merchandiser: string;
  customerName?: string;
  salesman?: string;
  jobCode?: string;
  targetDate?: string;
  dimensions?: {
    width: number;
    height: number;
  };
  // Additional fields for complete job data
  clientLayoutLink?: string;
  finalDesignLink?: string;
  assignedDesigner?: {
    name: string;
    email: string;
    phone?: string;
  };
  material?: string;
  fsc?: string;
  fscClaim?: string;
  brand?: string;
  gsm?: number;
  category?: string;
}

interface PDFGenerationOptions {
  product: ProductMaster;
  jobCardData: JobCardData;
  jobCardId: string;
  companyInfo?: {
    name: string;
    tagline: string;
    logo?: string;
    address: string;
    phone: string;
    email: string;
  };
}

// Professional Department mapping
const DEPARTMENT_MAPPING: { [key: string]: { name: string; color: [number, number, number] } } = {
  'Prepress': { name: 'Prepress Department', color: [51, 51, 51] },
  'Material Procurement': { name: 'Procurement Department', color: [51, 51, 51] },
  'Material Issuance': { name: 'Warehouse Department', color: [51, 51, 51] },
  'Paper Cutting': { name: 'Cutting Department', color: [51, 51, 51] },
  'Offset Printing': { name: 'Printing Department', color: [51, 51, 51] },
  'Digital Printing': { name: 'Digital Department', color: [51, 51, 51] },
  'Printing': { name: 'Printing Department', color: [51, 51, 51] },
  'Varnish Matt': { name: 'Finishing Department', color: [51, 51, 51] },
  'Varnish Gloss': { name: 'Finishing Department', color: [51, 51, 51] },
  'Varnish Soft Touch': { name: 'Finishing Department', color: [51, 51, 51] },
  'Lamination': { name: 'Lamination Department', color: [51, 51, 51] },
  'Lamination Matte': { name: 'Lamination Department', color: [51, 51, 51] },
  'Lamination Gloss': { name: 'Lamination Department', color: [51, 51, 51] },
  'Lamination Soft Touch': { name: 'Lamination Department', color: [51, 51, 51] },
  'UV': { name: 'UV Department', color: [51, 51, 51] },
  'Foil Matte': { name: 'Foil Department', color: [51, 51, 51] },
  'Foil Gloss': { name: 'Foil Department', color: [51, 51, 51] },
  'Screen Printing': { name: 'Screen Department', color: [51, 51, 51] },
  'Embossing': { name: 'Embossing Department', color: [51, 51, 51] },
  'Debossing': { name: 'Embossing Department', color: [51, 51, 51] },
  'Die Cutting': { name: 'Die Cutting Department', color: [51, 51, 51] },
  'Breaking': { name: 'Breaking Department', color: [51, 51, 51] },
  'Packing': { name: 'Packing Department', color: [51, 51, 51] },
  'Ready': { name: 'Quality Department', color: [51, 51, 51] },
  'Dispatch': { name: 'Dispatch Department', color: [51, 51, 51] },
  'Excess': { name: 'Inventory Department', color: [51, 51, 51] },
  'RFID': { name: 'RFID Department', color: [51, 51, 51] },
  'Crushing': { name: 'Finishing Department', color: [51, 51, 51] }
};

export class AdvancedJobCardPDFGenerator {
  private pdf: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number;
  private contentWidth: number;
  private currentY: number;
  private options: PDFGenerationOptions;
  private pageNumber: number = 1;

  constructor(options: PDFGenerationOptions) {
    this.options = options;
    this.pdf = new jsPDF('p', 'mm', 'a4');
    this.pageWidth = this.pdf.internal.pageSize.getWidth();
    this.pageHeight = this.pdf.internal.pageSize.getHeight();
    this.margin = 15; // Reduced margin for more content space
    this.contentWidth = this.pageWidth - (2 * this.margin);
    this.currentY = 25; // Reduced top margin for more content space
  }

  // Professional page break handler
  private checkPageBreak(neededHeight: number): void {
    if (this.currentY + neededHeight > this.pageHeight - 25) { // Reduced bottom margin for more content space
      this.addNewPage();
    }
  }

  private addNewPage(): void {
    this.pdf.addPage();
    this.pageNumber++;
    this.currentY = 25; // Reduced top margin for more content space
    this.addPageHeader();
  }

  private addPageHeader(): void {
    // Professional header for continuation pages
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(11);
    this.pdf.setTextColor(0, 0, 0);
    this.pdf.text(`Job Card: ${this.options.jobCardId}`, this.margin, 15);
    
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(9);
    this.pdf.setTextColor(64, 64, 64);
    this.pdf.text(`${this.options.product.product_item_code} • ${this.options.jobCardData.customerName || 'Customer'}`, this.margin, 21);
    
    // Professional separator line
    this.pdf.setDrawColor(0, 0, 0);
    this.pdf.setLineWidth(0.5);
    this.pdf.line(this.margin, 25, this.pageWidth - this.margin, 25);
    
    this.currentY = 30;
  }

  // Professional header with company branding
  private createHeader(): void {
    const companyInfo = this.options.companyInfo || {
      name: 'HORIZON SOURCING PVT LIMITED',
      tagline: 'The Supplier Of Garment Accessories',
      address: 'Industrial Area, Karachi, Pakistan',
      phone: '+92-21-XXXXXXX',
      email: 'info@horizonsourcing.com'
    };

    // Centered company name at top - moved higher with professional font in black box
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(22);
    this.pdf.setTextColor(255, 255, 255); // White text
    const companyNameWidth = this.pdf.getTextWidth(companyInfo.name);
    const companyNameX = (this.pageWidth - companyNameWidth) / 2;
    
    // Draw black background box for company name - exact text width and height
    this.pdf.setFillColor(0, 0, 0);
    this.pdf.rect(companyNameX, 8, companyNameWidth, 12, 'F');
    this.pdf.text(companyInfo.name, companyNameX, 15);
    
    // Create compact table with Job ID, Date, and Created By (same style as job details table)
    const tableStartY = 25; // Reduced from 30
    const tableHeight = 15; // Reduced from 20 for more compact layout
    const colWidth = this.contentWidth / 3; // Three columns now
    
    // Draw table borders
    this.pdf.setDrawColor(0, 0, 0);
    this.pdf.setLineWidth(0.3); // Reduced from 0.5 to match job details table
    
    // Horizontal lines
    this.pdf.line(this.margin, tableStartY, this.pageWidth - this.margin, tableStartY);
    this.pdf.line(this.margin, tableStartY + 7.5, this.pageWidth - this.margin, tableStartY + 7.5); // Middle line adjusted
    this.pdf.line(this.margin, tableStartY + tableHeight, this.pageWidth - this.margin, tableStartY + tableHeight);
    
    // Vertical lines for three columns
    this.pdf.line(this.margin + colWidth, tableStartY, this.margin + colWidth, tableStartY + tableHeight);
    this.pdf.line(this.margin + colWidth * 2, tableStartY, this.margin + colWidth * 2, tableStartY + tableHeight);
    
    // Left column - Job ID
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(9); // Reduced from 10
    this.pdf.setTextColor(0, 0, 0);
    this.pdf.text('JOB ID', this.margin + 5, tableStartY + 5);
    
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(9); // Reduced from 10
    this.pdf.setTextColor(64, 64, 64);
    this.pdf.text(String(this.options.jobCardId || 'N/A'), this.margin + 5, tableStartY + 12);
    
    // Middle column - Date
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(9); // Reduced from 10
    this.pdf.setTextColor(0, 0, 0);
    this.pdf.text('DATE', this.margin + colWidth + 5, tableStartY + 5);
    
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(9); // Reduced from 10
    this.pdf.setTextColor(64, 64, 64);
    this.pdf.text(new Date().toLocaleDateString(), this.margin + colWidth + 5, tableStartY + 12);
    
    // Right column - Created By
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(9); // Reduced from 10
    this.pdf.setTextColor(0, 0, 0);
    this.pdf.text('CREATED BY', this.margin + colWidth * 2 + 5, tableStartY + 5);
    
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(9); // Reduced from 10
    this.pdf.setTextColor(64, 64, 64);
    this.pdf.text(this.options.jobCardData.merchandiser, this.margin + colWidth * 2 + 5, tableStartY + 12);

    // Remove the separator line before job details
    // this.pdf.setDrawColor(0, 0, 0);
    // this.pdf.setLineWidth(1.0);
    // this.pdf.line(this.margin, tableStartY + tableHeight + 8, this.pageWidth - this.margin, tableStartY + tableHeight + 8);

    this.currentY = tableStartY + tableHeight + 10; // Reduced spacing from 15 to 10
  }

  // Professional job details section with enhanced table
  private createJobDetailsSection(): void {
    this.checkPageBreak(60);
    
    this.createSectionHeader('JOB DETAILS');
    
    // Customer information
    if (this.options.jobCardData.customerName) {
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.setFontSize(9); // Reduced from 11
      this.pdf.setTextColor(0, 0, 0);
      this.pdf.text('Customer Information:', this.margin, this.currentY);
      
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.setFontSize(8); // Reduced from 10
      this.pdf.setTextColor(64, 64, 64);
      this.pdf.text(`Name: ${this.options.jobCardData.customerName}`, this.margin + 5, this.currentY + 5); // Reduced from 8
      
      if (this.options.jobCardData.salesman) {
        this.pdf.text(`Account Manager: ${this.options.jobCardData.salesman}`, this.pageWidth - this.margin - 80, this.currentY + 5); // Reduced from 8
      }
      
      this.currentY += 12; // Reduced from 20
    }

    // Enhanced job details table with borders
    const jobDetails = [
      { label: 'Product Code', value: this.options.product.product_item_code },
      { label: 'PO Number', value: this.options.jobCardData.poNumber },
      { label: 'Job Code', value: this.options.jobCardData.jobCode || 'Auto-Generated' },
      { label: 'Quantity', value: this.options.jobCardData.quantity.toLocaleString() + ' units' },
      { label: 'Delivery Date', value: new Date(this.options.jobCardData.deliveryDate).toLocaleDateString() },
      { label: 'Target Date', value: this.options.jobCardData.targetDate || 'TBD' }
    ];

        // Create enhanced job details table with better formatting and alignment
    const tableStartY = this.currentY;
    const rowHeight = 9; // Slightly increased for better readability
    const tableHeight = jobDetails.length * rowHeight;
    
    // Calculate optimal column widths for better alignment
    const labelWidth = 85; // Fixed width for labels
    const valueWidth = this.contentWidth - labelWidth - 10; // Remaining width for values
    const valueStartX = this.margin + labelWidth + 5; // Start position for values
    
    // Draw table borders with enhanced styling
    this.pdf.setDrawColor(0, 0, 0);
    this.pdf.setLineWidth(0.4); // Slightly thicker for better visibility
    
    // Enhanced header row with better styling and subtle shadow
    this.pdf.setFillColor(245, 245, 245); // Lighter gray for subtle contrast
    this.pdf.rect(this.margin, tableStartY - 4, this.contentWidth, 8, 'F');
    
    // Add subtle shadow effect for header
    this.pdf.setFillColor(235, 235, 235);
    this.pdf.rect(this.margin + 1, tableStartY - 3, this.contentWidth, 8, 'F');
    this.pdf.setFillColor(245, 245, 245);
    this.pdf.rect(this.margin, tableStartY - 4, this.contentWidth, 8, 'F');
    
    // Header text with better positioning and enhanced typography
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(9); // Slightly larger for better readability
    this.pdf.setTextColor(0, 0, 0);
    this.pdf.text('Field', this.margin + 8, tableStartY);
    this.pdf.text('Value', valueStartX + 5, tableStartY);
    
    // Enhanced header borders
    this.pdf.line(this.margin, tableStartY - 4, this.pageWidth - this.margin, tableStartY - 4); // Top border
    this.pdf.line(this.margin, tableStartY + 4, this.pageWidth - this.margin, tableStartY + 4); // Bottom border
    this.pdf.line(this.margin + labelWidth, tableStartY - 4, this.margin + labelWidth, tableStartY + tableHeight); // Vertical separator
    
    // Data rows with enhanced formatting
    jobDetails.forEach((detail, index) => {
      const y = tableStartY + 8 + index * rowHeight;
      
      // Row borders with alternating row colors for better readability
      if (index % 2 === 0) {
        this.pdf.setFillColor(250, 250, 250); // Very light gray for alternating rows
        this.pdf.rect(this.margin, y - 2, this.contentWidth, rowHeight, 'F');
      } else {
        this.pdf.setFillColor(255, 255, 255); // White for odd rows
        this.pdf.rect(this.margin, y - 2, this.contentWidth, rowHeight, 'F');
      }
      
      // Row separator lines with better styling
      this.pdf.setDrawColor(220, 220, 220); // Slightly darker for better visibility
      this.pdf.setLineWidth(0.15);
      this.pdf.line(this.margin, y + 6, this.pageWidth - this.margin, y + 6);
      
      // Label with better formatting
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.setFontSize(8); // Slightly larger for better readability
      this.pdf.setTextColor(0, 0, 0);
      this.pdf.text(detail.label, this.margin + 8, y + 2);
      
      // Value with better formatting and text wrapping
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.setFontSize(8); // Slightly larger for better readability
      this.pdf.setTextColor(64, 64, 64);
      
      // Handle long values with text wrapping
      const valueText = detail.value.toString();
      const valueLines = this.pdf.splitTextToSize(valueText, valueWidth - 10);
      
      // Display first line, and add ellipsis if there are more lines
      if (valueLines.length > 1) {
        this.pdf.text(valueLines[0] + '...', valueStartX + 5, y + 2);
      } else {
        this.pdf.text(valueText, valueStartX + 5, y + 2);
      }
    });
    
    // Bottom border with enhanced styling
    this.pdf.setDrawColor(0, 0, 0);
    this.pdf.setLineWidth(0.4);
    this.pdf.line(this.margin, tableStartY + tableHeight + 4, this.pageWidth - this.margin, tableStartY + tableHeight + 4);
    
    // Add subtle corner accents for professional look
    const cornerSize = 3;
    this.pdf.setFillColor(200, 200, 200);
    this.pdf.rect(this.margin, tableStartY + tableHeight + 2, cornerSize, cornerSize, 'F');
    this.pdf.rect(this.pageWidth - this.margin - cornerSize, tableStartY + tableHeight + 2, cornerSize, cornerSize, 'F');
    
    this.currentY = tableStartY + tableHeight + 10; // Increased spacing for better visual separation
  }

  // Create professional section headers - more compact
  private createSectionHeader(title: string): void {
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(10); // Reduced from 12
    this.pdf.setTextColor(0, 0, 0);
    this.pdf.text(title, this.margin, this.currentY);
    
    // Professional underline - matches text length
    this.pdf.setDrawColor(0, 0, 0);
    this.pdf.setLineWidth(0.5);
    const titleWidth = this.pdf.getTextWidth(title);
    this.pdf.line(this.margin, this.currentY + 1.5, this.margin + titleWidth, this.currentY + 1.5); // Reduced from +2 to +1.5
    
    this.currentY += 6; // Reduced from 8
  }

  // Add Google Drive links and designer information section
  private createLinksAndDesignerSection(): void {
    this.checkPageBreak(40);
    
    this.createSectionHeader('LINKS & ASSIGNMENTS');
    
    // Google Drive Links
    if (this.options.jobCardData.clientLayoutLink || this.options.jobCardData.finalDesignLink) {
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.setFontSize(9);
      this.pdf.setTextColor(0, 0, 0);
      this.pdf.text('Google Drive Links:', this.margin, this.currentY);
      this.currentY += 8;
      
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.setFontSize(8);
      this.pdf.setTextColor(64, 64, 64);
      
      if (this.options.jobCardData.clientLayoutLink) {
        this.pdf.text('🔗 Client Layout: ' + this.options.jobCardData.clientLayoutLink, this.margin + 5, this.currentY);
        this.currentY += 6;
      }
      
      if (this.options.jobCardData.finalDesignLink) {
        this.pdf.text('🔗 Final Design: ' + this.options.jobCardData.finalDesignLink, this.margin + 5, this.currentY);
        this.currentY += 6;
      }
      
      this.currentY += 8;
    }
    
    // Assigned Designer Information
    if (this.options.jobCardData.assignedDesigner) {
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.setFontSize(9);
      this.pdf.setTextColor(0, 0, 0);
      this.pdf.text('Assigned Designer:', this.margin, this.currentY);
      this.currentY += 8;
      
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.setFontSize(8);
      this.pdf.setTextColor(64, 64, 64);
      this.pdf.text(`Name: ${this.options.jobCardData.assignedDesigner.name}`, this.margin + 5, this.currentY);
      this.currentY += 6;
      this.pdf.text(`Email: ${this.options.jobCardData.assignedDesigner.email}`, this.margin + 5, this.currentY);
      this.currentY += 6;
      if (this.options.jobCardData.assignedDesigner.phone) {
        this.pdf.text(`Phone: ${this.options.jobCardData.assignedDesigner.phone}`, this.margin + 5, this.currentY);
        this.currentY += 6;
      }
      
      this.currentY += 8;
    }
  }

  // Professional product specifications with enhanced table
  private createProductSpecifications(): void {
    this.checkPageBreak(60); // Reduced from 70
    
    this.createSectionHeader('PRODUCT SPECIFICATIONS');
    
    const productSpecs = [
      { label: 'Brand', value: this.options.jobCardData.brand || this.options.product.brand || 'N/A' },
      { label: 'Material', value: this.options.jobCardData.material || this.options.product.material_name || this.options.product.material_id || 'N/A' },
      { label: 'GSM', value: `${this.options.jobCardData.gsm || this.options.product.gsm || 0} g/m²` },
      { label: 'Product Type', value: this.options.product.product_type || 'Offset' },
      { label: 'Category', value: this.options.jobCardData.category || this.options.product.category_name || 'N/A' },
      { label: 'Color Specifications', value: this.options.product.color_specifications || this.options.product.color || 'As per Approved Sample/Artwork' },
      { label: 'FSC Certified', value: this.options.jobCardData.fsc || this.options.product.fsc || 'No' },
      { label: 'FSC Claim', value: this.options.jobCardData.fscClaim || this.options.product.fsc_claim || 'Not Applicable' }
    ];

    // Create compact 3x3 table with borders (7 items)
    const cols = 3;
    const rows = 3;
    const colWidth = this.contentWidth / cols;
    const rowHeight = 8; // Further reduced from 10
    const tableStartY = this.currentY;

    // Draw table borders
    this.pdf.setDrawColor(0, 0, 0);
    this.pdf.setLineWidth(0.3);
    
    // Draw horizontal lines
    for (let i = 0; i <= rows; i++) {
      const y = tableStartY + i * rowHeight;
      this.pdf.line(this.margin, y, this.pageWidth - this.margin, y);
    }
    
    // Draw vertical lines
    for (let i = 0; i <= cols; i++) {
      const x = this.margin + i * colWidth;
      this.pdf.line(x, tableStartY, x, tableStartY + rows * rowHeight);
    }

    // Fill table content
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const index = row * cols + col;
        if (index < productSpecs.length) {
          const spec = productSpecs[index];
          const x = this.margin + col * colWidth + 5;
          const y = tableStartY + row * rowHeight + 2; // Further reduced from 3
          
          // Label
          this.pdf.setFont('helvetica', 'bold');
          this.pdf.setFontSize(6); // Further reduced from 7
          this.pdf.setTextColor(0, 0, 0);
          this.pdf.text(spec.label + ':', x, y);
          
          // Value
          this.pdf.setFont('helvetica', 'normal');
          this.pdf.setFontSize(6); // Further reduced from 7
          this.pdf.setTextColor(64, 64, 64);
          const valueLines = this.pdf.splitTextToSize(spec.value, colWidth - 10);
          this.pdf.text(valueLines[0], x, y + 3); // Further reduced from 4, only show first line
        }
      }
    }

    this.currentY = tableStartY + rows * rowHeight + 4; // Further reduced from 6

    // Dimensions section if available
    if (this.options.jobCardData.dimensions) {
      const { width, height } = this.options.jobCardData.dimensions;
      
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.setFontSize(8); // Further reduced from 9
      this.pdf.setTextColor(0, 0, 0);
      this.pdf.text('Dimensions:', this.margin, this.currentY);
      
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.setFontSize(8); // Further reduced from 9
      this.pdf.setTextColor(64, 64, 64);
      this.pdf.text(`${width}mm × ${height}mm`, this.margin + 30, this.currentY);
      
      // Area calculation
      const area = (width * height) / 100; // Convert to cm²
      this.pdf.text(`Area: ${area.toFixed(2)} cm²`, this.margin + 80, this.currentY);
      
      this.currentY += 8; // Further reduced from 12
    }
  }

  // Professional process workflow with enhanced table
  private createProcessWorkflow(): void {
    this.checkPageBreak(50); // Reduced from 60
    
    // Use the actual process sequence from the product data if available
    let processSteps = this.options.product.processSequence?.steps || [];
    
    // Fallback to static data if no process sequence is available
    if (!processSteps || processSteps.length === 0) {
      const processSequence = PROCESS_SEQUENCES.find(
        seq => seq.productType === this.options.product.product_type
      );
      processSteps = processSequence?.steps || [];
    }
    
    if (!processSteps || processSteps.length === 0) {
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.setFontSize(10);
      this.pdf.setTextColor(128, 0, 0);
      this.pdf.text('No process sequence found for this product type', this.margin, this.currentY);
      this.currentY += 15;
      return;
    }

    this.createSectionHeader(`PRODUCTION WORKFLOW - ${this.options.product.product_type}`);
    
    // Filter to show only selected steps
    const selectedSteps = processSteps.filter(step => step.is_selected || step.isSelected || step.is_compulsory || step.isCompulsory);
    
    // Process table - only show selected steps
    this.createProcessTable(selectedSteps);
  }

  private createProcessTable(steps: ProcessStep[]): void {
    this.checkPageBreak(25 + steps.length * 6); // Reduced from 30 + steps.length * 8
    
    // Enhanced table header with borders
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(8); // Reduced from 9
    this.pdf.setTextColor(0, 0, 0);
    
    // Calculate proper column widths based on content width (removed Department column)
    const totalWidth = this.contentWidth;
    const columns = [
      { title: 'Step', width: totalWidth * 0.12, x: this.margin }, // Reduced from 0.15
      { title: 'Process Name', width: totalWidth * 0.53, x: 0 }, // Increased from 0.50
      { title: 'Type', width: totalWidth * 0.20, x: 0 },
      { title: 'Status', width: totalWidth * 0.15, x: 0 }
    ];
    
    // Calculate x positions for each column
    let currentX = this.margin;
    columns.forEach((col, index) => {
      col.x = currentX;
      currentX += col.width;
    });
    
    const tableStartY = this.currentY;
    
    // Draw header background
    this.pdf.setFillColor(240, 240, 240);
    this.pdf.rect(this.margin, tableStartY - 3, this.contentWidth, 6, 'F'); // Reduced height from 10 to 6
    
    // Draw header borders
    this.pdf.setDrawColor(0, 0, 0);
    this.pdf.setLineWidth(0.3);
    this.pdf.line(this.margin, tableStartY - 3, this.pageWidth - this.margin, tableStartY - 3);
    this.pdf.line(this.margin, tableStartY + 3, this.pageWidth - this.margin, tableStartY + 3); // Reduced from +5 to +3
    
    // Draw header text and vertical lines
    columns.forEach((col, index) => {
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.setFontSize(7); // Reduced from 8
      this.pdf.setTextColor(0, 0, 0);
      this.pdf.text(col.title, col.x + 3, tableStartY);
      this.pdf.line(col.x, tableStartY - 3, col.x, tableStartY + 3); // Reduced from +5 to +3
    });
    this.pdf.line(currentX, tableStartY - 3, currentX, tableStartY + 3); // Reduced from +5 to +3
    
    this.currentY = tableStartY + 8; // Reduced from 10 to 8
    
    // Process rows with alternating row colors
    steps.forEach((step, index) => {
      this.checkPageBreak(6); // Reduced from 8
      
      // Alternate row colors for better readability
      if (index % 2 === 0) {
        this.pdf.setFillColor(248, 248, 248);
        this.pdf.rect(this.margin, this.currentY - 2, this.contentWidth, 4, 'F'); // Reduced height from 6 to 4
      }
      
      // Row borders
      this.pdf.setDrawColor(0, 0, 0);
      this.pdf.setLineWidth(0.2);
      this.pdf.line(this.margin, this.currentY + 2, this.pageWidth - this.margin, this.currentY + 2); // Reduced from +4 to +2
      
      // Step number
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.setFontSize(6); // Reduced from 7
      this.pdf.setTextColor(0, 0, 0);
      this.pdf.text((index + 1).toString(), columns[0].x + 3, this.currentY);
      
      // Process name - with text wrapping
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.setFontSize(6); // Reduced from 7
      this.pdf.setTextColor(0, 0, 0);
      const processName = step.name;
      const processLines = this.pdf.splitTextToSize(processName, columns[1].width - 6);
      this.pdf.text(processLines[0], columns[1].x + 3, this.currentY);
      
      // Type - Unified approach
      this.pdf.setTextColor(64, 64, 64);
      const typeText = 'Process';
      this.pdf.text(typeText, columns[2].x + 3, this.currentY);
      
      // Status - Draw empty checkbox
      const checkboxSize = 2.5; // Reduced from 3
      const checkboxX = columns[3].x + 6;
      const checkboxY = this.currentY - 1; // Reduced from -1.5
      
      // Draw checkbox outline
      this.pdf.setDrawColor(0, 0, 0);
      this.pdf.setLineWidth(0.3);
      this.pdf.rect(checkboxX, checkboxY, checkboxSize, checkboxSize, 'S');
      
      this.currentY += 4; // Reduced from 6
    });
    
    this.currentY += 6; // Reduced from 8
  }



  // Professional quality control section with enhanced table
  private createQualityControlSection(): void {
    this.checkPageBreak(60);
    
    this.createSectionHeader('QUALITY CONTROL CHECKPOINTS');
    
    const qcCheckpoints = [
      { point: 'Raw Material Inspection', responsible: 'Warehouse Team', critical: true },
      { point: 'Pre-Production Sample Approval', responsible: 'Design Team', critical: true },
      { point: 'Color Matching Verification', responsible: 'Print Team', critical: true },
      { point: 'Dimension Accuracy Check', responsible: 'QC Team', critical: true },
      { point: 'Process Quality Monitoring', responsible: 'Production Team', critical: false },
      { point: 'Surface Finish Inspection', responsible: 'Finishing Team', critical: true },
      { point: 'Final Product Approval', responsible: 'QC Manager', critical: true },
      { point: 'Packaging Quality Check', responsible: 'Packing Team', critical: false },
      { point: 'Pre-Dispatch Audit', responsible: 'QC Team', critical: true }
    ];
    
    // Create professional QC table with borders
    const pointWidth = 80;
    const responsibleWidth = 50;
    const statusWidth = 30;
    const rowHeight = 8;
    const tableStartY = this.currentY;

    // Draw table borders
    this.pdf.setDrawColor(0, 0, 0);
    this.pdf.setLineWidth(0.3);
    
    // Header row
    this.pdf.setFillColor(240, 240, 240);
    this.pdf.rect(this.margin, tableStartY - 3, this.contentWidth, 8, 'F');
    
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(8);
    this.pdf.setTextColor(0, 0, 0);
    this.pdf.text('Checkpoint', this.margin + 2, tableStartY);
    this.pdf.text('Responsible', this.margin + pointWidth + 5, tableStartY);
    this.pdf.text('Priority', this.margin + pointWidth + responsibleWidth + 10, tableStartY);
    
    // Header borders
    this.pdf.line(this.margin, tableStartY - 3, this.pageWidth - this.margin, tableStartY - 3);
    this.pdf.line(this.margin, tableStartY + 5, this.pageWidth - this.margin, tableStartY + 5);
    
    qcCheckpoints.forEach((checkpoint, index) => {
      const y = tableStartY + 8 + index * rowHeight;
      
      // Row borders
      this.pdf.line(this.margin, y + 5, this.pageWidth - this.margin, y + 5);
      
      // Checkpoint
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.setFontSize(8);
      this.pdf.setTextColor(0, 0, 0);
      this.pdf.text(checkpoint.point, this.margin + 2, y);
      
      // Responsible team
      this.pdf.setTextColor(64, 64, 64);
      this.pdf.text(checkpoint.responsible, this.margin + pointWidth + 5, y);
      
      // Critical indicator
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.setTextColor(checkpoint.critical ? 0 : 64, checkpoint.critical ? 0 : 64, checkpoint.critical ? 0 : 64);
      this.pdf.text(checkpoint.critical ? 'Critical' : 'Standard', this.margin + pointWidth + responsibleWidth + 10, y);
    });
    
    this.currentY = tableStartY + 8 + qcCheckpoints.length * rowHeight + 10;
  }



  // Professional reference images section
  private async createReferenceImagesSection(): Promise<void> {
    const imageFiles = this.options.jobCardData.uploadedImages.filter(file => 
      file.type.startsWith('image/')
    );
    
    if (imageFiles.length === 0) return;
    
    this.checkPageBreak(40 + imageFiles.length * 60);
    
    this.createSectionHeader(`REFERENCE IMAGES (${imageFiles.length})`);
    
    // Add description
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(8);
    this.pdf.setTextColor(64, 64, 64);
    this.pdf.text('Uploaded reference images for production guidance:', this.margin, this.currentY);
    this.currentY += 10;
    
    // Process each image
    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      
      try {
        // Convert file to base64 for PDF inclusion
        const base64Data = await this.fileToBase64(file);
        
        // Create a temporary image to get dimensions
        const img = new Image();
        const dimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
          img.onload = () => resolve({ width: img.width, height: img.height });
          img.onerror = () => reject(new Error('Failed to load image'));
          img.src = base64Data;
        });
        
        // Calculate dimensions to fit in PDF
        const maxWidth = this.contentWidth - 20;
        const maxHeight = 80;
        
        let { width, height } = dimensions;
        
        // Scale down if image is too large
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
        
        // Check page break before adding image
        this.checkPageBreak(height + 30);
        
        // Add image title
        this.pdf.setFont('helvetica', 'bold');
        this.pdf.setFontSize(10);
        this.pdf.setTextColor(0, 0, 0);
        this.pdf.text(`Reference Image ${i + 1}: ${file.name}`, this.margin, this.currentY);
        this.currentY += 8;
        
        // Add image to PDF with border
        this.pdf.setDrawColor(0, 0, 0);
        this.pdf.setLineWidth(0.5);
        this.pdf.rect(this.margin - 2, this.currentY - 2, width + 4, height + 4);
        this.pdf.addImage(base64Data, 'JPEG', this.margin, this.currentY, width, height);
        this.currentY += height + 10;
        
        // Add image info
        this.pdf.setFont('helvetica', 'normal');
        this.pdf.setFontSize(8);
        this.pdf.setTextColor(64, 64, 64);
        this.pdf.text(`Dimensions: ${width.toFixed(0)} × ${height.toFixed(0)} mm | Size: ${(file.size / 1024).toFixed(1)} KB`, this.margin, this.currentY);
        this.currentY += 15;
        
      } catch (error) {
        console.error('Error processing image:', error);
        
        // Fallback: just show file info with placeholder
        this.pdf.setFont('helvetica', 'normal');
        this.pdf.setFontSize(9);
        this.pdf.setTextColor(0, 0, 0);
        this.pdf.text(`Reference Image ${i + 1}: ${file.name}`, this.margin, this.currentY);
        this.currentY += 8;
        
        // Draw placeholder box
        this.pdf.setDrawColor(128, 128, 128);
        this.pdf.setLineWidth(0.5);
        this.pdf.setFillColor(240, 240, 240);
        this.pdf.rect(this.margin, this.currentY, 80, 60, 'F');
        this.pdf.rect(this.margin, this.currentY, 80, 60);
        
        this.pdf.setFont('helvetica', 'normal');
        this.pdf.setFontSize(8);
        this.pdf.setTextColor(128, 128, 128);
        this.pdf.text('Image', this.margin + 30, this.currentY + 25);
        this.pdf.text('Placeholder', this.margin + 25, this.currentY + 35);
        
        this.currentY += 70;
        
        this.pdf.setFontSize(8);
        this.pdf.setTextColor(64, 64, 64);
        this.pdf.text(`Size: ${(file.size / 1024).toFixed(1)} KB | Type: ${file.type}`, this.margin, this.currentY);
        this.currentY += 15;
      }
    }
    
    this.currentY += 10;
  }

  // Helper method to convert file to base64
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert file to base64'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  // Professional remarks section
  private createRemarksSection(): void {
    if (!this.options.jobCardData.customerNotes && !this.options.product.remarks) return;
    
    this.checkPageBreak(30);
    
    this.createSectionHeader('SPECIAL INSTRUCTIONS & REMARKS');
    
    if (this.options.jobCardData.customerNotes) {
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.setFontSize(9);
      this.pdf.setTextColor(0, 0, 0);
      this.pdf.text('Customer Notes:', this.margin, this.currentY);
      
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.setFontSize(8);
      this.pdf.setTextColor(64, 64, 64);
      const customerLines = this.pdf.splitTextToSize(this.options.jobCardData.customerNotes, this.contentWidth - 10);
      this.pdf.text(customerLines, this.margin, this.currentY + 6);
      
      this.currentY += 12 + (customerLines.length * 4);
    }
    
    if (this.options.product.remarks) {
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.setFontSize(9);
      this.pdf.setTextColor(0, 0, 0);
      this.pdf.text('Product Remarks:', this.margin, this.currentY);
      
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.setFontSize(8);
      this.pdf.setTextColor(64, 64, 64);
      const remarkLines = this.pdf.splitTextToSize(this.options.product.remarks, this.contentWidth - 10);
      this.pdf.text(remarkLines, this.margin, this.currentY + 6);
      
      this.currentY += 12 + (remarkLines.length * 4);
    }
  }

  // Professional timeline section
  private createTimelineSection(): void {
    this.checkPageBreak(40);
    
    this.createSectionHeader('PRODUCTION TIMELINE');
    
    const timeline = [
      { phase: 'Pre-Production', duration: '1-2 days', tasks: 'Material procurement, sample approval' },
      { phase: 'Production', duration: '3-5 days', tasks: 'Printing, processing, finishing' },
      { phase: 'Quality Check', duration: '1 day', tasks: 'Inspection, testing, approval' },
      { phase: 'Packaging', duration: '1 day', tasks: 'Final packaging, labeling' },
      { phase: 'Dispatch', duration: '1 day', tasks: 'Documentation, shipping' }
    ];
    
    timeline.forEach((item, index) => {
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.setFontSize(8);
      this.pdf.setTextColor(0, 0, 0);
      this.pdf.text(`${index + 1}. ${item.phase}`, this.margin, this.currentY);
      
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.setFontSize(7);
      this.pdf.setTextColor(64, 64, 64);
      this.pdf.text(`Duration: ${item.duration}`, this.margin + 50, this.currentY);
      this.pdf.text(`Tasks: ${item.tasks}`, this.margin + 120, this.currentY);
      
      this.currentY += 6;
    });
    
    this.currentY += 8;
  }

  // Professional signature section
  private createSignatureSection(): void {
    this.checkPageBreak(50);
    
    this.createSectionHeader('AUTHORIZATION & SIGNATURES');
    
    const signatures = [
      { role: 'Production Manager', name: '_________________', date: '_________________' },
      { role: 'Quality Manager', name: '_________________', date: '_________________' },
      { role: 'Customer Representative', name: '_________________', date: '_________________' }
    ];
    
    const signatureWidth = this.contentWidth / 3;
    
    signatures.forEach((sig, index) => {
      const x = this.margin + index * signatureWidth;
      
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.setFontSize(9);
      this.pdf.setTextColor(0, 0, 0);
      this.pdf.text(sig.role, x, this.currentY);
      
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.setFontSize(8);
      this.pdf.setTextColor(64, 64, 64);
      this.pdf.text('Name:', x, this.currentY + 15);
      this.pdf.text(sig.name, x, this.currentY + 22);
      
      this.pdf.text('Date:', x, this.currentY + 35);
      this.pdf.text(sig.date, x, this.currentY + 42);
      
      // Signature line
      this.pdf.setDrawColor(0, 0, 0);
      this.pdf.setLineWidth(0.5);
      this.pdf.line(x, this.currentY + 25, x + signatureWidth - 10, this.currentY + 25);
      this.pdf.line(x, this.currentY + 45, x + signatureWidth - 10, this.currentY + 45);
    });
    
    this.currentY += 40;
  }

  // Professional footer - more compact
  private createFooter(): void {
    const footerY = this.pageHeight - 15;
    
    // Footer line
    this.pdf.setDrawColor(0, 0, 0);
    this.pdf.setLineWidth(0.5);
    this.pdf.line(this.margin, footerY - 3, this.pageWidth - this.margin, footerY - 3);
    
    // Left side
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(7);
    this.pdf.setTextColor(64, 64, 64);
    this.pdf.text('ERP Merchandiser System v2.0', this.margin, footerY);
    
    // Center
    const docInfo = `Job: ${this.options.jobCardId} | ${this.options.product.product_item_code}`;
    const docInfoWidth = this.pdf.getTextWidth(docInfo);
    this.pdf.text(docInfo, (this.pageWidth - docInfoWidth) / 2, footerY);
    
    // Right side
    const pageInfo = `Page ${this.pageNumber} | ${new Date().toLocaleDateString()}`;
    const pageInfoWidth = this.pdf.getTextWidth(pageInfo);
    this.pdf.text(pageInfo, this.pageWidth - this.margin - pageInfoWidth, footerY);
    this.pdf.text('CONFIDENTIAL', this.pageWidth - this.margin - 40, footerY + 3);
  }

  // Main generation method
  public async generatePDF(): Promise<void> {
    try {
      // Page 1: Main job card
      this.createHeader();
      this.createJobDetailsSection();
      this.createLinksAndDesignerSection();
      this.createProductSpecifications();
      this.createProcessWorkflow();
      
      // Check if we need a second page
      if (this.currentY > this.pageHeight - 100) {
        this.addNewPage();
      }
      
      this.createQualityControlSection();
      await this.createReferenceImagesSection();
      this.createRemarksSection();
      this.createTimelineSection();
      this.createSignatureSection();
      
      // Add footer to all pages
      this.addFooterToAllPages();
      
      // Generate filename and save
      const filename = this.generateFileName();
      this.pdf.save(filename);
      
    } catch (error) {
      console.error('PDF generation error:', error);
      throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private addFooterToAllPages(): void {
    const totalPages = this.pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      this.pdf.setPage(i);
      this.createFooter();
    }
  }

  private generateFileName(): string {
    const timestamp = new Date().toISOString().slice(0, 10);
    const productCode = (this.options.product.product_item_code || 'Product').replace(/[^a-zA-Z0-9]/g, '_');
    const customerName = this.options.jobCardData.customerName?.replace(/[^a-zA-Z0-9]/g, '_') || 'Customer';
    
    return `JobCard_${this.options.jobCardId}_${productCode}_${customerName}_${timestamp}.pdf`;
  }


}

// Enhanced preview generator with better error handling
export class JobCardPreviewGenerator {
  private static async captureElement(elementId: string): Promise<HTMLCanvasElement> {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with ID '${elementId}' not found for PDF generation`);
    }

    try {
      const canvas = await html2canvas(element, {
        scale: 3, // Higher quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        imageTimeout: 15000,
        onclone: (clonedDoc) => {
          // Ensure all fonts are loaded in the cloned document
          const clonedElement = clonedDoc.getElementById(elementId);
          if (clonedElement) {
            clonedElement.style.fontFamily = 'Arial, sans-serif';
          }
        }
      });
      
      return canvas;
    } catch (error) {
      console.error('Canvas capture failed:', error);
      throw new Error(`Failed to capture element for PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public static async generatePreview(jobCardData: any, product: any): Promise<string> {
    try {
      // Implementation for preview generation
      const canvas = await this.captureElement('job-card-preview');
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Preview generation failed:', error);
      throw new Error(`Failed to generate preview: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Export function for easy usage
export async function generateJobCardPDF(options: PDFGenerationOptions): Promise<void> {
  const generator = new AdvancedJobCardPDFGenerator(options);
  await generator.generatePDF();
}
