# Docker Deployment Guide

This guide explains how to package and deploy the Taekwondo Robot Builder game using Docker.

## Prerequisites

1. **Docker**: Install Docker Desktop from [docker.com](https://www.docker.com/products/docker-desktop/)
2. **Docker Hub Account**: Create a free account at [hub.docker.com](https://hub.docker.com/)

## Quick Start

1. **Make sure Docker is running**:
   - Start Docker Desktop on your machine
   - Verify Docker is running: `docker --version`

2. **Run the deployment script**:
   ```bash
   ./deploy-docker.sh
   ```

3. **Follow the prompts**:
   - Enter your Docker Hub username when asked
   - Login to Docker Hub if not already logged in
   - Optionally test locally before pushing
   - The script will build and push your image automatically

## Environment Variables

You can set these environment variables to customize the deployment:

```bash
export DOCKER_HUB_USERNAME="your-username"  # Your Docker Hub username
export VERSION="v1.0.0"                     # Version tag (defaults to "latest")
```

## Manual Deployment Steps

If you prefer to run the commands manually:

### 1. Build the Docker image
```bash
docker build -t your-username/taekwondo-robot-builder:latest .
```

### 2. Test locally (optional)
```bash
docker run -d -p 8080:80 --name taekwondo-test your-username/taekwondo-robot-builder:latest
# Visit http://localhost:8080 to test
docker stop taekwondo-test && docker rm taekwondo-test
```

### 3. Push to Docker Hub
```bash
docker login
docker push your-username/taekwondo-robot-builder:latest
```

## Running the Deployed Game

Once pushed to Docker Hub, anyone can run your game with:

```bash
docker run -d -p 80:80 --name taekwondo-game your-username/taekwondo-robot-builder:latest
```

Then visit: http://localhost

## Using Docker Compose

The deployment script can optionally create a `docker-compose.yml` file for easier management:

```bash
# Start the game
docker-compose up -d

# Stop the game  
docker-compose down

# Update to latest version
docker-compose pull && docker-compose up -d
```

## Files Created

The Docker setup includes these files:

- `Dockerfile` - Instructions for building the Docker image
- `.dockerignore` - Excludes unnecessary files from the build
- `deploy-docker.sh` - Automated deployment script
- `docker-compose.yml` - (Optional) Easy deployment configuration

## Image Details

- **Base Image**: nginx:alpine (lightweight web server)
- **Port**: 80 (standard HTTP port)
- **Size**: ~25MB (optimized for production)
- **Features**: 
  - Gzip compression enabled
  - Static asset caching
  - Health checks included
  - Optimized nginx configuration

## Troubleshooting

### Docker daemon not running
```
ERROR: Cannot connect to the Docker daemon
```
**Solution**: Start Docker Desktop

### Permission denied
```
docker: permission denied
```
**Solution**: On Linux, add your user to the docker group:
```bash
sudo usermod -aG docker $USER
```

### Login failed
```
Error response from daemon: unauthorized
```
**Solution**: Login to Docker Hub:
```bash
docker login
```

### Build failed
**Check**:
- All required files are present
- Docker has enough disk space
- Network connection is stable

## Security Notes

- The nginx configuration is optimized for serving static files
- No sensitive data is included in the image
- Health checks monitor application status
- The container runs with minimal privileges

## Support

For issues with Docker deployment, check:
1. Docker Desktop is running and updated
2. Network connectivity to Docker Hub
3. Sufficient disk space for image building
4. Docker Hub credentials are correct
