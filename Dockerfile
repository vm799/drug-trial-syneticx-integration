# Multi-stage Dockerfile for production deployment
FROM node:20-alpine AS base

# Set timezone and install basic dependencies
RUN apk add --no-cache \
    tzdata \
    tini \
    && ln -sf /usr/share/zoneinfo/UTC /etc/localtime \
    && echo "UTC" > /etc/timezone

# Create app directory and user
WORKDIR /app
RUN addgroup -g 1001 -S nodejs && \
    adduser -S appuser -u 1001 -G nodejs

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# ============================================================================
# Dependencies stage - Install dependencies
# ============================================================================
FROM base AS dependencies

# Copy package files
COPY package*.json ./
COPY server/package*.json ./server/

# Install dependencies with exact versions for security
RUN npm ci --only=production --no-audit --no-fund && \
    cd server && npm ci --only=production --no-audit --no-fund

# Install development dependencies for building
COPY package*.json ./
RUN npm ci --no-audit --no-fund

# ============================================================================
# Build stage - Build the frontend application
# ============================================================================
FROM dependencies AS builder

# Set build arguments
ARG NODE_ENV=production
ARG VITE_API_BASE_URL
ARG VITE_WS_URL
ARG VERSION
ARG BUILD_DATE
ARG VCS_REF

ENV NODE_ENV=$NODE_ENV
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_WS_URL=$VITE_WS_URL

# Copy source code
COPY . .

# Build the frontend application
RUN npm run build && \
    # Verify build output
    ls -la dist/ && \
    # Remove development dependencies to reduce size
    npm prune --production && \
    cd server && npm prune --production

# Create build info
RUN echo "{ \
    \"version\": \"${VERSION}\", \
    \"buildDate\": \"${BUILD_DATE}\", \
    \"vcsRef\": \"${VCS_REF}\", \
    \"nodeVersion\": \"$(node --version)\" \
}" > build-info.json

# ============================================================================
# Production stage - Create final production image
# ============================================================================
FROM base AS production

# Set production environment
ENV NODE_ENV=production
ENV PORT=3001
ENV HOST=0.0.0.0

# Install production dependencies
COPY --from=dependencies --chown=appuser:nodejs /app/node_modules ./node_modules
COPY --from=dependencies --chown=appuser:nodejs /app/server/node_modules ./server/node_modules

# Copy built application
COPY --from=builder --chown=appuser:nodejs /app/dist ./dist
COPY --from=builder --chown=appuser:nodejs /app/server ./server
COPY --from=builder --chown=appuser:nodejs /app/build-info.json ./

# Copy additional files
COPY --chown=appuser:nodejs package.json ./

# Create necessary directories with proper permissions
RUN mkdir -p /app/logs /app/uploads /app/cache && \
    chown -R appuser:nodejs /app/logs /app/uploads /app/cache && \
    chmod 755 /app/logs /app/uploads /app/cache

# Add health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD node server/health-check.js || exit 1

# Security hardening
RUN apk del --purge \
    && rm -rf /var/cache/apk/* \
    && rm -rf /tmp/* \
    && rm -rf /root/.npm \
    && find /app -type f -name "*.md" -delete \
    && find /app -type f -name "*.txt" -delete \
    && find /app -type f -name "LICENSE*" -delete

# Set labels for metadata
LABEL \
    org.opencontainers.image.title="MedResearch AI" \
    org.opencontainers.image.description="Enterprise Medical Research AI Platform" \
    org.opencontainers.image.version="${VERSION}" \
    org.opencontainers.image.created="${BUILD_DATE}" \
    org.opencontainers.image.revision="${VCS_REF}" \
    org.opencontainers.image.source="https://github.com/vm799/drug-trial-synetixc-integration" \
    org.opencontainers.image.url="https://medresearch-ai.com" \
    org.opencontainers.image.vendor="MedResearch AI" \
    org.opencontainers.image.licenses="MIT"

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 3001

# Set entrypoint and command
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server/bootstrap.js"]

# ============================================================================
# Development stage - For development use
# ============================================================================
FROM base AS development

ENV NODE_ENV=development

# Install all dependencies (including dev dependencies)
COPY package*.json ./
COPY server/package*.json ./server/
RUN npm install && cd server && npm install

# Install development tools
RUN npm install -g nodemon concurrently

# Copy source code
COPY . .

# Create development directories
RUN mkdir -p /app/logs /app/uploads /app/cache && \
    chown -R appuser:nodejs /app && \
    chmod -R 755 /app

USER appuser

# Expose ports for development (frontend and backend)
EXPOSE 5173 3001

# Start in development mode
CMD ["npm", "run", "dev:fullstack"]

# ============================================================================
# Test stage - For running tests
# ============================================================================
FROM base AS test

ENV NODE_ENV=test

# Install all dependencies
COPY package*.json ./
COPY server/package*.json ./server/
RUN npm ci && cd server && npm ci

# Install test browsers
RUN npx playwright install --with-deps

# Copy source code
COPY . .

# Create test directories
RUN mkdir -p /app/coverage /app/test-results && \
    chown -R appuser:nodejs /app && \
    chmod -R 755 /app

USER appuser

# Run tests
CMD ["npm", "test"]