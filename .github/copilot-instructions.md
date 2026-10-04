# Wasabi Drive Frontend — GitHub Copilot Instructions

## Project role

Wasabi Drive is an existing production application and an incremental modernization / cloud-engineering learning project.

The developer is the technical owner and architectural decision-maker.

Copilot is an implementation assistant. Make only the explicitly requested change, preserve working behavior, and do not independently redesign the frontend, authentication model, backend contract, Firebase deployment model, or release process.

Prefer focused, reviewable changes over broad cleanup.

## Current phase

Current modernization phase:

**Phase 7 — Production Reliability and Observability**

Backend Tasks 7A and 7B are complete and production-validated. Automated CloudWatch alarms from Task 7C are deliberately deferred because the current two-user application does not justify additional AWS cost/maintenance.

The active frontend task is:

**Task 7D — Frontend reliability cleanup**

Do not continue into Task 7E or another modernization phase unless explicitly instructed.

## Authoritative frontend baseline

Treat the latest `master` source as authoritative.

The reviewed frontend baseline for Task 7D is commit:

`2935fadfc22b9c58b4e47dcafcc451b593fe588c`

Before implementation, verify the actual working clone and report its starting SHA. If `master` has advanced, use the newer `master` source and preserve any newer approved behavior.

## Stable architecture to preserve

Frontend:

- React 18;
- Create React App / `react-scripts` 5;
- JavaScript;
- Firebase Hosting;
- separate Firebase `test` and production projects;
- Microsoft Authentication Library (MSAL);
- Microsoft Entra authentication;
- OAuth 2.0 / OpenID Connect access-token flow;
- bearer API access token;
- cursor-based bucket/folder pagination;
- backend-generated short-lived `AccessUrl` values for private Wasabi objects;
- explicit `401`, `403`, service-error, and network-error handling.

Preserve the existing backend contract and deployment architecture.

Do not introduce:

- Redux;
- React Query / TanStack Query;
- another state-management framework;
- TypeScript;
- Vite or another Create React App replacement;
- React major-version upgrades;
- Firebase Authentication;
- Firestore;
- Realtime Database;
- Cloud Functions;
- another hosting platform.

## Security and identity invariants

Preserve:

React SPA
-> MSAL
-> Microsoft Entra
-> OAuth 2.0 / OpenID Connect access token
-> API Gateway
-> Express backend authentication
-> application authorization
-> Wasabi.

MSAL = Microsoft Authentication Library.

OIDC = OpenID Connect.

The backend remains the security authority.

Frontend state is not authorization.

CORS is not authentication.

Browser-visible frontend configuration is not secret.

Never introduce:

- a Microsoft Entra client secret into the SPA;
- API keys as user authentication;
- Wasabi credentials into the browser;
- raw/public Wasabi object URLs;
- client-side authorization as a substitute for backend enforcement.

Do not log or expose bearer tokens or presigned URL query values.

## Completed frontend behavior to preserve

### Authentication and API access

Preserve:

- MSAL token acquisition;
- bearer-token API calls;
- safe handling of `401 Unauthorized`;
- safe handling of `403 Forbidden`;
- service/network error messaging;
- redirect-based token acquisition behavior.

Do not modify the Entra/MSAL architecture during Task 7D.

### Private object access

Preserve backend-generated `AccessUrl` values.

The frontend must continue to use the backend-provided `AccessUrl` for private objects and must not construct Wasabi object URLs itself.

### Cursor pagination

Phase 5 cursor pagination is complete and production-proven.

Preserve:

- opaque continuation-token handling;
- safe query encoding;
- page history behavior;
- previous/next navigation;
- page-size reset behavior;
- folder navigation reset behavior;
- no `TotalKeyCount` traversal or full-list reconstruction.

Do not redesign pagination while fixing stale requests.

## Phase 6 CI/CD is complete

Preserve all existing frontend workflows unless explicitly instructed otherwise:

- `.github/workflows/frontend-pr-checks.yml`;
- `.github/workflows/frontend-test-deploy.yml`;
- `.github/workflows/frontend-prd-deploy.yml`.

Do not change:

- pinned GitHub Action SHAs;
- Node.js 24;
- Google Workload Identity Federation;
- test or production identities;
- Firebase project targeting;
- production manual workflow dispatch;
- exact-SHA production promotion;
- detached production checkout / SHA verification;
- build-time `REACT_APP_*` configuration behavior.

Task 7D does not require workflow changes.

## Task 7D objective

Correct two concrete frontend reliability defects without broadly refactoring `Home.jsx`:

1. prevent an older asynchronous browse request from overwriting state after a newer navigation/request has started;
2. stop mutating breadcrumb React state.

The current source has both defects:

- `Home.jsx` performs asynchronous bucket/region/object requests without effect cancellation or stale-result protection;
- `breadcrumbsReducer` uses `splice()` on the existing state array when navigating back to an existing breadcrumb.

## Required stale-request behavior

Use `AbortController` as the primary mechanism.

The `useEffect` responsible for browsing should create one controller for that effect execution and abort it from the effect cleanup.

Pass the controller's `signal` through every API call started by that effect, including:

- bucket listing;
- bucket-region lookup;
- object listing.

`authenticatedFetch` already forwards caller options to `fetch`. Preserve that behavior and use it for `signal` propagation.

### Important cancellation rule

The current `authenticatedFetch` converts every rejected `fetch()` into `ApiRequestError("service")`. That would incorrectly turn intentional `AbortController` cancellation into a user-visible service error.

Modify `authenticatedFetch` narrowly so that a rejected fetch whose error has `name === "AbortError"` is rethrown unchanged. Continue converting other fetch/network failures to the existing service `ApiRequestError`.

Do not change existing `401`, `403`, or other HTTP error categorization.

### Stale-result guard

Do not rely only on native `fetch` honoring abort.

After awaited asynchronous boundaries, ensure an effect whose signal has already been aborted does not apply state updates. This protects against late promises/mocks and prevents old requests from changing:

- contents;
- pagination state;
- bucket/region context;
- error state;
- loading state.

An intentional abort must not:

- show the service/network error message;
- clear the newer request's contents;
- clear the newer request's loading state;
- overwrite newer pagination/navigation results.

Keep this implementation local to the existing effect; do not add a request manager, global store, sequence-number framework, or data-fetching library.

## Required breadcrumb behavior

Replace mutation of the existing breadcrumb array with an immutable update.

When an existing breadcrumb is selected, return a new array containing the required prefix. `slice()` is appropriate; `splice()` is not.

Preserve breadcrumb semantics and ordering.

A small named export of the existing `breadcrumbsReducer` from `Home.jsx` is permitted only if needed for a direct focused immutability test. Do not extract `Home` into new architectural layers merely for testing.

## Expected files/areas

Inspect current source before editing. Likely Task 7D files are:

- `src/pages/Home.jsx`;
- `src/auth/api-client.js`;
- `src/pages/Home.pagination.test.js` and/or `src/pages/Home.test.js`;
- `src/auth/api-client.test.js`.

Add another narrowly scoped test file only if it makes the reliability behavior clearer.

Do not modify package/dependency manifests for Task 7D.

## Required tests

Preserve all existing tests.

Add focused coverage proving at least:

1. a late/stale request cannot replace the result of a newer navigation request;
2. an aborted request does not produce the existing service/network error UI;
3. stale request cleanup does not clear a newer request's loading/content state;
4. `authenticatedFetch` rethrows `AbortError` rather than converting it to `ApiRequestError("service")`;
5. ordinary rejected fetch/network failures still become the existing service `ApiRequestError`;
6. breadcrumb reduction does not mutate the input state array and preserves expected breadcrumb output;
7. existing cursor pagination behavior continues to pass.

Where practical, use deferred promises in tests to control completion order and prove that an older request resolving after a newer request cannot win.

Known React `act(...)` warnings may be corrected only where directly caused by tests touched for this task. Do not turn Task 7D into broad test cleanup.

Run:

`npm run test:ci`

`npm run build`

Also run:

`git diff --check`

Do not weaken tests simply to make the implementation pass.

## Task 7D non-goals

Do NOT during Task 7D:

- remove `aws-sdk` from the frontend; that is Task 7E;
- upgrade dependencies;
- run `npm audit fix` or `npm audit fix --force`;
- migrate Create React App;
- upgrade React;
- introduce TypeScript;
- redesign components or UI;
- broadly decompose `Home.jsx`;
- change pagination semantics;
- change `AccessUrl` behavior;
- change MSAL/Entra;
- change Firebase configuration;
- change GitHub Actions workflows;
- change backend APIs;
- implement media thumbnails/viewers;
- start Phase 8.

## Git/change-management

`master` is protected.

Task 7D belongs on:

`fix/frontend-request-races`

Do not commit directly to `master`.

Keep changes focused and reviewable. Avoid unrelated formatting or cleanup.

Suggested focused commits, if useful:

- `fix(frontend): prevent stale browse request updates`
- `fix(frontend): make breadcrumb updates immutable`
- `test(frontend): cover request cancellation and breadcrumb state`

Do not force commit splitting if a different small cohesive structure is clearer.

Do not commit, push, merge, or deploy unless explicitly instructed.

## Completion report

When finished, report:

- branch name;
- starting/base SHA;
- files changed;
- exact cancellation/stale-result approach;
- how `AbortError` is distinguished from a real network failure;
- confirmation that loading/error state cannot be cleared by an older aborted effect;
- breadcrumb immutability change;
- tests added;
- exact `npm run test:ci` result and test counts;
- exact `npm run build` result;
- `git diff --check` result;
- `git status --short`;
- confirmation that package files, workflows, MSAL/Entra architecture, cursor pagination, `AccessUrl`, and UI behavior remain unchanged;
- any remaining issues or risks.

Stop after Task 7D. Do not automatically continue to Task 7E.
