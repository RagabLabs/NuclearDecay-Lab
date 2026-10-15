# Changelog

## 2.1.0 — Scientific Validation Release (2026-10-14)

- Retained all twelve views, existing scientific workflows, English/Arabic, design, saves/shares and static/offline deployment.
- Audited all eight isotope records against DDEP, AME2020 and NUBASE2020. Retained source central values; added explicit mass number/state identity and updated verification date.
- Explained Carbon-14's DDEP 5700 ± 30 a, historical 5730 ± 40 yr and source/UI year conventions. No reference value was changed to fit an expected 50 MBq answer.
- Fixed subnormal percentage quantization, lost representable percentages and recoverable activity display precision.
- Fixed intermediate mass-fraction underflow and false zero nuclei in mass-input workflows. Preserved independently valid quantities when another derived quantity is unavailable.
- Removed irrelevant input requirements from nuclei-to-mass, activity-only and target-time calculations.
- Added central physical-constant metadata and reference-aware display rounding, with separately disclosed first-order half-life contribution and full numerical central values. No combined uncertainty is claimed.
- Compact unfocused fields retain full stored values and reveal them on focus. Rounded strings do not become calculation intermediates.
- Kept machine-readable CSV precision and added explicit range flags, SI/log values and reference metadata. Reports disclose uncertainty/provenance and use the same display policy.
- Added 97 tests and a reproducible 160-digit independent Decimal oracle for forward and all seven inverse quantities; final total 309 passing tests.
- Strengthened both GitHub workflows with independent-fixture verification and production checks of the existing `/NuclearDecay-Lab/` asset namespace/deep hash route.
- Added scientific validation, audit, executed-check evidence, release notes and same-repository update instructions. Declared unavailable real-browser/PNG/print/deployment checks explicitly.

## 2.0.0 (2026-10-14)

Added inverse solving, calculation steps/reports, interval analysis, advanced plot controls, isotope library, learning view, Arabic RTL, local saving/reopening, input sharing, and portable HTML. Its 212-test suite and historical review remain documented in `docs/review-report.md`.
