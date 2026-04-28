#!/bin/bash

# PWA & Desktop App Setup Script
# This script helps generate icons and set up the project

echo "🚀 Oraka PWA & Desktop App Setup"
echo "=================================="
echo ""

# Check if Node is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js found: $(node --version)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed"
echo ""

# Create icon directories
echo "📁 Creating icon directories..."
mkdir -p public/icons
mkdir -p public/screenshots

echo "✅ Directories created"
echo ""

# Check if we can use ImageMagick for icon generation
if command -v convert &> /dev/null; then
    echo "🖼️  ImageMagick found. Creating sample icons..."
    
    # Create a simple colored square as placeholder if no logo exists
    if [ ! -f "public/icon.svg" ]; then
        echo "Creating placeholder icon..."
        convert -size 512x512 xc:'#1890ff' public/icon-512x512.png
        convert -size 192x192 xc:'#1890ff' public/icon-192x192.png
        echo "✅ Placeholder icons created (replace with your logo)"
    fi
else
    echo "⚠️  ImageMagick not found. Skipping icon generation."
    echo "   Please add these icon files manually to public/icons/:"
    echo "   - icon-192x192.png"
    echo "   - icon-512x512.png"
    echo "   - icon-maskable-192x192.png"
    echo "   - icon-maskable-512x512.png"
fi

echo ""
echo "=================================="
echo "✅ Setup Complete!"
echo ""
echo "📖 Next Steps:"
echo "1. Review QUICK_START_PWA_DESKTOP.md"
echo "2. Add icon files to public/icons/"
echo "3. Run: npm run dev (for PWA)"
echo "4. Run: npm run start:electron (for Desktop)"
echo "5. Run: npm run build:electron:win (to build installer)"
echo ""
echo "📚 Documentation:"
echo "- QUICK_START_PWA_DESKTOP.md (Start here!)"
echo "- PWA_ELECTRON_SETUP.md (Detailed guide)"
echo "- BACKEND_INTEGRATION.md (Django integration)"
echo ""
