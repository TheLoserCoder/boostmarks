# Boostmarks project map

## Current state

This branch is a **foundation**, not a working bookmark manager yet. `app/` is the WXT/React/TypeScript extension; `src/`, `web-ext/` and `webpack.config.js` are unported legacy code from `main`, kept for reference. Do not import legacy modules directly into new use cases. The other remote branch, `master`, contains an even older prototype. Do not delete either branch without explicit approval.

## Architecture and boundaries

- WXT entrypoints live in `app/entrypoints/`: popup, manager, options and background. A content script will be added when opt-in capture is designed; do not request access to all URLs for an unused script.
- Group new behavior by capability under `app/features/`; keep domain rules and use cases free of React, Dexie, WXT and `browser.*` imports. Implement browser and IndexedDB interfaces at the outside edge, wired from entrypoints. Follow `clean-architecture` and `clean-code`.
- Native browser bookmarks are the source of truth for the ordinary tree. Dexie/IndexedDB will hold a cached projection, metadata and a bounded operation journal. UI should render the last saved projection before background reconciliation finishes. A private tree must be encrypted and separate from native bookmarks.
- External bookmark calls do not participate in Dexie transactions; reconcile external edits and folder descendant deletion explicitly. Full Google Drive synchronization of native bookmarks requires a separate conflict design.
- React performance: use `vercel-react-best-practices`; add virtualization, search worker and DnD only when their features are implemented and measured. Respect reduced motion and accessibility.

## Checks and development

- Install: `npm ci`. Local scripts: `npm run lint` (ESLint plus a 500-line physical file limit), `npm run check` (lint, TS, tests, Chromium and Firefox MV3 builds), `npm run test:e2e` (installed Chromium extension with isolated profile), `npm run test:firefox:lint` (Firefox package validator). Download isolated browsers with `npx playwright install chromium firefox`.
- Keep authored code files under **500 physical lines**, preferably much shorter; split by responsibility before hitting the limit. `scripts/check-file-length.mjs` covers `app/`, `src/`, `tests/`, `scripts/` and root code/config; ESLint enforces the same ceiling for maintained JS/TS. Generated artifacts (`.output/`, `.wxt/`, `web-ext/`), copied external skills (`.agents/`), Task Master metadata and `package-lock.json` are exceptions because they are not authored application code. Legacy `src/` still has the line limit but is excluded from style rules until ported. If a genuinely indivisible authored file ever needs an exception, document its path and reason here and make the checker exception explicit, not a blanket directory exclusion.
- Firefox **runtime** E2E is still pending Task Master task 7: Playwright's Chromium extension loader does not load Firefox add-ons. Use `web-ext run --source-dir .output/firefox-mv3 --firefox <path-to-firefox> --no-reload` with a fresh profile for manual checks; add automated Firefox installation and behavior assertions separately. Firefox lint is not a runtime test.
- Use `test-driven-development` on every feature, bugfix, refactor and behavior change: write a failing behavior test, observe the expected failure, write minimal code, run the focused test and full suite, then refactor. Use real components and hand-checked expectations; mock only slow/external boundaries. New DB operations need fake-indexeddb integration tests and real-browser verification.
- For UI review, fetch the current `web-design-guidelines` and check focus, semantics, keyboard access and contrast. Use `analytics-strategy` for local statistics measurement design; do not add telemetry by default.
- Task Master state lives in `.taskmaster/`; consult/update existing tasks instead of duplicating them. Use CodeGraph for substantial cross-file work and dependency impact, but verify against source and tests. Document important architecture decisions in this **root AGENTS.md**, not README.md.

## Test scope

`tests/unit/` uses Vitest/Testing Library. `tests/e2e/` launches the real Chromium extension using Playwright with a temporary profile. Firefox MV3 builds are validated by `web-ext lint` until runtime E2E is added. Future performance baselines must exercise 10,000 and 50,000 bookmark fixtures in both browsers.
