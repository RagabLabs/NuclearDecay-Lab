/** Central, versioned physical constants and exact application unit conventions. */
export const CODATA_URL='https://physics.nist.gov/cuu/pdf/all.pdf';
export const YEAR_SOURCE_URL='https://www.bipm.org/utils/common/pdf/monographieRI/Monographie_BIPM-5_Tables_Vol1.pdf';
export const AME_URL='https://www-nds.iaea.org/amdc/ame2020/mass_1.mas20.txt';
export const AME_PAPER_URL='https://www-nds.iaea.org/amdc/ame2020/AME2020-a.pdf';
export const NUBASE_URL='https://www-nds.iaea.org/amdc/ame2020/nubase_4.mas20.txt';
export const SI_UNITS_URL='https://www.nist.gov/pml/special-publication-811/nist-guide-si-chapter-5-units-outside-si';
export const AVOGADRO=6.02214076e23;
export const LN2=Math.LN2;
export const SECONDS_PER_MINUTE=60;
export const SECONDS_PER_HOUR=3600;
export const SECONDS_PER_DAY=86400;
export const JULIAN_YEAR_SECONDS=365.25*SECONDS_PER_DAY;
export const REFERENCE_YEAR_SECONDS=31556926;
export const BQ_PER_CURIE=3.7e10;
export const MOLAR_MASS_CONSTANT=1.00000000105; // g mol⁻¹, CODATA2022
export const MOLAR_MASS_CONSTANT_UNCERTAINTY=3.1e-10; // g mol⁻¹
export const ATOMIC_MASS_UNIT_KG=1.66053906892e-27; // CODATA2022
export const AME_KEV_PER_U=931494.10242; // AME2020 Table B; keep its edition explicit
export const TC99M_EXCITATION_KEV=142.6836; // NUBASE2020
export const MIN_NORMAL=2**-1022;
export interface ConstantDefinition {name:string;value:number;unit:string;uncertainty:number|null;exact:boolean;source:string;definition:string;use:string}
export const PHYSICAL_CONSTANTS:ConstantDefinition[]=[
 {name:'Avogadro constant',value:AVOGADRO,unit:'mol⁻¹',uncertainty:0,exact:true,source:CODATA_URL,definition:'Exact SI defining constant.',use:'Converts amount of substance to entity count.'},
 {name:'Natural logarithm of 2',value:LN2,unit:'1',uncertainty:0,exact:true,source:'https://dlmf.nist.gov/4.2',definition:'Exact mathematical constant, represented approximately in binary64.',use:'Half-life and exponential-decay relations.'},
 {name:'Seconds per minute',value:SECONDS_PER_MINUTE,unit:'s min⁻¹',uncertainty:0,exact:true,source:SI_UNITS_URL,definition:'One minute is exactly 60 seconds.',use:'Time conversion.'},
 {name:'Seconds per hour',value:SECONDS_PER_HOUR,unit:'s h⁻¹',uncertainty:0,exact:true,source:SI_UNITS_URL,definition:'One hour is exactly 3,600 seconds.',use:'Time conversion.'},
 {name:'Seconds per day',value:SECONDS_PER_DAY,unit:'s d⁻¹',uncertainty:0,exact:true,source:SI_UNITS_URL,definition:'24 hours of 60 minutes of 60 seconds.',use:'Time conversion.'},
 {name:'Julian year',value:JULIAN_YEAR_SECONDS,unit:'s y⁻¹',uncertainty:0,exact:true,source:'https://www.iausofa.org/2023_1011_F/sofa/epj.for',definition:'Application y = exactly 365.25 days; no calendar-year arithmetic.',use:'Every user-facing year conversion.'},
 {name:'DDEP reference year',value:REFERENCE_YEAR_SECONDS,unit:'s a⁻¹',uncertainty:0,exact:true,source:YEAR_SOURCE_URL,definition:'The tabulation convention is 31,556,926 seconds; this does not assert an exact astronomical tropical-year measurement.',use:'Convert a in pinned DDEP evaluations to SI seconds.'},
 {name:'Curie',value:BQ_PER_CURIE,unit:'Bq Ci⁻¹',uncertainty:0,exact:true,source:SI_UNITS_URL,definition:'1 Ci = exactly 3.7 × 10¹⁰ Bq.',use:'All curie-prefix conversions.'},
 {name:'Molar mass constant',value:MOLAR_MASS_CONSTANT,unit:'g mol⁻¹',uncertainty:MOLAR_MASS_CONSTANT_UNCERTAINTY,exact:false,source:CODATA_URL,definition:'CODATA2022; measured after the 2019 SI redefinition.',use:'M(X) = Ar(X) × Mᵤ.'},
 {name:'Atomic mass unit',value:ATOMIC_MASS_UNIT_KG,unit:'kg u⁻¹',uncertainty:5.2e-37,exact:false,source:CODATA_URL,definition:'CODATA2022 atomic mass constant.',use:'Documented conversion; mass calculations use molar mass and Nₐ.'},
 {name:'AME2020 energy per atomic mass unit',value:AME_KEV_PER_U,unit:'keV u⁻¹',uncertainty:0.00028,exact:false,source:AME_PAPER_URL,definition:'Conversion constant pinned to AME2020 Table B.',use:'Tc-99m excitation-energy mass correction.'},
 {name:'Tc-99m excitation energy',value:TC99M_EXCITATION_KEV,unit:'keV',uncertainty:0.0011,exact:false,source:NUBASE_URL,definition:'NUBASE2020 row 099 0431.',use:'Add E*/c² to the AME2020 Tc-99 ground-state atom mass.'},
];
