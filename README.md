# ArtisansDirect – API

> **Fictional school project** for the _Front/Back Coordination_ course at Ynov. The assignment requires the project to be split into two repositories: this one (back-end) and [artisan-direct-client](https://github.com/hlaclau/artisan-direct-client) (front-end).

Back-end of **ArtisansDirect**, a platform connecting clients with craftspeople: artisan search, service requests, quotes, scheduling, payment and reviews.

This repository contains the API and business logic.

## Stack

- [Bun](https://bun.sh) – runtime and package manager
- [Hono](https://hono.dev) + TypeScript (strict)
- [Zod](https://zod.dev) + [`@hono/zod-openapi`](https://github.com/honojs/middlewares/tree/main/packages/zod-openapi) – validation and OpenAPI contract
- [Better Auth](https://www.better-auth.com) – email/password and Google sign-in
- [Drizzle ORM](https://orm.drizzle.team) – schema and migrations
- [Vitest](https://vitest.dev) – tests
- [Oxlint](https://oxc.rs) (lint) and [Prettier](https://prettier.io) (format)
- [Lefthook](https://lefthook.dev) + [commitlint](https://commitlint.js.org) (git hooks)
- [mise](https://mise.jdx.dev) – tool versions and tasks
- [Docker Compose](https://docs.docker.com/compose/) – local PostgreSQL/PostGIS

## Getting started

1. Install [mise](https://mise.jdx.dev/getting-started.html) and [Docker](https://docs.docker.com/get-docker/)
2. Clone the repository and install everything:

```sh
git clone git@github.com:hlaclau/artisan-direct-api.git
cd artisan-direct-api
mise trust
mise install      # installs the pinned Bun version
mise run install  # installs dependencies and git hooks
cp .env.example .env
```

3. Start the local services, apply the migrations and start the API:

```sh
mise run services    # docker compose up -d
mise run db:migrate
mise run dev
```

The API runs on http://localhost:3000. Try `curl localhost:3000/health`.

| Service    | URL                                                        |
| ---------- | ---------------------------------------------------------- |
| PostgreSQL | `postgres://artisan:artisan@localhost:5432/artisan_direct` |

## API contract

The OpenAPI document is served at http://localhost:3000/openapi.json, with interactive docs ([Scalar](https://scalar.com)) at http://localhost:3000/docs. Routes are declared with `createRoute` from `@hono/zod-openapi`, so request validation, TypeScript types and the spec all come from the same Zod schemas. The client generates its types from this document.

Code is organised by bounded context under `src/modules/<context>/`.

## Authentication

[Better Auth](https://www.better-auth.com) is mounted at `/api/auth/*` (config in `src/auth.ts`). Sessions are cookie-based and stored in PostgreSQL.

- Email/password: `POST /api/auth/sign-up/email`, `POST /api/auth/sign-in/email`
- Google: `POST /api/auth/sign-in/social` with `{ "provider": "google", "callbackURL": "..." }` returns the Google URL to redirect to
- Session: `GET /api/auth/get-session`, sign out with `POST /api/auth/sign-out`

### Google sign-in setup

1. In the [Google Cloud Console](https://console.cloud.google.com/auth/clients/create), create an OAuth client of type **Web application**
2. Add the authorized redirect URI `http://localhost:3000/api/auth/callback/google` (and the production one later)
3. While the consent screen is in _Testing_, add your Google account under **Audience → Test users**
4. Put the credentials in `.env`:

```
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

### Database

Schema is in `src/db/schema.ts`, migrations in `drizzle/`.

- After changing the schema: `mise run db:generate`, then `mise run db:migrate`
- After changing Better Auth plugins/options: `mise run auth:generate` to refresh the auth tables, then generate a migration
- Browse the data with `mise run db:studio` (opens https://local.drizzle.studio)

## Tasks

Run `mise tasks` to list them all.

| Command                  | Description                                    |
| ------------------------ | ---------------------------------------------- |
| `mise run install`       | Install dependencies and git hooks             |
| `mise run services`      | Start PostgreSQL/PostGIS                       |
| `mise run dev`           | Start the API with hot reload                  |
| `mise run db:migrate`    | Apply migrations to the local database         |
| `mise run db:generate`   | Generate a migration from the schema           |
| `mise run db:studio`     | Browse the database (Drizzle Studio)           |
| `mise run auth:generate` | Regenerate the auth schema from `src/auth.ts`  |
| `mise run build`         | Type-check and build for production            |
| `mise run start`         | Run the production build                       |
| `mise run lint`          | Lint with oxlint                               |
| `mise run lint:fix`      | Lint and auto-fix                              |
| `mise run fmt`           | Format with Prettier                           |
| `mise run fmt:check`     | Check formatting                               |
| `mise run typecheck`     | Type-check with tsc                            |
| `mise run test`          | Run tests once                                 |
| `mise run test:watch`    | Run tests in watch mode                        |
| `mise run check`         | Lint + format check                            |
| `mise run ci`            | Lint, format check, typecheck, tests and build |

## Git hooks

Installed by `mise run install` through Lefthook:

- **pre-commit**: lints and formats staged files (fixes are re-staged automatically)
- **commit-msg**: rejects messages that don't follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)

## Tests

Tests live next to the code as `*.test.ts`. Routes are tested without starting a server via `app.request()`.

Integration tests run against a throwaway PostGIS container (Testcontainers) with the migrations applied, so they never touch your dev database. Docker is required.

The Google sign-in flow is tested end to end (`src/auth.google.test.ts`) by faking Google's token endpoint, so no real credentials or network are needed. Test credentials are set in `vitest.config.ts`.

If you use Colima, point Testcontainers at its socket:

```sh
export DOCKER_HOST=unix://$HOME/.colima/default/docker.sock
export TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE=/var/run/docker.sock
```

## CI

GitHub Actions runs lint, format, typecheck, test and build as parallel jobs on every Pull Request and on `master`. Run `mise run ci` locally to run them all before pushing.

## Links

- Jira: [ADP – ArtisansDirect Platform](https://ynov-coordination-front-back.atlassian.net/jira/software/projects/ADP)
- Front-end: [artisan-direct-client](https://github.com/hlaclau/artisan-direct-client)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for branch, commit and Pull Request conventions.
