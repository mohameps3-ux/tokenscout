# Node.js 22 LTS — satisfies Prisma 7.x requirement (>=22.12)
FROM node:22-alpine

WORKDIR /app

# Install system dependencies for native modules
RUN apk add --no-cache openssl libc6-compat

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client and build Next.js app
RUN npx prisma generate && npm run build

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV NODE_ENV=production

# Start: run migrations then start Next.js
CMD npx prisma migrate deploy && npm start
