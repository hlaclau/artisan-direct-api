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

Edit `.env`: set `BETTER_AUTH_SECRET` to a random string of 32+ characters (`openssl rand -base64 32`). Google sign-in also needs `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` (see [Authentication](#authentication)).

3. Start the local services, **apply the database migrations** and start the API:

```sh
mise run services    # docker compose up -d
mise run db:migrate  # creates the tables (users, sessions...), required before first run
mise run dev
```

The migrations in `drizzle/` are not applied automatically: run `mise run db:migrate` on first setup, after pulling new migrations, and after `mise run services:reset`. Without it, auth requests fail with `relation "user" does not exist`. The tests don't need it, they migrate their own container.

The API runs on http://localhost:3000. Try `curl localhost:3000/health`.

| Service    | URL                                                        |
| ---------- | ---------------------------------------------------------- |
| PostgreSQL | `postgres://artisan:artisan@localhost:5432/artisan_direct` |

## Environment variables

Copy `.env.example` to `.env`.

| Variable               | Description                                                                         |
| ---------------------- | ----------------------------------------------------------------------------------- |
| `PORT`                 | API port (default `3000`)                                                           |
| `DATABASE_URL`         | PostgreSQL connection string                                                        |
| `BETTER_AUTH_URL`      | Public base URL of the API (used for OAuth callback)                                |
| `TRUSTED_ORIGIN`       | Web client origin allowed by CORS and Better Auth (default `http://localhost:5173`) |
| `BETTER_AUTH_SECRET`   | Random string of 32+ characters, signs sessions                                     |
| `GOOGLE_CLIENT_ID`     | Google OAuth client ID                                                              |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret                                                          |

## API contract

The contract lives in this repository, in code: routes are declared with `createRoute` from `@hono/zod-openapi`, so request validation, TypeScript types and the OpenAPI document all come from the same Zod schemas. The client generates its types from the document.

- OpenAPI document: http://localhost:3000/openapi.json
- Interactive docs ([Scalar](https://scalar.com)): http://localhost:3000/docs, routes grouped by tag (Auth, Account, Artisan, Admin, …)
- The Better Auth endpoints (`/api/auth/*`) are merged into the same document, under the **Auth** tag

Code is organised by bounded context under `src/modules/<context>/` (`*.schemas.ts` for Zod schemas, `*.routes.ts` for routes). Shared building blocks are in `src/lib/` (`problem.ts`, `pagination.ts`, `stub-route.ts`).

### Conventions

- Base path `/api`, plural resource names, JSON in camelCase, no verbs in URLs (assumed exception: `approve` / `reject` on artisans). `/api/me` is the signed-in user, `/api/admin/*` requires the admin role.
- Authentication: the Better Auth session cookie (`credentials: 'include'`), declared as the `cookieAuth` security scheme. No `Authorization` header.
- Status codes: `200` read/update, `201` creation (with `Location`), `204` deletion, `400` validation, `401` not signed in, `403` wrong role or someone else's resource, `404`, `409` conflict, `413`/`415` upload, `429`, `500`.
- Errors: `application/problem+json` ([RFC 9457](https://www.rfc-editor.org/rfc/rfc9457)), a single `Problem` schema: `{ type, title, status, detail?, errors?: [{ field, message }] }`. Declare them with `problemResponses(...)` from `src/lib/problem.ts`.
- Lists: `?page&pageSize` (default 1 / 20, max 100) and the envelope `{ data: [], meta: { page, pageSize, total } }` (`paginated()` in `src/lib/pagination.ts`). Filters are query parameters, e.g. `?status=pending`.
- Updates: `PATCH` is partial, `PUT` replaces a sub-resource idempotently. Uploads are `multipart/form-data` (PDF, JPEG, PNG).
- No version in the URL for now (a single consumer); to be revisited if the API becomes public.

### Not implemented yet

In `/docs`, the sidebar has two groups: **Implemented** (routes with a handler, plus Auth) and **Contract only (not implemented)**, whose tags carry a ` (contract)` suffix. The split is automatic: a route is contract-only as long as it declares a 501 response. To move a route to _Implemented_, write its handler and remove `501` from its `problemResponses(...)`.

A route answering **501** in the `Problem` format is part of the contract but has no handler yet (`notImplemented` in `src/lib/problem.ts`). Domains still to be detailed are declared as skeletons with `stubRoute` (tag, summary, access rules, no payloads): search, diagnostic, interventions, quotes, planning, payments, reviews and notifications.

### Proposing a change to the contract

1. Branch `docs/<TICKET>_<description>` (see [CONTRIBUTING.md](CONTRIBUTING.md))
2. Edit the schemas and routes in `src/modules/<context>/`; replace a `stubRoute` by a detailed `createRoute` when detailing a domain
3. Update the route inventory in `src/openapi.test.ts`
4. Check the result on `/docs`, then run `bun run lint`, `bun run fmt:check`, `bun run typecheck` and `bun run test`
5. Open a PR and ask the front-end for a review: the contract is agreed before the handlers are written

## Authentication

[Better Auth](https://www.better-auth.com) is mounted at `/api/auth/*` (config in `src/auth.ts`). Sessions are cookie-based and stored in PostgreSQL.

- All endpoints are listed in the Scalar docs at `/docs` (tag **Auth**)
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

| Command                   | Description                                         |
| ------------------------- | --------------------------------------------------- |
| `mise run auth:generate`  | Regenerate the Drizzle auth schema from src/auth.ts |
| `mise run build`          | Type-check and build for production                 |
| `mise run check`          | Lint + format check                                 |
| `mise run ci`             | Lint, format check, typecheck, tests and build      |
| `mise run db:generate`    | Generate a SQL migration from the Drizzle schema    |
| `mise run db:migrate`     | Apply migrations to the local database              |
| `mise run db:studio`      | Browse the database with Drizzle Studio             |
| `mise run dev`            | Start the API with hot reload                       |
| `mise run fmt`            | Format with prettier                                |
| `mise run fmt:check`      | Check formatting with prettier                      |
| `mise run install`        | Install dependencies and git hooks                  |
| `mise run lint`           | Lint with oxlint                                    |
| `mise run lint:fix`       | Lint and auto-fix with oxlint                       |
| `mise run services`       | Start local services (PostgreSQL/PostGIS)           |
| `mise run services:down`  | Stop local services (data is kept)                  |
| `mise run services:reset` | Stop local services and delete their data           |
| `mise run start`          | Run the production build                            |
| `mise run test`           | Run tests once                                      |
| `mise run test:watch`     | Run tests in watch mode                             |
| `mise run typecheck`      | Type-check with tsc                                 |

## Git hooks

Installed by `mise run install` through Lefthook:

- **pre-commit**: lints and formats staged files (fixes are re-staged automatically)
- **commit-msg**: rejects messages that don't follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)

## Tests

Tests live next to the code as `*.test.ts`. Routes are tested without starting a server via `app.request()`.

Integration tests run against a throwaway PostGIS container (Testcontainers) with the migrations applied, so they never touch your dev database. Docker is required.

The Google sign-in flow is tested end to end (`src/auth.google.test.ts`) by faking Google's token endpoint, so no real credentials or network are needed. Test credentials are set in `vitest.config.ts`.

Testcontainers uses your active Docker context automatically (Colima, OrbStack and Docker Desktop all work). Set `DOCKER_HOST` yourself to override it.

## CI

GitHub Actions runs lint, format, typecheck, test and build as parallel jobs on every Pull Request and on `master`. Run `mise run ci` locally to run them all before pushing.

## Links

- Jira: [ADP – ArtisansDirect Platform](https://ynov-coordination-front-back.atlassian.net/jira/software/projects/ADP)
- Front-end: [artisan-direct-client](https://github.com/hlaclau/artisan-direct-client)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for branch, commit and Pull Request conventions.
