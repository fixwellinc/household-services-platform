FROM node:18-slim

WORKDIR /app

# Install system dependencies including SSL libraries
RUN apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy only backend files
COPY backend/package*.json ./backend/
COPY backend/prisma ./backend/prisma/
COPY backend/src ./backend/src/
COPY backend/env.example ./backend/

# Install all dependencies (including dev dependencies for build)
WORKDIR /app/backend
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# Remove dev dependencies for production
RUN npm prune --production

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Expose port
EXPOSE 3001

# Set working directory and start the application
WORKDIR /app/backend
CMD ["node", "src/app.js"] 