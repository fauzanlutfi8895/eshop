# Docker Build and Deployment Scripts

## Prerequisites

1. Docker and Docker Compose installed
2. Node.js 20+ installed
3. Environment variables configured

## Environment Setup

Create a `.env` file in the root directory with your configuration:

```env
# Database
DATABASE_URL=your_database_url

# Add other environment variables as needed
```

Create `.env` files for each UI application:

- `apps/user-ui/.env`
- `apps/seller-ui/.env`
- `apps/admin-ui/.env`

## Local Testing (Before Docker)

### Test individual services locally:

```bash
# Build all services
npm run build:all

# Test individual service
npx nx serve auth-service
npx nx serve product-service
npx nx serve user-ui
# etc...
```

## Docker Build Commands

### Build all services:

```bash
docker-compose build
```

### Build specific service:

```bash
docker-compose build auth-service
docker-compose build user-ui
```

### Build with no cache (clean build):

```bash
docker-compose build --no-cache
```

## Running Services

### Start all services:

```bash
docker-compose up
```

### Start in detached mode (background):

```bash
docker-compose up -d
```

### Start specific services:

```bash
docker-compose up auth-service product-service api-gateway
```

### View logs:

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f auth-service
```

### Stop services:

```bash
docker-compose down
```

### Stop and remove volumes:

```bash
docker-compose down -v
```

## Testing in Docker

### 1. Build and test one service at a time:

```bash
# Build and run auth-service
docker-compose up --build auth-service

# Check if it's running
curl http://localhost:3000/health
```

### 2. Progressive testing:

```bash
# Infrastructure first
docker-compose up -d zookeeper kafka

# Then backend services one by one
docker-compose up -d auth-service
docker-compose up -d product-service
docker-compose up -d user-service

# API Gateway
docker-compose up -d api-gateway

# Frontend services
docker-compose up -d user-ui
```

### 3. Health checks:

```bash
# Check service status
docker-compose ps

# Inspect service
docker inspect auth-service

# Check service logs
docker logs auth-service
```

## Service Endpoints

After running `docker-compose up`:

### Infrastructure:

- Kafka: `localhost:9092`
- Kafdrop (Kafka UI): `http://localhost:9000`
- Zookeeper: `localhost:2181`

### Backend Services:

- Auth Service: `http://localhost:3000`
- Product Service: `http://localhost:3001`
- User Service: `http://localhost:3002`
- Admin Service: `http://localhost:3003`
- Order Service: `http://localhost:3004`
- Seller Service: `http://localhost:3005`
- Recommendation Service: `http://localhost:3006`
- Chatting Service: `http://localhost:3007`
- Kafka Service: `http://localhost:3008`
- Logger Service: `http://localhost:3009`
- API Gateway: `http://localhost:4000`

### Frontend Services:

- User UI: `http://localhost:3010`
- Seller UI: `http://localhost:3011`
- Admin UI: `http://localhost:3012`

## Troubleshooting

### Service won't start:

```bash
# Check logs
docker-compose logs service-name

# Rebuild without cache
docker-compose build --no-cache service-name

# Remove and rebuild
docker-compose down
docker-compose up --build service-name
```

### Database connection issues:

1. Ensure DATABASE_URL is correct in .env
2. Run Prisma migrations before building:

```bash
npx prisma migrate deploy
npx prisma generate
```

### Out of disk space:

```bash
# Clean up Docker
docker system prune -a
docker volume prune
```

### Port conflicts:

```bash
# Check what's using a port
netstat -ano | findstr :3000

# Stop service using the port or change port in docker-compose.yml
```

## Production Deployment

### Build for production:

```bash
# Build all images
docker-compose build

# Tag images for registry
docker tag eshop-auth-service:latest your-registry/eshop-auth-service:latest

# Push to registry
docker push your-registry/eshop-auth-service:latest
```

### Environment-specific builds:

```bash
# Use different compose file for production
docker-compose -f docker-compose.prod.yml up -d
```

## Image Size Optimization

All Dockerfiles use:

- **Multi-stage builds** (builder + runner)
- **Alpine Linux** (minimal base image)
- **Production-only dependencies** in final image
- **Non-root users** for security
- **Standalone mode** for Next.js (minimal output)

Typical image sizes:

- Backend services: ~150-200MB
- Next.js apps: ~200-300MB

## Best Practices

1. **Always test locally first** before building Docker images
2. **Build services incrementally** rather than all at once
3. **Monitor logs** during first run: `docker-compose logs -f`
4. **Use health checks** to verify services are running
5. **Keep .env files secure** - never commit them
6. **Run database migrations** before starting services
7. **Use docker-compose down** to clean up between tests

## Quick Start Checklist

- [ ] Install Docker and Docker Compose
- [ ] Configure .env files
- [ ] Test services locally first: `npm run dev`
- [ ] Build Docker images: `docker-compose build`
- [ ] Start infrastructure: `docker-compose up -d zookeeper kafka`
- [ ] Start backend services: `docker-compose up -d auth-service product-service`
- [ ] Start API gateway: `docker-compose up -d api-gateway`
- [ ] Start frontend: `docker-compose up -d user-ui`
- [ ] Check logs: `docker-compose logs -f`
- [ ] Test endpoints with curl or browser
- [ ] If issues occur, check logs and rebuild without cache
