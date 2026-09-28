# Wasabi Drive Frontend — GitHub Copilot Instructions

## Project role

Wasabi Drive is an existing production application and an incremental modernization project.

The developer is the technical owner and architectural decision-maker.

Copilot is an implementation assistant. Make only the explicitly requested change, preserve working behavior, and do not independently redesign the frontend, authentication model, deployment model, Firebase architecture, Google Cloud identity model, backend integration, or release process.

Prefer focused, reviewable changes over broad cleanup.

## Current phase

Current modernization phase:

**Phase 6 — CI/CD and Deployment Safety**

CI/CD = Continuous Integration / Continuous Delivery.

Completed work:

- 6A — backend pull-request CI;
- 6B — frontend pull-request CI;
- 6C — deployment command normalization;
- 6D — automated backend `test` deployment using GitHub Actions, GitHub OIDC, AWS STS, and Serverless Framework;
- 6E — backend test-stage verification;
- 6F — stable frontend `test` Firebase Hosting environment;
- 6G — automated frontend `test` deployment using GitHub OIDC and Google Workload Identity Federation;
- 6H-A — controlled backend production promotion using an exact tested `master` SHA;
- 6H-A.1 — backend `/health` plus automated deployed-API smoke verification in `test` and `prd`;
- 6H-B — controlled frontend production promotion using an exact tested `master` SHA.

Phase 6 is complete. Do not proceed to later phases or unrelated cleanup without direction from the technical owner.

Do not make backend changes as part of the completed Task 6H-B implementation.

## Current frontend state

Treat the latest `master` source as authoritative.

The established frontend state includes:

- React 18;
- Create React App / `react-scripts` 5;
- JavaScript;
- Microsoft Authentication Library (MSAL);
- Microsoft Entra authentication;
- Firebase Hosting;
- production Firebase project ID `wasabi-drive-e73cd`;
- production Hosting URL `https://wasabi-drive-e73cd.web.app/`;
- dedicated test Firebase project ID `wasabi-drive-test`;
- stable test Hosting URL `https://wasabi-drive-test.web.app/`;
- `.firebaserc` aliases:
  - `default` -> `wasabi-drive-e73cd`;
  - `prd` -> `wasabi-drive-e73cd`;
  - `test` -> `wasabi-drive-test`;
- repository-local `firebase-tools`;
- local fallback scripts `deploy:test` and `deploy:prd`;
- frontend PR CI on pull requests to `master`;
- automated frontend test deployment on push to `master`.

The completed test-deployment workflow is:

`.github/workflows/frontend-test-deploy.yml`

It already proves the approved Google authentication pattern:

GitHub OIDC
-> Google Workload Identity Federation
-> dedicated test service account
-> short-lived credentials
-> Firebase Hosting.

Reuse that pattern for production rather than inventing another deployment mechanism.

## Current frontend architecture

Preserve:

- React 18;
- Create React App;
- `react-scripts` 5;
- JavaScript;
- MSAL;
- Microsoft Entra;
- Firebase Hosting;
- separate Firebase projects for `test` and production;
- frontend `REACT_APP_*` configuration embedded at build time.

Do not introduce:

- Firebase Authentication;
- Firestore;
- Realtime Database;
- Cloud Functions;
- Firebase App Hosting;
- another frontend hosting platform;
- Vite;
- TypeScript;
- runtime configuration infrastructure.

## Security and identity invariants

Preserve:

React SPA
-> MSAL
-> Microsoft Entra
-> OAuth 2.0 / OpenID Connect
-> access token
-> API Gateway
-> Express backend authentication
-> application authorization
-> Wasabi.

MSAL = Microsoft Authentication Library.

OIDC = OpenID Connect.

WIF = Google Cloud Workload Identity Federation. It lets GitHub Actions exchange its GitHub OIDC identity for short-lived Google credentials without storing a long-lived Google service-account key.

The backend remains the security authority.

Frontend state is not authorization.

CORS is not authentication.

Browser-visible frontend configuration is not secret.

The following are public build-time configuration:

- `REACT_APP_API_URL`;
- `REACT_APP_ENTRA_TENANT_ID`;
- `REACT_APP_ENTRA_CLIENT_ID`;
- `REACT_APP_ENTRA_API_SCOPE`.

Do not introduce:

- a Microsoft Entra client secret into the SPA;
- API keys as user authentication;
- `FIREBASE_TOKEN`;
- `firebase login:ci`;
- Google service-account JSON keys;
- long-lived Google credentials;
- production Google credentials stored as GitHub secrets.

## Task 6H-B objective

Add a controlled, manual frontend production promotion workflow.

Target release flow:

reviewed frontend change
-> PR CI
-> merge to protected `master`
-> automatic frontend `test` deployment
-> manual validation at `https://wasabi-drive-test.web.app/`
-> choose the exact tested full 40-character `master` SHA
-> manually dispatch production promotion
-> validate SHA is a commit and an ancestor of `origin/master`
-> checkout that exact SHA detached
-> Node.js 24
-> `npm ci`
-> `npm run test:ci`
-> build that exact source using production `REACT_APP_*` values
-> GitHub OIDC
-> production Google WIF
-> dedicated production deploy service account
-> Firebase Hosting production deployment
-> manual production validation.

Production must **never** deploy automatically on merge or push.

## Important build-artifact rule

Create React App embeds `REACT_APP_*` variables into static JavaScript during `npm run build`.

Therefore the frontend test build and production build are intentionally separate:

same tested source SHA
-> test build with test `REACT_APP_*`
-> production build with production `REACT_APP_*`.

Do not copy or reuse the test `build/` directory for production.

This task promotes the **same source SHA**, not a byte-for-byte test build artifact.

Do not introduce artifact storage/promotion infrastructure in this task.

If byte-identical artifact promotion becomes a future requirement, treat it as a separate architecture decision.

## Production external setup

The technical owner has already completed the production external setup.

Existing production configuration includes:

- Google Cloud / Firebase project `wasabi-drive-e73cd`;
- production Firebase Hosting already serving `https://wasabi-drive-e73cd.web.app/`;
- dedicated Google service account:
  `wasabi-drive-gh-prd-deployer@wasabi-drive-e73cd.iam.gserviceaccount.com`;
- that service account has production Firebase Hosting deployment permission;
- production WIF pool:
  `github-prd`;
- production WIF provider:
  `github-app-wasabi-drive-prd`;
- provider trust restricted to:
  - owner `mykiepineda`;
  - repository `mykiepineda/app-wasabi-drive`;
  - ref `refs/heads/master`;
  - GitHub Environment `prd`;
  - GitHub event `workflow_dispatch`;
- the frontend GitHub repository has Environment `prd`;
- the `prd` Environment is restricted to `master`;
- the `prd` Environment contains the required production build and WIF variables;
- Microsoft Entra already has the production SPA redirect URI;
- production Google/Firebase billing setup is complete.

Do not create or modify Google Cloud, Firebase, GitHub Environment, or Entra resources from source code.

If the workflow encounters an authorization/configuration error, report the exact failure rather than broadening IAM.

## Production GitHub Environment variables

The workflow must consume these existing GitHub Environment **variables**:

- `REACT_APP_API_URL`;
- `REACT_APP_ENTRA_TENANT_ID`;
- `REACT_APP_ENTRA_CLIENT_ID`;
- `REACT_APP_ENTRA_API_SCOPE`;
- `GCP_WORKLOAD_IDENTITY_PROVIDER`;
- `GCP_DEPLOY_SERVICE_ACCOUNT`.

Do not hardcode the WIF provider resource or deploy service-account email into the workflow when the Environment variables already exist.

The production Firebase project ID itself is stable, non-secret deployment configuration and may be explicit in the workflow as:

`wasabi-drive-e73cd`

No credential secret should be required for production Firebase deployment.

## Required workflow

Create:

`.github/workflows/frontend-prd-deploy.yml`

Recommended workflow name:

`Frontend Production Promotion`

The workflow must be manual only.

Use:

```yaml
on:
  workflow_dispatch:
    inputs:
      source_sha:
        description: Full 40-character master commit SHA already validated in test
        required: true
        type: string
```

Do not add:

- `push`;
- `pull_request`;
- `schedule`;
- automatic production deployment.

## GitHub token permissions

Explicitly request only:

```yaml
permissions:
  contents: read
  id-token: write
```

`id-token: write` permits GitHub to request an OIDC token.

It does not itself grant Google Cloud permissions.

Do not add broader GitHub token permissions unless a concrete requirement is demonstrated and reviewed.

## Production concurrency

Use:

```yaml
concurrency:
  group: frontend-prd-deployment
  cancel-in-progress: false
```

Only one production Hosting deployment should execute at a time.

A later request should wait rather than cancel an in-progress production deployment.

## Production job and Environment

The production job should:

- run on `ubuntu-latest`;
- use GitHub Environment `prd`;
- expose the production URL in the Environment UI.

Use:

```yaml
environment:
  name: prd
  url: https://wasabi-drive-e73cd.web.app/
```

Also ensure the workflow can only execute its deployment job when dispatched from `master`.

Match the existing backend production-promotion defense-in-depth pattern.

A suitable job guard is:

```yaml
if: github.ref == 'refs/heads/master'
```

The external GitHub Environment restriction is an additional control, not a replacement for workflow validation.

## Exact source-SHA validation

The production workflow must require the caller to enter a full 40-character Git commit SHA.

Do not accept:

- branch names;
- tag names;
- abbreviated SHAs;
- arbitrary refs.

Checkout must first obtain enough repository history to validate an older known-good `master` SHA.

Use the approved checkout action with:

```yaml
fetch-depth: 0
persist-credentials: false
```

Then validate:

1. `source_sha` matches exactly 40 hexadecimal characters;
2. the SHA resolves to a Git commit;
3. the SHA is an ancestor of `origin/master`;
4. checkout switches to that exact SHA in detached HEAD state;
5. `git rev-parse HEAD` exactly matches the requested commit.

This allows both normal promotion and rollback to a known-good historical `master` commit.

Do not require the SHA to equal the current tip of `master`.

Do not accept commits that are not in `master` history.

## Approved GitHub Actions pins

Reuse the already reviewed official actions and exact pins.

Checkout:

`actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1`

Node:

`actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0`

Google authentication:

`google-github-actions/auth@7c6bc770dae815cd3e89ee6cdf493a5fab2cc093 # v3.0.0`

Do not replace these with floating tags.

Do not add unnecessary third-party actions.

Do not use `FirebaseExtended/action-hosting-deploy`.

## Node and dependency installation

After checking out the exact promoted SHA, use:

```yaml
node-version: "24"
package-manager-cache: false
```

Then run:

```bash
npm ci
```

Do not upgrade dependencies.

Do not regenerate `package-lock.json`.

Do not remediate npm audit findings in this task.

## Production tests

Before building or obtaining Google credentials, run:

```bash
npm run test:ci
```

The production workflow reruns the frontend regression tests even though the same source SHA was already validated in test.

Do not weaken tests to make deployment pass.

If tests fail, production deployment must not continue.

## Production build

Supply the four production `REACT_APP_*` values from GitHub Environment `prd`.

Build with:

```bash
npm run build
```

The build must happen **before** Google authentication.

Do not expose Google credentials to the React build.

Do not reuse a test build.

Do not use test Environment variables in production.

## Build-before-auth boundary

The production sequence must be:

```text
checkout exact source SHA
-> setup Node
-> npm ci
-> npm run test:ci
-> npm run build
-> record deployment context
-> authenticate to Google
-> Firebase deploy
```

This boundary is intentional.

The React build requires only public browser-visible configuration.

Google deployment credentials should not exist until after the build has completed.

## Deployment traceability

Before Google authentication, log only non-secret context:

- requested source SHA;
- verified checked-out SHA;
- environment = `prd`;
- Firebase project = `wasabi-drive-e73cd`;
- GitHub workflow run URL.

Do not print:

- Google access tokens;
- OIDC tokens;
- credential-file contents;
- private keys;
- Entra access tokens.

Important: after checking out an input SHA, `${{ github.sha }}` still represents the workflow-dispatch ref's SHA and is not necessarily the source being promoted.

For production traceability, use:

- `${{ inputs.source_sha }}` and/or
- `git rev-parse HEAD`

as the promoted source identifier.

Do not label `${{ github.sha }}` as the promoted source SHA unless they happen to be identical.

## Google authentication

Authenticate only after tests and build succeed.

Use:

```yaml
- name: Authenticate to Google Cloud
  uses: google-github-actions/auth@7c6bc770dae815cd3e89ee6cdf493a5fab2cc093 # v3.0.0
  with:
    project_id: wasabi-drive-e73cd
    workload_identity_provider: ${{ vars.GCP_WORKLOAD_IDENTITY_PROVIDER }}
    service_account: ${{ vars.GCP_DEPLOY_SERVICE_ACCOUNT }}
    create_credentials_file: true
    export_environment_variables: true
```

Do not use:

- service-account JSON;
- `FIREBASE_TOKEN`;
- `firebase login`;
- `firebase login:ci`.

The production service account and WIF provider are already configured externally.

Do not modify IAM to make CI pass.

## Credential-file hygiene

Task 6G already established the Google auth credential-file hygiene rule.

The current `master` should contain:

```text
gha-creds-*.json
```

in `.gitignore`.

Verify that it remains present.

Do not remove it.

No `.gitignore` change is expected for Task 6H-B if the Task 6G state is intact.

The build occurs before authentication so the temporary credentials file cannot be included in the React build.

## Firebase production deployment

After authentication, deploy the already-built `build/` directory.

Do **not** run:

```bash
npm run deploy:prd
```

inside the GitHub Actions production workflow.

The existing local fallback script performs another `npm run build`, which would rebuild after Google credentials had been obtained.

Use the repository-local Firebase CLI directly.

For the automated production workflow, explicitly target the production Firebase project:

```bash
npm exec -- firebase deploy --only hosting --project wasabi-drive-e73cd --non-interactive
```

Using the explicit production project ID in the production workflow reduces ambiguity during promotion and rollback.

The existing `.firebaserc` `prd` alias and local `npm run deploy:prd` fallback remain unchanged.

When practical, include a Hosting deployment message containing the promoted source SHA and GitHub run ID, for example:

```bash
-m "sha:${{ inputs.source_sha }} run:${{ github.run_id }}"
```

Do not use `${{ github.sha }}` as the release SHA if the workflow may be promoting an older tested commit.

## Existing local deployment commands

Preserve the existing scripts:

```json
"deploy:test": "npm run build && firebase deploy --only hosting --project test",
"deploy:prd": "npm run build && firebase deploy --only hosting --project prd"
```

They remain manual fallback commands.

Do not modify `.firebaserc`.

Do not modify `firebase.json`.

Do not change Firebase Hosting architecture.

## Rollback model

Production rollback remains deliberate and manual.

Rollback procedure:

1. identify a known-good full 40-character commit SHA from `master`;
2. manually dispatch `Frontend Production Promotion`;
3. enter that known-good SHA;
4. workflow validates the SHA is in `master` history;
5. workflow rebuilds that source using the current production `REACT_APP_*` configuration;
6. workflow redeploys Firebase Hosting production;
7. manually validate production.

This is **source-SHA rollback**, not restoration of a historical build artifact.

If production Environment configuration has changed since the historical release, rebuilding the old source with current production variables may not produce byte-identical output to the original deployment.

Do not introduce historical artifact storage or artifact-promotion infrastructure during this task.

## README documentation

Update `README.md` to describe the completed release model.

Document:

- pull requests run frontend CI;
- merge to protected `master` automatically deploys the test frontend;
- test uses `https://wasabi-drive-test.web.app/`;
- test deployment uses GitHub OIDC -> Google WIF -> short-lived credentials;
- after validating the exact `master` SHA in test, production promotion is manual;
- production workflow requires a full 40-character tested `master` SHA;
- production uses GitHub Environment `prd`;
- production rebuilds the exact source SHA using production `REACT_APP_*` values;
- production and test are separate builds because Create React App embeds environment values at build time;
- production Google authentication uses WIF and a dedicated production deploy service account;
- no service-account JSON key or `FIREBASE_TOKEN` is stored;
- production deploys only Firebase Hosting to `wasabi-drive-e73cd`;
- production URL is `https://wasabi-drive-e73cd.web.app/`;
- `npm run deploy:test` and `npm run deploy:prd` remain manual fallback commands;
- rollback is performed by promoting a known-good full `master` SHA;
- rollback rebuilds with current production build-time configuration.

Do not document sensitive values or credentials.

## Expected source changes

Expected Task 6H-B changes are limited to:

- `.github/workflows/frontend-prd-deploy.yml`;
- `.github/copilot-instructions.md`;
- `README.md`.

No changes are expected to:

- application source under `src/`;
- tests;
- `package.json`;
- `package-lock.json`;
- `.firebaserc`;
- `firebase.json`;
- `.env.example`;
- MSAL configuration;
- `.gitignore`, assuming Task 6G credential hygiene is still present;
- the existing test deployment workflow.

If implementation appears to require any of those files, stop and report why rather than expanding scope automatically.

## Backend isolation

Do not modify the backend repository.

Do not modify:

- backend GitHub Actions;
- AWS IAM;
- Serverless Framework;
- API Gateway;
- Lambda;
- backend Bruno tests;
- backend health endpoint;
- backend configuration.

The backend production pipeline is complete for the current phase.

Frontend 6H-B must remain an independent frontend repository change.

## Branch and change management

Use branch:

`ci/frontend-prd-promotion`

Do not commit directly to `master`.

Keep this as one focused PR.

Do not perform unrelated cleanup.

Do not deploy production from the feature branch.

Do not deploy test manually from the feature branch.

## Local validation before commit

Run:

```bash
npm ci
npm run test:ci
npm run build
git diff --check
git status --short
```

For local build validation, use safe non-secret placeholder `REACT_APP_*` values if real environment values are not already available.

Do not use production cloud credentials for local validation.

Do not run:

```bash
npm run deploy:test
npm run deploy:prd
```

from the feature branch.

Do not invoke the production GitHub workflow until the PR is merged.

## Static workflow review

Before completion, confirm:

1. workflow trigger is `workflow_dispatch` only;
2. `source_sha` is required;
3. deployment job is restricted to dispatch from `master`;
4. GitHub Environment is `prd`;
5. Environment URL is `https://wasabi-drive-e73cd.web.app/`;
6. permissions are only `contents: read` and `id-token: write`;
7. production concurrency is serialized with `cancel-in-progress: false`;
8. checkout is pinned to the approved full SHA;
9. checkout uses `fetch-depth: 0`;
10. checkout uses `persist-credentials: false`;
11. source input must be a full 40-character SHA;
12. source SHA must resolve to a commit;
13. source SHA must be an ancestor of `origin/master`;
14. exact SHA is checked out detached;
15. checked-out SHA is verified;
16. Node.js 24 is used;
17. `npm ci` runs;
18. `npm run test:ci` runs before build/deploy;
19. production `REACT_APP_*` values come from GitHub Environment variables;
20. `npm run build` runs before Google authentication;
21. deployment context logs requested and verified source SHA;
22. traceability does not incorrectly use `${{ github.sha }}` as the promoted SHA;
23. Google auth uses the reviewed pinned action;
24. Google auth uses WIF provider variable;
25. Google auth uses dedicated service-account variable;
26. no Google credential secret is referenced;
27. no service-account JSON key is referenced;
28. no `FIREBASE_TOKEN` is referenced;
29. Firebase CLI is repository-local;
30. deploy is `--only hosting`;
31. deploy explicitly targets `wasabi-drive-e73cd`;
32. deploy is non-interactive;
33. deployment message uses the promoted input SHA/run ID;
34. no second React build runs after Google authentication;
35. existing automatic test deployment workflow is unchanged;
36. application source is unchanged;
37. MSAL configuration is unchanged;
38. package files are unchanged;
39. Firebase aliases/config are unchanged;
40. backend is untouched.

## First production workflow validation

Do not deploy from the feature branch.

After:

- PR CI passes;
- PR is reviewed;
- PR is merged to protected `master`;

the merge SHA will automatically run the existing frontend test deployment.

Then:

1. confirm the automatic test workflow succeeds;
2. validate `https://wasabi-drive-test.web.app/`;
3. verify Entra sign-in works;
4. verify the frontend calls the backend `test` API;
5. verify bucket/object navigation and existing application behavior;
6. copy the exact full 40-character tested `master` SHA;
7. manually run `Frontend Production Promotion` from `master`;
8. enter exactly that tested SHA;
9. verify SHA validation succeeds;
10. verify tests pass again;
11. verify the production build succeeds;
12. verify Google OIDC/WIF authentication succeeds;
13. verify the dedicated production service account is used;
14. verify Firebase deployment targets `wasabi-drive-e73cd`;
15. verify Hosting deployment succeeds;
16. validate `https://wasabi-drive-e73cd.web.app/`;
17. verify production Entra sign-in;
18. verify production API calls target the production backend;
19. verify bucket/object navigation and existing application behavior.

If Google/Firebase authorization fails, capture the exact error and stop.

Do not broaden IAM or add long-lived credentials as a workaround.

## Non-goals

Do not implement during Task 6H-B:

- backend changes;
- backend deployment changes;
- automatic production deployment on merge;
- automatic production deployment on push;
- production preview channels;
- Firebase Authentication;
- Firestore;
- Realtime Database;
- Cloud Functions;
- App Hosting;
- runtime frontend configuration;
- artifact repository/storage;
- byte-identical artifact promotion;
- custom domains;
- Entra redesign;
- MSAL redesign;
- frontend redesign;
- dependency upgrades;
- npm audit remediation;
- Create React App migration;
- Vite;
- TypeScript;
- CORS changes;
- unrelated cleanup.

## Completion report

When implementation is complete, stop and report:

- branch used;
- exact files changed;
- workflow filename/name;
- trigger conditions;
- `source_sha` input definition;
- master-only control;
- GitHub Environment and URL;
- GitHub token permissions;
- concurrency behavior;
- checkout action/pin and options;
- exact SHA-validation logic;
- Node version;
- `npm ci` result;
- `npm run test:ci` result and test count;
- production build result;
- confirmation build occurs before Google auth;
- Google auth action/pin;
- WIF provider variable referenced;
- deploy service-account variable referenced;
- confirmation no Google credential secret is used;
- confirmation no `FIREBASE_TOKEN` is used;
- Firebase deploy command;
- production project targeted;
- deployment traceability behavior;
- confirmation promoted source uses input/verified SHA rather than assuming `${{ github.sha }}`;
- README changes;
- confirmation existing test-deploy workflow is unchanged;
- confirmation `.firebaserc` is unchanged;
- confirmation `firebase.json` is unchanged;
- confirmation `package.json` and `package-lock.json` are unchanged;
- confirmation application source and tests are unchanged;
- confirmation MSAL configuration is unchanged;
- confirmation backend is untouched;
- `git diff --check` result;
- `git status --short` result;
- confirmation no feature-branch deployment occurred;
- any unexpected issue.

Do not commit unless explicitly instructed.

Do not continue beyond Task 6H-B.
