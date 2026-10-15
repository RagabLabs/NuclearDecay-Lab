# Scientific audit report — v2.1.0

**Date:** 14 October 2026. **Baseline:** v2.0 source at GitHub commit `91650716ab5f88612781c81e8c8cf40215bb64ab`, matching the previously delivered v2.0 application files. The public repository was cloned for comparison; no public update, merge or deployment was performed. A local branch, `scientific-validation-v2.1.0`, contains the review work.

The audit inspected actual engine, inverse equations, constants, unit utilities, all eight data records, formatting, all twelve views, chart data, reports, exports, sharing/storage and both GitHub workflows. Primary-source verification found **no confirmed reference-value error** in the selected isotope dataset. Carbon-14's reported 49.8172 MBq result is mathematically consistent with its pinned DDEP evaluation; its presentation required clearer precision and year explanations.

## Confirmed findings and implemented fixes

Severity reflects scientific/workflow impact within the supported model. There was no confirmed Critical issue. Categories distinguish arithmetic errors, workflow restrictions, display/documentation issues and maintenance improvements.

| Issue | Severity | Root Cause | Affected Files | Fix | Verification |
| --- | --- | --- | --- | --- | --- |
| **Arithmetic:** 1074.5 half-lives yielded about 4.94e-322% instead of the independently rounded 3.5e-322%; at 1075, a representable percentage became zero | High | Multiplying a quantized/underflowed binary64 survival fraction by 100 | `science/decay.ts`, `science/chartData.ts`, `components/TimeTable.tsx`, affected pages | Independently evaluate percentage in log space before rounding to binary64 | Decimal fixtures `subnormal-fraction`, `percent-rescue`; explicit boundary regressions fail on v2 and pass on v2.1 |
| **Arithmetic/display:** display-unit activity lost recoverable relative precision when SI Bq was subnormal | Medium | Converting an already quantized SI activity rather than its retained logarithm | `utils/format.ts`, `utils/export.ts`, `science/chartData.ts`, comparison/time pages | Normal values retain direct conversion; subnormal values recover the final display quantity from log activity | Independent `subnormal-activity` fixture checks µBq against Decimal scaling rather than a rounded Bq value |
| **Arithmetic:** mass-input workflow reported zero nuclei while positive activity was representable | High | `m × f` underflowed before the independently valid activity calculation | `pages/NucleiMassCalculator.tsx` | Derive nuclei stably; represent an unrepresentable positive count as unavailable, retain valid activity/mass and show explanation | Baseline UI showed `Radioactive nuclei 0` with positive activity; regression now requires unavailable nuclei and valid activity |
| **Arithmetic/workflow:** valid total mass could be rejected because intermediate isotope mass underflowed | Medium | Computing isotope mass first, then dividing by a small fraction | `science/decay.ts`, `pages/NucleiMassCalculator.tsx` | Evaluate the full nuclei-to-sample-mass expression in one log calculation, with fraction validation | N = 1e-300, M = 1 g/mol, f = 1e-100 gives ≈ 1.660539067e-224 g; baseline throws, boundary regression passes |
| **Workflow:** nuclei → mass required irrelevant half-life/activity | Medium | Shared converter path eagerly calculated λ/activity for a conversion needing only N, M and f | `pages/NucleiMassCalculator.tsx`, `components/IsotopeInputs.tsx` | Validate and compute only the required inputs; hide half-life in this mode | Cleared nuclei → mass form with N = Nₐ, M = 131 produces 131 g without a half-life; baseline UI assertion fails, revised assertion passes |
| **Workflow:** hidden bad molar mass or unrelated bad elapsed time blocked otherwise valid activity/target calculations | Medium | Eager validation of the whole shared sample object | `pages/ActivityCalculator.tsx`, `pages/NucleiMassCalculator.tsx`, `pages/TimeAnalysis.tsx` | Ignore unused mass inputs; target time independently resolves initial activity/half-life | Shared activity-only input with invalid hidden M remains usable; negative forward elapsed time does not invalidate the separate target calculation |
| **Display:** source-converted C-14 years and long chart fields looked artificially precise | Medium | Source uncertainty not tied to primary presentation; long raw conversions exposed without explanation | `components/NumericInput.tsx`, `components/IsotopeInputs.tsx`, chart/input components, `utils/format.ts` | Separate full stored/focused value from compact blur display; source half-life ± uncertainty, original unit, evaluation and numerical details | C-14 stores 5699.878260704236 y while showing 5700; focus/blur does not change physics, explicit typing of 5700 is distinguishable |
| **Display/documentation:** output digits could be mistaken for experimental accuracy | Medium | Uniform six-digit results without a declared connection to reference uncertainty | `science/precision.ts`, `utils/format.ts`, calculation pages, records/reports, English/Arabic disclosures | Reference-aware rounding from first-order half-life contribution only; separate numerical details and explicit absence of a combined uncertainty budget | Independent C-14 value retained; screen/table/inspection show 49.82, report numerical details retain 49817183.766… Bq; source uncertainty disclosed in both languages |
| **Export:** nonfinite values could be serialized as `Infinity`/`NaN` | Low | Generic CSV cells stringified nonfinite numbers | `utils/export.ts`, `pages/TimeAnalysis.tsx`, comparison pages | Explicit range flags; SI/log activity, independent percentage and reference metadata columns | Export regressions reject `Infinity`/`NaN` and verify subnormal percentage/underflow flags |
| **Maintenance improvement:** constants lived across calculation/data/unit modules | Low | No single definition/metadata catalogue | `science/constants.ts`, isotope/units/engine/inverse imports | Centralize definitions, measured/exact status, uncertainties, editions and uses; expose catalogue in documentation | Constant/source regressions, TypeScript, existing unit/reference tests; original reference central values unchanged |
| **Documentation/validation:** independent oracles and per-release evidence were incomplete | Low | Existing 212 passing tests did not cover every newly reproduced boundary; documentation reflected v2 precision policy | New scientific tests/fixtures, validation/audit/changelog docs, workflow files | Decimal oracle, new regressions, updated honest limitations and fixture checks before CI/deployment | Original 212 re-run; final 309 pass; both workflow build jobs gate deployment on fixture verification, tests, TypeScript, build and production DOM verification |

File paths above are relative to `src/` unless they explicitly name tests, docs or workflows.

## Carbon-14 decision and reference review

Retained **5700 ± 30 DDEP a**, original source date 2012-10-29, original 31,556,926-second source convention and all eight mass/half-life central values. The UI Julian year remains exactly 31,557,600 seconds. The historical 5730 ± 40 yr recommendation is a separate evaluation, not a unit correction. It was not used to force a 50 MBq result at 5730 UI years. See the fully reproducible example and primary sources in [SCIENTIFIC_VALIDATION.md](SCIENTIFIC_VALIDATION.md).

The database now explicitly records Z, A and ground/metastable state. Tc-99m's derived mass and ground-state-dominated uncertainty remain identified as such. The AME energy correction uses AME2020's published conversion constant, while the molar-mass constant uses CODATA2022; the editions and distinct purposes are explicit. A newer alternative evaluation is not automatically proof that the selected pinned evaluation is an erroneous transcription.

## Before/after evidence and development failures

- Original v2.0 suite actually executed: **212 passed, 0 failed**, six files.
- Initial independent boundary run reproduced percentage errors before fixes. A later isolated baseline copy ran **13 selected new assertions: 13 failed**. These include three arithmetic boundary assertions and ten UI precision/workflow/disclosure requirements. Their titles and first failure messages are preserved in `regression-evidence.json`; some fail because v2 lacked new disclosure attributes, not because its equations were wrong.
- The same three boundary assertions and ten UI requirements executed against v2.1: **13 passed**. Full final suite: **309 passed, 0 failed**, nine files; **97 added tests**.
- Development-only assertion failures were corrected: React field editing must focus a compact input first, optional labels require matching their actual accessible label, and the production smoke check must select an `aria-label` chart field. The hosted half-life assertion was corrected to the actual independently calculated default λ (`9.999048785457857e-7 s⁻¹`). These selector/expectation failures were not concealed as application calculation bugs.
- A copied dependency directory initially lost executable symlinks. Actual `npm ci` fixed the environment; final checks use installation from the committed lockfile.
- The CSV regression expectation was updated from a generic unit-range flag to the precise below-display-range flag. It does not accept a numerical zero as a positive underflowed activity.

All final execution evidence, warnings and coverage scope are in [verification.md](verification.md). No known reproduced calculation defect remains in the tested scope; this is not a guarantee that future defects are impossible.

## Page and export scope

All twelve routes execute in production DOM verification: Home, Complete Analysis, Activity & Target Time, Half-life, Nuclei & Mass, Time Analysis, Isotope Comparison, Inverse, Isotope Library, Learn Nuclear Decay, Scientific Documentation and About. React tests exercise forms, unit/isotope changes, save/reopen/share/reset, theme, Arabic RTL, curve inspection/visibility, CSV/report download orchestration and print-frame contents. The chart, table and report share central calculation values; visual rounding is explicitly separate from CSV/numerical details.

Reports disclose source half-life uncertainty, data editions, formulas, units and model assumptions. Chart SVG is copied from the actual rendered plot, not a decorative icon. PNG orchestration is tested with mocked Canvas/Image APIs, and the browser print dialog is not executed.

## Outstanding/unverified items

| Item | Classification | Status |
| --- | --- | --- |
| Desktop/mobile visual layout and real browser interaction | Unverified | Required browser-control capability unavailable; no visual success claim |
| Actual PNG pixels and download completion | Unverified | Canvas/Image orchestration covered; rasterization unavailable |
| Real browser print / Save as PDF dialog | Unverified | HTML, A4 stylesheet and print frame checked; actual dialog unavailable |
| GitHub-hosted Actions and Pages after update | Unverified / user-controlled publication | Local asset paths and hosted-entry DOM execution pass; no merge or deployment performed |
| Combined output uncertainty / nonlinear intervals | Proposed future work, not an existing supported feature | Requires measurement uncertainties/covariances; only declared half-life contribution is implemented |
| Full decay chains, dose, shielding or radiological risk | Outside scope | Not implemented or advertised |

The release is prepared for review and the listed final browser checks. **Complete end-to-end validation is not declared.**
