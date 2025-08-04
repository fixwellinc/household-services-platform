# Use Node.js 20 alpine image
FROM node:20-alpine

# Install system dependencies
RUN apk add --no-cache \
    openssl \
    ca-certificates

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/
COPY apps/frontend/package*.json ./apps/frontend/
COPY packages/shared/package*.json ./packages/shared/
COPY packages/types/package*.json ./packages/types/
COPY packages/utils/package*.json ./packages/utils/

# Copy all workspace source files before install
COPY packages ./packages
COPY apps ./apps

# Remove any existing lockfile to avoid workspace protocol issues
RUN rm -f package-lock.json

# Install all dependencies at root level first
RUN npm install

# Build workspace packages in order
RUN npm run build --workspace=packages/types
RUN npm run build --workspace=packages/utils

# Copy all remaining source code
COPY . .

# Generate Prisma client for backend
WORKDIR /app/apps/backend
RUN npx prisma generate

# Build frontend
WORKDIR /app/apps/frontend
RUN npm run build

# Set working directory back to root
WORKDIR /app

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Make startup script executable
RUN chmod +x /app/start.sh

# Expose port
EXPOSE 3000

# Start the unified server using the startup script
CMD ["/app/start.sh"] 