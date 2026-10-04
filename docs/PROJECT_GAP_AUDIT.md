# Project gap audit

Reviewed and updated: 2026-10-03. Scope: source, tests, `docs/PRODUCT_SPEC.md`, and local Docker verification.

## Resolved findings

| Original finding | Resolution |
| --- | --- |
| No project README | Root `README.md` now documents requirements, architecture, local and Docker setup, variables, provider setup, worker, export, tests, deployment, and troubleshooting. |
| Raw Google Places response and unused photo preview | Settings now shows a readable live Places review with photo attribution and an owner confirmation action for address, phone, and coordinates. The photo is a transient preview. The Google image strategy selects owner uploads first, then portable fallback imagery. Full regeneration retains owner uploads. |
| No page management | The editor can add, rename, reorder, and remove pages. URLs are normalized and checked for uniqueness; links to renamed or removed pages are updated. |
| Dead internal links | Saves and exports reject links to missing pages or anchors with a client visible error. Generated content gets a link repair pass before persistence. |
| Mock dashboard thumbnails | Ready project cards embed the saved homepage preview. In progress cards show their status. |
| Standalone submissions missing from workspace inbox | The exported package includes `export-contacts.mjs` and a `contacts:csv` command. The inbox and both READMEs explain where standalone messages are stored and how to retrieve them. |
| Settings only partly affect site | The form exposes language, style, color mode, image strategy, voice, page target, and business details. Current site language, owner facts, and theme update immediately; the UI explains which settings require regeneration to change existing copy. |
| `LocalBusiness` omitted for owner facts | Structured data accepts `USER_PROVIDED` and `VERIFIED` business facts, while excluding `AI_GENERATED` claims. |
| Place coordinates unused | Owner confirmed coordinates become site facts and drive the renderer's Maps link. |
| Image files accumulate | Image regeneration removes the replaced image from the current site's library. Cleanup checks current sites, revisions, jobs, and duplicate project ownership before deleting files. Project deletion removes files that no other project owns. |

## Verification

- Linux Docker production build: passed.
- TypeScript and ESLint: passed after final source changes.
- Vitest unit suite: 13 passed.
- Database backed integration suite: 1 passed, using temporary asset and export directories.
- Docker smoke: passed health, signup, worker generation, preview, images, and ZIP export.
- Standalone export: served HTML, stored a contact submission, and exported it as CSV.
- Browser acceptance: pending Playwright browser image download and run.
- Live OpenAI, Pexels, Google Places, and ComfyUI accounts were not supplied, so external provider behavior remains unverified. Demo mode and provider fallback paths were exercised.

The build emitted Better Auth warnings while prerendering without runtime secrets. The running Docker app used `.env` and passed health and smoke checks.
