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
    -name "*.dockerfile" -o \
    -name "*.ini" \
\) -not -path "./.git/*" -not -path "*/node_modules/*" -not -path "*/__pycache__/*" -not -path "*/.venv/*" -not -path "*/.next/*")

# Replace scaffold with new name (case-sensitive)
for file in $FILES; do
    if grep -q "$OLD_NAME" "$file" 2>/dev/null; then
        # Use different sed syntax based on OS
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s/${OLD_NAME}/${NEW_NAME}/g" "$file"
        else
            sed -i "s/${OLD_NAME}/${NEW_NAME}/g" "$file"
        fi
        echo "  Updated: $file"
    fi
done

# Also handle capitalized version (Scaffold -> NewName with first letter capitalized)
NEW_NAME_CAP="$(tr '[:lower:]' '[:upper:]' <<< "${NEW_NAME:0:1}")${NEW_NAME:1}"
OLD_NAME_CAP="Scaffold"

for file in $FILES; do
    if grep -q "$OLD_NAME_CAP" "$file" 2>/dev/null; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s/${OLD_NAME_CAP}/${NEW_NAME_CAP}/g" "$file"
        else
            sed -i "s/${OLD_NAME_CAP}/${NEW_NAME_CAP}/g" "$file"
        fi
        echo "  Updated (capitalized): $file"
    fi
done

# 3. Rename any files with scaffold in the name
echo "Renaming files..."
find . -name "*${OLD_NAME}*" -not -path "./.git/*" -not -path "*/node_modules/*" | while read file; do
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
