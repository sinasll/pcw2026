# Multi-stage production Dockerfile for PredictCup 2026
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npx prisma generate

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/server.js ./
COPY --from=builder /app/.env.example ./.env
EXPOSE 3000
CMD ["node", "server.js"]