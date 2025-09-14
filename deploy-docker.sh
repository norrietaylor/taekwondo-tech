#!/bin/bash

# Taekwondo Robot Builder - Docker Deployment Script
# This script builds and pushes the Docker image to Docker Hub

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="taekwondo-robot-builder"
DOCKER_HUB_USERNAME="${DOCKER_HUB_USERNAME:-}"
VERSION="${VERSION:-latest}"

# Function to print colored output
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}$message${NC}"
}

print_message $BLUE "🥋 Taekwondo Robot Builder - Docker Deployment"
print_message $BLUE "=============================================="

# Check if Docker is installed and running
if ! command -v docker &> /dev/null; then
    print_message $RED "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! docker info &> /dev/null; then
    print_message $RED "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Get Docker Hub username if not set
if [ -z "$DOCKER_HUB_USERNAME" ]; then
    print_message $YELLOW "📝 Please enter your Docker Hub username:"
    read -r DOCKER_HUB_USERNAME
    if [ -z "$DOCKER_HUB_USERNAME" ]; then
        print_message $RED "❌ Docker Hub username is required"
        exit 1
    fi
fi

# Check if user is logged in to Docker Hub
print_message $BLUE "🔐 Checking Docker Hub authentication..."
if ! docker info | grep -q "Username:"; then
    print_message $YELLOW "⚠️  Not logged in to Docker Hub. Attempting login..."
    if ! docker login; then
        print_message $RED "❌ Failed to login to Docker Hub"
        exit 1
    fi
fi

# Build the Docker image
print_message $BLUE "🏗️  Building Docker image..."
IMAGE_TAG="$DOCKER_HUB_USERNAME/$APP_NAME:$VERSION"
LATEST_TAG="$DOCKER_HUB_USERNAME/$APP_NAME:latest"

print_message $BLUE "Building: $IMAGE_TAG"

if docker build -t "$IMAGE_TAG" -t "$LATEST_TAG" .; then
    print_message $GREEN "✅ Docker image built successfully!"
else
    print_message $RED "❌ Failed to build Docker image"
    exit 1
fi

# Show image details
print_message $BLUE "📊 Image details:"
docker images | grep "$DOCKER_HUB_USERNAME/$APP_NAME" | head -2

# Test the image locally (optional)
print_message $YELLOW "🧪 Would you like to test the image locally before pushing? (y/n)"
read -r test_locally
if [[ $test_locally =~ ^[Yy]$ ]]; then
    print_message $BLUE "🚀 Starting container for local testing..."
    CONTAINER_ID=$(docker run -d -p 8080:80 --name taekwondo-test "$IMAGE_TAG")
    
    # Wait a moment for the container to start
    sleep 3
    
    if docker ps | grep -q "$CONTAINER_ID"; then
        print_message $GREEN "✅ Container started successfully!"
        print_message $GREEN "🎮 Test the game at: http://localhost:8080"
        print_message $YELLOW "Press Enter when you're done testing to continue..."
        read -r
    else
        print_message $RED "❌ Container failed to start"
        docker logs "$CONTAINER_ID" || true
        exit 1
    fi
    
    # Clean up test container
    print_message $BLUE "🧹 Cleaning up test container..."
    docker stop "$CONTAINER_ID" &> /dev/null || true
    docker rm "$CONTAINER_ID" &> /dev/null || true
fi

# Push to Docker Hub
print_message $BLUE "📤 Pushing to Docker Hub..."
print_message $BLUE "Pushing: $IMAGE_TAG"

if docker push "$IMAGE_TAG"; then
    print_message $GREEN "✅ Successfully pushed $IMAGE_TAG"
else
    print_message $RED "❌ Failed to push $IMAGE_TAG"
    exit 1
fi

# Push latest tag if version is not latest
if [ "$VERSION" != "latest" ]; then
    print_message $BLUE "Pushing: $LATEST_TAG"
    if docker push "$LATEST_TAG"; then
        print_message $GREEN "✅ Successfully pushed $LATEST_TAG"
    else
        print_message $RED "❌ Failed to push $LATEST_TAG"
        exit 1
    fi
fi

# Success message with deployment instructions
print_message $GREEN ""
print_message $GREEN "🎉 Deployment completed successfully!"
print_message $GREEN "======================================="
print_message $GREEN ""
print_message $BLUE "📋 Your Docker image is now available at:"
print_message $GREEN "   docker pull $IMAGE_TAG"
print_message $GREEN ""
print_message $BLUE "🚀 To run your game anywhere:"
print_message $GREEN "   docker run -d -p 80:80 --name taekwondo-game $IMAGE_TAG"
print_message $GREEN ""
print_message $BLUE "🌐 Then access it at: http://localhost"
print_message $GREEN ""
print_message $BLUE "🔗 Docker Hub repository:"
print_message $GREEN "   https://hub.docker.com/r/$DOCKER_HUB_USERNAME/$APP_NAME"

# Optional: Create a docker-compose.yml for easy deployment
print_message $YELLOW "📝 Would you like to create a docker-compose.yml for easy deployment? (y/n)"
read -r create_compose
if [[ $create_compose =~ ^[Yy]$ ]]; then
    cat > docker-compose.yml << EOF
version: '3.8'

services:
  taekwondo-game:
    image: $IMAGE_TAG
    container_name: taekwondo-robot-builder
    ports:
      - "80:80"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

# To run: docker-compose up -d
# To stop: docker-compose down
# To update: docker-compose pull && docker-compose up -d
EOF
    print_message $GREEN "✅ Created docker-compose.yml for easy deployment"
    print_message $BLUE "💡 Use 'docker-compose up -d' to start the application"
fi

print_message $GREEN ""
print_message $GREEN "🥋 Happy gaming! Your taekwondo adventure awaits!"
