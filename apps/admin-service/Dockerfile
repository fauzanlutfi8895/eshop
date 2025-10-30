# Multi-stage build for minimal image size
FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace files
COPY package*.json ./
COPY nx.json ./
COPY tsconfig.base.json ./

# Copy service-specific files
COPY apps/admin-service ./apps/admin-service

# Install dependencies (including devDependencies for build)
RUN npm ci

# Build the service
RUN npx nx build admin-service --prod

# Production stage
FROM node:20-alpine AS runner

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3003

WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 adminservice

# Copy built application
COPY --from=builder --chown=adminservice:nodejs /app/dist/apps/admin-service ./

# Copy package.json for production dependencies
COPY --from=builder --chown=adminservice:nodejs /app/apps/admin-service/package.json ./package.json

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

USER adminservice

EXPOSE 3003

CMD ["node", "main.js"]
