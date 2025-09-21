#!/bin/bash
# Development environment startup script

echo "🚀 Starting Legal Services Platform in development mode..."

# Stop any running containers
docker-compose -f docker-compose.dev.yml down

# Remove old volumes (optional - uncomment if you want fresh database)
# docker-compose -f docker-compose.dev.yml down -v

# Start development environment
docker-compose -f docker-compose.dev.yml up --build

echo "✅ Development environment started!"
echo "🌐 Frontend: http://localhost:3001"
echo "🔗 Backend API: http://localhost:8001"
echo "🗄️  Database: localhost:5433"