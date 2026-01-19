# ERP Merchandiser System - Complete Docker Setup with Database Restore

This guide will help you run the complete ERP Merchandiser System using Docker with automatic database restoration from a dump file.

## 📋 Prerequisites

1. **Docker Desktop** installed and running
   - Windows/Mac: [Download Docker Desktop](https://www.docker.com/products/docker-desktop)
   - Linux: [Install Docker Engine](https://docs.docker.com/engine/install/)

2. **Database Dump File**
   - Ensure `erp_merchandiser_backup.dump` is in the root directory
   - This file will be automatically restored on first run

3. **System Requirements**
   - 8GB RAM minimum (16GB recommended)
   - 10GB free disk space
   - Windows 10/11, macOS 10.15+, or Linux

## 🚀 Quick Start

### Windows (PowerShell)

```powershell
.\start-docker-complete.ps1
```

### Linux/Mac (Bash)

```bash
chmod +x start-docker-complete.sh
./start-docker-complete.sh
```

## 📦 What Gets Installed

The Docker setup includes:

1. **PostgreSQL Database** (Port 5432)
   - Automatically restores from `erp_merchandiser_backup.dump`
   - User: `erp_user`
   - Password: `DevPassword123!`
   - Database: `erp_merchandiser`

2. **Redis Cache** (Port 6379)
   - In-memory caching for better performance
   - Password: `redis_secure_2024!`

3. **Backend API Server** (Port 5001)
   - Node.js/Express API
   - Connects to PostgreSQL and Redis
   - Health check endpoint: `http://localhost:5001/api/health`

4. **Frontend Application** (Port 8080)
   - React + Vite application
   - Modern UI with Tailwind CSS
   - Access at: `http://localhost:8080`

5. **PgAdmin** (Port 5050)
   - Web-based database management tool
   - Email: `admin@erp.local`
   - Password: `admin123`

## 🌐 Access URLs

| Service | URL | Credentials |
|---------|-----|-------------|
| **Frontend** | http://localhost:8080 | See system users below |
| **Backend API** | http://localhost:5001 | - |
| **PgAdmin** | http://localhost:5050 | admin@erp.local / admin123 |
| **PostgreSQL** | localhost:5432 | erp_user / DevPassword123! |
| **Redis** | localhost:6379 | redis_secure_2024! |

## 👥 Default System Users

After the database is restored, you can log in with these users:

| Role | Username | Password | Department |
|------|----------|----------|------------|
| Admin | admin | admin123 | Admin |
| Manager | manager | manager123 | Management |
| Sales | sales | sales123 | Sales |
| Production | production | prod123 | Production |

## 🔧 Configuration

### Environment Variables

The system uses environment variables for configuration. Default values are set in the docker-compose file, but you can override them by creating a `.env` file:

```bash
# Database
POSTGRES_DB=erp_merchandiser
POSTGRES_USER=erp_user
POSTGRES_PASSWORD=DevPassword123!
POSTGRES_PORT=5432

# Backend
BACKEND_PORT=5001
JWT_SECRET=your_super_secure_jwt_secret_key_2024

# Frontend
FRONTEND_PORT=8080

# Redis
REDIS_PASSWORD=redis_secure_2024!
```

### Custom Port Configuration

To change the default ports, create a `.env` file and modify:

```bash
FRONTEND_PORT=3000    # Change frontend port
BACKEND_PORT=5000     # Change backend port
POSTGRES_PORT=5433    # Change database port
```

## 📋 Docker Commands

### View Logs

```bash
# All services
docker-compose -f docker-compose.complete.yml logs -f

# Specific service
docker-compose -f docker-compose.complete.yml logs -f backend
docker-compose -f docker-compose.complete.yml logs -f frontend
docker-compose -f docker-compose.complete.yml logs -f postgres
```

### Check Status

```bash
docker-compose -f docker-compose.complete.yml ps
```

### Stop System

```bash
docker-compose -f docker-compose.complete.yml down
```

### Stop and Remove All Data

```bash
# WARNING: This will delete all data including database!
docker-compose -f docker-compose.complete.yml down -v
```

### Restart Services

```bash
# Restart all services
docker-compose -f docker-compose.complete.yml restart

# Restart specific service
docker-compose -f docker-compose.complete.yml restart backend
```

### Rebuild Images

```bash
# Rebuild all images
docker-compose -f docker-compose.complete.yml build

# Rebuild specific service
docker-compose -f docker-compose.complete.yml build backend

# Rebuild and restart
docker-compose -f docker-compose.complete.yml up -d --build
```

## 🔍 Troubleshooting

### Database Not Restoring

1. Check if dump file exists:
   ```bash
   ls -l erp_merchandiser_backup.dump
   ```

2. View database restoration logs:
   ```bash
   docker-compose -f docker-compose.complete.yml logs postgres
   ```

3. If restoration fails, you can manually restore:
   ```bash
   docker exec -i erp-postgres pg_restore -U erp_user -d erp_merchandiser -v < erp_merchandiser_backup.dump
   ```

### Port Already in Use

If you get "port already in use" errors:

1. Check what's using the port:
   ```powershell
   # Windows
   netstat -ano | findstr :8080
   
   # Linux/Mac
   lsof -i :8080
   ```

2. Stop the conflicting service or change the port in `.env` file

### Container Health Check Failing

1. Check container logs:
   ```bash
   docker-compose -f docker-compose.complete.yml logs <service-name>
   ```

2. Check container status:
   ```bash
   docker-compose -f docker-compose.complete.yml ps
   ```

3. Restart the service:
   ```bash
   docker-compose -f docker-compose.complete.yml restart <service-name>
   ```

### Frontend Can't Connect to Backend

1. Check if backend is healthy:
   ```bash
   curl http://localhost:5001/api/health
   ```

2. Verify CORS settings in `.env`:
   ```bash
   CORS_ORIGIN=http://localhost:8080
   ```

3. Check backend logs for errors:
   ```bash
   docker-compose -f docker-compose.complete.yml logs backend
   ```

### Database Connection Issues

1. Verify database is running:
   ```bash
   docker-compose -f docker-compose.complete.yml ps postgres
   ```

2. Test database connection:
   ```bash
   docker exec -it erp-postgres psql -U erp_user -d erp_merchandiser -c "\dt"
   ```

3. Check database logs:
   ```bash
   docker-compose -f docker-compose.complete.yml logs postgres
   ```

## 🗄️ Database Management

### Connect to Database via PgAdmin

1. Open http://localhost:5050
2. Login with:
   - Email: `admin@erp.local`
   - Password: `admin123`
3. Add new server:
   - Name: `ERP Database`
   - Host: `postgres` (container name)
   - Port: `5432`
   - Username: `erp_user`
   - Password: `DevPassword123!`
   - Database: `erp_merchandiser`

### Connect via Command Line

```bash
docker exec -it erp-postgres psql -U erp_user -d erp_merchandiser
```

### Backup Database

```bash
docker exec erp-postgres pg_dump -U erp_user -d erp_merchandiser -F c > backup_$(date +%Y%m%d_%H%M%S).dump
```

### Restore Different Dump File

```bash
docker exec -i erp-postgres pg_restore -U erp_user -d erp_merchandiser -c < your_backup.dump
```

## 🔄 Updating the System

### Update Code

1. Stop the system:
   ```bash
   docker-compose -f docker-compose.complete.yml down
   ```

2. Pull latest changes:
   ```bash
   git pull
   ```

3. Rebuild and restart:
   ```bash
   docker-compose -f docker-compose.complete.yml up -d --build
   ```

### Update Database Schema

If you need to update the database schema:

1. Create a migration script in `server/database/migrations/`
2. Run it against the database:
   ```bash
   docker exec -i erp-postgres psql -U erp_user -d erp_merchandiser < server/database/migrations/your_migration.sql
   ```

## 🔐 Security Considerations

### For Production Deployment

1. **Change All Passwords**:
   - Update `POSTGRES_PASSWORD`
   - Update `REDIS_PASSWORD`
   - Update `JWT_SECRET`
   - Update all user passwords

2. **Enable HTTPS**:
   - Set up SSL certificates
   - Configure nginx for HTTPS

3. **Restrict Access**:
   - Don't expose PostgreSQL port (5432) publicly
   - Use firewall rules
   - Enable authentication on Redis

4. **Regular Backups**:
   - Schedule automatic database backups
   - Store backups securely off-site

5. **Update Environment Variables**:
   ```bash
   NODE_ENV=production
   CORS_ORIGIN=https://your-domain.com
   ```

## 📊 Performance Tuning

### Increase Resources

Edit `docker-compose.complete.yml` to increase limits:

```yaml
deploy:
  resources:
    limits:
      cpus: '4.0'      # Increase CPU
      memory: 4G       # Increase RAM
```

### Database Optimization

1. Increase PostgreSQL shared buffers:
   ```bash
   docker exec -it erp-postgres sh -c 'echo "shared_buffers = 256MB" >> /var/lib/postgresql/data/postgresql.conf'
   ```

2. Restart PostgreSQL:
   ```bash
   docker-compose -f docker-compose.complete.yml restart postgres
   ```

### Redis Optimization

Increase Redis memory limit in `docker-compose.complete.yml`:

```yaml
command: redis-server --requirepass ${REDIS_PASSWORD:-redis_secure_2024!} --maxmemory 1024mb
```

## 📝 Logs and Monitoring

### View Live Logs

```bash
# All services
docker-compose -f docker-compose.complete.yml logs -f --tail=100

# Specific service with timestamps
docker-compose -f docker-compose.complete.yml logs -f --tail=100 -t backend
```

### Save Logs to File

```bash
docker-compose -f docker-compose.complete.yml logs > system_logs_$(date +%Y%m%d_%H%M%S).log
```

### Monitor Resource Usage

```bash
docker stats
```

## 🎯 Next Steps

1. **Access the Application**: Open http://localhost:8080
2. **Login**: Use one of the default user accounts
3. **Explore Features**: Navigate through the ERP system
4. **Configure**: Customize settings as needed
5. **Backup**: Set up regular database backups

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. View logs for error messages
3. Ensure all services are healthy: `docker-compose -f docker-compose.complete.yml ps`
4. Check Docker Desktop resources (CPU, Memory, Disk)

## 🎉 Success!

Once started, you should see:

```
✅ ERP System Started Successfully!

🌐 Application URLs:
   Frontend:  http://localhost:8080
   Backend:   http://localhost:5001
   PgAdmin:   http://localhost:5050
```

Your ERP Merchandiser System is now running with all data restored from the dump file!

