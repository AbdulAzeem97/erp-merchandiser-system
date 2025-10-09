#!/bin/bash

# ===================================================================
# Complete Docker Deployment Script
# ===================================================================
# One-command deployment for ERP Merchandiser System
# ===================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  ERP Merchandiser System - Docker Setup${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker is installed${NC}"

# Check if .env exists, if not create from example
if [ ! -f ".env" ]; then
    if [ -f "env.docker.example" ]; then
        cp env.docker.example .env
        echo -e "${YELLOW}📝 Created .env file from env.docker.example${NC}"
        echo -e "${YELLOW}⚠️  Please review .env file and update passwords if needed${NC}"
        echo ""
    else
        echo -e "${RED}❌ env.docker.example not found${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ .env file exists${NC}"
fi

# Create necessary directories
echo -e "${BLUE}📁 Creating necessary directories...${NC}"
mkdir -p logs uploads init-db
echo -e "${GREEN}✅ Directories created${NC}"
echo ""

# Stop existing containers if any
echo -e "${YELLOW}🛑 Stopping existing containers...${NC}"
docker-compose -f docker-compose.complete.yml down 2>/dev/null || true
echo ""

# Pull latest images
echo -e "${BLUE}📥 Pulling Docker images...${NC}"
docker-compose -f docker-compose.complete.yml pull 2>/dev/null || true
echo ""

# Build images
echo -e "${BLUE}🔨 Building Docker images...${NC}"
docker-compose -f docker-compose.complete.yml build --no-cache
echo -e "${GREEN}✅ Images built successfully${NC}"
echo ""

# Start containers
echo -e "${BLUE}🚀 Starting containers...${NC}"
docker-compose -f docker-compose.complete.yml up -d
echo ""

# Wait for services to be healthy
echo -e "${YELLOW}⏳ Waiting for services to be ready...${NC}"
echo -e "${YELLOW}   This may take 30-60 seconds...${NC}"
sleep 10

# Check container status
echo ""
echo -e "${BLUE}📊 Container Status:${NC}"
docker-compose -f docker-compose.complete.yml ps
echo ""

# Check PostgreSQL health
echo -e "${BLUE}🔍 Checking PostgreSQL...${NC}"
for i in {1..30}; do
    if docker-compose -f docker-compose.complete.yml exec -T postgres pg_isready -U postgres &>/dev/null; then
        echo -e "${GREEN}✅ PostgreSQL is ready${NC}"
        break
    fi
    echo -e "${YELLOW}   Waiting... ($i/30)${NC}"
    sleep 2
done

# Check backend health
echo -e "${BLUE}🔍 Checking Backend API...${NC}"
for i in {1..30}; do
    if curl -f http://localhost:5001/api/health &>/dev/null; then
        echo -e "${GREEN}✅ Backend API is ready${NC}"
        break
    fi
    echo -e "${YELLOW}   Waiting... ($i/30)${NC}"
    sleep 2
done

# Check frontend health
echo -e "${BLUE}🔍 Checking Frontend...${NC}"
for i in {1..30}; do
    if curl -f http://localhost:8080 &>/dev/null; then
        echo -e "${GREEN}✅ Frontend is ready${NC}"
        break
    fi
    echo -e "${YELLOW}   Waiting... ($i/30)${NC}"
    sleep 2
done

# Display success message
echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  ✅ Deployment Completed Successfully!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "${BLUE}📝 Access Information:${NC}"
echo -e "   Frontend:  ${YELLOW}http://localhost:8080${NC}"
echo -e "   Backend:   ${YELLOW}http://localhost:5001${NC}"
echo -e "   Database:  ${YELLOW}localhost:5432${NC}"
echo ""
echo -e "${BLUE}👥 Default User Credentials:${NC}"
echo -e "   Admin:              admin@horizonsourcing.com / admin123"
echo -e "   HOD Prepress:       hod.prepress@horizonsourcing.com / hod123"
echo -e "   Designer:           designer@horizonsourcing.com / designer123"
echo -e "   QA Prepress:        qa.prepress@horizonsourcing.com / qa123"
echo -e "   CTP Operator:       ctp.operator@horizonsourcing.com / ctp123"
echo -e "   Inventory Manager:  inventory.manager@horizonsourcing.com / inventory123"
echo -e "   Procurement Manager: procurement.manager@horizonsourcing.com / procurement123"
echo ""
echo -e "${YELLOW}⚠️  Change all default passwords after first login!${NC}"
echo ""
echo -e "${BLUE}🔧 Useful Commands:${NC}"
echo -e "   View logs:          docker-compose -f docker-compose.complete.yml logs -f"
echo -e "   Stop services:      docker-compose -f docker-compose.complete.yml down"
echo -e "   Restart services:   docker-compose -f docker-compose.complete.yml restart"
echo -e "   View database:      docker-compose -f docker-compose.complete.yml exec postgres psql -U postgres -d erp_merchandiser"
echo ""
echo -e "${GREEN}🎉 Your ERP System is now running!${NC}"
echo -e "${GREEN}   Open http://localhost:8080 in your browser${NC}"
echo ""

