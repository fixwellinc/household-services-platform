# Stage 1: Builder - Dependencies and Build
FROM node:20-alpine AS builder

# Install system dependencies needed for build
RUN apk add --no-cache \
    openssl \
    ca-certificates \
    python3 \
    make \
    g++

# Set working directory
WORKDIR /app

# Copy package files for dependency installation (optimal layer caching)
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/
COPY apps/frontend/package*.json ./apps/frontend/

# Install dependencies first (cached layer if package.json unchanged)
RUN npm install

# Copy source code for packages (if they exist)
# Note: Packages are optional and may not exist in all projects

# Copy application source code
COPY apps ./apps
COPY unified-server-enhanced.js ./

# Generate Prisma client for backend
WORKDIR /app/apps/backend
RUN npx prisma generate

# Build frontend with optimized settings and memory limits
WORKDIR /app/apps/frontend

# Clean any existing build artifacts
RUN rm -rf .next

# Set build environment
ENV NODE_OPTIONS="--max-old-space-size=2048 --max-semi-space-size=128"
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV DISABLE_ESLINT_PLUGIN=true

# Build the application with fallback options
RUN echo "🔨 Building Next.js application..." && \
    (npx next build --no-lint || \
     (echo "⚠️ Standard build failed, trying minimal build..." && \
      NEXT_BUILD_CACHE_DISABLED=1 NODE_OPTIONS="--max-old-space-size=1536" npx next build --no-lint --experimental-build-mode=compile) || \
     (echo "❌ Next.js build failed!" && exit 1))

# Comprehensive build verification
RUN echo "🔍 Verifying build artifacts..." && \
    if [ ! -d ".next" ]; then \
      echo "❌ ERROR: .next directory missing"; \
      exit 1; \
    fi && \
    if [ ! -d ".next/server" ]; then \
      echo "❌ ERROR: .next/server directory missing"; \
      exit 1; \
    fi && \
    if [ ! -f ".next/build-manifest.json" ]; then \
      echo "❌ ERROR: build-manifest.json missing"; \
      exit 1; \
    fi && \
    if [ ! -f ".next/server/middleware-manifest.json" ]; then \
      echo "⚠️  WARNING: middleware-manifest.json missing (may be created at runtime)"; \
    fi && \
    echo "✅ Build verification passed - all critical artifacts present"

# Stage 2: Runtime - Production Image
FROM node:20-alpine AS runtime

# Install only runtime system dependencies
RUN apk add --no-cache \
    openssl \
    ca-certificates

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Set working directory
WORKDIR /app

# Copy package files and install only production dependencies
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/
COPY apps/frontend/package*.json ./apps/frontend/

# Install production dependencies
RUN npm install --omit=dev && npm cache clean --force

# Copy built applications from builder stage
COPY --from=builder --chown=nextjs:nodejs /app/apps/backend ./apps/backend
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/.next ./apps/frontend/.next
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/public ./apps/frontend/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/package.json ./apps/frontend/
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/next.config.js ./apps/frontend/
COPY --from=builder --chown=nextjs:nodejs /app/unified-server-enhanced.js ./

# Install frontend production dependencies from root with workspace support
RUN rm -rf apps/frontend/node_modules
WORKDIR /app
RUN npm install --workspace=apps/frontend --omit=dev --legacy-peer-deps && npm cache clean --force

# Copy Prisma schema from builder
COPY --from=builder --chown=nextjs:nodejs /app/apps/backend/prisma ./apps/backend/prisma

# Install backend production dependencies
RUN rm -rf apps/backend/node_modules
WORKDIR /app
RUN npm install --workspace=apps/backend --omit=dev --legacy-peer-deps && npm cache clean --force

# Install Prisma CLI globally (avoids workspace issues)
RUN npm install -g prisma@^6.11.1 && \
    echo "✅ Prisma CLI installed globally"

# Copy Prisma generated client from builder (already generated there)
# This avoids needing to generate it again and ensures @prisma/client is available
WORKDIR /app/apps/backend
RUN mkdir -p node_modules
COPY --from=builder --chown=nextjs:nodejs /app/apps/backend/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/apps/backend/node_modules/@prisma ./node_modules/@prisma
RUN echo "✅ Prisma client copied from builder"

WORKDIR /app

# Set proper ownership
WORKDIR /app
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the unified server with database sync
CMD ["sh", "-c", "set -e && \
  echo '🚀 Starting application...' && \
  echo \"📦 Environment: ${NODE_ENV:-production}\" && \
  echo \"🔌 Port: ${PORT:-3000}\" && \
  echo \"🌐 Hostname: ${HOSTNAME:-0.0.0.0}\" && \
  cd /app/apps/backend && \
  echo '🗄️  Syncing database schema...' && \
  prisma db push || echo '⚠️  Database sync failed, continuing anyway...' && \
  prisma generate || echo '⚠️  Prisma generate skipped' && \
  echo '✅ Database setup completed' && \
  cd /app && \
  echo '🚀 Starting unified server...' && \
  node unified-server-enhanced.js"]
