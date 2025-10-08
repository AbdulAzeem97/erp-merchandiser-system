#!/bin/bash

# ===================================================================
# Automated Database Setup Script
# ===================================================================
# This script automates the complete database setup process
# Run this on a fresh server with PostgreSQL installed
# ===================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration (can be overridden by environment variables)
DB_NAME="${DB_NAME:-erp_merchandiser}"
DB_USER="${DB_USER:-postgres}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  ERP Merchandiser System - Database Setup${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# Function to print colored messages
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# Check if PostgreSQL is installed
echo -e "${BLUE}[1/7] Checking PostgreSQL installation...${NC}"
if command -v psql >/dev/null 2>&1; then
    print_success "PostgreSQL is installed"
    psql --version
else
    print_error "PostgreSQL is not installed. Please install PostgreSQL 12+ first."
    exit 1
fi

# Check if Node.js is installed
echo ""
echo -e "${BLUE}[2/7] Checking Node.js installation...${NC}"
if command -v node >/dev/null 2>&1; then
    print_success "Node.js is installed"
    node --version
else
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if database exists, if not create it
echo ""
echo -e "${BLUE}[3/7] Creating database...${NC}"
DB_EXISTS=$(psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" 2>/dev/null || echo "0")

if [ "$DB_EXISTS" = "1" ]; then
    print_info "Database '$DB_NAME' already exists"
    read -p "Do you want to drop and recreate it? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -c "DROP DATABASE $DB_NAME;"
        psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -c "CREATE DATABASE $DB_NAME;"
        print_success "Database recreated"
    fi
else
    psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -c "CREATE DATABASE $DB_NAME;"
    print_success "Database created: $DB_NAME"
fi

# Install npm dependencies
echo ""
echo -e "${BLUE}[4/7] Installing Node.js dependencies...${NC}"
if [ -f "package.json" ]; then
    npm install
    print_success "Dependencies installed"
else
    print_error "package.json not found. Are you in the project root directory?"
    exit 1
fi

# Check if .env file exists
echo ""
echo -e "${BLUE}[5/7] Checking environment configuration...${NC}"
if [ ! -f ".env" ]; then
    if [ -f "env.example" ]; then
        cp env.example .env
        print_info ".env file created from env.example"
        print_info "Please edit .env file with your database credentials"
        read -p "Press Enter to continue after editing .env..."
    else
        print_error ".env file not found. Please create one with database credentials."
        exit 1
    fi
else
    print_success ".env file exists"
fi

# Run database schema setup
echo ""
echo -e "${BLUE}[6/7] Setting up database schema...${NC}"
if [ -f "database-setup-complete.sql" ]; then
    PGPASSWORD="$DB_PASSWORD" psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -f database-setup-complete.sql
    print_success "Database schema created"
else
    print_error "database-setup-complete.sql not found"
    exit 1
fi

# Seed database with initial data
echo ""
echo -e "${BLUE}[7/7] Seeding database with initial data...${NC}"
if [ -f "seed-complete-database.js" ]; then
    node seed-complete-database.js
    print_success "Database seeded successfully"
else
    print_error "seed-complete-database.js not found"
    exit 1
fi

# Success message
echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  ✅ Database Setup Completed Successfully!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "${YELLOW}📝 Default User Credentials:${NC}"
echo ""
echo "Admin:              admin@horizonsourcing.com / admin123"
echo "HOD Prepress:       hod.prepress@horizonsourcing.com / hod123"
echo "Designer:           designer@horizonsourcing.com / designer123"
echo "QA Prepress:        qa.prepress@horizonsourcing.com / qa123"
echo "CTP Operator:       ctp.operator@horizonsourcing.com / ctp123"
echo "Inventory Manager:  inventory.manager@horizonsourcing.com / inventory123"
echo "Procurement Manager: procurement.manager@horizonsourcing.com / procurement123"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: Change all default passwords in production!${NC}"
echo ""
echo -e "${BLUE}🚀 Next Steps:${NC}"
echo "  1. Start backend:  npm run server"
echo "  2. Start frontend: npm run dev"
echo "  3. Open browser:   http://localhost:8080"
echo ""

