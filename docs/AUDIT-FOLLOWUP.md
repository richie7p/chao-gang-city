# PDF audit follow-up — 2026-10-04

This file maps the 2026-10-03 portfolio audit to implemented changes and evidence. Repeated dependency/build findings in the PDF refer to the same remediation. Local checks use Windows, Node 22.23.2 and npm 10.9.8. CI runs the same install/lint/typecheck/test/build gates on Ubuntu and Windows, and production browser interactions on Ubuntu.

## Reproducible checks

```sh
npm ci
npm run lint
npm run typecheck
npm test
npm audit --audit-level=high
npm run build
npm run check:bundle
npx playwright install chromium
npm run test:e2e
```

`test:scaffold` and `test:domain` report separate suites. E2E runs Chromium desktop and a Pixel 7 viewport/touch context against the production build. Set `E2E_DEV=1` to exercise the development server. This is browser emulation, not physical-device certification. Screenshots and Playwright traces are retained for diagnosis.

## Shared fixes

- **Windows build P1:** the app environment wrapper resolves the installed Vite JavaScript entry and launches it with the current Node executable. It preserves environment precedence, signal and exit propagation, without command-shell interpolation. A regression test invokes `vite --version` through this wrapper; the standard `npm run build` is exercised in both OS jobs.
- **Typecheck/lint P2:** safely narrow router errors before reading their message; document the intentional opaque-token fallback in the connector catch. Existing lint rules and TypeScript strictness remain enabled. Test fixture directory links use Windows junctions; generic PWA tests run against an isolated empty fixture rather than inheriting this app's real share-card configuration.
- **Dependency P2 (repeated):** compatible lockfile updates remove the observed js-yaml/fast-uri/brace-expansion findings. Clean `npm ci` and current full-tree `npm audit` passed with zero findings. This is a dated scan, not a guarantee against future advisories; CI repeats the scan.
- **Build reproducibility:** generated `.vercel` output is excluded from version control and rebuilt by CI. Source assets, branding, platform middleware and app environment flags are retained.
- **Performance:** compiler-supported `createClientOnlyFn` imports remove browser renderers from the SSR graph. Named renderer/runtime chunks are cached separately. A bundle gate measures gzip transfer size (200 KiB per ordinary JS chunk) and checks that renderer chunks do not reappear in SSR. Raw-size Vite warnings remain visible; splitting does not eliminate total bytes or prove GPU performance.

References: [TanStack environment functions](https://tanstack.com/start/latest/docs/framework/react/guide/environment-functions), [Vite production chunking](https://vite.dev/guide/build).

## PDF pages 7–8

| Finding | Change / evidence | Status |
| --- | --- | --- |
| Windows wrapper failure | Shared fix and Windows/Ubuntu build gate | Addressed |
| Typecheck/lint failures, collision/engine whitespace | Strict typecheck; immutable locals; non-ASCII separator cleanup | Addressed |
| Collision, mission, vehicle coverage absent | 14 domain tests exercise actual engine methods without a GPU: wall/corner/coincident collisions, speed limits, brake stop, steering signs, vehicle occupancy, intro reward idempotency, passenger delivery and wanted-state completion. Coincident-body separation, braking overshoot and repeat rewards are fixed. Input edges now survive frames without physics and run once during catch-up steps, preventing touch interactions from toggling twice. Input tests check key edges, hidden-tab reset and listener disposal; rejected pointer lock falls back to drag-look | Addressed |
| Engine >500 kB and Three in server | Game engine is about 56 kB raw / 20 kB gzip, with independently cached Three about 525 kB raw / 131 kB gzip; Three is absent from SSR output. Engine load errors have an actionable fallback | Mitigated; device profiling remains |
| Desktop/mobile interaction evidence | Repository E2E starts the game, verifies left/right steering through production input, pauses and resumes, checks overflow and page exceptions | Automated coverage added |
| Real host asset/console policy | Requires the actual deployment response headers and host integration; no deployment performed | External verification |

## Remaining verification

Full manual mission playthrough (including NPC dialogue and shop), long-session memory/renderer disposal under load, hardware GPU frame time, physical touch/audio, deployed host policies and external asset provenance need device/owner/deployment evidence. Unit transitions are not an end-to-end completion claim.

## Local result

- Clean install, lint, typecheck (including tests), standard production build and bundle gate: passed.
- Scaffold: 150 script tests + 24 auth/connector tests passed.
- Product domain: 14 passed. Production E2E: 2 passed (desktop/mobile).
- Current full dependency audit: 0 vulnerabilities.
- Desktop/mobile screenshots inspected. Mobile instructions were moved above touch actions; E2E checks separation and taps the touch control to exit the car.
