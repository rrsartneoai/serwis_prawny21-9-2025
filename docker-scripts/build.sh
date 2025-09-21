#!/bin/bash
# Build script for Legal Services Platform Docker containers

echo "🐳 Building Legal Services Platform Docker containers..."

# Build backend
echo "📦 Building backend container..."
docker build -f Dockerfile.backend -t legal-services-backend:latest .

# Build frontend
echo "📦 Building frontend container..."
docker build -f frontend/Dockerfile -t legal-services-frontend:latest ./frontend

echo "✅ Build completed!"
echo ""
echo "To run the application:"
echo "  Production: docker-compose up"
echo "  Development: docker-compose -f docker-compose.dev.yml up"