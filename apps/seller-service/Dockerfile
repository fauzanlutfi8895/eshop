# Multi-stage build for minimal image size
FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace files
COPY package*.json ./
COPY nx.json ./
COPY tsconfig.base.json ./
COPY prisma ./prisma

# Copy service-specific files
COPY apps/seller-service ./apps/seller-service

# Install dependencies (including devDependencies for build)
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# Build the service
RUN npx nx build seller-service --prod

# Production stage
FROM node:20-alpine AS runner

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3005

WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 sellerservice

# Copy Prisma schema and client
COPY --from=builder --chown=sellerservice:nodejs /app/prisma ./prisma
COPY --from=builder --chown=sellerservice:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=sellerservice:nodejs /app/node_modules/@prisma ./node_modules/@prisma

# Copy built application
COPY --from=builder --chown=sellerservice:nodejs /app/dist/apps/seller-service ./

# Copy package.json for production dependencies
COPY --from=builder --chown=sellerservice:nodejs /app/apps/seller-service/package.json ./package.json

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

USER sellerservice

EXPOSE 3005

CMD ["node", "main.js"]
