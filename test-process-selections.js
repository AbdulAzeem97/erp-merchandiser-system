import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';

const db = new Database('erp_merchandiser.db');

console.log('=== Testing Process Selections Directly ===');

try {
  // Get a real product ID and some step IDs
  const products = db.prepare('SELECT id, product_item_code, product_type FROM products LIMIT 1').all();
  if (products.length === 0) {
    console.log('No products found');
    process.exit(1);
  }
  
  const product = products[0];
  console.log('Testing with product:', product);
  
  // Get some real step IDs for this product type
  const steps = db.prepare(`
    SELECT ps.id, ps.name, ps.is_compulsory
    FROM process_steps ps
    JOIN process_sequences seq ON ps.process_sequence_id = seq.id
    WHERE seq.product_type = ?
    ORDER BY ps.step_order
    LIMIT 5
  `).all(product.product_type);
  
  console.log('Available steps:', steps);
  
  // Test the insert operation (simulate what the API does)
  console.log('\\n=== Testing Insert ===');
  
  // Clear existing selections
  const deleteStmt = db.prepare('DELETE FROM product_process_selections WHERE product_id = ?');
  deleteStmt.run(product.id);
  console.log('Cleared existing selections');
  
  // Insert some selections (first 2 steps)
  const insertStmt = db.prepare(`
    INSERT INTO product_process_selections (id, product_id, process_step_id, is_selected)
    VALUES (?, ?, ?, ?)
  `);
  
  for (let i = 0; i < Math.min(2, steps.length); i++) {
    const result = insertStmt.run(uuidv4(), product.id, steps[i].id, 1);
    console.log(`Inserted selection for step "${steps[i].name}":`, result.changes);
  }
  
  // Test the query that the job card would use
  console.log('\\n=== Testing Job Card Query ===');
  const jobCardQuery = db.prepare(`
    SELECT 
      ps.id as sequence_id,
      ps.product_type,
      ps.description,
      pst.id as step_id,
      pst.name as step_name,
      pst.is_compulsory,
      pst.step_order,
      COALESCE(pps.is_selected, pst.is_compulsory) as is_selected
    FROM process_sequences ps
    JOIN process_steps pst ON ps.id = pst.process_sequence_id
    LEFT JOIN product_process_selections pps ON pst.id = pps.process_step_id AND pps.product_id = ?
    WHERE ps.product_type = ? AND ps.is_active = 1 AND pst.is_active = 1
    AND (pst.is_compulsory = 1 OR pps.is_selected = 1)
    ORDER BY pst.step_order ASC
  `);
  
  const jobCardSteps = jobCardQuery.all(product.id, product.product_type);
  console.log('Steps that would show in job card:');
  jobCardSteps.forEach(step => {
    console.log(`- ${step.step_name} (Compulsory: ${step.is_compulsory ? 'Yes' : 'No'}, Selected: ${step.is_selected ? 'Yes' : 'No'})`);
  });
  
  console.log('\\n=== Success! ===');
  console.log(`Job card would show ${jobCardSteps.length} steps instead of ${steps.length} total steps`);
  
} catch (error) {
  console.error('Test failed:', error.message);
} finally {
  db.close();
}