# Wasabi Drive SPA - Copilot Instructions

## Project status

Wasabi Drive is an existing production React single-page application (SPA) hosted on Firebase Hosting.

The following modernization work is complete and production-validated:

- Microsoft Entra authentication through MSAL;
- OAuth 2.0 bearer access tokens for the Wasabi Drive API;
- backend access-token validation;
- backend trusted-user authorization;
- removal of API Gateway API-key authentication and `X-Api-Key`;
- removal of legacy MongoDB/bcrypt/UUID authentication;
- AWS SDK for JavaScript v3 migration in the backend;
- private Wasabi buckets/objects;
- backend-issued short-lived presigned `AccessUrl` values;
- frontend consumption of backend-provided `AccessUrl` values.

The current modernization phase is:

**Phase 5 - Browse Correctness and Pagination Scalability**

The immediate frontend task is:

**Task 5B - Frontend cursor pagination**

Do not broaden Task 5B into unrelated frontend modernization.

The developer is the technical owner and architectural decision-maker.
Copilot assists implementation only.

## Task 5B objective

Remove the frontend's dependency on exact `TotalKeyCount` values for normal bucket/folder browsing.

Use native cursor-based pagination based on:

- backend `NextContinuationToken`;
- backend `IsTruncated`;
- locally stored history of continuation tokens previously used to retrieve pages.

A **cursor** is the opaque continuation token supplied by S3/Wasabi that identifies where the next listing page begins.

The backend still returns `TotalKeyCount` during Task 5B for compatibility, but the new frontend must not require or use it for pagination decisions.

The frontend must continue to work after a later backend task removes `TotalKeyCount` entirely.

## Branch and repository safety

`master` is the protected integration/release branch.

Never commit implementation changes directly to `master`.

The intended branch for Task 5B is:

`refactor/cursor-pagination`

The developer creates the task branch manually and uses Copilot Chat in the normal workspace.

Work only in the current workspace and current Git branch.

Do not create another branch or worktree unless explicitly instructed.

Do not modify this instruction file unless the current task explicitly authorizes it.

Keep commits focused and reviewable.

Avoid unrelated cleanup, formatting, dependency upgrades, or architecture changes.

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
- no Redux or other added global-state framework;
- no custom OAuth implementation.

Current identity and API flow:

React/MSAL
-> Microsoft Entra
-> OAuth 2.0 / OpenID Connect access token
-> API Gateway REST API
-> Express authentication
-> backend trusted-user authorization
-> backend application/service layer
-> Wasabi.

MSAL = Microsoft Authentication Library. It handles Microsoft Entra browser authentication and token acquisition.

OIDC = OpenID Connect. It is the identity layer used alongside OAuth 2.0.

PKCE = Proof Key for Code Exchange. MSAL uses the authorization-code flow with PKCE for the browser client so the SPA does not require a client secret.

The browser is a public client and must never contain an Entra client secret.

## Backend remains the security authority

The frontend does not authorize users.

Do not:

- decode access tokens for application authorization;
- inspect Entra Object IDs to decide whether a user is trusted;
- maintain a trusted-user allow-list;
- infer authorization from frontend state;
- introduce another browser credential as an authorization substitute.

The frontend obtains an access token, sends it to the API, and presents the backend result.

## Security invariants

Never weaken:

- mandatory Microsoft Entra authentication;
- backend trusted-user authorization;
- private Wasabi objects;
- server-side Wasabi credentials;
- backend-generated temporary `AccessUrl` values;
- absence of API-key authentication.

A pagination change must not create an unauthenticated fallback, a raw-object fallback, or a public Wasabi URL fallback.

## Entra and API configuration

Required build-time variables include:

- `REACT_APP_API_URL`;
- `REACT_APP_ENTRA_TENANT_ID`;
- `REACT_APP_ENTRA_CLIENT_ID`;
- `REACT_APP_ENTRA_API_SCOPE`.

`src/auth/msal-config.js` validates required Entra configuration before MSAL is constructed.

Missing or blank required Entra values must fail clearly rather than building an invalid Microsoft authority.

Create React App embeds `REACT_APP_*` values at development-server/build time.

Do not introduce runtime dotenv loading or custom stage-selection logic in browser code.

API keys must not be reintroduced.

## API client boundary

`src/auth/api-client.js` is the authentication/network boundary for calls to the Wasabi Drive backend.

Preserve its current behavior:

- attempts silent access-token acquisition;
- uses MSAL redirect when user interaction is required;
- sends `Authorization: Bearer <access-token>`;
- preserves caller-provided request headers/options;
- maps `401` to a safe authentication/session error;
- maps `403` to a safe access-denied error;
- maps other non-success responses to a generic service error;
- maps rejected `fetch()` calls to a generic connectivity/service error.

Do not change token acquisition, caching, or error semantics during Task 5B.

Do not expose raw access tokens, Object IDs, backend stack traces, or raw security error payloads.

Do not redirect-loop on `403`.

Do not add Axios or another HTTP framework.

## Backend-authorized object access

The backend adds `AccessUrl` to each object returned in authenticated object-list responses.

`AccessUrl` is a short-lived Wasabi presigned GET URL generated only after the request has passed backend Entra authentication and trusted-user authorization.

A presigned URL is a cryptographically signed temporary URL granting a specific storage operation for a limited time.

The complete `AccessUrl` is a temporary bearer capability:

- anyone possessing an unexpired URL can use the granted GET operation;
- it is expected to be visible to the browser and Developer Tools;
- it is not a permanent secret like a Wasabi access key;
- do not deliberately log, persist, or expose it outside the current UI flow.

Preserve the existing data flow:

backend `Contents[].AccessUrl`
-> `Home.jsx` file view model
-> `Files.jsx`
-> `File.jsx`
-> image/video/object link.

Treat `AccessUrl` as opaque.

Do not:

- parse it;
- rebuild it;
- append query parameters;
- decode/re-encode it;
- generate it in the browser;
- attach the Entra bearer token to the direct Wasabi request;
- construct raw public Wasabi URLs as a fallback.

## Task 5B cursor model

Continuation tokens are opaque values.

Do not:

- parse them;
- infer structure from them;
- alter them;
- assume their character contents;
- manually interpolate them into URLs.

Use normal URL/query encoding, preferably `URL` and/or `URLSearchParams` where practical.

Conceptually, locally stored page history should represent the continuation token used to retrieve each visited page:

- page 1: no continuation token;
- page 2: page 1's `NextContinuationToken`;
- page 3: page 2's `NextContinuationToken`;
- and so on.

For forward navigation:

- use the current response's `NextContinuationToken`;
- only allow Next when continuation metadata indicates another page exists;
- primarily use `IsTruncated` together with the presence of a usable `NextContinuationToken`.

For backward navigation:

- use locally stored history;
- retrieve the token that was used to obtain the previous visited page;
- do not try to derive a previous token from the current token.

Do not calculate total page count.

Do not use `TotalKeyCount` to decide whether Next or Previous is available.

Do not scan or prefetch the full folder.

## Pagination state

Keep the current pagination/context architecture unless a very small change is required for Task 5B.

Do not introduce Redux, React Query, Zustand, or another state-management framework.

Remove pagination dependence on `totalKeyCount`.

Correct direct mutation of pagination context/state where it directly participates in this task.

In particular, `ObjectsPerPage` must not assign directly to context state such as:

`paginationCtx.maxKeys = ...`

Changing Objects Per Page must:

- update state immutably;
- reset cursor history to page 1;
- fetch using the newly selected page size;
- not reuse a continuation token created for a different page size.

Entering another bucket or folder must also reset cursor history to page 1.

Do not use Task 5B to broadly rewrite unrelated React state code.

## Query and prefix encoding

Continuation-token query values must be safely encoded through normal URL/query APIs.

Do not manually build:

`&ContinuationToken=${token}`

Prefixes must also be handled safely.

Prefixes may contain spaces, Unicode, `%`, `#`, `?`, and other URL-sensitive characters.

The backend route represents folder hierarchy through `/` separators in the prefix path.

Safely encode prefix path components while preserving the logical `/` separators needed by the backend route.

Do not change the backend API shape during Task 5B.

Do not alter or re-encode backend-provided `AccessUrl` values when solving prefix/token URL handling.

## Relevant component boundaries

Inspect the current implementation before editing, especially:

- `src/pages/Home.jsx`;
- `src/store/pagination-context.js`;
- `src/components/main/pagination/Pagination.jsx`;
- `src/components/main/pagination/ObjectsPerPage.jsx`;
- existing Home/pagination tests;
- existing authentication/API-client tests;
- existing `AccessUrl` tests.

`Home.jsx` currently owns the backend listing request and file-view-model mapping. Preserve that responsibility unless a narrowly scoped change is clearly necessary.

Pagination components should consume pagination state/actions rather than mutate shared state directly.

Do not move authentication logic into pagination or file-rendering components.

## Display behavior

Preserve the current visual design as much as practical.

The frontend must no longer require an exact total.

A display such as:

`Viewing 1-10 of 18,437`

may become:

`Viewing 1-10`

and later pages may show ranges such as:

`Viewing 11-20`

No total-page count is required.

Do not add numbered page navigation.

Do not redesign the pagination UI.

## Required compatibility behavior

The new frontend must remain compatible with the current backend while the backend still returns `TotalKeyCount`.

The frontend must also be able to browse correctly if `TotalKeyCount` is omitted entirely from the response.

This compatibility is required before the later backend Task 5C removes full-list total counting.

Do not implement Task 5C in the frontend repository.

## Testing requirements

Before changing code, establish the current frontend baseline with:

`npm run test:ci`

Preserve existing tests for:

- MSAL startup/account behavior;
- Entra configuration fail-fast validation;
- silent token acquisition;
- interaction-required redirect behavior;
- bearer `Authorization` header behavior;
- caller-provided request headers/options;
- absence of `X-Api-Key`;
- `401`, `403`, service, and network error mapping;
- Home error rendering;
- logout availability;
- backend `AccessUrl` propagation;
- file links/images/video using `AccessUrl`;
- absence of raw public Wasabi URL fallback.

Task 5B should add or update focused regression coverage demonstrating at minimum that:

1. object browsing works when the backend response contains no `TotalKeyCount` property;
2. first-page requests do not include a continuation token;
3. Next uses the backend's `NextContinuationToken`;
4. `IsTruncated: false` prevents/disables Next navigation;
5. Previous navigation uses the locally stored continuation token for the previous page;
6. opaque continuation tokens containing URL-sensitive characters are safely encoded and logically preserved as query values;
7. prefixes containing URL-sensitive characters are safely constructed;
8. changing Objects Per Page updates state immutably and resets pagination to page 1;
9. entering a different bucket/folder resets cursor history to page 1;
10. existing `AccessUrl` behavior remains intact;
11. existing authentication and error behavior remains intact.

Tests must be deterministic.

Do not call live Entra, the live backend, Firebase, or Wasabi from unit tests.

Use fake continuation tokens, prefixes, and signed URLs in tests.

Do not weaken or delete existing tests merely to make the change pass.

## Required completion gates

Run:

- `npm run test:ci`;
- `npm run build`;
- `git diff --check`.

Do not deploy unless the developer explicitly requests deployment.

## Deployment safety

Firebase Hosting remains the frontend deployment target.

Task 5B is intentionally designed to be deployed before backend Task 5C.

The new frontend must work against the existing backend response even while `TotalKeyCount` is still present.

Do not require an atomic frontend/backend deployment.

Do not change Wasabi bucket/object privacy as part of Task 5B.

Do not change backend infrastructure, API Gateway, Serverless Framework, CloudFormation, or Wasabi configuration from the frontend repository.

## Secrets and sensitive values

Tracked files must never contain:

- bearer/access tokens;
- complete real presigned URLs;
- API keys;
- Entra client secrets;
- Wasabi credentials;
- AWS credentials;
- Firebase service-account credentials;
- passwords/private keys.

Entra tenant IDs, application/client IDs, and API scope identifiers are public identifiers rather than passwords, but environment-specific values should remain in appropriate build configuration rather than being scattered through source.

Do not print or persist access tokens.

Do not persist presigned `AccessUrl` values to localStorage/sessionStorage.

Do not persist continuation-token history beyond the in-memory UI state required for the current browsing session unless explicitly approved in a later task.

## Phase 5B non-goals

Do not implement during Task 5B:

- Microsoft Entra/MSAL architecture changes;
- trusted-user authorization changes;
- API-key authentication;
- private-object security changes;
- presigned URL architecture changes;
- backend Task 5C / `TotalKeyCount` removal;
- thumbnail generation;
- SNS/SQS/Lambda image processing;
- CI/CD;
- CORS tightening;
- Create React App migration;
- React upgrade;
- React Router;
- Redux, React Query, or another new state framework;
- UI redesign;
- previous/next image viewer;
- API Gateway migration;
- Lambda authorizers;
- database introduction;
- broad error-handling refactoring;
- broad observability work;
- broad dependency cleanup;
- accessibility redesign;
- Kong evaluation.

The direct `aws-sdk` package currently listed in frontend dependencies appears unused by application source. Do not remove it during Task 5B unless the task is explicitly expanded; dependency cleanup is a separate reviewable maintenance change.

## Refactoring discipline

For every task:

1. read this file in full;
2. inspect the relevant current source and tests before editing;
3. establish the requested test baseline;
4. make the smallest approved change;
5. preserve unrelated behavior;
6. avoid unrelated cleanup;
7. keep the diff reviewable;
8. run the required tests/build;
9. inspect the complete diff;
10. stop when the requested task is complete.

Do not automatically start the next task.

## Task 5B completion report

Report:

- current branch;
- commits created, if any;
- files changed;
- previous pagination behavior;
- new cursor-history model;
- how Next works;
- how Previous works;
- how bucket/folder changes reset pagination;
- how page-size changes reset pagination;
- how continuation tokens are encoded;
- how prefixes are encoded;
- confirmation that `TotalKeyCount` is no longer required by frontend pagination;
- confirmation browsing still works if `TotalKeyCount` is absent;
- tests added/updated;
- baseline `npm run test:ci` result;
- final `npm run test:ci` result;
- `npm run build` result;
- `git diff --check` result;
- confirmation MSAL/token behavior was unchanged;
- confirmation no API key was reintroduced;
- confirmation `AccessUrl` behavior was unchanged;
- confirmation there is no raw public Wasabi URL fallback;
- confirmation no complete real signed URL/token/secret was committed;
- confirmation no deployment occurred unless explicitly authorized;
- any compatibility concern or issue requiring developer review.

Do not continue to backend Task 5C.