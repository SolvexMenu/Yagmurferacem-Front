# Project: tesetturshop

## Project Overview

This is a full-stack e-commerce web application for "tesettur" clothing, built with a modern TypeScript stack. The project is a monorepo, separated into a `web` (frontend) and `server` (backend) application.

**Key Technologies:**

*   **Frontend (React + TanStack Router):** The web application is built with React and uses TanStack Router for type-safe, file-based routing. The UI is styled with TailwindCSS and utilizes shadcn/ui components.
*   **Backend (Hono + oRPC):** The backend is a lightweight Hono server that uses oRPC for end-to-end type-safe APIs.
*   **Database (PostgreSQL + Prisma):** The application uses a PostgreSQL database with Prisma as the ORM for type-safe database access.
*   **Authentication:** The project uses `better-auth` for authentication.
*   **Runtime:** The project uses Bun as the runtime environment.

## Building and Running

**1. Install Dependencies:**

```bash
pnpm install
```

**2. Database Setup:**

*   Ensure you have a PostgreSQL database running.
*   Copy the `.env.example` file in `apps/server` to a new file named `.env`.
*   Update the `.env` file with your PostgreSQL connection string.
*   Push the database schema:

```bash
pnpm db:push
```

**3. Run the Development Servers:**

```bash
pnpm dev
```

*   The web application will be available at `http://localhost:3001`.
*   The API server will be running at `http://localhost:3000`.

**Other useful commands:**

*   `pnpm build`: Build both the `web` and `server` applications.
*   `pnpm dev:web`: Start only the web application.
*   `pnpm dev:server`: Start only the server application.
*   `pnpm db:studio`: Open the Prisma Studio to view and manage your database.

## Development Conventions

*   **TypeScript:** The entire codebase is written in TypeScript, and type safety is a core principle of the project.
*   **oRPC:** The project uses oRPC for defining and consuming APIs, ensuring type safety between the frontend and backend.
*   **File-based Routing:** The web application uses TanStack Router for file-based routing. New routes can be created by adding files to the `apps/web/src/routes` directory.
*   **UI Components:** The project uses `shadcn/ui` for a set of reusable and accessible UI components.
