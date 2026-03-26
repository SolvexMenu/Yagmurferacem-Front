# Build stage
FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files (from the app folder or root if it's a workspace)
# Since we are in Frontend/apps/web, we need to handle the workspace if possible.
# But for simplicity, we'll assume a standalone build if it works.
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install

# Copy source
COPY . .

# Build the app
RUN pnpm run build

# Production stage
FROM nginx:stable-alpine

# Copy build output to nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom nginx config if needed, or just use default
# EXPOSE 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
