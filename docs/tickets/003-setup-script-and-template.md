# 003: Setup Script and GitHub Template

**Status**: `[ ]` Not started
**Depends on**: 001-remove-business-logic, 002-rename-standardize
**Blocked by**: Renaming must be complete first

---

## Overview

Create the initialization script and configure the repository as a GitHub template for easy project bootstrapping.

---

## Objectives

- [ ] Create comprehensive setup/init script
- [ ] Create `.env.example` files with documentation
- [ ] Update README with template usage instructions
- [ ] Configure GitHub template repository settings
- [ ] Test full workflow from template to running app

---

## Setup Script

### `scripts/init-project.sh`

Full initialization script that handles:
1. Project renaming
2. Environment file generation
3. Git reinitialization (optional)
4. Dependency installation
5. Database setup

```bash
#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_step() {
    echo -e "${GREEN}==>${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}Warning:${NC} $1"
}

print_error() {
    echo -e "${RED}Error:${NC} $1"
}

# Parse arguments
PROJECT_NAME=""
SKIP_DEPS=false
SKIP_GIT=false
DB_NAME=""
API_PORT="8123"
FRONTEND_PORT="3000"

usage() {
    echo "Usage: $0 <project_name> [options]"
    echo ""
    echo "Arguments:"
    echo "  project_name    Name for your new project (lowercase, underscores ok)"
    echo ""
    echo "Options:"
    echo "  --db-name       Database name (default: <project_name>_db)"
    echo "  --api-port      Backend API port (default: 8123)"
    echo "  --frontend-port Frontend port (default: 3000)"
    echo "  --skip-deps     Skip dependency installation"
    echo "  --skip-git      Skip git reinitialization"
    echo "  -h, --help      Show this help message"
    echo ""
    echo "Example:"
    echo "  $0 myapp --db-name myapp_development --api-port 8000"
}

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            usage
            exit 0
            ;;
        --skip-deps)
            SKIP_DEPS=true
            shift
            ;;
        --skip-git)
            SKIP_GIT=true
            shift
            ;;
        --db-name)
            DB_NAME="$2"
            shift 2
            ;;
        --api-port)
            API_PORT="$2"
            shift 2
            ;;
        --frontend-port)
            FRONTEND_PORT="$2"
            shift 2
            ;;
        -*)
            print_error "Unknown option: $1"
            usage
            exit 1
            ;;
        *)
            if [ -z "$PROJECT_NAME" ]; then
                PROJECT_NAME="$1"
            else
                print_error "Unexpected argument: $1"
                usage
                exit 1
            fi
            shift
            ;;
    esac
done

# Validate project name
if [ -z "$PROJECT_NAME" ]; then
    print_error "Project name is required"
    usage
    exit 1
fi

if [[ ! "$PROJECT_NAME" =~ ^[a-z][a-z0-9_]*$ ]]; then
    print_error "Project name must be lowercase, start with a letter, and contain only letters, numbers, and underscores"
    exit 1
fi

# Set defaults
DB_NAME="${DB_NAME:-${PROJECT_NAME}_db}"
OLD_NAME="scaffold"

echo ""
echo "=========================================="
echo "  Project Initialization"
echo "=========================================="
echo ""
echo "  Project name:    $PROJECT_NAME"
echo "  Database name:   $DB_NAME"
echo "  API port:        $API_PORT"
echo "  Frontend port:   $FRONTEND_PORT"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

# Step 1: Rename directories
print_step "Renaming directories..."

if [ -d "${OLD_NAME}_api" ]; then
    mv "${OLD_NAME}_api" "${PROJECT_NAME}_api"
    echo "  ${OLD_NAME}_api -> ${PROJECT_NAME}_api"
fi

if [ -d "${OLD_NAME}_frontend" ]; then
    mv "${OLD_NAME}_frontend" "${PROJECT_NAME}_frontend"
    echo "  ${OLD_NAME}_frontend -> ${PROJECT_NAME}_frontend"
fi

if [ -d "${PROJECT_NAME}_frontend/${OLD_NAME}_frontend" ]; then
    mv "${PROJECT_NAME}_frontend/${OLD_NAME}_frontend" "${PROJECT_NAME}_frontend/${PROJECT_NAME}_frontend"
    echo "  ${PROJECT_NAME}_frontend/${OLD_NAME}_frontend -> ${PROJECT_NAME}_frontend/${PROJECT_NAME}_frontend"
fi

# Step 2: Update file contents
print_step "Updating file contents..."

FILES=$(find . -type f \( \
    -name "*.py" -o \
    -name "*.ts" -o \
    -name "*.tsx" -o \
    -name "*.js" -o \
    -name "*.json" -o \
    -name "*.yaml" -o \
    -name "*.yml" -o \
    -name "*.toml" -o \
    -name "*.md" -o \
    -name "*.sh" -o \
    -name ".env*" -o \
    -name "Makefile" -o \
    -name "Dockerfile" -o \
    -name "*.dockerfile" \
\) -not -path "./.git/*" -not -path "*/node_modules/*" -not -path "*/__pycache__/*" -not -path "*/.venv/*" -not -path "*/dist/*" -not -path "*/.next/*")

count=0
for file in $FILES; do
    if grep -q "$OLD_NAME" "$file" 2>/dev/null; then
        sed -i '' "s/${OLD_NAME}/${PROJECT_NAME}/g" "$file"
        ((count++))
    fi
done
echo "  Updated $count files"

# Step 3: Update database name if different from default
if [ "$DB_NAME" != "${PROJECT_NAME}_db" ]; then
    print_step "Setting custom database name..."
    find . -type f \( -name "*.toml" -o -name ".env*" -o -name "*.yaml" \) \
        -not -path "./.git/*" \
        -exec sed -i '' "s/${PROJECT_NAME}_db/${DB_NAME}/g" {} \;
fi

# Step 4: Update ports if non-default
if [ "$API_PORT" != "8123" ]; then
    print_step "Setting API port to $API_PORT..."
    find . -type f \( -name "*.toml" -o -name ".env*" -o -name "*.yaml" -o -name "Makefile" \) \
        -not -path "./.git/*" \
        -exec sed -i '' "s/8123/${API_PORT}/g" {} \;
fi

if [ "$FRONTEND_PORT" != "3000" ]; then
    print_step "Setting frontend port to $FRONTEND_PORT..."
    find . -type f \( -name ".env*" -o -name "*.yaml" -o -name "Makefile" \) \
        -not -path "./.git/*" \
        -exec sed -i '' "s/3000/${FRONTEND_PORT}/g" {} \;
fi

# Step 5: Generate .env files from examples
print_step "Generating environment files..."

if [ -f ".env.example" ] && [ ! -f ".env" ]; then
    cp .env.example .env
    echo "  Created .env from .env.example"
fi

if [ -f "${PROJECT_NAME}_frontend/.env.example" ] && [ ! -f "${PROJECT_NAME}_frontend/.env.local" ]; then
    cp "${PROJECT_NAME}_frontend/.env.example" "${PROJECT_NAME}_frontend/.env.local"
    echo "  Created ${PROJECT_NAME}_frontend/.env.local"
fi

# Step 6: Reinitialize git (optional)
if [ "$SKIP_GIT" = false ]; then
    print_step "Reinitializing git repository..."
    rm -rf .git
    git init
    git add .
    git commit -m "Initial commit from scaffold template"
    echo "  Git repository reinitialized"
fi

# Step 7: Install dependencies (optional)
if [ "$SKIP_DEPS" = false ]; then
    print_step "Installing dependencies..."

    # Backend
    if command -v uv &> /dev/null; then
        echo "  Installing Python dependencies with uv..."
        cd "${PROJECT_NAME}_api"
        uv sync
        cd ..
    else
        print_warning "uv not found, skipping Python dependencies"
    fi

    # Frontend
    if command -v pnpm &> /dev/null; then
        echo "  Installing Node dependencies with pnpm..."
        cd "${PROJECT_NAME}_frontend"
        pnpm install
        cd ..
    elif command -v npm &> /dev/null; then
        echo "  Installing Node dependencies with npm..."
        cd "${PROJECT_NAME}_frontend"
        npm install
        cd ..
    else
        print_warning "pnpm/npm not found, skipping Node dependencies"
    fi
fi

# Step 8: Remove setup script and template docs
print_step "Cleaning up template files..."
rm -f scripts/init-project.sh
rm -rf docs/tickets/
echo "  Removed template-specific files"

# Done!
echo ""
echo "=========================================="
echo -e "  ${GREEN}Project initialized successfully!${NC}"
echo "=========================================="
echo ""
echo "Next steps:"
echo ""
echo "  1. Update .env with your configuration:"
echo "     - Database credentials"
echo "     - Secret keys"
echo "     - API keys (Stripe, etc.)"
echo ""
echo "  2. Start the databases:"
echo "     make compose-databases"
echo ""
echo "  3. Run database migrations:"
echo "     make db-migrate"
echo ""
echo "  4. Start the backend:"
echo "     make compose-backend"
echo ""
echo "  5. Start the frontend (in another terminal):"
echo "     cd ${PROJECT_NAME}_frontend && pnpm dev"
echo ""
echo "  6. Open http://localhost:${FRONTEND_PORT}"
echo ""
```

---

## Environment File Examples

### Root `.env.example`

```bash
# ===========================================
# Project Configuration
# ===========================================
# Copy this file to .env and update values

# Environment: local, dev, stage, prod
ENVIRONMENT=local

# Deployment: host, docker, k8s
DEPLOYMENT=docker

# ===========================================
# Database
# ===========================================
POSTGRES_SERVER=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=changeme
POSTGRES_DB=scaffold_db

# ===========================================
# Redis
# ===========================================
REDIS_HOST=localhost
REDIS_PORT=6379

# ===========================================
# Security
# ===========================================
# Generate with: openssl rand -hex 32
SECRET_KEY=changeme-generate-a-real-secret-key

# JWT token expiration (minutes)
ACCESS_TOKEN_EXPIRE_MINUTES=30

# ===========================================
# Email (optional)
# ===========================================
# SMTP_HOST=smtp.sendgrid.net
# SMTP_PORT=587
# SMTP_USER=apikey
# SMTP_PASSWORD=your-sendgrid-api-key
# EMAILS_FROM_EMAIL=noreply@yourdomain.com
# EMAILS_FROM_NAME=Your App Name

# ===========================================
# Storage (optional)
# ===========================================
# GCS_BUCKET_NAME=your-bucket
# GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json

# ===========================================
# Stripe (optional)
# ===========================================
# STRIPE_SECRET_KEY=sk_test_...
# STRIPE_WEBHOOK_SECRET=whsec_...
```

### Frontend `.env.example`

```bash
# ===========================================
# Frontend Configuration
# ===========================================
# Copy to .env.local for local development

# API URL
NEXT_PUBLIC_API_URL=http://localhost:8123

# Auth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=changeme-generate-a-real-secret

# ===========================================
# Optional Services
# ===========================================

# Stripe (for payments)
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Analytics
# NEXT_PUBLIC_GA_MEASUREMENT_ID=G-...
```

---

## README Template

Create a new `README.md` for the template:

```markdown
# Scaffold - FastAPI + Next.js Starter

A production-ready starter template for full-stack web applications.

## Features

- **Backend**: FastAPI with SQLAlchemy, Alembic migrations, JWT auth
- **Frontend**: Next.js 16 with App Router, Tailwind CSS, TypeScript
- **Database**: PostgreSQL with Redis caching
- **DevOps**: Docker Compose, Makefile automation
- **Auth**: JWT + OAuth2 patterns, role-based access control
- **Email**: Template-based email system with SMTP support

## Quick Start

### From GitHub Template

1. Click "Use this template" on GitHub
2. Clone your new repository
3. Run the setup script:

```bash
./scripts/init-project.sh myproject
```

4. Start developing:

```bash
# Terminal 1: Start databases and backend
make compose-backend

# Terminal 2: Start frontend
cd myproject_frontend && pnpm dev
```

5. Open http://localhost:3000

### Manual Setup

1. Clone this repository
2. Copy environment files:
   ```bash
   cp .env.example .env
   cp scaffold_frontend/.env.example scaffold_frontend/.env.local
   ```
3. Update `.env` with your configuration
4. Start services:
   ```bash
   make compose-backend
   cd scaffold_frontend && pnpm install && pnpm dev
   ```

## Project Structure

```
├── scaffold_api/           # FastAPI backend
│   ├── app/
│   │   ├── api/           # API routes
│   │   ├── core/          # Config, auth, security
│   │   ├── db/            # Models, CRUD, migrations
│   │   ├── services/      # Business logic
│   │   └── schemas/       # Pydantic models
│   └── tests/
├── scaffold_frontend/      # Next.js frontend
│   └── scaffold_frontend/
│       └── src/
│           ├── app/       # Pages (App Router)
│           ├── components/
│           ├── lib/       # Utilities
│           └── types/
├── databases/             # Database Dockerfiles
├── docker-compose.yaml
└── Makefile
```

## Available Commands

```bash
# Development
make compose-backend       # Start API with databases
make compose-frontend      # Start frontend
make compose-all          # Start everything

# Database
make db-migrate           # Run migrations
make db-refresh           # Reset database

# Testing
make test-backend         # Run backend tests
make test-frontend        # Run frontend tests
```

## Documentation

- [Architecture Overview](docs/architecture.md)
- [API Documentation](docs/api.md)
- [Deployment Guide](docs/deployment.md)

## License

MIT
```

---

## GitHub Template Configuration

After pushing to GitHub:

1. Go to repository Settings
2. Check "Template repository" under General
3. Update repository description: "Production-ready FastAPI + Next.js starter template"
4. Add topics: `fastapi`, `nextjs`, `template`, `starter`, `typescript`, `python`

---

## Verification Checklist

Test the full workflow:

1. [ ] Create new repo from template on GitHub
2. [ ] Clone the new repo locally
3. [ ] Run `./scripts/init-project.sh testapp`
4. [ ] Verify all files renamed correctly
5. [ ] Verify `.env` files created
6. [ ] Run `make compose-backend` - API starts
7. [ ] Run `cd testapp_frontend && pnpm dev` - Frontend starts
8. [ ] Register a new user account
9. [ ] Login and access dashboard
10. [ ] Verify git history is clean (single initial commit)

---

## Notes

- The setup script removes itself after running to keep derived projects clean
- Consider adding a `--keep-script` flag for debugging
- Template documentation (like these tickets) is removed by the script
- Keep the script idempotent where possible (can run multiple times safely)
