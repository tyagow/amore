FROM node:22-slim AS base
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /app

# Install deps
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json apps/web/
COPY packages/db/package.json packages/db/
COPY packages/ai/package.json packages/ai/
COPY packages/types/package.json packages/types/
COPY packages/notifications/package.json packages/notifications/
RUN pnpm install --frozen-lockfile

# Build
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages/db/node_modules ./packages/db/node_modules
COPY --from=deps /app/packages/ai/node_modules ./packages/ai/node_modules
COPY --from=deps /app/packages/notifications/node_modules ./packages/notifications/node_modules
COPY . .
RUN pnpm --filter @amore-couples/web build

# Run
FROM base AS runner
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages/db/node_modules ./packages/db/node_modules
COPY --from=deps /app/packages/notifications/node_modules ./packages/notifications/node_modules
COPY --from=build /app/apps/web/.output ./apps/web/.output
COPY packages/db/drizzle ./packages/db/drizzle
COPY packages/db/scripts/run-migrations.mjs ./packages/db/scripts/run-migrations.mjs
COPY packages/notifications/ ./packages/notifications/
COPY apps/web/scripts/start.mjs ./apps/web/scripts/start.mjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "apps/web/scripts/start.mjs"]
