# Complete Deployment Prompt for Cursor on Server

Copy and paste this entire prompt to Cursor on your server:

---

## Deploy ERP System to Production Server

I need to deploy the ERP system to this server. Here's what needs to be done:

### Current Situation:
- The repository is already cloned or will be cloned from GitHub
- I have a production database on another server with real job data
- I need to set up this new server with Docker
- I need to migrate the database schema and import job data

### Tasks Required:

1. **Verify Repository Setup**
   - Check if repository is cloned, if not: `git clone <repository-url>`
   - Navigate to project directory
   - Verify all files are present, especially:
     - `server/database/migrations/000_complete_schema_migration.sql`
     - `scripts/dump-schema-only.sh`
     - `scripts/dump-jobs-data-only.sh`
     - `scripts/run-complete-migration.js`
     - `scripts/import-jobs-data.sh`
     - `docker-compose.production.yml`
     - `DEPLOYMENT-PRODUCTION.md`

2. **Setup Environment**
   - Create `.env` file from `env.example` if it doesn't exist
   - Set required environment variables:
     - `POSTGRES_PASSWORD` (secure password)
     - `REDIS_PASSWORD` (secure password)
     - `JWT_SECRET` (secure secret key)
     - Database connection parameters
   - Create required directories: `mkdir -p dumps uploads logs`

3. **Make Scripts Executable**
   - Run: `chmod +x scripts/*.sh`
   - Verify scripts are executable: `ls -la scripts/`

4. **Prepare for Database Migration**
   - Check if Docker and Docker Compose are installed
   - If not, provide installation instructions
   - Verify Docker is running: `docker ps`

5. **Database Migration Process**
   - Start PostgreSQL container only: `docker-compose -f docker-compose.production.yml up -d postgres`
   - Wait for database to be ready (check logs)
   - Run complete schema migration using the migration runner script
   - Verify migration success by checking if key tables exist

6. **Data Import Preparation**
   - Explain that I need to:
     - Get database dumps from production server (schema-only and jobs data-only)
     - Place them in the `dumps/` directory
   - Once dumps are available, import the jobs data

7. **Start All Services**
   - After migrations and data import are complete
   - Start all Docker services: `docker-compose -f docker-compose.production.yml up -d`
   - Verify all services are running
   - Check service health and logs

8. **Verification Steps**
   - Verify database connection
   - Check that job data was imported (count rows in job_cards, prepress_jobs, etc.)
   - Test backend API endpoint: `curl http://localhost:5001/api/health`
   - Verify frontend is accessible

### Important Notes:
- All migrations use `IF NOT EXISTS` so they're safe to run multiple times
- The complete migration file combines all migrations (001-010) into one
- Schema and data are separated - schema migration first, then data import
- Follow the `DEPLOYMENT-PRODUCTION.md` guide for detailed steps

### Questions to Ask Me:
- What is the database connection information for the production server? (if I need to create dumps)
- What password should be used for PostgreSQL?
- What password should be used for Redis?
- What JWT secret should be used?
- Are there any custom port requirements?

Please start by verifying the repository setup and checking if all required files are present. Then guide me through each step, asking for any required information.

---

