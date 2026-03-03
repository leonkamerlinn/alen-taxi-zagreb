# Stage 1: Build
FROM node:20-alpine AS build

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

COPY --from=build /app/.output ./.output

ENV PORT=8080
ENV HOST=0.0.0.0

EXPOSE 8080

CMD ["node", ".output/server/index.mjs"]
