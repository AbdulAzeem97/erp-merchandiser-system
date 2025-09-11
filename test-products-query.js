import dbAdapter from './server/database/adapter.js';

console.log('🔍 Testing products query...');

try {
  const limit = 20;
  const offset = 0;
  const params = [];
  const limitParam = params.length + 1;
  const offsetParam = params.length + 2;
  
  const productsQuery = `
    SELECT 
      p.*,
      m.name as material_name,
      m.code as material_code,
      pc.name as category_name
    FROM products p
    LEFT JOIN materials m ON p.material_id = m.id
    LEFT JOIN product_categories pc ON p.category_id = pc.id
    ORDER BY p.created_at DESC
    LIMIT $` + limitParam + ` OFFSET $` + offsetParam;
  
  console.log('Query:', productsQuery);
  console.log('Params:', [...params, limit, offset]);
  
  const result = await dbAdapter.query(productsQuery, [...params, limit, offset]);
  console.log('✅ Query successful:', result.rows.length, 'products found');
  
} catch (error) {
  console.error('❌ Query failed:', error.message);
}
