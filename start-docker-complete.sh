#!/bin/bash
# Bash script to start the complete ERP system with Docker using dump file
# This script will start all services including database restoration from dump

set -e

echo "========================================"
echo "  ERP Merchandiser System - Docker     "
echo "  Complete Setup with Database Restore "
echo "========================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Check if Docker is running
echo -e "${YELLOW}🔍 Checking Docker...${NC}"
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
    echo -e "${YELLOW}   Download Docker from: https://www.docker.com/products/docker-desktop${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker is running${NC}"

# Check if dump file exists
echo -e "${YELLOW}🔍 Checking for database dump file...${NC}"
if [ ! -f "erp_merchandiser_backup.dump" ]; then
    echo -e "${RED}❌ Database dump file not found: erp_merchandiser_backup.dump${NC}"
    echo -e "${YELLOW}   Please ensure the dump file is in the root directory.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Dump file found${NC}"

# Check if docker-compose.complete.yml exists
if [ ! -f "docker-compose.complete.yml" ]; then
    echo -e "${RED}❌ docker-compose.complete.yml not found${NC}"
    exit 1
fi

# Stop any running containers
echo ""
echo -e "${YELLOW}🛑 Stopping any existing containers...${NC}"
docker-compose -f docker-compose.complete.yml down 2>/dev/null || true

# Clean up old volumes (optional)
read -p "Do you want to clean up old volumes? This will DELETE all existing data. (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}🧹 Removing old volumes...${NC}"
    docker-compose -f docker-compose.complete.yml down -v
    echo -e "${GREEN}✅ Old volumes removed${NC}"
fi

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo ""
    echo -e "${YELLOW}📝 Creating .env file...${NC}"
    if [ -f "env.example" ]; then
        cp env.example .env
        echo -e "${GREEN}✅ .env file created from env.example${NC}"
        echo -e "${YELLOW}⚠️  Please review and update .env file with your settings${NC}"
    fi
fi

# Build and start containers
echo ""
echo -e "${YELLOW}🏗️  Building Docker images...${NC}"
echo -e "${CYAN}   This may take several minutes on first run...${NC}"

docker-compose -f docker-compose.complete.yml build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Docker build failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker images built successfully${NC}"

echo ""
echo -e "${YELLOW}🚀 Starting containers...${NC}"
docker-compose -f docker-compose.complete.yml up -d

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to start containers${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}⏳ Waiting for services to be healthy...${NC}"
echo -e "${CYAN}   This may take 1-2 minutes...${NC}"

# Wait for services to be healthy
sleep 10

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  ✅ ERP System Started Successfully!  ${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${CYAN}🌐 Application URLs:${NC}"
echo -e "   Frontend:  http://localhost:8080"
echo -e "   Backend:   http://localhost:5001"
echo -e "   PgAdmin:   http://localhost:5050"
echo -e "              Email: admin@erp.local"
echo -e "              Password: admin123"
echo ""
echo -e "${CYAN}📊 Database Info:${NC}"
echo -e "   Host:      localhost"
echo -e "   Port:      5432"
echo -e "   Database:  erp_merchandiser"
echo -e "   User:      erp_user"
echo -e "   Password:  DevPassword123!"
echo ""
echo -e "${CYAN}📋 Useful Commands:${NC}"
echo -e "   View logs:     docker-compose -f docker-compose.complete.yml logs -f"
echo -e "   Stop system:   docker-compose -f docker-compose.complete.yml down"
echo -e "   Restart:       docker-compose -f docker-compose.complete.yml restart"
echo -e "   Status:        docker-compose -f docker-compose.complete.yml ps"
echo ""
echo -e "${GREEN}🎉 System is ready to use!${NC}"
echo ""

# Ask if user wants to view logs
read -p "Do you want to view the logs? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo -e "${YELLOW}📜 Showing logs (Press Ctrl+C to exit)...${NC}"
    docker-compose -f docker-compose.complete.yml logs -f
fi

