# Multi-stage build for unified deployment
FROM node:18-slim AS base

# Install system dependencies
RUN apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/frontend/package*.json ./apps/frontend/
COPY apps/backend/package*.json ./apps/backend/
COPY packages/*/package*.json ./packages/

# Install dependencies
RUN npm ci

# Copy source code
COPY apps/frontend ./apps/frontend
COPY apps/backend ./apps/backend
COPY packages ./packages

# Generate Prisma client
WORKDIR /app/apps/backend
RUN npx prisma generate

# Build frontend
WORKDIR /app/apps/frontend
RUN npm run build

# Production stage
FROM node:18-slim AS production

# Install system dependencies
RUN apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy built frontend
COPY --from=base /app/apps/frontend/.next ./.next
COPY --from=base /app/apps/frontend/public ./public
COPY --from=base /app/apps/frontend/package*.json ./
COPY --from=base /app/apps/frontend/next.config.js ./
COPY --from=base /app/apps/frontend/tailwind.config.js ./
COPY --from=base /app/apps/frontend/postcss.config.js ./
COPY --from=base /app/apps/frontend/tsconfig.json ./

# Copy backend
COPY --from=base /app/apps/backend/src ./backend/src
COPY --from=base /app/apps/backend/prisma ./backend/prisma
COPY --from=base /app/apps/backend/package*.json ./backend/

# Copy shared packages
COPY --from=base /app/packages ./packages

# Install production dependencies
RUN npm ci --only=production
WORKDIR /app/backend
RUN npm ci --only=production

# Copy the unified server script
COPY --from=base /app/unified-server.js ./

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Start the unified server
CMD ["node", "unified-server.js"] 