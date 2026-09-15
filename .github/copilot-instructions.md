# Wasabi Drive SPA - Copilot Instructions

## Project status and current goal

Wasabi Drive SPA is an existing production-working React application for
browsing files stored in Wasabi Cloud Storage through the Wasabi Drive API.

The previous structural-refactoring and production-deployment phase is complete.

The current modernization phase is:

**Microsoft Entra identity and API authorization migration.**

The frontend Entra/MSAL migration has now been implemented on `master` and
successfully validated locally against the real Microsoft Entra tenant.

The confirmed local integration includes:

- Microsoft sign-in through MSAL;
- successful return to the SPA after Entra authentication;
- authenticated rendering of the existing application;
- acquisition of the Wasabi Drive API access token;
- existing bucket/object browsing features continuing to work;
- storage API requests carrying the Entra bearer token while retaining the
  transitional `X-Api-Key` header.

The backend storage routes do **not** yet enforce the Entra bearer token.
Backend enforcement, test-stage integration, trusted-user authorization, and
legacy-auth removal are separate coordinated tasks.

Do not broaden the current work into unrelated frontend modernization.

The developer is the technical owner and architectural decision-maker.
Copilot assists implementation; it does not independently redesign the system.

## Branch and repository safety

`master` is the protected integration/release branch.

Never commit implementation changes directly to `master`.

Use a focused task branch appropriate to the requested task, for example:

- `fix/entra-spa-integration-readiness`;
- `feature/entra-api-cutover`;
- `cleanup/remove-legacy-auth-ui`.

Keep each branch limited to one reviewable responsibility.

Do not automatically continue to another modernization task after completing
the requested work.

Do not make unrelated formatting, cleanup, dependency, or architectural
changes.

## Current architecture

Preserve these established characteristics unless a task explicitly changes
them:

- React 18;
- JavaScript;
- Create React App / `react-scripts` 5;
- Firebase Hosting;
- no React Router;
- React Context for bucket/pagination state;
- MSAL for frontend authentication;
- direct `fetch`-based Wasabi Drive API access behind a small authentication
  helper;
- CSS Modules for component styling.

Current authentication-related flow is:

- `src/index.js` creates the MSAL public-client application and wraps the React
  application with `MsalProvider`;
- `src/auth/msal-config.js` owns MSAL configuration and the Wasabi Drive API
  scope;
- `src/App.jsx` uses MSAL account and interaction state to decide whether to
  render the login UI, loading UI, or authenticated application;
- `src/pages/Login.jsx` signs the user in with Microsoft through
  `loginRedirect`;
- `src/components/header/Links.jsx` signs the user out through
  `logoutRedirect` and displays safe MSAL account information;
- `src/auth/api-client.js` obtains the Wasabi Drive API access token and adds
  the bearer header to API calls;
- `src/pages/Home.jsx` uses the authenticated API helper for bucket/object
  requests;
- storage API calls currently send both `Authorization: Bearer <access-token>`
  and the transitional `X-Api-Key` header.

Legacy frontend username/password/UUID authentication artifacts may still exist
in the repository but are no longer the active UI authentication path. Treat
them as migration remnants scheduled for later cleanup after coordinated
backend cutover.

Do not reintroduce the legacy username/password flow.

Do not introduce React Router, Redux, another state-management framework,
TypeScript, Vite, Next.js, or another frontend framework/toolchain unless an
explicit task approves it.

Prefer the smallest concrete boundary needed for the current task.

## Approved Microsoft Entra authentication architecture

The approved target is:

React SPA
-> MSAL
-> Microsoft Entra
-> OAuth 2.0 / OpenID Connect authorization-code flow with PKCE
-> Wasabi Drive API access token
-> API Gateway REST API
-> Express token validation
-> application authorization
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

The SPA requests an **access token intended for the Wasabi Drive API**.

Do not use an ID token as API authorization.

The API permission is a delegated permission: the SPA calls the Wasabi Drive
API on behalf of the signed-in user.

Environment-specific identifiers and API scopes must be supplied through the
established frontend environment configuration rather than scattered through
components.

## Redirect URI rules

The approved SPA redirect locations are root URLs for local development and
Firebase Hosting.

The current implementation derives the redirect and post-logout redirect URI
from:

`${window.location.origin}/`

This is intentional.

Do not hard-code separate environment-specific redirect logic into components.

Do not add callback routes or React Router solely for Entra authentication.

Do not change Entra redirect-URI behavior unless an explicitly approved task
requires it.

## MSAL token handling

MSAL owns the authentication/token cache.

The current MSAL cache location is `sessionStorage`.

Do not manually persist Entra access tokens, ID tokens, refresh tokens, or raw
authentication responses in application-created local-storage/session-storage
records.

Do not place an Entra access token in the old legacy `authentication` storage
shape.

Acquire the Wasabi Drive API access token through MSAL when needed, normally
using `acquireTokenSilent` for an authenticated account.

Interactive token acquisition may be used only when MSAL reports
`InteractionRequiredAuthError`.

The current request helper may initiate `acquireTokenRedirect`; callers must
continue to handle that redirect path safely and must not dereference an absent
fetch response.

Never log bearer/access tokens or place them in error messages, test snapshots,
reports, URLs, source code, or committed configuration.

Application UI may use safe account/profile claims supplied by MSAL, but must
not treat display names or email addresses as backend authorization keys.

Frontend authenticated state is not backend authorization.

## Compatibility-first migration

The backend is being migrated separately.

Current production/test storage routes may not yet require Entra bearer
authentication, depending on the explicitly approved backend migration step.

Preserve staged compatibility.

During the current transition:

- acquire an Entra access token for the Wasabi Drive API;
- send it as `Authorization: Bearer <access-token>` on storage API requests;
- preserve the existing `X-Api-Key` header until a later explicitly approved
  cleanup step;
- do not assume that adding a bearer token means backend enforcement is active;
- do not remove compatibility behavior required by the deployed backend unless
  the task explicitly represents the coordinated cutover.

Do not independently change backend route behavior from this repository.

Breaking frontend/backend contract changes require an explicit migration and
rollback plan.

## Legacy authentication migration

The old frontend username/password/UUID authentication path is no longer the
active login path and is scheduled for cleanup after Entra cutover is proven.

Do not spend effort redesigning or improving legacy authentication code that
will be deleted.

Do not add refresh-token behavior, improve UUID semantics, redesign legacy
password forms, or create new legacy authentication abstractions.

Do not restore legacy authentication as a fallback unless an explicitly
approved rollback/compatibility task requires it.

Remove unused legacy frontend authentication files only in a separately scoped
cleanup task after backend Entra enforcement and production cutover have been
validated.

Backend MongoDB/bcrypt/UUID cleanup belongs to the backend repository and is a
separate task.

## API request rules

The current storage API calls are concentrated primarily in
`src/pages/Home.jsx`.

`src/auth/api-client.js` is the small authentication-aware request boundary.

Preserve this proportionate structure unless a concrete requirement justifies
something more.

Do not perform a broad networking-layer refactor merely because authentication
exists.

Current storage requests contain:

- `Authorization: Bearer <access-token>`;
- the existing `X-Api-Key` compatibility header.

Do not treat `X-Api-Key` as user authentication or as a secret.

Do not place bearer tokens in query strings.

Do not decode access tokens in the frontend to make authorization decisions.

The backend remains the security authority.

## Direct Wasabi object URLs and corporate-network testing

`src/components/main/File.jsx` currently constructs direct browser URLs to
Wasabi object storage in the form:

`https://s3.<region>.wasabisys.com/<bucket>/<key>`

Those URLs are used for file links and for browser-loaded image/video content.

A successful local Entra integration test on a work-managed laptop showed that
the application and authenticated API features work, while direct Wasabi
object URLs/thumbnails are blocked by the employer's IT policy for cloud
storage.

Treat that result as an **environment/network-policy constraint**, not as proof
of an application regression.

Do not change thumbnail/file-link architecture solely because a corporate
endpoint-security or web-filtering policy blocks `wasabisys.com`.

If the same failure is reproduced on an unrestricted personal network/device,
report it separately and investigate it as an application/storage-access issue.

There is existing deferred technical debt around direct object URLs and a
possible future proxy/CDN design. Do not implement a proxy, CDN, signed-URL
service, or other delivery architecture during an unrelated Entra task.

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

Entra tenant IDs, application/client IDs, authority URLs, and API scope
identifiers are not secrets, but they are environment-specific configuration
and should be represented through the established environment configuration
pattern.

Keep real local `.env` files untracked.

Keep `.env.example` limited to documented placeholders/non-secret examples.

Do not add a client secret to the SPA under any name.

Current Entra-related frontend environment names are:

- `REACT_APP_ENTRA_TENANT_ID`;
- `REACT_APP_ENTRA_CLIENT_ID`;
- `REACT_APP_ENTRA_API_SCOPE`.

Preserve existing API environment configuration during the compatibility
period unless an explicitly approved task changes it.

## Firebase Hosting

Firebase Hosting remains the approved frontend hosting platform.

Do not migrate hosting providers.

Do not deploy to Firebase unless the task explicitly authorizes deployment.

Do not modify Firebase project configuration, rewrites, domains, or production
hosting behavior unless required by the approved task.

React environment variables are embedded into the production bundle at build
time. Production Entra/API configuration must therefore be present at build
time when deployment is eventually authorized.

## Test and build gates

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

Do not delete, skip, or weaken assertions merely to make a change pass.

For Entra authentication work, preserve focused coverage for behavior such as:

- MSAL startup/interaction state;
- unauthenticated sign-in UI;
- authenticated account state;
- sign-in action;
- sign-out action;
- access-token acquisition using the Wasabi Drive API scope;
- bearer-token attachment to storage API requests;
- preservation of the transitional `X-Api-Key`;
- safe handling when token acquisition requires user interaction.

Mock MSAL/network boundaries in unit tests.

Do not make unit tests depend on interactive Entra login or live Microsoft
endpoints.

Manual live Entra testing is a separate integration checkpoint and should not
replace automated unit/build gates.

## Current verified integration checkpoint

The frontend has been manually tested locally against the real Entra tenant.

Confirmed:

- Microsoft account sign-in succeeds;
- the SPA returns successfully from the Entra redirect;
- the authenticated application renders;
- existing application browsing features continue to work;
- the current Entra-enabled frontend does not require rollback based on that
  test.

Not yet implied by this checkpoint:

- backend bearer-token enforcement;
- trusted-user authorization;
- production Entra cutover;
- removal of `X-Api-Key`;
- removal of legacy backend authentication/MongoDB;
- removal of unused legacy frontend auth files;
- resolution of employer network policies that block direct Wasabi object
  URLs.

Do not represent these later steps as completed until they are explicitly
implemented and verified.

## Dependency changes

Do not run broad dependency upgrades.

For an approved dependency task:

- modify only the required direct dependencies;
- allow necessary lockfile changes;
- keep `package.json` and `package-lock.json` synchronized;
- do not run broad `npm audit fix` or `npm audit fix --force`;
- report unrelated findings separately.

Current MSAL dependencies are established parts of the authentication design.

Use Microsoft's supported MSAL libraries rather than implementing
OAuth/OIDC/PKCE manually.

Do not upgrade React, `react-scripts`, MSAL, Firebase tooling, Font Awesome, or
other unrelated dependencies during a backend-cutover/authorization task unless
explicitly requested.

## Known deferred technical debt

Do not opportunistically fix these during authentication work unless they block
the task:

- `aws-sdk` appears to be an unused frontend dependency;
- API calls are still concentrated in `Home.jsx`;
- frontend test coverage remains intentionally focused rather than broad;
- the application has no centralized error boundary;
- the application has no React Router;
- styling/UI cleanup is possible;
- direct browser access to Wasabi object URLs may later be reconsidered;
- a proxy/CDN/object-delivery design is deferred;
- employer/corporate filtering may block direct `wasabisys.com` object access;
- broader frontend dependency modernization may later be evaluated;
- the legacy `X-Api-Key` header remains transitional compatibility debt;
- unused legacy username/password/UUID frontend artifacts remain pending
  coordinated cleanup.

These items should be handled only in separately approved tasks.

## Current migration sequence

The intended sequence from the current checkpoint is approximately:

1. keep the successfully tested frontend Entra implementation stable;
2. activate/configure Entra token validation for the backend AWS `test` stage;
3. protect the approved storage routes in the `test` stage;
4. validate the frontend end-to-end against the protected `test` API;
5. introduce/validate the simple trusted-user authorization layer;
6. plan and execute the coordinated production cutover;
7. remove unused legacy frontend authentication artifacts;
8. remove backend MongoDB/bcrypt/UUID authentication if it has no remaining
   business purpose;
9. remove the transitional `X-Api-Key` header unless a real API Gateway
   usage-plan requirement remains.

Do not skip compatibility/rollback planning for the enforcement and production
cutover steps.

Do not implement later sequence items merely because they appear here. Each
requires an explicitly scoped task.

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