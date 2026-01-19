# Scaffold Frontend Project Guidelines

## Build & Development Commands
- Install: `pnpm i --frozen-lockfile`
- Development: `pnpm dev` (with HTTPS: `pnpm dev:https`)
- Production: `cp .env.prod.local .env.production && pnpm build && pnpm start`
- Lint: `pnpm lint` (fix: `pnpm lint:fix`)
- Type check: `pnpm type-check` - Note: `pnpm lint` already runs type checking combined with linting
- E2E tests: `pnpm test:e2e` (UI: `pnpm test:e2e:ui`, headed: `pnpm test:e2e:headed`)
- Run single E2E test: `pnpm test:e2e -- -g "test name pattern"`

## Code Style
- TypeScript with strict mode enabled
- Use consistent type imports with `import type {...}`
- React functional components with hooks
- Import paths use `@/` alias for src directory
- Handle promises properly with async/await, add void operator for floating promises
- 2 space indentation, 80 character line width, single quotes
- Use Tailwind for styling with `cn()` utility for conditional classes
- UI components in src/components/ui/
- Error handling: Throw proper Error objects, not strings

## Architecture
- Next.js App Router with server and client components
- Radix UI for accessible component primitives
- API requests via specialized API modules in src/api/
- State management with React context and hooks
- Form handling with react-hook-form and zod validation
- Authentication with NextAuth

## Additional Notes
- Never make any commits or stage changes. These will be reviewed by the team and we will commit them.
- When requesting permission to execute an action, please always try to explain your reasoning for what you hope to accomplish by the action (unless it is very obvious). This will help the user to better appraise your proposed action with an understanding of your intentions.
- Think carefully and only action the specific task you are given, using the most concise and elegant solution that changes as little code as possible.
- Strive for simplicity and clarity in your code, avoiding unnecessary complexity unless there is a performance or architectural reason.
- Strictly adhere to SOLID principles and DRY (Don't Repeat Yourself) principles. SOLID code in particular is of utmost importance to us.
- Anything that can be split out into its own component or method, should be split out.
- Strive for a clean separation of concerns at the function/method level as well as at the component level.
- Try to refrain from removing comments unless relevant to the code change or if they are outdated or incorrect.
- There is no need for comments that are only relevant in the context of the current WIP branch. Only add comments if they will make sense in the context of main branch in future, for any developer examining the code when it is merged into main.
- NEVER add "backwards compatibility" code unless explicitly requested. We are not supporting legacy code and this will only add unnecessary complexity.
