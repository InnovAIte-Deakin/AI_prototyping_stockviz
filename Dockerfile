# Multi-stage build for Stock Analysis App
# Stage 1: Build Frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY Frontend/package*.json ./
COPY Frontend/bun.lockb ./

# Install dependencies (using npm since Docker might not have bun)
RUN npm ci

# Copy frontend source
COPY Frontend/ ./

# Build frontend
RUN npm run build

# Stage 2: Build Backend and serve frontend
FROM node:18-alpine AS production

WORKDIR /app

# Install backend dependencies
COPY Backend/backend/package*.json ./
RUN npm ci --only=production

# Copy backend source
COPY Backend/backend/ ./

# Copy built frontend from stage 1
COPY --from=frontend-builder /app/frontend/dist ./dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["node", "server.js"]
