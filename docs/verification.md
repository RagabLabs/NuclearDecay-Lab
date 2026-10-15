# Executed release verification

**NuclearDecay Lab 2.1.0 — Scientific Validation Release · 14 October 2026**

This report records executed checks and distinguishes automated numerical/DOM verification from unavailable real-browser validation. The release is prepared for review; complete end-to-end validation is not claimed.

## Environment

Linux managed workspace; Node.js **24.19.0**, npm **11.9.0**, TypeScript **5.9.3**, Vite **7.3.7**, Vitest/V8 **4.1.11**. Dependency versions remain pinned in `package-lock.json`. A clean verification copy excludes `node_modules`, previous builds, coverage and private runtime files. It installs from the lockfile and executes the required test/build commands. Final source and production files are byte-compared with that copy.

## Actual results

| Check | Result / evidence |
| --- | --- |
| Baseline suite before changes | **212 passed, 0 failed**, six files, actually re-executed |
| Selected before/after regressions | 13 selected assertions fail against baseline; same 13 pass on revised source. Includes new display/disclosure requirements, not thirteen arithmetic defects |
| Added tests | **97**: 84 scientific validation, 10 scientific UI, 3 explicit boundaries |
| Final automated suite | **309 passed, 0 failed**, nine files |
| Independent oracle | **19 forward cases + 3 inverse input sets**, 160-digit Decimal; exact fixture reproduction with `--check` |
| Dependency installation | `npm ci`; **213 packages**, from the committed lockfile |
| Strict TypeScript | `npm run typecheck`, pass; also enforced by production build |
| Production build | `npm run build`, pass; static assets + self-contained offline HTML |
| Production execution | `npm run verify:build`, pass in **jsdom**, all twelve views, source-consistent C-14 results, comparison curves, inverse half-life, interval table, actual SVG in report and Arabic RTL; no captured runtime errors |
| Existing GitHub Pages namespace | JS/CSS/favicon resolve to present files under `/NuclearDecay-Lab/`; actual hosted entry executes at the repository URL with deep hash route `#/half-life` in DOM simulation |
| Export content/orchestration | CSV precision, quoting, range flags, source metadata and report inputs/units/uncertainty/steps/chart checked; PNG/print orchestration tested as described below |
| Advisory database | `npm audit --audit-level=low`, **0 vulnerabilities reported at check time** |
| Clean rebuild | Required commands pass in an independent copy with fresh dependencies; final source/build files match |
| Repository/archive checks | `git diff --check`, required release files and ZIP CRC integrity pass |

The original suites remain: science 93, reference data 13, exports 15, app DOM 16, advanced science/data 55 and advanced app DOM 20. Independent inverse fixtures test all seven outputs rather than computing expected answers with the application itself. Numerical/physical test design and tolerance policy are detailed in [SCIENTIFIC_VALIDATION.md](SCIENTIFIC_VALIDATION.md).

## Coverage actually executed

`npm run test:coverage` ran all 309 tests with V8 instrumentation. Included scope is `src/science/**`, `src/utils/**`, `src/data/**`; UI components are not included. The emitted summary reports **98.64% lines, 89.91% branches, 96.32% functions, 92.48% statements** across the included scope. Instrumented scientific-module lines are 100%; this does not establish reference-data truth, browser behavior or absence of defects. Static constant/data tables still require the independent source checks described in the audit.

## Production files and warnings

The build emits one application JS chunk approximately **716.92 kB** (**219.96 kB gzip**), CSS **35.33 kB** (**7.86 kB gzip**) and portable HTML **753,133 bytes**. CSS, JS and favicon are embedded in the portable HTML; no external script or stylesheet is required. The single-bundle approach supports a direct offline file launch.

Vite emits a non-failing chunk-size advisory above 650 kB. npm reports the transitive development-only `whatwg-encoding` deprecation used by jsdom and an unknown `http-proxy` configuration supplied by the workspace. These are not failed tests or reported audit vulnerabilities. Real-device performance was not profiled.

Resolved development failures include copied executable symlinks (fixed by actual `npm ci`), test selectors that did not match optional/aria labels, simulated editing without focusing a compact field, duplicate new Arabic dictionary keys caught by TypeScript, a stale default-rate expectation in the production check and an updated precise CSV range flag. These failures are recorded separately from reproduced application defects; all final checks above pass.

## Unavailable checks — no success claim

- **Real-browser visual QA:** the required browser-control capability was unavailable in this managed environment. No actual mobile/desktop viewport review, screenshot inspection, real-device keyboard/touch behavior or browser accessibility/performance audit is claimed. DOM dimensions used by tests are simulated, not visual measurements.
- **Actual PNG rasterization and browser download completion:** Canvas/Image mocks verify SVG/Blob orchestration, filenames and failure handling. They do not establish PNG pixel correctness or browser permissions. CSV and HTML content and download-button paths were tested in DOM.
- **Browser print / Save as PDF dialog:** report HTML, A4 stylesheet, mathematical text direction and print-frame content are tested. The actual print dialog and PDF pages were not checked. PDF creation uses the user's browser; no separately generated PDF is advertised.
- **GitHub-hosted Actions/Pages:** no remote branch/PR, merge or public deployment was performed. Both workflows gate deployment on fixture check, tests, TypeScript, build and production DOM verification. Local asset/entry checks cannot prove a future hosted workflow run.

No currently reproduced calculation defect remains in the tested model. Remaining items are verification gaps and explicitly unsupported modeling features, listed in [SCIENTIFIC_AUDIT_REPORT.md](SCIENTIFIC_AUDIT_REPORT.md).

## Reproduce and finish browser review

```bash
npm ci
python3 scripts/generate-validation-fixtures.py --check
npm test
npm run typecheck
npm run test:coverage
npm run build
npm run verify:build
npm audit --audit-level=low
```

Normal `npm test` uses committed fixtures and does not require Python. Python is needed only to regenerate/check the independent oracle; GitHub runners include it.

Open `dist/nuclear-decay-lab.html` in an actual modern browser, or serve the production build with `npm run preview`. Review all twelve views, English/Arabic, both themes, narrow/wide layouts, keyboard/touch, isotope/unit changes, save/reopen/share/reset, linear/log scale, inspection/zoom/visibility, and error states. Download CSV/PNG/HTML and open each output; inspect actual PNG pixels and the browser-saved PDF. After approved publication, repeat at the existing repository URL and direct hash links.

The current scientific scope is a constant-rate, single parent nuclide/isomer. It excludes daughter ingrowth, full chains, dose, shielding, transport, biological clearance and radiation-risk evaluation. Declared first-order half-life contributions are not a combined uncertainty budget or confidence interval.
