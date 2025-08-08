# 🔐 QUANKEY SECURE FRONTEND - PRODUCTION DOCKER
# Military-grade React application with security hardening

FROM node:18-alpine AS builder

# Security: Install security updates
RUN apk update && apk upgrade && apk add --no-cache \
    dumb-init \
    curl \
    ca-certificates \
    && rm -rf /var/cache/apk/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with security audit
RUN npm ci --audit --audit-level=high
RUN npm audit signatures

# Copy source code
COPY public/ ./public/
COPY src/ ./src/
COPY tsconfig.json ./

# Build optimized production bundle
ENV NODE_ENV=production
ENV REACT_APP_API_URL=https://api.quankey.xyz
ENV GENERATE_SOURCEMAP=false

RUN npm run build

# Production stage with Nginx
FROM nginx:alpine AS production

# Security: Install updates and create non-root user
RUN apk update && apk upgrade && apk add --no-cache \
    dumb-init \
    curl \
    ca-certificates \
    && rm -rf /var/cache/apk/* \
    && addgroup -g 1001 -S nodejs \
    && adduser -S quankey -u 1001

# Copy built application
COPY --from=builder /app/build /usr/share/nginx/html

# Copy secure Nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf
COPY nginx-security.conf /etc/nginx/conf.d/security.conf

# Security: Set proper ownership
RUN chown -R quankey:nodejs /usr/share/nginx/html
RUN chown -R quankey:nodejs /var/cache/nginx
RUN chown -R quankey:nodejs /var/log/nginx
RUN chown -R quankey:nodejs /var/run

# Create nginx directories with proper permissions
RUN mkdir -p /var/cache/nginx/client_temp \
    && mkdir -p /var/cache/nginx/proxy_temp \
    && mkdir -p /var/cache/nginx/fastcgi_temp \
    && mkdir -p /var/cache/nginx/uwsgi_temp \
    && mkdir -p /var/cache/nginx/scgi_temp \
    && chown -R quankey:nodejs /var/cache/nginx

# Switch to non-root user
USER quankey

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:80/ || exit 1

# Expose port
EXPOSE 80

# Start Nginx with dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["nginx", "-g", "daemon off;"]

# Security labels
LABEL maintainer="Quankey Security Team"
LABEL version="2.0.0"
LABEL description="Quankey Secure Frontend - Military-Grade Password Manager UI"
LABEL security.scan="required"
LABEL security.non-root="true"
LABEL security.minimal="true"