import { TIME_UNITS, type TimeUnit } from '../science/units';
import {REFERENCE_YEAR_SECONDS,MOLAR_MASS_CONSTANT,AME_URL,AME_KEV_PER_U,TC99M_EXCITATION_KEV} from '../science/constants';
export {REFERENCE_YEAR_SECONDS,MOLAR_MASS_CONSTANT,AME_URL,NUBASE_URL,CODATA_URL,YEAR_SOURCE_URL} from '../science/constants';
export const DATA_VERIFIED = '2026-10-14';
export interface Isotope {
  id: string;
  name: string;
  symbol: string;
  atomicNumber: number;
  massNumber: number;
  state: 'ground' | 'metastable';
  halfLifeValue: number;
  halfLifeUncertainty: number;
  referenceUnit: 'h' | 'd' | 'a';
  preferredTimeUnit: TimeUnit;
  halfLifeSeconds: number;
  atomicMassU: number;
  atomicMassUncertaintyU: number;
  molarMass: number;
  evaluationDate: string;
  halfLifeSource: string;
  massSource: string;
  massNote?: string;
  decayNote: string;
}
type Seed = Omit<Isotope, 'halfLifeSeconds' | 'molarMass' | 'halfLifeSource' | 'massSource'>;
function isotope(seed: Seed): Isotope {
  const factor = seed.referenceUnit === 'a' ? REFERENCE_YEAR_SECONDS : TIME_UNITS[seed.referenceUnit].factor;
  return { ...seed, halfLifeSeconds: seed.halfLifeValue * factor,
    molarMass: seed.atomicMassU * MOLAR_MASS_CONSTANT,
    halfLifeSource: `https://www.lnhb.fr/nuclides/${seed.id}_tables.pdf`, massSource: AME_URL };
}
export const ISOTOPES: Isotope[] = [
  isotope({id:'C-14', name:'Carbon-14',symbol:'¹⁴C',atomicNumber:6,massNumber:14,state:'ground',halfLifeValue:5700,halfLifeUncertainty:30,referenceUnit:'a',preferredTimeUnit:'y',atomicMassU:14.00324198862,atomicMassUncertaintyU:4.03e-9,evaluationDate:'2012-10-29',decayNote:'Parent-only β⁻ decay; the daughter N-14 is stable. This uses the DDEP evaluated half-life, not the conventional Libby radiocarbon dating half-life.'}),
  isotope({id:'I-131',name:'Iodine-131',symbol:'¹³¹I',atomicNumber:53,massNumber:131,state:'ground',halfLifeValue:8.0233,halfLifeUncertainty:0.0019,referenceUnit:'d',preferredTimeUnit:'d',atomicMassU:130.906126375,atomicMassUncertaintyU:6.49e-7,evaluationDate:'2014-01-20',decayNote:'Parent-only β⁻ decay. Radioactive Xe-131m can be populated; daughter activity is excluded.'}),
  isotope({id:'Tc-99m',name:'Technetium-99m',symbol:'⁹⁹ᵐTc',atomicNumber:43,massNumber:99,state:'metastable',halfLifeValue:6.0067,halfLifeUncertainty:0.001,referenceUnit:'h',preferredTimeUnit:'h',atomicMassU:98.906249681 + TC99M_EXCITATION_KEV / AME_KEV_PER_U,atomicMassUncertaintyU:9.74e-7,evaluationDate:'2012-01-05',massNote:'Derived isomer atomic mass: AME2020 Tc-99 ground-state mass 98.906249681 u + NUBASE2020 excitation 142.6836(11) keV / (931494.10242 keV/u). Molar mass includes the CODATA2022 molar mass constant. Uncertainty is dominated by the ground-state mass.',decayNote:'Activity refers only to the Tc-99m state. Its radioactive daughter Tc-99 is excluded. The evaluated half-life can depend slightly on chemical environment.'}),
  isotope({id:'Co-60',name:'Cobalt-60',symbol:'⁶⁰Co',atomicNumber:27,massNumber:60,state:'ground',halfLifeValue:5.2711,halfLifeUncertainty:0.0008,referenceUnit:'a',preferredTimeUnit:'y',atomicMassU:59.933815536,atomicMassUncertaintyU:4.33e-7,evaluationDate:'2010-03-01',decayNote:'Parent-only β⁻ decay; daughter Ni-60 de-excites to a stable ground state. No radiation spectrum or dose is calculated.'}),
  isotope({id:'Cs-137',name:'Cesium-137',symbol:'¹³⁷Cs',atomicNumber:55,massNumber:137,state:'ground',halfLifeValue:30.018,halfLifeUncertainty:0.022,referenceUnit:'a',preferredTimeUnit:'y',atomicMassU:136.907089296,atomicMassUncertaintyU:3.24e-7,evaluationDate:'2023-07-18',decayNote:'Parent-only β⁻ decay; radioactive Ba-137m is populated. Daughter activity and secular equilibrium are not included.'}),
  isotope({id:'F-18',name:'Fluorine-18',symbol:'¹⁸F',atomicNumber:9,massNumber:18,state:'ground',halfLifeValue:1.82890,halfLifeUncertainty:0.00023,referenceUnit:'h',preferredTimeUnit:'h',atomicMassU:18.000937324,atomicMassUncertaintyU:4.97e-7,evaluationDate:'2014-08-29',decayNote:'Parent-only positron emission/electron capture; the daughter O-18 is stable.'}),
  isotope({id:'U-238',name:'Uranium-238',symbol:'²³⁸U',atomicNumber:92,massNumber:238,state:'ground',halfLifeValue:4.468e9,halfLifeUncertainty:5e6,referenceUnit:'a',preferredTimeUnit:'y',atomicMassU:238.050786936,atomicMassUncertaintyU:1.601e-6,evaluationDate:'2006-04-24',decayNote:'Parent activity only. U-238 belongs to a decay chain with radioactive daughters; total chain activity is not simulated.'}),
  isotope({id:'Ra-226',name:'Radium-226',symbol:'²²⁶Ra',atomicNumber:88,massNumber:226,state:'ground',halfLifeValue:1600,halfLifeUncertainty:7,referenceUnit:'a',preferredTimeUnit:'y',atomicMassU:226.025408186,atomicMassUncertaintyU:2.068e-6,evaluationDate:'2007-06-01',decayNote:'Parent activity only. Radioactive Rn-222 and later daughters are excluded; no equilibrium or daughter ingrowth is assumed.'}),
];
export function getIsotope(id: string): Isotope | undefined { return ISOTOPES.find(i => i.id === id); }
