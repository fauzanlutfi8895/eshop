# Multi-stage build for minimal image size
FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace files
COPY package*.json ./
COPY nx.json ./
COPY tsconfig.base.json ./

# Copy service-specific files
COPY apps/logger-service ./apps/logger-service

# Install dependencies (including devDependencies for build)
RUN npm ci

# Build the service
RUN npx nx build logger-service --prod

# Production stage
FROM node:20-alpine AS runner

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3009

WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 loggerservice

# Copy built application
COPY --from=builder --chown=loggerservice:nodejs /app/dist/apps/logger-service ./

# Copy package.json for production dependencies
COPY --from=builder --chown=loggerservice:nodejs /app/apps/logger-service/package.json ./package.json

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

USER loggerservice

EXPOSE 3009

CMD ["node", "main.js"]
