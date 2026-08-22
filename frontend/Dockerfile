# Dockerfile for PUPBC CareLink Frontend (React 19 / Vite)
# Multi-stage build: build the app, then serve with a lightweight server.
# Build context is the frontend/ directory (rootDir in render.yaml).

# ============================================
# Build Stage
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first (for better layer caching)
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
# VITE_API_URL is set at runtime via environment variable
RUN npm run build

# ============================================
# Production Stage
# ============================================
FROM node:20-alpine AS runner

WORKDIR /app

# Install serve (lightweight static file server)
RUN npm install -g serve

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist

# Expose the port (Render sets $PORT env var)
EXPOSE $PORT

# Serve the built application
CMD ["sh", "-c", "serve -s dist -l $PORT"]
