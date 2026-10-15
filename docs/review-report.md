> Historical v2.0 review. For the current release, see [v2.1 scientific audit](SCIENTIFIC_AUDIT_REPORT.md) and [verification](verification.md). The original execution report is preserved in [verification-v2.0.md](verification-v2.0.md).

# NuclearDecay Lab 2.0 — review and delivery report

Date: **2026-10-14**. Scope: preserve the original scientific application, repair demonstrated defects, and implement the requested scientific and usability additions.

## What was actually found

The complete v1 ZIP contained **48 files**, including `src/`, tests, `dist/`, configuration and workflows. Its archive integrity and entry point were checked. The ten separately reviewed root files were an incomplete view of that package; the application source was not missing. The original **137 tests** passed before the upgrade.

| Reproduced issue | Before | Fix in v2 |
| --- | --- | --- |
| Quantized subnormal survival fraction | `activityDecay(1e300, 1, 1074.5)` gave `4.940656e-24 Bq` instead of approximately `3.493572e-24 Bq`, an approximately 41% overestimate | Evaluate activity in log space whenever its fraction is subnormal |
| Quantized tiny lost fraction | `activityDecay(1e300, 1e23, 1e-300)` gave approximately `4.940656e-24 Bq` lost instead of `6.931472e-24 Bq` | Calculate loss independently with stable `expm1` and a log-domain small-exponent fallback |
| Premature intermediate overflow | `t/T½` overflowed for `T½ = 0.8 s`, `t = Number.MAX_VALUE s`, although the decay exponent remained finite | Preserve the finite exponent/log activity and separately flag the unrepresentable half-life count |
| Unexplained numerical zeros | Positive activity loss or survival percentage could display zero at extreme scales | Explicitly distinguish underflow/rounding from exact physical zero |
| Report captured a decorative SVG | A generic first-SVG query could capture a toolbar icon | Serialize the `.recharts-surface` chart specifically; test that the actual curve appears in reports |
| Unstable display-unit conversion at large values | Multiplying by an SI factor before dividing could overflow for a representable final display value | Reuse the stable scientific unit converter; preserve the physical quantity when units change |
| Hidden inputs constrained mass-input calculations | An empty hidden initial-activity field could block activity-from-mass | Validate only the activity field required by the chosen mode |
| Untrusted share payload edge cases | Inherited object-property names could resemble unit keys; recursive/oversized data was insufficiently bounded | Validate own unit keys, depth, cycles, UTF-8 byte size, schema and payload version |
| Dependency advisories | npm audit reported five affected packages in the development/test dependency tree: three critical, one high and one moderate | Update Vite to 7.3.7 and Vitest/coverage to 4.1.11, synchronize the lockfile, reinstall and test; final audit reports zero vulnerabilities |

The half-lives, mass values and state/year conventions of all eight pinned nuclides matched the primary references. No isotope values were invented or silently replaced. Tc-99m retains its excitation-energy correction and AME2020/NUBASE provenance. See [reference-data.md](reference-data.md).

## Implemented additions

- Seven-mode inverse calculator with minimal required inputs, stable near-equal activity ratios, finite-solution and uniqueness conditions.
- Dynamic **Show Calculation Steps**, copy results, HTML scientific reports and A4 **Print / PDF** for calculation workflows. The unified report also includes its time table.
- Inclusive interval analysis with up to 1,000 points and five selectable physical variables; table and chart use the same points.
- Advanced 2–8 isotope comparison, individual/common activities, visibility controls, precise arbitrary-time inspection, linear/log scales, zoom/range controls, half-life/initial-activity markers and curve CSV export.
- English default and Arabic interface, RTL layout, LTR equations/units and persisted language preference.
- Save/reopen locally, validated encoded sharing, clear inputs, reset application data, selectable share links, result copying and reproducible examples.
- Searchable isotope library with provenance and direct opening in analysis; six interactive learning lessons.
- Complete source, tests, production assets, portable offline HTML, MIT license, contribution guidance and GitHub Actions checks/Pages deployment workflows.

## Final verification

**212 tests pass across six files.** Strict TypeScript, production build, coverage, production JavaScript execution and a clean-copy installation/rebuild are documented in [verification-v2.0.md](verification-v2.0.md). The instrumented science/data/export/session scope has **99.35% line coverage**; this is not a claim of complete UI/browser coverage.

The production portable app was executed in jsdom across all twelve routes, with one-half-life results, distinct comparison curves, inverse half-life, interval tables, Arabic RTL and the real SVG embedded in a scientific report. CSV/report contents and download orchestration were tested; SVG-to-PNG calls use DOM mocks.

During development, an initial install check found a temporarily out-of-sync lockfile after version changes; it was regenerated before the successful clean `npm ci`. Two new assertions initially expected an English label and ungrouped numerical formatting; they were corrected to the real Arabic/formatting behavior. The expanded production checker initially selected the language dropdown instead of the inverse unknown dropdown; its selector was corrected. There are no unresolved failures in the final executed checks.

## Explicit remaining verification and scope

1. **Real-browser visual and device QA remains unverified.** The required browser-control capability was unavailable in this managed environment. No screenshots, mobile-device measurements, pixel checks or real-browser performance claims are supplied.
2. **Actual PNG rasterization/download completion and the browser print/PDF dialog remain unverified.** The implemented paths and generated report/CSV contents pass DOM tests; Canvas/Image orchestration is mocked. PDF is produced through the browser's Save as PDF function, not a separate PDF engine.
3. **GitHub-hosted CI/Pages have not been executed or published.** Workflows and deployment instructions are included. No public repository or deployment was created.
4. Full decay chains, daughter ingrowth, dose, shielding, environmental transport and uncertainty propagation remain outside the implemented model, as requested. The app labels the single-parent scope explicitly.

No requested calculation mode is a placeholder. The remaining items above are explicit external/browser verification or declared physical scope limits.
