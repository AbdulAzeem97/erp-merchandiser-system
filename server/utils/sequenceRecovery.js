/**
 * Universal sequence recovery utility
 * Automatically fixes sequence issues for any table
 */

/**
 * Recover sequence for a specific table
 * @param {Object} dbAdapter - Database adapter instance
 * @param {string} tableName - Name of the table
 * @param {string} sequenceName - Optional sequence name (defaults to tableName_id_seq)
 * @returns {Promise<Object>} Recovery result
 */
export async function recoverSequence(dbAdapter, tableName, sequenceName = null) {
  try {
    if (!sequenceName) {
      sequenceName = `${tableName}_id_seq`;
    }
    
    const result = await dbAdapter.query(`
      SELECT sync_sequence_with_table($1, $2)
    `, [tableName, sequenceName]);
    
    return { success: true, tableName, sequenceName };
  } catch (error) {
    console.error(`Failed to recover sequence for ${tableName}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Wraps an INSERT query with automatic sequence recovery
 * @param {Object} dbAdapter - Database adapter instance
 * @param {string} query - SQL INSERT query
 * @param {Array} params - Query parameters
 * @param {string} tableName - Name of the table being inserted into
 * @returns {Promise<Object>} Query result
 */
export async function insertWithRecovery(dbAdapter, query, params, tableName) {
  try {
    return await dbAdapter.query(query, params);
  } catch (error) {
    // Check if it's a sequence error on the id column
    if (error.code === '23505' && error.message && error.message.includes('Key (id)=')) {
      console.warn(`⚠️ Sequence out of sync for ${tableName}. Attempting auto-fix...`);
      
      try {
        // Recover sequence
        await recoverSequence(dbAdapter, tableName);
        
        console.log(`✅ Sequence auto-fixed for ${tableName}. Retrying insert...`);
        
        // Retry once
        return await dbAdapter.query(query, params);
      } catch (recoveryError) {
        console.error(`❌ Sequence auto-fix failed for ${tableName}:`, recoveryError);
        throw new Error(`Sequence auto-recovery failed for ${tableName}: ${recoveryError.message}`);
      }
    }
    throw error;
  }
}

