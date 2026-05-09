# Stage 1: Build Backend
FROM node:20-alpine AS builder
WORKDIR /app
# Need root workspace + lockfile for npm ci
COPY package*.json ./
COPY backend/package*.json ./backend/
RUN npm ci
COPY backend/ ./backend/
WORKDIR /app/backend
RUN npx nest build

# Stage 2: Production
FROM node:20-alpine
WORKDIR /app

# Copy built backend
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/node_modules ./node_modules
COPY --from=builder /app/backend/package*.json ./

# Create uploads directory
RUN mkdir -p uploads

EXPOSE 3000

ENV NODE_ENV=production

CMD ["node", "dist/main"]
