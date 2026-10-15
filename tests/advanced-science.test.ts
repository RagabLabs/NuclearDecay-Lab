import { describe,it,expect } from 'vitest';
import { activityDecay,completeAnalysis,decayConstant } from '../src/science/decay';
import { initialActivity,halfLifeFromActivityPair,rateFromActivityPair,inverseDecay,generateTimes } from '../src/science/inverse';
import { plotQuantity } from '../src/science/chartData';
import { changedUnit,validateDecayInputs,encodeAnalysis,decodeAnalysis,saveAnalysis,loadAnalysis,clearAnalyses } from '../src/utils/session';
import { DEFAULT_INPUTS } from '../src/components/IsotopeInputs';
import { calculationReport } from '../src/components/CalculationTools';
import { decayRecord,halfRecord } from '../src/science/records';
import { translate } from '../src/i18n';
function close(a:number,b:number,tol=2e-12){expect(Math.abs(a/b-1)).toBeLessThan(tol);}
describe('Numerical regression fixes from the review',()=>{
 it.each([1073.5,1074.5])('recovers correct activity when its fraction is quantized at %s half-lives',t=>{close(activityDecay(1e300,1,t).remainingActivityBq,Math.exp(Math.log(1e300)-Math.LN2*t));});
 it('recovers a positive subnormal loss without fraction quantization',()=>{const r=activityDecay(1e300,1e23,1e-300);close(r.decayedActivityBq,Math.LN2*1e-23);expect(r.warnings.join(' ')).toMatch(/subnormal|rounds/);});
 it('preserves a finite exponent despite overflow in the half-life count',()=>{const r=activityDecay(1,.8,Number.MAX_VALUE);expect(Number.isFinite(r.logRemainingActivity)).toBe(true);close(-r.logRemainingActivity!,Number.MAX_VALUE*(Math.LN2/.8),1e-12);expect(r.warnings.join(' ')).toMatch(/half-lives exceeds/);});
 it('explains when a strictly positive loss underflows',()=>{const r=activityDecay(Number.MIN_VALUE,1,.1);expect(r.decayedActivityBq).toBe(0);expect(r.warnings.join(' ')).toMatch(/zero physical decay/);});
 it('distinguishes percentage underflow from a still representable positive activity',()=>{const r=activityDecay(1e300,1,2000);expect(r.remainingFraction).toBe(0);expect(r.remainingActivityBq).toBeGreaterThan(0);expect(r.underflow).toBe(false);expect(r.warnings.join(' ')).toContain('0% is not exact physical zero');});
});
describe('Inverse calculations and mathematical uniqueness',()=>{
 it.each([1e-100,1,1e100])('recovers A₀ at scale %s',a=>{const r=activityDecay(a,9,18);close(initialActivity(r.remainingActivityBq,9,18),a);});
 it('defines exact-zero initial activity from exact-zero final activity at finite time',()=>expect(initialActivity(0,8,16)).toBe(0));
 it('rejects unrepresentable initial activity instead of Infinity',()=>expect(()=>initialActivity(1e300,1,100)).toThrow(/range/));
 it.each([1e-200,1,1e100])('recovers half-life from two activities at %s s',h=>{const r=activityDecay(80,h,h*2);close(halfLifeFromActivityPair(80,r.remainingActivityBq,h*2),h);close(rateFromActivityPair(80,r.remainingActivityBq,h*2),decayConstant(h));});
 it('retains tiny changes at huge activity without subtracting two equal logarithms',()=>{const a0=1e300,a=a0-2e284;close(halfLifeFromActivityPair(a0,a,1),4.66132682559407e15);});
 it('retains an inverse half-life with the smallest representable elapsed time',()=>{const a0=1e300,a=a0-2e284;close(halfLifeFromActivityPair(a0,a,Number.MIN_VALUE),2.303001448564564e-308);});
 it.each([[100,100,0],[0,0,1],[100,100,1],[100,0,1],[100,200,1],[100,50,-1]])('rejects insufficient or incompatible pair %s,%s,%s',(a,b,t)=>expect(()=>halfLifeFromActivityPair(a,b,t)).toThrow());
 it('solves all six central inverse modes against known values',()=>{const args={initialBq:100,finalBq:25,halfSeconds:10,elapsedSeconds:20};expect(inverseDecay('final',args).value).toBe(25);close(inverseDecay('initial',args).value!,100);close(inverseDecay('time',args).value!,20);close(inverseDecay('half',args).value!,10);close(inverseDecay('lambda',args).value!,Math.LN2/10);close(inverseDecay('nuclei',args).value!,25/(Math.LN2/10));});
});
describe('Interval analysis and plot consistency',()=>{
 it('includes both endpoints and uses the requested point count',()=>expect(generateTimes(2,10,5)).toEqual([2,4,6,8,10]));
 it('supports 1,000 distinguishable time points',()=>{const t=generateTimes(0,100,1000);expect(t.length).toBe(1000);expect(t[999]).toBe(100);});
 it.each([[0,0,3],[-1,10,3],[2,1,3],[0,10,1],[0,10,2.5],[0,10,1001]])('rejects invalid interval %s,%s,%s',(a,b,n)=>expect(()=>generateTimes(a,b,n)).toThrow());
 it('rejects indistinguishable times at the current precision',()=>expect(()=>generateTimes(1e300,1e300+1e285,1000)).toThrow(/distinguished/));
 it('uses the calculation engine for activity, nuclei and mass curves',()=>{const r={...activityDecay(100e6,8*86400,16*86400),time:16};const c=completeAnalysis(100e6,8*86400,16*86400,131);close(plotQuantity(r,'activity','MBq','g').value!,25);close(plotQuantity(r,'nuclei','MBq','g').value!,c.nuclei!);close(plotQuantity(r,'mass','MBq','ng',131).value!,c.isotopeMassG!*1e9);expect(plotQuantity(r,'remaining','MBq','g').value).toBe(25);close(plotQuantity(r,'decayed','MBq','g').value!,75);});
 it('does not invent a mass if no molar mass is available',()=>{const r={...activityDecay(1,1,1),time:1};expect(plotQuantity(r,'mass','Bq','g').value).toBeNull();});
 it('preserves finite logarithmic survival coordinates in an extreme range',()=>{const r={...activityDecay(1,.8,Number.MAX_VALUE),time:Number.MAX_VALUE};expect(Number.isFinite(plotQuantity(r,'remaining','Bq','g').log10)).toBe(true);});
});
describe('Units, saved analyses and link data',()=>{
 it('changing display units preserves physical quantities',()=>{expect(changedUnit('100','MBq','Bq','activity')).toBe('100000000');expect(changedUnit('2','d','h','time')).toBe('48');expect(changedUnit('1','g','mg','mass')).toBe('1000');expect(changedUnit('1','s','h','rate')).toBe('3600');});
 it('rejects unsupported and overflowing conversions',()=>{expect(()=>changedUnit('1','wrong','s','time')).toThrow();expect(()=>changedUnit('1e308','Bq','µBq','activity')).toThrow();});
 it('preserves a representable quantity through a large display-unit conversion',()=>{close(Number(changedUnit('1e300','MBq','GBq','activity')),1e297);expect(changedUnit('1e300','Ci','Ci','activity')).toBe('1e+300');});
 it('encodes and restores Unicode custom isotope names without losing units',()=>{const data={...DEFAULT_INPUTS,isotopeId:'custom',customName:'نظير تجريبي'};expect(decodeAnalysis(encodeAnalysis(data))).toEqual(data);expect(validateDecayInputs(data)).toBe(true);});
 it.each(['!!!','a'.repeat(24001),'eyJ2ZXJzaW9uIjo5fQ'])('rejects invalid shared payload',p=>expect(()=>decodeAnalysis(p)).toThrow());
 it('rejects a prototype-polluting or oversized payload',()=>{expect(()=>encodeAnalysis(JSON.parse('{"__proto__":{"polluted":true}}'))).toThrow();expect(()=>encodeAnalysis('x'.repeat(20000))).toThrow();});
 it('validates every unit and custom name from untrusted links',()=>{expect(validateDecayInputs({...DEFAULT_INPUTS,halfUnit:'weeks'})).toBe(false);expect(validateDecayInputs({...DEFAULT_INPUTS,customName:{bad:true}})).toBe(false);});
 it.each(['toString','constructor','__proto__'])('rejects inherited object properties as unit %s',unit=>{expect(validateDecayInputs({...DEFAULT_INPUTS,halfUnit:unit})).toBe(false);expect(()=>changedUnit('1',unit,'s','time')).toThrow(/Unknown time unit/);});
 it('rejects circular or deeply nested share data with a useful validation error',()=>{const circular:{value?:unknown}={};circular.value=circular;expect(()=>encodeAnalysis(circular)).toThrow(/unsupported/);let deep:unknown={};for(let n=0;n<25;n++)deep={value:deep};expect(()=>encodeAnalysis(deep)).toThrow(/unsupported/);});
 it('saves, reloads and clears only this application’s data',()=>{localStorage.clear();localStorage.setItem('other-app','keep');saveAnalysis('analysis',DEFAULT_INPUTS);expect(loadAnalysis('analysis')).toEqual(DEFAULT_INPUTS);clearAnalyses();expect(loadAnalysis('analysis')).toBeUndefined();expect(localStorage.getItem('other-app')).toBe('keep');});
});
describe('Dynamic calculation records, reports and localization',()=>{
 it('reports the current values, conversions, reference links and all solution steps',()=>{const input={...DEFAULT_INPUTS,activity:'200'};const record=decayRecord(input);expect(record.results[0].value).toBe('1e8');expect(record.steps.map(s=>s.expression).join(' ')).toContain('2e8');expect(record.inputs.find(q=>q.label==='Initial activity')!.si).toBe('2e8 Bq');const html=calculationReport(record);expect(html).toContain('Calculation steps');expect(html).toContain('I-131_tables.pdf');});
 it('produces an Arabic RTL report while keeping equations LTR',()=>{const html=calculationReport(decayRecord(DEFAULT_INPUTS),'ar');expect(html).toContain('lang="ar" dir="rtl"');expect(html).toContain('خطوات الحل');expect(html).toContain('direction:ltr');expect(html).toContain('طباعة / PDF');});
 it('escapes arbitrary user-supplied names in scientific reports',()=>{const input={...DEFAULT_INPUTS,isotopeId:'custom',customName:'<img src=x onerror=alert(1)>',molar:''};const html=calculationReport(decayRecord(input));expect(html).toContain('&lt;img');expect(html).not.toContain('<img src=x');});
 it('records both directions of half-life/rate conversion',()=>{expect(halfRecord('2','h',7200,'half').steps[0].expression).toContain('7,200 s');expect(halfRecord('1','s',Math.LN2,'constant').steps[1].expression).toContain('T½ =');});
 it('explains a representable mass without substituting an unavailable intermediate nucleus count',()=>{const r=decayRecord({...DEFAULT_INPUTS,isotopeId:'custom',half:'1e23',halfUnit:'s',activity:'1e300',activityUnit:'Bq',elapsed:'0',timeUnit:'s',molar:'1'});const mass=r.steps.find(s=>s.label==='Convert nuclei to mass')!;expect(mass.expression).toContain('ln(A(t))');expect(mass.expression).not.toContain('Unavailable ×');expect(mass.explanation).toContain('log space');});
 it('uses correct Arabic terminology and translates dynamic validation',()=>{expect(translate('Half-life','ar')).toBe('نصف العمر');expect(translate('Initial activity cannot be negative.','ar')).toContain('لا يمكن أن يكون سالبًا');expect(translate('1.25e-9','ar')).toBe('1.25e-9');});
});
