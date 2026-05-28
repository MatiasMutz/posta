# Web Next.js — Posta
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@11.3.0 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/
COPY packages/money/package.json packages/money/
COPY packages/shared-types/package.json packages/shared-types/
COPY packages/validation/package.json packages/validation/
RUN pnpm install --frozen-lockfile

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
RUN pnpm build:packages && pnpm --filter web build

FROM node:22-alpine AS runner
RUN corepack enable && corepack prepare pnpm@11.3.0 --activate
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/web ./apps/web
COPY --from=build /app/packages ./packages
WORKDIR /app/apps/web
EXPOSE 3000
CMD ["pnpm", "start"]
