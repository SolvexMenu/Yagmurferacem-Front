# Docker Deployment Guide

## Building the Docker Image

### From the server directory:
```bash
cd apps/server
docker build -t tesetturshop-server:latest -f Dockerfile ../..
```

### From the project root:
```bash
docker build -t tesetturshop-server:latest -f apps/server/Dockerfile .
```

## Running the Container

### Using Docker Run:
```bash
docker run -d \
  --name tesetturshop-server \
  -p 3000:3000 \
  -e DATABASE_URL="your_database_url" \
  -e BETTER_AUTH_SECRET="your_secret" \
  -e BETTER_AUTH_URL="http://localhost:3000" \
  -e CORS_ORIGIN="http://localhost:3001" \
  tesetturshop-server:latest
```

### Using Docker Compose:
```bash
cd apps/server
docker-compose up -d
```

## Environment Variables

Create a `.env` file in `apps/server/` with:

```env
DATABASE_URL=postgresql://user:password@host:5432/database
BETTER_AUTH_SECRET=your_secret_key
BETTER_AUTH_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3001
```

## Database Migrations

Before running the container, ensure your database is set up:

```bash
# Push schema to database
pnpm db:push

# Or run migrations
pnpm db:migrate
```

For production, you may want to run migrations as part of your deployment pipeline before starting the container.

## Production Deployment Tips

1. **Use a managed PostgreSQL service** (AWS RDS, Neon, Supabase, etc.)
2. **Set strong secrets** for BETTER_AUTH_SECRET
3. **Use environment-specific URLs** for BETTER_AUTH_URL and CORS_ORIGIN
4. **Enable SSL** for database connections in production
5. **Set up monitoring** and logging
6. **Use a reverse proxy** (nginx, Caddy) for SSL termination
7. **Run database migrations** before deploying new versions

## Health Check

The container includes a health check that pings the root endpoint every 30 seconds.

## Security Features

- Multi-stage build for minimal image size
- Non-root user (bunuser) for running the application
- Only production dependencies included
- OpenSSL included for Prisma
