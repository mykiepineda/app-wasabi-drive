# Wasabi Drive Frontend - GitHub Copilot Instructions

## Ownership and working agreement

Wasabi Drive is an existing deployed personal application and an incremental engineering learning project. The human owner approves architecture, code scope, Git operations, and deployment. ChatGPT scopes and reviews; GitHub Copilot implements approved, narrowly scoped work.

Treat the current local repository as authoritative. Inspect the branch, clean/dirty working tree, current commit, and latest code before making edits. The reference snapshot in the owner's review is `app-wasabi-drive-master (24).zip`, with embedded commit `f371b6447f3ca8519c9f6a40f3be31fb197d7a64`; this does not independently prove deployed production state. If the working clone differs materially, report the differences before changing anything. Do not discard existing edits.

Work on a focused task branch based on current `master`, not on `master` itself. Do not commit, push, open a PR, merge, access live Wasabi, edit credentials, or deploy without explicit permission. A merge into `master` can automatically trigger the TEST deployment, so it is not a harmless review action.

## Current approved task: Phase 8D-A - Local frontend photo-grid layout trial

Phase 8C's original 13-photo thumbnail rollout is completed, deployed, and owner-validated. Do not reopen generation, migration, or operational verification. The owner's approved next step is to **try a fixed-width, nearly square photo/file preview grid in the frontend** before deciding whether a new physically cropped thumbnail recipe is justified.

- Frontend-only, minimal, reversible CSS change; preserve all backend and deployed data contracts.
- The owner wants a Google Drive-like grid in which a card does not keep growing as browser width increases. More columns should fit on wider screens; cards should wrap into fewer columns on narrow screens.
- Initial target: a roughly **200 x 190 CSS pixel image preview area** (ratio 20:19, about 1.05:1). Existing 7px card margin and 1px border suggest a ~216px CSS grid track; use the actual computed layout rather than hardcoding unverified assumptions.
- Use the existing browser `object-fit: cover` with **centered crop** (`object-position: center`) to preview the appearance. Preserve the existing label/filename area below the preview. It is acceptable that the complete card is taller than 190px.
- Card dimensions should be stable at normal desktop/tablet widths. On a viewport narrower than one card, the card should be allowed to shrink to fit without horizontal page overflow; avoid gratuitous breakpoints.
- Keep card rows left-aligned rather than distributing leftover width across cards.
- Apply to the **Files** grid first, including its existing image and non-image file cards. Keep Buckets and Folders layouts unchanged unless the owner approves a separate follow-up.
- No new derivative images, altered WebP quality, server APIs, local generation or viewer-preview features in this task. CSS cropping does not reduce file transfer bytes. Do not claim a performance improvement without measurement.

Suggested branch: `experiment/fixed-photo-grid-cards`.

## Frontend architecture and access/security invariants

Keep React 18, JavaScript, Create React App (`react-scripts` 5), current CSS Modules, Firebase Hosting, existing API and routing, Microsoft Entra authentication, MSAL (Microsoft Authentication Library), bearer token API client, and current TEST/PRD deployment setup. Do not introduce new CSS frameworks, component libraries, state management, or build tools.

Identity flow: React single-page application (SPA) -> MSAL -> Microsoft Entra -> OAuth 2.0 API access token -> API Gateway -> Express backend authentication -> application authorization -> private Wasabi.

- Authentication and server-side authorization remain backend responsibilities. CSS, frontend state, and CORS (Cross-Origin Resource Sharing) are not security controls.
- `AccessUrl` and `ThumbnailAccessUrl` are private, expiring signed URLs supplied by the authorized API. Never construct, rewrite, log or expose their full query strings; do not introduce browser-side Wasabi or S3 credentials or storage SDKs.
- Existing cards preview `ThumbnailAccessUrl` when provided; the card opens the unchanged original `AccessUrl`. Thumbnail failures have a bounded original fallback. Preserve `href`, `target`, `rel`, `alt`, `loading="lazy"`, `decoding="async"`, state reset on changed URLs and identity, and the missing/unavailable-preview behavior.
- Do not change Microsoft Entra/MSAL, API calls, pagination, continuation token handling, loading or error states, signed URL expiration, bucket permissions, backend generation or signing, or any production/test configuration.
- Preserve video and non-image file handling, filenames, tooltips, and click targets. Do not silently add new image extensions.

## Source integration points - verify in the working clone

The reference snapshot includes:

- `src/components/main/Files.module.css`: `.files` currently uses `grid-template-columns: repeat(auto-fill, minmax(220px, 1fr))`; the `1fr` lets tracks stretch across available horizontal space.
- `src/components/main/File.module.css`: `.card-container` has fixed 150px height; `.foreground img, .foreground video` use `object-fit: cover` and `object-position: top`; `.container` has 7px margin, 1px border and box-sizing border-box.
- `src/components/main/Files.jsx`: creates cards from a file list; supplies thumbnail and original URLs.
- `src/components/main/File.jsx`: renders preview and card link, including fallback behavior; do not modify unless CSS alone cannot meet the approved UX.
- `src/components/main/Folders.module.css` and `Buckets.module.css` have similar expanding grids but are out of scope for this trial.
- `src/components/main/Contents.module.css` has page/object padding, which limits usable width on narrow viewports. Check small-screen overflow when validating CSS.

Preferred source edit scope: `Files.module.css` and `File.module.css` only, plus this instruction file. If actual source requires a small JSX or test change, explain its need before expanding. Avoid touching `package.json`, lockfiles, workflows, env files or backend.

## Acceptance criteria

1. At normal browser widths, the file card and preview do not widen merely because more horizontal space becomes available.
2. Cards add/remove columns and wrap as the viewport changes; extra space stays at the row end rather than stretching cards.
3. Initial preview width/height is approximately 200 x 190 CSS pixels, with centred CSS cropping. The filename bar stays underneath and is not clipped.
4. The grid has no horizontal page overflow at small viewport widths, including where the content container becomes narrower than a standard card.
5. Landscape, portrait and already square previews fill the same frame. Physical image files and `ThumbnailAccessUrl` remain unchanged.
6. The existing loading/error, fallback, original-opening behavior, video/non-image cards, and pagination remain unchanged.
7. Existing tests pass and build succeeds. Do not alter tests just to get a green result. Tests in JSDOM do not demonstrate actual layout; require **owner-operated browser inspection** before deciding whether to proceed.

## Checks and owner-operated manual review

Use Node.js 24 in the owner's local clone. Run:

```powershell
npm run test:ci
npm run build
git diff --check
git status --short
```

If configured for local frontend testing, the owner can use `npm start`; it starts a local development server, not a Firebase deployment. Never execute `npm run deploy:test`, `npm run deploy:prd`, `firebase deploy`, cloud operations, or live API tests autonomously.

For the owner's local visual inspection, provide a checklist for responsive widths around 1440, 1024, 768, 430, 375, and 320 CSS pixels, plus browser resizing and zoom. Test a populated folder with landscape and portrait images, an image without a verified thumbnail, a mixed non-image/video card, a long filename, and a small-file-count last row if accessible. The owner may choose to load their authorized private content locally; Copilot must not fetch it independently. Observe dimensions, wrapping, alignment, image cropping, missing previews, and horizontal overflow. Use the browser Network panel only if relevant, and never share unredacted signed URLs or private paths.

## Rollout and decision gate

This trial changes only frontend presentation; a CSS revert restores the previous grid. Keep the application deployable. Stop after code/test results and the owner's local visual review request; do not merge or deploy without approval. The owner's acceptance of layout will trigger a **separate design and approval gate** for any new centre-cropped physical thumbnail recipe (new immutable version, backend scope/signing compatibility, preservation of existing v1 data). The planned Photo Viewer is a future-feature handoff item, not part of Phase 8D.

Completion report: branch/base SHA, changed files, measured/computed card dimensions if available, implementation summary, actual test/build results and warnings, `git diff --check`, `git status --short`, unverified browser cases, and exact owner decisions requested. Do not present a simulated screenshot or claim browser verification if not performed.
