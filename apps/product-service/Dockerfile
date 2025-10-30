# Multi-stage build for minimal image size
FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace files
COPY package*.json ./
COPY nx.json ./
COPY tsconfig.base.json ./
COPY prisma ./prisma

# Copy service-specific files
COPY apps/product-service ./apps/product-service

# Install dependencies (including devDependencies for build)
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# Build the service
RUN npx nx build product-service --prod

# Production stage
FROM node:20-alpine AS runner

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3001

WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 productservice

# Copy Prisma schema and client
COPY --from=builder --chown=productservice:nodejs /app/prisma ./prisma
COPY --from=builder --chown=productservice:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=productservice:nodejs /app/node_modules/@prisma ./node_modules/@prisma

# Copy built application
COPY --from=builder --chown=productservice:nodejs /app/dist/apps/product-service ./

# Copy package.json for production dependencies
COPY --from=builder --chown=productservice:nodejs /app/apps/product-service/package.json ./package.json

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

USER productservice

EXPOSE 3001

CMD ["node", "main.js"]
