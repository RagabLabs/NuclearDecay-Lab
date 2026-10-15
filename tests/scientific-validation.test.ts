import {describe,it,expect} from 'vitest';
import {completeAnalysis,activityDecay,massFromNuclei,nucleiFromMass,decayConstant,activityFromMass,nucleiFromActivity,massFromActivity} from '../src/science/decay';
import {inverseDecay} from '../src/science/inverse';
import {plotQuantity} from '../src/science/chartData';
import {ISOTOPES,getIsotope} from '../src/data/isotopes';
import {TIME_UNITS,ACTIVITY_UNITS,MASS_UNITS,convertTime,convertActivity,convertMass,type TimeUnit,type ActivityUnit,type MassUnit} from '../src/science/units';
import {halfLifeContribution,halfLifeUncertaintySeconds} from '../src/science/precision';
import {modelActivityText,modelPercentText,referenceHalfText,compactInput,displayActivityValue} from '../src/utils/format';
import {makeCsv,timeAnalysisCsv} from '../src/utils/export';
import {PHYSICAL_CONSTANTS} from '../src/science/constants';
import fixtures from './fixtures/independent-decay.json';

/** Bound grows with logarithmic/exponential conditioning; subnormal values get one output ULP. */
function agreement(actual:number,expected:number,condition=1){
  const relativeBound=128*Number.EPSILON*Math.max(1,condition);
  expect(Math.abs(actual-expected)).toBeLessThanOrEqual(Math.max(Number.MIN_VALUE,Math.abs(expected)*relativeBound));
}
describe('Independent 160-digit Decimal reference calculations',()=>{
  it.each(fixtures.cases)('$name agrees with an independently generated solution',c=>{
    const {initial,half,time,molar}=c.input;
    const r=completeAnalysis(initial,half,time,molar);
    const condition=1+Math.abs(Number(c.expected.exponent))+Math.abs(Math.log(initial))+Math.abs(Math.log(half));
    for(const [key,actual] of Object.entries({remaining:r.remainingActivityBq,lost:r.decayedActivityBq,lambda:r.lambdaPerSecond,nuclei:r.nuclei,mass:r.isotopeMassG})){
      const expected=Number(c.expected[key as keyof typeof c.expected]);
      if(Number.isFinite(expected)&&expected>=Number.MIN_VALUE){expect(actual).not.toBeNull();agreement(actual!,expected,condition);}
      else if(!Number.isFinite(expected))expect(actual).toBeNull();
    }
    agreement(plotQuantity({...r,time},'remaining','Bq','g').value!,Number(c.expected.remainingPercent),condition);
  });
  it('keeps a representable percentage after the fractional survival has underflowed',()=>{
    const r=activityDecay(1e300,1,1075);
    expect(r.remainingFraction).toBe(0);
    expect(plotQuantity({...r,time:1075},'remaining','Bq','g').value).toBeGreaterThan(0);
  });
  it('recovers subnormal activity correctly in a display unit with a larger numerical value',()=>{
    const c=fixtures.cases.find(c=>c.name==='subnormal-activity')!;
    const r=activityDecay(c.input.initial,c.input.half,c.input.time);
    const expected=Number(c.expected.remaining+'')*1e6;
    // Use Decimal's unrounded scientific value by parsing its scaled exponent, not its subnormal binary64 Bq value.
    const [mantissa,exponent]=c.expected.remaining.split('E');
    const scaled=Number(mantissa+'e'+(Number(exponent)+6));
    expect(scaled).not.toBe(expected);
    agreement(plotQuantity({...r,time:c.input.time},'activity','µBq','g').value!,scaled,1000);
    agreement(displayActivityValue(r,'µBq')!,scaled,1000);
  });
});
describe('Independent inverse solutions, including near-equal observations and wide scales',()=>{
 for(const c of fixtures.inverseCases){
  const {initial,final,half,time,molar}=c.input;
  for(const key of ['initial','final','time','half','lambda','nuclei','mass'] as const){
   it(`${c.name}: ${key} agrees with Decimal rather than a forward round trip`,()=>{
    const actual=key==='mass'?massFromActivity(final,half,molar):inverseDecay(key,{initialBq:initial,finalBq:final,elapsedSeconds:time,halfSeconds:half}).value;
    const expected=Number(c.expected[key==='lambda'?'rate':key]);
    expect(actual).not.toBeNull();agreement(actual!,expected,1+Math.abs(Math.log(Math.abs(expected))));
   });
  }
 }
});
describe('Carbon-14 measurement precision and unit conventions',()=>{
 const c=getIsotope('C-14')!;
 it('retains the sourced central value, uncertainty, year conversion and identity',()=>{
  expect(c.halfLifeValue).toBe(5700);expect(c.halfLifeUncertainty).toBe(30);expect(c.halfLifeSeconds).toBe(179874478200);
  expect(halfLifeUncertaintySeconds(c)).toBe(946707780);expect(c.atomicNumber).toBe(6);expect(c.massNumber).toBe(14);expect(c.state).toBe('ground');
  expect(convertTime(c.halfLifeSeconds,'s','y')).toBe(5699.878260704236);
 });
 it('shows reference-compatible rounding and keeps the independently verified numerical result',()=>{
  const r=activityDecay(1e8,c.halfLifeSeconds,5730*31557600);
  expect(referenceHalfText(c,'y')).toBe('5,700 ± 30');expect(modelActivityText(r,'MBq',c)).toBe('49.82');expect(modelPercentText(r,c)).toBe('49.82%');
  agreement(r.remainingActivityBq,49817183.766240387,3);
 });
 it('uses only a declared half-life contribution; it does not invent a user-input uncertainty',()=>{
  const r=activityDecay(1e8,c.halfLifeSeconds,c.halfLifeSeconds);
  agreement(halfLifeContribution(r.remainingActivityBq,r,c,'activity')!,Math.log(2)*50e6*30/5700,5);
  expect(halfLifeContribution(50,r,undefined,'activity')).toBeNull();
  expect(halfLifeContribution(1,activityDecay(1,c.halfLifeSeconds,c.halfLifeSeconds*1000),c,'activity')).toBeNull();
 });
 it.each(ISOTOPES)('$id retains its exact one-half-life normalization',i=>{
  const r=completeAnalysis(1e8,i.halfLifeSeconds,i.halfLifeSeconds,i.molarMass);
  expect(r.remainingActivityBq).toBe(5e7);expect(r.remainingPercent).toBe(50);
  const n0=completeAnalysis(1e8,i.halfLifeSeconds,0,i.molarMass).nuclei!;
  agreement(r.nuclei!,n0/2,100);
 });
 it.each(Object.keys(TIME_UNITS) as TimeUnit[])('equivalent C-14 elapsed time in %s preserves SI physics',unit=>{
  const value=convertTime(5730,'y',unit);
  const r=activityDecay(1e8,c.halfLifeSeconds,convertTime(value,unit));
  agreement(r.remainingActivityBq,49817183.766240387,3);
 });
 it.each(Object.keys(ACTIVITY_UNITS) as ActivityUnit[])('equivalent initial activity in %s preserves physical activity',unit=>{
  const encoded=convertActivity(1e8,'Bq',unit);
  agreement(activityDecay(convertActivity(encoded,unit),c.halfLifeSeconds,c.halfLifeSeconds).remainingActivityBq,5e7,3);
 });
 it.each(Object.keys(MASS_UNITS) as MassUnit[])('mass round trip through %s preserves nuclei count',unit=>{
  const m=convertMass(131,'g',unit);
  const n=nucleiFromMass(convertMass(m,unit),131);
  agreement(n,6.02214076e23,100);
  agreement(massFromNuclei(n,131),131,100);
 });
 it('scales a small isotope mass without first underflowing an intermediate mass',()=>{
  agreement(massFromNuclei(1e-300,1,1e-100),1.6605390671738467e-224,1000);
 });
 it('does not report exact-zero nuclei when a positive activity is representable',()=>{
  const a=activityFromMass(1e-300,1e-300,1,1e-100);
  expect(a).toBeGreaterThan(0);expect(()=>nucleiFromActivity(a,decayConstant(1e-300))).toThrow(/below/);
 });
 it('distinguishes conventional constants and measured constants without duplicated values',()=>{
  const na=PHYSICAL_CONSTANTS.find(c=>c.name==='Avogadro constant')!;
  expect(na.value).toBe(6.02214076e23);expect(na.exact).toBe(true);expect(na.uncertainty).toBe(0);
  expect(PHYSICAL_CONSTANTS.find(c=>c.name==='Molar mass constant')!.exact).toBe(false);
 });
 it('keeps shortened input formatting separate from numerical data',()=>{
  const raw='5699.878260704236';expect(compactInput(raw,4)).toBe('5700');expect(Number(raw)).toBe(5699.878260704236);
 });
 it('exports finite numerical flags and independent percentage data',()=>{
  const r={...activityDecay(1e300,1,1075),time:1075};
  const csv=timeAnalysisCsv([r],'s','Bq');expect(csv).toContain('remaining_percentage');expect(csv).toContain(String(r.remainingPercent));
  expect(makeCsv(['test'],[[Infinity],[NaN],[-Infinity]])).not.toMatch(/Infinity|NaN/);
 });
});
