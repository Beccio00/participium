
# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files first for better caching
COPY server/package*.json ./
COPY server/tsconfig.json ./

# Install dependencies
RUN npm ci --frozen-lockfile

# Copy shared types from parent directory
COPY shared/ /shared/

# Copy source code
COPY server/src ./src
COPY server/seed ./seed

# Build TypeScript
RUN npm run build

# Verify build output and structure
RUN ls -la dist/ && \
    if [ ! -d "dist" ]; then echo "Build failed: dist directory not found"; exit 1; fi

# Stage 2: Production
FROM node:18-alpine

WORKDIR /app

# Install runtime dependencies and tini
RUN apk add --no-cache \
    tini \
    wget \
    curl \
    netcat-openbsd \
    postgresql-client \
    && addgroup -g 1001 -S nodejs \
    && adduser -S nodejs -u 1001

# Copy package files
COPY server/package*.json ./

# Install only production dependencies
RUN npm ci --only=production --frozen-lockfile && npm cache clean --force

# Copy shared types
COPY shared/ /shared/

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Copy documentation to the dist folder where the app expects it
COPY docs/ ./dist/docs/

# Create uploads directory and set permissions
RUN mkdir -p uploads && chown -R nodejs:nodejs /app
# Switch to non-root user

USER nodejs

EXPOSE 4000

ENV NODE_ENV=production

# Use tini to handle signals properly
ENTRYPOINT ["/sbin/tini", "--"]

# Start the application with database seeding if needed
CMD ["sh", "-c", "echo 'Waiting for database to be ready...' && until nc -z ${DB_HOST:-db} ${DB_PORT:-5432}; do echo 'Database not ready, waiting 3 seconds...'; sleep 3; done && echo 'Database is ready!' && if [ \"$AUTO_SEED\" = \"true\" ]; then echo 'Running database seed...' && node dist/app/seed/seed.js || echo 'Seed failed but continuing...'; fi && echo 'Starting server...' && node dist/app/src/index.js"]
