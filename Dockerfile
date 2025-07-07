FROM node:18-alpine

WORKDIR /app

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

# Expose port
EXPOSE 3001

# Start the application
CMD ["npm", "start"] 