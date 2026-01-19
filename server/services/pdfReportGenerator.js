import PDFDocument from 'pdfkit';

/**
 * Modern PDF Report Generator for Job Reports
 * Creates professional, well-formatted PDF reports with modern design
 */
class PDFReportGenerator {
  /**
   * Generate a PDF report for jobs
   * @param {Array} jobs - Array of job objects
   * @param {Object} filters - Applied filters
   * @param {Object} statistics - Report statistics
   * @returns {Promise<Buffer>} - PDF buffer
   */
  async generateJobReport(jobs, filters, statistics) {
    return new Promise((resolve, reject) => {
      try {
        // Create PDF document in portrait for maximum rows
        const doc = new PDFDocument({
          size: 'A4',
          margin: 30,
          layout: 'portrait'
        });

        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve(pdfBuffer);
        });
        doc.on('error', reject);

        // Colors
        const colors = {
          primary: '#1e40af',      // Blue
          secondary: '#64748b',    // Gray
          success: '#059669',      // Green
          warning: '#d97706',      // Orange
          danger: '#dc2626',       // Red
          lightGray: '#f1f5f9',    // Light gray
          darkGray: '#334155',     // Dark gray
          border: '#e2e8f0'       // Border gray
        };

        let yPosition = 20;
        const pageWidth = doc.page.width;
        const pageHeight = doc.page.height;
        const margin = 30;
        const contentWidth = pageWidth - (margin * 2);
        const tableStartY = 0;

        let currentPageNum = 1;
        const footerHeight = 20;
        const footerY = pageHeight - footerHeight;

        // Helper function to add footer to current page (called at end of page content)
        const addFooterToCurrentPage = (pageNum) => {
          // Save current y position to restore later
          const savedY = doc.y;
          
          // Draw footer rectangle at fixed position (doesn't affect doc.y)
          doc.rect(0, footerY, pageWidth, footerHeight)
            .fillColor(colors.lightGray)
            .fill();

          // Use direct text positioning without moving doc.y
          // Set font properties
          doc.fontSize(7)
            .fillColor(colors.secondary)
            .font('Helvetica');
          
          // Draw text at absolute positions (x, y) - this doesn't move doc.y
          doc.text(`Page ${pageNum}`, margin, footerY + 6, {
            width: 100,
            align: 'left',
            continued: false
          });

          doc.text(new Date().toLocaleDateString(), pageWidth - margin - 100, footerY + 6, {
            width: 100,
            align: 'right',
            continued: false
          });
          
          // Restore y position to prevent any page break issues
          doc.y = savedY;
        };

        // Helper function to add new page if needed
        const checkPageBreak = (requiredHeight) => {
          // Reserve space for footer (20pt) and bottom margin (10pt)
          const availableHeight = pageHeight - margin - footerHeight - 10;
          if (yPosition + requiredHeight > availableHeight) {
            // Don't add footer here - it will be added at the end
            // Just add a new page
            doc.addPage();
            currentPageNum++;
            yPosition = margin;
            return true;
          }
          return false;
        };

        // Helper function to draw a box
        const drawBox = (x, y, width, height, fillColor = null, strokeColor = colors.border) => {
          if (fillColor) {
            doc.rect(x, y, width, height).fillColor(fillColor).fill();
          }
          doc.rect(x, y, width, height).strokeColor(strokeColor).lineWidth(0.5).stroke();
        };

        // Helper function to add text with styling
        const addText = (text, x, y, options = {}) => {
          const {
            fontSize = 10,
            font = 'Helvetica',
            color = colors.darkGray,
            align = 'left',
            bold = false
          } = options;

          // Save current y position
          const savedY = doc.y;

          doc.font(font)
            .fontSize(fontSize)
            .fillColor(color);

          if (bold) {
            doc.font('Helvetica-Bold');
          }

          // Use absolute positioning - specify x and y explicitly
          doc.text(text, x, y, {
            align: align,
            width: options.width || contentWidth,
            continued: false
          });

          if (bold) {
            doc.font('Helvetica');
          }

          // Restore y position to prevent unwanted page breaks
          doc.y = savedY;
        };

        // ============================================
        // COMPACT HEADER SECTION
        // ============================================
        doc.rect(0, 0, pageWidth, 40)
          .fillColor(colors.primary)
          .fill();

        addText('ERP MERCHANDISER SYSTEM - Job Report', margin, 12, {
          fontSize: 12,
          color: '#ffffff',
          bold: true
        });

        const reportDate = new Date().toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });

        addText(`Generated: ${reportDate} | Total: ${statistics?.total || jobs.length}`, pageWidth - margin - 250, 12, {
          fontSize: 9,
          color: '#e0e7ff',
          align: 'right',
          width: 250
        });

        yPosition = 50;

        // ============================================
        // COMPACT FILTER SUMMARY SECTION
        // ============================================
        checkPageBreak(35);
        
        const filterBoxHeight = 25;
        const filterBoxWidth = (contentWidth - 15) / 3;
        let filterX = margin;
        let filterY = yPosition;

        // PO Status Filter
        drawBox(filterX, filterY, filterBoxWidth, filterBoxHeight, colors.lightGray);
        const poStatusText = filters.po_status === 'all' ? 'All' : 
                           filters.po_status === 'with_po' ? 'With PO' : 'Without PO';
        addText(`PO: ${poStatusText}`, filterX + 5, filterY + 7, {
          fontSize: 8,
          color: colors.darkGray,
          bold: true
        });

        // Status Filter
        filterX += filterBoxWidth + 5;
        drawBox(filterX, filterY, filterBoxWidth, filterBoxHeight, colors.lightGray);
        const statusText = filters.status || 'All Status';
        addText(`Status: ${statusText}`, filterX + 5, filterY + 7, {
          fontSize: 8,
          color: colors.darkGray,
          bold: true
        });

        // Department Filter
        filterX += filterBoxWidth + 5;
        drawBox(filterX, filterY, filterBoxWidth, filterBoxHeight, colors.lightGray);
        const deptText = filters.department || 'All Depts';
        addText(`Dept: ${deptText}`, filterX + 5, filterY + 7, {
          fontSize: 8,
          color: colors.darkGray,
          bold: true
        });

        yPosition += filterBoxHeight + 10;

        // Date Range and Brand (if applicable) - compact inline
        if (filters.date_from || filters.date_to || (filters.brand && filters.brand !== 'all')) {
          checkPageBreak(25);
          filterX = margin;
          drawBox(filterX, yPosition, contentWidth, 20, colors.lightGray);
          let filterText = '';
          if (filters.date_from || filters.date_to) {
            filterText += `Date: ${filters.date_from || 'Any'} to ${filters.date_to || 'Any'}`;
          }
          if (filters.brand && filters.brand !== 'all') {
            if (filterText) filterText += ' | ';
            filterText += `Brand: ${filters.brand}`;
          }
          addText(filterText, filterX + 5, yPosition + 6, {
            fontSize: 8,
            color: colors.darkGray
          });
          yPosition += 25;
        }

        // ============================================
        // COMPACT STATISTICS SECTION
        // ============================================
        if (statistics) {
          checkPageBreak(30);

          const statBoxWidth = (contentWidth - 15) / 4;
          const statBoxHeight = 28;
          let statX = margin;
          let statY = yPosition;

          // Total Jobs
          drawBox(statX, statY, statBoxWidth, statBoxHeight, colors.primary);
          addText('Total', statX + 5, statY + 3, {
            fontSize: 7,
            color: '#ffffff',
            bold: true
          });
          addText(statistics.total.toString(), statX + 5, statY + 13, {
            fontSize: 14,
            color: '#ffffff',
            bold: true
          });

          // With PO
          statX += statBoxWidth + 5;
          drawBox(statX, statY, statBoxWidth, statBoxHeight, colors.success);
          addText('With PO', statX + 5, statY + 3, {
            fontSize: 7,
            color: '#ffffff',
            bold: true
          });
          addText(statistics.withPO.toString(), statX + 5, statY + 13, {
            fontSize: 14,
            color: '#ffffff',
            bold: true
          });

          // Without PO
          statX += statBoxWidth + 5;
          drawBox(statX, statY, statBoxWidth, statBoxHeight, colors.warning);
          addText('No PO', statX + 5, statY + 3, {
            fontSize: 7,
            color: '#ffffff',
            bold: true
          });
          addText(statistics.withoutPO.toString(), statX + 5, statY + 13, {
            fontSize: 14,
            color: '#ffffff',
            bold: true
          });

          // Pending
          statX += statBoxWidth + 5;
          const pendingCount = statistics.byStatus?.PENDING || 0;
          drawBox(statX, statY, statBoxWidth, statBoxHeight, colors.secondary);
          addText('Pending', statX + 5, statY + 3, {
            fontSize: 7,
            color: '#ffffff',
            bold: true
          });
          addText(pendingCount.toString(), statX + 5, statY + 13, {
            fontSize: 14,
            color: '#ffffff',
            bold: true
          });

          yPosition += statBoxHeight + 10;
        }

        // ============================================
        // JOB DATA TABLE
        // ============================================
        checkPageBreak(25);

        // Table header
        const tableTop = yPosition;
        const rowHeight = 14;
        // Optimized column widths for portrait A4 (595pt width, ~535pt usable with margins)
        const colWidths = {
          jobNumber: 55,
          productCode: 45,
          brand: 40,
          customer: 50,
          poNumber: 45,
          status: 45,
          department: 40,
          createdBy: 45,
          createdDate: 50,
          dueDate: 50,
          quantity: 40,
          priority: 40
        };

        const totalTableWidth = Object.values(colWidths).reduce((a, b) => a + b, 0);
        const tableX = margin;

        // Draw header row
        doc.rect(tableX, tableTop, totalTableWidth, rowHeight)
          .fillColor(colors.primary)
          .fill();

        let colX = tableX;
        const headerY = tableTop + 5;

        addText('Job #', colX + 2, headerY, { fontSize: 7, color: '#ffffff', bold: true });
        colX += colWidths.jobNumber;

        addText('Product', colX + 2, headerY, { fontSize: 7, color: '#ffffff', bold: true });
        colX += colWidths.productCode;

        addText('Brand', colX + 2, headerY, { fontSize: 7, color: '#ffffff', bold: true });
        colX += colWidths.brand;

        addText('Customer', colX + 2, headerY, { fontSize: 7, color: '#ffffff', bold: true });
        colX += colWidths.customer;

        addText('PO #', colX + 2, headerY, { fontSize: 7, color: '#ffffff', bold: true });
        colX += colWidths.poNumber;

        addText('Status', colX + 2, headerY, { fontSize: 7, color: '#ffffff', bold: true });
        colX += colWidths.status;

        addText('Dept', colX + 2, headerY, { fontSize: 7, color: '#ffffff', bold: true });
        colX += colWidths.department;

        addText('Created By', colX + 2, headerY, { fontSize: 7, color: '#ffffff', bold: true });
        colX += colWidths.createdBy;

        addText('Created', colX + 2, headerY, { fontSize: 7, color: '#ffffff', bold: true });
        colX += colWidths.createdDate;

        addText('Due', colX + 2, headerY, { fontSize: 7, color: '#ffffff', bold: true });
        colX += colWidths.dueDate;

        addText('Qty', colX + 2, headerY, { fontSize: 7, color: '#ffffff', bold: true, align: 'right', width: colWidths.quantity - 4 });
        colX += colWidths.quantity;

        addText('Priority', colX + 2, headerY, { fontSize: 7, color: '#ffffff', bold: true });
        colX += colWidths.priority;

        yPosition = tableTop + rowHeight;

        // Draw table rows
        jobs.forEach((job, index) => {
          checkPageBreak(rowHeight + 5);

          // If new page, redraw header
          if (yPosition === margin) {
            doc.rect(tableX, yPosition, totalTableWidth, rowHeight)
              .fillColor(colors.primary)
              .fill();

            colX = tableX;
            addText('Job #', colX + 2, yPosition + 3, { fontSize: 7, color: '#ffffff', bold: true });
            colX += colWidths.jobNumber;
            addText('Product', colX + 2, yPosition + 3, { fontSize: 7, color: '#ffffff', bold: true });
            colX += colWidths.productCode;
            addText('Brand', colX + 2, yPosition + 3, { fontSize: 7, color: '#ffffff', bold: true });
            colX += colWidths.brand;
            addText('Customer', colX + 2, yPosition + 3, { fontSize: 7, color: '#ffffff', bold: true });
            colX += colWidths.customer;
            addText('PO #', colX + 2, yPosition + 3, { fontSize: 7, color: '#ffffff', bold: true });
            colX += colWidths.poNumber;
            addText('Status', colX + 2, yPosition + 3, { fontSize: 7, color: '#ffffff', bold: true });
            colX += colWidths.status;
            addText('Dept', colX + 2, yPosition + 3, { fontSize: 7, color: '#ffffff', bold: true });
            colX += colWidths.department;
            addText('Created By', colX + 2, yPosition + 3, { fontSize: 7, color: '#ffffff', bold: true });
            colX += colWidths.createdBy;
            addText('Created', colX + 2, yPosition + 3, { fontSize: 7, color: '#ffffff', bold: true });
            colX += colWidths.createdDate;
            addText('Due', colX + 2, yPosition + 3, { fontSize: 7, color: '#ffffff', bold: true });
            colX += colWidths.dueDate;
            addText('Qty', colX + 2, yPosition + 3, { fontSize: 7, color: '#ffffff', bold: true, align: 'right', width: colWidths.quantity - 4 });
            colX += colWidths.quantity;
            addText('Priority', colX + 2, yPosition + 3, { fontSize: 7, color: '#ffffff', bold: true });
            colX += colWidths.priority;

            yPosition += rowHeight;
          }

          // Alternate row colors
          const rowColor = index % 2 === 0 ? '#ffffff' : colors.lightGray;
          doc.rect(tableX, yPosition, totalTableWidth, rowHeight)
            .fillColor(rowColor)
            .fill();

          // Highlight rows without PO
          const isWithoutPO = job.without_po === true || !job.po_number || job.po_number.trim() === '';
          if (isWithoutPO) {
            doc.rect(tableX, yPosition, totalTableWidth, rowHeight)
              .fillColor('#fef3c7')
              .fillOpacity(0.3)
              .fill();
            doc.fillOpacity(1);
          }

          // Draw border
          doc.rect(tableX, yPosition, totalTableWidth, rowHeight)
            .strokeColor(colors.border)
            .lineWidth(0.5)
            .stroke();

          colX = tableX;
          const cellY = yPosition + 5;

          // Job Number
          addText((job.jobNumber || 'N/A').substring(0, 12), colX + 2, cellY, { fontSize: 6 });
          colX += colWidths.jobNumber;

          // Product Code
          addText((job.product_code || 'N/A').substring(0, 8), colX + 2, cellY, { fontSize: 6 });
          colX += colWidths.productCode;

          // Brand
          addText((job.brand || 'N/A').substring(0, 7), colX + 2, cellY, { fontSize: 6 });
          colX += colWidths.brand;

          // Customer
          const customerName = job.customer_name || job.company_name || 'N/A';
          addText(customerName.substring(0, 8), colX + 2, cellY, { fontSize: 6 });
          colX += colWidths.customer;

          // PO Number
          if (isWithoutPO) {
            addText('No PO', colX + 2, cellY, { fontSize: 6, color: colors.warning, bold: true });
          } else {
            addText((job.po_number || 'N/A').substring(0, 7), colX + 2, cellY, { fontSize: 6 });
          }
          colX += colWidths.poNumber;

          // Status
          addText((job.status || 'N/A').substring(0, 8), colX + 2, cellY, { fontSize: 6 });
          colX += colWidths.status;

          // Department
          addText((job.current_department || 'N/A').substring(0, 7), colX + 2, cellY, { fontSize: 6 });
          colX += colWidths.department;

          // Created By
          addText((job.created_by_name || 'System').substring(0, 8), colX + 2, cellY, { fontSize: 6 });
          colX += colWidths.createdBy;

          // Created Date
          const createdDate = job.createdAt ? new Date(job.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A';
          addText(createdDate, colX + 2, cellY, { fontSize: 6 });
          colX += colWidths.createdDate;

          // Due Date
          const dueDate = job.dueDate ? new Date(job.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A';
          addText(dueDate, colX + 2, cellY, { fontSize: 6 });
          colX += colWidths.dueDate;

          // Quantity
          addText((job.quantity || 0).toLocaleString(), colX + 2, cellY, { fontSize: 6, align: 'right', width: colWidths.quantity - 4 });
          colX += colWidths.quantity;

          // Priority
          addText((job.urgency || 'NORMAL').substring(0, 5), colX + 2, cellY, { fontSize: 6 });
          colX += colWidths.priority;

          yPosition += rowHeight;
        });

        // ============================================
        // FOOTER - Add footer to all pages
        // ============================================
        // Store final y position
        const finalY = doc.y;
        
        // Get total pages after all content is drawn
        // pdfkit buffers pages, so we can access them
        const pageRange = doc.bufferedPageRange();
        const totalPages = pageRange ? pageRange.count : currentPageNum;
        
        // Add footer to each page
        for (let i = 0; i < totalPages; i++) {
          try {
            doc.switchToPage(i);
            
            // Save current y position on this page
            const pageY = doc.y;
            
            // Draw footer at bottom of each page
            doc.rect(0, footerY, pageWidth, footerHeight)
              .fillColor(colors.lightGray)
              .fill();
            
            // Set font properties
            doc.fontSize(7)
              .fillColor(colors.secondary)
              .font('Helvetica');
            
            // Draw text at absolute positions
            // Page number
            doc.text(`Page ${i + 1}`, margin, footerY + 6, { 
              width: 100, 
              align: 'left',
              continued: false
            });
            
            // Date
            doc.text(new Date().toLocaleDateString(), pageWidth - margin - 100, footerY + 6, { 
              width: 100, 
              align: 'right',
              continued: false
            });
            
            // Restore y position to prevent page breaks
            doc.y = pageY;
          } catch (error) {
            // If page doesn't exist, skip it
            console.warn(`Could not add footer to page ${i + 1}:`, error.message);
          }
        }

        // Finalize PDF
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}

export default new PDFReportGenerator();

