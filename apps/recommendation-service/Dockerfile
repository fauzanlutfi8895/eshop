# Multi-stage build for minimal image size
FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace files
COPY package*.json ./
COPY nx.json ./
COPY tsconfig.base.json ./
COPY prisma ./prisma

# Copy service-specific files
COPY apps/recommendation-service ./apps/recommendation-service

# Install dependencies (including devDependencies for build)
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# Build the service
RUN npx nx build recommendation-service --prod

# Production stage
FROM node:20-alpine AS runner

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3006

WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 recommendationservice

# Copy Prisma schema and client
COPY --from=builder --chown=recommendationservice:nodejs /app/prisma ./prisma
COPY --from=builder --chown=recommendationservice:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=recommendationservice:nodejs /app/node_modules/@prisma ./node_modules/@prisma

# Copy built application
COPY --from=builder --chown=recommendationservice:nodejs /app/dist/apps/recommendation-service ./

# Copy package.json for production dependencies
COPY --from=builder --chown=recommendationservice:nodejs /app/apps/recommendation-service/package.json ./package.json

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

USER recommendationservice

EXPOSE 3006

CMD ["node", "main.js"]
