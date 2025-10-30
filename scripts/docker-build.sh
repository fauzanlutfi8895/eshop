#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== E-Shop Docker Build Script ===${NC}\n"

# Function to build a service
build_service() {
    local service=$1
    echo -e "${YELLOW}Building $service...${NC}"
    
    if docker-compose build $service; then
        echo -e "${GREEN}✓ $service built successfully${NC}\n"
        return 0
    else
        echo -e "${RED}✗ Failed to build $service${NC}\n"
        return 1
    fi
}

# Function to test a service
test_service() {
    local service=$1
    local port=$2
    
    echo -e "${YELLOW}Testing $service on port $port...${NC}"
    
    # Start service
    docker-compose up -d $service
    
    # Wait for service to start
    sleep 5
    
    # Check if container is running
    if docker ps | grep -q $service; then
        echo -e "${GREEN}✓ $service is running${NC}"
        
        # Try to connect to port
        if nc -zv localhost $port 2>&1 | grep -q succeeded; then
            echo -e "${GREEN}✓ $service is responding on port $port${NC}\n"
            return 0
        else
            echo -e "${YELLOW}⚠ $service is running but port $port is not responding${NC}\n"
            docker-compose logs --tail=20 $service
            return 1
        fi
    else
        echo -e "${RED}✗ $service failed to start${NC}\n"
        docker-compose logs --tail=20 $service
        return 1
    fi
}

# Parse command line arguments
BUILD_ALL=false
TEST_MODE=false
SERVICES=()

while [[ $# -gt 0 ]]; do
    case $1 in
        --all)
            BUILD_ALL=true
            shift
            ;;
        --test)
            TEST_MODE=true
            shift
            ;;
        *)
            SERVICES+=("$1")
            shift
            ;;
    esac
done

# Build services
if [ "$BUILD_ALL" = true ]; then
    echo -e "${YELLOW}Building all services...${NC}\n"
    docker-compose build
else
    if [ ${#SERVICES[@]} -eq 0 ]; then
        echo -e "${YELLOW}No services specified. Building all services...${NC}\n"
        docker-compose build
    else
        for service in "${SERVICES[@]}"; do
            build_service $service
        done
    fi
fi

# Test mode
if [ "$TEST_MODE" = true ]; then
    echo -e "${GREEN}=== Running Tests ===${NC}\n"
    
    # Start infrastructure first
    echo -e "${YELLOW}Starting infrastructure services...${NC}"
    docker-compose up -d zookeeper kafka
    sleep 10
    
    # Test backend services
    test_service "auth-service" 3000
    test_service "product-service" 3001
    test_service "user-service" 3002
    test_service "api-gateway" 4000
    
    echo -e "${GREEN}=== Test Complete ===${NC}"
    echo -e "${YELLOW}Check logs with: docker-compose logs -f${NC}"
fi

echo -e "\n${GREEN}=== Build Complete ===${NC}"
echo -e "${YELLOW}To start services: docker-compose up -d${NC}"
echo -e "${YELLOW}To view logs: docker-compose logs -f${NC}"
echo -e "${YELLOW}To stop services: docker-compose down${NC}\n"
