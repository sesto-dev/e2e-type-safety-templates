# ---------- builder ----------
FROM node:20-bullseye AS builder
WORKDIR /usr/src/app

# enable corepack & prepare pnpm version (match your repo)
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# copy lockfile & package.json first (improves caching)
COPY package.json pnpm-lock.yaml ./

# install deps (dev deps included so we can run prisma generate + build)
RUN pnpm install --frozen-lockfile

# copy source
COPY . .

# build project
RUN pnpm run build

# ---------- runtime ----------
FROM node:20-bullseye-slim AS runner
WORKDIR /usr/src/app

# copy production node_modules, dist, prisma, etc.
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/prisma ./prisma
COPY package.json ./

ENV NODE_ENV=production
ENV PORT=3000

# Ensure the node user can write to the app dir (prevents EACCES when GraphQL tries to write)
# This runs as root during the build and sets ownership to the built-in 'node' user.
RUN chown -R node:node /usr/src/app

# switch to non-root user
USER node

EXPOSE 3000

CMD ["node", "dist/main"]
