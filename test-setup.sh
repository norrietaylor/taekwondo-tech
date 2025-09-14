#!/bin/bash

# Taekwondo Robot Builder - Test Setup Script

echo "🥋 Setting up testing environment for Taekwondo Robot Builder"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are available"

# Install Playwright
echo "📦 Installing Playwright for browser automation testing..."
npm install

# Install Playwright browsers
echo "🌐 Installing browser binaries..."
npx playwright install

echo ""
echo "🎉 Test setup complete!"
echo ""
echo "Available test commands:"
echo "  npm test              - Run all tests headless"
echo "  npm run test:headed   - Run tests with browser visible"
echo "  npm run test:debug    - Run tests in debug mode"
echo "  npm start             - Start local development server"
echo ""
echo "Manual testing:"
echo "  1. Run 'npm start' to start the server"
echo "  2. Open http://localhost:8000 in your browser"
echo "  3. Test the game manually"
echo ""
echo "Automated testing:"
echo "  1. Run 'npm test' to execute all automated tests"
echo "  2. Check test results in the 'test-results' directory"
echo ""
