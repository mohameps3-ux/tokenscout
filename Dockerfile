# Node.js 22 LTS - satisfies Prisma 7.x requirement (>=22.12)
FROM node:22-alpine

WORKDIR /app

# openssl: required by Prisma engines
# python3 make g++: required to compile better-sqlite3 from source on Alpine (musl - no prebuilt binaries)
RUN apk add --no-cache openssl libc6-compat python3 make g++

COPY package*.json ./
RUN npm ci

COPY . .

RUN npx prisma generate && npx next build

# Copy static assets into the standalone output — the standalone server does not
# include these automatically and will 503 on /_next/static/* without them.
RUN cp -r .next/static .next/standalone/.next/static && \
    cp -r public .next/standalone/public

ENV HOSTNAME=0.0.0.0
ENV NODE_ENV=production

EXPOSE 8080

CMD ["sh", "-c", "mkdir -p /data && node node_modules/prisma/build/index.js migrate deploy && node .next/standalone/server.js"]
