# Wasabi Drive SPA - Copilot Instructions

## Project status

Wasabi Drive is an existing production-working React SPA hosted on Firebase Hosting.

The structural refactor and pre-production Microsoft Entra/MSAL frontend hardening are complete in source.

Implemented:
- Microsoft Entra sign-in through MSAL;
- OAuth 2.0 access-token acquisition for the Wasabi Drive API;
- `Authorization: Bearer` API calls;
- fail-fast validation for required Entra build-time variables;
- safe handling of `401`, `403`, 5xx, and rejected-fetch/network failures;
- deliberate user-facing error state while preserving logout;
- removal of confirmed-unused legacy username/password/UUID frontend UI/state artifacts.

Verified against AWS `test` before the final hardening:
- trusted Entra user can browse buckets/folders/objects;
- valid but untrusted Entra user receives backend `403`;
- backend authentication/authorization behavior is established.

Production has not yet been cut over to Entra enforcement.

The current frontend objective is NOT further application refactoring. The immediate work is production build verification and controlled Firebase deployment as part of the compatibility-first identity cutover.

The developer is the technical owner and architectural decision-maker. Copilot assists implementation only when explicitly requested.

## Branch and repository safety

`master` is protected.

Never commit implementation changes directly to `master`.

The developer creates focused branches manually and uses Copilot Chat in the normal workspace. Work only in the current workspace and current branch. Do not create another branch or worktree unless explicitly instructed.

Do not modify this file unless explicitly authorized.

Avoid unrelated cleanup.

## Current frontend architecture

Preserve:
- React 18;
- JavaScript;
- Create React App / `react-scripts` 5;
- Firebase Hosting;
- `@azure/msal-browser` and `@azure/msal-react`;
- MSAL session-storage cache;
- no React Router;
- no Redux/global state framework;
- no custom OAuth implementation.

Identity flow:

React/MSAL
-> Microsoft Entra
-> OAuth 2.0 / OpenID Connect access token
-> Wasabi Drive API
-> backend authentication
-> backend trusted-user authorization
-> Wasabi.

MSAL = Microsoft Authentication Library.
OIDC = OpenID Connect.
PKCE = Proof Key for Code Exchange.

The browser is a public client and must never contain an Entra client secret.

## Backend is the security authority

The frontend does not authorize users.

Do not:
- decode access tokens for application authorization;
- inspect `oid` to determine trust;
- maintain a trusted-user allow-list;
- infer authorization from MSAL account presence;
- treat the browser-visible API key as user authentication.

The frontend obtains the token, calls the API, and presents backend outcomes.

## Entra configuration

Required Entra build-time variables:
- `REACT_APP_ENTRA_TENANT_ID`;
- `REACT_APP_ENTRA_CLIENT_ID`;
- `REACT_APP_ENTRA_API_SCOPE`.

`src/auth/msal-config.js` validates these before constructing MSAL configuration.

Missing/blank required values must fail clearly rather than constructing `login.microsoftonline.com/undefined`.

Create React App embeds `REACT_APP_*` values at dev-server/build time.

Do not implement runtime dotenv loading or stage-selection logic in browser code.

For current manual workflows:
- `.env.local` may be used for local development against AWS `test`;
- `.env.production.local` may be used for a manual production build;
- both remain untracked.

Before production deployment verify `REACT_APP_API_URL` points to the production API and the Entra tenant/client/scope values are the approved production values.

## API client and error behavior

`src/auth/api-client.js` is the authentication/network boundary.

It:
- attempts silent access-token acquisition;
- uses MSAL redirect when user interaction is required;
- adds `Authorization: Bearer <token>`;
- still sends transitional `X-Api-Key`;
- maps `401` to an authentication/session message;
- maps `403` to access denied;
- maps other non-success responses to a generic service error;
- maps rejected `fetch()` calls to a generic connectivity/service error.

Do not expose raw tokens, Object IDs, allow-list values, backend stack traces, or raw security payloads.

Do not redirect-loop on `403`.

Do not add Axios or another HTTP framework merely for networking.

## Transitional API key

`X-Api-Key` remains temporarily for production compatibility.

It is browser-visible and must not be treated as a secret or user authentication.

Do not remove it until production Entra cutover is stable and the backend/API Gateway usage-plan decision is handled as a separate task.

## Direct Wasabi object URLs

`src/components/main/File.jsx` constructs direct Wasabi object URLs.

This is established behavior and works from an unrestricted personal network.

A corporate network previously blocked those direct cloud-storage URLs; do not redesign object delivery solely for that employer-network restriction.

Whether object content itself must be private behind Entra is a separate explicit security/architecture decision. If the Wasabi objects are public-readable, API authentication protects discovery/listing but does not make the direct object URL private.

Do not silently introduce a proxy/CDN/presigned-URL redesign without an approved requirement.

## Testing gates

Run:
- `npm run test:ci`;
- `npm run build`.

Preserve focused tests for:
- MSAL startup/account behavior;
- Entra config fail-fast validation;
- silent token acquisition and interaction-required redirect;
- Authorization header behavior;
- `401`, `403`, and service/network error mapping;
- Home error rendering and logout availability.

Do not call live Microsoft Entra or the live API from unit tests.

Do not weaken tests merely to make changes pass.

## Production deployment safety

Do not deploy unless explicitly requested.

Firebase Hosting remains the deployment target.

Production rollout is compatibility-first:
1. run frontend tests/build locally;
2. build with verified production API URL and Entra values;
3. deploy frontend while production backend `ENTRA_AUTH_ENABLED=false`;
4. verify Microsoft sign-in and existing production browsing;
5. only then enable/deploy backend production Entra authentication + trusted-user authorization.

The frontend can send bearer tokens while the compatibility-mode backend does not yet require them.

Keep the current production release available for rollback until cutover is stable.

## Post-cutover deferred work

Do not opportunistically implement before production cutover:
- remove `X-Api-Key`;
- remove unused frontend `aws-sdk` dependency;
- migrate Create React App;
- upgrade React broadly;
- add React Router or Redux;
- redesign direct Wasabi object delivery;
- introduce CDN/proxy architecture;
- implement CI/CD.

CORS is controlled on the backend/API Gateway side and is not frontend authentication.

## CI/CD

CI/CD is not yet implemented.

Future direction may use GitHub Actions to run frontend tests/builds and deploy Firebase after controlled approval.

Do not implement CI/CD unless explicitly requested.

## Completion report

For every Copilot task report:
- current branch;
- commits created;
- files changed;
- behavior/configuration changed;
- test/build results;
- `git diff --check`;
- deployment performed, if explicitly authorized;
- confirmation no secret/token was committed;
- remaining issue directly relevant to the task;
- recommended next task.

Stop after the requested task.