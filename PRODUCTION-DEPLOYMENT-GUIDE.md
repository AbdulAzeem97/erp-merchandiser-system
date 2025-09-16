# 🚀 **ERP Merchandiser System - Production Deployment Guide**

## **📋 Overview**

This guide provides complete instructions for deploying the ERP Merchandiser System in a production-ready environment with PostgreSQL, Redis, and comprehensive monitoring.

---

## **📋 Prerequisites**

### **Required Software**
- **Docker Desktop** - Latest version with Docker Compose
- **Node.js** - Version 18 or higher
- **npm** - Version 8 or higher
- **Git** - For version control

### **System Requirements**
- **RAM**: Minimum 8GB, Recommended 16GB
- **Storage**: Minimum 10GB free space
- **CPU**: Multi-core processor recommended
- **Network**: Open ports 5000, 5432, 6379, 5050

### **Environment Setup**
- Windows 10/11, macOS, or Linux
- Administrator/sudo privileges
- Internet connection for downloading dependencies

---

## **🏗️ Architecture Overview**

```
┌─────────────────────────────────────────────────────────┐
│                 ERP Merchandiser System                 │
├─────────────────────┬───────────────────────────────────┤
│                     │                                   │
│  Frontend (React)   │  Backend (Express.js + Node.js)  │
│  Port: 5173/3000    │  Port: 5000/5001                 │
│                     │                                   │
└─────────────────────┼───────────────────────────────────┘
                      │
┌─────────────────────┼───────────────────────────────────┐
│                     │                                   │
│  PostgreSQL         │  Redis Cache                      │
│  Port: 5432         │  Port: 6379                       │
│                     │                                   │
└─────────────────────┼───────────────────────────────────┘
                      │
┌─────────────────────┼───────────────────────────────────┐
│                     │                                   │
│  PgAdmin            │  Monitoring & Logs                │
│  Port: 5050         │  Docker Compose Logs              │
│                     │                                   │
└─────────────────────┴───────────────────────────────────┘
```

---

## **🚀 Quick Start Deployment**

### **Option 1: Automated Deployment (Recommended)**

```powershell
# Clone the repository
git clone <repository-url>
cd erp-merchandiser-system

# Run automated deployment
.\deploy-production.ps1 -Environment production

# Or for development
.\deploy-production.ps1 -Environment development
```

### **Option 2: Manual Step-by-Step**

#### **Step 1: Install Dependencies**
```bash
npm install
```

#### **Step 2: Start PostgreSQL with Docker**
```bash
docker-compose up -d postgres redis pgadmin
```

#### **Step 3: Run Database Migration**
```bash
node complete-migration.js
```

#### **Step 4: Build Application**
```bash
# For production
npm run build

# For development
npm run build:dev
```

#### **Step 5: Start the System**
```bash
# Full system (frontend + backend)
npm run dev:full

# Or separately
npm run server  # Backend only
npm run dev     # Frontend only
```

---

## **🔧 Configuration Management**

### **Environment Variables**

Create/update `.env` file with appropriate values:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=erp_merchandiser
DB_USER=erp_user
DB_PASSWORD=YourSecurePassword123!

# Application Configuration
JWT_SECRET=your-super-secure-jwt-secret-change-in-production
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://your-domain.com

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=YourRedisPassword123!

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./server/uploads

# Email Configuration (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### **Production Environment Variables**

For production deployment, ensure these are properly configured:

```env
NODE_ENV=production
JWT_SECRET=ComplexProductionJWTSecret123!@#$%
DB_PASSWORD=ComplexDatabasePassword123!@#$%
REDIS_PASSWORD=ComplexRedisPassword123!@#$%
FRONTEND_URL=https://yourdomain.com
```

---

## **🗄️ Database Setup**

### **PostgreSQL Configuration**

The system uses PostgreSQL with the following structure:

- **Database**: `erp_merchandiser`
- **User**: `erp_user`
- **Schema**: Complete ERP schema with 25+ tables
- **Features**: UUIDs, JSONB, Materialized Views, Triggers

### **Migration Process**

The migration script handles:

1. **Schema Creation**: All tables, indexes, constraints
2. **Data Migration**: SQLite to PostgreSQL (if applicable)
3. **Seed Data**: Default users, companies, products
4. **Views**: Materialized views for performance
5. **Triggers**: Automated audit logging

```bash
# Run migration with force clean (development only)
node complete-migration.js --force

# Standard migration
node complete-migration.js
```

### **Database Access**

- **PgAdmin**: http://localhost:5050
  - Email: `admin@erp.local`
  - Password: `admin123`
- **Direct Connection**:
  - Host: `localhost:5432`
  - Database: `erp_merchandiser`
  - User: `erp_user`

---

## **🔐 Default Credentials**

### **System Administrator**
- **Email**: `admin@horizonsourcing.com`
- **Password**: `admin123`
- **Role**: ADMIN

### **Department Heads**
- **HOD Prepress**: `alex.kumar@horizonsourcing.com` / `password123`
- **Head of Production**: `mike.rodriguez@horizonsourcing.com` / `password123`
- **Head of Merchandising**: `sarah.chen@horizonsourcing.com` / `password123`

### **Staff Users**
- **Designer**: `emma.wilson@horizonsourcing.com` / `password123`
- **Merchandiser**: `tom.anderson@horizonsourcing.com` / `password123`
- **QA Manager**: `qa.manager@horizonsourcing.com` / `password123`

---

## **📊 Production Features**

### **Performance Optimizations**
- **Database Connection Pooling**: 10 concurrent connections
- **Redis Caching**: Session and data caching
- **Materialized Views**: Pre-computed statistics
- **Database Indexes**: Optimized query performance
- **GZIP Compression**: Reduced payload sizes

### **Security Features**
- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcrypt with salt rounds
- **CORS Protection**: Configured allowed origins
- **Rate Limiting**: API request throttling
- **Input Validation**: Comprehensive data validation
- **SQL Injection Prevention**: Parameterized queries

### **Monitoring & Logging**
- **Health Checks**: `/health` endpoint
- **Audit Logging**: Complete activity tracking
- **Error Logging**: Structured error capture
- **Performance Metrics**: Response time monitoring
- **Database Logging**: Query performance tracking

---

## **🔄 Workflow Management**

### **Complete Job Lifecycle**
```
Job Creation → Prepress → Inventory → Production → QA → Dispatch
```

### **Department Structure**
- **Merchandising**: Job creation and client management
- **Prepress**: Design, die plate, and artwork preparation
- **Inventory**: Material management and procurement
- **Production**: Multi-department manufacturing
- **Quality Assurance**: Quality control and compliance
- **Dispatch**: Packaging and shipping

### **Real-time Features**
- **Live Notifications**: Instant status updates
- **Socket.IO Integration**: Real-time collaboration
- **Dashboard Updates**: Live metrics and KPIs
- **Progress Tracking**: Visual workflow progress

---

## **🧪 Testing & Quality Assurance**

### **Test Suite**
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run integration tests
npm run test:integration

# Watch mode for development
npm run test:watch
```

### **Test Categories**
- **Unit Tests**: Component and function testing
- **Integration Tests**: API endpoint testing
- **End-to-End Tests**: Complete workflow testing
- **Performance Tests**: Load and stress testing

### **Quality Metrics**
- **Code Coverage**: 70% minimum threshold
- **Test Pass Rate**: 100% required for deployment
- **Performance Benchmarks**: Sub-second API responses
- **Security Scans**: Automated vulnerability checks

---

## **📈 Scaling & Performance**

### **Database Scaling**
- **Connection Pooling**: Configurable pool size
- **Read Replicas**: For high-read workloads
- **Partitioning**: Table partitioning for large datasets
- **Indexing Strategy**: Optimized for query patterns

### **Application Scaling**
- **Horizontal Scaling**: Load balancer ready
- **Caching Strategy**: Multi-layer caching
- **Asset Optimization**: Minified and compressed assets
- **CDN Integration**: Static asset distribution

### **Monitoring Setup**
```bash
# Check container status
docker-compose ps

# View logs
docker-compose logs postgres
docker-compose logs redis
docker-compose logs app

# Monitor resource usage
docker stats
```

---

## **🔒 Security Best Practices**

### **Production Security Checklist**
- [ ] Change all default passwords
- [ ] Set strong JWT secret
- [ ] Configure HTTPS/SSL
- [ ] Set up firewall rules
- [ ] Enable database encryption
- [ ] Configure backup encryption
- [ ] Set up monitoring alerts
- [ ] Regular security updates

### **Access Control**
- **Role-Based Permissions**: 6 user roles with granular permissions
- **API Security**: JWT tokens with expiration
- **Database Security**: Encrypted connections and credentials
- **File Upload Security**: Type and size validation

---

## **💾 Backup & Recovery**

### **Database Backup**
```bash
# Create backup
docker exec erp-postgres-dev pg_dump -U erp_user erp_merchandiser > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
docker exec -i erp-postgres-dev psql -U erp_user erp_merchandiser < backup_file.sql
```

### **Complete System Backup**
```bash
# Backup everything
docker-compose down
tar -czf erp_backup_$(date +%Y%m%d).tar.gz \
    .env \
    server/uploads/ \
    docker-compose.yml \
    backup_latest.sql

# Restore
tar -xzf erp_backup_DATE.tar.gz
docker-compose up -d
```

### **Automated Backups**
Set up scheduled backups using cron (Linux/macOS) or Task Scheduler (Windows):

```bash
# Daily backup at 2 AM
0 2 * * * /path/to/backup-script.sh
```

---

## **🐛 Troubleshooting**

### **Common Issues**

#### **Database Connection Failed**
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Check logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres
```

#### **Port Already in Use**
```bash
# Check what's using the port
netstat -an | findstr :5432
# or
lsof -i :5432

# Kill process or change port in docker-compose.yml
```

#### **Migration Failed**
```bash
# Force clean migration (development only)
node complete-migration.js --force

# Check database status
docker exec -it erp-postgres-dev psql -U erp_user erp_merchandiser
```

#### **Frontend Build Failed**
```bash
# Clear node modules and reinstall
rm -rf node_modules
npm install

# Clear cache
npm run clean
npm run build
```

### **Log Locations**
- **Application Logs**: Console output
- **PostgreSQL Logs**: `docker-compose logs postgres`
- **Redis Logs**: `docker-compose logs redis`
- **Docker Logs**: `docker-compose logs`

---

## **📚 Additional Resources**

### **Documentation**
- **API Documentation**: Available at `/api/docs` (when running)
- **Database Schema**: See `server/database/init/01-create-database.sql`
- **User Manual**: See `USER-MANUAL.md`
- **Development Guide**: See `DEVELOPMENT.md`

### **Support**
- **Issue Reporting**: GitHub Issues
- **Documentation Updates**: Pull requests welcome
- **Community Support**: Discord/Slack channels

---

## **🎉 Success Verification**

After deployment, verify these endpoints:

1. **Health Check**: http://localhost:5000/health
   ```json
   {"status": "OK", "timestamp": "...", "environment": "production"}
   ```

2. **Login Test**: http://localhost:5000/api/auth/login
   ```bash
   curl -X POST http://localhost:5000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@horizonsourcing.com","password":"admin123"}'
   ```

3. **Database Connection**: Check PgAdmin at http://localhost:5050

4. **Frontend Access**: http://localhost:3000 (development) or your domain (production)

---

**🎊 Congratulations! Your ERP Merchandiser System is now production-ready!**

For additional support or questions, please refer to the documentation or open an issue in the repository.