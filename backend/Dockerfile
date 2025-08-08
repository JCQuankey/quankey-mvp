# 🔐 QUANKEY SECURE BACKEND - PRODUCTION DOCKER
# Military-grade security configuration for enterprise deployment

FROM node:18-alpine AS builder

# Security: Run as non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S quankey -u 1001

# Install security updates
RUN apk update && apk upgrade && apk add --no-cache \
    dumb-init \
    curl \
    ca-certificates \
    && rm -rf /var/cache/apk/*

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./
COPY tsconfig.prod.json ./

# Install dependencies with security audit
RUN npm ci --only=production --audit --audit-level=high
RUN npm audit signatures

# Copy source code
COPY src/ ./src/
COPY prisma/ ./prisma/

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript to JavaScript
RUN npm run build

# Remove dev dependencies and source code for production
RUN npm prune --production
RUN rm -rf src/ tsconfig*.json

# Production stage - minimal footprint
FROM node:18-alpine AS production

# Security hardening
RUN addgroup -g 1001 -S nodejs
RUN adduser -S quankey -u 1001

# Install security updates and minimal runtime deps
RUN apk update && apk upgrade && apk add --no-cache \
    dumb-init \
    curl \
    ca-certificates \
    && rm -rf /var/cache/apk/* \
    && rm -rf /tmp/*

WORKDIR /app

# Copy built application from builder stage
COPY --from=builder --chown=quankey:nodejs /app/dist ./dist
COPY --from=builder --chown=quankey:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=quankey:nodejs /app/package*.json ./
COPY --from=builder --chown=quankey:nodejs /app/prisma ./prisma

# Create non-root user directories
RUN mkdir -p /app/logs && chown -R quankey:nodejs /app/logs
RUN mkdir -p /tmp && chown -R quankey:nodejs /tmp

# Security: Switch to non-root user
USER quankey

# Environment variables for production
ENV NODE_ENV=production
ENV PORT=5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Expose port
EXPOSE 5000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the secure server
CMD ["node", "dist/secureServer.js"]

# Security labels
LABEL maintainer="Quankey Security Team"
LABEL version="2.0.0"
LABEL description="Quankey Secure Backend - World's Most Secure Password Manager"
LABEL security.scan="required"
LABEL security.non-root="true"
LABEL security.minimal="true"