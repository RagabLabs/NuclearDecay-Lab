# NuclearDecay Lab

A free, open-source, browser-local scientific application for single-nuclide radioactive decay. Enter a sample once and obtain consistent activity, half-life, nuclei and isotope-mass results, interactive curves and reproducible exports.

**React · TypeScript · Vite · Recharts · Vitest · MIT**

**Version 2.1.0 — Scientific Validation Release** audits the reference data, fixes numerical boundaries and unnecessary input requirements, and adds reference-aware presentation, independent 160-digit validation and transparent scientific evidence. All twelve views and existing workflows are retained.

[Scientific validation](docs/SCIENTIFIC_VALIDATION.md) · [Audit and fixed issues](docs/SCIENTIFIC_AUDIT_REPORT.md) · [Executed checks](docs/verification.md) · [Changelog](CHANGELOG.md) · [Update the existing GitHub repository (Arabic)](docs/UPDATE_GITHUB_AR.md)

## Use the included application immediately

The release ZIP includes source code **and a production build**.

1. Extract the ZIP.
2. Open **`dist/nuclear-decay-lab.html`** in a modern browser.
3. Start with **Complete Decay Analysis**. Choose an isotope, initial activity and elapsed time, then select **Analyze Now**.

The portable HTML embeds the compiled JavaScript, CSS and favicon. It requires no installation, network connection, account, API key or server. Reference links naturally require an internet connection. Browser download restrictions can depend on local settings; if a browser restricts local-file downloads, serve `dist/` as described below.

## Features

| Workflow | What it does |
| --- | --- |
| Activity decay | Remaining/lost activity, remaining/decayed fractions and elapsed half-lives |
| Time to target | Activity or percentage targets; outputs in minutes, hours, days and Julian years |
| Half-life / constant | Bidirectional conversion with explicit rate dimensions |
| Radioactive nuclei | Activity ↔ expected parent-nucleus count |
| Isotope mass | Activity ↔ mass, nuclei → mass, kg/g/mg/µg/ng and explicit isotope mass fraction |
| Multi-time analysis | Custom time lists or start/end/count intervals, up to 1,000 points; activity, percentage, nuclei, mass or lost activity; full-precision CSV |
| Interactive visualization | Live mathematical curves, precise tooltips, arbitrary-time inspection, zoom/range controls, curve visibility, linear/log axes, half-life and initial-activity markers, PNG |
| Isotope comparison | Two to eight independent nuclides, common or individual initial activities, shared timeline, table and CSV |
| Complete Decay Analysis | Connected results at one elapsed time, default time table and downloadable scientific report |
| Inverse calculator | Find initial/final activity, time, half-life, decay constant, nuclei or isotope mass using only the required inputs |
| Calculation steps and reports | Original inputs, SI conversions, laws, numerical substitutions, results, interpretation, references, HTML report and Print/PDF |
| Isotope library | Search eight sourced reference nuclides by name, symbol or atomic number; open a sample directly |
| Learn Nuclear Decay | Six short lessons and a live half-life/activity experiment |

The interface includes twelve views, English by default, Arabic with RTL layout and LTR mathematical notation, responsive navigation, accessible labels and focus states, keyboard-accessible charts, light/dark themes and remembered language/theme preferences. No scientific computation is sent to a server.

## Everyday workflow

Start in **Complete Decay Analysis**. A reference isotope supplies its half-life and molar mass automatically. For a custom isotope, supply a name and positive half-life; leave molar mass blank when mass is not needed. Results update locally, and **Analyze Now** brings the results into focus.

Use **Show Calculation Steps** in any calculator to inspect its current inputs and substitutions. **Copy result**, **Download report** and **Print / PDF** use those same results. The report includes the current chart when the page has one; PDF creation uses the browser's print/save-as-PDF dialog. No separate PDF service is required.

In **Time Analysis**, choose a custom list or an inclusive interval with 2–1,000 points. Select the physical variable to display. The plot and table use the same calculated points. Missing molar mass prevents a mass series rather than supplying an invented value.

In **Isotope Comparison**, choose 2–8 nuclides and common or individual initial activities. Hide curves independently, inspect a specific time and zoom using the range fields or buttons. The at-time CSV exports the comparison table; **Export curves CSV** exports 181 samples over the input-defined timeline for all selected isotopes. Hiding a curve or zooming the view does not discard it from this data export.

## Saving, sharing and privacy

**Save analysis** stores one last input set per calculator in browser local storage. **Open last analysis** restores it. **Clear inputs** clears a form, while **Clear all data** removes only NuclearDecay Lab saves and preferences and restores defaults. Other applications' storage is preserved. Storage may be unavailable under restrictive browser settings; errors are shown and calculations still work.

**Share analysis** copies a URL whose fragment contains versioned, encoded inputs. It needs no account or backend. The encoding is **not encryption**: anyone with the link can read its inputs. Share only non-sensitive data. Shared inputs are validated before use, and oversized or unsupported payloads are rejected.

Cross-device sharing needs a hosted application URL, such as GitHub Pages. A link generated from the offline `file://` version identifies a local file path; it cannot give another device access to that file. Distribute the portable HTML alongside those inputs or use the hosted app. Clipboard restrictions are handled with a fallback and a selectable share-link field.

Choose **العربية** from the language selector to enable Arabic. The choice is remembered where storage is allowed; equations, SI symbols and numerical values retain their scientific ordering.

## Scientific equations

Calculations use SI internally: activity in Bq, time in seconds and decay constant in s⁻¹. Molar mass is in g mol⁻¹, yielding mass in grams.

```text
λ = ln(2) / T½
A(t) = A₀ exp(−λt)
remaining fraction = exp(−λt)
decayed fraction = −expm1(−λt)
activity lost = A₀ × decayed fraction
elapsed half-lives = t / T½
t_target = ln(A₀ / A_target) / λ
N(t) = A(t) / λ
m_isotope = [N(t) / Nₐ] × M
m_sample = m_isotope / f
A = [m_sample × f / M] × Nₐ × λ
A₀ = A(t) exp(λt)
λ_inferred = ln[A₀/A(t)] / t
T½_inferred = t ln(2) / ln[A₀/A(t)]
```

`f` is an **isotope mass fraction**, not an atom fraction or natural abundance. Its valid range is `0 < f ≤ 1`. The default is a pure sample (`f = 1`). The complete-analysis mass always refers to remaining selected isotope mass, excluding daughters and carrier material.

**Constants and time conventions**

- Avogadro constant: `Nₐ = 6.02214076 × 10²³ mol⁻¹`, exact SI definition.
- Curie: `1 Ci = 3.7 × 10¹⁰ Bq` exactly.
- UI year `y`: Julian year, exactly `365.25 d = 31,557,600 s`.
- DDEP source year `a`: reference tropical year, `31,556,926 s`.
- Default isotope molar mass: atomic mass/u multiplied by the CODATA2022 molar mass constant `Mᵤ = 1.00000000105 g mol⁻¹`. Mᵤ is measured, not exact after the 2019 SI redefinition.

Source years are first converted using the source convention. The application never silently relabels a tropical-year half-life as a Julian-year half-life.

## Carbon-14 and precision

The pinned DDEP evaluation is `5700 ± 30 a`, with `a = 31,556,926 s`. UI `y` is Julian (`31,557,600 s`). This gives a central half-life of `179874478200 s = 5699.878260704236 y`. With `100 MBq` at `5730 y`, the central result is `49.817183766240387… MBq`, normally displayed as **49.82 MBq**. Exactly one selected half-life gives **50 MBq**. The historical `5730 ± 40 yr` recommendation is a different evaluation, not a conversion correction. Full sources and independently reproduced values are in [Scientific Validation](docs/SCIENTIFIC_VALIDATION.md).

## Reproduce the results

Use a **custom half-life**, rather than a database isotope, for these illustrative inputs:

```text
A₀ = 100 MBq
T½ = 8 days
t = 16 days
M = 131 g mol⁻¹
```

Expected results:

```text
λ = ln(2) / 691200 ≈ 1.00281710150455 × 10⁻⁶ s⁻¹
elapsed half-lives = 2
A(t) = 25 MBq
activity lost = 75 MBq
remaining = 25%; decayed = 75%
N(t) = 25,000,000 / λ ≈ 2.49297703065613 × 10¹³ nuclei
m(t) = N(t) × 131 / Nₐ ≈ 5.42298833639274 × 10⁻⁹ g
t to 10% = 8 × log₂(10) ≈ 26.5754247591 days
```

For the evaluated I-131 reference, `A₀ = 100 MBq` and `t = 8.0233 d` yield exactly one half-life: `50 MBq` and `50%` remaining. Its reference molar mass is loaded automatically.

For an inverse example, set **Solve for → Half-life**, `A₀ = 100 MBq`, `A(t) = 25 MBq` and `t = 16 d`. The result is `T½ = 8 d`. A finite positive inferred half-life or rate requires `t > 0` and `0 < A(t) < A₀`. Equal positive activities require zero decay rate and do not identify a finite radioactive half-life. An exact-zero target from a positive initial sample has no finite target time. In contrast, exact-zero final activity at a finite time and specified finite half-life implies exact-zero initial activity.

## Installation and development

Requires **Node.js 22.12+**. The delivered lockfile records exact dependency resolution.

```bash
npm ci
npm run dev
```

Open the local URL printed by Vite, normally `http://localhost:5173`.

```bash
npm test                 # scientific, reference, export and DOM workflow tests
npm run test:coverage    # V8 coverage report for scientific and export modules
npm run typecheck       # strict TypeScript checks
npm run build           # typecheck, production build and portable HTML
npm run preview         # locally serve the production build
npm run verify:build    # execute compiled portable app in jsdom; not visual browser QA
npm audit               # check the current dependency advisory database
```

The production build is `dist/`. `dist/index.html` is the static-host entry point. `dist/nuclear-decay-lab.html` is the self-contained offline version. Preview normally listens on `http://localhost:4173`.

## Publish on GitHub Pages

For the existing `RagabLabs/NuclearDecay-Lab` repository, follow [same-repository update instructions](docs/UPDATE_GITHUB_AR.md). Merging to its `main` branch triggers publication; review the release before merging. No public update was performed. The generic procedure below also supports a separate installation.

No repository has been created or published by this release preparation.

1. Create a GitHub repository named, for example, `nuclear-decay-lab`.
2. Upload the contents of this project directory, including `.github/`, source and `package-lock.json`. Do not upload `node_modules/` or coverage output.
3. Ensure the default branch is `main`.
4. Open **Settings → Pages → Build and deployment → Source → GitHub Actions**.
5. The included **Deploy to GitHub Pages** workflow installs from the lockfile, runs tests and TypeScript checks, builds, executes the production DOM smoke check and deploys `dist/`.
6. The site URL is `https://YOUR_USERNAME.github.io/nuclear-decay-lab/`.

Vite uses **`base: './'`**, so the same build resolves its assets at a domain root or within any repository path. Hash routes (`#/analysis`, `#/comparison`, etc.) avoid GitHub Pages SPA 404 errors. An explicit base can be supplied if needed:

```bash
VITE_BASE_PATH=/nuclear-decay-lab/ npm run build
```

The normal relative-base build also creates the portable HTML. For an explicit absolute base, the portable generator resolves asset paths independently of the repository prefix.

For an account site named `YOUR_USERNAME.github.io` or a custom domain, use `VITE_BASE_PATH=/` or retain the default relative base. No backend, paid API, environment secret or private key is required. The workflow uses GitHub's built-in token and Pages permissions.

Official deployment reference: [Vite static deployment / GitHub Pages](https://vite.dev/guide/static-deploy.html#github-pages).

## Isotope data and provenance

The embedded database contains Carbon-14, Iodine-131, Technetium-99m, Cobalt-60, Cesium-137, Fluorine-18, Uranium-238 and Radium-226.

- **Half-lives:** [DDEP/LNHB evaluated radionuclide tables](https://www.lnhb.fr/nuclear-data/nuclear-data-table/). Each isotope has its own PDF URL, evaluation date, value and absolute uncertainty in `src/data/isotopes.ts`.
- **Neutral atomic masses:** [IAEA-hosted AME2020 unrounded table](https://www-nds.iaea.org/amdc/ame2020/mass_1.mas20.txt), file dated 3 March 2021.
- **Tc-99m mass:** derived from AME2020 Tc-99 ground-state mass and [NUBASE2020](https://www-nds.iaea.org/amdc/ame2020/nubase_4.mas20.txt) excitation energy, using [AME2020 Part I, Table B](https://www-nds.iaea.org/amdc/ame2020/AME2020-a.pdf).
- **Physical constants:** [NIST CODATA2022 constants](https://physics.nist.gov/cuu/pdf/all.pdf).
- **Reference year convention:** [BIPM Monograph 5, vol. 1, English “UNITS”](https://www.bipm.org/utils/common/pdf/monographieRI/Monographie_BIPM-5_Tables_Vol1.pdf).

Values were rechecked **14 October 2026**. Selected evaluations are pinned; the app does not fetch live data or claim that one evaluation is uniquely exact. See [docs/reference-data.md](docs/reference-data.md) for the full provenance table and Tc-99m derivation.

Reference uncertainties (`k = 1`) remain visible. Reference-aware rounding uses the first-order **half-life contribution only**, with other inputs held fixed; no combined uncertainty, input uncertainty or confidence interval is inferred. Molar-mass uncertainty is not combined. Numerical details and CSV retain central values for reproducibility, not extra measurement accuracy. Focus a shortened field to inspect/edit its full stored value. See the equations and limits in [Scientific Validation](docs/SCIENTIFIC_VALIDATION.md). Reference links retain their publishers’ terms and attribution.

## Export formats

- **CSV:** UTF-8 with BOM, explicit column units, round-trip numerical precision, CRLF line endings, and quoting/formula-injection safeguards. Time CSV contains underflow flags, logarithmic activity and SI activity columns.
- **PNG:** current chart, current scale, axes, title and a model caption, rendered at 2× resolution via browser SVG/Canvas. It embeds no external imagery.
- **Scientific report:** a standalone English or Arabic HTML document containing original inputs, SI equivalents, calculation steps, results, equations, constants, the actual chart when present, available time table, source links and assumptions. **Print / PDF** opens the browser print dialog with an A4 print layout. Choose **Save as PDF** for a PDF copy.

## Numerical and physical boundaries

The model is a closed sample with one constant-rate parent nuclide or isomer. It excludes external production, daughter ingrowth, transport, biological clearance, effective half-life, dose, spectra and full decay-chain equilibrium. Independent comparison curves are **not a chain simulation**. Parent activity must not be interpreted as total activity of U-238, Ra-226, Cs-137, I-131 or Tc-99m and their daughters.

`N` is an ensemble expectation. Individual samples have integer, stochastic nucleus counts; an expected count below one is explicitly explained.

JavaScript uses IEEE 754 double precision. Stable `expm1`, `log1p` and log-space formulas reduce avoidable cancellation and intermediate overflow. Negative activity/time, nonpositive half-life/constant/molar mass, nonfinite or nonnumeric values, impossible future targets, invalid fractions and unit-range problems produce explicit messages. Activity underflow is flagged; numerical zero is never presented as exact physical disappearance. Log plots can display values below ordinary activity range because their coordinates are calculated directly in log space.

## Project structure

```text
src/
  components/    labeled inputs, reference panels, charts, time tables
  data/          sourced isotope database
  pages/         twelve application views and Arabic scientific documentation
  science/       pure physics, central constants, SI conversions, precision policy
  utils/         formatting, CSV/report/PNG exports, save/share validation
  i18n.tsx       language context and translation of interface text
  translations.ts  reviewed Arabic scientific terminology
  App.tsx        hash navigation, theme, language, responsive shell
  styles.css     responsive scientific interface
tests/           physics, reference regression, export, DOM workflows
docs/            data provenance, verification, deployment notes
scripts/         independent Decimal oracle, portable build and production DOM checks
.github/workflows/  continuous checks and GitHub Pages deployment
dist/            ready-to-host production assets and offline HTML
```

## Verification

See [docs/verification.md](docs/verification.md) for the actual executed checks and limitations. DOM tests execute React forms and inspect generated SVG paths; they do not establish visual pixel quality or real browser rasterization. PNG orchestration is tested with mocked Canvas/Image APIs. A real-browser rendering/download check must not be inferred from those mocks.

The original 212 tests were re-run; **97 new tests bring the release to 309 passing tests**. Independent Decimal fixtures check forward results and all seven inverse unknowns, including difficult numerical boundaries. See [the scientific audit](docs/SCIENTIFIC_AUDIT_REPORT.md) for reproduced defects and before/after evidence. No real-browser visual, actual PNG rasterization, print-dialog or public deployment success is claimed.

## Contributing and license

See [CONTRIBUTING.md](CONTRIBUTING.md). Scientific changes should include a reproducible calculation, appropriate regression tests and authoritative citations. Reference-value changes must preserve source units and evaluation dates.

The application code is released under the [MIT License](LICENSE). Third-party dependencies and cited reference publications retain their own licenses and terms.
