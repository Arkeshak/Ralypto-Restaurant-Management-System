# Contributing to Ralypto

Welcome to the Ralypto team! This repository is a monorepo shared by **Arkesh** (Frontend Lead) and our **Backend Lead**. Please review and adhere to these guidelines to ensure smooth collaboration.

---

## 1. Branch Strategy

We follow a structured Git branching workflow:

- **`main` (Protected)**: Always stable and deployable. Direct pushes to `main` are disabled. All merges require an approved Pull Request and green CI.
- **`dev`**: The active integration branch. Feature branches merge into `dev` after review.
- **Feature Branches**: Branch off `dev` using standard naming conventions:
  - `feat/feature-name` (e.g. `feat/pos-table-map`, `feat/order-split-bill`)
  - `fix/bug-description` (e.g. `fix/cart-discount-calc`)
  - `docs/doc-topic` (e.g. `docs/api-kot-spec`)
  - `chore/task-name` (e.g. `chore/upgrade-vite`)

---

## 2. Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short description in imperative mood>

[optional body]
```

### Allowed Types:
- `feat`: A new user-facing feature or API capability
- `fix`: A bug fix
- `docs`: Documentation updates or OpenAPI contract modifications
- `style`: Formatting, missing semicolons, CSS tweaks (no code logic change)
- `refactor`: Refactoring code without altering external behavior
- `test`: Adding or updating test suites
- `chore`: Dependency updates, tooling, build scripts

### Examples:
- `feat(pos): add split bill calculation by items and headcount`
- `fix(kitchen): resolve ticket status toggle delay on WebSocket disconnect`
- `docs(api): add split order endpoint schema to openapi.yaml`
- `chore(deps): bump tailwindcss and lucide-react`

---

## 3. Pull Request & Review Policy

1. **At least 1 review is required** before merging any PR into `dev` or `main`.
2. Keep PRs small and focused (preferable under 400 lines of diff).
3. The PR author is responsible for ensuring that all CI checks (linting, typechecking, tests, build) pass.
4. Merge using **Squash and Merge** or **Rebase and Merge** to keep Git history clean.

---

## 4. API-First Development Rule

The file [`api-contract/openapi.yaml`](api-contract/openapi.yaml) is the single source of truth between frontend and backend.

- **Rule**: Never create an endpoint on the backend or consume an undocumented endpoint on the frontend without first specifying it in `api-contract/openapi.yaml`.
- If an endpoint signature, request body, query parameter, or response schema needs to change:
  1. Open a discussion with your pair partner.
  2. Update `api-contract/openapi.yaml`.
  3. Once approved, implement the backend handler and frontend API client/MSW mock.

---

## 5. Security & Secret Management

- **NEVER commit `.env` or any production secrets, tokens, or credentials.**
- Use `.env.example` as the source of truth for required environment variables.
- When introducing a new environment variable, immediately update `.env.example` with a dummy placeholder.

---

## 6. Communication Cadence

- **Daily Standup**: Post a brief 3-bullet update in chat (Completed yesterday, Doing today, Blockers).
- **Weekly Sync**: 30-minute call to align on upcoming sprint milestones and contract changes.
