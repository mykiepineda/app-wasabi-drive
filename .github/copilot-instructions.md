# Wasabi Drive Frontend — GitHub Copilot Instructions

## Ownership and working agreement

Wasabi Drive is an existing deployed personal application and an incremental cloud-engineering learning project. The human developer is the technical owner and architectural decision-maker. ChatGPT helps with architecture, scoping, review and prompts; GitHub Copilot in VS Code on the owner's personal laptop helps implement approved, narrowly scoped code changes.

Treat the checked-out repository as authoritative. Before changing code, inspect the latest `master`, current branch, working tree and commit SHA. Do not assume the historical snapshot used to write these instructions is still current. Stop and explain material differences rather than overwriting newer work. Do not discard uncommitted work. No changes directly on `master`.

Do not independently implement adjacent roadmap items or redesign the application. Preserve the existing deployable application and established tests. Do not make commits, push, create PRs, merge, access live Wasabi resources, change secrets, or deploy unless explicitly authorized. Review terminal commands for unintended cloud or Git side effects.

## Current approved task: Phase 8C-D2 — Photo-grid thumbnail consumption

The Phase 8C-D1 backend is deployed to TEST with `THUMBNAIL_API_ENABLED=true`. Owner-reported TEST checks confirm only two approved source objects receive `ThumbnailAccessUrl` and that signed WebP URLs retrieve successfully while unsigned access is denied. Do not rerun the completed thumbnail generation or modify the backend.

Implement a **frontend-only additive** change: for recognized image cards, prefer the optional backend-provided `ThumbnailAccessUrl` for the grid preview. Always retain the original backend-provided `AccessUrl` as the file-opening link. Objects without thumbnails must look and behave as before.

Suggested branch: `feature/photo-grid-thumbnail-integration` based on current frontend `master`.

The frontend archive used as reference was `app-wasabi-drive-master (23).zip`, archive SHA `5bdad1a93b78c02133b2f3d694dbb15305bab840`. This is a source snapshot, not proof of deployed state or latest remote `master`.

## Architecture and security invariants

Preserve React 18, JavaScript, Create React App (`react-scripts` 5), Firebase Hosting, the existing CSS and visual layout, Microsoft Entra login, MSAL (Microsoft Authentication Library), the existing bearer-token API client, and separate TEST/PRD deployments.

Preserve the identity and access flow:
React SPA -> MSAL -> Microsoft Entra -> OAuth 2.0 API access token -> API Gateway -> Express authentication -> application authorization -> private Wasabi object.

- Authentication establishes the caller's identity; backend authorization determines what that caller may access.
- CORS (Cross-Origin Resource Sharing) is a browser access policy, not authentication.
- `AccessUrl` and `ThumbnailAccessUrl` are temporary signed bearer URLs. Never log, print, persist, share or instrument their full query strings.
- Neither URL is a client secret or a stable public object path. Use only values received from the authorized backend response. Never construct raw S3/Wasabi URLs, never sign in the browser, and never add browser-side Wasabi credentials or storage SDKs.
- Do not modify MSAL, Entra, API authorization, region lookup, original URL generation, signed URL lifetimes, API Gateway, backend, bucket policies or any cloud configuration.

## Confirmed frontend integration points in the reference snapshot

- `src/pages/Home.jsx` maps `body.Contents` to `{ key, description, accessUrl }` and preserves abort/cancellation, mutually exclusive loading/error/content, breadcrumbs and continuation-token pagination.
- `src/components/main/Files.jsx` passes each file's props to `File` using a stable `key={file.key}`.
- `src/components/main/File.jsx` uses `<img src={accessUrl} alt={description} loading="lazy" decoding="async" />` for recognized image file extensions; the enclosing `<a href={accessUrl} target="_blank" rel="noreferrer">` opens the original. Video rendering and non-image icon handling are separate.
- `src/components/main/File.test.js` already tests original links, image attributes, video source and safe behavior when `AccessUrl` is absent.
- `src/pages/Home.access.test.js` tests mapping from the backend response; inspect its existing mocked `Contents` component before extending it.

Check these facts in the **current working clone** before implementation.

## Functional requirements

1. In `Home.jsx`, map the optional API field `ThumbnailAccessUrl` without changing the existing object data, pagination or API request flow. A consistent local property such as `thumbnailAccessUrl` is sufficient.
2. In `Files.jsx`, pass the optional value through to `File`, preserving `key={file.key}` and the existing `accessUrl`.
3. In `File.jsx`, for an existing recognized image card, prefer a usable `thumbnailAccessUrl` as the preview `img.src` when present. The card link **must remain `href={accessUrl}`**, never the thumbnail. Preserve `target`, `rel`, `alt`, `loading="lazy"`, `decoding="async"` and current CSS.
4. If the thumbnail image reports a load error, try the supplied original `accessUrl` **once** for ordinary browser-supported image formats. If the original preview also fails, show a finite unavailable-preview state (the existing file icon can be used) rather than a retry loop or broken-image churn. The original link remains unchanged.
5. When file identity and/or signed URL props change, reset previous image-error/fallback state. In particular, do not let failure from the previous object or expired signature poison a refreshed file card. Use the smallest reliable approach (state keyed by identity/URLs, or a focused preview child if needed).
6. If `ThumbnailAccessUrl` is absent, preserve the pre-existing preview behavior. If either field is missing or malformed, do not invent alternative object locations. Do not use thumbnail URLs for video, downloads, links, or file types that the component does not already render as images.
7. The current production pilot is JPEG-only. Do not silently introduce CR2/RAW or JFIF previews, and do not assume that all formats supported by the thumbnail generator are supported by a browser. Leave existing format classification unchanged unless a concrete directly related test exposes a bug.
8. Do not request thumbnails separately. The backend already supplies the optional field in the authorized object-list response. Do not add metadata HEAD requests, existence probes, image APIs, caches, analytics, external libraries, workers or frontend feature flags.
9. The API's one-hour signed URLs may expire in a long-open page. A thumbnail->original fallback is not an expiry-refresh strategy. Record the limitation without implementing automatic URL refresh in this task.

## Required tests

Use synthetic, non-live signed-URL fixtures (e.g. `https://objects.example.invalid/...?X-Amz-Signature=fake-*`). Never embed real signatures, private filenames, credentials or photo paths.

- API response mapping: `Home.jsx` carries `ThumbnailAccessUrl` through to file data without losing `AccessUrl`.
- A JPEG card with both URLs uses the thumbnail `img.src` while `<a href>` remains the original.
- Cards without a thumbnail keep the original preview and link unchanged.
- An image error on the thumbnail falls back to the original once; error on the original enters a bounded unavailable-preview state with no loop.
- Changed `file.key` and/or new signed URL props reset error state and allow a new preview attempt.
- Keep `alt`, lazy loading and async decoding; do not change the video source or non-image cards.
- Missing original `AccessUrl` must not cause client-side construction of raw object URLs.
- Preserve existing pagination, stale-response cancellation, auth and access tests. Do not weaken tests to pass, and do not replace focused assertions with snapshots merely to avoid behavior checks.

Preferred files: `src/pages/Home.jsx`, `src/components/main/Files.jsx`, `src/components/main/File.jsx`, `src/components/main/File.test.js`, `src/pages/Home.access.test.js`, minimal `README.md` section and this instructions file. Add a focused `Files` test only if that is the smallest reliable way to prove prop forwarding. Do not touch `package.json`, package-lock, workflow YAML, build tooling, environment variables or unrelated CSS.

Run locally with Node.js 24:

```powershell
npm run test:ci
npm run build
git diff --check
git status --short
```

Report actual results and warnings. No live Wasabi calls or deployments are needed for mocked implementation tests.

## Deployment, validation and rollback context

- `master` is protected. Work on a focused task branch and submit changes for owner review before a PR/merge.
- The frontend `master` merge triggers existing GitHub Actions tests/build and Firebase TEST deployment; do not merge until reviewed.
- Production remains a separate manual exact-commit-SHA promotion after TEST validation and production backend operational gates.
- In browser TEST validation, check that only the two approved sample images request WebP preview URLs; opening each card still loads the original. Keep Network screenshots/HAR exports sanitized because signatures and private paths may appear.
- For performance, capture comparable TEST before/after network evidence; two images demonstrate wiring but are not a statistically meaningful production performance result. Production 13-photo before/after measurement is a separate later gate.
- Roll back frontend by promoting the previous known-good frontend commit; older frontend code ignores `ThumbnailAccessUrl`. New frontend code must tolerate it being absent if the backend feature is disabled.
- Do not change the 13-photo production backfill, v1 keying or recipe, checkpoints, credential policies, image viewer UX, video expiry, React framework, styling framework or broader roadmap.

## Copilot completion report

Stop after this task and report: branch/base SHA; changed files; exactly where thumbnail data is mapped/passed/rendered; original-link preservation; error fallback and state reset behavior; relevant tests and exact test counts; build result; `git diff --check`; `git status --short`; any signed-URL expiry limitation; anything not verified. Leave changes uncommitted unless the owner expressly directs otherwise. Do not push, merge, deploy or access live resources.
