FROM node:20-alpine AS base
RUN corepack enable

# -- Install dependencies --
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/server/package.json apps/server/
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile

# -- Build --
FROM base AS builder
WORKDIR /app
COPY --from=deps /app ./
COPY . .
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_WS_URL
ARG NEXT_PUBLIC_ARINOVA_URL
ARG NEXT_PUBLIC_ARINOVA_CLIENT_ID
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_WS_URL=${NEXT_PUBLIC_WS_URL}
ENV NEXT_PUBLIC_ARINOVA_URL=${NEXT_PUBLIC_ARINOVA_URL}
ENV NEXT_PUBLIC_ARINOVA_CLIENT_ID=${NEXT_PUBLIC_ARINOVA_CLIENT_ID}
RUN pnpm build

# -- Runner --
FROM base AS runner
WORKDIR /app
COPY --from=builder /app ./
EXPOSE 3000 3001
CMD ["sh", "-c", "npx tsx apps/server/src/index.ts & npx next start apps/web -p 3000"]
