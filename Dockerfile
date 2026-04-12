# Node.js 22 LTS - satisfies Prisma 7.x requirement (>=22.12)
FROM node:22-alpine

WORKDIR /app

# openssl: required by Prisma engines
# python3 make g++: required to compile better-sqlite3 from source on Alpine (musl - no prebuilt binaries)
RUN apk add --no-cache openssl libc6-compat python3 make g++

COPY package*.json ./
RUN npm ci

COPY . .

# Use --no-turbopack to avoid Edge Runtime compilation issues with Prisma/node:path
RUN npx prisma generate && npx next build --no-turbopack

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV NODE_ENV=production

CMD ["node", ".next/standalone/server.js"]
