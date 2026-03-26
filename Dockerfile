# Build stage
FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy root workspace files
# Depending on the context, we need to copy things to build.
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml ./

# Since it's a monorepo, some packages might be needed.
# We'll copy all apps and packages first for simplicity in build context.
# In a real environment, you'd prune first, but for correctness let's copy first.
COPY . .

# Install dependencies (frozen-lockfile might be better if you have a reliable lockfile)
RUN pnpm install

# Build the web application (using --filter web as in root package.json)
RUN pnpm --filter web run build

# Production stage
FROM nginx:stable-alpine

# Copy built files from the web app's dist folder
COPY --from=build /app/apps/web/dist /usr/share/nginx/html

# Add a basic Nginx config to handle client-side routing (SPAs)
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
