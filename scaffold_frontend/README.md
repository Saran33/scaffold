# Scaffold Frontend

## Getting Started
### Local Development
- To install dependencies, run `pnpm i --frozen-lockfile` in the root directory.
- To run a local development server, `pnpm dev` in the root directory.
- To run a local production server, `cp .env.prod.local .env.production`, `pnpm build` and `pnpm start` in the root directory.

## Testing
- Run the backend containers with `make compose-test-e2e-containers` in the backend repository. If they are already running, you can instead run `IS_E2E=1 make db-populate` to re-populate the database with data that is used in the E2E tests.
- Use `pnpm dev:test` to run the Next.js server locally with the correct environment variables for testing.
- If you typically run the app with `https` locally, be sure to change back `NEXT_PUBLIC_API_URL` and `NEXTAUTH_URL` in the `.env.development` file:
```text
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
```
- You can run the app in another terminal with `pnpm dev` in the root directory, to see logs and debug the app.
- This is optional, as Playwright will spin up the Next.js server if one is not already running.
```zsh
pnpm dev
```
- Run:
```zsh
pnpm exec playwright install --with-deps
pnpm test:e2e
# or
# pnpm test:e2e:ui
# pnpm test:e2e:headed
```
- To record a session, run:
```zsh
npx playwright codegen --browser firefox http://localhost:3000
```
- Or run `pnpm test:e2e:codedgen`
- Or use VS Code extension.

### Test on mobile on local network
- Find your local IP address:
```zsh
ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}'
```
- e.g. 192.168.0.179
- Change hosts in the `.env.development` file:
```text
NEXT_PUBLIC_APP_URL=http://192.168.0.179:3000
NEXT_PUBLIC_API_URL=http://192.168.0.179:8123/api/v1
NEXTAUTH_URL=http://192.168.0.179:3000
```
- Run the app with:
```zsh
pnpm dev:network
```
- Open the app on your mobile browser (you may need to turn off firewall on mac temporarily):
```zsh
http://192.168.0.179:3000
```
