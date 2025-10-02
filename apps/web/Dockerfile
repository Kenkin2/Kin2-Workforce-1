FROM node:18-alpine AS base

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy root package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY turbo.json ./

# Copy shared packages
COPY packages/ ./packages/

# Copy web app
COPY apps/web/ ./apps/web/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build the web app
RUN pnpm build --filter=@kin2/web

# Production stage
FROM node:18-alpine AS production

RUN npm install -g pnpm

WORKDIR /app

# Copy built application
COPY --from=base /app/apps/web/.next ./.next
COPY --from=base /app/apps/web/package.json ./
COPY --from=base /app/apps/web/public ./public
COPY --from=base /app/apps/web/next.config.js ./
COPY --from=base /app/apps/web/node_modules ./node_modules

EXPOSE 3000

CMD ["pnpm", "start"]