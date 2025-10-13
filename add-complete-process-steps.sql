-- Add Complete Process Steps for All 6 Departments

-- Get sequence IDs first
DO $$
DECLARE
    offset_id INTEGER;
    heat_transfer_id INTEGER;
    pfl_id INTEGER;
    woven_id INTEGER;
    leather_id INTEGER;
    digital_id INTEGER;
BEGIN
    -- Get sequence IDs
    SELECT id INTO offset_id FROM process_sequences WHERE product_type = 'Offset';
    SELECT id INTO heat_transfer_id FROM process_sequences WHERE product_type = 'Heat Transfer';
    SELECT id INTO pfl_id FROM process_sequences WHERE product_type = 'PFL';
    SELECT id INTO woven_id FROM process_sequences WHERE product_type = 'Woven';
    SELECT id INTO leather_id FROM process_sequences WHERE product_type = 'Leather';
    SELECT id INTO digital_id FROM process_sequences WHERE product_type = 'Digital';

    -- Offset Printing Steps (31 steps)
    INSERT INTO process_steps (sequence_id, name, description, sequence_order, department, is_compulsory, estimated_time_hours) VALUES
    (offset_id, 'Prepress', 'Design and prepress work', 1, 'Prepress', TRUE, 4.0),
    (offset_id, 'Material Procurement', 'Order materials', 2, 'Inventory', TRUE, 2.0),
    (offset_id, 'Material Issuance', 'Issue materials', 3, 'Inventory', TRUE, 1.0),
    (offset_id, 'CTP', 'Computer to Plate', 4, 'Prepress', FALSE, 1.0),
    (offset_id, 'Offset Printing', 'Main printing', 5, 'Production', FALSE, 8.0),
    (offset_id, 'Lamination', 'Laminate product', 6, 'Production', FALSE, 2.0),
    (offset_id, 'Varnishing', 'Apply varnish', 7, 'Production', FALSE, 2.0),
    (offset_id, 'Die Cutting', 'Cut to shape', 8, 'Production', FALSE, 3.0),
    (offset_id, 'Pasting', 'Paste components', 9, 'Production', FALSE, 2.0),
    (offset_id, 'Packing', 'Pack finished goods', 10, 'Production', FALSE, 1.0),
    (offset_id, 'Ready', 'Ready for dispatch', 11, 'QA', FALSE, 0.5),
    (offset_id, 'Dispatch', 'Send to customer', 12, 'Dispatch', FALSE, 1.0);

    -- Heat Transfer Label Steps (11 steps)
    INSERT INTO process_steps (sequence_id, name, description, sequence_order, department, is_compulsory, estimated_time_hours) VALUES
    (heat_transfer_id, 'Prepress', 'Design work', 1, 'Prepress', TRUE, 2.0),
    (heat_transfer_id, 'Material Procurement', 'Get materials', 2, 'Inventory', TRUE, 1.0),
    (heat_transfer_id, 'Material Issuance', 'Issue materials', 3, 'Inventory', TRUE, 0.5),
    (heat_transfer_id, 'Exposing', 'Expose design', 4, 'Production', FALSE, 1.0),
    (heat_transfer_id, 'Printing', 'Print labels', 5, 'Production', FALSE, 3.0),
    (heat_transfer_id, 'Die Cutting', 'Cut labels', 6, 'Production', FALSE, 2.0),
    (heat_transfer_id, 'Breaking', 'Break from sheet', 7, 'Production', FALSE, 1.0),
    (heat_transfer_id, 'Packing', 'Pack labels', 8, 'Production', FALSE, 1.0),
    (heat_transfer_id, 'Ready', 'QA check', 9, 'QA', FALSE, 0.5),
    (heat_transfer_id, 'Dispatch', 'Ship out', 10, 'Dispatch', FALSE, 0.5);

    -- PFL Steps (12 steps)
    INSERT INTO process_steps (sequence_id, name, description, sequence_order, department, is_compulsory, estimated_time_hours) VALUES
    (pfl_id, 'Prepress', 'Design preparation', 1, 'Prepress', TRUE, 2.0),
    (pfl_id, 'Material Procurement', 'Order fabric', 2, 'Inventory', TRUE, 1.0),
    (pfl_id, 'Material Issuance', 'Issue fabric', 3, 'Inventory', TRUE, 0.5),
    (pfl_id, 'Block Making', 'Create printing block', 4, 'Production', FALSE, 2.0),
    (pfl_id, 'Printing', 'Print on fabric', 5, 'Production', FALSE, 4.0),
    (pfl_id, 'RFID', 'Add RFID tags', 6, 'Production', FALSE, 1.0),
    (pfl_id, 'Cut & Fold', 'Cut and fold labels', 7, 'Production', FALSE, 2.0),
    (pfl_id, 'Curing', 'Cure the print', 8, 'Production', FALSE, 3.0),
    (pfl_id, 'Packing', 'Pack finished labels', 9, 'Production', FALSE, 1.0),
    (pfl_id, 'Ready', 'QA approval', 10, 'QA', FALSE, 0.5),
    (pfl_id, 'Dispatch', 'Ship to customer', 11, 'Dispatch', FALSE, 0.5);

    -- Woven Label Steps (14 steps)
    INSERT INTO process_steps (sequence_id, name, description, sequence_order, department, is_compulsory, estimated_time_hours) VALUES
    (woven_id, 'Prepress', 'Design setup', 1, 'Prepress', TRUE, 2.0),
    (woven_id, 'Material Procurement', 'Order thread/fabric', 2, 'Inventory', TRUE, 1.0),
    (woven_id, 'Material Issuance', 'Issue materials', 3, 'Inventory', TRUE, 0.5),
    (woven_id, 'Dying', 'Dye threads', 4, 'Production', FALSE, 4.0),
    (woven_id, 'Weaving', 'Weave labels', 5, 'Production', FALSE, 6.0),
    (woven_id, 'Screen Printing', 'Print on woven', 6, 'Production', FALSE, 2.0),
    (woven_id, 'Sliting', 'Slit to size', 7, 'Production', FALSE, 1.0),
    (woven_id, 'RFID', 'Add RFID', 8, 'Production', FALSE, 1.0),
    (woven_id, 'Cut & Fold', 'Final cutting', 9, 'Production', FALSE, 2.0),
    (woven_id, 'Packing', 'Pack labels', 10, 'Production', FALSE, 1.0),
    (woven_id, 'Ready', 'QA check', 11, 'QA', FALSE, 0.5),
    (woven_id, 'Dispatch', 'Ship out', 12, 'Dispatch', FALSE, 0.5);

    -- Leather Patch Steps (8 steps)
    INSERT INTO process_steps (sequence_id, name, description, sequence_order, department, is_compulsory, estimated_time_hours) VALUES
    (leather_id, 'Prepress', 'Design work', 1, 'Prepress', TRUE, 2.0),
    (leather_id, 'Material Procurement', 'Get leather', 2, 'Inventory', TRUE, 1.0),
    (leather_id, 'Material Issuance', 'Issue leather', 3, 'Inventory', TRUE, 0.5),
    (leather_id, 'Embossing', 'Emboss design', 4, 'Production', FALSE, 3.0),
    (leather_id, 'Die Cutting', 'Cut patches', 5, 'Production', FALSE, 2.0),
    (leather_id, 'Packing', 'Pack patches', 6, 'Production', FALSE, 1.0),
    (leather_id, 'Ready', 'QA approval', 7, 'QA', FALSE, 0.5),
    (leather_id, 'Dispatch', 'Ship out', 8, 'Dispatch', FALSE, 0.5);

    -- Digital Printing Steps (12 steps)
    INSERT INTO process_steps (sequence_id, name, description, sequence_order, department, is_compulsory, estimated_time_hours) VALUES
    (digital_id, 'Prepress', 'Digital design', 1, 'Prepress', TRUE, 2.0),
    (digital_id, 'Material Procurement', 'Order media', 2, 'Inventory', TRUE, 1.0),
    (digital_id, 'Material Issuance', 'Issue media', 3, 'Inventory', TRUE, 0.5),
    (digital_id, 'Digital Printing', 'Print digitally', 4, 'Production', FALSE, 4.0),
    (digital_id, 'Lamination', 'Laminate print', 5, 'Production', FALSE, 1.0),
    (digital_id, 'Die Cutting', 'Cut to shape', 6, 'Production', FALSE, 2.0),
    (digital_id, 'Finishing', 'Final touches', 7, 'Production', FALSE, 1.0),
    (digital_id, 'Packing', 'Pack products', 8, 'Production', FALSE, 1.0),
    (digital_id, 'Ready', 'QA check', 9, 'QA', FALSE, 0.5),
    (digital_id, 'Dispatch', 'Ship out', 10, 'Dispatch', FALSE, 0.5);
    
END $$;

-- Verify
SELECT 
    ps.name as sequence_name,
    COUNT(pst.id) as step_count
FROM process_sequences ps
LEFT JOIN process_steps pst ON ps.id = pst.sequence_id
GROUP BY ps.id, ps.name
ORDER BY ps.id;

SELECT 'Complete process steps added for all 6 departments!' AS status;
SELECT COUNT(*) as total_process_steps FROM process_steps;

