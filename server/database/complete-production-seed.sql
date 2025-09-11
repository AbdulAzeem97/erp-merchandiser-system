-- Complete Production Module Seed Data
-- Comprehensive production departments, processes, and workflows

-- Insert Production Director Role (Top Level)
INSERT OR REPLACE INTO production_departments (
    id, name, code, description, parent_department_id, head_user_id, 
    hierarchy_level, department_type, color_code, location, is_active
) VALUES
    ('prod-director', 'Production Director', 'PROD-DIR', 'Overall production oversight and management', NULL, NULL, 0, 'DIRECTOR', '#1e40af', 'Executive Floor', 1);

-- Insert Main Production Departments
INSERT OR REPLACE INTO production_departments (
    id, name, code, description, parent_department_id, head_user_id, 
    hierarchy_level, department_type, color_code, location, capacity_per_day, is_active
) VALUES
    -- Primary Production Departments
    ('dept-offset', 'Offset Printing', 'OFFSET', 'Offset printing operations and management', 'prod-director', NULL, 1, 'PRODUCTION', '#dc2626', 'Floor A - Section 1', 1000, 1),
    ('dept-heat-transfer', 'Heat Transfer Label', 'HEAT-TXR', 'Heat transfer label production', 'prod-director', NULL, 1, 'PRODUCTION', '#ea580c', 'Floor A - Section 2', 800, 1),
    ('dept-pfl', 'PFL (Printed Film Labels)', 'PFL', 'Printed film label manufacturing', 'prod-director', NULL, 1, 'PRODUCTION', '#ca8a04', 'Floor A - Section 3', 600, 1),
    ('dept-wovl', 'Woven Labels', 'WOVL', 'Woven label production', 'prod-director', NULL, 1, 'PRODUCTION', '#16a34a', 'Floor B - Section 1', 500, 1),
    ('dept-leather', 'Leather Patch', 'LEATHER', 'Leather patch manufacturing', 'prod-director', NULL, 1, 'PRODUCTION', '#a16207', 'Floor B - Section 2', 400, 1),
    ('dept-digital', 'Digital Printing', 'DIGITAL', 'Digital printing services', 'prod-director', NULL, 1, 'PRODUCTION', '#7c3aed', 'Floor C - Section 1', 300, 1);

-- Insert Sub-departments for common processes across all departments
INSERT OR REPLACE INTO production_departments (
    id, name, code, description, parent_department_id, head_user_id, 
    hierarchy_level, department_type, color_code, location, is_active
) VALUES
    -- Prepress departments for each main department
    ('dept-offset-prepress', 'Offset Prepress', 'OFF-PREP', 'Offset prepress operations', 'dept-offset', NULL, 2, 'PREPRESS', '#fca5a5', 'Floor A - Prepress Lab 1', 1),
    ('dept-heat-prepress', 'Heat Transfer Prepress', 'HT-PREP', 'Heat transfer prepress', 'dept-heat-transfer', NULL, 2, 'PREPRESS', '#fed7aa', 'Floor A - Prepress Lab 2', 1),
    ('dept-pfl-prepress', 'PFL Prepress', 'PFL-PREP', 'PFL prepress operations', 'dept-pfl', NULL, 2, 'PREPRESS', '#fde047', 'Floor A - Prepress Lab 3', 1),
    ('dept-wovl-prepress', 'Woven Label Prepress', 'WVL-PREP', 'Woven label prepress', 'dept-wovl', NULL, 2, 'PREPRESS', '#bbf7d0', 'Floor B - Prepress Lab 1', 1),
    ('dept-leather-prepress', 'Leather Patch Prepress', 'LTR-PREP', 'Leather patch prepress', 'dept-leather', NULL, 2, 'PREPRESS', '#fef08a', 'Floor B - Prepress Lab 2', 1),
    ('dept-digital-prepress', 'Digital Prepress', 'DIG-PREP', 'Digital prepress operations', 'dept-digital', NULL, 2, 'PREPRESS', '#e9d5ff', 'Floor C - Prepress Lab', 1),
    
    -- Material Procurement departments
    ('dept-offset-material', 'Offset Material Procurement', 'OFF-MAT', 'Material procurement for offset printing', 'dept-offset', NULL, 2, 'MATERIAL', '#f87171', 'Warehouse A1', 1),
    ('dept-heat-material', 'Heat Transfer Material Procurement', 'HT-MAT', 'Material procurement for heat transfer', 'dept-heat-transfer', NULL, 2, 'MATERIAL', '#fb923c', 'Warehouse A2', 1),
    ('dept-pfl-material', 'PFL Material Procurement', 'PFL-MAT', 'Material procurement for PFL', 'dept-pfl', NULL, 2, 'MATERIAL', '#facc15', 'Warehouse A3', 1),
    ('dept-wovl-material', 'Woven Material Procurement', 'WVL-MAT', 'Material procurement for woven labels', 'dept-wovl', NULL, 2, 'MATERIAL', '#4ade80', 'Warehouse B1', 1),
    ('dept-leather-material', 'Leather Material Procurement', 'LTR-MAT', 'Material procurement for leather patches', 'dept-leather', NULL, 2, 'MATERIAL', '#eab308', 'Warehouse B2', 1),
    ('dept-digital-material', 'Digital Material Procurement', 'DIG-MAT', 'Material procurement for digital printing', 'dept-digital', NULL, 2, 'MATERIAL', '#a78bfa', 'Warehouse C1', 1),
    
    -- Material Issuance departments
    ('dept-offset-issuance', 'Offset Material Issuance', 'OFF-ISS', 'Material issuance for offset printing', 'dept-offset', NULL, 2, 'ISSUANCE', '#ef4444', 'Issue Counter A1', 1),
    ('dept-heat-issuance', 'Heat Transfer Material Issuance', 'HT-ISS', 'Material issuance for heat transfer', 'dept-heat-transfer', NULL, 2, 'ISSUANCE', '#f97316', 'Issue Counter A2', 1),
    ('dept-pfl-issuance', 'PFL Material Issuance', 'PFL-ISS', 'Material issuance for PFL', 'dept-pfl', NULL, 2, 'ISSUANCE', '#f59e0b', 'Issue Counter A3', 1),
    ('dept-wovl-issuance', 'Woven Material Issuance', 'WVL-ISS', 'Material issuance for woven labels', 'dept-wovl', NULL, 2, 'ISSUANCE', '#22c55e', 'Issue Counter B1', 1),
    ('dept-leather-issuance', 'Leather Material Issuance', 'LTR-ISS', 'Material issuance for leather patches', 'dept-leather', NULL, 2, 'ISSUANCE', '#d97706', 'Issue Counter B2', 1),
    ('dept-digital-issuance', 'Digital Material Issuance', 'DIG-ISS', 'Material issuance for digital printing', 'dept-digital', NULL, 2, 'ISSUANCE', '#8b5cf6', 'Issue Counter C1', 1);

-- Insert Production Processes for Offset Printing Department
INSERT OR REPLACE INTO production_processes (
    id, department_id, name, code, description, sequence_order, 
    estimated_duration_hours, quality_check_required, material_required, equipment_required, 
    skill_level_required, is_active
) VALUES
    -- Offset Printing Processes
    ('proc-off-prep', 'dept-offset-prepress', 'Prepress', 'OFF-PREP-01', 'File preparation and proofing for offset printing', 1, 2.0, 1, 0, 1, 'INTERMEDIATE', 1),
    ('proc-off-mat-proc', 'dept-offset-material', 'Material Procurement', 'OFF-MAT-01', 'Source and procure printing materials', 2, 1.0, 0, 1, 0, 'BASIC', 1),
    ('proc-off-mat-iss', 'dept-offset-issuance', 'Material Issuance', 'OFF-ISS-01', 'Issue materials to production floor', 3, 0.5, 0, 1, 0, 'BASIC', 1),
    ('proc-off-cut', 'dept-offset', 'Paper Cutting', 'OFF-CUT-01', 'Cut paper to required dimensions', 4, 1.0, 1, 1, 1, 'INTERMEDIATE', 1),
    ('proc-off-print', 'dept-offset', 'Offset Printing', 'OFF-PRINT-01', 'Main offset printing process', 5, 4.0, 1, 1, 1, 'ADVANCED', 1),
    ('proc-off-digi-print', 'dept-offset', 'Digital Printing', 'OFF-DIG-01', 'Digital printing for small runs', 6, 2.0, 1, 1, 1, 'INTERMEDIATE', 1),
    ('proc-off-varn-matt', 'dept-offset', 'Varnish Matt', 'OFF-VM-01', 'Apply matt varnish coating', 7, 1.5, 1, 1, 1, 'INTERMEDIATE', 1),
    ('proc-off-varn-gloss', 'dept-offset', 'Varnish Gloss', 'OFF-VG-01', 'Apply gloss varnish coating', 8, 1.5, 1, 1, 1, 'INTERMEDIATE', 1),
    ('proc-off-varn-soft', 'dept-offset', 'Varnish Soft Touch', 'OFF-VST-01', 'Apply soft touch varnish', 9, 2.0, 1, 1, 1, 'ADVANCED', 1),
    ('proc-off-inlay', 'dept-offset', 'Inlay Pasting', 'OFF-INLAY-01', 'Paste inlay materials', 10, 1.0, 1, 1, 0, 'BASIC', 1),
    ('proc-off-lam-matt', 'dept-offset', 'Lamination Matte', 'OFF-LM-01', 'Apply matte lamination', 11, 1.5, 1, 1, 1, 'INTERMEDIATE', 1),
    ('proc-off-lam-gloss', 'dept-offset', 'Lamination Gloss', 'OFF-LG-01', 'Apply gloss lamination', 12, 1.5, 1, 1, 1, 'INTERMEDIATE', 1),
    ('proc-off-lam-soft', 'dept-offset', 'Lamination Soft Touch', 'OFF-LST-01', 'Apply soft touch lamination', 13, 2.0, 1, 1, 1, 'ADVANCED', 1),
    ('proc-off-uv', 'dept-offset', 'UV Coating', 'OFF-UV-01', 'Apply UV protective coating', 14, 1.0, 1, 1, 1, 'INTERMEDIATE', 1),
    ('proc-off-foil-matt', 'dept-offset', 'Foil Matte', 'OFF-FM-01', 'Apply matte foil stamping', 15, 2.0, 1, 1, 1, 'ADVANCED', 1),
    ('proc-off-foil-gloss', 'dept-offset', 'Foil Gloss', 'OFF-FG-01', 'Apply gloss foil stamping', 16, 2.0, 1, 1, 1, 'ADVANCED', 1),
    ('proc-off-screen', 'dept-offset', 'Screen Printing', 'OFF-SCR-01', 'Screen printing process', 17, 3.0, 1, 1, 1, 'ADVANCED', 1),
    ('proc-off-emboss', 'dept-offset', 'Embossing', 'OFF-EMB-01', 'Embossing process', 18, 2.0, 1, 1, 1, 'ADVANCED', 1),
    ('proc-off-deboss', 'dept-offset', 'Debossing', 'OFF-DEB-01', 'Debossing process', 19, 2.0, 1, 1, 1, 'ADVANCED', 1),
    ('proc-off-paste', 'dept-offset', 'Pasting', 'OFF-PASTE-01', 'Pasting process', 20, 1.0, 1, 1, 0, 'BASIC', 1),
    ('proc-off-tape', 'dept-offset', 'Two Way Tape', 'OFF-TAPE-01', 'Apply two-way tape', 21, 0.5, 0, 1, 0, 'BASIC', 1),
    ('proc-off-die', 'dept-offset', 'Die Cutting', 'OFF-DIE-01', 'Die cutting process', 22, 2.0, 1, 1, 1, 'INTERMEDIATE', 1),
    ('proc-off-break', 'dept-offset', 'Breaking', 'OFF-BREAK-01', 'Breaking/separation process', 23, 1.0, 1, 0, 1, 'BASIC', 1),
    ('proc-off-piggy', 'dept-offset', 'Piggy Sticker', 'OFF-PIGGY-01', 'Apply piggy sticker', 24, 0.5, 0, 1, 0, 'BASIC', 1),
    ('proc-off-rfid', 'dept-offset', 'RFID', 'OFF-RFID-01', 'RFID tag application', 25, 1.0, 1, 1, 1, 'INTERMEDIATE', 1),
    ('proc-off-eyelet', 'dept-offset', 'Eyelet', 'OFF-EYELET-01', 'Eyelet insertion', 26, 0.5, 1, 1, 1, 'BASIC', 1),
    ('proc-off-outsource', 'dept-offset', 'Out Source', 'OFF-OUT-01', 'Outsourced processes', 27, 8.0, 1, 0, 0, 'BASIC', 1),
    ('proc-off-pack', 'dept-offset', 'Packing', 'OFF-PACK-01', 'Final packing process', 28, 1.0, 1, 1, 0, 'BASIC', 1),
    ('proc-off-ready', 'dept-offset', 'Ready', 'OFF-READY-01', 'Quality check and ready for dispatch', 29, 0.5, 1, 0, 0, 'BASIC', 1),
    ('proc-off-dispatch', 'dept-offset', 'Dispatch', 'OFF-DISP-01', 'Dispatch to customer', 30, 0.5, 1, 0, 0, 'BASIC', 1),
    ('proc-off-excess', 'dept-offset', 'Excess', 'OFF-EXC-01', 'Handle excess materials', 31, 0.5, 0, 0, 0, 'BASIC', 1);

-- Insert Production Processes for Heat Transfer Label Department
INSERT OR REPLACE INTO production_processes (
    id, department_id, name, code, description, sequence_order, 
    estimated_duration_hours, quality_check_required, material_required, equipment_required, 
    skill_level_required, is_active
) VALUES
    -- Heat Transfer Label Processes
    ('proc-ht-prep', 'dept-heat-prepress', 'Prepress', 'HT-PREP-01', 'Heat transfer design preparation', 1, 1.5, 1, 0, 1, 'INTERMEDIATE', 1),
    ('proc-ht-mat-proc', 'dept-heat-material', 'Material Procurement', 'HT-MAT-01', 'Source heat transfer materials', 2, 1.0, 0, 1, 0, 'BASIC', 1),
    ('proc-ht-mat-iss', 'dept-heat-issuance', 'Material Issuance', 'HT-ISS-01', 'Issue heat transfer materials', 3, 0.5, 0, 1, 0, 'BASIC', 1),
    ('proc-ht-expose', 'dept-heat-transfer', 'Exposing', 'HT-EXP-01', 'Expose heat transfer film', 4, 2.0, 1, 1, 1, 'INTERMEDIATE', 1),
    ('proc-ht-print', 'dept-heat-transfer', 'Printing', 'HT-PRINT-01', 'Print heat transfer design', 5, 3.0, 1, 1, 1, 'ADVANCED', 1),
    ('proc-ht-die', 'dept-heat-transfer', 'Die Cutting', 'HT-DIE-01', 'Die cut heat transfer labels', 6, 1.5, 1, 1, 1, 'INTERMEDIATE', 1),
    ('proc-ht-break', 'dept-heat-transfer', 'Breaking', 'HT-BREAK-01', 'Break/separate labels', 7, 1.0, 1, 0, 1, 'BASIC', 1),
    ('proc-ht-pack', 'dept-heat-transfer', 'Packing', 'HT-PACK-01', 'Pack heat transfer labels', 8, 1.0, 1, 1, 0, 'BASIC', 1),
    ('proc-ht-ready', 'dept-heat-transfer', 'Ready', 'HT-READY-01', 'Ready for dispatch', 9, 0.5, 1, 0, 0, 'BASIC', 1),
    ('proc-ht-dispatch', 'dept-heat-transfer', 'Dispatch', 'HT-DISP-01', 'Dispatch heat transfer labels', 10, 0.5, 1, 0, 0, 'BASIC', 1),
    ('proc-ht-excess', 'dept-heat-transfer', 'Excess', 'HT-EXC-01', 'Handle excess materials', 11, 0.5, 0, 0, 0, 'BASIC', 1);

-- Insert Production Processes for PFL Department
INSERT OR REPLACE INTO production_processes (
    id, department_id, name, code, description, sequence_order, 
    estimated_duration_hours, quality_check_required, material_required, equipment_required, 
    skill_level_required, is_active
) VALUES
    -- PFL (Printed Film Labels) Processes
    ('proc-pfl-prep', 'dept-pfl-prepress', 'Prepress', 'PFL-PREP-01', 'PFL design preparation', 1, 1.5, 1, 0, 1, 'INTERMEDIATE', 1),
    ('proc-pfl-mat-proc', 'dept-pfl-material', 'Material Procurement', 'PFL-MAT-01', 'Source PFL materials', 2, 1.0, 0, 1, 0, 'BASIC', 1),
    ('proc-pfl-mat-iss', 'dept-pfl-issuance', 'Material Issuance', 'PFL-ISS-01', 'Issue PFL materials', 3, 0.5, 0, 1, 0, 'BASIC', 1),
    ('proc-pfl-block', 'dept-pfl', 'Block Making', 'PFL-BLOCK-01', 'Create printing blocks', 4, 3.0, 1, 1, 1, 'ADVANCED', 1),
    ('proc-pfl-print', 'dept-pfl', 'Printing', 'PFL-PRINT-01', 'Print film labels', 5, 4.0, 1, 1, 1, 'ADVANCED', 1),
    ('proc-pfl-rfid', 'dept-pfl', 'RFID', 'PFL-RFID-01', 'Apply RFID to PFL', 6, 1.0, 1, 1, 1, 'INTERMEDIATE', 1),
    ('proc-pfl-fold', 'dept-pfl', 'Cut & Fold', 'PFL-FOLD-01', 'Cut and fold PFL', 7, 2.0, 1, 1, 1, 'INTERMEDIATE', 1),
    ('proc-pfl-cure', 'dept-pfl', 'Curing', 'PFL-CURE-01', 'Cure printed labels', 8, 4.0, 1, 0, 1, 'INTERMEDIATE', 1),
    ('proc-pfl-pack', 'dept-pfl', 'Packing', 'PFL-PACK-01', 'Pack PFL products', 9, 1.0, 1, 1, 0, 'BASIC', 1),
    ('proc-pfl-ready', 'dept-pfl', 'Ready', 'PFL-READY-01', 'Ready for dispatch', 10, 0.5, 1, 0, 0, 'BASIC', 1),
    ('proc-pfl-dispatch', 'dept-pfl', 'Dispatch', 'PFL-DISP-01', 'Dispatch PFL products', 11, 0.5, 1, 0, 0, 'BASIC', 1),
    ('proc-pfl-excess', 'dept-pfl', 'Excess', 'PFL-EXC-01', 'Handle excess materials', 12, 0.5, 0, 0, 0, 'BASIC', 1);

-- Insert Production Processes for Woven Label Department
INSERT OR REPLACE INTO production_processes (
    id, department_id, name, code, description, sequence_order, 
    estimated_duration_hours, quality_check_required, material_required, equipment_required, 
    skill_level_required, is_active
) VALUES
    -- Woven Label Processes
    ('proc-wvl-prep', 'dept-wovl-prepress', 'Prepress', 'WVL-PREP-01', 'Woven label design preparation', 1, 2.0, 1, 0, 1, 'ADVANCED', 1),
    ('proc-wvl-mat-proc', 'dept-wovl-material', 'Material Procurement', 'WVL-MAT-01', 'Source woven materials', 2, 1.0, 0, 1, 0, 'BASIC', 1),
    ('proc-wvl-mat-iss', 'dept-wovl-issuance', 'Material Issuance', 'WVL-ISS-01', 'Issue woven materials', 3, 0.5, 0, 1, 0, 'BASIC', 1),
    ('proc-wvl-dye', 'dept-wovl', 'Dyeing', 'WVL-DYE-01', 'Dye woven materials', 4, 6.0, 1, 1, 1, 'ADVANCED', 1),
    ('proc-wvl-weave', 'dept-wovl', 'Weaving', 'WVL-WEAVE-01', 'Weave label fabric', 5, 8.0, 1, 1, 1, 'EXPERT', 1),
    ('proc-wvl-screen', 'dept-wovl', 'Screen Printing', 'WVL-SCR-01', 'Screen print on woven labels', 6, 3.0, 1, 1, 1, 'ADVANCED', 1),
    ('proc-wvl-slit', 'dept-wovl', 'Slitting', 'WVL-SLIT-01', 'Slit woven labels', 7, 2.0, 1, 1, 1, 'INTERMEDIATE', 1),
    ('proc-wvl-rfid', 'dept-wovl', 'RFID', 'WVL-RFID-01', 'Apply RFID to woven labels', 8, 1.0, 1, 1, 1, 'INTERMEDIATE', 1),
    ('proc-wvl-fold', 'dept-wovl', 'Cut & Fold', 'WVL-FOLD-01', 'Cut and fold woven labels', 9, 2.0, 1, 1, 1, 'INTERMEDIATE', 1),
    ('proc-wvl-pack', 'dept-wovl', 'Packing', 'WVL-PACK-01', 'Pack woven labels', 10, 1.0, 1, 1, 0, 'BASIC', 1),
    ('proc-wvl-ready', 'dept-wovl', 'Ready', 'WVL-READY-01', 'Ready for dispatch', 11, 0.5, 1, 0, 0, 'BASIC', 1),
    ('proc-wvl-dispatch', 'dept-wovl', 'Dispatch', 'WVL-DISP-01', 'Dispatch woven labels', 12, 0.5, 1, 0, 0, 'BASIC', 1),
    ('proc-wvl-excess', 'dept-wovl', 'Excess', 'WVL-EXC-01', 'Handle excess materials', 13, 0.5, 0, 0, 0, 'BASIC', 1);

-- Insert Production Processes for Leather Patch Department
INSERT OR REPLACE INTO production_processes (
    id, department_id, name, code, description, sequence_order, 
    estimated_duration_hours, quality_check_required, material_required, equipment_required, 
    skill_level_required, is_active
) VALUES
    -- Leather Patch Processes
    ('proc-ltr-prep', 'dept-leather-prepress', 'Prepress', 'LTR-PREP-01', 'Leather patch design preparation', 1, 1.5, 1, 0, 1, 'INTERMEDIATE', 1),
    ('proc-ltr-mat-proc', 'dept-leather-material', 'Material Procurement', 'LTR-MAT-01', 'Source leather materials', 2, 1.0, 0, 1, 0, 'BASIC', 1),
    ('proc-ltr-mat-iss', 'dept-leather-issuance', 'Material Issuance', 'LTR-ISS-01', 'Issue leather materials', 3, 0.5, 0, 1, 0, 'BASIC', 1),
    ('proc-ltr-print', 'dept-leather', 'Printing', 'LTR-PRINT-01', 'Print on leather patches', 4, 3.0, 1, 1, 1, 'ADVANCED', 1),
    ('proc-ltr-rfid', 'dept-leather', 'RFID', 'LTR-RFID-01', 'Apply RFID to leather patches', 5, 1.0, 1, 1, 1, 'INTERMEDIATE', 1),
    ('proc-ltr-ready', 'dept-leather', 'Ready', 'LTR-READY-01', 'Ready leather patches', 6, 0.5, 1, 0, 0, 'BASIC', 1),
    ('proc-ltr-dispatch', 'dept-leather', 'Dispatch', 'LTR-DISP-01', 'Dispatch leather patches', 7, 0.5, 1, 0, 0, 'BASIC', 1),
    ('proc-ltr-excess', 'dept-leather', 'Excess', 'LTR-EXC-01', 'Handle excess materials', 8, 0.5, 0, 0, 0, 'BASIC', 1);

-- Insert Production Processes for Digital Printing Department
INSERT OR REPLACE INTO production_processes (
    id, department_id, name, code, description, sequence_order, 
    estimated_duration_hours, quality_check_required, material_required, equipment_required, 
    skill_level_required, is_active
) VALUES
    -- Digital Printing Processes
    ('proc-dig-prep', 'dept-digital-prepress', 'Prepress', 'DIG-PREP-01', 'Digital printing file preparation', 1, 1.0, 1, 0, 1, 'INTERMEDIATE', 1),
    ('proc-dig-mat-proc', 'dept-digital-material', 'Material Procurement', 'DIG-MAT-01', 'Source digital printing materials', 2, 1.0, 0, 1, 0, 'BASIC', 1),
    ('proc-dig-mat-iss', 'dept-digital-issuance', 'Material Issuance', 'DIG-ISS-01', 'Issue digital printing materials', 3, 0.5, 0, 1, 0, 'BASIC', 1),
    ('proc-dig-block', 'dept-digital', 'Block Making', 'DIG-BLOCK-01', 'Create digital blocks if needed', 4, 2.0, 1, 1, 1, 'ADVANCED', 1),
    ('proc-dig-print', 'dept-digital', 'Printing', 'DIG-PRINT-01', 'Digital printing process', 5, 2.0, 1, 1, 1, 'INTERMEDIATE', 1),
    ('proc-dig-offset', 'dept-digital', 'Offset Printing', 'DIG-OFF-01', 'Hybrid offset printing', 6, 3.0, 1, 1, 1, 'ADVANCED', 1),
    ('proc-dig-rfid', 'dept-digital', 'RFID', 'DIG-RFID-01', 'Apply RFID tags', 7, 1.0, 1, 1, 1, 'INTERMEDIATE', 1),
    ('proc-dig-screen', 'dept-digital', 'Screen Printing', 'DIG-SCR-01', 'Screen printing overlay', 8, 2.0, 1, 1, 1, 'ADVANCED', 1),
    ('proc-dig-emboss', 'dept-digital', 'Embossing', 'DIG-EMB-01', 'Emboss digital prints', 9, 2.0, 1, 1, 1, 'ADVANCED', 1),
    ('proc-dig-deboss', 'dept-digital', 'Debossing', 'DIG-DEB-01', 'Deboss digital prints', 10, 2.0, 1, 1, 1, 'ADVANCED', 1),
    ('proc-dig-die', 'dept-digital', 'Die Cutting', 'DIG-DIE-01', 'Die cut digital products', 11, 1.5, 1, 1, 1, 'INTERMEDIATE', 1),
    ('proc-dig-break', 'dept-digital', 'Breaking', 'DIG-BREAK-01', 'Break/separate products', 12, 1.0, 1, 0, 1, 'BASIC', 1),
    ('proc-dig-pack', 'dept-digital', 'Packing', 'DIG-PACK-01', 'Pack digital products', 13, 1.0, 1, 1, 0, 'BASIC', 1),
    ('proc-dig-ready', 'dept-digital', 'Ready', 'DIG-READY-01', 'Ready for dispatch', 14, 0.5, 1, 0, 0, 'BASIC', 1),
    ('proc-dig-dispatch', 'dept-digital', 'Dispatch', 'DIG-DISP-01', 'Dispatch digital products', 15, 0.5, 1, 0, 0, 'BASIC', 1),
    ('proc-dig-excess', 'dept-digital', 'Excess', 'DIG-EXC-01', 'Handle excess materials', 16, 0.5, 0, 0, 0, 'BASIC', 1);

-- Insert Default Production Workflows
INSERT OR REPLACE INTO production_workflows (
    id, name, product_category, workflow_steps, estimated_total_time,
    complexity_level, is_default, is_active, created_by
) VALUES
    -- Offset Printing Workflow
    ('wf-offset-standard', 'Standard Offset Printing Workflow', 'OFFSET_LABELS', 
     '[{"step":1,"departmentId":"dept-offset-prepress","processId":"proc-off-prep","sequence":1},
       {"step":2,"departmentId":"dept-offset-material","processId":"proc-off-mat-proc","sequence":2},
       {"step":3,"departmentId":"dept-offset-issuance","processId":"proc-off-mat-iss","sequence":3},
       {"step":4,"departmentId":"dept-offset","processId":"proc-off-cut","sequence":4},
       {"step":5,"departmentId":"dept-offset","processId":"proc-off-print","sequence":5},
       {"step":6,"departmentId":"dept-offset","processId":"proc-off-die","sequence":6},
       {"step":7,"departmentId":"dept-offset","processId":"proc-off-pack","sequence":7},
       {"step":8,"departmentId":"dept-offset","processId":"proc-off-ready","sequence":8},
       {"step":9,"departmentId":"dept-offset","processId":"proc-off-dispatch","sequence":9}]',
     14.0, 'MEDIUM', 1, 1, 'system'),
    
    -- Heat Transfer Workflow
    ('wf-heat-transfer-standard', 'Standard Heat Transfer Workflow', 'HEAT_TRANSFER_LABELS',
     '[{"step":1,"departmentId":"dept-heat-prepress","processId":"proc-ht-prep","sequence":1},
       {"step":2,"departmentId":"dept-heat-material","processId":"proc-ht-mat-proc","sequence":2},
       {"step":3,"departmentId":"dept-heat-issuance","processId":"proc-ht-mat-iss","sequence":3},
       {"step":4,"departmentId":"dept-heat-transfer","processId":"proc-ht-expose","sequence":4},
       {"step":5,"departmentId":"dept-heat-transfer","processId":"proc-ht-print","sequence":5},
       {"step":6,"departmentId":"dept-heat-transfer","processId":"proc-ht-die","sequence":6},
       {"step":7,"departmentId":"dept-heat-transfer","processId":"proc-ht-pack","sequence":7},
       {"step":8,"departmentId":"dept-heat-transfer","processId":"proc-ht-ready","sequence":8},
       {"step":9,"departmentId":"dept-heat-transfer","processId":"proc-ht-dispatch","sequence":9}]',
     11.0, 'MEDIUM', 1, 1, 'system'),
    
    -- PFL Workflow
    ('wf-pfl-standard', 'Standard PFL Workflow', 'PRINTED_FILM_LABELS',
     '[{"step":1,"departmentId":"dept-pfl-prepress","processId":"proc-pfl-prep","sequence":1},
       {"step":2,"departmentId":"dept-pfl-material","processId":"proc-pfl-mat-proc","sequence":2},
       {"step":3,"departmentId":"dept-pfl-issuance","processId":"proc-pfl-mat-iss","sequence":3},
       {"step":4,"departmentId":"dept-pfl","processId":"proc-pfl-block","sequence":4},
       {"step":5,"departmentId":"dept-pfl","processId":"proc-pfl-print","sequence":5},
       {"step":6,"departmentId":"dept-pfl","processId":"proc-pfl-fold","sequence":6},
       {"step":7,"departmentId":"dept-pfl","processId":"proc-pfl-cure","sequence":7},
       {"step":8,"departmentId":"dept-pfl","processId":"proc-pfl-pack","sequence":8},
       {"step":9,"departmentId":"dept-pfl","processId":"proc-pfl-ready","sequence":9},
       {"step":10,"departmentId":"dept-pfl","processId":"proc-pfl-dispatch","sequence":10}]',
     17.5, 'HIGH', 1, 1, 'system'),
    
    -- Woven Label Workflow
    ('wf-woven-standard', 'Standard Woven Label Workflow', 'WOVEN_LABELS',
     '[{"step":1,"departmentId":"dept-wovl-prepress","processId":"proc-wvl-prep","sequence":1},
       {"step":2,"departmentId":"dept-wovl-material","processId":"proc-wvl-mat-proc","sequence":2},
       {"step":3,"departmentId":"dept-wovl-issuance","processId":"proc-wvl-mat-iss","sequence":3},
       {"step":4,"departmentId":"dept-wovl","processId":"proc-wvl-dye","sequence":4},
       {"step":5,"departmentId":"dept-wovl","processId":"proc-wvl-weave","sequence":5},
       {"step":6,"departmentId":"dept-wovl","processId":"proc-wvl-slit","sequence":6},
       {"step":7,"departmentId":"dept-wovl","processId":"proc-wvl-fold","sequence":7},
       {"step":8,"departmentId":"dept-wovl","processId":"proc-wvl-pack","sequence":8},
       {"step":9,"departmentId":"dept-wovl","processId":"proc-wvl-ready","sequence":9},
       {"step":10,"departmentId":"dept-wovl","processId":"proc-wvl-dispatch","sequence":10}]',
     20.0, 'HIGH', 1, 1, 'system'),
    
    -- Leather Patch Workflow
    ('wf-leather-standard', 'Standard Leather Patch Workflow', 'LEATHER_PATCHES',
     '[{"step":1,"departmentId":"dept-leather-prepress","processId":"proc-ltr-prep","sequence":1},
       {"step":2,"departmentId":"dept-leather-material","processId":"proc-ltr-mat-proc","sequence":2},
       {"step":3,"departmentId":"dept-leather-issuance","processId":"proc-ltr-mat-iss","sequence":3},
       {"step":4,"departmentId":"dept-leather","processId":"proc-ltr-print","sequence":4},
       {"step":5,"departmentId":"dept-leather","processId":"proc-ltr-ready","sequence":5},
       {"step":6,"departmentId":"dept-leather","processId":"proc-ltr-dispatch","sequence":6}]',
     6.5, 'LOW', 1, 1, 'system'),
    
    -- Digital Printing Workflow
    ('wf-digital-standard', 'Standard Digital Printing Workflow', 'DIGITAL_LABELS',
     '[{"step":1,"departmentId":"dept-digital-prepress","processId":"proc-dig-prep","sequence":1},
       {"step":2,"departmentId":"dept-digital-material","processId":"proc-dig-mat-proc","sequence":2},
       {"step":3,"departmentId":"dept-digital-issuance","processId":"proc-dig-mat-iss","sequence":3},
       {"step":4,"departmentId":"dept-digital","processId":"proc-dig-print","sequence":4},
       {"step":5,"departmentId":"dept-digital","processId":"proc-dig-die","sequence":5},
       {"step":6,"departmentId":"dept-digital","processId":"proc-dig-pack","sequence":6},
       {"step":7,"departmentId":"dept-digital","processId":"proc-dig-ready","sequence":7},
       {"step":8,"departmentId":"dept-digital","processId":"proc-dig-dispatch","sequence":8}]',
     8.5, 'MEDIUM', 1, 1, 'system');

-- Create default production director role (to be assigned to actual user)
-- This will be done via API when the first director user is created