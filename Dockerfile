# Node.js 22 LTS — required by Prisma 7.x (>=22.12)
FROM node:22-alpine AS base
WORKDIR /app

# ── deps stage ──────────────────────────────────────
FROM base AS deps
RUN apk add --no-cache openssl libc6-compat
COPY package*.json ./
RUN npm ci

# ── builder stage ────────────────────────────────────
FROM base AS builder
RUN apk add --no-cache openssl
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && npm run build

# ── runner stage (production) ─────────────────────────
FROM base AS runner
RUN apk add --no-cache openssl
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000
CMD ["node", "server.js"]
