# Multi-stage build for SentinelCore Backend
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++ git

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S sentinelcore -u 1001

# Set working directory
WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache dumb-init curl

# Copy built application
COPY --from=builder --chown=sentinelcore:nodejs /app/dist ./dist
COPY --from=builder --chown=sentinelcore:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=sentinelcore:nodejs /app/package*.json ./

# Create necessary directories
RUN mkdir -p uploads logs servers backups && \
    chown -R sentinelcore:nodejs uploads logs servers backups

# Switch to non-root user
USER sentinelcore

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "dist/main.js"]