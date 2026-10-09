# ArtisansDirect – API

> **Fictional school project** for the _Front/Back Coordination_ course at Ynov. The assignment requires the project to be split into two repositories: this one (back-end) and [artisan-direct-client](https://github.com/hlaclau/artisan-direct-client) (front-end).

Back-end of **ArtisansDirect**, a platform connecting clients with craftspeople: artisan search, service requests, quotes, scheduling, payment and reviews.

This repository contains the API and business logic.

## Stack

- [Bun](https://bun.sh) – runtime and package manager
- [Hono](https://hono.dev) + TypeScript (strict)
- [Zod](https://zod.dev) + [`@hono/zod-openapi`](https://github.com/honojs/middlewares/tree/main/packages/zod-openapi) – validation and OpenAPI contract
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

3. Start the local services and the API:

```sh
mise run services  # docker compose up -d
mise run dev
```

The API runs on http://localhost:3000. Try `curl localhost:3000/health`.

| Service    | URL                                                        |
| ---------- | ---------------------------------------------------------- |
| PostgreSQL | `postgres://artisan:artisan@localhost:5432/artisan_direct` |

## API contract

The OpenAPI document is served at http://localhost:3000/openapi.json. Routes are declared with `createRoute` from `@hono/zod-openapi`, so request validation, TypeScript types and the spec all come from the same Zod schemas. The client generates its types from this document.

Code is organised by bounded context under `src/modules/<context>/`.

## Tasks

Run `mise tasks` to list them all.

| Command               | Description                                    |
| --------------------- | ---------------------------------------------- |
| `mise run install`    | Install dependencies and git hooks             |
| `mise run services`   | Start PostgreSQL/PostGIS                       |
| `mise run dev`        | Start the API with hot reload                  |
| `mise run build`      | Type-check and build for production            |
| `mise run start`      | Run the production build                       |
| `mise run lint`       | Lint with oxlint                               |
| `mise run lint:fix`   | Lint and auto-fix                              |
| `mise run fmt`        | Format with Prettier                           |
| `mise run fmt:check`  | Check formatting                               |
| `mise run typecheck`  | Type-check with tsc                            |
| `mise run test`       | Run tests once                                 |
| `mise run test:watch` | Run tests in watch mode                        |
| `mise run check`      | Lint + format check                            |
| `mise run ci`         | Lint, format check, typecheck, tests and build |

## Git hooks

Installed by `mise run install` through Lefthook:

- **pre-commit**: lints and formats staged files (fixes are re-staged automatically)
- **commit-msg**: rejects messages that don't follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)

## Tests

Tests live next to the code as `*.test.ts`. Routes are tested without starting a server via `app.request()`.

## CI

GitHub Actions runs lint, format, typecheck, test and build as parallel jobs on every Pull Request and on `master`. Run `mise run ci` locally to run them all before pushing.

## Links

- Jira: [ADP – ArtisansDirect Platform](https://ynov-coordination-front-back.atlassian.net/jira/software/projects/ADP)
- Front-end: [artisan-direct-client](https://github.com/hlaclau/artisan-direct-client)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for branch, commit and Pull Request conventions.
