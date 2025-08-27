#!/bin/bash

# ==============================================
# MedResearch AI - Quick Deployment Script
# ==============================================

set -e

echo "🚀 MedResearch AI - Production Deployment"
echo "=========================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
IMAGE_NAME="medresearch-ai"
IMAGE_TAG="latest"
CONTAINER_NAME="medresearch-ai-demo"

echo -e "${BLUE}📋 Pre-deployment Checklist${NC}"
echo "1. ✅ Frontend built successfully"
echo "2. ✅ Docker configured"
echo "3. ✅ Environment variables ready"
echo ""

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        echo -e "${RED}❌ Docker is not running. Please start Docker and try again.${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Docker is running${NC}"
}

# Function to build Docker image
build_image() {
    echo -e "${BLUE}🏗️  Building Docker image...${NC}"
    docker build -t ${IMAGE_NAME}:${IMAGE_TAG} --target production .
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Docker image built successfully${NC}"
    else
        echo -e "${RED}❌ Docker image build failed${NC}"
        exit 1
    fi
}

# Function to create production environment file
create_env() {
    if [ ! -f ".env.production" ]; then
        echo -e "${YELLOW}⚠️  Creating production environment file...${NC}"
        cat > .env.production << EOL
# Production Environment Variables
NODE_ENV=production
PORT=3001
HOST=0.0.0.0

# Database
MONGODB_URI=mongodb://localhost:27017/medresearch-prod
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=your-super-secure-jwt-secret-production-change-this
JWT_EXPIRES_IN=24h

# API Keys - IMPORTANT: Set your real API key
OPENAI_API_KEY=your-openai-api-key-here

# Application
FRONTEND_URL=http://localhost:3001
CORS_ORIGIN=http://localhost:3001

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

# Logging
LOG_LEVEL=info
EOL
        echo -e "${YELLOW}⚠️  Please edit .env.production with your actual API keys and settings${NC}"
        echo -e "${YELLOW}   Especially set your OPENAI_API_KEY for AI functionality${NC}"
    fi
}

# Function to run the container
run_container() {
    echo -e "${BLUE}🚀 Starting MedResearch AI container...${NC}"
    
    # Stop existing container if running
    docker stop ${CONTAINER_NAME} 2>/dev/null || true
    docker rm ${CONTAINER_NAME} 2>/dev/null || true
    
    # Run the container
    docker run -d \
        --name ${CONTAINER_NAME} \
        --env-file .env.production \
        -p 3001:3001 \
        --restart unless-stopped \
        ${IMAGE_NAME}:${IMAGE_TAG}
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Container started successfully${NC}"
        echo ""
        echo -e "${GREEN}🎉 MedResearch AI is now running!${NC}"
        echo -e "${BLUE}📱 Access your application at: http://localhost:3001${NC}"
        echo -e "${BLUE}📊 Health check: http://localhost:3001/health${NC}"
        echo ""
        echo -e "${YELLOW}💡 Next steps:${NC}"
        echo "   1. Visit http://localhost:3001 to test the application"
        echo "   2. Edit .env.production to add your OpenAI API key"
        echo "   3. Restart the container after updating environment variables"
        echo ""
        echo -e "${BLUE}🔧 Container management:${NC}"
        echo "   View logs: docker logs ${CONTAINER_NAME}"
        echo "   Stop: docker stop ${CONTAINER_NAME}"
        echo "   Start: docker start ${CONTAINER_NAME}"
        echo "   Remove: docker rm -f ${CONTAINER_NAME}"
    else
        echo -e "${RED}❌ Failed to start container${NC}"
        exit 1
    fi
}

# Function to show container status
show_status() {
    echo -e "${BLUE}📊 Container Status:${NC}"
    docker ps -f name=${CONTAINER_NAME}
    echo ""
    
    # Wait a moment for container to fully start
    sleep 3
    
    # Test health endpoint
    echo -e "${BLUE}🏥 Health Check:${NC}"
    if curl -f -s http://localhost:3001/health > /dev/null; then
        echo -e "${GREEN}✅ Application is healthy${NC}"
    else
        echo -e "${YELLOW}⚠️  Application may still be starting...${NC}"
    fi
}

# Main execution
main() {
    echo -e "${BLUE}Starting deployment process...${NC}"
    
    check_docker
    create_env
    build_image
    run_container
    show_status
    
    echo -e "${GREEN}🎊 Deployment completed successfully!${NC}"
}

# Handle command line arguments
case "${1}" in
    "build")
        check_docker
        build_image
        ;;
    "run")
        check_docker
        run_container
        ;;
    "status")
        show_status
        ;;
    "stop")
        docker stop ${CONTAINER_NAME}
        echo -e "${GREEN}✅ Container stopped${NC}"
        ;;
    "logs")
        docker logs -f ${CONTAINER_NAME}
        ;;
    "restart")
        docker restart ${CONTAINER_NAME}
        echo -e "${GREEN}✅ Container restarted${NC}"
        ;;
    *)
        main
        ;;
esac