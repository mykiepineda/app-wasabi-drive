# Wasabi Drive SPA — GitHub Copilot Instructions

## Current project phase

Wasabi Drive is an existing production React single-page application (SPA)
hosted on Firebase Hosting.

The current modernization phase is:

**Phase 6 — CI/CD and Deployment Safety**

CI/CD = Continuous Integration / Continuous Delivery or Deployment.

The active implementation task is:

**Task 6B — Frontend pull-request CI**

The developer is the technical owner and architectural decision-maker.

Copilot is a narrow implementation assistant. Implement only the explicitly
requested task. Do not independently redesign application architecture,
authentication, deployment strategy, or environment management.

Do not automatically continue into Task 6C or any deployment work.

## Branch safety

`master` is the protected integration/release branch.

Use:

`ci/frontend-pr-checks`

Never commit implementation work directly to `master`.

Work only in the current workspace and current branch.

Do not create another branch or worktree unless explicitly instructed.

Keep commits focused and reviewable.

Avoid unrelated:

- application refactoring;
- dependency upgrades;
- dependency cleanup;
- formatting changes;
- authentication changes;
- Firebase changes;
- deployment changes;
- UI changes.

## Task 6B objective

Introduce GitHub Actions pull-request validation for the frontend repository
with zero deployment capability.

The workflow must prove that the frontend can be reproduced, tested, and built
from a clean CI environment.

Target flow:

checkout
-> Node.js 24
-> `npm ci`
-> `npm run test:ci`
-> `npm run build`

This is Continuous Integration only.

It must not deploy anything.

## Current frontend architecture

Preserve:

- React 18;
- JavaScript;
- Create React App / `react-scripts` 5;
- Firebase Hosting;
- MSAL — Microsoft Authentication Library;
- Microsoft Entra authentication;
- OAuth 2.0 API access tokens;
- cursor-based pagination;
- backend-generated temporary `AccessUrl` values.

Do not migrate Create React App during this task.

Do not introduce Vite, Next.js, TypeScript, another state library, another
HTTP client, or another deployment platform.

## Security invariants

Never weaken:

- Microsoft Entra authentication;
- OAuth 2.0 access-token usage;
- backend trusted-user authorization;
- private Wasabi objects;
- backend-generated temporary `AccessUrl`;
- absence of API-key authentication.

The frontend is not the authorization authority.

Do not:

- add authentication bypasses for CI;
- reintroduce `X-Api-Key`;
- expose or commit bearer tokens;
- introduce Entra client secrets;
- add Wasabi or AWS credentials;
- add Firebase credentials to PR CI;
- expose production credentials;
- construct public Wasabi object URLs.

## Frontend build-time configuration

Create React App embeds `REACT_APP_*` variables at build time.

The application currently requires:

- `REACT_APP_API_URL`;
- `REACT_APP_ENTRA_TENANT_ID`;
- `REACT_APP_ENTRA_CLIENT_ID`;
- `REACT_APP_ENTRA_API_SCOPE`.

`src/auth/msal-config.js` validates required Entra configuration when imported.

Therefore Task 6B CI must deliberately provide configuration suitable for
testing and compiling from a clean environment.

PR CI must use non-production, non-secret placeholder values.

Use conceptually:

- `REACT_APP_API_URL=https://api.ci.invalid`
- synthetic UUID-shaped Entra tenant/client identifiers;
- a synthetic API scope.

These values are public configuration, not credentials.

Do not use real production values merely to make the build pass.

Do not introduce an Entra client secret.

Do not create authentication bypasses.

The PR build is not deployed and does not need to represent a functioning
interactive Entra environment.

## Required workflow

Create:

`.github/workflows/frontend-pr-checks.yml`

The workflow must:

- run for pull requests targeting `master`;
- use the normal `pull_request` event;
- use Node.js 24;
- execute `npm ci`;
- execute `npm run test:ci`;
- execute `npm run build`;
- use a GitHub-hosted Ubuntu runner;
- use explicit least-privilege GitHub token permissions;
- use no deployment credentials;
- use no repository/environment secrets;
- request no OIDC identity-token permission;
- perform no Firebase deployment.

OIDC = OpenID Connect. GitHub OIDC will be relevant to later deployment tasks,
but it is not needed for pull-request CI.

Do not use `pull_request_target`.

Do not run `firebase deploy`.

Do not run `npx firebase deploy`.

Do not use Firebase tokens or service-account credentials.

Do not create GitHub Environments during this task.

## GitHub Action dependency safety

Use official GitHub-maintained Actions.

Use the same reviewed, full-SHA-pinned Checkout and setup-node Actions already
approved for backend Phase 6 Task 6A where appropriate.

For Checkout:

- retain `persist-credentials: false`.

For setup-node:

- use Node.js 24;
- retain `package-manager-cache: false` for the initial reproducibility check.

Do not introduce unnecessary third-party Actions.

## Tests and build

Existing scripts are:

`npm run test:ci`

and:

`npm run build`

Use those scripts as they exist.

Do not alter tests merely to make CI green.

Do not suppress failures.

Do not set `CI=false` to bypass Create React App CI behavior.

If a clean Node.js 24 environment exposes a real problem:

1. identify the exact cause;
2. determine whether it is a dependency/lockfile, test, configuration, or build
   compatibility issue;
3. report it;
4. make no unrelated application change.

Application source changes are not expected for Task 6B.

## Package handling

Use:

`npm ci`

Do not use `npm install` as a fallback.

Do not change `package.json` or `package-lock.json` merely to obtain a passing
workflow.

The existing direct frontend `aws-sdk` dependency appears unused but its
removal is a separate approved maintenance task.

Do not remove it during Task 6B.

Do not upgrade React, `react-scripts`, MSAL, Firebase Tools, or other
dependencies during this task.

## Existing functionality that must remain unchanged

Do not change:

- MSAL startup/account handling;
- Entra configuration validation;
- silent access-token acquisition;
- redirect-based token acquisition;
- bearer `Authorization` handling;
- trusted-user authorization behavior;
- API error mapping;
- cursor pagination;
- `AccessUrl` handling;
- logout behavior;
- Firebase Hosting configuration.

CI should execute the application’s existing tests, not redesign these areas.

## Firebase boundary

Firebase Hosting remains the deployment target.

Task 6B must not deploy Firebase.

Do not modify:

- `firebase.json`;
- `.firebaserc`;
- Firebase project/site configuration.

Repository-local `firebase-tools` already exists as a development dependency,
but Task 6B should not invoke it.

Explicit `deploy:test` / `deploy:prd` commands belong to a later Phase 6 task.

## Expected files

Expected Task 6B changes are limited to:

- `.github/workflows/frontend-pr-checks.yml`;
- `.github/copilot-instructions.md`.

Do not modify application source, package metadata, lockfiles, Firebase files,
or environment files unless an actual CI compatibility defect is first
demonstrated and reviewed.

## Validation

Before completion verify:

1. workflow triggers on PRs targeting `master`;
2. normal `pull_request` is used;
3. Node.js 24 is selected;
4. dependencies use exactly `npm ci`;
5. tests execute `npm run test:ci`;
6. build executes `npm run build`;
7. safe non-production build variables are deliberately supplied;
8. no real credentials or secrets are referenced;
9. no Firebase command runs;
10. no deployment occurs;
11. no OIDC `id-token` permission is requested;
12. GitHub token permissions are least privilege;
13. Checkout credentials are not persisted.

Run in a clean Node.js 24 environment:

`npm ci`

`npm run test:ci`

`npm run build`

If anything fails, diagnose the failure rather than bypassing it.

## Non-goals

Do not implement during Task 6B:

- Firebase deployment;
- stable frontend test environment;
- Firebase CI authentication;
- Google Workload Identity Federation;
- production promotion;
- backend CI/CD changes;
- AWS OIDC;
- Serverless deployment;
- Bruno integration automation;
- frontend AWS SDK cleanup;
- Create React App migration;
- dependency upgrades;
- authentication changes;
- pagination changes;
- CORS changes;
- UI redesign;
- observability changes.

## Completion report

Stop after Task 6B.

Report:

- branch used;
- workflow file added;
- trigger conditions;
- workflow permissions;
- Node version;
- CI environment values and confirmation they are non-secret placeholders;
- commands executed;
- `npm ci` result;
- `npm run test:ci` result;
- `npm run build` result;
- dependency/lockfile issues, if any;
- confirmation that no Firebase/deployment commands exist;
- confirmation that no deployment credentials or repository secrets are used;
- files changed;
- commits created;
- any remaining concern requiring developer review.

Do not automatically start Task 6C.