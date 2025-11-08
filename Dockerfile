# Multi-stage Dockerfile for Fixwell Services Platform
# Based on the working local build process

# ============================================================================
# Stage 1: Builder - Install dependencies and build application
# ============================================================================
FROM node:20-alpine AS builder

# Install system dependencies needed for native modules
RUN apk add --no-cache \
    openssl \
    ca-certificates \
    python3 \
    make \
    g++ \
    libc6-compat

# Set working directory
WORKDIR /app

# Copy package files for dependency installation (layer caching optimization)
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/
COPY apps/frontend/package*.json ./apps/frontend/
COPY packages/utils/package.json ./packages/utils/
COPY packages/types/package.json ./packages/types/
COPY packages/shared/package.json ./packages/shared/

# Install all dependencies (including dev dependencies for build)
RUN npm install --legacy-peer-deps

# Copy source code
COPY apps ./apps
COPY packages ./packages
COPY unified-server-enhanced.js ./

# Generate Prisma client
WORKDIR /app/apps/backend
RUN npx prisma generate

# Build frontend
WORKDIR /app/apps/frontend
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ============================================================================
# Stage 2: Runtime - Production image
# ============================================================================
FROM node:20-alpine AS runtime

# Install runtime system dependencies
RUN apk add --no-cache \
    openssl \
    ca-certificates \
    libc6-compat

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/
COPY apps/frontend/package*.json ./apps/frontend/
COPY packages/utils/package.json ./packages/utils/
COPY packages/types/package.json ./packages/types/
COPY packages/shared/package.json ./packages/shared/

# Install production dependencies only
# Also install prisma CLI (needed for db push at runtime)
RUN npm install --omit=dev --legacy-peer-deps && \
    npm install prisma@^6.11.1 --legacy-peer-deps && \
    npm cache clean --force

# Copy built application from builder stage
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/.next ./apps/frontend/.next
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/public ./apps/frontend/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/next.config.js ./apps/frontend/
COPY --from=builder --chown=nextjs:nodejs /app/apps/backend ./apps/backend
COPY --from=builder --chown=nextjs:nodejs /app/packages ./packages
COPY --from=builder --chown=nextjs:nodejs /app/unified-server-enhanced.js ./

# Generate Prisma client for runtime (needed for db push)
WORKDIR /app/apps/backend
RUN npx prisma generate || npm install prisma@^6.11.1 --legacy-peer-deps && npx prisma generate

# Set ownership
WORKDIR /app
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Set environment variables
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
ENV NODE_OPTIONS="--max-old-space-size=2048"

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || '3000') + '/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the unified server (with database setup)
CMD ["sh", "-c", "cd /app/apps/backend && npx prisma db push --skip-generate --accept-data-loss || true && cd /app && node unified-server-enhanced.js"]

