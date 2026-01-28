import dbAdapter from './server/database/adapter.js';

(async () => {
    try {
        await dbAdapter.initialize();
        const res = await dbAdapter.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'prepress_jobs'");
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
})();
