# Setup — LienGuard Free

## Prerequisites

- **Node.js ≥ 20** (developed and tested on Node 24)
- **npm ≥ 9**

Check:

```bash
node --version
npm --version
```

## Install

From the `public-free-build` directory:

```bash
npm install
```

This installs the dev toolchain (TypeScript, Vitest) and links the three
workspace packages (`core`, `cli`, `api`). The engine itself has **no runtime
dependencies**; the API adds Fastify + zod.

## Build

```bash
npm run build      # tsc --build across all packages
```

Compiled output lands in each package's `dist/` folder.

## Run the tests

```bash
npm test           # vitest run
```

You should see the full suite pass (core, CLI, and API).

## Run the API server

```bash
npm run start:api
```

The server listens on `http://0.0.0.0:3000` by default.

### Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `3000` | Port the API listens on. |
| `HOST` | `0.0.0.0` | Interface to bind. |
| `CORS_ORIGINS` | *(empty = deny)* | Comma-separated list of allowed browser origins. **No wildcard by default.** |
| `TRUST_PROXY` | `false` | Honour `X-Forwarded-*` for client IP / rate limits. Enable **only** behind a reverse proxy that overwrites those headers. |

Example:

```bash
PORT=8080 CORS_ORIGINS="https://app.example.com,https://staging.example.com" npm run start:api
```

## Use the CLI globally (optional)

```bash
npm link -w @lienguard/cli
lienguard --help
```

## Verify the install

```bash
npx lienguard --state FL --role material-supplier --first 2025-01-06 --last 2025-04-01
```

You should see a Notice-to-Owner deadline and a Claim-of-Lien deadline with
statutory citations.
