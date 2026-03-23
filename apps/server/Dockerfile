# # Base stage with Bun and dependencies
# FROM oven/bun:latest AS base
# WORKDIR /app

# # Install OpenSSL for Prisma and pnpm
# RUN apt-get update && \
#     apt-get install -y openssl && \
#     rm -rf /var/lib/apt/lists/* && \
#     bun install -g pnpm

# # Copy package files
# COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# COPY apps/server/package.json ./apps/server/

# # Install all dependencies including Prisma
# RUN pnpm install --frozen-lockfile --filter server...

# # Copy source code including Prisma schema
# COPY apps/server ./apps/server

# # Generate Prisma client and build
# RUN cd apps/server && pnpx prisma generate && cd ../.. && \
#     pnpx tsdown build

# # Production stage
# FROM oven/bun:latest
# WORKDIR /app

# ENV NODE_ENV=production

# # Create non-root user
# RUN addgroup --system --gid 1001 nodejs && \
#     adduser --system --uid 1001 bunuser

# # Copy built application
# COPY --from=base --chown=bunuser:nodejs /app/apps/server/dist ./apps/server/dist
# COPY --from=base --chown=bunuser:nodejs /app/node_modules ./node_modules
# COPY --from=base --chown=bunuser:nodejs /app/apps/server/package.json ./apps/server/

# USER bunuser
# EXPOSE 3000

# HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
#   CMD bun run -e "fetch('http://localhost:3000').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# WORKDIR /app/apps/server
# CMD ["bun", "start"]
# Base stage with Bun and dependencies
FROM oven/bun:latest AS base
WORKDIR /app

# Install OpenSSL for Prisma and pnpm
RUN apt-get update && \
    apt-get install -y openssl && \
    rm -rf /var/lib/apt/lists/* && \
    bun install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/server/package.json ./apps/server/

# Install dependencies (including production deps)
RUN pnpm install --frozen-lockfile --prod=false

# Copy all source code (needed for workspace context)
COPY apps/server ./apps/server

# Generate Prisma client and build
RUN pnpx prisma generate && \
    pnpx tsdown build

# Production stage
FROM oven/bun:latest
WORKDIR /app

ENV NODE_ENV=production

# Install OpenSSL for Prisma
RUN apt-get update && \
    apt-get install -y openssl && \
    rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 bunuser

# Copy built application and dependencies
COPY --from=base --chown=bunuser:nodejs /app/apps/server/dist ./apps/server/dist
COPY --from=base --chown=bunuser:nodejs /app/node_modules ./node_modules
COPY --from=base --chown=bunuser:nodejs /app/apps/server/node_modules ./apps/server/node_modules
COPY --from=base --chown=bunuser:nodejs /app/apps/server/package.json ./apps/server/
COPY --from=base --chown=bunuser:nodejs /app/apps/server/prisma ./apps/server/prisma

USER bunuser
EXPOSE 3000

WORKDIR /app/apps/server
CMD ["bun", "dist/index.js"]