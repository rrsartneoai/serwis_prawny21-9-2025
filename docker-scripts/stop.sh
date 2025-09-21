#!/bin/bash
# Stop all Legal Services Platform containers

echo "🛑 Stopping Legal Services Platform containers..."

# Stop production containers
docker-compose down

# Stop development containers
docker-compose -f docker-compose.dev.yml down

echo "✅ All containers stopped!"

# Optional: Remove all volumes (uncomment if you want to reset database)
# echo "🗑️  Removing volumes..."
# docker-compose down -v
# docker-compose -f docker-compose.dev.yml down -v