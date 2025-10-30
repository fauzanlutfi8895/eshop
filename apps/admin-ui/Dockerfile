# Multi-stage build for minimal Next.js image
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy workspace files
COPY package*.json ./
COPY nx.json ./
COPY tsconfig.base.json ./

# Install dependencies
RUN npm ci

# Builder stage
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package*.json ./

# Copy workspace config
COPY nx.json ./
COPY tsconfig.base.json ./

# Copy admin-ui app
COPY apps/admin-ui ./apps/admin-ui

# Copy shared packages if needed
COPY packages ./packages

# Build the Next.js app
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx nx build admin-ui --prod

# Production image
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3002

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/apps/admin-ui/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/apps/admin-ui/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/admin-ui/.next/static ./apps/admin-ui/.next/static

USER nextjs

EXPOSE 3002

# Use standalone server
CMD ["node", "apps/admin-ui/server.js"]
