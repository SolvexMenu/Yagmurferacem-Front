FROM oven/bun:latest

WORKDIR /app

# Install dependencies for Prisma and healthcheck
RUN apt-get update && apt-get install -y openssl curl && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package.json bun.lock ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source
COPY . .

# Generate Prisma client
RUN bun run db:generate

# Build the application
RUN bun run build

# Expose the application port
EXPOSE 3000

# Set ENVs
ENV NODE_ENV=production
ENV PORT=3000

# Add Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

# Start the application
CMD ["bun", "run", "dist/index.js"]
