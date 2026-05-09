# Stage 1: Build Backend
FROM node:20-alpine AS builder
WORKDIR /app

# Copy ALL package.json files for workspace resolution
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install ALL dependencies (workspaces hoist to /app/node_modules)
RUN npm ci

# Copy source code
COPY backend/ ./backend/
COPY frontend/ ./frontend/

# Build backend
WORKDIR /app/backend
RUN npx nest build

# Stage 2: Production
FROM node:20-alpine
WORKDIR /app

# Copy built dist
COPY --from=builder /app/backend/dist ./dist

# Copy node_modules from ROOT (workspaces hoist everything there)
COPY --from=builder /app/node_modules ./node_modules

# Copy backend package.json for runtime resolution
COPY --from=builder /app/backend/package*.json ./

# Create uploads directory
RUN mkdir -p uploads

EXPOSE 3000

ENV NODE_ENV=production

CMD ["node", "dist/main"]
