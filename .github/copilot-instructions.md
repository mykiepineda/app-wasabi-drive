# Wasabi Drive SPA - Copilot Instructions

## Project status and current goal

Wasabi Drive SPA is an existing production-working React application for
browsing files stored in Wasabi Cloud Storage through the Wasabi Drive API.

The previous structural-refactoring and production-deployment phase is complete.

The current modernization phase is:

**Microsoft Entra identity and API authorization migration.**

The objective is to replace the legacy frontend username/password/UUID
authentication experience with standards-based Microsoft Entra authentication,
while preserving a working, deployable application throughout the migration.

Do not broaden the task into unrelated frontend modernization.

The developer is the technical owner and architectural decision-maker.
Copilot assists implementation; it does not independently redesign the system.

## Branch and repository safety

`master` is the protected integration/release branch.

Never commit implementation changes directly to `master`.

Use a focused task branch such as:

- `feature/entra-spa-authentication`;
- `feature/entra-api-token-integration`;
- `cleanup/remove-legacy-auth-ui`.

Keep each branch limited to one reviewable responsibility.

Do not automatically continue to another modernization task after completing
the requested work.

Do not make unrelated formatting, cleanup, dependency or architectural changes.

## Current architecture

Preserve these established characteristics unless a task explicitly changes
them:

- React 18;
- JavaScript;
- Create React App / `react-scripts` 5;
- Firebase Hosting;
- no React Router;
- React Context for existing application state;
- direct `fetch` calls currently used for Wasabi Drive API access;
- CSS Modules for component styling.

Current authentication-related flow is legacy:

- `src/pages/Login.jsx` posts username/password to the backend legacy validation
  endpoint;
- `src/store/auth-context.js` stores the returned legacy UUID token and user in
  browser local storage;
- `src/App.jsx` uses that legacy state to decide whether to render Login or
  Home;
- the legacy UUID token is not currently sent to bucket/object API calls;
- storage API calls currently send the legacy `X-Api-Key` header.

Do not introduce React Router, Redux, another state-management framework,
TypeScript, Vite, Next.js, or another frontend framework/toolchain unless an
explicit task approves it.

Prefer the smallest concrete boundary needed for the current task.

## Approved Microsoft Entra authentication direction

The approved target is:

React SPA
-> MSAL
-> Microsoft Entra
-> OAuth 2.0 / OpenID Connect authorization-code flow with PKCE
-> Wasabi Drive API access token
-> API Gateway REST API
-> Express token validation and application authorization
-> Wasabi services.

MSAL means Microsoft Authentication Library.

OIDC means OpenID Connect.

PKCE means Proof Key for Code Exchange. It protects the authorization-code
exchange for public clients such as browser SPAs that cannot safely hold a
client secret.

Use the authorization-code flow with PKCE.

Do not use the legacy implicit grant flow.

The SPA is a public client and must never contain an Entra client secret,
certificate private key, or other confidential-client credential.

Do not enable or depend on Entra settings intended for legacy implicit-flow
access tokens or ID tokens.

## Entra application model

The Entra configuration uses separate application registrations for:

- the Wasabi Drive SPA client; and
- the Wasabi Drive backend API/resource server.

The SPA must request an **access token intended for the Wasabi Drive API**.

Do not use an ID token as API authorization.

The API permission is a delegated permission: the SPA calls the Wasabi Drive
API on behalf of the signed-in user.

Environment-specific identifiers and API scopes must be supplied through the
established frontend environment configuration rather than scattered through
components.

## Redirect URI rules

The SPA has approved root redirect locations for local development and
Firebase Hosting.

The application should use a root redirect URI that matches the current
browser origin, including the root slash, rather than hard-coding separate
environment-specific redirect logic inside components.

Do not add speculative callback routes or React Router solely for Entra
authentication.

Do not change Entra redirect-URI behavior unless the task explicitly requires
it.

## MSAL token handling

MSAL must own the authentication/token cache.

Do not manually persist Entra access tokens, ID tokens, refresh tokens, or raw
authentication responses in application-created local-storage/session-storage
records.

Do not replace the legacy UUID token with an Entra access token in the existing
`authentication` local-storage object.

Acquire the Wasabi Drive API access token through MSAL when needed, normally
using silent token acquisition for an authenticated account.

Use interactive token acquisition only when MSAL indicates user interaction is
required and the task explicitly supports that behavior.

Never log bearer/access tokens or place them in error messages, test snapshots,
reports, URLs, or source code.

Application UI may use safe account/profile claims supplied by MSAL, but must
not treat display names or email addresses as backend authorization keys.

## Compatibility-first migration

The backend is being migrated separately and current production storage routes
do not yet require Entra bearer authentication.

Preserve staged compatibility.

During the transitional frontend migration:

- acquire an Entra access token for the Wasabi Drive API;
- send it as `Authorization: Bearer <access-token>` on storage API requests
  when the scoped task enables that behavior;
- preserve the existing `X-Api-Key` header until a later explicitly approved
  cleanup step;
- do not assume that adding a bearer token means backend enforcement is already
  active;
- do not remove compatibility behavior needed by the currently deployed
  backend unless the task explicitly represents the coordinated cutover.

Do not independently change backend route behavior from this repository.

Breaking frontend/backend contract changes require an explicit migration and
rollback plan.

## Legacy authentication migration

The current username/password/UUID frontend authentication is scheduled for
removal.

Do not spend effort redesigning or improving the legacy login/session mechanism
that will be deleted.

Do not add refresh-token behavior, improve UUID semantics, redesign legacy
password forms, or create new legacy authentication abstractions.

Change legacy authentication UI/state only as required to migrate cleanly to
MSAL or preserve compatibility during an explicitly approved transition.

Do not delete backend MongoDB/authentication code from the frontend repository;
backend cleanup is a separate backend task.

## API request rules

The current storage API calls are concentrated primarily in `src/pages/Home.jsx`
and use `fetch`.

Do not perform a broad networking-layer refactor merely to add authentication.

A small reusable API/authentication boundary is acceptable only when it
materially reduces duplicated token-acquisition/header logic and remains
proportionate to this application's size.

During the transition, protected storage requests may contain both:

- `Authorization: Bearer <access-token>`;
- the existing `X-Api-Key` compatibility header.

Do not treat `X-Api-Key` as user authentication or as a secret.

Do not place bearer tokens in query strings.

## Configuration and secrets

Create React App exposes variables prefixed with `REACT_APP_` to the browser
bundle.

Therefore frontend environment values must never be treated as secrets.

Tracked files must never contain:

- client secrets;
- passwords;
- bearer/access tokens;
- refresh tokens;
- private keys;
- AWS credentials;
- Wasabi credentials;
- authenticated database URIs.

Entra tenant IDs, application/client IDs, authority URLs and API scope
identifiers are not secrets, but they are environment-specific configuration
and should be represented through the established environment configuration
pattern.

Keep real local `.env` files untracked.

Keep `.env.example` limited to documented placeholders/non-secret examples.

Do not add a client secret to the SPA under any name.

## Firebase Hosting

Firebase Hosting remains the approved frontend hosting platform.

Do not migrate hosting providers.

Do not deploy to Firebase unless the task explicitly authorizes deployment.

Do not modify Firebase project configuration, rewrites, domains or production
hosting behavior unless required by the approved task.

## Unit-test and build gates

Standard non-interactive frontend test command:

`npm run test:ci`

Standard production build command:

`npm run build`

For behavior-preserving changes:

1. run the applicable test gate before the change where the environment permits;
2. record the baseline;
3. run tests again after the change;
4. run a production build after implementation;
5. preserve unrelated passing behavior.

Do not delete, skip or weaken assertions merely to make a change pass.

For Entra authentication work, add focused tests for the behavior in scope
where practical, such as:

- unauthenticated sign-in UI;
- authenticated account state;
- sign-in action;
- sign-out action;
- access-token acquisition request using the Wasabi Drive API scope;
- bearer-token attachment to storage API requests;
- failure behavior when token acquisition requires user interaction.

Mock MSAL/network boundaries in unit tests. Do not make unit tests depend on
interactive Entra login or live Microsoft endpoints.

## Dependency changes

Do not run broad dependency upgrades.

For an approved dependency task:

- modify only the required direct dependencies;
- allow necessary lockfile changes;
- keep `package.json` and `package-lock.json` synchronized;
- do not run broad `npm audit fix` or `npm audit fix --force`;
- report unrelated findings separately.

Use Microsoft's supported MSAL libraries for browser/React integration rather
than implementing OAuth/OIDC/PKCE manually.

Do not upgrade React, `react-scripts`, Firebase tooling, Font Awesome or other
unrelated dependencies during an Entra task unless explicitly requested.

## Known deferred technical debt

Do not opportunistically fix these during authentication work unless they block
the task:

- `aws-sdk` appears to be an unused frontend dependency;
- API calls are made directly from `Home.jsx`;
- frontend test coverage is currently minimal;
- the application has no centralized error boundary;
- the application has no React Router;
- styling/UI cleanup is possible;
- broader frontend dependency modernization may later be evaluated;
- the legacy `X-Api-Key` header remains transitional compatibility debt.

These items should be handled only in separately approved tasks.

## Refactoring discipline

For each task:

1. read this file in full before changing code;
2. understand the existing responsibility and tests;
3. make the smallest change needed for the approved task;
4. preserve unrelated application behavior;
5. avoid unrelated cleanup and formatting;
6. keep the diff reviewable;
7. make commits independently understandable;
8. stop when the requested task is complete.

The application is already deployed and working. Preserving deployability and
migration compatibility is more important than maximizing refactoring scope.

## Completion report

For each implementation task report:

- branch used;
- files changed;
- dependencies/configuration changed;
- baseline/final unit-test result;
- production-build result;
- behavior intentionally changed;
- compatibility impact;
- deployment performed, if explicitly authorized;
- remaining issue directly relevant to the task;
- recommended next task.

Do not automatically implement the recommended next task.
