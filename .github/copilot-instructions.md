# Wasabi Drive SPA - Copilot Instructions

## Project status and current goal

Wasabi Drive SPA is an existing production-working React application for
browsing Wasabi Cloud Storage through the Wasabi Drive API.

The structural refactor and Microsoft Entra/MSAL migration are implemented.
The frontend has successfully authenticated against the protected AWS `test`
API using a real Entra access token.

The backend now also has trusted-user application authorization, and both
positive and negative authorization scenarios have been exercised in `test`.

The current phase is **pre-production frontend identity hardening**.

The immediate frontend objectives are:

1. fail fast when required Entra build-time configuration is missing instead of
   constructing invalid MSAL URLs containing `undefined`;
2. handle protected API failures deliberately, especially `401`, `403`, and
   network/CORS failures, instead of producing an uncaught React development
   runtime error or leaving a permanent spinner;
3. preserve the backend as the sole authority for authentication and
   authorization decisions.

Do not broaden the task into React migration, routing redesign, state-management
replacement, visual redesign, API Gateway changes, or storage-delivery changes.

The developer is the technical owner and architectural decision-maker. Copilot
assists implementation; it does not independently redesign the system.

## Branch and repository safety

`master` is the protected integration/release branch.

Never commit implementation changes directly to `master`.

The developer creates the branch manually before using Copilot Chat. Work only
in the current workspace and current branch. Do not create another branch or
worktree unless explicitly instructed.

Suggested current branch:

- `fix/entra-frontend-hardening`.

Do not modify this instruction file unless the task explicitly authorizes it.

Keep the diff focused and reviewable. Do not automatically continue to another
modernization task.

## Current frontend architecture

Preserve these established characteristics unless explicitly changed:

- React 18;
- JavaScript;
- Create React App / `react-scripts` 5;
- Firebase Hosting;
- `@azure/msal-browser` + `@azure/msal-react`;
- MSAL session-storage cache;
- no React Router;
- no Redux or other global state-management framework;
- no custom OAuth implementation.

Current identity flow:

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

The frontend must not duplicate authorization logic.

Do not:

- decode access tokens to decide whether the user is trusted;
- inspect `oid` for application authorization;
- maintain the trusted-user allow-list in frontend code;
- infer authorization from MSAL account presence;
- treat `X-Api-Key` as user authentication;
- hide backend security failures by pretending they are successful responses.

The frontend's job is to obtain the access token, call the API, and present
backend outcomes safely and clearly.

## Current API client

`src/auth/api-client.js` is the small authentication/network boundary.

It currently:

- silently acquires an access token for the configured API scope;
- uses MSAL redirect acquisition only when interaction is required;
- adds `Authorization: Bearer <token>`;
- still sends a transitional `X-Api-Key` header.

Preserve the established token-acquisition behavior.

Do not manually persist access tokens.

Do not log bearer tokens.

Do not add Axios or another HTTP client merely for error handling.

## Required Entra build-time configuration

Current required frontend Entra variables:

- `REACT_APP_ENTRA_TENANT_ID`;
- `REACT_APP_ENTRA_CLIENT_ID`;
- `REACT_APP_ENTRA_API_SCOPE`.

The app previously allowed missing values to flow into MSAL, producing URLs such
as:

`https://login.microsoftonline.com/undefined/...`

That must fail locally before MSAL is constructed or a redirect is attempted.

Approved behavior:

- validate required values centrally;
- treat undefined, empty, and whitespace-only values as missing;
- report the missing variable names without printing their values;
- do not load dotenv files manually in browser code;
- do not implement runtime configuration fetching;
- do not add stage-selection logic to React code.

Create React App embeds `REACT_APP_*` values at development-server/build time.
Restart the dev server after dotenv changes.

Environment conventions already ignored by Git include:

- `.env`;
- `.env.local`;
- `.env.development.local`;
- `.env.test.local`;
- `.env.production.local`.

For current manual workflows, `.env.local` is suitable for local development
against the AWS `test` API, and `.env.production.local` can be used for a local
manual production build when needed. CI build environment variables should
replace developer-local production files once CI/CD exists.

## API error semantics and user experience

The frontend must deliberately distinguish HTTP responses from transport
failures.

A normal `fetch()` call resolves even for HTTP `401`, `403`, `404`, or `500`.
A rejected `fetch()` with `TypeError: Failed to fetch` generally means the
browser did not receive a readable HTTP response, for example because of a
network problem, DNS/TLS issue, CORS blocking, or similar transport failure.

Do not mislabel a network/CORS failure as authorization denial.

Required user-facing semantics:

- `2xx` -> preserve normal Wasabi Drive behavior;
- `401` -> authentication/session message, with a clear path to sign out/sign
  in again;
- `403` -> access-denied message explaining that the signed-in Microsoft account
  is not authorized to use Wasabi Drive;
- other HTTP failures -> generic non-sensitive service error;
- rejected fetch/network/CORS failure -> generic connectivity/service message,
  not a `403` authorization message.

Recommended wording:

- `401`: "Your session could not be authenticated. Please sign out and sign in
  again.";
- `403`: "Your Microsoft account is signed in, but it is not authorized to use
  Wasabi Drive.";
- network/service: "Wasabi Drive could not reach the service. Please try again."

Exact wording may follow the existing UI style.

Do not display:

- raw bearer tokens;
- Object IDs;
- allow-list configuration;
- backend stack traces;
- raw security error payloads;
- implementation details such as `ENTRA_TRUSTED_USER_OBJECT_IDS`.

Do not automatically loop a `403` back into Microsoft login. A `403` user is
already authenticated.

For `401`, avoid uncontrolled sign-in/redirect retry loops.

## Home page error state

`src/pages/Home.jsx` currently assumes API responses are successful and can
leave errors unhandled.

Harden this flow without a large architectural rewrite.

Approved direction:

- centralize HTTP status interpretation at or near the existing API-client
  boundary where practical;
- let page/UI code render a deliberate error state;
- ensure `isLoading` is resolved on every terminal success/failure path;
- preserve the `Header` and sign-out capability for an authenticated but
  unauthorized user;
- do not render stale bucket/folder data as if the failed request succeeded;
- avoid permanent spinners;
- avoid React's uncaught-runtime-error overlay for expected API failures.

A small typed/custom error object or error class carrying a safe status/category
is acceptable. Do not introduce an error-management framework.

## CORS versus authorization

CORS means Cross-Origin Resource Sharing. It is a browser transport policy, not
user authentication or authorization.

If browser testing shows `TypeError: Failed to fetch`, inspect the Network tab
before concluding the backend returned `403`.

The frontend must handle transport failures gracefully, but must not mask a real
backend CORS/configuration defect that should be diagnosed separately.

## Transitional `X-Api-Key`

The frontend still sends `X-Api-Key` temporarily for compatibility.

Do not remove it during the frontend hardening task.

API keys are not user authentication. Removal is a later task after production
API Gateway state and cutover compatibility are confirmed.

## Direct Wasabi object links

The application currently opens some Wasabi object URLs directly. On a
corporate work laptop, employer network policy blocked those Wasabi cloud links,
while the same behavior worked from a personal laptop.

Do not introduce a proxy/CDN/object-delivery redesign during identity hardening
solely to work around that employer-network policy.

## Legacy frontend code

Unused legacy username/password/UUID frontend artifacts still exist in the
repository, including old authentication-context/form components.

Do not remove them in the Entra error-handling/configuration PR unless the task
explicitly authorizes cleanup.

A separate cleanup PR may remove confirmed-unused legacy frontend auth files
after the hardening change is stable.

Do not remove the transitional `X-Api-Key` in that cleanup unless separately
approved.

## Testing gates

Normal frontend gates:

- `npm run test:ci`;
- `npm run build`.

For the Entra hardening task, add focused tests covering at least:

- valid Entra configuration accepted;
- missing tenant ID rejected clearly;
- missing client ID rejected clearly;
- missing API scope rejected clearly;
- whitespace-only required values rejected;
- error messages name missing variables without exposing values;
- successful authenticated API response remains unchanged;
- `401` creates the intended authentication/session UI state;
- `403` creates the intended access-denied UI state;
- `403` does not trigger another login attempt;
- network/rejected-fetch failure creates a connectivity/service UI state rather
  than a fake authorization message;
- loading state ends after failures;
- no raw backend security detail is exposed.

Mock MSAL and fetch/network boundaries. Do not call live Entra or the live API
from unit tests.

Do not weaken tests merely to make changes pass.

Run `git diff --check` after implementation.

## Deployment safety

Do not deploy unless explicitly requested.

Firebase Hosting remains the frontend deployment target.

Remember that React environment variables are embedded at build time.
Before production deployment, confirm the production build points to the
production API and uses the correct Entra tenant/client/scope values.

The planned production rollout remains compatibility-first:

- finish frontend hardening;
- verify local frontend against protected AWS `test`;
- run a production build with production configuration;
- deploy the Entra-enabled frontend while production backend Entra enforcement
  is still disabled;
- verify production frontend compatibility;
- only then enable backend production Entra authentication/authorization in a
  controlled backend deployment.

Do not assume CI/CD exists.

## Dependency discipline

Do not run broad upgrades.

Do not migrate React, Create React App, Firebase tooling, Font Awesome, or MSAL
as incidental cleanup.

Do not run broad `npm audit fix` or `npm audit fix --force`.

No new runtime dependency should be necessary for the current hardening task.

`aws-sdk` appears unused in the frontend but is deferred to a separately scoped
cleanup task.

## Known deferred work

Do not opportunistically implement during the current hardening task:

- React Router;
- Redux/state-management replacement;
- UI redesign;
- general error-boundary framework;
- Create React App migration;
- broad dependency modernization;
- object proxy/CDN architecture;
- `X-Api-Key` removal;
- Kong/API Gateway changes;
- CI/CD.

## Completion report

For each task report:

- current branch;
- commits created;
- files changed;
- configuration behavior changed;
- API/error behavior changed;
- baseline/final `npm run test:ci` result;
- baseline/final `npm run build` result;
- `git diff --check` result;
- confirmation no real secrets/tokens were committed;
- confirmation no deployment occurred unless explicitly authorized;
- remaining issue directly relevant to the task;
- recommended next task.

Stop when the requested task is complete.