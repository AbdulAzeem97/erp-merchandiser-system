import dbAdapter from '../database/adapter.js';
import { v4 as uuidv4 } from 'uuid';
import materialSizeService from '../services/materialSizeService.js';
import sheetOptimizationService from '../services/sheetOptimizationService.js';
import costCalculationService from '../services/costCalculationService.js';
import UnifiedWorkflowService from '../services/unifiedWorkflowService.js';

class SmartDashboardController {
  /**
   * Get all jobs after CTP completion
   * Filter: plate_generated = true
   */
  async getPostCTPJobs(req, res) {
    try {
      // Check if job_production_planning table exists
      const tableCheck = await dbAdapter.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'job_production_planning'
        )
      `);
      const hasPlanningTable = tableCheck.rows[0].exists;

      // Check if job_cards has current_department and workflow_status columns
      const columnCheck = await dbAdapter.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'job_cards' 
        AND column_name IN ('current_department', 'workflow_status', 'current_step', 'status_message')
      `);
      const hasDepartmentColumn = columnCheck.rows.some(r => r.column_name === 'current_department');
      const hasWorkflowStatusColumn = columnCheck.rows.some(r => r.column_name === 'workflow_status');
      const hasCurrentStepColumn = columnCheck.rows.some(r => r.column_name === 'current_step');
      const hasStatusMessageColumn = columnCheck.rows.some(r => r.column_name === 'status_message');

      const query = `
        SELECT 
          pj.id as prepress_job_id,
          pj.job_card_id,
          jc."jobNumber" as job_card_number,
          COALESCE(p.name, 'N/A') as product_name,
          COALESCE(p.sku, 'N/A') as product_item_code,
          NULL as product_type,
          jc.customer_name,
          COALESCE(c.name, 'N/A') as company_name,
          jc.quantity,
          pj.priority,
          jc."dueDate" as delivery_date,
          pj.status as prepress_status,
          COALESCE(pj.plate_generated, false) as plate_generated,
          pj.plate_generated_at,
          pj.created_at,
          COALESCE(p.brand, 'N/A') as material_name,
          NULL as product_material
          ${hasDepartmentColumn ? ', jc.current_department' : ', NULL as current_department'}
          ${hasWorkflowStatusColumn ? ', jc.workflow_status' : ', NULL as workflow_status'}
          ${hasCurrentStepColumn ? ', jc.current_step' : ', NULL as current_step'}
          ${hasStatusMessageColumn ? ', jc.status_message' : ', NULL as status_message'}
          ${hasPlanningTable ? `,
          jpp.planning_status,
          jpp.final_total_sheets,
          jpp.material_cost` : `,
          NULL as planning_status,
          NULL as final_total_sheets,
          NULL as material_cost`}
        FROM prepress_jobs pj
        JOIN job_cards jc ON pj.job_card_id = jc.id
        LEFT JOIN products p ON jc."productId" = p.id
        LEFT JOIN companies c ON jc."companyId" = c.id
        ${hasPlanningTable ? 'LEFT JOIN job_production_planning jpp ON jc.id = jpp.job_card_id' : ''}
        WHERE COALESCE(pj.plate_generated, false) = true
          ${hasDepartmentColumn ? "AND (jc.current_department = 'Job Planning' OR jc.current_department IS NULL)" : ''}
        ORDER BY 
          ${hasPlanningTable ? `
          CASE 
            WHEN jpp.planning_status = 'APPLIED' THEN 3
            WHEN jpp.planning_status = 'LOCKED' THEN 2
            WHEN jpp.planning_status = 'PLANNED' THEN 1
            ELSE 0
          END,
          ` : ''}
          pj.priority DESC NULLS LAST,
          pj.plate_generated_at DESC NULLS LAST
      `;

      const result = await dbAdapter.query(query);
      
      res.json({
        success: true,
        jobs: result.rows.map(row => ({
          prepress_job_id: row.prepress_job_id,
          job_card_id: row.job_card_id,
          job_card_number: row.job_card_number,
          product_name: row.product_name,
          product_item_code: row.product_item_code,
          product_type: row.product_type,
          customer_name: row.customer_name || row.company_name,
          company_name: row.company_name,
          quantity: row.quantity,
          priority: row.priority,
          delivery_date: row.delivery_date,
          prepress_status: row.prepress_status,
          plate_generated: row.plate_generated,
          plate_generated_at: row.plate_generated_at,
          created_at: row.created_at,
          material_name: row.material_name || row.product_material,
          planning_status: row.planning_status || 'PENDING',
          final_total_sheets: row.final_total_sheets || null,
          material_cost: row.material_cost || null,
          current_department: row.current_department || null,
          workflow_status: row.workflow_status || 'pending',
          current_step: row.current_step || null,
          status_message: row.status_message || null
        })),
        count: result.rows.length
      });
    } catch (error) {
      console.error('Error fetching post-CTP jobs:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        detail: error.detail,
        hint: error.hint
      });
      res.status(500).json({
        success: false,
        error: 'Failed to fetch jobs',
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? {
          code: error.code,
          detail: error.detail,
          hint: error.hint
        } : undefined
      });
    }
  }

  /**
   * Get detailed job data with material info
   */
  async getJobDetails(req, res) {
    try {
      console.log('🔍 getJobDetails called with jobId:', req.params.jobId);
      const { jobId } = req.params;
      const jobIdNum = parseInt(jobId, 10);
      
      if (isNaN(jobIdNum)) {
        console.error('❌ Invalid job ID:', jobId);
        return res.status(400).json({
          success: false,
          error: 'Invalid job ID'
        });
      }

      console.log('✅ Job ID parsed:', jobIdNum);

      // Check if planning table exists
      console.log('🔍 Checking if planning table exists...');
      const tableCheck = await dbAdapter.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'job_production_planning'
        )
      `);
      const hasPlanningTable = tableCheck.rows[0].exists;
      console.log('✅ Planning table exists:', hasPlanningTable);

      // Get job card ID from prepress job ID
      // Build query parts separately to avoid template literal issues
      const baseColumns = `
        pj.id as prepress_job_id,
        pj.job_card_id,
        jc."jobNumber" as job_card_number,
        jc.quantity,
        pj.priority,
        jc."dueDate" as delivery_date,
        p.id as product_id,
        p.name as product_name,
        p.sku as product_item_code,
        NULL as product_type,
        COALESCE(p.brand, 'N/A') as material_name,
        NULL as product_material,
        c.name as company_name,
        jc.customer_name,
        pj.blank_width_mm,
        pj.blank_height_mm,
        pj.blank_width_inches,
        pj.blank_height_inches,
        pj.blank_size_unit`;
      
      const planningColumns = hasPlanningTable ? `,
        jpp.planning_status,
        jpp.final_total_sheets,
        jpp.material_cost,
        jpp.selected_sheet_size_id,
        jpp.cutting_layout_type,
        jpp.grid_pattern,
        jpp.blanks_per_sheet,
        jpp.efficiency_percentage,
        jpp.scrap_percentage,
        jpp.base_required_sheets,
        jpp.additional_sheets,
        jpp.wastage_justification,
        jpp.planned_at,
        jpp.planned_by` : '';
      
      const planningJoin = hasPlanningTable ? 'LEFT JOIN job_production_planning jpp ON jc.id = jpp.job_card_id' : '';
      
      // Add ratio report columns
      const ratioReportColumns = `,
        rr.total_sheets as ratio_total_sheets,
        rr.qty_produced as ratio_qty_produced,
        rr.total_ups as ratio_total_ups,
        rr.efficiency_percentage as ratio_efficiency_percentage,
        rr.created_at as ratio_report_created_at`;
      
      const jobQuery = `
        SELECT 
          ${baseColumns}${planningColumns}${ratioReportColumns}
        FROM prepress_jobs pj
        INNER JOIN job_cards jc ON pj.job_card_id = jc.id
        LEFT JOIN products p ON jc."productId" = p.id
        LEFT JOIN companies c ON jc."companyId" = c.id
        ${planningJoin}
        LEFT JOIN ratio_reports rr ON jc.id = rr.job_card_id
        WHERE pj.id = $1 AND COALESCE(pj.plate_generated, false) = true
      `;

      console.log('🔍 Executing job query...');
      console.log('📝 Query preview:', jobQuery.replace(/\s+/g, ' ').substring(0, 200) + '...');
      console.log('📝 Parameters:', [jobIdNum]);
      
      let jobResult;
      try {
        jobResult = await dbAdapter.query(jobQuery, [jobIdNum]);
        console.log('✅ Job query successful, rows:', jobResult.rows.length);
      } catch (queryError) {
        console.error('❌ SQL Query Error:');
        console.error('  Message:', queryError.message);
        console.error('  Code:', queryError.code);
        console.error('  Detail:', queryError.detail);
        console.error('  Hint:', queryError.hint);
        console.error('  Position:', queryError.position);
        console.error('  Full Query:', jobQuery);
        throw queryError;
      }

      if (jobResult.rows.length === 0) {
        console.error('❌ Job not found or CTP not completed');
        return res.status(404).json({
          success: false,
          error: 'Job not found or CTP not completed'
        });
      }

      const job = jobResult.rows[0];
      console.log('✅ Job found, job_card_id:', job.job_card_id);
      const jobCardId = job.job_card_id;

      // Get material ID - try multiple lookup strategies
      let materialId = null;
      try {
        if (job.material_name && job.material_name !== 'N/A') {
          const cleanMaterialName = job.material_name.trim();
          console.log('🔍 Looking up material ID for:', cleanMaterialName);
          console.log('   Raw value:', JSON.stringify(job.material_name));
          console.log('   Cleaned length:', cleanMaterialName.length);
          
          // Strategy 1: Try direct lookup in materials table (case-insensitive)
          try {
            const directMaterialQuery = `
              SELECT id FROM materials 
              WHERE LOWER(TRIM(name)) = LOWER(TRIM($1))
              LIMIT 1
            `;
            const directResult = await dbAdapter.query(directMaterialQuery, [cleanMaterialName]);
            if (directResult.rows.length > 0) {
              materialId = directResult.rows[0].id;
              console.log('✅ Found material ID in materials table:', materialId);
            }
          } catch (directError) {
            console.log('⚠️ Direct materials table lookup failed:', directError.message);
          }
          
          // Strategy 2: Try inventory_materials table if material not found and table exists
          if (!materialId) {
            try {
              const tableCheck = await dbAdapter.query(`
                SELECT EXISTS (
                  SELECT FROM information_schema.tables 
                  WHERE table_schema = 'public' 
                  AND table_name = 'inventory_materials'
                )
              `);
              
              if (tableCheck.rows[0].exists) {
                const inventoryQuery = `
                  SELECT im.id
                  FROM inventory_materials im
                  JOIN materials m ON im.material_id = m.id
                  WHERE LOWER(TRIM(m.name)) = LOWER(TRIM($1))
                  LIMIT 1
                `;
                const inventoryResult = await dbAdapter.query(inventoryQuery, [cleanMaterialName]);
                if (inventoryResult.rows.length > 0) {
                  materialId = inventoryResult.rows[0].id;
                  console.log('✅ Found material ID in inventory_materials table:', materialId);
                }
              }
            } catch (inventoryError) {
              console.log('⚠️ Inventory materials lookup failed:', inventoryError.message);
            }
          }
          
          // Strategy 3: Try partial match if exact match fails
          if (!materialId) {
            try {
              const partialQuery = `
                SELECT id FROM materials 
                WHERE LOWER(name) LIKE LOWER($1)
                LIMIT 1
              `;
              const partialResult = await dbAdapter.query(partialQuery, [`%${cleanMaterialName}%`]);
              if (partialResult.rows.length > 0) {
                materialId = partialResult.rows[0].id;
                console.log('✅ Found material ID with partial match:', materialId);
              }
            } catch (partialError) {
              console.log('⚠️ Partial match lookup failed:', partialError.message);
            }
          }
          
          // Strategy 4: Auto-create material if it doesn't exist (enabled by default)
          if (!materialId) {
            try {
              console.log('💡 Auto-creating missing material:', job.material_name);
              const createQuery = `
                INSERT INTO materials (name, unit, "isActive", "createdAt", "updatedAt")
                VALUES ($1, 'sheets', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                RETURNING id
              `;
              const createResult = await dbAdapter.query(createQuery, [cleanMaterialName]);
              materialId = createResult.rows[0].id;
              console.log('✅ Auto-created material with ID:', materialId);
            } catch (createError) {
              // If insert fails (e.g., unique constraint or permission issue), try to find it
              if (createError.code === '23505' || createError.message.includes('unique') || createError.message.includes('duplicate')) {
                // Material was created by another request, find it
                console.log('⚠️ Material already exists (race condition), looking up...');
                const retryQuery = `
                  SELECT id FROM materials 
                  WHERE LOWER(TRIM(name)) = LOWER(TRIM($1))
                  LIMIT 1
                `;
                const retryResult = await dbAdapter.query(retryQuery, [cleanMaterialName]);
                if (retryResult.rows.length > 0) {
                  materialId = retryResult.rows[0].id;
                  console.log('✅ Found material after retry:', materialId);
                }
              } else {
                // Other error (permission, etc.)
                console.warn('⚠️ Could not auto-create material:', createError.message);
                console.warn('   Material may need to be created manually in inventory');
              }
            }
          }
          
          if (!materialId) {
            console.warn('⚠️ Material ID not found for:', cleanMaterialName);
            console.warn('💡 Suggestion: Material will be auto-created on next request');
          } else {
            console.log('✅ Material lookup successful:', cleanMaterialName, '→ ID:', materialId);
          }
        }
      } catch (error) {
        console.warn('❌ Error fetching material ID:', error.message);
        console.warn('Error stack:', error.stack);
        // Continue without material_id - optimization will show warning
      }

      // Get planning data
      let planning = null;
      if (jobCardId) {
        console.log('🔍 Fetching planning data for job_card_id:', jobCardId);
        try {
          planning = await sheetOptimizationService.getJobPlanning(jobCardId);
          console.log('✅ Planning data fetched:', planning ? 'found' : 'null');
        } catch (error) {
          console.warn('⚠️ Could not fetch planning:', error.message);
          console.warn('Error stack:', error.stack);
          planning = null;
        }
      } else {
        console.log('⚠️ No job_card_id, skipping planning fetch');
      }

      // Build ratio report object
      const ratioReport = (job.ratio_total_sheets !== null && job.ratio_total_sheets !== undefined) ? {
        total_sheets: job.ratio_total_sheets ? parseInt(job.ratio_total_sheets) : null,
        qty_produced: job.ratio_qty_produced ? parseInt(job.ratio_qty_produced) : null,
        total_ups: job.ratio_total_ups ? parseInt(job.ratio_total_ups) : null,
        efficiency_percentage: job.ratio_efficiency_percentage ? parseFloat(job.ratio_efficiency_percentage) : null,
        created_at: job.ratio_report_created_at
      } : null;

      // Fetch multiple machines from job_ctp_machines
      let machines = [];
      try {
        const machinesResult = await dbAdapter.query(`
          SELECT 
            jcm.*,
            cm.machine_code,
            cm.machine_name,
            cm.machine_type,
            cm.manufacturer,
            cm.model,
            cm.location,
            cm.max_plate_size
          FROM job_ctp_machines jcm
          JOIN ctp_machines cm ON jcm.ctp_machine_id = cm.id
          WHERE jcm.prepress_job_id = $1
          ORDER BY jcm.created_at
        `, [jobIdNum]);
        
        machines = machinesResult.rows.map(m => ({
          id: m.ctp_machine_id,
          machine_code: m.machine_code,
          machine_name: m.machine_name,
          machine_type: m.machine_type,
          manufacturer: m.manufacturer,
          model: m.model,
          location: m.location,
          max_plate_size: m.max_plate_size,
          plate_count: m.plate_count
        }));
      } catch (error) {
        console.error('Error fetching machines for job planning:', error);
      }

      res.json({
        success: true,
        job: {
          prepress_job_id: job.prepress_job_id || jobIdNum,
          job_card_id: job.job_card_id,
          job_card_number: job.job_card_number,
          quantity: job.quantity,
          priority: job.priority,
          delivery_date: job.delivery_date,
          product: {
            id: job.product_id,
            name: job.product_name,
            item_code: job.product_item_code,
            type: job.product_type,
            material_name: job.material_name || job.product_material
          },
          company: {
            name: job.company_name,
            customer_name: job.customer_name
          },
          material_id: materialId,
          planning: planning,
          ratioReport: ratioReport,
          // Blank size information (auto-fetch for job planning)
          blank_size: {
            width_mm: job.blank_width_mm || null,
            height_mm: job.blank_height_mm || null,
            width_inches: job.blank_width_inches || null,
            height_inches: job.blank_height_inches || null,
            unit: job.blank_size_unit || 'mm'
          },
          // Multiple machines information
          machines: machines
        }
      });
    } catch (error) {
      console.error('❌ Error fetching job details:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      if (error.code) {
        console.error('PostgreSQL error code:', error.code);
        console.error('PostgreSQL error detail:', error.detail);
        console.error('PostgreSQL error hint:', error.hint);
      }
      res.status(500).json({
        success: false,
        error: 'Failed to fetch job details',
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? {
          code: error.code,
          detail: error.detail,
          hint: error.hint,
          stack: error.stack
        } : undefined
      });
    }
  }

  /**
   * Get available sizes for a material
   */
  async getMaterialSizes(req, res) {
    try {
      const { materialId } = req.params;
      const { blankWidth, blankHeight, quantity } = req.query;

      console.log('🔍 getMaterialSizes called for materialId:', materialId);

      // Convert materialId to integer
      const materialIdInt = parseInt(materialId, 10);
      if (isNaN(materialIdInt)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid material ID'
        });
      }

      const sizesData = await materialSizeService.getMaterialSizes(materialIdInt);
      console.log('✅ Sizes fetched:', sizesData.sizes?.length || 0, 'sizes');

      if (blankWidth && blankHeight && quantity) {
        // Calculate optimization for each size
        const optimizations = [];
        for (const size of sizesData.sizes) {
          try {
            const bestSize = await materialSizeService.findBestSize(
              materialId,
              parseFloat(blankWidth),
              parseFloat(blankHeight),
              parseInt(quantity)
            );
            if (bestSize && bestSize.size.id === size.id) {
              optimizations.push(bestSize);
            }
          } catch (optError) {
            console.warn('Error calculating optimization for size:', size.id, optError.message);
          }
        }
        sizesData.optimizations = optimizations;
      }

      res.json({
        success: true,
        ...sizesData
      });
    } catch (error) {
      console.error('❌ Error fetching material sizes:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch material sizes',
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? {
          stack: error.stack
        } : undefined
      });
    }
  }

  /**
   * Add new sheet size for a material
   */
  async addMaterialSize(req, res) {
    try {
      const { materialId } = req.params;
      const { size_name, width_mm, height_mm, unit_cost, is_default } = req.body;

      console.log('➕ addMaterialSize called:', { materialId, size_name, width_mm, height_mm });

      // Convert materialId to integer
      const materialIdInt = parseInt(materialId, 10);
      if (isNaN(materialIdInt)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid material ID'
        });
      }

      if (!size_name || !width_mm || !height_mm) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: size_name, width_mm, height_mm'
        });
      }

      // Check if material exists
      const materialCheck = await dbAdapter.query(
        'SELECT id FROM materials WHERE id = $1',
        [materialIdInt]
      );

      if (materialCheck.rows.length === 0) {
        console.error('❌ Material not found:', materialId);
        return res.status(404).json({
          success: false,
          error: 'Material not found'
        });
      }

      // Check if size with same name already exists
      const existingCheck = await dbAdapter.query(
        `SELECT id FROM material_sizes 
         WHERE inventory_material_id = $1 AND LOWER(TRIM(size_name)) = LOWER(TRIM($2))`,
        [materialIdInt, size_name]
      );

      if (existingCheck.rows.length > 0) {
        console.warn('⚠️ Size already exists:', size_name);
        return res.status(400).json({
          success: false,
          error: 'A size with this name already exists for this material'
        });
      }

      // Check if this should be default (if it's the first size)
      const sizeCount = await dbAdapter.query(
        'SELECT COUNT(*) as count FROM material_sizes WHERE inventory_material_id = $1',
        [materialIdInt]
      );
      const shouldBeDefault = parseInt(sizeCount.rows[0].count) === 0;

      // Ensure sequence is in sync with actual max ID (fix for duplicate key errors)
      await dbAdapter.query(`
        SELECT setval('material_sizes_id_seq', 
          COALESCE((SELECT MAX(id) FROM material_sizes), 0), 
          true)
      `);

      // Insert new size
      const insertQuery = `
        INSERT INTO material_sizes (
          inventory_material_id,
          size_name,
          width_mm,
          height_mm,
          unit_cost,
          is_default,
          is_active,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *
      `;

      const result = await dbAdapter.query(insertQuery, [
        materialIdInt,
        size_name.trim(),
        parseFloat(width_mm),
        parseFloat(height_mm),
        unit_cost ? parseFloat(unit_cost) : null,
        (is_default !== undefined ? is_default : shouldBeDefault) ? 1 : 0
      ]);

      const newSize = result.rows[0];
      console.log('✅ Size added successfully:', newSize.id);

      res.json({
        success: true,
        size: {
          id: newSize.id,
          inventory_material_id: newSize.inventory_material_id,
          size_name: newSize.size_name,
          width_mm: parseFloat(newSize.width_mm),
          height_mm: parseFloat(newSize.height_mm),
          unit_cost: newSize.unit_cost ? parseFloat(newSize.unit_cost) : null,
          is_default: newSize.is_default === 1,
          is_active: newSize.is_active === 1
        }
      });
    } catch (error) {
      console.error('❌ Error adding material size:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({
        success: false,
        error: 'Failed to add material size',
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? {
          stack: error.stack,
          code: error.code,
          detail: error.detail
        } : undefined
      });
    }
  }

  /**
   * Calculate optimal sheet selection
   */
  async optimizeSheetSelection(req, res) {
    try {
      const { jobId } = req.params;
      const { blankWidth, blankHeight, requiredQuantity, materialId, sheetSizeId } = req.body;

      console.log('🔍 optimizeSheetSelection called with:', {
        jobId,
        blankWidth,
        blankHeight,
        requiredQuantity,
        materialId,
        sheetSizeId
      });

      if (!blankWidth || !blankHeight || !requiredQuantity || !materialId) {
        console.error('❌ Missing required fields');
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: blankWidth, blankHeight, requiredQuantity, materialId'
        });
      }

      console.log('📊 Calling sheetOptimizationService.optimizeSheetSelection...');
      const optimization = await sheetOptimizationService.optimizeSheetSelection(
        jobId,
        {
          width: parseFloat(blankWidth),
          height: parseFloat(blankHeight)
        },
        parseInt(requiredQuantity),
        materialId,
        sheetSizeId // Optional: calculate only for specific size
      );

      console.log('✅ Optimization successful, returning results');
      res.json({
        success: true,
        ...optimization
      });
    } catch (error) {
      console.error('❌ Error optimizing sheet selection:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      res.status(500).json({
        success: false,
        error: 'Failed to optimize sheet selection',
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? {
          stack: error.stack,
          name: error.name
        } : undefined
      });
    }
  }

  /**
   * Save or update planning
   */
  async savePlanning(req, res) {
    try {
      const { jobId } = req.params;
      const {
        selectedSheetSizeId,
        cuttingLayoutType,
        gridPattern,
        blanksPerSheet,
        efficiencyPercentage,
        scrapPercentage,
        baseRequiredSheets,
        additionalSheets,
        wastageJustification
      } = req.body;

      // Convert jobId to integer
      const jobIdInt = parseInt(jobId, 10);
      if (isNaN(jobIdInt)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid job ID'
        });
      }

      console.log('💾 savePlanning called:', {
        jobId: jobIdInt,
        selectedSheetSizeId,
        baseRequiredSheets,
        additionalSheets
      });

      // Validate required fields
      if (!selectedSheetSizeId) {
        return res.status(400).json({
          success: false,
          error: 'Selected sheet size ID is required'
        });
      }

      // Convert selectedSheetSizeId to integer if it's a string
      const sheetSizeIdInt = typeof selectedSheetSizeId === 'string' 
        ? parseInt(selectedSheetSizeId, 10) 
        : selectedSheetSizeId;

      if (isNaN(sheetSizeIdInt)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid sheet size ID'
        });
      }

      // Verify that the sheet size exists in the database
      try {
        const sheetSizeCheck = await dbAdapter.query(
          `SELECT id FROM material_sizes WHERE id = $1`,
          [sheetSizeIdInt]
        );
        if (sheetSizeCheck.rows.length === 0) {
          console.error('❌ Sheet size not found:', sheetSizeIdInt);
          return res.status(400).json({
            success: false,
            error: `Sheet size with ID ${sheetSizeIdInt} does not exist`
          });
        }
        console.log('✅ Sheet size verified:', sheetSizeIdInt);
      } catch (checkError) {
        console.warn('⚠️ Could not verify sheet size:', checkError.message);
        // Continue anyway - let the foreign key constraint handle it
      }

      // Get job card ID
      const jobQuery = await dbAdapter.query(
        `SELECT job_card_id FROM prepress_jobs WHERE id = $1`,
        [jobIdInt]
      );

      if (jobQuery.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Job not found'
        });
      }

      let jobCardId = jobQuery.rows[0].job_card_id;
      // Ensure jobCardId is an integer for consistency
      const jobCardIdInt = parseInt(jobCardId, 10);
      if (isNaN(jobCardIdInt)) {
        console.error('❌ Invalid job_card_id from database:', jobCardId);
        return res.status(400).json({
          success: false,
          error: 'Invalid job card ID'
        });
      }
      jobCardId = jobCardIdInt;
      console.log('✅ Job card ID (parsed):', jobCardId, 'Type:', typeof jobCardId);

      // Check if planning exists
      const existingPlanning = await sheetOptimizationService.getJobPlanning(jobCardId);
      console.log('📋 Existing planning:', existingPlanning ? 'found' : 'not found');

      // If planning exists and is APPLIED, prevent modification
      if (existingPlanning && existingPlanning.planning_status === 'APPLIED') {
        return res.status(400).json({
          success: false,
          error: 'Planning has already been applied and cannot be modified'
        });
      }

      // Check if base sheets came from ratio report
      let ratioReportSheets = null;
      let fromRatioReport = false;
      try {
        const ratioReportQuery = await dbAdapter.query(
          `SELECT total_sheets FROM ratio_reports WHERE job_card_id = $1 ORDER BY created_at DESC LIMIT 1`,
          [jobCardId]
        );
        if (ratioReportQuery.rows.length > 0 && ratioReportQuery.rows[0].total_sheets) {
          ratioReportSheets = ratioReportQuery.rows[0].total_sheets;
          // Check if base sheets match ratio report sheets (within 1 sheet tolerance for rounding)
          if (Math.abs(baseRequiredSheets - ratioReportSheets) <= 1) {
            fromRatioReport = true;
          }
        }
      } catch (error) {
        console.warn('Could not check ratio report:', error.message);
      }

      const finalTotalSheets = baseRequiredSheets + (additionalSheets || 0);
      console.log('📊 Planning summary:', {
        baseRequiredSheets,
        additionalSheets: additionalSheets || 0,
        finalTotalSheets,
        sheetSizeIdInt,
        cuttingLayoutType,
        gridPattern
      });
      
      // Calculate cost
      let costData;
      try {
        costData = await costCalculationService.getTotalCost(
          baseRequiredSheets,
          additionalSheets || 0,
          selectedSheetSizeId
        );
        console.log('✅ Cost calculated:', costData);
      } catch (costError) {
        console.error('❌ Error calculating cost:', costError);
        // Use default cost if calculation fails
        costData = {
          totalCost: 0,
          costPerSheet: 0,
          materialCost: 0,
          wastageCost: 0
        };
      }

      // Use UPSERT (INSERT ... ON CONFLICT DO UPDATE) to handle both insert and update atomically
      // This prevents race conditions and duplicate key errors
      // Check if ratio_report_sheets column exists
      let hasRatioReportColumns = false;
      try {
        const columnCheck = await dbAdapter.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'job_production_planning' 
          AND column_name = 'ratio_report_sheets'
        `);
        hasRatioReportColumns = columnCheck.rows.length > 0;
        console.log('📋 Ratio report columns exist:', hasRatioReportColumns);
      } catch (columnCheckError) {
        console.warn('⚠️ Could not check for ratio_report_sheets column:', columnCheckError.message);
        hasRatioReportColumns = false;
      }

      // Validate all required fields
      if (!jobCardId || !sheetSizeIdInt || !cuttingLayoutType || !gridPattern) {
        const missingFields = [];
        if (!jobCardId) missingFields.push('jobCardId');
        if (!sheetSizeIdInt) missingFields.push('sheetSizeIdInt');
        if (!cuttingLayoutType) missingFields.push('cuttingLayoutType');
        if (!gridPattern) missingFields.push('gridPattern');
        return res.status(400).json({
          success: false,
          error: `Missing required fields: ${missingFields.join(', ')}`
        });
      }

      console.log('📝 Preparing to upsert planning with:', {
        jobCardId,
        sheetSizeIdInt,
        cuttingLayoutType,
        gridPattern,
        blanksPerSheet,
        efficiencyPercentage,
        scrapPercentage,
        baseRequiredSheets,
        additionalSheets: additionalSheets || 0,
        finalTotalSheets,
        materialCost: costData.totalCost,
        hasRatioReportColumns,
        ratioReportSheets,
        fromRatioReport
      });

      let upsertResult;
      try {
        if (hasRatioReportColumns) {
          console.log('📝 Using UPSERT with ratio report columns');
          upsertResult = await dbAdapter.query(
            `INSERT INTO job_production_planning (
              job_card_id, selected_sheet_size_id, cutting_layout_type,
              grid_pattern, blanks_per_sheet, efficiency_percentage, scrap_percentage,
              base_required_sheets, additional_sheets, final_total_sheets,
              material_cost, wastage_justification, ratio_report_sheets, from_ratio_report, planning_status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            ON CONFLICT (job_card_id) 
            DO UPDATE SET
              selected_sheet_size_id = EXCLUDED.selected_sheet_size_id,
              cutting_layout_type = EXCLUDED.cutting_layout_type,
              grid_pattern = EXCLUDED.grid_pattern,
              blanks_per_sheet = EXCLUDED.blanks_per_sheet,
              efficiency_percentage = EXCLUDED.efficiency_percentage,
              scrap_percentage = EXCLUDED.scrap_percentage,
              base_required_sheets = EXCLUDED.base_required_sheets,
              additional_sheets = EXCLUDED.additional_sheets,
              final_total_sheets = EXCLUDED.final_total_sheets,
              material_cost = EXCLUDED.material_cost,
              wastage_justification = EXCLUDED.wastage_justification,
              ratio_report_sheets = EXCLUDED.ratio_report_sheets,
              from_ratio_report = EXCLUDED.from_ratio_report,
              planning_status = CASE 
                WHEN job_production_planning.planning_status = 'APPLIED' THEN 'APPLIED'
                ELSE 'PLANNED'
              END,
              updated_at = CURRENT_TIMESTAMP
            RETURNING *`,
            [
              jobCardId,
              sheetSizeIdInt,
              cuttingLayoutType,
              gridPattern,
              blanksPerSheet,
              efficiencyPercentage,
              scrapPercentage,
              baseRequiredSheets,
              additionalSheets || 0,
              finalTotalSheets,
              costData.totalCost,
              wastageJustification || null,
              ratioReportSheets,
              fromRatioReport,
              'PLANNED'
            ]
          );
        } else {
          console.log('📝 Using UPSERT without ratio report columns');
          upsertResult = await dbAdapter.query(
            `INSERT INTO job_production_planning (
              job_card_id, selected_sheet_size_id, cutting_layout_type,
              grid_pattern, blanks_per_sheet, efficiency_percentage, scrap_percentage,
              base_required_sheets, additional_sheets, final_total_sheets,
              material_cost, wastage_justification, planning_status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            ON CONFLICT (job_card_id) 
            DO UPDATE SET
              selected_sheet_size_id = EXCLUDED.selected_sheet_size_id,
              cutting_layout_type = EXCLUDED.cutting_layout_type,
              grid_pattern = EXCLUDED.grid_pattern,
              blanks_per_sheet = EXCLUDED.blanks_per_sheet,
              efficiency_percentage = EXCLUDED.efficiency_percentage,
              scrap_percentage = EXCLUDED.scrap_percentage,
              base_required_sheets = EXCLUDED.base_required_sheets,
              additional_sheets = EXCLUDED.additional_sheets,
              final_total_sheets = EXCLUDED.final_total_sheets,
              material_cost = EXCLUDED.material_cost,
              wastage_justification = EXCLUDED.wastage_justification,
              planning_status = CASE 
                WHEN job_production_planning.planning_status = 'APPLIED' THEN 'APPLIED'
                ELSE 'PLANNED'
              END,
              updated_at = CURRENT_TIMESTAMP
            RETURNING *`,
            [
              jobCardId,
              sheetSizeIdInt,
              cuttingLayoutType,
              gridPattern,
              blanksPerSheet,
              efficiencyPercentage,
              scrapPercentage,
              baseRequiredSheets,
              additionalSheets || 0,
              finalTotalSheets,
              costData.totalCost,
              wastageJustification || null,
              'PLANNED'
            ]
          );
        }

        if (!upsertResult || !upsertResult.rows || upsertResult.rows.length === 0) {
          throw new Error('UPSERT query did not return a result');
        }

        const planning = upsertResult.rows[0];
        console.log('✅ Planning saved successfully, ID:', planning.id);

        // Check if planning was already APPLIED and prevent modification
        if (planning.planning_status === 'APPLIED' && existingPlanning && existingPlanning.planning_status === 'APPLIED') {
          return res.status(400).json({
            success: false,
            error: 'Planning has already been applied and cannot be modified'
          });
        }

        res.json({
          success: true,
          message: existingPlanning ? 'Planning updated successfully' : 'Planning saved successfully',
          planning: {
            id: planning.id,
            job_card_id: planning.job_card_id,
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
            planning_status: planning.planning_status
          }
        });
      } catch (upsertError) {
        console.error('❌ Error upserting planning:', upsertError);
        console.error('Error details:', {
          message: upsertError.message,
          code: upsertError.code,
          detail: upsertError.detail,
          hint: upsertError.hint
        });
        throw upsertError;
      }
    } catch (error) {
      console.error('❌ Error saving planning:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      if (error.code) {
        console.error('PostgreSQL error code:', error.code);
        console.error('PostgreSQL error detail:', error.detail);
        console.error('PostgreSQL error hint:', error.hint);
      }
      res.status(500).json({
        success: false,
        error: 'Failed to save planning',
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? {
          code: error.code,
          detail: error.detail,
          hint: error.hint,
          stack: error.stack
        } : undefined
      });
    }
  }

  /**
   * Apply planning (lock + update inventory + workflow)
   */
  async applyPlanning(req, res) {
    try {
      console.log('🚀 applyPlanning called');
      const { jobId } = req.params;
      const userId = req.user?.id || req.user?.userId;
      
      console.log('📋 Request params:', { jobId, userId });

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User ID not found in request'
        });
      }

      // Get job card ID
      const jobQuery = await dbAdapter.query(
        `SELECT job_card_id FROM prepress_jobs WHERE id = $1`,
        [jobId]
      );

      if (jobQuery.rows.length === 0) {
        console.error('❌ Job not found:', jobId);
        return res.status(404).json({
          success: false,
          error: 'Job not found'
        });
      }

      let jobCardId = jobQuery.rows[0].job_card_id;
      // Ensure jobCardId is an integer for consistency
      const jobCardIdInt = parseInt(jobCardId, 10);
      if (isNaN(jobCardIdInt)) {
        console.error('❌ Invalid job_card_id:', jobCardId);
        return res.status(400).json({
          success: false,
          error: 'Invalid job card ID'
        });
      }
      jobCardId = jobCardIdInt;
      console.log('✅ Job card ID:', jobCardId, 'Type:', typeof jobCardId);

      // Get planning
      const planning = await sheetOptimizationService.getJobPlanning(jobCardId);
      console.log('📋 Planning data:', planning ? 'found' : 'not found');

      if (!planning) {
        return res.status(400).json({
          success: false,
          error: 'No planning found. Please create planning first.'
        });
      }

      if (planning.planning_status === 'APPLIED') {
        return res.status(400).json({
          success: false,
          error: 'Planning has already been applied'
        });
      }

      // Check if inventory_stock table exists
      const inventoryStockCheck = await dbAdapter.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'inventory_stock'
        )
      `);
      const hasInventoryStockTable = inventoryStockCheck.rows[0].exists;
      console.log('📋 inventory_stock table exists:', hasInventoryStockTable);

      // Validate stock availability if table exists
      if (hasInventoryStockTable) {
        try {
          const stockValidation = await sheetOptimizationService.validateStockAvailability(
            planning.selected_sheet_size_id,
            planning.final_total_sheets
          );

          if (!stockValidation.available) {
            return res.status(400).json({
              success: false,
              error: 'Insufficient stock',
              details: {
                required: planning.final_total_sheets,
                available: stockValidation.availableStock,
                shortage: stockValidation.shortage
              }
            });
          }
          console.log('✅ Stock validation passed');
        } catch (stockError) {
          console.warn('⚠️ Stock validation failed:', stockError.message);
          // Continue without stock validation if it fails
        }
      }

      // Check if job_lifecycle_history table exists
      const lifecycleCheck = await dbAdapter.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'job_lifecycle_history'
        )
      `);
      const hasLifecycleTable = lifecycleCheck.rows[0].exists;
      console.log('📋 job_lifecycle_history table exists:', hasLifecycleTable);

      // Start transaction
      const client = await dbAdapter.getConnection().connect();
      console.log('✅ Transaction client connected');
      
      try {
        await client.query('BEGIN');
        console.log('✅ Transaction BEGIN');

        // Update planning status to APPLIED
        const updateResult = await client.query(
          `UPDATE job_production_planning SET
            planning_status = 'APPLIED',
            planned_at = CURRENT_TIMESTAMP,
            planned_by = $1,
            updated_at = CURRENT_TIMESTAMP
           WHERE job_card_id = $2
           RETURNING id, planning_status, job_card_id`,
          [userId, jobCardId]
        );
        console.log('✅ Planning status updated, rows affected:', updateResult.rowCount);

        if (updateResult.rowCount === 0) {
          throw new Error(`Failed to update planning status - no planning found for job_card_id: ${jobCardId}`);
        }

        // Verify the update
        const verifyPlanning = updateResult.rows[0];
        const verifiedJobCardId = verifyPlanning.job_card_id;
        const verifiedJobCardIdType = typeof verifiedJobCardId;
        const jobCardIdMatches = String(verifiedJobCardId) === String(jobCardId);
        
        console.log('✅ Planning status verified:', {
          planning_id: verifyPlanning.id,
          job_card_id: verifiedJobCardId,
          job_card_id_type: verifiedJobCardIdType,
          expected_job_card_id: jobCardId,
          expected_type: typeof jobCardId,
          ids_match: jobCardIdMatches,
          planning_status: verifyPlanning.planning_status
        });
        
        if (!jobCardIdMatches) {
          console.warn('⚠️ Job card ID mismatch in planning table:', {
            expected: jobCardId,
            found: verifiedJobCardId
          });
        }

        // Check if workflow columns exist in job_cards
        const workflowColumnsCheck = await client.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'job_cards' 
          AND column_name IN ('current_department', 'current_step', 'workflow_status', 'status_message')
        `);
        const hasWorkflowColumns = workflowColumnsCheck.rows.length > 0;
        console.log('📋 Workflow columns exist in job_cards:', hasWorkflowColumns, workflowColumnsCheck.rows.map(r => r.column_name));

        // Update job card to transition to Cutting department
        // Always try to update, even if workflow columns don't exist (for backward compatibility)
        try {
          // First, check which columns actually exist
          const columnCheck = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'job_cards' 
            AND column_name IN ('current_department', 'current_step', 'workflow_status', 'status_message', 'status')
          `);
          const existingColumns = columnCheck.rows.map(r => r.column_name);
          
          // Build dynamic UPDATE query based on available columns
          const updateFields = [];
          const updateValues = [];
          let paramIndex = 1;
          
          if (existingColumns.includes('current_department')) {
            updateFields.push(`current_department = $${paramIndex}`);
            updateValues.push('Cutting');
            paramIndex++;
          }
          
          if (existingColumns.includes('current_step')) {
            updateFields.push(`current_step = $${paramIndex}`);
            updateValues.push('Job Planning Completed');
            paramIndex++;
          }
          
          if (existingColumns.includes('workflow_status')) {
            updateFields.push(`workflow_status = $${paramIndex}`);
            updateValues.push('SMART_PLANNING_COMPLETED');
            paramIndex++;
          }
          
          if (existingColumns.includes('status_message')) {
            updateFields.push(`status_message = $${paramIndex}`);
            updateValues.push('Job planning applied, ready for cutting');
            paramIndex++;
          }
          
          // Always update updatedAt if it exists
          if (existingColumns.includes('updatedAt') || existingColumns.includes('updated_at')) {
            const updatedAtColumn = existingColumns.includes('updatedAt') ? 'updatedAt' : 'updated_at';
            updateFields.push(`"${updatedAtColumn}" = CURRENT_TIMESTAMP`);
          }
          
          if (updateFields.length > 0) {
            updateValues.push(jobCardId); // jobCardId is the last parameter
            const updateQuery = `
              UPDATE job_cards SET
                ${updateFields.join(', ')}
               WHERE id = $${paramIndex}
               RETURNING id${existingColumns.includes('current_department') ? ', current_department' : ''}${existingColumns.includes('current_step') ? ', current_step' : ''}${existingColumns.includes('workflow_status') ? ', workflow_status' : ''}
            `;
            
            const jobCardUpdateResult = await client.query(updateQuery, updateValues);
            
            if (jobCardUpdateResult.rowCount === 0) {
              console.error('❌ Job card update failed - no rows affected for job_card_id:', jobCardId);
              throw new Error(`Failed to update job card ${jobCardId} - job not found`);
            }
            
            console.log('✅ Job card updated to Cutting department:', {
              job_card_id: jobCardId,
              updated_columns: existingColumns,
              current_department: jobCardUpdateResult.rows[0]?.current_department || 'N/A',
              current_step: jobCardUpdateResult.rows[0]?.current_step || 'N/A',
              workflow_status: jobCardUpdateResult.rows[0]?.workflow_status || 'N/A'
            });
          } else {
            console.warn('⚠️ No workflow columns found in job_cards table - cannot update department');
          }
        } catch (jobCardUpdateError) {
          console.error('❌ Error updating job card:', jobCardUpdateError);
          // Don't fail the entire operation, but log the error
          console.warn('⚠️ Continuing despite job card update error');
        }

        // Activate cutting workflow step (simplified - direct SQL only)
        try {
          // Check if job_workflow_steps table exists
          const tableCheck = await client.query(`
            SELECT EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_schema = 'public' 
              AND table_name = 'job_workflow_steps'
            )
          `);
          
          if (tableCheck.rows[0].exists) {
            // Find existing cutting step
            const existingStep = await client.query(`
              SELECT id, sequence_number, status
              FROM job_workflow_steps
              WHERE job_card_id = $1
                AND (department = 'Cutting' OR department = 'Production')
                AND (step_name ILIKE '%cutting%' OR step_name ILIKE '%press%')
              LIMIT 1
            `, [jobCardId]);
            
            if (existingStep.rows.length > 0) {
              const step = existingStep.rows[0];
              await client.query(`
                UPDATE job_workflow_steps
                SET 
                  status = 'in_progress',
                  status_message = 'Planning applied, ready for cutting',
                  updated_at = CURRENT_TIMESTAMP
                WHERE id = $1
              `, [step.id]);
              console.log('✅ Updated existing cutting workflow step');
            } else {
              // Get max sequence number
              const maxSeqResult = await client.query(`
                SELECT COALESCE(MAX(sequence_number), 0) as max_seq
                FROM job_workflow_steps
                WHERE job_card_id = $1
              `, [jobCardId]);
              const maxSeq = maxSeqResult.rows[0].max_seq || 0;
              
              // Create cutting step
              await client.query(`
                INSERT INTO job_workflow_steps (
                  job_card_id, sequence_number, step_name, department,
                  status, status_message, requires_qa, updated_at, created_at
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                ON CONFLICT DO NOTHING
              `, [
                jobCardId,
                maxSeq + 1,
                'Press Cutting',
                'Cutting',
                'in_progress',
                'Planning applied, ready for cutting',
                false
              ]);
              console.log('✅ Created cutting workflow step');
            }
          } else {
            console.warn('⚠️ job_workflow_steps table does not exist');
          }
        } catch (workflowError) {
          console.error('❌ Error updating workflow steps:', workflowError);
          console.warn('⚠️ Continuing despite workflow step error');
          // Don't fail the entire operation
        }

        // Deduct stock from inventory if table exists
        if (hasInventoryStockTable) {
          try {
            const stockUpdateResult = await client.query(
              `UPDATE inventory_stock SET
                current_stock = current_stock - $1,
                reserved_stock = reserved_stock + $1,
                updated_at = CURRENT_TIMESTAMP
               WHERE material_size_id = $2
               AND available_stock >= $1
               ORDER BY available_stock DESC
               LIMIT 1`,
              [planning.final_total_sheets, planning.selected_sheet_size_id]
            );
            console.log('✅ Stock deducted, rows affected:', stockUpdateResult.rowCount);
          } catch (stockUpdateError) {
            console.warn('⚠️ Stock update failed:', stockUpdateError.message);
            // Continue without stock update if it fails
          }
        }

        // Log to job_lifecycle_history if table exists
        if (hasLifecycleTable) {
          try {
            // Check if id column is TEXT or INTEGER
            const idColumnCheck = await dbAdapter.query(`
              SELECT data_type 
              FROM information_schema.columns 
              WHERE table_name = 'job_lifecycle_history' 
              AND column_name = 'id'
            `);
            const idType = idColumnCheck.rows[0]?.data_type;
            const lifecycleId = idType === 'text' ? uuidv4() : null;

            if (idType === 'text') {
              await client.query(
                `INSERT INTO job_lifecycle_history (
                  id, job_card_id, from_status, to_status, department,
                  changed_by, change_reason, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)`,
                [
                  lifecycleId,
                  jobCardId,
                  'CTP_COMPLETED',
                  'SMART_PLANNING_COMPLETED',
                  'Cutting',
                  userId,
                  `Sheet planning applied: ${planning.final_total_sheets} sheets, ${planning.grid_pattern} layout. Job ready for cutting.`
                ]
              );
            } else {
              // If id is SERIAL, don't include it
              await client.query(
                `INSERT INTO job_lifecycle_history (
                  job_card_id, from_status, to_status, department,
                  changed_by, change_reason, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
                [
                  jobCardId,
                  'CTP_COMPLETED',
                  'SMART_PLANNING_COMPLETED',
                  'Cutting',
                  userId,
                  `Sheet planning applied: ${planning.final_total_sheets} sheets, ${planning.grid_pattern} layout. Job ready for cutting.`
                ]
              );
            }
            console.log('✅ Lifecycle history logged');
          } catch (lifecycleError) {
            console.warn('⚠️ Lifecycle history logging failed:', lifecycleError.message);
            // Continue without lifecycle logging if it fails
          }
        }

        await client.query('COMMIT');
        console.log('✅ Transaction COMMIT');

        res.json({
          success: true,
          message: 'Planning applied successfully. Inventory deducted and workflow updated.',
          planning: {
            ...planning,
            planning_status: 'APPLIED',
            planned_at: new Date().toISOString(),
            planned_by: userId
          }
        });
      } catch (transactionError) {
        console.error('❌ Transaction error:', transactionError);
        await client.query('ROLLBACK');
        console.log('✅ Transaction ROLLBACK');
        throw transactionError;
      } finally {
        client.release();
        console.log('✅ Client released');
      }
    } catch (error) {
      console.error('❌ Error applying planning:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      if (error.code) {
        console.error('PostgreSQL error code:', error.code);
        console.error('PostgreSQL error detail:', error.detail);
        console.error('PostgreSQL error hint:', error.hint);
      }
      res.status(500).json({
        success: false,
        error: 'Failed to apply planning',
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? {
          code: error.code,
          detail: error.detail,
          hint: error.hint,
          stack: error.stack
        } : undefined
      });
    }
  }

  /**
   * Generate PDF cutting guide
   */
  async generateCuttingGuide(req, res) {
    try {
      const { jobId } = req.params;

      // Get job and planning data
      const jobQuery = await dbAdapter.query(
        `SELECT 
          jc."jobNumber" as job_card_number,
          jc.quantity,
          c.name as company_name,
          p.name as product_name,
          jpp.planning_status,
          jpp.final_total_sheets,
          jpp.material_cost,
          jpp.selected_sheet_size_id,
          jpp.cutting_layout_type,
          jpp.grid_pattern,
          jpp.blanks_per_sheet,
          jpp.efficiency_percentage,
          jpp.scrap_percentage,
          jpp.base_required_sheets,
          jpp.additional_sheets,
          ms.size_name,
          ms.width_mm,
          ms.height_mm
         FROM prepress_jobs pj
         JOIN job_cards jc ON pj.job_card_id = jc.id
         LEFT JOIN companies c ON jc."companyId" = c.id
         LEFT JOIN products p ON jc."productId" = p.id
         LEFT JOIN job_production_planning jpp ON jc.id = jpp.job_card_id
         LEFT JOIN material_sizes ms ON jpp.selected_sheet_size_id = ms.id
         WHERE pj.id = $1`,
        [jobId]
      );

      if (jobQuery.rows.length === 0 || !jobQuery.rows[0].selected_sheet_size_id) {
        return res.status(400).json({
          success: false,
          error: 'Job planning not found or incomplete'
        });
      }

      const data = jobQuery.rows[0];

      // For now, return JSON data
      // PDF generation will be implemented in frontend utility
      res.json({
        success: true,
        cuttingGuide: {
          jobNumber: data.job_card_number,
          company: data.company_name,
          product: data.product_name,
          quantity: data.quantity,
          sheetSize: {
            name: data.size_name,
            width: data.width_mm,
            height: data.height_mm
          },
          layout: {
            type: data.cutting_layout_type,
            gridPattern: data.grid_pattern,
            blanksPerSheet: data.blanks_per_sheet,
            efficiency: data.efficiency_percentage,
            scrap: data.scrap_percentage
          },
          sheets: {
            base: data.base_required_sheets,
            additional: data.additional_sheets,
            total: data.final_total_sheets
          },
          cost: data.material_cost
        }
      });
    } catch (error) {
      console.error('Error generating cutting guide:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate cutting guide',
        message: error.message
      });
    }
  }
}

export default new SmartDashboardController();

