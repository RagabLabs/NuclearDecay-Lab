# Scientific validation — NuclearDecay Lab v2.1.0

**Scientific Validation Release · 14 October 2026.** This document describes the implemented model, data, numerical validation and remaining verification gaps. It does not certify radiation safety or claim complete real-browser validation.

## 1. Model and dimensions

A closed sample contains a single parent radionuclide or nuclear isomer, with a constant positive finite half-life. Its activity is the parent decay rate; `N` is an expected ensemble count. There is no production, daughter ingrowth, material transport, biological clearance or detector response. Comparison curves represent independent parents, not a decay chain.

| Quantity | Internal unit | Equation |
| --- | --- | --- |
| Decay constant | s⁻¹ | λ = ln(2)/T½ |
| Activity | Bq = decays s⁻¹ | A(t) = A₀ exp(−λt) |
| Activity lost | Bq | ΔA = A₀[1 − exp(−λt)] |
| Remaining percentage | % | 100 exp(−λt) |
| Elapsed half-lives | dimensionless | t/T½ |
| Target time | s | t = T½ ln(A₀/A_target)/ln(2) |
| Parent nuclei | dimensionless | N = A/λ |
| Selected-isotope mass | g | m_iso = NM/Nₐ |
| Total sample mass | g | m_sample = m_iso/f |
| Activity from mass | Bq | A = m_sample f Nₐ λ/M |
| Initial activity | Bq | A₀ = A(t) exp(λt) |
| Inferred decay constant | s⁻¹ | λ = ln(A₀/A(t))/t |
| Inferred half-life | s | T½ = t ln(2)/ln(A₀/A(t)) |

`M` is the selected neutral isotope's molar mass in g mol⁻¹, not the natural elemental average or bare nuclear mass. `f` is an isotope **mass fraction**, 0 < f ≤ 1; no atom-fraction interpretation is assumed. Complete Analysis reports the remaining isotope mass. The standalone mass converter can report total sample mass with a specified fraction. Computing mass from a known nucleus count does not require half-life or activity.

## 2. Unit definitions and central constants

`src/science/constants.ts` defines constants once, including their units, exact/measured status, absolute uncertainty, source edition, definition and use. All scientific modules and unit conversions import those values. SI-prefix factors are decimal powers by definition; mass conversion includes kg, g, mg, µg and ng. Time units extend from fs to Julian years; activity includes Bq prefixes and curie prefixes.

| Constant/convention | Central value | Status / source |
| --- | --- | --- |
| Nₐ | 6.02214076 × 10²³ mol⁻¹ | Exact SI defining constant; CODATA2022 |
| ln(2) | ≈ 0.6931471805599453 | Exact mathematical constant, approximately represented in binary64 |
| Minute, hour, day | 60; 3,600; 86,400 s | Exact time definitions |
| UI Julian year `y` | 31,557,600 s = 365.25 d | Exact application convention; IAU SOFA Julian epoch routine |
| DDEP table year `a` | 31,556,926 s | Fixed convention in BIPM Monograph 5; not an assertion of an exactly measured astronomical year |
| Curie | 3.7 × 10¹⁰ Bq | Exact conventional definition |
| Molar mass constant Mᵤ | 1.00000000105 ± 0.00000000031 g mol⁻¹ | Measured, CODATA2022 |
| Atomic mass unit | 1.66053906892 × 10⁻²⁷ kg; u = 5.2 × 10⁻³⁷ kg | Measured, CODATA2022; documented, not used as a competing mass route |
| AME2020 energy per u | 931494.10242 ± 0.00028 keV/u | Pinned AME2020 Table B conversion, based on its edition |
| Tc-99m excitation | 142.6836 ± 0.0011 keV | NUBASE2020, row 099 0431 |

Sources: [CODATA2022](https://physics.nist.gov/cuu/pdf/all.pdf), [NIST SI unit guide](https://www.nist.gov/pml/special-publication-811/nist-guide-si-chapter-5-units-outside-si), [IAU SOFA `epj`](https://www.iausofa.org/2023_1011_F/sofa/epj.for), [BIPM units](https://www.bipm.org/utils/common/pdf/monographieRI/Monographie_BIPM-5_Tables_Vol1.pdf), [AME2020 Part I Table B](https://www-nds.iaea.org/amdc/ame2020/AME2020-a.pdf), [NUBASE2020](https://www-nds.iaea.org/amdc/ame2020/nubase_4.mas20.txt), [NIST mathematical definitions](https://dlmf.nist.gov/4.2).

## 3. Eight-isotope reference audit

Every selected half-life, absolute uncertainty, original unit and evaluation date was checked against its DDEP/LNHB PDF. Neutral-atom masses and their uncertainties were checked against the IAEA-hosted AME2020 file. `massNumber`, atomic number and ground/metastable identity are explicit. The full per-value source table is in [reference-data.md](reference-data.md).

Tc-99m uses the AME2020 Tc-99 **ground-state** mass plus the NUBASE2020 excitation correction, yielding 98.90640285813728 u. Its listed mass uncertainty is an approximation dominated by the ground-state value, not a covariance-complete isomer uncertainty. Molar masses use Ar × Mᵤ. DDEP half-lives remain a consistently pinned set; NUBASE's alternative Tc-99m half-life is not silently substituted. No confirmed reference-value error was found in the v2.0 database.

### Carbon-14: the reported discrepancy is explained

The selected [DDEP 2012 C-14 evaluation](https://www.lnhb.fr/nuclides/C-14_tables.pdf) gives **5700 ± 30 a**, where the source convention is 31,556,926 s/a. Its central half-life is therefore:

```text
T½ = 5700 × 31556926 = 179874478200 s
   = 5699.878260704236 UI Julian years
u(T½) = 30 × 31556926 = 946707780 s
```

For A₀ = 100 MBq, the independently computed central model predicts:

| Elapsed time | Remaining activity, numerical central value (MBq) | Interpretation |
| --- | ---: | --- |
| Exactly 179874478200 s | 50 | Exactly one selected half-life |
| 5700 UI Julian years | 49.999259785725727937… | Slightly longer than the selected half-life |
| 5730 UI Julian years | 49.817183766240387063… | About 1.00528 selected half-lives |

The normal reference-aware display of the last activity is **49.82 MBq**, with the full binary64 result available in numerical details and CSV. It has not been replaced by 50 MBq. A compact field showing 5700 can retain the source-converted value; focusing it reveals that value. Explicitly typing 5700 replaces it with the user's 5700 Julian years.

The historical **5730 ± 40 yr** recommendation is a different evaluation: [Godwin, Nature 1962, DOI 10.1038/195984a0](https://doi.org/10.1038/195984a0), also reproduced in the [original Radiocarbon editorial](https://www.cambridge.org/core/services/aop-cambridge-core/content/view/1426AF12AAFD2AB0BDDE77D6B75C4BF3/S0033822200037036a.pdf/editorial-statement.pdf). That recommendation does not establish an exact seconds-per-year convention in the cited statement. It must not be treated as a unit conversion of 5700 a. A user-defined half-life of 5730 **UI Julian years** is a separate explicit model input; it yields 50 MBq at that same input time. No radiocarbon-age calibration is implemented.

## 4. Precision and uncertainty policy

Three concepts are separate: floating-point numerical precision, scientific agreement within this model, and measurement/reference uncertainty. Source central values are retained for calculations. Normal result cards use reference-aware rounding when a declared first-order half-life contribution is available; other outputs use six significant digits. Source values are paired with their uncertainty. Converted uncertainties use two significant digits and corresponding decimal-place rounding of the central value. Numerical detail sections and machine-readable CSV retain central-value precision. Focused input fields show their stored value; blurring or formatting does not feed a rounded string back into calculations.

The optional displayed contribution is **only from the reference half-life**, holding every user input and molar mass fixed. Let x = ln(2)t/T½ and r = u(T½)/T½. The first-order absolute contributions are:

```text
u_T(A) = A x r                  u_T(ΔA) = A x r
u_T(remaining %) = remaining % × x r
u_T(decayed %) = remaining % × x r
u_T(λ) = λ r                    u_T(t_target) = t_target r
u_T(t/T½) = (t/T½) r            u_T(T½) = u(T½)
u_T(N) = N(1+x)r                u_T(m_iso) = m_iso(1+x)r
u_T(A₀ inferred) = A₀ x r
```

The last inferred-initial formula treats the measured final activity as fixed; it is not the forward-model uncertainty of a reused final activity. A half-life inferred from two activities has no assumed input uncertainty. No combined uncertainty, confidence interval, uncertainty band, activity/time input uncertainty or mass covariance is invented. Molar mass uncertainties remain reference metadata and are **not combined** with output uncertainty.

The implementation withholds the linearized contribution when its relevant relative sensitivity exceeds 0.2 or the value/exponent is unrepresentable. This is a conservative display rule, **not** a guarantee of linearization accuracy below that threshold. Small contributions can vanish numerically; unknown or withheld contributions do not justify precision claims. Full uncertainty propagation would require user measurement uncertainties, dependencies/covariances and a separately validated nonlinear treatment.

## 5. Numerical stability, range and invalid inputs

JavaScript binary64 provides about 15–16 significant digits for normal numbers; its finite maximum is about 1.7976931348623157 × 10³⁰⁸, minimum normal 2⁻¹⁰²², and minimum positive subnormal 2⁻¹⁰⁷⁴ ≈ 4.94 × 10⁻³²⁴. Subnormal spacing limits relative precision; extra printed digits do not restore it.

- `expm1` evaluates the activity loss independently of A₀ − A(t).
- `log1p` evaluates near-equal inverse activity ratios; log differences avoid ratio overflow for wide scales.
- Logarithmic products preserve final activity, mass or nuclei when an intermediate fraction/product would underflow or overflow.
- Activity, percentage and display-unit activity are scaled separately before subnormal quantization. A fraction can underflow while percentage or activity remains representable.
- Log charts use actual log₁₀(quantity); they do not invent a floor activity. Zero has no logarithm.
- An unrepresentable derived quantity is unavailable with an explanation. Other valid quantities remain usable. A positive continuum quantity underflowing numerically is not asserted to have physically disappeared.

The engine rejects nonfinite/nonnumeric input, negative future time/activity, nonpositive half-life/rate/molar mass, invalid units, invalid mass fractions and indistinguishable interval points. A target above A₀ has no future-decay solution. A positive initial activity reaches target zero only asymptotically. Target = A₀ gives t = 0. Zero A₀ cannot identify a unique target time. Inferring finite half-life requires t > 0 and 0 < A(t) < A₀; equal positive activities imply λ = 0, outside the finite radioactive-half-life model. Equal activities at t = 0 cannot identify a unique half-life. The interface explains these cases rather than outputting an arbitrary number.

## 6. Independent verification and tolerances

`scripts/generate-validation-fixtures.py` uses Python's standard-library **Decimal at 160 digits**, importing no application code. It interprets each input as its exact binary64 value and calculates independent expected strings. A separate small-x Taylor expansion prevents cancellation beyond the Decimal precision. The committed JSON contains **19 forward cases and 3 inverse input sets**, the latter checking all seven unknowns independently. `--check` regenerates and byte-compares the fixtures; a mismatch blocks both GitHub workflows.

Cases cover analytic zero/one/two/five/ten/fifty half-lives; C-14's two year conventions; tiny losses; subnormal percentages and display activity; very short/long half-lives; wide scales; valid mass despite an overflowing nucleus count; and near-equal/widely separated inverse observations. Other regression suites cover exact one-half-life normalization for all eight isotopes, dimensional mass consistency, unit invariance, forward/inverse consistency, percentage/activity conservation, invalid inputs, reporting, charts and saved/shared analyses.

Comparisons allow a relative bound `128 × Number.EPSILON × max(1, conditioning scale)` and one minimum-subnormal output ULP as an absolute floor. Conditioning includes exponent/logarithm magnitudes. This deliberately conservative floating-point allowance is not a measurement uncertainty or evidence of 160-digit browser arithmetic. The boundary regressions additionally test the independently rounded subnormal percentage values explicitly.

## 7. Executed results and unresolved verification

The original **212 tests were re-run successfully before changes**. The final suite adds 97 tests, for **309 passed, 0 failed in nine files**. Independent fixtures, strict TypeScript, production build, production DOM execution and clean-install checks are recorded in [verification.md](verification.md). Thirteen selected new regression assertions failed against the untouched v2.0 source and pass with v2.1; some are numerical corrections and some are new disclosure/display requirements, not thirteen independent arithmetic bugs. See [SCIENTIFIC_AUDIT_REPORT.md](SCIENTIFIC_AUDIT_REPORT.md).

Production DOM checks execute all twelve views, C-14 screen/table/inspection/report agreement, inverse solving, interval analysis, English/Arabic RTL, actual SVG report content and the hosted entry/deep hash route with assets under `/NuclearDecay-Lab/`. DOM simulation does not establish visual quality or real-browser behavior.

**Unresolved verification:** real desktop/mobile visual rendering, actual SVG-to-PNG pixels/download completion, browser print/save-as-PDF dialog, real-device performance/accessibility and the GitHub-hosted workflow/Pages deployment were unavailable or deliberately not run. The supplied release is ready for review and these final browser checks; complete end-to-end scientific/product verification is not claimed. No currently reproduced calculation defect remains after the listed fixes. Reference updates and total uncertainty analysis remain separately scoped work.
