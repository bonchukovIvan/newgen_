FROM node:22-bookworm-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
FROM base AS dependencies
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci --no-audit --no-fund
FROM dependencies AS build
COPY . .
RUN npm run build
FROM base AS runtime
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/components ./components
COPY --from=build --chown=node:node /app/lib ./lib
COPY --from=build --chown=node:node /app/vendor ./vendor
COPY --from=build --chown=node:node /app/config ./config
COPY --from=build --chown=node:node /app/scripts ./scripts
COPY --from=build --chown=node:node /app/prisma ./prisma
COPY --from=build --chown=node:node /app/tsconfig.json ./tsconfig.json
COPY --from=dependencies --chown=node:node /app/node_modules ./node_modules
RUN mkdir -p public/uploads generated-sites && chown -R node:node public/uploads generated-sites
USER node
EXPOSE 3000
CMD ["sh", "scripts/start.sh"]
