# Multi-stage Dockerfile for Next.js Music Player Application

# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat python3 make g++ sqlite
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Copy postinstall script (creates directory if needed)
COPY scripts/ ./scripts/

# Install dependencies
# Allow lockfile to be updated if package.json changed
RUN pnpm install --no-frozen-lockfile

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Install pnpm and build dependencies
RUN apk add --no-cache libc6-compat python3 make g++ sqlite
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy all source files
COPY . .

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

# Set DATABASE_URL for Prisma (needed for generation during build)
ENV DATABASE_URL="file:/app/playlist.db"

# Generate Prisma Client, push schema (works without migrations), and seed (bakes DB into image)
RUN if [ -f "prisma/schema.prisma" ]; then \
      echo "Generating Prisma Client..." && pnpm prisma generate && \
      echo "Pushing schema to SQLite..." && pnpm exec prisma db push --accept-data-loss && \
      echo "Seeding database..." && pnpm run db:seed || true ; \
    else echo "No Prisma schema found" ; fi

# Build the application
RUN pnpm build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Make sure we have sqlite and wget available at runtime (wget for healthcheck)
RUN apk add --no-cache sqlite wget

# Copy necessary files from builder
COPY --from=builder /app/public ./public

# Copy standalone output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Also copy production node_modules so custom server (server.js) can require its deps (e.g., socket.io)
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules

# Copy pre-seeded database into image and prepare startup script to hydrate volume
RUN mkdir -p /app/data /app/.seed
COPY --from=builder /app/playlist.db /app/.seed/playlist.db

# Create directory for database with proper permissions
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data

EXPOSE 3000
EXPOSE 4000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"
ENV DATABASE_URL="file:/app/data/playlist.db"
# Ensure Node can resolve modules from standalone bundle when running custom server
ENV NODE_PATH="/app/.next/standalone/node_modules"

# Copy custom server script (Socket.IO + Next) into runtime image
COPY --from=builder /app/server.js /app/server.js
COPY --from=builder /app/start.sh /app/start.sh
RUN chmod +x /app/start.sh && chown nextjs:nodejs /app/start.sh

# Hydrate DB volume on start (if missing) and run custom server (serves Next.js + Socket.IO)
USER nextjs

CMD ["/app/start.sh"]

