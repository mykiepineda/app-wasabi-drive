# Wasabi Drive Frontend — GitHub Copilot Instructions

## Project role

Wasabi Drive is an existing production application and an incremental modernization project.

The developer is the technical owner and architectural decision-maker.

Copilot is an implementation assistant. Make only the explicitly requested change, preserve working behavior, and do not independently redesign the frontend, authentication model, deployment model, Firebase architecture, or backend integration.

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
- 6E — backend test-stage verification, including frontend-against-test validation, Bruno regression, and an unauthorized-access scenario;
- backend Serverless Framework version hardening after 6E.

The active task is:

**Task 6F — Stable frontend test deployment**

Do not start Task 6G Firebase CI authentication or Task 6H production promotion.

## Current frontend architecture

Preserve:

- React 18;
- Create React App / `react-scripts` 5;
- JavaScript;
- Microsoft Authentication Library (MSAL);
- Microsoft Entra authentication;
- Firebase Hosting;
- production Firebase Hosting already in use;
- frontend `REACT_APP_*` configuration embedded at build time.

Do not migrate frameworks or build tools in this task.

Do not introduce Firebase Authentication, Firestore, Realtime Database, Cloud Functions, App Hosting, or another hosting platform.

Firebase is used only for static frontend hosting here.

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

The backend remains the security authority.

Frontend state is not authorization.

CORS is not authentication.

Browser-visible configuration is not secret.

The following frontend values are public configuration and must not be treated as credentials:

- `REACT_APP_API_URL`;
- `REACT_APP_ENTRA_TENANT_ID`;
- `REACT_APP_ENTRA_CLIENT_ID`;
- `REACT_APP_ENTRA_API_SCOPE`.

Do not introduce a Microsoft Entra client secret into the SPA.

Do not introduce API keys as user authentication.

Do not weaken backend authentication or authorization for the test frontend.

## Task 6F objective

Create a stable non-production Firebase Hosting target for the frontend so that:

- the frontend can be deployed to a persistent `test` origin;
- the test frontend points to the existing backend `test` API;
- Microsoft Entra can register a stable SPA redirect URI for that origin;
- frontend test deployment has a repeatable local command;
- production Firebase configuration remains unchanged;
- Firebase deployment remains manual during 6F.

Task 6G will automate Firebase authentication/deployment later.

## Hosting strategy

Use a dedicated Firebase project for the frontend `test` environment.

Do not use a Firebase Hosting preview channel as the permanent test environment.

The stable test origin should use the dedicated project's live Hosting URL, normally:

`https://<TEST_FIREBASE_PROJECT_ID>.web.app`

Use the `.web.app` origin as the canonical test URL unless the technical owner explicitly chooses otherwise.

Do not create the Firebase project automatically from Copilot.

The technical owner will create or select the Firebase test project and provide its actual project ID.

## Required external input

Before implementation, the technical owner must provide:

`<TEST_FIREBASE_PROJECT_ID>`

Do not invent or guess this value.

If the prompt still contains `<TEST_FIREBASE_PROJECT_ID>`, stop and ask for the real project ID before modifying `.firebaserc`.

Do not run `firebase projects:create`.

Do not create or modify cloud resources automatically.

## Existing Firebase configuration

Inspect the latest `master` before editing.

The last reviewed state contained a production alias in `.firebaserc` similar to:

```json
{
  "projects": {
    "default": "wasabi-drive-e73cd",
    "prd": "wasabi-drive-e73cd"
  }
}
```

Treat the actual current repository as authoritative.

Do not alter the current production Firebase project mapping.

Do not change the existing `prd` alias.

Do not change `default` unless a concrete defect requires it and the technical owner approves.

Inspect `firebase.json`. Reuse the existing Hosting configuration if it is suitable for both environments.

Do not create separate Firebase Hosting configuration merely because the environment is different.

## Required source changes

Expected Task 6F changes are limited to:

- `.firebaserc`;
- `package.json`;
- `README.md` or the repository's existing deployment documentation;
- `.github/copilot-instructions.md` if this instruction file is being committed with the task.

Do not change `package-lock.json` unless `npm` changes it for a justified reason. No dependency should be added for this task.

### `.firebaserc`

Add a `test` Firebase project alias using the technical owner's actual test project ID.

Conceptually:

```json
{
  "projects": {
    "default": "<EXISTING_PRODUCTION_PROJECT>",
    "prd": "<EXISTING_PRODUCTION_PROJECT>",
    "test": "<TEST_FIREBASE_PROJECT_ID>"
  }
}
```

Preserve the existing production values exactly.

### `package.json`

Add a stable frontend test deployment command:

```json
"deploy:test": "npm run build && firebase deploy --only hosting --project test"
```

Preserve the existing production deployment command.

Do not add global Firebase CLI assumptions.

Use the repository-local Firebase CLI through the existing npm environment.

Do not add another package solely to load environment variables.

### Documentation

Document the frontend test deployment workflow.

The documentation must explain that `REACT_APP_*` variables are embedded at build time and therefore the correct test values must be present **before** `npm run deploy:test` starts.

The required test build values are:

- `REACT_APP_API_URL` — backend `test` API Gateway base URL;
- `REACT_APP_ENTRA_TENANT_ID`;
- `REACT_APP_ENTRA_CLIENT_ID`;
- `REACT_APP_ENTRA_API_SCOPE`.

Do not put credentials or secrets into frontend environment variables.

Document that the test Firebase project alias is:

`test`

and the test deployment command is:

```bash
npm run deploy:test
```

Document that the production deployment command remains separate and unchanged.

Do not commit developer-local environment files containing machine-specific values.

## Build-time configuration

Create React App embeds `REACT_APP_*` values into the static JavaScript bundle during `npm run build`.

Firebase Hosting does not inject or replace those values after the build has been produced.

Therefore:

- a test build must be built with test values;
- a production build must be built separately with production values;
- do not reuse a test `build/` directory for production;
- do not treat any `REACT_APP_*` value as a secret.

Do not add a runtime configuration service in this task.

Do not add a new dependency just to manage environment files.

## Microsoft Entra redirect URI

Inspect the current MSAL configuration and determine how `redirectUri` is derived.

Do not change the MSAL redirect behavior unless the new stable Firebase test origin cannot work with the existing design.

The technical owner will register the exact stable test redirect URI in the existing Microsoft Entra SPA application registration as required by the current MSAL configuration.

Expected canonical origin:

`https://<TEST_FIREBASE_PROJECT_ID>.web.app`

If the code uses `window.location.origin` as the redirect URI, the corresponding root URL must be registered as a **Single-page application (SPA)** redirect URI.

Do not add a new Entra application registration in this task.

Do not add client secrets.

Do not add authentication workarounds.

## Backend integration

The test frontend must use the existing deployed backend `test` API through:

`REACT_APP_API_URL`

Do not change backend source.

Do not change API Gateway.

Do not change backend CORS proactively.

If a real test deployment exposes a CORS defect, stop and report it for review rather than expanding this task automatically.

Do not point the test frontend at the production backend.

## Branch and Git strategy

`master` is the protected integration/release branch.

Use a focused branch:

`ci/frontend-test-hosting`

Do not commit implementation work directly to `master`.

Keep commits focused and reviewable.

Do not include unrelated UI cleanup, dependency updates, formatting changes, authentication changes, or refactoring.

## Pull-request CI

Preserve the existing frontend pull-request workflow.

It currently validates the frontend using Node.js 24 and safe non-secret placeholder `REACT_APP_*` values.

Do not modify the existing PR workflow unless a concrete defect is demonstrated.

Expected regression commands remain:

```bash
npm ci
npm run test:ci
npm run build
```

If local `npm run build` requires environment values, use the same safe non-secret placeholder values already established by the frontend PR workflow for feature-branch validation.

Do not alter source merely to satisfy a missing local environment variable.

## Deployment validation boundary

Do not deploy Firebase Hosting from the feature branch.

Before merge, validate:

```bash
npm ci
npm run test:ci
npm run build
git diff --check
git status --short
```

No cloud deployment should occur from the feature branch.

After the reviewed PR is merged to protected `master`, the technical owner may manually deploy the frontend test environment from a clean `master` checkout using actual test `REACT_APP_*` build values and:

```bash
npm run deploy:test
```

Firebase deployment automation belongs to Task 6G.

## Post-merge manual verification

After the first stable test frontend deployment, verify:

- the site loads from the canonical `https://<TEST_FIREBASE_PROJECT_ID>.web.app` URL;
- Microsoft Entra sign-in succeeds using the registered SPA redirect URI;
- the frontend calls the backend `test` API, not production;
- authenticated application features work;
- sign-out still works;
- protected backend operations still require a valid access token;
- browser-visible configuration contains no secrets;
- production Firebase Hosting was not modified.

Do not automate this verification as part of Task 6F unless explicitly requested.

## Non-goals

Do not implement during Task 6F:

- GitHub Actions Firebase deployment;
- Google Workload Identity Federation;
- Firebase service-account credentials;
- Task 6G;
- Task 6H production promotion;
- production deployment;
- Firebase preview channels as the permanent test environment;
- Firebase Authentication;
- Firestore;
- Realtime Database;
- Cloud Functions;
- App Hosting;
- custom domains;
- Create React App migration;
- Vite migration;
- TypeScript;
- frontend redesign;
- MSAL redesign;
- backend changes;
- CORS changes without demonstrated failure;
- dependency upgrades;
- vulnerability remediation;
- unrelated cleanup.

## Validation report

When implementation is complete, stop and report:

- branch used;
- Firebase test project ID supplied by the technical owner;
- exact files changed;
- `.firebaserc` aliases before and after;
- `deploy:test` script added;
- confirmation that `deploy:prd` was preserved;
- confirmation that `firebase.json` was unchanged unless a concrete reason required a change;
- documentation added for build-time test configuration;
- MSAL redirect URI behavior discovered from the source;
- `npm ci` result;
- `npm run test:ci` result and test count;
- `npm run build` result;
- `git diff --check` result;
- `git status --short` result;
- confirmation that no dependency was added;
- confirmation that no feature-branch Firebase deployment occurred;
- confirmation that production was not modified;
- confirmation that Task 6G and Task 6H were not started.

Do not continue beyond Task 6F.