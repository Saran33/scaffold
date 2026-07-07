# Scaffold - FastAPI + Next.js Starter

A production-ready starter template for full-stack web applications.

## Features

- **Backend**: FastAPI with SQLAlchemy, Alembic migrations, JWT auth
- **Frontend**: Next.js with App Router, Tailwind CSS, TypeScript
- **Database**: PostgreSQL with Redis caching
- **DevOps**: Docker Compose, Makefile automation
- **Auth**: JWT + OAuth2 patterns, role-based access control
- **Email**: Template-based email system with SMTP support

## Quick Start

### From GitHub Template

1. Click **"Use this template"** on GitHub to create your own repository
2. Clone your new repository:
   ```bash
   git clone git@github.com:YOUR_USERNAME/YOUR_REPO.git
   cd YOUR_REPO
   ```
3. Run the setup script to rename the project:
   ```bash
   ./scripts/rename-project.sh myproject
   ```
4. Copy and configure environment files:
   ```bash
   cp scaffold_api/.env.example scaffold_api/.env
   cp scaffold_frontend/.env.example scaffold_frontend/.env.local
   # Edit the .env files with your configuration
   ```
5. Start developing:
   ```bash
   # Terminal 1: Start databases and backend
   make compose-backend

   # Terminal 2: Start frontend
   cd myproject_frontend && pnpm install && pnpm dev
   ```
6. Open http://localhost:3000

### Manual Setup (without renaming)

1. Clone this repository
2. Copy environment files:
   ```bash
   cp scaffold_api/.env.example scaffold_api/.env
   cp scaffold_frontend/.env.example scaffold_frontend/.env.local
   ```
3. Update `.env` files with your configuration
4. Start services:
   ```bash
   make compose-backend
   cd scaffold_frontend && pnpm install && pnpm dev
   ```

## Project Structure

```
├── scaffold_api/              # FastAPI backend
│   ├── app/
│   │   ├── api/              # API routes
│   │   ├── core/             # Config, auth, security
│   │   ├── db/               # Models, CRUD, migrations
│   │   ├── services/         # Business logic
│   │   └── schemas/          # Pydantic models
│   └── tests/
├── scaffold_frontend/         # Next.js frontend
│   └── src/
│       ├── app/              # Pages (App Router)
│       ├── components/
│       ├── lib/              # Utilities
│       └── types/
├── databases/                 # Database Dockerfiles
├── docker-compose.yaml
└── Makefile
```

## Available Commands

### Development

```bash
make compose-backend          # Start API with databases
make compose-frontend         # Start frontend in Docker
make compose-dependencies     # Start only databases (Postgres, Redis)
make backend-run-local        # Run backend locally (outside Docker)
```

### Database

```bash
make db-migrate               # Run Alembic migrations
make db-add-migration MESSAGE="description"  # Create new migration
make db-populate              # Seed initial data
make db-refresh               # Reset database (down, up, migrate, seed)
```

### Testing

```bash
make test-backend             # Run all backend tests
make test-unit-backend        # Run unit tests only
make test-integration-backend # Run integration tests only
```

### Code Quality

```bash
make lint                     # Run all linters (ruff, mypy, pre-commit)
make ruff                     # Format and fix with ruff
make mypy                     # Type checking
```

### Docker

```bash
make compose-down             # Stop all containers
make compose-breakdown        # Stop and remove volumes
make prune-images             # Clean up unused images
```

## Configuration

### Backend Configuration (`scaffold_api/configurations/<env>_config.toml`)

Non-secret settings live in the per-environment TOML files
(`local_config.toml`, `dev_config.toml`, `prod_config.toml`):
- `POSTGRES_*` - Database connection
- `REDIS_*` - Redis connection
- `SECRET_KEY` - JWT signing key (generate with `openssl rand -hex 32`).
  Must be set in `dev`/`stage`/`prod`; the app refuses to boot otherwise.
- `SMTP_*` - Email configuration (optional)

Secrets and local overrides go in `scaffold_api/.env` (see
`scaffold_api/.env.example`), e.g. `FIRST_SUPERUSER_PASSWORD`. In deployed
environments secrets are sourced from Google Secret Manager.

### Frontend Environment (`scaffold_frontend/.env.local`)

Key variables to configure:
- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NEXTAUTH_URL` - Frontend URL for auth callbacks
- `NEXTAUTH_SECRET` - NextAuth signing key

## License

MIT
