# syntax=docker/dockerfile:1.7

# --- build stage: install all deps, compile TS ---
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --no-audit --no-fund
COPY tsconfig.json ./
COPY src ./src
RUN npx tsc

# --- prod-deps stage: production-only node_modules for the runtime image ---
FROM node:20-alpine AS prod-deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force

# --- runtime: minimal image, non-root, only compiled output + prod deps ---
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# wget is the smallest curl-equivalent already present in alpine via busybox,
# but explicit install keeps the HEALTHCHECK portable.
RUN apk add --no-cache tini wget \
 && mkdir -p /app/uploads \
 && chown -R node:node /app

COPY --chown=node:node --from=prod-deps /app/node_modules ./node_modules
COPY --chown=node:node --from=builder   /app/dist         ./dist
COPY --chown=node:node package*.json ./

USER node

EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3001/api/health > /dev/null 2>&1 || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/main.js"]
