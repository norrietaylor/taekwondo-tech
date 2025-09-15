#!/bin/bash

# Taekwondo Robot Builder - Server Restart Script

echo "🔄 Restarting game server..."

# Stop any existing server on port 8000
echo "Stopping existing server..."
pkill -f "python3 -m http.server 8000" 2>/dev/null
sleep 1


# Start fresh server
echo "Starting new server on port 8000..."
python3 -m http.server 8000 &

# Wait a moment for server to start
sleep 2

# Test if server is running
if curl -s -o /dev/null -w "%{http_code}" http://localhost:8000 | grep -q "200"; then
    echo "✅ Server restarted successfully!"
    echo "🎮 Game available at: http://localhost:8000"
else
    echo "❌ Server failed to start"
    exit 1
fi
