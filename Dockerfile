FROM node:18-alpine

WORKDIR /app

# Copy only backend files
COPY backend/package*.json ./backend/
COPY backend/prisma ./backend/prisma/
COPY backend/src ./backend/src/
COPY backend/env.example ./backend/

# Install dependencies
WORKDIR /app/backend
RUN npm ci --only=production

# Generate Prisma client
RUN npx prisma generate

# Expose port
EXPOSE 3001

# Start the application
CMD ["npm", "start"] 