import dbAdapter from './server/database/adapter.js';

(async () => {
    try {
        await dbAdapter.initialize();
        await dbAdapter.query("ALTER TABLE prepress_jobs ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP");
        console.log("Column 'assigned_at' added successfully.");
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
})();
