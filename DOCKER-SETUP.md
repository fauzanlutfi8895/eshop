# 🚀 E-Shop Docker Setup - Complete Guide

## 📋 Overview

This repository contains **14 services** (11 backend + 3 frontend) fully Dockerized with optimized, minimal images for production deployment.

## ✅ What's Been Set Up

### All Dockerfiles Created:

#### Backend Services (Node.js/Express):

- ✅ `auth-service` - Authentication & authorization (Port 3000)
- ✅ `product-service` - Product management (Port 3001)
- ✅ `user-service` - User management (Port 3002)
- ✅ `admin-service` - Admin operations (Port 3003)
- ✅ `order-service` - Order processing (Port 3004)
- ✅ `seller-service` - Seller operations (Port 3005)
- ✅ `recommendation-service` - Product recommendations (Port 3006)
- ✅ `chatting-service` - Real-time chat (Port 3007)
- ✅ `kafka-service` - Kafka consumer/producer (Port 3008)
- ✅ `logger-service` - Centralized logging (Port 3009)
- ✅ `api-gateway` - API Gateway (Port 4000)

#### Frontend Services (Next.js):

- ✅ `user-ui` - Customer interface (Port 3010 → 3000)
- ✅ `seller-ui` - Seller dashboard (Port 3011 → 3001)
- ✅ `admin-ui` - Admin dashboard (Port 3012 → 3002)

### Infrastructure:

- ✅ Kafka + Zookeeper
- ✅ Kafdrop (Kafka UI)
- ✅ Docker Compose for orchestration
- ✅ Production-ready docker-compose.prod.yml

## 🎯 Image Optimization Features

All Docker images use:

1. **Multi-stage builds** - Separate builder and runtime stages
2. **Alpine Linux base** - Minimal footprint (~5MB base)
3. **Production-only dependencies** - No dev dependencies in final image
4. **Non-root users** - Security best practice
5. **Standalone Next.js output** - Minimal frontend bundles
6. **Layer caching** - Optimized for rebuild speed

Expected image sizes:

- Backend services: **~150-200MB** (vs ~500MB+ without optimization)
- Next.js apps: **~200-300MB** (vs ~800MB+ without standalone mode)

## 🚀 Quick Start

### Step 1: Test Locally First (Important!)

```bash
# Quick test (builds 4 essential services)
npm run test:local:quick

# Full test (builds all services)
npm run test:local

# Test specific service
npx nx build auth-service --prod
```

**Why test locally?**

- Catches build errors before Docker
- Much faster iteration (no Docker build time)
- Easier to debug issues

### Step 2: Build Docker Images

```bash
# Build all services
npm run docker:build

# Build without cache (clean build)
npm run docker:build:nocache

# Build specific service
docker-compose build auth-service
```

### Step 3: Run Services

```bash
# Start all services (foreground)
npm run docker:up

# Start in background
npm run docker:up:d

# Start specific services
docker-compose up -d kafka auth-service product-service api-gateway user-ui
```

### Step 4: Monitor

```bash
# View logs (all services)
npm run docker:logs

# View specific service logs
docker-compose logs -f auth-service

# Check service status
docker-compose ps
```

### Step 5: Stop Services

```bash
# Stop all services
npm run docker:down

# Stop and remove volumes
npm run docker:clean
```

## 📦 Available NPM Scripts

```json
{
  "test:local": "Test all services build locally",
  "test:local:quick": "Quick test (4 essential services)",
  "build:all": "Build all services with Nx",
  "docker:build": "Build all Docker images",
  "docker:build:nocache": "Clean Docker build",
  "docker:up": "Start all services (foreground)",
  "docker:up:d": "Start all services (background)",
  "docker:down": "Stop all services",
  "docker:logs": "View all logs",
  "docker:clean": "Clean up containers and volumes",
  "docker:test": "Automated Docker testing"
}
```

## 🧪 Testing Strategy

### Progressive Testing (Recommended):

```bash
# 1. Infrastructure first
docker-compose up -d zookeeper kafka
# Wait 10 seconds for Kafka to be ready

# 2. Core backend services
docker-compose up -d auth-service product-service user-service

# 3. API Gateway
docker-compose up -d api-gateway

# 4. Supporting services
docker-compose up -d order-service seller-service chatting-service

# 5. Frontend services
docker-compose up -d user-ui seller-ui admin-ui

# 6. Check logs
docker-compose logs -f
```

### Automated Testing:

```bash
# Runs automated tests (builds + starts + checks health)
npm run docker:test
```

## 🌐 Service Endpoints

Once running with `docker-compose up -d`:

### Backend API:

- API Gateway: http://localhost:4000
- Auth Service: http://localhost:3000
- Product Service: http://localhost:3001
- User Service: http://localhost:3002
- Admin Service: http://localhost:3003
- Order Service: http://localhost:3004
- Seller Service: http://localhost:3005
- Recommendation Service: http://localhost:3006
- Chatting Service: http://localhost:3007
- Kafka Service: http://localhost:3008
- Logger Service: http://localhost:3009

### Frontend:

- User UI: http://localhost:3010
- Seller UI: http://localhost:3011
- Admin UI: http://localhost:3012

### Infrastructure:

- Kafdrop (Kafka UI): http://localhost:9000
- Kafka: localhost:9092

## ⚙️ Environment Configuration

### Required Files:

1. **Root `.env`** - Backend services configuration:

```env
DATABASE_URL=postgresql://user:password@host:5432/dbname
KAFKA_BROKERS=kafka:29092
# Add other backend env vars
```

2. **`apps/user-ui/.env`** - User UI configuration:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
# Add other frontend env vars
```

3. **`apps/seller-ui/.env`** - Seller UI configuration
4. **`apps/admin-ui/.env`** - Admin UI configuration

### Next.js Configuration:

All Next.js apps now have `output: "standalone"` enabled for minimal Docker images.

## 🔧 Troubleshooting

### Build Failures:

```bash
# 1. Test locally first
npm run test:local:quick

# 2. Check specific service
npx nx build auth-service --prod

# 3. View detailed error
npx nx build auth-service --prod --verbose

# 4. If local build works, try Docker without cache
docker-compose build --no-cache auth-service
```

### Service Won't Start:

```bash
# Check logs
docker-compose logs auth-service

# Check if port is in use
netstat -ano | findstr :3000

# Restart service
docker-compose restart auth-service
```

### Database Connection Issues:

```bash
# 1. Ensure DATABASE_URL is correct in .env
# 2. Run migrations
npx prisma migrate deploy
npx prisma generate

# 3. Rebuild service
docker-compose build --no-cache auth-service
docker-compose up -d auth-service
```

### Out of Disk Space:

```bash
# Clean up Docker
npm run docker:clean

# Or manually
docker system prune -a
docker volume prune
```

## 📊 Production Deployment

### With Docker Registry:

```bash
# Build with registry tags
REGISTRY=your-registry.com TAG=v1.0.0 docker-compose -f docker-compose.prod.yml build

# Push to registry
docker-compose -f docker-compose.prod.yml push

# Deploy on production server
REGISTRY=your-registry.com TAG=v1.0.0 docker-compose -f docker-compose.prod.yml up -d
```

### Production Compose File:

`docker-compose.prod.yml` includes:

- Health checks for all services
- Restart policies (`restart: always`)
- Environment variable templating
- Registry support
- Optimized networking

## 📝 Best Practices

1. ✅ **Always test locally first** with `npm run test:local:quick`
2. ✅ **Start infrastructure first** (Kafka, Zookeeper)
3. ✅ **Use docker-compose logs** to monitor startup
4. ✅ **Keep .env files secure** - never commit them
5. ✅ **Run Prisma migrations** before building services
6. ✅ **Use health checks** in production
7. ✅ **Monitor resource usage** with `docker stats`
8. ✅ **Build incrementally** rather than all at once

## 🎯 Checklist Before Deployment

- [ ] All services build successfully locally (`npm run test:local`)
- [ ] Environment variables configured (`.env` files)
- [ ] Database migrations run (`npx prisma migrate deploy`)
- [ ] Prisma client generated (`npx prisma generate`)
- [ ] Docker images build without errors
- [ ] Services start and respond to health checks
- [ ] Kafka and infrastructure services running
- [ ] API Gateway routes correctly to services
- [ ] Frontend apps connect to backend
- [ ] No errors in logs (`docker-compose logs`)

## 📚 Additional Resources

- Full documentation: `DOCKER.md`
- Build script: `scripts/docker-build.ps1`
- Test script: `scripts/test-local.ps1`
- Production compose: `docker-compose.prod.yml`

## 🚨 Common Issues & Solutions

### Issue: Next.js build fails with "Cannot find module"

**Solution:** Ensure `output: "standalone"` is in next.config.js

### Issue: Backend service can't connect to database

**Solution:** Check DATABASE_URL in .env, ensure Prisma client is generated

### Issue: Kafka service fails to start

**Solution:** Start Zookeeper first, wait 10 seconds, then start Kafka

### Issue: Docker build is very slow

**Solution:** Ensure `.dockerignore` is present and excludes node_modules, .next, dist

### Issue: "Port already in use"

**Solution:** Change ports in docker-compose.yml or kill process using port

## 💡 Tips for Success

1. **Incremental Testing**: Don't start all 14 services at once. Start with:

   - Kafka + Zookeeper
   - auth-service
   - product-service
   - api-gateway
   - user-ui

2. **Resource Management**: Running all services requires:

   - RAM: ~4-6GB
   - Disk: ~5-10GB for images
   - CPU: Multi-core recommended

3. **Development Workflow**:

   ```bash
   # Development (fast reload)
   npm run dev

   # Pre-deployment testing (local builds)
   npm run test:local

   # Final testing (Docker)
   npm run docker:build && npm run docker:up
   ```

---

**Created:** October 30, 2025
**Status:** ✅ All services Dockerized and ready for deployment
**Image Optimization:** ✅ Multi-stage builds with Alpine Linux
**Documentation:** ✅ Complete with testing scripts and guides
