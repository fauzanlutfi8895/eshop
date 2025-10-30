# Multi-stage build for minimal image size
FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace files
COPY package*.json ./
COPY nx.json ./
COPY tsconfig.base.json ./

# Copy service-specific files
COPY apps/kafka-service ./apps/kafka-service

# Install dependencies (including devDependencies for build)
RUN npm ci

# Build the service
RUN npx nx build kafka-service --prod

# Production stage
FROM node:20-alpine AS runner

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3008

WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 kafkaservice

# Copy built application
COPY --from=builder --chown=kafkaservice:nodejs /app/dist/apps/kafka-service ./

# Copy package.json for production dependencies
COPY --from=builder --chown=kafkaservice:nodejs /app/apps/kafka-service/package.json ./package.json

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

USER kafkaservice

EXPOSE 3008

CMD ["node", "main.js"]
