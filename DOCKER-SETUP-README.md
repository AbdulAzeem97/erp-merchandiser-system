# Docker Setup Guide for ERP Merchandiser System

This guide will help you run the complete ERP Merchandiser System using Docker with your database dump file.

## Prerequisites

1. **Docker Desktop** installed and running
   - Windows: [Download Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/)
   - Linux: Install Docker and Docker Compose
   - macOS: [Download Docker Desktop for Mac](https://www.docker.com/products/docker-desktop/)

2. **Database Dump File**
   - The file `erp_merchandiser_backup.dump` should be in the parent directory (`D:\erp-merchandiser-system-2\`)

## Quick Start

### Windows (PowerShell)

```powershell
cd erp-merchandiser-system
.\docker-start-full.ps1
```

### Linux/Mac (Bash)

```bash
cd erp-merchandiser-system
chmod +x docker-start-full.sh
./docker-start-full.sh
```

## What Gets Started

The Docker setup includes:

1. **PostgreSQL Database** (port 5432)
   - Automatically restores from `erp_merchandiser_backup.dump`
   - Database: `erp_merchandiser`
   - User: `erp_user`
   - Password: `DevPassword123!`

2. **Redis Cache** (port 6379)
   - Used for session management and caching

3. **Backend API** (port 5001)
   - Node.js/Express server
   - Handles all API requests

4. **Frontend Application** (port 8080)
   - React/Vite application
   - Modern UI for the ERP system

5. **PGAdmin** (port 5050) - Optional
   - Database management tool
   - Access: http://localhost:5050
   - Email: admin@erp.com
   - Password: admin123

## Access Points

After starting the system:

- **Application**: http://localhost:8080
- **API**: http://localhost:5001
- **Database**: localhost:5432
- **PGAdmin** (optional): http://localhost:5050

## Manual Docker Commands

If you prefer to run Docker commands manually:

### Start all services with PGAdmin
```bash
docker-compose -f docker-compose.full.yml --profile tools up -d
```

### Start without PGAdmin
```bash
docker-compose -f docker-compose.full.yml up -d
```

### View logs
```bash
# All services
docker-compose -f docker-compose.full.yml logs -f

# Specific service
docker-compose -f docker-compose.full.yml logs -f backend
docker-compose -f docker-compose.full.yml logs -f frontend
docker-compose -f docker-compose.full.yml logs -f postgres
```

### Stop services
```bash
docker-compose -f docker-compose.full.yml down
```

### Stop and remove volumes (WARNING: This deletes all data)
```bash
docker-compose -f docker-compose.full.yml down -v
```

### Rebuild services
```bash
docker-compose -f docker-compose.full.yml up --build -d
```

## Troubleshooting

### Database restoration fails

If you see errors about database restoration:

1. Check the dump file format:
   ```bash
   file ../erp_merchandiser_backup.dump
   ```

2. Try manual restoration:
   ```bash
   # Copy dump file into container
   docker cp ../erp_merchandiser_backup.dump erp-postgres:/tmp/

   # Restore manually
   docker exec -it erp-postgres pg_restore -U erp_user -d erp_merchandiser -v /tmp/erp_merchandiser_backup.dump
   ```

### Port conflicts

If you get port conflict errors:

1. Change the port mappings in `docker-compose.full.yml`
2. Update the ports in `.env.docker`
3. Restart the services

### Backend can't connect to database

Check the backend logs:
```bash
docker-compose -f docker-compose.full.yml logs backend
```

The backend waits for PostgreSQL to be healthy before starting. If issues persist:
```bash
docker-compose -f docker-compose.full.yml restart backend
```

### Frontend shows connection errors

1. Check if backend is running:
   ```bash
   curl http://localhost:5001/api/health
   ```

2. Check frontend logs:
   ```bash
   docker-compose -f docker-compose.full.yml logs frontend
   ```

## Environment Variables

The system uses environment variables from `.env.docker`:

- **DB_HOST**: postgres (container name)
- **DB_PORT**: 5432
- **DB_NAME**: erp_merchandiser
- **DB_USER**: erp_user
- **DB_PASSWORD**: DevPassword123!
- **JWT_SECRET**: Change this for production!
- **PORT**: 5001 (backend port)
- **FRONTEND_URL**: http://localhost:8080

To modify these, edit `.env.docker` or `env.docker.template` and rebuild:
```bash
docker-compose -f docker-compose.full.yml up --build -d
```

## Database Backup

To create a new backup of your running database:

```bash
docker exec erp-postgres pg_dump -U erp_user -Fc erp_merchandiser > backup_$(date +%Y%m%d_%H%M%S).dump
```

## Persistent Data

Data is stored in Docker volumes:
- `postgres_data`: Database files
- `redis_data`: Redis cache
- `pgadmin_data`: PGAdmin settings

To view volumes:
```bash
docker volume ls
```

## Production Deployment

For production deployment:

1. Change passwords in `docker-compose.full.yml`
2. Update `JWT_SECRET` in `.env.docker`
3. Set `NODE_ENV=production`
4. Consider using Docker Swarm or Kubernetes
5. Set up proper SSL/TLS certificates
6. Configure firewall rules
7. Set up automated backups

## Support

For issues or questions:
1. Check the logs: `docker-compose -f docker-compose.full.yml logs`
2. Verify all services are healthy: `docker-compose -f docker-compose.full.yml ps`
3. Review the environment variables in `.env.docker`
4. Check Docker Desktop resources (memory, CPU)

## Clean Up

To completely remove the system and all data:

```bash
# Stop and remove containers, networks
docker-compose -f docker-compose.full.yml down

# Also remove volumes (deletes all data)
docker-compose -f docker-compose.full.yml down -v

# Remove built images
docker rmi erp-merchandiser-system-backend erp-merchandiser-system-frontend
```


