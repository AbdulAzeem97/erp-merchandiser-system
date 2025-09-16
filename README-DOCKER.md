# ERP Merchandiser System - Docker PostgreSQL Setup

This document provides comprehensive instructions for running the ERP Merchandiser System with PostgreSQL in Docker containers.

## 🚀 Quick Start

### Prerequisites
- Docker Desktop installed and running
- Docker Compose (included with Docker Desktop)
- At least 2GB available RAM
- Ports 5001, 5432, 8080, 8081 available

### Start the System

#### Windows (PowerShell)
```powershell
.\docker-start.ps1
```

#### Linux/Mac (Bash)
```bash
chmod +x docker-start.sh
./docker-start.sh
```

#### Manual Start
```bash
docker-compose -f docker-compose.postgresql.yml up --build -d
```

## 📋 System Components

| Component | Port | URL | Description |
|-----------|------|-----|-------------|
| Backend API | 5001 | http://localhost:5001 | Express.js REST API |
| Frontend | 8080 | http://localhost:8080 | React Frontend (Production) |
| PostgreSQL | 5432 | localhost:5432 | Database Server |
| pgAdmin | 8081 | http://localhost:8081 | Database Management |

## 🔐 Default Credentials

### pgAdmin
- **Email:** admin@erp.local
- **Password:** admin123

### PostgreSQL Database
- **Host:** localhost (or postgres in Docker)
- **Port:** 5432
- **Database:** erp_merchandiser
- **Username:** erp_user
- **Password:** DevPassword123!

## 🗄️ Database Schema

The PostgreSQL database includes:

### Core Tables
- `users` - System users and authentication
- `companies` - Client companies
- `products` - Product catalog
- `materials` - Raw materials and supplies
- `product_categories` - Product classification

### Production Tables
- `job_cards` - Production jobs
- `process_steps` - Manufacturing steps
- `process_sequences` - Step sequences
- `job_lifecycle` - Job tracking
- `inventory` - Stock management

### Features
- **JSONB columns** for flexible metadata storage
- **Automatic timestamps** with triggers
- **Foreign key constraints** for data integrity
- **Indexes** for performance optimization
- **Sample data** for testing

## 🔧 Management Commands

### View Logs
```bash
# All services
docker-compose -f docker-compose.postgresql.yml logs -f

# Specific service
docker-compose -f docker-compose.postgresql.yml logs -f erp_backend
docker-compose -f docker-compose.postgresql.yml logs -f postgres
```

### Stop System
```bash
docker-compose -f docker-compose.postgresql.yml down
```

### Restart Services
```bash
docker-compose -f docker-compose.postgresql.yml restart
```

### Remove Volumes (Reset Database)
```bash
docker-compose -f docker-compose.postgresql.yml down -v
docker volume prune -f
```

### Scale Services
```bash
# Run multiple backend instances
docker-compose -f docker-compose.postgresql.yml up --scale erp_backend=3 -d
```

## 🔍 Health Monitoring

### Health Checks
All services include health checks:
- **PostgreSQL:** `pg_isready` command
- **Backend:** HTTP health endpoint
- **Frontend:** Nginx status

### Check Service Health
```bash
docker-compose -f docker-compose.postgresql.yml ps
```

### Monitor Resources
```bash
docker stats
```

## 🛠️ Development

### Local Development with Docker Database
1. Start only PostgreSQL:
```bash
docker-compose -f docker-compose.postgresql.yml up postgres pgadmin -d
```

2. Run backend locally:
```bash
npm run server
```

3. Run frontend locally:
```bash
npm run dev
```

### Database Migrations
Migrations run automatically on container startup. For manual migration:

```bash
# Connect to backend container
docker exec -it erp_backend sh

# Run migration
node server/database/migrate.js
```

### Backup Database
```bash
# Create backup
docker exec erp_postgres pg_dump -U erp_user -d erp_merchandiser > backup.sql

# Restore backup
docker exec -i erp_postgres psql -U erp_user -d erp_merchandiser < backup.sql
```

## 📊 Performance Tuning

### PostgreSQL Configuration
The PostgreSQL container is optimized for development. For production:

1. Update `docker-compose.postgresql.yml`
2. Add PostgreSQL configuration file
3. Adjust memory settings
4. Enable logging

### Resource Limits
```yaml
services:
  postgres:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
        reservations:
          memory: 1G
```

## 🚨 Troubleshooting

### Common Issues

#### Port Conflicts
```bash
# Check port usage
netstat -an | findstr :5432
netstat -an | findstr :5001

# Stop conflicting services
net stop postgresql-x64-14
```

#### Database Connection Issues
1. Verify PostgreSQL is running: `docker-compose ps`
2. Check logs: `docker-compose logs postgres`
3. Test connection: `docker exec -it erp_postgres psql -U erp_user -d erp_merchandiser`

#### Frontend Not Loading
1. Check backend health: http://localhost:5001/health
2. Verify nginx configuration
3. Check browser console for errors

#### Memory Issues
```bash
# Free up Docker resources
docker system prune -a
docker volume prune
```

### Reset Everything
```bash
# Nuclear option - removes all containers, images, and volumes
docker-compose -f docker-compose.postgresql.yml down -v --remove-orphans
docker system prune -a -f
docker volume prune -f
```

## 🔒 Security Notes

### Production Deployment
1. Change all default passwords
2. Use environment-specific `.env` files
3. Enable HTTPS/TLS
4. Configure firewall rules
5. Use secrets management
6. Regular security updates

### Network Security
- Services communicate on isolated Docker network
- Database not exposed to external network by default
- Frontend serves through reverse proxy

## 📈 Scaling

### Horizontal Scaling
```bash
# Scale backend services
docker-compose -f docker-compose.postgresql.yml up --scale erp_backend=3 -d

# Add load balancer (nginx)
# Update docker-compose.yml with nginx service
```

### Database Scaling
- Master-slave replication
- Connection pooling
- Read replicas

## 📱 API Documentation

The backend API is available at http://localhost:5001 with endpoints:

- `GET /health` - Health check
- `POST /api/auth/login` - Authentication
- `GET /api/products` - Product catalog
- `GET /api/jobs` - Job cards
- `GET /api/dashboard` - Dashboard data

## 🎯 Next Steps

1. **Monitor Performance:** Set up monitoring with Prometheus/Grafana
2. **CI/CD Pipeline:** Implement automated deployment
3. **Backup Strategy:** Automated database backups
4. **SSL/TLS:** Enable HTTPS for production
5. **Logging:** Centralized log management
6. **Testing:** Automated integration tests