FROM node:22-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json ./
COPY bot/package.json ./bot/package.json
COPY client/package.json ./client/package.json
RUN npm ci --workspace bot --include-workspace-root

COPY bot/tsconfig.json ./bot/tsconfig.json
COPY bot/src ./bot/src
RUN npm run build --workspace bot

FROM node:22-alpine AS runtime

ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
COPY bot/package.json ./bot/package.json
COPY client/package.json ./client/package.json
RUN npm ci --workspace bot --omit=dev --ignore-scripts && npm cache clean --force
COPY --from=builder /app/bot/dist ./bot/dist

USER node
WORKDIR /app/bot
CMD ["node", "dist/main.js"]
