#!/bin/bash
# Docker Start Script for ERP Merchandiser System
# This script will start the complete ERP system with database restoration

set -e

echo "========================================"
echo "ERP Merchandiser System - Docker Setup"
echo "========================================"
echo ""

# Check if Docker is running
echo "Checking Docker status..."
if ! docker info > /dev/null 2>&1; then
    echo "Error: Docker is not running. Please start Docker and try again."
    exit 1
fi
echo "Docker is running!"
echo ""

# Navigate to script directory
cd "$(dirname "$0")"

# Create .env.docker file if it doesn't exist
if [ ! -f ".env.docker" ]; then
    echo "Creating .env.docker file..."
    cp env.docker.template .env.docker
    echo ".env.docker file created successfully!"
else
    echo ".env.docker file already exists."
fi
echo ""

# Check if dump file exists
DUMP_PATH="../erp_merchandiser_backup.dump"
if [ ! -f "$DUMP_PATH" ]; then
    echo "Warning: Dump file not found at $DUMP_PATH"
    echo "The system will start but the database will be empty."
    read -p "Do you want to continue? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 0
    fi
else
    echo "Dump file found: $DUMP_PATH"
fi
echo ""

# Make init-db.sh executable
chmod +x init-db.sh

# Stop any existing containers
echo "Stopping any existing containers..."
docker-compose -f docker-compose.full.yml down
echo ""

# Build and start services
echo "Building and starting services..."
echo "This may take a few minutes on first run..."
docker-compose -f docker-compose.full.yml up --build -d

if [ $? -eq 0 ]; then
    echo ""
    echo "========================================"
    echo "ERP System is starting up!"
    echo "========================================"
    echo ""
    echo "Services will be available at:"
    echo "  - Frontend:  http://localhost:8080"
    echo "  - Backend:   http://localhost:5001"
    echo "  - Database:  localhost:5432"
    echo "  - Redis:     localhost:6379"
    echo ""
    echo "To view logs, run:"
    echo "  docker-compose -f docker-compose.full.yml logs -f"
    echo ""
    echo "To stop the system, run:"
    echo "  docker-compose -f docker-compose.full.yml down"
    echo ""
    echo "Waiting for services to be healthy (this may take 1-2 minutes)..."
    sleep 30
    
    echo ""
    echo "Checking service status..."
    docker-compose -f docker-compose.full.yml ps
    
else
    echo ""
    echo "Error: Failed to start services"
    echo "Check the logs for more details:"
    echo "  docker-compose -f docker-compose.full.yml logs"
    exit 1
fi


