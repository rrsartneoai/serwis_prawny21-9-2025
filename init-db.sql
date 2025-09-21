-- Database initialization script for Legal Services Platform
-- This script runs when the PostgreSQL container is first created

-- Create extensions if they don't exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Grant permissions to postgres user
GRANT ALL PRIVILEGES ON DATABASE legal_services TO postgres;

-- Create initial schema (tables will be created by SQLAlchemy)
-- This file ensures the database is properly initialized