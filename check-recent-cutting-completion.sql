-- Check for recently completed cutting jobs and their workflow steps
SELECT 
  jc.id,
  jc."jobNumber",
  jc.current_department,
  jc.current_step,
  jc.workflow_status,
  p.name as product_name,
  -- Cutting step info
  cutting_step.id as cutting_step_id,
  cutting_step.step_name as cutting_step_name,
  cutting_step.status as cutting_step_status,
  cutting_step.completed_at as cutting_completed_at,
  cutting_step.sequence_number as cutting_sequence,
  -- Next step after cutting
  next_step.id as next_step_id,
  next_step.step_name as next_step_name,
  next_step.department as next_step_department,
  next_step.status as next_step_status,
  next_step.sequence_number as next_step_sequence,
  -- Offset Printing step (if exists)
  offset_step.id as offset_step_id,
  offset_step.step_name as offset_step_name,
  offset_step.department as offset_step_department,
  offset_step.status as offset_step_status,
  offset_step.sequence_number as offset_step_sequence
FROM job_cards jc
LEFT JOIN products p ON jc."productId" = p.id
-- Get cutting step
LEFT JOIN LATERAL (
  SELECT * FROM job_workflow_steps 
  WHERE job_card_id = jc.id 
  AND department = 'Cutting'
  ORDER BY sequence_number DESC
  LIMIT 1
) cutting_step ON true
-- Get next step after cutting
LEFT JOIN LATERAL (
  SELECT * FROM job_workflow_steps 
  WHERE job_card_id = jc.id 
  AND sequence_number = cutting_step.sequence_number + 1
  LIMIT 1
) next_step ON true
-- Get Offset Printing step
LEFT JOIN LATERAL (
  SELECT * FROM job_workflow_steps 
  WHERE job_card_id = jc.id 
  AND (step_name ILIKE '%Offset Printing%' OR step_name = 'Offset Printing')
  LIMIT 1
) offset_step ON true
WHERE cutting_step.status = 'completed'
ORDER BY cutting_step.completed_at DESC
LIMIT 5;



