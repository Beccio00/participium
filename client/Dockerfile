# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY client/package*.json ./

# Install dependencies
RUN npm ci && npm install leaflet.markercluster @types/leaflet.markercluster

# Copy shared types from parent directory (before copying client code)
COPY shared/ /shared/

# Copy source code and config files
COPY client/ .

# Build the application
RUN npm run build

# Stage 2: Production with serve
FROM node:18-alpine

WORKDIR /app

# Install serve globally
RUN npm install -g serve

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 80

CMD ["serve", "-s", "dist", "-l", "80"]
