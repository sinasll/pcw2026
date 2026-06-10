# Multi-stage production Dockerfile for PredictCup 2026

FROM node:20-alpine AS builder

WORKDIR /app

# Install system dependencies (IMPORTANT for Prisma + OpenSSL)
RUN apk add --no-cache openssl libc6-compat

COPY package*.json ./
RUN npm install

COPY . .

# Generate Prisma client
RUN npx prisma generate

FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production

# IMPORTANT: Prisma OpenSSL fix for Alpine
RUN apk add --no-cache openssl libc6-compat

COPY --from=builder /app ./

EXPOSE 3000

CMD ["node", "server.js"]
