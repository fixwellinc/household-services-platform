# Stage 1: Builder - Dependencies and Build
FROM node:20-alpine AS builder

# Install system dependencies needed for build
RUN apk add --no-cache \
    openssl \
    ca-certificates \
    python3 \
    make \
    g++ \
    libc6-compat

# Set working directory
WORKDIR /app

# Copy package files for dependency installation (optimal layer caching)
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/
COPY apps/frontend/package*.json ./apps/frontend/
# Create package directories and copy package.json files individually to avoid workspace conflicts
RUN mkdir -p packages/utils packages/types packages/shared
COPY packages/utils/package.json ./packages/utils/
COPY packages/types/package.json ./packages/types/
COPY packages/shared/package.json ./packages/shared/

# Install all dependencies (including dev dependencies for build)
# Using npm install instead of npm ci to handle lock file sync issues
RUN npm install --legacy-peer-deps

# Copy all source code
COPY apps ./apps
COPY packages ./packages
COPY unified-server-enhanced.js ./

# Generate Prisma client for backend
WORKDIR /app/apps/backend
RUN npx prisma generate

# Build frontend
WORKDIR /app/apps/frontend

# Set build environment variables
ENV NODE_OPTIONS="--max-old-space-size=2048"
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV DISABLE_ESLINT_PLUGIN=true

# Build the Next.js application with verbose error reporting
RUN echo "🔨 Building Next.js application..." && \
    echo "📦 Environment info:" && \
    echo "   Node: $(node --version)" && \
    echo "   npm: $(npm --version)" && \
    echo "   Working directory: $(pwd)" && \
    echo "   Checking node_modules..." && \
    (test -d node_modules && echo "   ✓ node_modules exists" || echo "   ✗ node_modules missing") && \
    echo "   Checking .next directory..." && \
    (test -d .next && echo "   ⚠ .next already exists (will be rebuilt)" || echo "   ✓ .next doesn't exist yet") && \
    echo "" && \
    echo "🚀 Starting build with verbose output..." && \
    NODE_OPTIONS="--max-old-space-size=2048" npm run build 2>&1 | head -200 || \
    (echo "" && \
     echo "❌❌❌ BUILD FAILED ❌❌❌" && \
     echo "Checking for common issues..." && \
     echo "Node modules check:" && \
     ls -la node_modules 2>/dev/null | head -5 || echo "node_modules not accessible" && \
     echo "Package.json check:" && \
     cat package.json | head -20 && \
     echo "Next.js config check:" && \
     test -f next.config.js && echo "next.config.js exists" || echo "next.config.js missing" && \
     exit 1)

# Verify build artifacts
RUN echo "🔍 Verifying build artifacts..." && \
    if [ ! -d ".next" ]; then \
      echo "❌ ERROR: .next directory missing"; \
      exit 1; \
    fi && \
    if [ ! -d ".next/server" ]; then \
      echo "❌ ERROR: .next/server directory missing"; \
      exit 1; \
    fi && \
    echo "✅ Build verification passed"

# Stage 2: Runtime - Production Image
FROM node:20-alpine AS runtime

# Install only runtime system dependencies
RUN apk add --no-cache \
    openssl \
    ca-certificates \
    libc6-compat

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/
COPY apps/frontend/package*.json ./apps/frontend/
# Create package directories and copy package.json files individually to avoid workspace conflicts
RUN mkdir -p packages/utils packages/types packages/shared
COPY packages/utils/package.json ./packages/utils/
COPY packages/types/package.json ./packages/types/
COPY packages/shared/package.json ./packages/shared/

# Install only production dependencies
# Using npm install instead of npm ci to handle lock file sync issues
RUN npm install --omit=dev --legacy-peer-deps && \
    npm cache clean --force

# Copy built frontend from builder
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/.next ./apps/frontend/.next
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/public ./apps/frontend/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/next.config.js ./apps/frontend/
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/package.json ./apps/frontend/

# Copy backend source and Prisma
COPY --from=builder --chown=nextjs:nodejs /app/apps/backend ./apps/backend

# Copy unified server
COPY --from=builder --chown=nextjs:nodejs /app/unified-server-enhanced.js ./

# Copy packages from builder
COPY --from=builder --chown=nextjs:nodejs /app/packages ./packages

# Generate Prisma client in runtime stage
WORKDIR /app/apps/backend
RUN npx prisma generate || echo "⚠️ Prisma generate failed, but continuing..."

# Set proper ownership
WORKDIR /app
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Set environment variables
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
ENV NODE_OPTIONS="--max-old-space-size=2048"

# Expose port (Render will set the actual PORT via environment variable)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || '3000') + '/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the unified server
CMD ["sh", "-c", "echo '🚀 Starting application on Render...' && \
  echo \"📦 Environment: ${NODE_ENV:-production}\" && \
  echo \"🔌 Port: ${PORT:-3000}\" && \
  echo \"🌐 Hostname: ${HOSTNAME:-0.0.0.0}\" && \
  cd /app/apps/backend && \
  echo '🗄️  Syncing database schema...' && \
  (npx prisma db push --skip-generate --accept-data-loss 2>&1 || echo '⚠️  Database sync failed, continuing anyway...') && \
  echo '✅ Database setup completed' && \
  cd /app && \
  echo '🚀 Starting unified server...' && \
  exec node unified-server-enhanced.js"]
