# Kancelaria Project - Legal Services Platform

## Overview
This is a full-stack legal services platform built with Next.js frontend and FastAPI backend. The application helps users analyze legal documents and provides professional legal assistance.

## Project Structure
- **Frontend**: Next.js 14 application located in `/frontend` directory
- **Backend**: FastAPI application located in `/app` directory
- **Database**: SQLite database with SQLAlchemy ORM models

## Current Configuration
- **Frontend**: Running on port 5000 with proper Replit configuration
- **Backend**: FastAPI with CORS configured for all origins (Replit environment)
- **Deployment**: Configured for autoscale deployment targeting the frontend

## Recent Changes (September 21, 2025)
- ✅ GitHub import project setup completed successfully
- ✅ Installed Python 3.11 and Node.js 20 modules
- ✅ Cleaned up duplicate requirements.txt entries
- ✅ Installed all Python backend dependencies (FastAPI, Uvicorn, SQLAlchemy, etc.)
- ✅ Installed all Node.js frontend dependencies
- ✅ Configured backend workflow on port 8000 with localhost binding
- ✅ Configured frontend workflow on port 5000 with 0.0.0.0 binding
- ✅ Both workflows are now running successfully
- ✅ Backend responding with HTTP 200 OK status on port 8000
- ✅ Frontend Next.js server ready on port 5000, compiling pages correctly
- ✅ Verified Next.js configuration is compatible with Replit environment
- ✅ Configured autoscale deployment settings for production
- ✅ Application accessible and functional through web interface

## Technologies Used
### Frontend
- Next.js 14.2.5
- React 18.3.1
- TypeScript
- Tailwind CSS
- shadcn/ui components
- Zustand for state management
- Supabase client

### Backend
- FastAPI 0.111.0
- SQLAlchemy 2.0.30
- Pydantic for data validation
- Python-JOSE for JWT authentication
- Passlib for password hashing

## User Preferences
- Uses Polish language for content
- Professional legal services theme
- Clean, modern UI design with blue color scheme
- Mobile-responsive design

## Project Architecture
- **Monorepo structure** with separate frontend and backend directories
- **API-first approach** with OpenAPI specification
- **Component-based** React architecture with reusable UI components
- **Type-safe** development with TypeScript
- **Responsive design** using Tailwind CSS

## Environment Setup
- Configured for Replit cloud environment
- Frontend serves on port 5000 with 0.0.0.0 binding
- Backend supports CORS for all origins
- Development and production ready