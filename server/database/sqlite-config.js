import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// SQLite Configuration
const dbPath = path.resolve(__dirname, '../../erp_merchandiser.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

console.log('Connected to SQLite database at:', dbPath);

// Create a query wrapper to make it compatible with PostgreSQL-style queries
class SQLitePool {
  constructor(database) {
    this.db = database;
  }

  async query(text, params = []) {
    try {
      // Convert PostgreSQL-style parameters ($1, $2) to SQLite-style (?, ?)
      // Need to handle repeated parameters like $1 used multiple times
      let sqliteQuery = text;
      let sqliteParams = [];
      
      // Find all unique parameter references
      const paramMatches = text.match(/\$(\d+)/g);
      if (paramMatches) {
        const uniqueParams = [...new Set(paramMatches)];
        
        // Replace each parameter reference with ? and build param array
        uniqueParams.sort((a, b) => parseInt(a.substring(1)) - parseInt(b.substring(1)));
        
        for (const paramRef of paramMatches) {
          const paramIndex = parseInt(paramRef.substring(1)) - 1;
          sqliteParams.push(params[paramIndex]);
        }
        
        sqliteQuery = text.replace(/\$\d+/g, '?');
      } else {
        sqliteParams = params;
      }
      
      // Convert ILIKE to LIKE for SQLite
      let processedQuery = sqliteQuery.replace(/ILIKE/g, 'LIKE');
      
      // Convert PostgreSQL date functions to SQLite equivalents
      processedQuery = processedQuery.replace(/CURRENT_DATE - INTERVAL '(\d+) days'/g, "date('now', '-$1 days')");
      processedQuery = processedQuery.replace(/CURRENT_DATE/g, "date('now')");
      processedQuery = processedQuery.replace(/CURRENT_TIMESTAMP/g, "datetime('now')");
      
      console.log('SQLite Query:', processedQuery);
      console.log('SQLite Params:', sqliteParams);
      
      if (processedQuery.trim().toUpperCase().startsWith('SELECT')) {
        const stmt = this.db.prepare(processedQuery);
        const rows = stmt.all(sqliteParams);
        return { rows };
      } else if (processedQuery.trim().toUpperCase().includes('RETURNING')) {
        // Handle INSERT/UPDATE with RETURNING clause
        const returningMatch = processedQuery.match(/RETURNING\s+(.+)$/i);
        
        // Check if this is an INSERT that needs UUID
        const isProductInsert = processedQuery.toUpperCase().includes('INSERT INTO PRODUCTS');
        const isJobInsert = processedQuery.toUpperCase().includes('INSERT INTO JOB_CARDS');
        let finalQuery = processedQuery.replace(/\s+RETURNING\s+.+$/i, '');
        let finalParams = [...sqliteParams];
        
        // For product inserts, generate UUID if id is not provided
        if (isProductInsert) {
          const uuid = uuidv4();
          // Insert the UUID as the first parameter (assuming id is the first column)
          finalQuery = finalQuery.replace(
            'INSERT INTO products (',
            'INSERT INTO products (id, '
          ).replace(
            'VALUES (',
            'VALUES (?, '
          );
          finalParams.unshift(uuid);
        }
        
        // For job_cards inserts, generate UUID if id is not provided
        if (isJobInsert) {
          const uuid = uuidv4();
          // Insert the UUID as the first parameter (assuming id is the first column)
          finalQuery = finalQuery.replace(
            'INSERT INTO job_cards (',
            'INSERT INTO job_cards (id, '
          ).replace(
            'VALUES (',
            'VALUES (?, '
          );
          finalParams.unshift(uuid);
        }
        
        const stmt = this.db.prepare(finalQuery);
        const result = stmt.run(finalParams);
        
        if (result.changes > 0) {
          // Get the inserted/updated row
          if (isProductInsert) {
            const selectStmt = this.db.prepare('SELECT * FROM products WHERE id = ?');
            const rows = selectStmt.all([finalParams[0]]); // Use the generated UUID
            return { rows, rowCount: result.changes, insertId: result.lastInsertRowid };
          } else if (isJobInsert) {
            const selectStmt = this.db.prepare('SELECT * FROM job_cards WHERE id = ?');
            const rows = selectStmt.all([finalParams[0]]); // Use the generated UUID
            return { rows, rowCount: result.changes, insertId: result.lastInsertRowid };
          } else {
            const selectStmt = this.db.prepare('SELECT * FROM job_cards WHERE rowid = ?');
            const rows = selectStmt.all([result.lastInsertRowid]);
            return { rows, rowCount: result.changes, insertId: result.lastInsertRowid };
          }
        } else {
          return { rows: [], rowCount: result.changes, insertId: result.lastInsertRowid };
        }
      } else {
        const stmt = this.db.prepare(processedQuery);
        const result = stmt.run(sqliteParams);
        return { rows: [], rowCount: result.changes, insertId: result.lastInsertRowid };
      }
    } catch (error) {
      console.error('SQLite Query Error:', error);
      console.error('Query:', text);
      console.error('Params:', params);
      throw error;
    }
  }
}

const pool = new SQLitePool(db);

export default pool;