#!/bin/bash

# WeAD Platform - Local Development Runner
# This script runs the platform on localhost:5000

echo "🚀 Starting WeAD Platform (Local Development)..."

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from template...${NC}"
    if [ -f env.local.example ]; then
        cp env.local.example .env
        echo -e "${GREEN}✅ Created .env from env.local.example${NC}"
        echo -e "${YELLOW}📝 Please edit .env with your configuration${NC}"
    else
        echo -e "${YELLOW}⚠️  env.local.example not found. Using default values.${NC}"
    fi
fi

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    echo -e "${BLUE}📦 Activating virtual environment...${NC}"
    source venv/bin/activate
else
    echo -e "${YELLOW}⚠️  Virtual environment not found. Creating one...${NC}"
    python3 -m venv venv
    source venv/bin/activate
    echo -e "${BLUE}📦 Installing dependencies...${NC}"
    pip install -r requirements.txt
fi

# Check if required services are running
echo -e "${BLUE}🔍 Checking required services...${NC}"

# Check PostgreSQL
if ! pg_isready -q 2>/dev/null; then
    echo -e "${YELLOW}⚠️  PostgreSQL is not running. Please start it:${NC}"
    echo "   sudo service postgresql start"
fi

# Check Redis
if ! redis-cli ping > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Redis is not running. Please start it:${NC}"
    echo "   sudo service redis-server start"
fi

echo ""
echo -e "${GREEN}✅ Starting WeAD Platform...${NC}"
echo ""
echo "📍 Local URLs:"
echo "   http://localhost:5000"
echo "   http://127.0.0.1:5000"
echo ""
echo "🛑 Press CTRL+C to stop"
echo ""

# Run the application
python bot.py





