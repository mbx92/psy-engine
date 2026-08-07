# Slim Coolify-friendly build: final image = Nitro output only (no full pnpm install)

# ---- Dependencies ----
FROM node:22-bookworm-slim AS deps
WORKDIR /app
RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates \
 && rm -rf /var/lib/apt/lists/* \
 && npm install -g pnpm@11.15.1
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN pnpm install --frozen-lockfile

# ---- Build ----
FROM node:22-bookworm-slim AS build
WORKDIR /app
RUN npm install -g pnpm@11.15.1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
ENV NITRO_PRESET=node-server
ENV NODE_OPTIONS=--max-old-space-size=4096
RUN pnpm run build

# ---- Production (tiny) ----
FROM node:22-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates wget \
 && rm -rf /var/lib/apt/lists/*

COPY --from=build --chown=node:node /app/.output ./.output
COPY --from=build --chown=node:node /app/db/migrations ./db/migrations
COPY --from=build --chown=node:node /app/db/schema ./db/schema
COPY --from=build --chown=node:node /app/scripts ./scripts
COPY --chown=node:node docker-entrypoint.sh ./docker-entrypoint.sh

# ESM resolve: scripts import drizzle-orm/postgres/bcryptjs from Nitro bundle
RUN ln -s .output/server/node_modules node_modules \
 && chmod +x docker-entrypoint.sh

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1

ENTRYPOINT ["./docker-entrypoint.sh"]
