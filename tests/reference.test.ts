import { describe,expect,it } from 'vitest';
import { ISOTOPES, getIsotope, REFERENCE_YEAR_SECONDS, MOLAR_MASS_CONSTANT } from '../src/data/isotopes';
import { convertTime } from '../src/science/units';
import { activityDecay } from '../src/science/decay';
// Regression snapshots transcribed from the specific linked DDEP / AME2020 evaluations.
const reference=[
  ['C-14',5700,30,'a',14.00324198862],['I-131',8.0233,.0019,'d',130.906126375],
  ['Tc-99m',6.0067,.001,'h',98.906249681+142.6836/931494.10242],
  ['Co-60',5.2711,.0008,'a',59.933815536],['Cs-137',30.018,.022,'a',136.907089296],
  ['F-18',1.82890,.00023,'h',18.000937324],['U-238',4.468e9,5e6,'a',238.050786936],
  ['Ra-226',1600,7,'a',226.025408186],
] as const;
describe('Reference data provenance and conversion',()=>{
  it('contains exactly the eight requested isotopes, uniquely identified',()=>{expect(ISOTOPES.length).toBe(8);expect(new Set(ISOTOPES.map(i=>i.id)).size).toBe(8);});
  it.each(reference)('preserves the published %s reference',(id,h,unc,unit,m)=>{const i=getIsotope(id)!;expect(i.halfLifeValue).toBe(h);expect(i.halfLifeUncertainty).toBe(unc);expect(i.referenceUnit).toBe(unit);expect(i.atomicMassU).toBe(m);expect(i.molarMass).toBe(m*MOLAR_MASS_CONSTANT);expect(i.halfLifeSource).toBe(`https://www.lnhb.fr/nuclides/${id}_tables.pdf`);expect(i.massSource).toMatch(/iaea.org.*mass_1.mas20/);});
  it('does not silently reinterpret source tropical years as Julian years',()=>{const i=getIsotope('Co-60')!;expect(i.halfLifeSeconds).toBe(5.2711*REFERENCE_YEAR_SECONDS);expect(convertTime(i.halfLifeSeconds,'s','y')).not.toBe(5.2711);expect(activityDecay(100,i.halfLifeSeconds,i.halfLifeSeconds).remainingActivityBq).toBe(50);});
  it('distinguishes Tc-99m from the ground-state mass',()=>{const i=getIsotope('Tc-99m')!;expect(i.atomicMassU).toBeGreaterThan(98.906249681);expect(i.massNote).toMatch(/isomer/);expect(i.decayNote).toMatch(/Tc-99 is excluded/);});
  it('has reference uncertainty and scope metadata for every isotope',()=>{for(const i of ISOTOPES){expect(i.atomicMassUncertaintyU).toBeGreaterThan(0);expect(i.halfLifeUncertainty).toBeGreaterThan(0);expect(i.evaluationDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);expect(i.decayNote.length).toBeGreaterThan(25);}});
  it('does not invent data for an unknown nuclide',()=>expect(getIsotope('Imaginary-123')).toBeUndefined());
});
