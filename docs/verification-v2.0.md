# Executed release verification

Release: **2.0.0** · Date: **2026-10-14**

## Environment and reproducibility

Linux managed workspace, Node.js **24.19.0**, npm **11.9.0**, TypeScript **5.9.3**, Vite **7.3.7** and Vitest/V8 coverage **4.1.11**. The exact dependency resolution is committed in `package-lock.json`. No environment secret or private workspace file is needed to build the application.

An independent project copy was created without `node_modules`, coverage output or workspace runtime files. `npm ci` installed **213 packages**. Tests, strict TypeScript, build, production DOM execution and npm audit succeeded there. The final UI report/table change and its regression assertion were synchronized into that copy and the tests/typecheck/build/production check were repeated successfully. The delivered production assets come from that clean build; final source/test/script/asset files and build configuration were byte-compared with the clean verified copy.

## Completed checks

| Check | Result | Evidence |
| --- | --- | --- |
| Clean dependency installation | PASS | `npm ci`, 213 packages installed from lockfile |
| Original scientific tests | PASS | 93 tests; original invariants, ranges and inverse conversions retained |
| Reference regressions | PASS | 13 tests; eight half-lives/masses, source links, isomer state and year conventions |
| Export and formatting tests | PASS | 15 tests; CSV precision/escaping, report contents, download and error orchestration |
| Original React DOM workflows | PASS | 16 tests; original pages, forms, validation, SVG curves and theme behavior |
| Advanced numerical/data tests | PASS | 55 tests; reproduced defects, inverse uniqueness, intervals, chart/table consistency, stable unit changes, sharing validation, records and Arabic reports |
| Advanced React DOM workflows | PASS | 20 tests; inverse inputs, local save/reopen/share, reset, Arabic RTL, library, learning, interval mass results, inspection/zoom, eight curves, copy and scientific print report |
| Total automated tests | PASS | **212 passed, 0 failed**, six files; successful clean-copy run |
| Strict TypeScript | PASS | `npm run typecheck`; also enforced by build |
| Production build | PASS | Vite emitted static-host assets and generated portable HTML |
| Production JavaScript execution | PASS, DOM emulator | `npm run verify:build`; all 12 routes, one-half-life results, three distinct comparison curves, inferred half-life, interval table, Arabic RTL and real SVG embedded in report |
| Portable resource independence | PASS | No external script or stylesheet dependencies; CSS, JavaScript and favicon embedded |
| Dependency advisory check | PASS at check time | `npm audit --audit-level=low`, zero vulnerabilities across production and development dependencies |
| Final source consistency | PASS | Source/tests/scripts/assets and build config match the independently verified clean copy |
| Release archive integrity | PASS | ZIP CRC check and required-file checks performed before delivery |

The build entry JavaScript is approximately **691 kB**, or **212.5 kB gzip**. CSS is approximately **34.9 kB**, or **7.8 kB gzip**. The portable HTML is approximately **727 kB**.

## Coverage

`npm run test:coverage` was executed with V8 instrumentation. Its included scope is `src/science/`, `src/utils/` and `src/data/`, not every UI component.

| Instrumented scope | Lines | Branches | Functions |
| --- | ---: | ---: | ---: |
| All included modules | 99.35% | 89.14% | 97.29% |
| Scientific modules | 100% | 91.87% | 100% |
| Reference database | 100% | 100% | 100% |

These percentages describe the executed coverage run. They do not establish visual correctness, browser compatibility or rasterization accuracy.

Core numerical cases include zero/one/two half-lives, half-life/rate consistency, activity/nuclei and mass/activity round trips, time-target inversion, dimensional unit checks, near-equal activities, extremely short/long half-lives, subnormal survival/loss fractions, premature ratio overflow, underflow explanations and invalid/nonfinite input handling.

## Warnings and resolved development failures

Vite emits a **non-failing chunk-size advisory** because the single minified application chunk exceeds the configured 650 kB threshold. Keeping one bundle allows the self-contained offline HTML; its compressed JavaScript is approximately 212.5 kB. Real-device performance profiling was not available.

`npm ci` reports a transitive development-only `whatwg-encoding` deprecation from jsdom. It is not an npm audit vulnerability. npm also reports an unknown `http-proxy` environment setting supplied by the workspace, not this project.

An initial dependency check failed while version updates and lockfile synchronization were in progress; the final lockfile and clean installation pass. New assertion expectations for Arabic labels/number formatting and a production-smoke dropdown selector were corrected during development. All final checks above pass. See [review-report.md](review-report.md) for the reproduced application defects and fixes.

## Unavailable checks — no success claim

**Real-browser visual QA was not executed.** The required Sites browser-control capability was unavailable in this managed environment. No visual screenshot review, real mobile/desktop-device test, pixel inspection or real-browser accessibility/performance audit is claimed. No preview server was started under the unavailable managed browser path.

**Real SVG-to-PNG rasterization and browser download completion were not executed.** PNG Blob/canvas orchestration, filenames, calls and error propagation were exercised with mocked Canvas/Image APIs. Those tests prove the implementation path, not the pixels in an actual browser-generated PNG. CSV and scientific HTML contents were inspected directly and their download buttons exercised in DOM tests.

**The actual browser print/save-as-PDF dialog was not executed.** Reports have an A4 print stylesheet and a Print/PDF action. DOM tests verify report inputs, steps, table and the actual chart surface in the print frame. PDF creation uses the user's browser Save as PDF feature; no standalone PDF generator is advertised.

**GitHub-hosted CI/Pages and public deployment were not executed.** Both supplied workflows run npm ci, tests, TypeScript, build and production DOM verification. Publishing requires the repository owner to enable GitHub Pages and run the workflow. No public repository or deployment was created.

## Re-run checks

```bash
npm ci
npm test
npm run typecheck
npm run test:coverage
npm run build
npm run verify:build
npm audit --audit-level=low
```

For actual browser QA, open `dist/nuclear-decay-lab.html` or run `npm run preview`. Check English/Arabic, both themes, narrow/wide viewports, keyboard chart navigation, hover/tap inspection, linear/log scale, zoom and curve visibility. Download CSV/PNG/HTML and open each result; use Print/PDF and inspect the saved PDF pages. Test local storage/clipboard behavior under the browser's chosen permissions.

## Physical limits

Single parent nuclide/isomer, closed sample, constant half-life. No daughter ingrowth, full chain, dose, shielding, transport or biological clearance is calculated. Reference uncertainties are displayed without propagation. Nuclei results are ensemble expectations. Numerical underflow and unavailable derived quantities are explained rather than treated as exact physical disappearance.
