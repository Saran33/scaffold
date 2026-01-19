# 001: Remove Business Logic

**Status**: `[x]` Completed
**Depends on**: None
**Blocked by**: None

---

## Overview

Strip all domain-specific business logic from the codebase, leaving only the reusable infrastructure patterns and a minimal User/Auth example.

---

## Objectives

- [x] Remove all character-related code
- [x] Remove game/session mechanics
- [x] Remove audiobook system
- [x] Remove NFT/Web3 integration
- [x] Remove shop/e-commerce logic
- [x] Remove unlock code system
- [x] Remove fulfillment/shipping logic
- [x] Keep User model and auth flow as working example
- [x] Keep one example protected route and one public route

---

## Backend Removals

### Database Models (`scaffold_api/app/db/models/`)

**Remove entirely:**
- `character.py` - Character, UserCharacter models
- `game.py` - GameSession, UserToken models
- `audiobook.py` - Audiobook, AudiobookChapter, UserAudiobookProgress
- `shop.py` - Product, ProductPricing, Order, OrderItem
- `fulfillment.py` - Supplier, ShippingCarrier, Shipment, OrderFulfillmentItem
- `unlock.py` - UnlockCodeUsage
- `order_history.py` - OrderHistory

**Keep and simplify:**
- `user.py` - Keep User model, simplify roles to just `user` and `admin`
- `base.py` - Keep base model patterns

**Update:**
- `__init__.py` - Remove deleted model imports

### CRUD Layer (`scaffold_api/app/db/crud/`)

**Remove entirely:**
- `character_crud.py`
- `game_crud.py`
- `audiobook_crud.py`
- `shop_crud.py`
- `fulfillment_crud.py`
- `unlock_crud.py`

**Keep:**
- `user_crud.py`
- `base_crud.py`

### Services (`scaffold_api/app/services/`)

**Remove entirely:**
- `character_serv.py`
- `character_selection_serv.py`
- `character_admin_serv.py`
- `character_secrets_service.py`
- `game_serv.py`
- `audiobook_service.py`
- `shop_serv.py`
- `unlock_service.py`
- `unlock_code_service.py`
- `nft_service.py`
- `ipfs_service.py`
- `stripe_webhook_serv.py`
- `carrier_serv.py`
- `supplier_serv.py`
- `supplier_integration_serv.py`

**Keep:**
- `user_serv.py`
- `auth_serv.py`
- `base_serv.py`

### API Routers (`scaffold_api/app/api/api_v1/routers/`)

**Remove entirely:**
- `characters_ep.py`
- `games_ep.py`
- `audiobook_ep.py`
- `shop_ep.py`
- `unlock_ep.py`
- `stripe_webhooks_ep.py`
- `admin_ep.py` (or simplify to basic admin example)

**Keep:**
- `users_ep.py`
- `login_ep.py`

**Update:**
- `__init__.py` / router registration - Remove deleted routers

### Schemas (`scaffold_api/app/schemas/`)

**Remove** all schemas except:
- `user_schema.py`
- `auth_schema.py` / `token_schema.py`
- `base_schema.py`

### Tasks (`scaffold_api/app/tasks/`)

**Remove:**
- `order_tasks.py`
- Any character/game related tasks

**Keep:**
- `user_tasks.py` (if contains useful patterns)

### Dependencies (`scaffold_api/app/dependencies/`)

**Remove:**
- `stripe_deps.py`

**Keep:**
- `db_deps.py`
- `user_deps.py`
- `storage_deps.py`
- `base_deps.py`

### Seed Data (`scaffold_api/app/db/setup/seed_data/`)

**Remove entirely:**
- All character seed data
- All product seed data

**Create placeholder:**
- `example_seed.py` - Simple example showing seed data pattern

### Migrations (`scaffold_api/app/db/migrations/`)

**Remove:**
- All existing migration files in `versions/`

**Keep:**
- Alembic configuration (`alembic.ini`, `env.py`)
- Will generate fresh migration after model cleanup

### Email Templates (`scaffold_api/app/email-templates/`)

**Keep but generalize:**
- Welcome email template
- Password reset template
- Email verification template

**Remove:**
- Order confirmation templates
- Any character/game specific templates

---

## Frontend Removals

### App Routes (`scaffold_frontend/bopsquad_frontend/src/app/`)

**Remove entirely:**
- `(app)/multiverse/` - Character gallery
- `(app)/game/` - Game interface
- `(app)/games/` - Games list
- `(app)/star-catcher/` - Star catcher game
- `(app)/audiobook/` - Audiobook player
- `(app)/nft/` - NFT minting
- `(app)/unlock/` - Unlock code submission
- `(app)/game-stats/` - Game statistics
- `(marketing)/shop/` - Shop pages

**Keep and simplify:**
- `(auth)/` - Login, register, verify-email, reset-password
- `(dashboard)/` - Basic dashboard shell
- `(app)/` - Keep layout, add simple example protected page
- Root layout and home page

### Components (`scaffold_frontend/bopsquad_frontend/src/components/`)

**Remove:**
- `nft/` - NFT components
- `wallet/` - Web3 wallet components
- Character-specific components
- Game components
- Audiobook player components
- Shop/cart components

**Keep:**
- Auth components
- UI primitives (buttons, forms, modals)
- Layout components
- Theme provider

### Lib (`scaffold_frontend/bopsquad_frontend/src/lib/`)

**Remove:**
- `web3/` - Entire Web3 integration
- `shop/` - Shop utilities
- Character/game specific utilities

**Keep:**
- `api.ts` - API client
- `auth/` - Auth helpers
- `utils/` - General utilities
- `validations/` - Keep as examples

### Types (`scaffold_frontend/bopsquad_frontend/src/types/`)

**Remove:**
- `characters.d.ts`
- `character.d.ts`
- `game.d.ts`
- `audiobook.d.ts`
- `nft.d.ts`
- `unlock.d.ts`
- `payments.d.ts` (or simplify)

**Keep:**
- `user.d.ts`
- `auth.d.ts`
- `api.d.ts`

### Dependencies (`package.json`)

**Remove:**
- `wagmi`, `viem`, `@rainbow-me/rainbowkit` - Web3
- `phaser` - Game engine
- Any character/game specific packages

**Keep:**
- Next.js, React, TypeScript
- Tailwind, Radix UI
- TanStack Query, Zustand
- NextAuth
- Form libraries
- Stripe (optional - could be kept as common need)

---

## Configuration Updates

### Backend Config (`scaffold_api/configurations/*.toml`)

**Remove:**
- `CHARACTER_IMAGE_PREFIX`
- `CHARACTER_SPRITE_PREFIX`
- NFT contract addresses
- Game-specific settings

**Keep:**
- Database settings
- Auth settings
- Email settings
- Storage settings
- API settings

### Environment Files

**Update `.env.example`:**
- Remove game/character specific vars
- Remove NFT/Web3 vars
- Keep auth, database, email, storage vars

---

## Verification

After removal:
1. Backend starts without errors: `make compose-backend`
2. Frontend builds without errors: `cd scaffold_frontend && pnpm build`
3. Can register a new user
4. Can login and access protected route
5. Can access public route without auth
6. Database migrations run cleanly

---

## Notes

- Take iterative approach: remove one domain at a time, verify app still runs
- Start with most isolated domains (NFT, audiobook) before core (characters)
- Keep git history clean with logical commits per domain removed
- Document any patterns worth preserving before deletion
