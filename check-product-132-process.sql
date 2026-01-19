-- Check product 132's process sequence
SELECT 
  p.id as product_id,
  p.name as product_name,
  ps.id as sequence_id,
  ps.name as sequence_name,
  pst.id as step_id,
  pst.name as step_name,
  pst."stepNumber" as step_order,
  pst.department,
  pd.name as department_name
FROM products p
LEFT JOIN process_sequences ps ON ps.name = p.product_type OR ps.name LIKE p.product_type || '%'
LEFT JOIN process_steps pst ON pst."sequenceId" = ps.id AND pst."isActive" = true
LEFT JOIN production_departments pd ON pst.department_id = pd.id
WHERE p.id = 132
ORDER BY pst."stepNumber";



