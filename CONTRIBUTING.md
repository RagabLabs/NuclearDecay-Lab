# Contributing

Use Node.js 22.12+ and the committed npm lockfile.

```bash
npm ci
python3 scripts/generate-validation-fixtures.py --check
npm test
npm run typecheck
npm run build
npm run verify:build
```

Keep scientific calculations in `src/science/` as pure, independently testable functions. Keep calculation units in SI and convert only at input/output boundaries.

For a physics change, provide a hand-reproducible case, expected dimensions and tests that check a physical invariant or inverse calculation. Include boundary cases where they matter. Do not add tests that merely duplicate an implementation expression.

For isotope data changes, cite a primary evaluated source. Record the exact evaluation date, uncertainty, units and state identity. Check the year convention; do not reinterpret tropical years as Julian years. An isomer mass is not the ground-state mass.

For UI changes, verify keyboard labels/focus, narrow and wide viewports, both themes, error states, curve/tooltips and download behavior. Never describe DOM/Canvas mocks as a real-browser visual or rasterization check.

Keep English and Arabic labels in sync. Arabic uses RTL layout; equations and SI symbols remain LTR. Do not translate unit keys or isotope identifiers. Reports and calculation-step explanations should describe current inputs rather than fixed illustrative values.

For inverse calculations, test solution uniqueness as well as a numerical round trip. For sharing, validate untrusted payloads and unit keys, preserve UTF-8 names and reject oversized or recursive data. Clear only this application's browser storage.

For exports, preserve unit headings and provenance. Never turn numerical underflow into a claim that a sample has physically reached zero.

The current scope is single-nuclide exponential decay. A chain solver or dose calculation requires its own scientific design, reference data and validation before it can be advertised.

All physical constants belong in `src/science/constants.ts`, with edition, units and exact/measured status. Never feed rounded display strings back into calculations. For numerical changes, compare against the independent Decimal fixtures and add a reproducing regression; inspect oracle changes rather than blindly regenerating expected values. Default npm tests use committed fixtures and do not require Python.
