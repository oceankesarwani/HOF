# --- Stage 1: Dependency & Build ---
FROM node:20-alpine AS builder
RUN apk add --no-cache curl
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm install
COPY . .
RUN npx prisma generate
# Pass NEXT_PHASE to unblock evaluation
ENV NEXT_PHASE=phase-production-build
RUN npm run build

# --- Stage 2: Production Runner ---
FROM node:20-alpine AS runner
RUN apk add --no-cache curl
WORKDIR /app

ENV NODE_ENV=production
# Add build-time gate to runner as well
ENV NEXT_PHASE=phase-production-run

# Copy only what is needed to run the app
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

# Expose the tactical port
EXPOSE 3000

CMD ["npm", "start"]
