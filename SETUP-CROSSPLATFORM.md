# Cross-Platform Setup Guide - Legal Services Platform

## Overview
This guide provides instructions for setting up the Legal Services Platform on different operating systems (Windows, macOS, Linux).

## Prerequisites

### Windows
```bash
# Install Windows Subsystem for Linux (WSL2) - Recommended
wsl --install

# Or use Windows native tools:
# - Install Python 3.11 from python.org
# - Install Node.js 20 from nodejs.org  
# - Install Git for Windows
# - Install Docker Desktop
```

### macOS
```bash
# Install Homebrew if not already installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install required tools
brew install python@3.11 node@20 git docker
```

### Linux (Ubuntu/Debian)
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Python 3.11
sudo apt install python3.11 python3.11-venv python3.11-dev -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Docker
sudo apt-get install docker.io docker-compose -y
sudo systemctl start docker
sudo systemctl enable docker
```

## Environment Setup

### 1. Clone Repository
```bash
git clone [your-repo-url]
cd legal-services-platform
```

### 2. Backend Setup
```bash
# Create virtual environment (all platforms)
python3.11 -m venv venv

# Activate virtual environment
# Windows (Command Prompt):
venv\\Scripts\\activate

# Windows (PowerShell):
venv\\Scripts\\Activate.ps1

# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run build
```

### 4. Database Setup

#### Option A: Using Docker (Recommended)
```bash
# Start PostgreSQL with Docker
docker-compose up postgres -d

# Run migrations
cd app
alembic upgrade head
```

#### Option B: Local PostgreSQL Installation

**Windows:**
- Download PostgreSQL from postgresql.org
- Install and set password
- Create database: `legal_services`

**macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
createdb legal_services
```

**Linux:**
```bash
sudo apt install postgresql postgresql-contrib -y
sudo systemctl start postgresql
sudo -u postgres createdb legal_services
```

## Platform-Specific Notes

### Windows Specific
- Use PowerShell or Command Prompt as Administrator
- If using WSL2, all Linux commands apply
- Docker Desktop requires Hyper-V enabled
- Path separators: Use `\\` in batch files, `/` in PowerShell

### macOS Specific  
- Install Xcode Command Line Tools: `xcode-select --install`
- Homebrew handles most dependencies automatically
- Use Terminal or iTerm2 for commands

### Linux Specific
- Add user to docker group: `sudo usermod -aG docker $USER`
- Logout and login again for Docker permissions
- Install build tools: `sudo apt install build-essential -y`

## Running the Application

### Development Mode
```bash
# Terminal 1 - Backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

### Production Mode with Docker
```bash
# Build and run all services
docker-compose up --build

# Or run in background
docker-compose up -d --build
```

## Environment Variables

Create `.env` file in project root:
```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/legal_services

# JWT Secret
SECRET_KEY=your-secret-key-here

# External APIs
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
GOOGLE_AI_API_KEY=your-google-ai-key

# Email (if using SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com  
SMTP_PASSWORD=your-app-password
```

## Troubleshooting

### Common Issues

**Port Already in Use:**
```bash
# Find process using port (Linux/macOS)
lsof -i :8000

# Find process using port (Windows)
netstat -ano | findstr :8000

# Kill process
kill -9 [PID]  # Linux/macOS
taskkill /F /PID [PID]  # Windows
```

**Permission Errors:**
```bash
# Linux/macOS - Fix permissions
sudo chown -R $USER:$USER .
chmod +x scripts/*.sh

# Windows - Run as Administrator
# Right-click Command Prompt -> "Run as Administrator"
```

**Docker Issues:**
```bash
# Reset Docker (if needed)
docker system prune -a
docker-compose down --volumes
docker-compose up --build
```

**Python Virtual Environment:**
```bash
# If venv doesn't work, try:
python3 -m pip install virtualenv
python3 -m virtualenv venv
```

## Testing Cross-Platform Compatibility

Run these commands on each platform to verify setup:

```bash
# Check versions
python --version  # Should show 3.11.x
node --version    # Should show v20.x.x
npm --version

# Test backend
python -c "import fastapi, sqlalchemy, pydantic; print('Backend OK')"

# Test frontend
cd frontend && npm list --depth=0

# Test database connection
python -c "from app.db.database import engine; print('Database OK')"
```

## Performance Recommendations

### Windows
- Use WSL2 for better performance
- Enable Windows Defender exclusions for project folder
- Use SSD for project storage

### macOS
- Increase Docker memory allocation to 4GB+
- Use Rosetta 2 if on Apple Silicon (M1/M2)

### Linux  
- Configure swap space (8GB+ recommended)
- Use systemd for auto-startup services
- Monitor disk space for Docker volumes

## Support

For platform-specific issues:
1. Check this guide first
2. Search GitHub issues
3. Create detailed bug report with:
   - Operating System & Version
   - Python/Node.js versions
   - Error messages
   - Steps to reproduce