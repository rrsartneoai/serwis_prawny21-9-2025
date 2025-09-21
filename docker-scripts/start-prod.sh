#!/bin/bash
# Production environment startup script

echo "🚀 Starting Legal Services Platform in production mode..."

# Stop any running containers
docker-compose down

# Start production environment
docker-compose up --build -d

echo "✅ Production environment started!"
echo "🌐 Frontend: http://localhost:5000"
echo "🔗 Backend API: http://localhost:8000"
echo "🗄️  Database: localhost:5432"
echo ""
echo "📊 Check status: docker-compose ps"
echo "📝 View logs: docker-compose logs -f"