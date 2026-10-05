# Wasabi Drive Frontend — GitHub Copilot Instructions

## Project role and working agreement

Wasabi Drive is an existing production application and an incremental modernization / cloud-engineering learning project.

The developer is the technical owner and architectural decision-maker.

ChatGPT is used for architecture, prioritization, task scoping, implementation prompts, and code review.

GitHub Copilot is an implementation assistant. Make only the explicitly requested change. Do not independently redesign the frontend, backend contract, identity architecture, storage architecture, Firebase deployment model, CI/CD model, or release process.

Prefer small, reviewable changes over broad cleanup.

Do not implement roadmap items merely because they appear in these instructions. Only the explicitly approved current task is implementation scope.

Before editing:

1. inspect the actual current source;
2. check the current Git branch and working tree;
3. report the starting commit SHA where practical;
4. preserve newer approved behavior if `master` has advanced;
5. report a material conflict between these instructions and the current source rather than guessing.

Do not discard user changes or reset a dirty working tree.

## Current phase

Current modernization phase:

**Phase 8 — Media Performance**

Phase 7 — Production Reliability and Observability — is complete and production-validated.

Completed frontend foundations include:

- Microsoft Entra authentication using MSAL;
- OAuth 2.0 / OpenID Connect access-token based backend access;
- removal of API-key authentication;
- private Wasabi object access through backend-generated temporary `AccessUrl` values;
- cursor-based pagination with opaque continuation tokens;
- stale browse-request cancellation and stale-result protection using `AbortController`;
- immutable breadcrumb state updates;
- explicit authentication, authorization, service, and network error handling;
- removal of the unused frontend AWS SDK;
- mature frontend CI/CD with automatic Firebase test deployment and manual exact-SHA production promotion.

Do not redo or redesign these completed areas unless the current task exposes a concrete defect.

## Active task

The currently approved implementation task is:

**Task 8A — Image-grid loading baseline and browser-native image loading optimization**

Suggested branch:

`perf/lazy-image-loading`

Task 8A is frontend-only.

Do not automatically proceed to video optimization, thumbnail generation, or another Phase 8 task after completing it.

## Phase 8 engineering principle

Use:

**measure -> make the smallest useful change -> measure again**

Prefer browser-native capabilities before adding libraries, abstractions, infrastructure, or custom loading mechanisms.

Infrastructure must earn its place through measured need.

## Stable frontend architecture

Preserve:

- React 18;
- Create React App / `react-scripts` 5;
- JavaScript;
- Firebase Hosting;
- separate Firebase `test` and production projects;
- MSAL — Microsoft Authentication Library;
- Microsoft Entra authentication;
- OAuth 2.0 / OIDC access-token flow;
- bearer-token backend access;
- cursor-based bucket/folder pagination;
- backend-generated short-lived `AccessUrl` values for private Wasabi objects;
- explicit `401`, `403`, service, and network error handling;
- stale request protection using `AbortController`;
- existing visual file grid and CSS;
- existing backend API contract.

OIDC = OpenID Connect, the identity layer used alongside OAuth 2.0.

Do not introduce during Task 8A:

- Redux or another state-management framework;
- React Query / TanStack Query;
- TypeScript;
- Vite or another Create React App replacement;
- a React major-version upgrade;
- Firebase Authentication;
- Firestore;
- Realtime Database;
- Cloud Functions;
- another hosting platform;
- an image-processing library;
- a lazy-loading package;
- a custom `IntersectionObserver` implementation.

## Security and identity invariants

Preserve the approved flow:

React SPA
-> MSAL
-> Microsoft Entra
-> OAuth 2.0 API access token
-> API Gateway
-> Express backend authentication
-> application authorization
-> private Wasabi storage.

The backend remains the security authority.

Frontend state is not authorization.

CORS — Cross-Origin Resource Sharing — is a browser access policy, not authentication.

Browser-visible frontend configuration is not secret.

Never introduce:

- a Microsoft Entra client secret into the SPA;
- API keys as user authentication;
- Wasabi credentials into the browser;
- an AWS/Wasabi storage SDK into the frontend;
- client-side signing;
- raw/public Wasabi object URLs;
- frontend authorization as a substitute for backend authorization.

Do not log or expose bearer tokens or complete presigned URL query values.

## Private object access invariant

Wasabi objects remain private.

The backend supplies a temporary `AccessUrl` for each listed object.

The frontend must continue to consume that exact backend-provided `AccessUrl`.

For an image card:

- the `<img>` source must remain the supplied `accessUrl`;
- the object link must remain the supplied `accessUrl`.

Never derive, reconstruct, manipulate, or guess a Wasabi storage URL from the bucket name, object key, region, or filename.

The current backend presigned URL lifetime is approximately one hour.

Native lazy loading may delay the browser's first request for an off-screen image. An image first requested after the `AccessUrl` has expired could fail. This is an accepted known limitation for Task 8A.

Do not build URL-refresh functionality during this task.

## Cursor pagination invariant

Preserve the existing cursor pagination behavior:

- opaque continuation-token handling;
- safe query encoding;
- page history;
- previous/next navigation;
- Objects-per-page behavior;
- reset behavior when changing folder or page size;
- no `TotalKeyCount`;
- no full-list traversal.

Current user-selectable page sizes include:

- 10;
- 25;
- 50;
- 100.

Do not change these values during Task 8A.

## Frontend reliability invariants

Preserve the Phase 7 stale-request safeguards.

Do not weaken or remove:

- `AbortController`;
- signal propagation into authenticated API requests;
- stale-result guards following asynchronous boundaries;
- special treatment of intentional `AbortError`;
- protection against an old request clearing or replacing newer state;
- immutable breadcrumb behavior.

Task 8A does not require changes to `Home.jsx` or `api-client.js` unless the actual current source demonstrates a concrete reason.

## Existing CI/CD is an invariant

Preserve:

- `.github/workflows/frontend-pr-checks.yml`;
- `.github/workflows/frontend-test-deploy.yml`;
- `.github/workflows/frontend-prd-deploy.yml`.

The approved release flow remains:

feature branch
-> pull request
-> CI
-> protected `master`
-> automatic Firebase `test` deployment
-> validation
-> manual exact-SHA production promotion.

Production does not automatically deploy on merge.

Do not change:

- pinned GitHub Action SHAs;
- Node.js 24;
- Google Workload Identity Federation;
- deployment identities;
- Firebase project targeting;
- production manual workflow dispatch;
- exact-SHA verification;
- detached production checkout;
- build-time `REACT_APP_*` configuration behavior.

Task 8A requires no CI/CD changes.

## Task 8A source context

The reviewed `master` snapshot currently shows:

- `src/components/main/File.jsx` renders an image using the backend-provided `accessUrl`;
- the image currently has no `loading` attribute;
- the image currently has no `decoding` attribute;
- the same `accessUrl` is used by the enclosing object link;
- `File.module.css` displays image/video media inside a roughly 150px-high card using `object-fit: cover`;
- video cards use the existing `<video>` / `<source>` implementation without an explicit preload policy;
- `File.test.js` already checks authorized image URLs, object links, video source URLs, and absence of constructed raw Wasabi URLs.

Verify these assumptions against the current working clone before editing.

If the current source differs materially, stop and report the difference instead of blindly applying an outdated patch.

## Task 8A objective

Reduce unnecessary initial image downloading and decoding work in image-heavy folders using the smallest browser-native change.

The intended implementation is to add native image loading hints to image-card `<img>` elements while preserving all existing URLs, navigation, styling, security, and component behavior.

Expected form:

`loading="lazy"`

and:

`decoding="async"`

These attributes apply only to image rendering.

`loading="lazy"` tells a supporting browser that an off-screen image may be deferred until it approaches the viewport.

`decoding="async"` requests asynchronous image decoding so image decoding is less likely to block other rendering work.

These are browser hints; do not implement custom scheduling around them.

## Required implementation behavior

For image cards:

- keep `src={accessUrl}`;
- keep the existing `alt` text;
- add `loading="lazy"`;
- add `decoding="async"`.

Preserve the enclosing link:

- keep `href={accessUrl}`;
- keep the current new-tab behavior;
- keep existing `rel` behavior.

Preserve all current CSS and visual layout unless the current source reveals a concrete bug directly caused by the change.

Do not add new state, effects, props, hooks, helpers, abstractions, or dependencies merely to apply these native attributes.

## Video boundary

Do not modify video loading behavior during Task 8A.

Do not add or change:

- `preload`;
- `poster`;
- autoplay behavior;
- controls;
- video metadata fetching;
- custom video intersection/loading logic.

Video behavior will be measured separately only if Task 8B is later approved.

## Expected files

Inspect at minimum:

- `src/components/main/File.jsx`;
- `src/components/main/File.module.css`;
- `src/components/main/Files.jsx`;
- `src/components/main/File.test.js`;
- relevant pagination/page-size components;
- `.github/copilot-instructions.md`.

The implementation itself should normally require only a very small change, likely:

- `src/components/main/File.jsx`;
- `src/components/main/File.test.js`.

Do not modify unrelated files simply because they were inspected.

Do not modify package manifests.

## Required tests

Preserve every existing frontend test.

Update or add focused tests proving:

1. an image continues to use the backend-provided `accessUrl` as its `src`;
2. the enclosing object link continues to use the same `accessUrl`;
3. an image has `loading="lazy"`;
4. an image has `decoding="async"`;
5. no raw Wasabi URL construction is introduced;
6. existing video rendering remains unchanged;
7. ordinary non-image file behavior remains unchanged.

Prefer extending the existing `File.test.js` rather than introducing a new test architecture.

Do not weaken existing tests to make the change pass.

Known React `act(...)` warnings elsewhere may remain unless this task directly changes the responsible test.

Do not turn Task 8A into broad test cleanup.

Run:

`npm run test:ci`

`npm run build`

Also run:

`git diff --check`

## Performance measurement boundary

Manual browser performance measurement is performed against the stable Firebase `test` environment using browser developer tools.

Do not add:

- application analytics;
- permanent benchmark code;
- performance telemetry;
- new browser instrumentation dependencies.

Copilot must not invent baseline or after-change measurements.

If measurement results have not been supplied, report them as not yet measured.

The principal measurement is initial/pre-scroll image network activity.

Remember:

- lazy loading changes when an original image downloads;
- it does not reduce the byte size of that original image;
- total bytes after scrolling through every image may remain similar.

## Task 8A explicit non-goals

Do NOT during Task 8A:

- modify the backend;
- modify API responses;
- modify backend presigned URL generation;
- modify the `AccessUrl` lifetime;
- build `AccessUrl` refresh logic;
- change object privacy;
- change Wasabi bucket policies;
- add thumbnail generation;
- generate derived images;
- add SNS;
- add SQS;
- add another Lambda function;
- add another AWS service;
- add a CDN or CloudFront;
- add image-processing infrastructure;
- add an image library;
- add a lazy-loading library;
- add `IntersectionObserver`;
- change video preload behavior;
- redesign file cards;
- redesign the UI;
- change page-size choices;
- change pagination;
- modify MSAL/Entra;
- modify authentication or authorization;
- modify request cancellation;
- migrate Create React App;
- upgrade React;
- add TypeScript;
- perform dependency modernization;
- run `npm audit fix`;
- modify Firebase configuration;
- modify GitHub Actions workflows;
- implement an image viewer;
- implement previous/next image navigation;
- perform unrelated cleanup or formatting.

Task 8A must remain a very small frontend performance PR.

## Git/change-management

`master` is protected.

Use:

`perf/lazy-image-loading`

Never implement or commit directly on `master`.

Before editing, verify the current branch and starting SHA.

Do not reset, overwrite, or discard existing user work.

Do not force-push.

Do not push, merge, deploy, or promote production unless explicitly instructed.

Keep the diff narrowly scoped.

If commits are explicitly requested, suitable focused messages are:

`perf(frontend): defer offscreen image loading`

`test(frontend): cover lazy image rendering`

A single small cohesive commit is also acceptable if that produces a clearer review.

Do not mix unrelated cleanup into the Task 8A commits.

## Deployment and rollback context

After review and merge to `master`, the existing workflow automatically builds, tests, and deploys to Firebase `test`.

The owner will then repeat browser performance measurements and functional regression testing.

Production promotion remains a separate manual exact-SHA action.

Rollback uses the existing production workflow to promote the previous known-good frontend `master` SHA.

No backend deployment or rollback is expected for Task 8A.

## Completion report

After implementation, stop and report:

- branch name;
- starting/base SHA;
- current HEAD SHA if different;
- files changed;
- exact image element change;
- confirmation that image `src` still uses the supplied `accessUrl`;
- confirmation that object `href` still uses the supplied `accessUrl`;
- confirmation that video code was not changed;
- tests added or modified;
- exact `npm run test:ci` result and test counts;
- exact `npm run build` result;
- `git diff --check` result;
- `git status --short`;
- confirmation that package files were unchanged;
- confirmation that workflows were unchanged;
- confirmation that CSS/layout was unchanged unless explicitly necessary;
- confirmation that MSAL/Entra, pagination, request cancellation, backend contract, and `AccessUrl` architecture were unchanged;
- baseline/performance measurement results only if they were actually supplied or performed;
- any observed risk involving `AccessUrl` expiry;
- any remaining issue.

Stop after Task 8A.

Do not automatically implement Task 8B, change video loading, design thumbnails, or add infrastructure.