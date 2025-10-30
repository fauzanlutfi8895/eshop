# 🚀 E-Shop Docker - Quick Reference

## ⚡ Quick Commands

### Local Testing (Always Run First!)

```bash
npm run test:local:quick    # Test 4 essential services
npm run test:local          # Test all 14 services
```

### Docker Operations

```bash
npm run docker:build        # Build all images
npm run docker:up           # Start all (foreground)
npm run docker:up:d         # Start all (background)
npm run docker:down         # Stop all
npm run docker:logs         # View logs
npm run docker:clean        # Clean up everything
```

### Individual Service Operations

```bash
docker-compose build auth-service           # Build one service
docker-compose up -d auth-service          # Start one service
docker-compose logs -f auth-service        # View service logs
docker-compose restart auth-service        # Restart service
```

## 📋 Progressive Startup (Recommended First Time)

```bash
# 1. Infrastructure
docker-compose up -d zookeeper kafka

# 2. Wait 10 seconds, then backend
docker-compose up -d auth-service product-service user-service

# 3. API Gateway
docker-compose up -d api-gateway

# 4. Frontend
docker-compose up -d user-ui seller-ui admin-ui

# 5. Check status
docker-compose ps
docker-compose logs -f
```

## 🌐 Service URLs

| Service            | URL                   |
| ------------------ | --------------------- |
| User UI            | http://localhost:3010 |
| Seller UI          | http://localhost:3011 |
| Admin UI           | http://localhost:3012 |
| API Gateway        | http://localhost:4000 |
| Kafdrop (Kafka UI) | http://localhost:9000 |

## 🔧 Configuration Checklist

- [ ] Copy `.env.example` to `.env` and configure
- [ ] Copy `.env.frontend.example` to `apps/user-ui/.env`
- [ ] Copy `.env.frontend.example` to `apps/seller-ui/.env`
- [ ] Copy `.env.frontend.example` to `apps/admin-ui/.env`
- [ ] Run `npx prisma migrate deploy`
- [ ] Run `npx prisma generate`

## 🐛 Common Issues

### Build Fails

```bash
# Test locally first
npm run test:local:quick

# Clean Docker build
docker-compose build --no-cache
```

### Service Won't Start

```bash
# Check logs
docker-compose logs service-name

# Check port
netstat -ano | findstr :3000
```

### Out of Memory/Disk

```bash
npm run docker:clean
docker system prune -a
```

## 📊 Image Sizes

- Backend: ~150-200MB (60-70% reduction!)
- Frontend: ~200-300MB (70-80% reduction!)

## ✅ Testing Status

**Local Build Test:** ✅ PASSED

- auth-service: ✅
- product-service: ✅
- api-gateway: ✅
- user-ui: ✅

**Ready for Docker build!**

## 📚 Full Documentation

- **DOCKER-SUMMARY.md** - Complete overview
- **DOCKER-SETUP.md** - Detailed setup guide
- **DOCKER.md** - Reference documentation

---

**Quick Start:** `npm run test:local:quick` → `npm run docker:build` → `npm run docker:up:d`
