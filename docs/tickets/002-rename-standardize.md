# 002: Rename and Standardize

**Status**: `[x]` Completed
**Depends on**: 001-remove-business-logic
**Blocked by**: None

---

## Overview

Rename all `bopsquad` references to a neutral template name (`scaffold`) and standardize the project structure for use as a GitHub template repository.

---

## Objectives

- [x] Choose and apply neutral project name
- [x] Rename all directories
- [x] Update all configuration files
- [x] Update all code imports
- [x] Update Docker configuration
- [x] Update documentation
- [x] Verify everything works with new names

---

## Naming Convention

**Base name:** `scaffold`

| Component | Old Name | New Name |
|-----------|----------|----------|
| Backend package | `bopsquad_api` | `scaffold_api` |
| Frontend package | `bopsquad_frontend` | `scaffold_frontend` |
| Database | `bopsquad_db` | `scaffold_db` |
| Docker services | `bopsquad_*` | `scaffold_*` |
| Docker user | `bopsquad` | `scaffold` |

---

## Files to Update

### Root Level

**Makefile:**
```makefile
# Change from:
APP_NAME=bopsquad
BACKEND_NAME=bopsquad_api
FRONTEND_NAME=bopsquad_frontend

# Change to:
APP_NAME=scaffold
BACKEND_NAME=scaffold_api
FRONTEND_NAME=scaffold_frontend
```

**docker-compose.base.yaml:**
- Service names: `bopsquad_postgres` → `scaffold_postgres`
- Service names: `bopsquad_redis` → `scaffold_redis`
- Service names: `bopsquad_api` → `scaffold_api`
- Service names: `bopsquad_frontend` → `scaffold_frontend`
- Container names: same pattern
- Volume names: same pattern

**docker-compose.yaml / docker-compose.override.yaml:**
- Update any service references

### Backend

**Directory rename:**
```bash
mv scaffold_api scaffold_api
```

**scaffold_api/pyproject.toml:**
```toml
[project]
name = "scaffold_api"
```

**scaffold_api/api.dockerfile:**
- Update paths from `scaffold_api` → `scaffold_api`
- Update user from `bopsquad` → `scaffold`
- Update any internal references

**scaffold_api/configurations/*.toml:**
```toml
# All config files
PROJECT_NAME = 'scaffold'
POSTGRES_DB = 'scaffold_db'
```

**scaffold_api/app/core/config.py:**
- Update Settings class if it has hardcoded references
- Update any `bopsquad` strings

**scaffold_api/app/ (all Python files):**
- Update imports: `from bopsquad_api.` → `from scaffold_api.`
- Update any string literals containing `bopsquad`

**scaffold_api/tests/:**
- Update all test imports

### Frontend

**Directory rename:**
```bash
mv scaffold_frontend scaffold_frontend
```

**Inner directory rename:**
```bash
mv scaffold_frontend/bopsquad_frontend scaffold_frontend/scaffold_frontend
```

**scaffold_frontend/package.json:**
```json
{
  "name": "scaffold_frontend"
}
```

**scaffold_frontend/frontend.dockerfile:**
- Update paths
- Update any references

**scaffold_frontend/.env.* files:**
- Update any `bopsquad` references in URLs or names

**scaffold_frontend/scaffold_frontend/src/ (all TS/TSX files):**
- Update import paths if they reference old names
- Update any string literals

**scaffold_frontend/next.config.js:**
- Update if it references old paths

**scaffold_frontend/tsconfig.json:**
- Update path aliases if present

### Documentation

**README.md:**
- Rewrite for template usage
- Remove bopsquad-specific content
- Add setup instructions

**docs/:**
- Update or remove bopsquad-specific documentation
- Keep architecture docs but generalize

---

## Automated Rename Script

Create `scripts/rename-project.sh` to automate renaming from `scaffold` to user's project name:

```bash
#!/bin/bash
set -e

NEW_NAME=$1

if [ -z "$NEW_NAME" ]; then
    echo "Usage: ./scripts/rename-project.sh <project_name>"
    echo "Example: ./scripts/rename-project.sh myapp"
    exit 1
fi

# Validate name (lowercase, underscores allowed, no spaces)
if [[ ! "$NEW_NAME" =~ ^[a-z][a-z0-9_]*$ ]]; then
    echo "Error: Project name must be lowercase, start with a letter, and contain only letters, numbers, and underscores"
    exit 1
fi

OLD_NAME="scaffold"
echo "Renaming project from '$OLD_NAME' to '$NEW_NAME'..."

# 1. Rename directories
echo "Renaming directories..."
mv "${OLD_NAME}_api" "${NEW_NAME}_api" 2>/dev/null || true
mv "${OLD_NAME}_frontend" "${NEW_NAME}_frontend" 2>/dev/null || true
mv "${NEW_NAME}_frontend/${OLD_NAME}_frontend" "${NEW_NAME}_frontend/${NEW_NAME}_frontend" 2>/dev/null || true

# 2. Update file contents
echo "Updating file contents..."

# Find all relevant files
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
    -name "*.env*" -o \
    -name "Makefile" -o \
    -name "Dockerfile" -o \
    -name "*.dockerfile" \
\) -not -path "./.git/*" -not -path "*/node_modules/*" -not -path "*/__pycache__/*" -not -path "*/.venv/*")

# Replace scaffold with new name (case-sensitive)
for file in $FILES; do
    if grep -q "$OLD_NAME" "$file" 2>/dev/null; then
        sed -i '' "s/${OLD_NAME}/${NEW_NAME}/g" "$file"
        echo "  Updated: $file"
    fi
done

# 3. Rename any files with scaffold in the name
echo "Renaming files..."
find . -name "*${OLD_NAME}*" -not -path "./.git/*" | while read file; do
    newfile=$(echo "$file" | sed "s/${OLD_NAME}/${NEW_NAME}/g")
    if [ "$file" != "$newfile" ]; then
        mv "$file" "$newfile"
        echo "  Renamed: $file -> $newfile"
    fi
done

echo ""
echo "Done! Project renamed to '$NEW_NAME'"
echo ""
echo "Next steps:"
echo "  1. Review changes: git diff"
echo "  2. Update .env files with your configuration"
echo "  3. Run: make compose-backend"
echo "  4. Run: cd ${NEW_NAME}_frontend && pnpm install && pnpm dev"
```

---

## Verification Checklist

After renaming:

1. **No old references remain:**
   ```bash
   grep -r "bopsquad" . --include="*.py" --include="*.ts" --include="*.tsx" --include="*.json" --include="*.yaml" --include="*.toml" --include="*.md" --include="Makefile"
   ```
   Should return no results (except maybe docs explaining the rename)

2. **Backend starts:**
   ```bash
   make compose-backend
   # API should be accessible at localhost:8123
   ```

3. **Frontend starts:**
   ```bash
   cd scaffold_frontend && pnpm install && pnpm dev
   # App should be accessible at localhost:3000
   ```

4. **Docker builds:**
   ```bash
   docker compose build
   ```

5. **Tests pass:**
   ```bash
   make test-backend
   cd scaffold_frontend && pnpm test
   ```

6. **Database migrations:**
   ```bash
   make db-migrate
   ```

---

## Notes

- Run the rename script on a fresh clone to verify it works end-to-end
- Consider adding the script to CI to test that renaming doesn't break the build
- Keep `scaffold` as a neutral name that clearly indicates "this is a template"
- Alternative names considered: `starter`, `template`, `base`, `boilerplate`
