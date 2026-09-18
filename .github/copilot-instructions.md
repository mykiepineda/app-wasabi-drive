# Wasabi Drive SPA - Copilot Instructions

## Project status

Wasabi Drive is an existing production React SPA hosted on Firebase Hosting.

The Microsoft Entra identity migration and backend Phase 4 security work through
Task 4D are complete and production-validated.

Verified current architecture:

- Microsoft Entra sign-in through MSAL works;
- the SPA obtains an OAuth 2.0 access token for the Wasabi Drive API;
- authenticated API calls send `Authorization: Bearer <access-token>`;
- the backend validates the bearer token;
- trusted-user authorization is enforced by the backend;
- API Gateway API keys and `X-Api-Key` are no longer part of the application;
- legacy MongoDB/bcrypt/UUID authentication has been removed from the backend;
- the backend uses AWS SDK for JavaScript v3 for Wasabi access;
- authenticated object-list responses now include a short-lived `AccessUrl`
  property for each object in `Contents`;
- existing production folder browsing remains operational.

The immediate frontend task is:

**Task 4E - consume backend-authorized `AccessUrl` values instead of
constructing permanent raw Wasabi object URLs.**

Do not broaden Task 4E into unrelated frontend modernization.

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

Current identity and API flow:

React/MSAL
-> Microsoft Entra
-> OAuth 2.0 / OpenID Connect access token
-> API Gateway REST API
-> Express authentication
-> backend trusted-user authorization
-> backend application/service layer
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
- inspect Entra Object IDs to decide whether a user is trusted;
- maintain a trusted-user allow-list;
- infer authorization from frontend state;
- introduce another browser credential as an authorization substitute.

The frontend obtains an access token, sends it to the API, and presents the
backend result.

## Entra and API configuration

Required build-time variables:

- `REACT_APP_API_URL`;
- `REACT_APP_ENTRA_TENANT_ID`;
- `REACT_APP_ENTRA_CLIENT_ID`;
- `REACT_APP_ENTRA_API_SCOPE`.

`src/auth/msal-config.js` validates required Entra configuration before MSAL is
constructed.

Missing or blank required Entra values must fail clearly rather than building
an invalid Microsoft authority.

Create React App embeds `REACT_APP_*` values at development-server/build time.

Do not introduce runtime dotenv loading or custom stage-selection logic in
browser code.

API keys must not be reintroduced.

## API client

`src/auth/api-client.js` is the authentication/network boundary for calls to
the Wasabi Drive backend.

Preserve its current behavior:

- attempts silent access-token acquisition;
- uses MSAL redirect when user interaction is required;
- sends `Authorization: Bearer <access-token>`;
- preserves caller-provided request headers/options;
- maps `401` to a safe authentication/session error;
- maps `403` to a safe access-denied error;
- maps other non-success responses to a generic service error;
- maps rejected `fetch()` calls to a generic connectivity/service error.

Do not change token acquisition, caching, or error semantics during Task 4E.

Do not expose raw access tokens, Object IDs, backend stack traces, or raw
security error payloads.

Do not redirect-loop on `403`.

Do not add Axios or another HTTP framework.

## Backend-authorized object access

The backend now adds `AccessUrl` to each object returned in
`GET /buckets/:Bucket/objects/:Prefix(*)`.

`AccessUrl` is a short-lived Wasabi presigned GET URL generated only after the
request has passed backend Entra authentication and trusted-user authorization.

A presigned URL is a cryptographically signed temporary URL granting a specific
storage operation for a limited time.

The complete `AccessUrl` is a temporary bearer capability:

- anyone possessing an unexpired URL can use the granted GET operation;
- it is expected to be visible to the browser and Developer Tools;
- it is not a permanent secret like a Wasabi access key;
- do not deliberately log, persist, or expose it outside the current UI flow.

Task 4E must replace raw Wasabi URL construction with this backend-provided
value.

Expected frontend data flow:

backend `Contents[].AccessUrl`
-> `Home.jsx` file view model
-> `Files.jsx`
-> `File.jsx`
-> image/video/object link.

### Task 4E rules

- Preserve the existing authenticated backend listing call.
- Carry each backend `Contents[].AccessUrl` forward as a file property such as
  `accessUrl`.
- Use that value directly for file links, image `src`, and video source `src`.
- Treat the URL as opaque. Do not parse it, rebuild it, append query parameters,
  decode/re-encode it, or generate it in the browser.
- Do not attach the Entra bearer token to the subsequent direct Wasabi request.
  The presigned URL itself authorizes the temporary Wasabi GET.
- Remove raw URL construction such as
  `https://s3.<region>.wasabisys.com/<bucket>/<key>` from the file-rendering
  path.
- Do not fall back to a raw public Wasabi URL if `AccessUrl` is missing.
- Do not add a new backend call for every thumbnail or file.
- Do not introduce automatic URL-refresh behavior during this task.
- Do not proxy file bytes through the backend.
- Do not introduce CloudFront, another CDN, or a custom file-delivery domain.
- Do not redesign the UI.

The signed URL will still use a Wasabi hostname. Corporate networks that block
Wasabi/cloud-storage domains may therefore still block the object. Do not
attempt to bypass corporate filtering as part of this task.

## Relevant current component boundaries

`src/pages/Home.jsx` currently transforms backend `Contents` into the frontend
file view model. Preserve that responsibility and include the backend
`AccessUrl` in the mapped file data.

`src/components/main/Files.jsx` renders the file collection. It should pass the
already-authorized URL to each `File`.

`src/components/main/File.jsx` currently constructs a raw Wasabi URL from
region/bucket/key. Task 4E must remove that construction and use the supplied
authorized URL for:

- thumbnail images;
- video source;
- the link opened in a new tab.

Do not move authentication logic into these components.

`BucketContext` remains used by `SubHeader` for bucket/location presentation.
Do not broadly refactor that context merely because `File` no longer requires
bucket/region values to build a URL.

## URL expiry behavior

The backend controls presigned-URL expiry.

The frontend must not assume a particular lifetime and must not parse signing
parameters.

For the initial implementation, do not add proactive refresh timers or
background URL renewal. Re-entering/refreshing a folder naturally obtains a
fresh object-list response and therefore fresh URLs.

If expiry becomes a demonstrated usability problem, handle it in a later
focused task.

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
- absence of `X-Api-Key`;
- `401`, `403`, service, and network error mapping;
- Home error rendering;
- logout availability.

Task 4E should add focused regression coverage demonstrating that:

- backend `AccessUrl` is carried into the frontend file model;
- `File` uses the supplied authorized URL as the object link;
- image thumbnails use the supplied authorized URL;
- video sources use the supplied authorized URL;
- raw `wasabisys.com/<bucket>/<key>` URL construction is no longer used by the
  file-rendering path;
- missing `AccessUrl` does not trigger a raw public-URL fallback.

Do not call live Entra, the live backend, or Wasabi from unit tests.

Use obviously fake signed URLs in tests.

Do not weaken tests merely to make changes pass.

## Deployment and privacy-cutover safety

Do not deploy unless the task explicitly authorizes deployment.

Firebase Hosting remains the frontend deployment target.

Task 4E implementation itself must not change Wasabi bucket/object privacy.

The rollout order is deliberate:

1. backend presigned-access capability is already deployed;
2. update the frontend to consume `AccessUrl`;
3. deploy and verify the frontend against `test` while objects are still public;
4. make only test Wasabi objects private;
5. verify signed access still works and unsigned raw access fails;
6. deploy the compatible frontend to production;
7. verify production while production objects are still public;
8. make production Wasabi objects private;
9. verify production again.

Do not skip directly to production privacy changes.

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

Entra tenant IDs, application/client IDs, and API scope identifiers are public
identifiers rather than passwords, but environment-specific values should
remain in the appropriate build configuration rather than being scattered
through source.

Do not print or persist access tokens.

Do not persist presigned URLs to localStorage/sessionStorage.

## Deferred frontend work

Do not opportunistically implement during Task 4E:

- Create React App migration;
- React upgrade;
- React Router;
- Redux/global state;
- CDN/proxy/custom-domain object delivery;
- automatic presigned-URL refresh;
- corporate-network filtering workarounds;
- thumbnail-generation redesign;
- visual redesign;
- broad dependency upgrades;
- CI/CD.

The direct `aws-sdk` package currently listed in the frontend dependencies
appears unused by application source. Do not remove it during Task 4E unless
the task is explicitly expanded; treat dependency cleanup as a separate,
reviewable maintenance change.

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
- how `AccessUrl` flows from the backend response to `File`;
- raw Wasabi URL construction removed;
- thumbnail/video/link behavior changed;
- tests added/updated;
- `npm run test:ci` result;
- `npm run build` result;
- `git diff --check` result;
- confirmation MSAL/token behavior was unchanged;
- confirmation no API key was reintroduced;
- confirmation there is no raw public-URL fallback;
- confirmation no complete real signed URL/token/secret was committed;
- confirmation no deployment or Wasabi privacy change occurred unless
  explicitly authorized;
- any compatibility concern;
- recommended next task.

Do not automatically start the recommended next task.