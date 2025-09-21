# Docker Setup for Legal Services Platform

This document provides comprehensive instructions for running the Legal Services Platform using Docker containers.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+

## Quick Start

### Production Environment

1. **Start the application:**
   ```bash
   chmod +x docker-scripts/*.sh
   ./docker-scripts/start-prod.sh
   ```

2. **Access the application:**
   - Frontend: http://localhost:5000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

### Development Environment

1. **Start development environment:**
   ```bash
   ./docker-scripts/start-dev.sh
   ```

2. **Access the application:**
   - Frontend: http://localhost:3001
   - Backend API: http://localhost:8001
   - Database: localhost:5433

## Manual Commands

### Build Containers
```bash
# Build all containers
./docker-scripts/build.sh

# Build specific container
docker build -f Dockerfile.backend -t legal-services-backend .
docker build -f frontend/Dockerfile -t legal-services-frontend ./frontend
```

### Start Services
```bash
# Production
docker-compose up -d

# Development
docker-compose -f docker-compose.dev.yml up -d

# With rebuild
docker-compose up --build -d
```

### Stop Services
```bash
# Stop all services
./docker-scripts/stop.sh

# Or manually
docker-compose down
docker-compose -f docker-compose.dev.yml down
```

## Container Architecture

### Backend (FastAPI)
- **Port:** 8000 (prod) / 8001 (dev)
- **Database:** PostgreSQL
- **Features:**
  - JWT Authentication
  - File Upload (PDF processing)
  - RESTful API
  - Auto-reload in development

### Frontend (Next.js)
- **Port:** 5000 (prod) / 3001 (dev)
- **Features:**
  - Server-side rendering
  - Static optimization
  - Hot reload in development
  - Standalone output for optimization

### Database (PostgreSQL)
- **Port:** 5432 (prod) / 5433 (dev)
- **Features:**
  - Data persistence
  - UUID extensions
  - Encrypted storage

## Environment Variables

Copy and modify environment files:
```bash
# Production
cp .env.docker .env

# Development
cp .env.docker.dev .env
```

## Volume Management

### Data Persistence
- **Database:** `postgres_data` volume
- **Uploads:** `./uploads` directory mounted

### Development Volumes
- **Frontend:** Live code reload
- **Backend:** Live code reload
- **Node modules:** Optimized with named volumes

## Troubleshooting

### Common Issues

1. **Port conflicts:**
   ```bash
   # Check running services
   docker ps
   lsof -i :5000 -i :8000
   ```

2. **Database connection issues:**
   ```bash
   # Check database health
   docker-compose exec postgres pg_isready -U postgres
   ```

3. **Container build issues:**
   ```bash
   # Clean rebuild
   docker-compose down -v
   docker-compose build --no-cache
   ```

### Logs and Debugging
```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Execute commands in containers
docker-compose exec backend bash
docker-compose exec frontend sh
```

### Reset Everything
```bash
# WARNING: This removes all data
docker-compose down -v
docker system prune -a
```

## Production Deployment

For production deployment:

1. **Update environment variables** in `.env.docker`
2. **Configure SSL/TLS** using reverse proxy (nginx/traefik)
3. **Set up monitoring** and logging
4. **Configure backups** for database
5. **Use Docker Swarm** or Kubernetes for orchestration

## Development Workflow

1. **Start development environment**
2. **Make changes** to code (live reload enabled)
3. **Run tests** inside containers
4. **Build and test production** images before deployment

This Docker setup provides a complete, production-ready containerization of your Legal Services Platform.