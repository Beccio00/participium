# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files first for better caching
COPY telegram-bot/package*.json ./
COPY telegram-bot/tsconfig.json ./

# Install dependencies
RUN npm ci --frozen-lockfile

# Copy source code
COPY telegram-bot/src ./src

# Build TypeScript
RUN npm run build

# Verify build output
RUN ls -la dist/ && \
    if [ ! -d "dist" ]; then echo "Build failed: dist directory not found"; exit 1; fi

# Stage 2: Production
FROM node:18-alpine

WORKDIR /app

# Install tini for proper signal handling
RUN apk add --no-cache tini

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package files
COPY telegram-bot/package*.json ./

# Install production dependencies only
RUN npm ci --only=production --frozen-lockfile && \
    npm cache clean --force

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Change ownership to nodejs user
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Use tini as entrypoint for proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]

# Start the bot
CMD ["node", "dist/index.js"]
