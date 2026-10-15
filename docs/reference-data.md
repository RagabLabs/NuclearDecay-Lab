# Pinned reference data

Rechecked 2026-10-14 against the linked primary sources. Values are evaluated measurements with uncertainty, not exact physical constants. Source editions are intentionally pinned; newer or alternative evaluations may differ.

## Half-lives: DDEP / LNHB

| Nuclide | Reference half-life | Absolute uncertainty (k = 1) | Evaluation date | Source |
| --- | ---: | ---: | --- | --- |
| C-14 | 5700 a | 30 a | 2012-10-29 | [C-14 tables](https://www.lnhb.fr/nuclides/C-14_tables.pdf) |
| I-131 | 8.0233 d | 0.0019 d | 2014-01-20 | [I-131 tables](https://www.lnhb.fr/nuclides/I-131_tables.pdf) |
| Tc-99m | 6.0067 h | 0.0010 h | 2012-01-05 | [Tc-99m tables](https://www.lnhb.fr/nuclides/Tc-99m_tables.pdf) |
| Co-60 | 5.2711 a | 0.0008 a | 2010-03-01 | [Co-60 tables](https://www.lnhb.fr/nuclides/Co-60_tables.pdf) |
| Cs-137 | 30.018 a | 0.022 a | 2023-07-18 | [Cs-137 tables](https://www.lnhb.fr/nuclides/Cs-137_tables.pdf) |
| F-18 | 1.82890 h | 0.00023 h | 2014-08-29 | [F-18 tables](https://www.lnhb.fr/nuclides/F-18_tables.pdf) |
| U-238 | 4.468 × 10⁹ a | 5 × 10⁶ a | 2006-04-24 | [U-238 tables](https://www.lnhb.fr/nuclides/U-238_tables.pdf) |
| Ra-226 | 1600 a | 7 a | 2007-06-01 | [Ra-226 tables](https://www.lnhb.fr/nuclides/Ra-226_tables.pdf) |

Here `a` is the source's tropical year, `31,556,926 s`, as defined in [BIPM Monograph 5, Volume 1, English UNITS, PDF page 12](https://www.bipm.org/utils/common/pdf/monographieRI/Monographie_BIPM-5_Tables_Vol1.pdf). The UI `y` is Julian, `31,557,600 s`. The database converts `a` to seconds using the source convention; all UI conversions then use SI seconds.

The Cs-137 PDF requests citation to X. Mougeot et al., *Metrologia* **62** (2025) 029002, [doi:10.1088/1681-7575/adb9de](https://doi.org/10.1088/1681-7575/adb9de).

## Neutral-atom masses: AME2020

Source: [IAEA-hosted AME2020 unrounded mass table](https://www-nds.iaea.org/amdc/ame2020/mass_1.mas20.txt), file dated **3 March 2021**. The integer-u and micro-u parts of each row are combined; tabulated micro-u uncertainties are converted to u.

| Nuclide/state | Atomic mass (u) | Absolute uncertainty (u) |
| --- | ---: | ---: |
| C-14 | 14.00324198862 | 4.03 × 10⁻⁹ |
| I-131 | 130.906126375 | 6.49 × 10⁻⁷ |
| Tc-99 ground state | 98.906249681 | 9.74 × 10⁻⁷ |
| Tc-99m, derived isomer | 98.90640285813728 | approximately 9.74 × 10⁻⁷ |
| Co-60 | 59.933815536 | 4.33 × 10⁻⁷ |
| Cs-137 | 136.907089296 | 3.24 × 10⁻⁷ |
| F-18 | 18.000937324 | 4.97 × 10⁻⁷ |
| U-238 | 238.050786936 | 1.601 × 10⁻⁶ |
| Ra-226 | 226.025408186 | 2.068 × 10⁻⁶ |

## Tc-99m mass derivation

[NUBASE2020](https://www-nds.iaea.org/amdc/ame2020/nubase_4.mas20.txt), row `099 0431`, gives excitation energy `142.6836 ± 0.0011 keV`. [AME2020 Part I, Table B, PDF page 5](https://www-nds.iaea.org/amdc/ame2020/AME2020-a.pdf) supplies `931494.10242 ± 0.00028 keV/u`.

```text
m(Tc-99m)/u = 98.906249681 + 142.6836 / 931494.10242
            = 98.90640285813728
```

The excitation correction uncertainty is negligible compared with the ground-state mass uncertainty. The app identifies the mass as derived and links both source tables; it does not present the ground-state mass as an exact isomer mass.

## Molar mass and constants

Default molar masses are atomic mass/u multiplied by `Mᵤ = 1.00000000105(31) g mol⁻¹`, from [NIST CODATA2022 constants, PDF page 6](https://physics.nist.gov/cuu/pdf/all.pdf). Avogadro's constant is exact: `6.02214076 × 10²³ mol⁻¹`.

Calculations retain central values. Display rounding can use the separately declared first-order half-life contribution; no combined output uncertainty is inferred. Atomic/molar-mass uncertainty is metadata and is not combined. See [SCIENTIFIC_VALIDATION.md](SCIENTIFIC_VALIDATION.md). Ground-state neutral-atom masses and the corrected neutral Tc-99m mass are appropriate to isotope sample mass, not bare nuclear mass.

## Model-specific source notes

- C-14 and F-18 have stable daughters.
- I-131 can populate radioactive Xe-131m.
- Tc-99m produces radioactive Tc-99; only metastable-state activity is calculated.
- Cs-137 can populate radioactive Ba-137m.
- U-238 and Ra-226 belong to chains with radioactive daughters.
- Co-60 activity is parent decay rate, not a gamma spectrum or dose.

No daughter ingrowth, chain equilibrium or total chain activity is calculated. These scope notes are also visible beside each isotope in the application.

## Identity and alternative evaluations

| Record | Z | A | State |
| --- | ---: | ---: | --- |
| C-14 | 6 | 14 | Ground |
| I-131 | 53 | 131 | Ground |
| Tc-99m | 43 | 99 | Metastable |
| Co-60 | 27 | 60 | Ground |
| Cs-137 | 55 | 137 | Ground |
| F-18 | 9 | 18 | Ground |
| U-238 | 92 | 238 | Ground |
| Ra-226 | 88 | 226 | Ground |

NUBASE2020 lists an alternative Tc-99m half-life of 6.0066 ± 0.0002 h; this app consistently retains the linked DDEP 6.0067 ± 0.0010 h evaluation. Source editions/uncertainties matter; a different evaluation is not a transcription error. The Tc-99m mass uncertainty is an approximation dominated by the ground-state mass; no full covariance budget is claimed.

C-14's 5700 ± 30 a is the selected DDEP 2012 evaluation. The historical 5730 ± 40 yr recommendation is reproduced in the [Radiocarbon editorial](https://www.cambridge.org/core/services/aop-cambridge-core/content/view/1426AF12AAFD2AB0BDDE77D6B75C4BF3/S0033822200037036a.pdf/editorial-statement.pdf) and attributed to [Godwin 1962](https://doi.org/10.1038/195984a0). The cited historical statement does not specify exact seconds per year. Do not silently reinterpret it or force this database's outputs to a different central half-life.
