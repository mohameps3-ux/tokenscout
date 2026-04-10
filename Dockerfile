# ── Stage 1: install deps ────────────────────────────────────────────────────
FROM node:24-slim AS deps

# Build tools required for better-sqlite3 native module compilation
RUN apt-get update && \
    apt-get install -y python3 make g++ && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# ── Stage 2: build ───────────────────────────────────────────────────────────
FROM node:24-slim AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build Next.js (standalone output)
RUN npm run build

# ── Stage 3: production runner ───────────────────────────────────────────────
FROM node:24-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Persistent volume mount point for SQLite database
RUN mkdir -p /data && chown nextjs:nodejs /data

# Next.js standalone output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Prisma schema + migrations (needed for migrate deploy at runtime)
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Prisma generated client
COPY --from=builder --chown=nextjs:nodejs /app/app/generated ./app/generated

# Prisma CLI + engines (needed to run migrate deploy on startup)
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

# better-sqlite3 native binary (traced by standalone but copy explicitly to be safe)
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/better-sqlite3 ./node_modules/better-sqlite3
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma/adapter-better-sqlite3 ./node_modules/@prisma/adapter-better-sqlite3

# Startup script
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
# Default DB path — override with DATABASE_URL env var in Railway
ENV DATABASE_URL="file:/data/tokenscout.db"

CMD ["./docker-entrypoint.sh"]
