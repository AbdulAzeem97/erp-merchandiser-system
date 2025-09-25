# ERP Merchandiser System

A complete, production-ready ERP system for merchandising and production management with PostgreSQL database, proper authentication, and full CRUD operations.

## 🚀 Features

### Core Functionality
- **User Authentication & Authorization** - JWT-based secure authentication
- **Product Management** - Complete CRUD operations for products
- **Job Card Management** - Production job tracking and management
- **Company/Client Management** - Customer relationship management
- **Dashboard Analytics** - Real-time production metrics and insights
- **File Upload System** - Secure file handling for job attachments
- **PDF Generation** - Professional job card PDF generation
- **Audit Logging** - Complete activity tracking
- **Audit Loggin** -

### Technical Features
- **PostgreSQL Database** - Properly normalized schema
- **Express.js Backend** - RESTful API with proper error handling
- **React Frontend** - Modern UI with TypeScript
- **Security** - Helmet, CORS, Rate limiting, Input validation
- **Production Ready** - Environment configuration, logging, monitoring

## 📋 Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn package manager

## 🛠️ Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd erp-merchandiser-system
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Database Setup

#### Create PostgreSQL Database
```sql
CREATE DATABASE erp_merchandiser;
CREATE USER erp_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE erp_merchandiser TO erp_user;
```

#### Environment Configuration
Copy the example environment file:
```bash
cp env.example .env
```

Edit `.env` with your database credentials:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=erp_merchandiser
DB_USER=erp_user
DB_PASSWORD=your_secure_password

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### 4. Database Migration
```bash
npm run db:migrate
```

### 5. Seed Database
```bash
npm run db:seed
```

This creates:
- Admin user (email: admin@erp.local, password: admin123)
- Sample companies (Nike, Adidas, Puma, Under Armour)
- Product categories and materials
- Departments and process types
- Quality checkpoints and cost categories

## 🚀 Running the Application

### Development Mode
```bash
# Run both frontend and backend
npm run dev:full

# Or run separately
npm run server  # Backend on port 5000
npm run dev     # Frontend on port 5173
```

### Production Mode
```bash
npm run build
npm run server
```

## 📊 Database Schema

### Core Tables
- **users** - User authentication and profiles
- **companies** - Client/customer information
- **products** - Product master data
- **job_cards** - Production job orders
- **materials** - Raw material specifications
- **departments** - Organizational structure
- **process_types** - Production processes
- **quality_checkpoints** - Quality control points

### Relationship Tables
- **process_sequences** - Product type to process mapping
- **job_process_status** - Job progress tracking
- **job_quality_checks** - Quality control status
- **job_costs** - Cost tracking
- **job_attachments** - File attachments

### Audit & Logging
- **audit_log** - Complete activity tracking

## 🔐 Authentication

### Default Admin Account
- **Email**: admin@erp.local
- **Password**: admin123

### User Roles
- **admin** - Full system access
- **manager** - Management operations
- **user** - Standard user access

## 📁 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout

### Products
- `GET /api/products` - List products with pagination
- `POST /api/products` - Create new product
- `GET /api/products/:id` - Get product details
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `GET /api/products/stats/summary` - Product statistics

### Jobs
- `GET /api/jobs` - List job cards
- `POST /api/jobs` - Create new job card
- `GET /api/jobs/:id` - Get job details
- `PUT /api/jobs/:id` - Update job card
- `DELETE /api/jobs/:id` - Delete job card

### Companies
- `GET /api/companies` - List companies
- `POST /api/companies` - Create new company
- `GET /api/companies/:id` - Get company details
- `PUT /api/companies/:id` - Update company
- `DELETE /api/companies/:id` - Delete company

### Dashboard
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/dashboard/recent-jobs` - Recent job cards
- `GET /api/dashboard/production-metrics` - Production metrics

## 🔧 Configuration

### Environment Variables
- `DB_HOST` - PostgreSQL host
- `DB_PORT` - PostgreSQL port
- `DB_NAME` - Database name
- `DB_USER` - Database user
- `DB_PASSWORD` - Database password
- `JWT_SECRET` - JWT signing secret
- `PORT` - Server port
- `NODE_ENV` - Environment (development/production)
- `FRONTEND_URL` - Frontend URL for CORS

### Security Features
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **Rate Limiting** - API request throttling
- **Input Validation** - Request data validation
- **SQL Injection Protection** - Parameterized queries
- **XSS Protection** - Cross-site scripting prevention

## 📈 Production Deployment

### 1. Environment Setup
```bash
NODE_ENV=production
JWT_SECRET=your-production-secret-key
DB_HOST=your-production-db-host
DB_PASSWORD=your-production-db-password
```

### 2. Build Application
```bash
npm run build
```

### 3. Database Migration
```bash
npm run db:migrate
```

### 4. Start Server
```bash
npm run server
```

### 5. Reverse Proxy (Nginx)
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🧪 Testing

### API Testing
```bash
# Test health endpoint
curl http://localhost:5000/health

# Test authentication
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@erp.local","password":"admin123"}'
```

## 📝 Development

### Project Structure
```
├── src/                    # Frontend React application
│   ├── components/         # React components
│   ├── utils/             # Utility functions
│   └── types/             # TypeScript type definitions
├── server/                # Backend Express application
│   ├── database/          # Database configuration and migrations
│   ├── middleware/        # Express middleware
│   ├── routes/            # API routes
│   └── uploads/           # File upload directory
├── public/                # Static assets
└── dist/                  # Production build output
```

### Adding New Features
1. Create database migration if needed
2. Add API routes in `server/routes/`
3. Create React components in `src/components/`
4. Update TypeScript types in `src/types/`
5. Test thoroughly

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔄 Updates

### Version 1.0.0
- Initial release with complete ERP functionality
- PostgreSQL database with proper normalization
- JWT authentication system
- Full CRUD operations for all entities
- Professional PDF generation
- Dashboard with analytics
- File upload system
- Audit logging
- Production-ready configuration

---

**Built with ❤️ for efficient merchandising and production management**
