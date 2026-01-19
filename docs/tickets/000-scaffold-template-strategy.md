# Scaffold Template Strategy

**Status**: `[✓]` Completed - Option 3 selected
**Type**: Architecture / Planning
**Decision**: GitHub Template Repository + Setup Script

---

## Background

This repository (`jump_challenge`) contains a copy of the `bopsquad_multiverse` codebase - a FastAPI + Next.js application with substantial business logic for a character collection/gaming platform.

The goal is to transform this into a **reusable scaffold template** that can quickly bootstrap new projects while retaining the architectural patterns and infrastructure code that make development efficient.

### Current State

The codebase was partially renamed:
- Directories: `scaffold_api/`, `scaffold_frontend/`
- Internal references: Still use `bopsquad_*` throughout (services, Docker, configs, package names)

### Business Logic to Remove

The following domain-specific code needs to be stripped:

| Domain | Backend | Frontend |
|--------|---------|----------|
| Characters | 153-character catalog, unlock system, selection workflow | Character gallery, multiverse view, selection UI |
| Game | Game sessions, token mechanics, Phaser integration | Game interfaces, star-catcher game |
| Audiobook | Content delivery, progress tracking | Audiobook player |
| NFT | Minting service, IPFS integration | Wallet connect, minting flow |
| Shop | Products, orders, fulfillment | Product catalog, checkout |
| Unlock Codes | HMAC validation, code tracking | Unlock submission UI |

### Infrastructure to Keep

| Layer | Components |
|-------|------------|
| Config | Environment-based settings (local/dev/stage/prod), deployment modes (host/docker/k8s) |
| Auth | JWT/OAuth2 patterns, role-based access, NextAuth.js integration |
| Database | SQLAlchemy patterns, Alembic migrations, CRUD abstractions |
| API | Router patterns, dependency injection, exception handling |
| Frontend | Next.js App Router structure, Tailwind/Radix UI, TanStack Query, Zustand |
| DevOps | Docker Compose orchestration, Makefile automation |
| Email | Template system, sending infrastructure |
| Storage | File adapter patterns (GCS) |
| Caching | Redis integration |
| Payments | Stripe webhook patterns (optional) |

---

## Approach Options

### Option 1: Manual Copy-and-Rename (Current Plan)

**How it works:**
1. Remove business logic files/directories
2. Find-and-replace `bopsquad` → `{project_name}` across all files
3. Strip domain models, keep User + basic auth models
4. Copy the cleaned repo when starting a new project
5. Rename again for the new project

**Pros:**
- Simple, no tooling to learn
- Full control over what gets included
- Works immediately

**Cons:**
- Manual renaming is error-prone (60+ files reference `bopsquad`)
- Easy to miss references in configs, Docker, env files
- No parameterization (database names, ports, domains all hardcoded)
- Each new project starts with a copy-paste ceremony

**Effort:** Medium initially, then low per-project

---

### Option 2: Cookiecutter Template

**How it works:**
1. Convert repo to a [Cookiecutter](https://cookiecutter.readthedocs.io/) template
2. Replace hardcoded values with `{{cookiecutter.project_name}}` variables
3. Run `cookiecutter /path/to/template` to generate new projects
4. Answer prompts for project name, database name, etc.

**Template variables to parameterize:**
```json
{
  "project_name": "myapp",
  "project_slug": "{{ cookiecutter.project_name | lower | replace(' ', '_') }}",
  "api_name": "{{ cookiecutter.project_slug }}_api",
  "frontend_name": "{{ cookiecutter.project_slug }}_frontend",
  "database_name": "{{ cookiecutter.project_slug }}_db",
  "api_port": "8123",
  "frontend_port": "3000",
  "include_stripe": ["yes", "no"],
  "include_web3": ["yes", "no"],
  "include_email": ["yes", "no"]
}
```

**Pros:**
- Clean, repeatable project generation
- Can include/exclude optional features via prompts
- Industry-standard tool with good ecosystem
- One-time setup, then instant project creation

**Cons:**
- Initial conversion effort (templatize all files)
- Template syntax in files can make the template harder to read/maintain
- Need to keep template updated as patterns evolve

**Effort:** Medium-high initially, then very low per-project

---

### Option 3: GitHub Template Repository

**How it works:**
1. Clean up the repo and push to GitHub
2. Mark it as a "Template repository" in GitHub settings
3. Click "Use this template" to create new repos
4. Run a setup script to rename everything

**Setup script example (`scripts/init-project.sh`):**
```bash
#!/bin/bash
PROJECT_NAME=$1
PROJECT_SLUG=$(echo "$PROJECT_NAME" | tr '[:upper:]' '[:lower:]' | tr ' ' '_')

# Rename directories
mv scaffold_api "${PROJECT_SLUG}_api"
mv scaffold_frontend "${PROJECT_SLUG}_frontend"

# Find and replace in all files
find . -type f -name "*.py" -o -name "*.ts" -o -name "*.tsx" \
       -o -name "*.json" -o -name "*.yaml" -o -name "*.toml" \
       -o -name "*.md" -o -name "Makefile" -o -name "Dockerfile" \
  | xargs sed -i '' "s/bopsquad/${PROJECT_SLUG}/g"
  | xargs sed -i '' "s/jump/${PROJECT_SLUG}/g"

# Update package names
# ... etc
```

**Pros:**
- Native GitHub integration
- Visual "Use this template" button
- New repo gets clean git history
- Combines well with a setup script for renaming

**Cons:**
- Setup script still needs to handle renaming
- No conditional feature inclusion without scripting
- Template updates don't propagate to derived projects

**Effort:** Low initially, low per-project (with good script)

---

### Option 4: Monorepo with Scaffold Package

**How it works:**
1. Keep this as a monorepo with the scaffold as a "package"
2. Create a CLI tool that copies and configures from the template
3. Optionally publish to npm/PyPI for global access

**Example structure:**
```
jump_scaffold/
├── packages/
│   └── create-app/           # CLI tool
│       ├── src/
│       │   └── index.ts      # Prompts + file generation
│       └── templates/
│           ├── api/          # Backend template files
│           └── frontend/     # Frontend template files
└── examples/
    └── full-app/             # Working example
```

**Usage:**
```bash
npx create-jump-app my-project
# or
pnpm create jump-app my-project
```

**Pros:**
- Professional developer experience
- Easy to version and distribute
- Can include sophisticated scaffolding logic
- Examples stay in sync with templates

**Cons:**
- Most complex to set up
- Overkill for personal use
- Need to maintain a CLI tool

**Effort:** High initially, very low per-project

---

## Recommendation

For your use case (personal scaffolding, occasional new projects), I recommend:

### **Option 3: GitHub Template Repository + Setup Script**

This balances simplicity with repeatability:

1. **Phase 1: Clean the codebase**
   - Remove all business logic (characters, game, audiobook, NFT, shop, unlocks)
   - Keep: User model, auth flow, basic CRUD patterns, config system
   - Rename `bopsquad` → `scaffold` as a neutral base name
   - Create placeholder routes/pages showing the patterns

2. **Phase 2: Create setup script**
   - Single `scripts/init-project.sh <project_name>` command
   - Renames directories, updates all references
   - Generates new `.env` files with project-specific values
   - Runs initial migrations to set up database

3. **Phase 3: Publish as GitHub template**
   - Push cleaned repo to GitHub
   - Enable "Template repository" setting
   - Document the setup process in README

**Workflow for new projects:**
```bash
# 1. Create new repo from template on GitHub
# 2. Clone locally
git clone git@github.com:saran/my-new-project.git
cd my-new-project

# 3. Initialize with project name
./scripts/init-project.sh my_new_project

# 4. Start developing
make compose-backend
```

---

## Files Requiring Rename/Update

For reference, these files contain `bopsquad` references that need updating:

**Configuration:**
- `Makefile` (APP_NAME, BACKEND_NAME, FRONTEND_NAME)
- `docker-compose.base.yaml` (all service names, container names)
- `docker-compose.yaml` / `docker-compose.override.yaml`
- `scaffold_api/configurations/*.toml` (PROJECT_NAME, POSTGRES_DB)
- `scaffold_api/pyproject.toml` (package name)
- `scaffold_frontend/package.json` (name field)
- `scaffold_frontend/.env.*` files

**Backend:**
- `scaffold_api/api.dockerfile` (user name, paths)
- `scaffold_api/app/core/config.py` (Settings class)
- Import statements throughout (`from bopsquad_api...`)

**Frontend:**
- `scaffold_frontend/frontend.dockerfile`
- Import paths in components
- `bopsquad_frontend/` inner directory

---

## Next Steps

1. [✓] Decide on approach → **Option 3 selected**
2. [✓] Create detailed ticket for business logic removal → [001-remove-business-logic.md](./001-remove-business-logic.md)
3. [✓] Create detailed ticket for renaming/standardization → [002-rename-standardize.md](./002-rename-standardize.md)
4. [✓] Create setup script ticket → [003-setup-script-and-template.md](./003-setup-script-and-template.md)
5. [ ] Execute tickets in order (001 → 002 → 003)
6. [ ] Test full workflow (template → new project → running app)

---

## Notes

- The neutral base name could be `scaffold`, `template`, `starter`, or even keep `jump` as a short generic prefix
- Consider keeping Stripe integration as optional (common need) but removing Web3/NFT (very specific)
- The audiobook player pattern could be generalized to "media player" if useful
- Email templates are reusable - just update branding
