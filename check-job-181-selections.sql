-- Check process sequence selections for job 181 (JC-1767607103136)
SELECT 
  jps."jobId",
  jps."processStepId",
  jps.is_selected,
  pst.id as step_id,
  pst.name as step_name,
  pst."stepNumber" as step_order,
  pst.department,
  pd.name as department_name
FROM job_process_selections jps
JOIN process_steps pst ON jps."processStepId" = pst.id
LEFT JOIN production_departments pd ON pst.department_id = pd.id
WHERE jps."jobId" = 181
ORDER BY pst."stepNumber";

-- Also check product's process sequence
SELECT 
  p.id as product_id,
  p.name as product_name,
  ps.id as sequence_id,
  ps.name as sequence_name
FROM products p
LEFT JOIN process_sequences ps ON ps.name = p.product_type OR ps.name LIKE p.product_type || '%'
WHERE p.id = 130;



