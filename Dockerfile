# Node.js 22 LTS — satisfies Prisma 7.x requirement (>=22.12)
FROM node:22-alpine

WORKDIR /app

# openssl: required by Prisma engines
# python3 make g++: required to compile better-sqlite3 from source on Alpine (musl — no prebuilt binaries)
RUN apk add --no-cache openssl libc6-compat python3 make g++

COPY package*.json ./
RUN npm ci

COPY . .

RUN npx prisma generate && npm run build

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV NODE_ENV=production
ENV DATABASE_URL="file:/data/tokenscout.db"

# Create /data for SQLite, run migrations, start Next.js
CMD ["sh", "-c", "mkdir -p /data && npx prisma migrate deploy && npm start"]
