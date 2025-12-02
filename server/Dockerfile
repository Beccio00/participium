
# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY server/package*.json ./
COPY server/tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy shared types from parent directory
COPY shared/ /shared/

# Copy source code
COPY server/src ./src
COPY server/seed ./seed

# Build TypeScript
RUN npm run build

# Verify build output
RUN ls -la dist/

# Stage 2: Production
FROM node:18-alpine

WORKDIR /app

# Install tini for proper signal handling
RUN apk add --no-cache tini

# Copy package files
COPY server/package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy shared types
COPY shared/ /shared/

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Copy documentation
COPY docs/ ./dist/docs/

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 4000

ENV NODE_ENV=production

# Use tini to handle signals properly
ENTRYPOINT ["/sbin/tini", "--"]

# Start the application
CMD ["node", "dist/app/src/index.js"]
