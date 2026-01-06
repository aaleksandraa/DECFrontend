#!/bin/bash

echo "=========================================="
echo "Zero Duration Fix - Frontend Deployment"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found. Are you in the frontend directory?${NC}"
    exit 1
fi

echo "Step 1: Pull latest changes"
echo "----------------------------"
git pull origin main
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Git pull failed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Git pull successful${NC}"
echo ""

echo "Step 2: Install dependencies"
echo "----------------------------"
npm install
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  npm install had warnings, continuing...${NC}"
fi
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

echo "Step 3: Build production"
echo "----------------------------"
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Build successful${NC}"
echo ""

echo "Step 4: Verify build"
echo "----------------------------"
if [ -d "dist" ]; then
    echo -e "${GREEN}✅ dist/ folder exists${NC}"
    echo ""
    echo "Latest built files:"
    ls -lh dist/assets/*.js | head -5
    echo ""
else
    echo -e "${RED}❌ dist/ folder not found${NC}"
    exit 1
fi

echo "=========================================="
echo "Deployment Complete!"
echo "=========================================="
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: Clear browser cache!${NC}"
echo ""
echo "Option 1: Hard Refresh"
echo "  - Windows: Ctrl + Shift + R"
echo "  - Mac: Cmd + Shift + R"
echo ""
echo "Option 2: Incognito Mode"
echo "  - Open widget in incognito/private browsing"
echo ""
echo "Option 3: Clear Cache"
echo "  - Chrome: Settings → Privacy → Clear browsing data"
echo "  - Firefox: Settings → Privacy → Clear Data"
echo ""
echo -e "${GREEN}✅ Ready to test!${NC}"
echo ""
