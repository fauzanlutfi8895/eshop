# Multi-stage build for minimal image size
FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace files
COPY package*.json ./
COPY nx.json ./
COPY tsconfig.base.json ./

# Copy service-specific files
COPY apps/api-gateway ./apps/api-gateway

# Install dependencies (including devDependencies for build)
RUN npm ci

# Build the service
RUN npx nx build api-gateway --prod

# Production stage
FROM node:20-alpine AS runner

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4000

WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 apigateway

# Copy built application
COPY --from=builder --chown=apigateway:nodejs /app/dist/apps/api-gateway ./

# Copy package.json for production dependencies
COPY --from=builder --chown=apigateway:nodejs /app/apps/api-gateway/package.json ./package.json

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

USER apigateway

EXPOSE 4000

CMD ["node", "main.js"]
