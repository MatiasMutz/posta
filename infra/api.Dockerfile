# API NestJS — Posta
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@11.3.0 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY packages/money/package.json packages/money/
COPY packages/shared-types/package.json packages/shared-types/
COPY packages/validation/package.json packages/validation/
RUN pnpm install --frozen-lockfile

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build:packages && pnpm --filter api build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/apps/api/package.json ./
COPY --from=build /app/node_modules ./node_modules
EXPOSE 3001
CMD ["node", "dist/main.js"]
