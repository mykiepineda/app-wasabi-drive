# Wasabi Drive SPA - Copilot Instructions

## Project status

Wasabi Drive is an existing production React SPA hosted on Firebase Hosting.

The Microsoft Entra identity migration is now live in production.

Verified production behavior:

- Microsoft Entra sign-in through MSAL works;
- the SPA obtains an OAuth 2.0 access token for the Wasabi Drive API;
- the production backend validates the bearer token;
- trusted-user authorization is enforced by the backend;
- no Authorization header -> `401`;
- valid trusted bearer token without an API key -> `200`;
- API Gateway no longer requires an API key for the protected application path;
- the production SPA continues to browse buckets/folders/objects successfully;
- logout works and returns the user to the sign-in page.

The API key is no longer part of the production security boundary.

The immediate frontend task is:

**remove the obsolete transitional `X-Api-Key` header and
`REACT_APP_API_KEY` configuration.**

Do not broaden that task into unrelated frontend modernization.

The developer is the technical owner and architectural decision-maker.
Copilot assists implementation only.

## Branch and repository safety

`master` is the protected integration/release branch.

Never commit implementation changes directly to `master`.

The developer creates the task branch manually and uses Copilot Chat in the
normal workspace.

Work only in the current workspace and current Git branch.

Do not create another branch or worktree unless explicitly instructed.

Do not modify this instruction file unless the task explicitly authorizes it.

Keep commits focused and reviewable.

Avoid unrelated cleanup, formatting, dependency upgrades, or architecture
changes.

Stop when the requested task is complete.

## Current frontend architecture

Preserve:

- React 18;
- JavaScript;
- Create React App / `react-scripts` 5;
- Firebase Hosting;
- `@azure/msal-browser`;
- `@azure/msal-react`;
- MSAL session-storage cache;
- no React Router;
- no Redux/global state framework;
- no custom OAuth implementation.

Current identity flow:

React/MSAL
-> Microsoft Entra
-> OAuth 2.0 / OpenID Connect access token
-> API Gateway REST API
-> Express authentication
-> backend trusted-user authorization
-> Wasabi.

MSAL = Microsoft Authentication Library.

OIDC = OpenID Connect.

PKCE = Proof Key for Code Exchange. MSAL uses the authorization-code flow with
PKCE for the browser client.

The browser is a public client and must never contain an Entra client secret.

## Backend is the security authority

The frontend does not authorize users.

Do not:

- decode access tokens for application authorization;
- inspect `oid` to decide whether a user is trusted;
- maintain a trusted-user allow-list;
- infer authorization from frontend state;
- introduce another browser credential as an authorization substitute.

The frontend obtains an access token, sends it to the API, and presents the
backend result.

## Entra configuration

Required Entra build-time variables:

- `REACT_APP_ENTRA_TENANT_ID`;
- `REACT_APP_ENTRA_CLIENT_ID`;
- `REACT_APP_ENTRA_API_SCOPE`.

`src/auth/msal-config.js` validates required Entra configuration before MSAL is
constructed.

Missing or blank required Entra values must fail clearly rather than building
an invalid Microsoft authority such as
`login.microsoftonline.com/undefined`.

Create React App embeds `REACT_APP_*` values at development-server/build time.

Do not introduce runtime dotenv loading or custom stage-selection logic in
browser code.

The API base URL remains build-time configuration through
`REACT_APP_API_URL`.

`REACT_APP_API_KEY` is obsolete and should be removed as part of the current
cleanup task.

## API client

`src/auth/api-client.js` is the authentication/network boundary.

It currently:

- attempts silent access-token acquisition;
- uses MSAL redirect when user interaction is required;
- sends `Authorization: Bearer <access-token>`;
- maps `401` to a safe authentication/session error;
- maps `403` to a safe access-denied error;
- maps other non-success responses to a generic service error;
- maps rejected `fetch()` calls to a generic connectivity/service error.

After the current cleanup, the authenticated API request must use the bearer
token only.

Do not remove or weaken the `Authorization` header.

Do not change token acquisition or token caching.

Do not expose raw access tokens, Object IDs, allow-list values, backend stack
traces, or raw security error payloads.

Do not redirect-loop on `403`.

Do not add Axios or another HTTP framework.

## API-key migration status

The transitional API-key migration is complete.

Production has been verified with:

- no API key + no bearer token -> backend `401`;
- valid trusted bearer token + no API key -> `200`.

Therefore:

- `X-Api-Key` is no longer required;
- `REACT_APP_API_KEY` is no longer required;
- frontend API-key-specific tests/configuration are obsolete;
- do not reintroduce API-key authentication or compatibility code.

Removal of API Gateway usage-plan/API-key resources is a separate
infrastructure cleanup task and must not be performed from the frontend
repository.

## API error behavior

Preserve deliberate status handling:

- `401` -> authentication/session message;
- `403` -> signed-in but not authorized message;
- `5xx` and other non-success statuses -> generic service error;
- rejected `fetch()` / network failure -> generic connectivity/service error.

A `403` must not trigger a login loop.

A `5xx`/network failure must not be presented as an authorization failure.

The UI must not expose raw backend or Microsoft authentication internals.

## Direct Wasabi object URLs

`src/components/main/File.jsx` currently opens direct Wasabi object URLs.

This behavior is established and is not part of the API-key cleanup.

A corporate network previously blocked those direct storage URLs. Do not
redesign object delivery merely for that external network restriction.

Whether Wasabi objects themselves must be private behind Entra is a separate
explicit security/architecture decision.

Do not introduce a proxy, CDN, or presigned-URL design unless separately
approved.

## Testing gates

Run:

- `npm run test:ci`;
- `npm run build`;
- `git diff --check`.

Tests must be deterministic and must not depend on a developer's local `.env`
values.

Preserve focused tests for:

- MSAL startup/account behavior;
- Entra configuration fail-fast validation;
- silent token acquisition;
- interaction-required redirect behavior;
- bearer `Authorization` header behavior;
- caller-provided request headers/options;
- `401`, `403`, service, and network error mapping;
- Home error rendering;
- logout availability.

For the API-key cleanup, update/remove tests whose only purpose was proving
`X-Api-Key` compatibility.

Add/retain a focused assertion that authenticated API calls contain the bearer
`Authorization` header and do not contain `X-Api-Key`.

Do not call live Entra or the live backend from unit tests.

Do not weaken tests merely to make changes pass.

## Production deployment safety

Do not deploy unless the task explicitly authorizes deployment.

Firebase Hosting remains the frontend deployment target.

For a production build, verify:

- `REACT_APP_API_URL` is the production API;
- `REACT_APP_ENTRA_TENANT_ID` is correct;
- `REACT_APP_ENTRA_CLIENT_ID` is correct;
- `REACT_APP_ENTRA_API_SCOPE` is correct;
- `REACT_APP_API_KEY` is absent after this cleanup.

The backend production security boundary is now Entra authentication plus
trusted-user authorization.

The frontend must not add a replacement API-key-like credential.

## Secrets

Tracked files must never contain:

- bearer/access tokens;
- API keys;
- Entra client secrets;
- Wasabi credentials;
- AWS credentials;
- Firebase service-account credentials;
- passwords/private keys.

Entra tenant IDs, application/client IDs, and API scope identifiers are public
identifiers rather than passwords, but environment-specific values should
remain in the appropriate build configuration rather than being scattered
through source.

Do not print or persist access tokens.

## Deferred frontend work

Do not opportunistically implement during API-key cleanup:

- Create React App migration;
- React upgrade;
- React Router;
- Redux/global state;
- direct-object privacy redesign;
- CDN/proxy work;
- CI/CD;
- broad dependency upgrades;
- visual redesign.

Unused dependency cleanup may be considered later as a separate task.

## Post-cutover direction

After the API-key frontend cleanup is deployed and verified, likely subsequent
project work includes:

- backend physical removal of legacy MongoDB/bcrypt/UUID authentication;
- obsolete API Gateway API-key/usage-plan infrastructure cleanup if unused;
- CORS hardening through Infrastructure as Code;
- decision on private versus public-by-link Wasabi object access;
- CI/CD;
- AWS SDK v3 and other deferred technical debt.

Do not implement those from the current frontend cleanup task.

## Refactoring discipline

For every task:

1. read this file in full;
2. inspect the relevant current source/tests before editing;
3. make the smallest approved change;
4. preserve unrelated behavior;
5. avoid unrelated cleanup;
6. keep the diff reviewable;
7. run the required tests/build;
8. inspect the complete diff;
9. stop when the task is complete.

## Completion report

Report:

- current branch;
- commits created;
- files changed;
- runtime behavior changed;
- configuration removed;
- tests updated;
- `npm run test:ci` result;
- `npm run build` result;
- `git diff --check` result;
- confirmation no API key/token/secret was committed;
- confirmation no deployment occurred unless explicitly authorized;
- any remaining issue directly relevant to the task;
- recommended next task.

Do not automatically start the recommended next task.