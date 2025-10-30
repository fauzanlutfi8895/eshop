# Multi-stage build for minimal image size
FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace files
COPY package*.json ./
COPY nx.json ./
COPY tsconfig.base.json ./
COPY prisma ./prisma

# Copy service-specific files
COPY apps/order-service ./apps/order-service

# Install dependencies (including devDependencies for build)
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# Build the service
RUN npx nx build order-service --prod

# Production stage
FROM node:20-alpine AS runner

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3004

WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 orderservice

# Copy Prisma schema and client
COPY --from=builder --chown=orderservice:nodejs /app/prisma ./prisma
COPY --from=builder --chown=orderservice:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=orderservice:nodejs /app/node_modules/@prisma ./node_modules/@prisma

# Copy built application
COPY --from=builder --chown=orderservice:nodejs /app/dist/apps/order-service ./

# Copy package.json for production dependencies
COPY --from=builder --chown=orderservice:nodejs /app/apps/order-service/package.json ./package.json

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

USER orderservice

EXPOSE 3004

CMD ["node", "main.js"]
