#!/bin/bash

# ERP Merchandiser System - Docker Startup Script
# This script starts the complete PostgreSQL-based ERP system using Docker

echo "🚀 Starting ERP Merchandiser System with PostgreSQL..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.postgresql.yml down

# Remove any dangling containers and volumes (optional)
read -p "🗑️  Remove existing volumes? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🧹 Cleaning up volumes..."
    docker volume prune -f
    docker-compose -f docker-compose.postgresql.yml down -v
fi

# Build and start services
echo "🔨 Building and starting services..."
docker-compose -f docker-compose.postgresql.yml up --build -d

# Wait for services to be healthy
echo "⏳ Waiting for services to start..."
sleep 10

# Check service status
echo "📊 Service Status:"
docker-compose -f docker-compose.postgresql.yml ps

# Display service URLs
echo ""
echo "✅ ERP Merchandiser System is running!"
echo ""
echo "📍 Service URLs:"
echo "   🖥️  Backend API:     http://localhost:5001"
echo "   🌐 Frontend:        http://localhost:8080"
echo "   🗄️  pgAdmin:        http://localhost:8081"
echo "   💾 PostgreSQL:     localhost:5432"
echo ""
echo "🔐 Default Credentials:"
echo "   pgAdmin: admin@erp.local / admin123"
echo "   Database: erp_user / DevPassword123!"
echo ""
echo "📋 Management Commands:"
echo "   View logs:    docker-compose -f docker-compose.postgresql.yml logs -f"
echo "   Stop system:  docker-compose -f docker-compose.postgresql.yml down"
echo "   Restart:      docker-compose -f docker-compose.postgresql.yml restart"
echo ""

# Optional: Open browser
read -p "🌐 Open frontend in browser? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if command -v xdg-open > /dev/null; then
        xdg-open http://localhost:8080
    elif command -v open > /dev/null; then
        open http://localhost:8080
    else
        echo "Please open http://localhost:8080 in your browser"
    fi
fi