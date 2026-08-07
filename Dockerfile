# Two-stage only (less disk during Coolify builds). Uses corepack — no `npm i -g pnpm`.

FROM node:22-bookworm-slim AS build
WORKDIR /app

RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates \
 && rm -rf /var/lib/apt/lists/* \
 && corepack enable \
 && corepack prepare pnpm@11.15.1 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN pnpm install --frozen-lockfile

COPY . .

ENV NODE_ENV=production
ENV NITRO_PRESET=node-server
ENV NODE_OPTIONS=--max-old-space-size=2048

RUN pnpm run build \
 && rm -rf node_modules .nuxt

# ---- Runtime ----
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
COPY --from=build --chown=node:node /app/seed ./seed
COPY --chown=node:node docker-entrypoint.sh ./docker-entrypoint.sh

RUN ln -s .output/server/node_modules node_modules \
 && chmod +x docker-entrypoint.sh

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1

ENTRYPOINT ["./docker-entrypoint.sh"]
