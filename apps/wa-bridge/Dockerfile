FROM node:22-slim AS base
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /app

# Install deps
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/wa-bridge/package.json apps/wa-bridge/
COPY packages/db/package.json packages/db/
COPY packages/ai/package.json packages/ai/
COPY packages/types/package.json packages/types/
RUN pnpm install --frozen-lockfile

# Run (tsx handles workspace .ts imports at runtime)
FROM base AS runner
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/wa-bridge/node_modules ./apps/wa-bridge/node_modules
COPY --from=deps /app/packages/db/node_modules ./packages/db/node_modules
COPY --from=deps /app/packages/ai/node_modules ./packages/ai/node_modules
COPY packages/ ./packages/
COPY apps/wa-bridge/ ./apps/wa-bridge/
COPY tsconfig.base.json ./
EXPOSE 3000
ENV PORT=3000
CMD ["npx", "tsx", "apps/wa-bridge/src/index.ts"]
