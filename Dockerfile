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

# Generate Prisma Client, apply migrations, and seed (bakes DB into image)
RUN if [ -f "prisma/schema.prisma" ]; then \
      echo "Generating Prisma Client..." && pnpm prisma generate && \
      echo "Applying migrations..." && pnpm exec prisma migrate deploy && \
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

# Copy pre-seeded database into image and prepare startup script to hydrate volume
RUN mkdir -p /app/data /app/.seed
COPY --from=builder /app/playlist.db /app/.seed/playlist.db

# Create directory for database with proper permissions
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"
ENV DATABASE_URL="file:/app/data/playlist.db"

# Hydrate DB volume on start (if missing) and run server
CMD ["sh", "-lc", "if [ ! -f /app/data/playlist.db ] && [ -f /app/.seed/playlist.db ]; then cp /app/.seed/playlist.db /app/data/playlist.db; fi; node server.js"]

