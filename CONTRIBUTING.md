# Contributing

## Workflow

1. Start from an up-to-date `master`
2. Create a branch following the convention below
3. Commit using Conventional Commits
4. Open a Pull Request to `master` (the template is filled in automatically)
5. Merge after at least **1 approved review**

`master` is protected: no direct pushes, Pull Requests are required.

## Branches

Format: `<type>/<JIRA-TICKET>_<short-description>`

| Type        | Usage                                  |
| ----------- | -------------------------------------- |
| `feature/`  | New feature                            |
| `fix/`      | Bug fix                                |
| `chore/`    | Tooling, config, dependencies, CI      |
| `docs/`     | Documentation only                     |
| `refactor/` | Refactoring with no behavior change    |
| `test/`     | Adding or updating tests               |

Examples:

```
feature/ADP-73_create-user
fix/ADP-42_email-validation
chore/ADP-51_init-repo
```

Jira ticket key in uppercase, then `_`, then a lowercase description with words separated by `-`.

## Commits

We follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/):

```
<type>(<optional scope>): <description>

[optional body]

[optional footer, e.g. Refs: ADP-30]
```

Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `style`, `perf`, `ci`, `build`.

Examples:

```
feat(auth): add account creation route
fix(quote): fix total price calculation
chore: update dependencies
docs: document branch conventions
```

- Imperative mood, lowercase, no trailing period
- One commit = one coherent change
- Breaking change: `feat!: ...` or a `BREAKING CHANGE: ...` footer
