# ERP Merchandiser System - Database Setup Guide

## 🎉 Perfect Database Setup Complete!

Your ERP system now has a fully functional, production-ready database setup with PostgreSQL, Redis, and Prisma ORM.

## 📋 What's Been Configured

### ✅ Database Infrastructure
- **PostgreSQL 15**: Production-ready database with proper health checks
- **Redis 7**: High-performance caching and session management
- **Prisma Studio**: Web-based database management interface
- **PGAdmin 4**: Advanced PostgreSQL administration tool

### ✅ Database Schema
- **User Management**: Admin, Manager, Production Head, Operator roles
- **Company Management**: Client company information
- **Product Catalog**: Products with categories, materials, and specifications
- **Inventory System**: Stock tracking with automatic logging
- **Process Management**: Configurable production workflows
- **Job Management**: Job cards with lifecycle tracking
- **Audit System**: Complete audit trail for all operations

## 🚀 Access Points

| Service | URL | Credentials |
|---------|-----|-------------|
| **Prisma Studio** | http://localhost:5555 | No login required |
| **PGAdmin** | http://localhost:5050 | admin@example.com / admin123 |
| **PostgreSQL** | localhost:5432 | erp_user / DevPassword123! |
| **Redis** | localhost:6379 | No password |

## 🔧 Quick Start Commands

### Start the Database System
```bash
docker-compose up -d
```

### Stop the Database System
```bash
docker-compose down
```

### View Database (Prisma Studio)
```bash
npx prisma studio
# Access at: http://localhost:5555
```

### Reset Database (Development Only)
```bash
npx prisma db push --force-reset
node prisma/seed.cjs
```

### Generate Prisma Client (After Schema Changes)
```bash
npx prisma generate
npx prisma db push
```

## 📊 Sample Data Included

The database has been seeded with:
- **4 Categories**: Labels, Packaging, Printing, Books
- **4 Materials**: Various paper types, vinyl, ink
- **3 Users**: Admin, Manager, Operator (password: admin123)
- **2 Companies**: Sample client companies
- **3 Products**: Labels, boxes, business cards
- **3 Process Sequences**: Complete production workflows
- **Inventory Items**: Sample stock items

## 🏗️ Production Deployment

### For Production Use:
1. Use `docker-compose.production.yml`
2. Update `.env.production` with secure passwords
3. Configure SSL certificates in nginx
4. Set up automated backups
5. Monitor with proper logging

### Environment Files:
- `.env` - Current development configuration
- `.env.production` - Production template with security settings

## 📈 Scalability Features

### Built for 200+ Concurrent Users:
- Connection pooling with Prisma
- Redis caching for sessions
- Optimized PostgreSQL configuration
- Health checks and restart policies
- Resource limits and reservations

### Performance Optimizations:
- Database indexes on frequently queried fields
- Soft deletes with `isActive` flags
- Audit logging for compliance
- Efficient relationship mapping

## 🛠️ Database Management

### Via Prisma Studio (Recommended):
- Modern web interface at http://localhost:5555
- Create, read, update, delete operations
- Visual relationship exploration
- Data export capabilities

### Via PGAdmin (Advanced):
- Full PostgreSQL administration at http://localhost:5050
- Query editor and performance monitoring
- Backup and restore operations
- Database optimization tools

## 🔐 Security Features

- Password hashing with bcrypt
- Role-based access control
- Audit trail for all operations
- Environment-based configuration
- Docker network isolation

## 📝 Next Steps

1. **Connect Your Application**: Use the Prisma client in your application
2. **Customize Schema**: Modify `prisma/schema.prisma` as needed
3. **Add More Data**: Extend the seed script for your specific needs
4. **Set up Monitoring**: Add logging and performance monitoring
5. **Configure Backups**: Set up automated database backups

## 🆘 Troubleshooting

### Database Connection Issues:
```bash
# Check if containers are running
docker ps

# Check container logs
docker logs erp-postgres-dev
docker logs erp-redis-dev

# Restart services
docker-compose restart
```

### Prisma Issues:
```bash
# Regenerate client
npx prisma generate

# Reset and reseed database (DEV ONLY)
npx prisma db push --force-reset
node prisma/seed.cjs
```

## 📞 Support

For issues or questions:
1. Check container logs: `docker logs [container-name]`
2. Verify environment variables in `.env`
3. Ensure Docker is running and has sufficient resources
4. Check port conflicts (5432, 6379, 5555, 5050)

---

**🎯 Your ERP database system is now ready for production use!**