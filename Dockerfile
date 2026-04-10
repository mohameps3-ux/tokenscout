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

RUN npx prisma generate
RUN npm run build

# ── Stage 3: production runner ───────────────────────────────────────────────
FROM node:24-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Persistent volume mount point for SQLite
RUN mkdir -p /data && chown nextjs:nodejs /data

# Next.js standalone output (includes traced JS node_modules)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Prisma schema + migrations
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Generated Prisma client
COPY --from=builder --chown=nextjs:nodejs /app/app/generated ./app/generated

# Prisma CLI + migration engine (for prisma migrate deploy at startup)
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma/engines ./node_modules/@prisma/engines

# better-sqlite3 native binary (standalone doesn't reliably trace .node files)
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/better-sqlite3/build ./node_modules/better-sqlite3/build

# Startup script
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_URL="file:/data/tokenscout.db"

CMD ["./docker-entrypoint.sh"]
