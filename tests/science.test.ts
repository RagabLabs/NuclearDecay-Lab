import { describe, expect, it } from 'vitest';
import { AVOGADRO, activityDecay, decayConstant, halfLife, timeToTarget, timeToPercentage, nucleiFromActivity, activityFromNuclei, massFromNuclei, nucleiFromMass, massFromActivity, activityFromMass, completeAnalysis, analyzeTimes, sampleCurve } from '../src/science/decay';
import { convertTime, convertActivity, convertMass, constantToSI, constantFromSI, parseNumber, parseTimes } from '../src/science/units';
function relative(actual:number,expected:number,tolerance=2e-13){expect(Math.abs(actual/expected-1)).toBeLessThan(tolerance);}
describe('Forward decay invariants',()=>{
  it.each([1,1e-15,8*86400,1e20,1e300])('half-life %s s gives 50%% after one and 25%% after two',h=>{
    relative(activityDecay(100,h,h).remainingActivityBq,50);
    relative(activityDecay(100,h,h*2).remainingActivityBq,25);
  });
  it('preserves the exact initial activity at zero elapsed time',()=>{
    expect(activityDecay(123456.789,19,0).remainingActivityBq).toBe(123456.789);
    expect(activityDecay(123456.789,19,0).decayedActivityBq).toBe(0);
  });
  it('conserves A₀ = remaining + lost across representative scales',()=>{
    for(const a of [1e-200,1,1e100,1e308])for(const t of [0,1e-12,1,10,1000]){
      const r=activityDecay(a,7,t);relative(r.remainingActivityBq+r.decayedActivityBq,a);
    }
  });
  it('calculates a tiny loss without cancellation',()=>{
    const r=activityDecay(1e12,1,1e-20);
    expect(r.remainingFraction).toBe(1);
    relative(r.decayedActivityBq,1e-8*Math.LN2);
    expect(r.warnings.length).toBeGreaterThan(0);
  });
  it('recovers representable activity even if its fraction underflows',()=>{
    const r=activityDecay(1e300,1,1100);
    expect(r.remainingFraction).toBe(0);
    relative(r.remainingActivityBq,Math.exp(Math.log(1e300)-1100*Math.LN2));
    expect(r.underflow).toBe(false);
  });
  it('flags activity underflow without claiming physical zero',()=>{
    const r=activityDecay(1,1,2000);
    expect(r.remainingActivityBq).toBe(0);expect(r.underflow).toBe(true);
    expect(r.logRemainingActivity).toBe(-2000*Math.LN2);
    expect(r.warnings.join(' ')).toMatch(/not exact physical zero/);
  });
  it('handles zero activity',()=>{const r=completeAnalysis(0,1,10,50);expect(r.nuclei).toBe(0);expect(r.isotopeMassG).toBe(0);expect(r.underflow).toBe(false);});
  it('reports an out-of-range half-life count',()=>{const r=activityDecay(1,1e-200,1e200);expect(r.warnings.join(' ')).toMatch(/half-lives exceeds/);});
  it.each([-1,0,NaN,Infinity,-Infinity])('rejects invalid half-life %s',v=>expect(()=>activityDecay(1,v,0)).toThrow());
  it.each([-1,NaN,Infinity])('rejects invalid initial activity %s',v=>expect(()=>activityDecay(v,1,0)).toThrow());
  it.each([-1,NaN,Infinity])('rejects invalid time %s',v=>expect(()=>activityDecay(1,1,v)).toThrow());
  it('rejects a half-life that makes λ overflow',()=>expect(()=>decayConstant(Number.MIN_VALUE)).toThrow(/range/));
});
describe('Half-life ↔ constant',()=>{
  it.each([1e-100,1e-12,1,693251.12,1e17,1e300])('round trips %s s',h=>relative(halfLife(decayConstant(h)),h));
  it('converts rate denominators correctly',()=>{relative(constantToSI(86400,'d'),1);relative(constantFromSI(1,'h'),3600);});
  it.each([0,-1,NaN,Infinity])('rejects invalid λ %s',v=>expect(()=>halfLife(v)).toThrow());
});
describe('Inverse target calculation',()=>{
  it.each([50,25,10,99.999999,1e-200])('inverts a %s%% target',p=>{
    const target=timeToPercentage(p,90);expect(target.kind).toBe('finite');
    if(target.kind==='finite')relative(activityDecay(100,90,target.seconds).remainingActivityBq,p,1e-11);
  });
  it('handles equal target and initial activity',()=>expect(timeToTarget(70,70,9)).toEqual({kind:'finite',seconds:0}));
  it('uses explicit asymptotic result for exact zero',()=>expect(timeToTarget(70,0,9).kind).toBe('infinite'));
  it('does not overflow the ratio of huge initial and tiny target activity',()=>{
    const r=timeToTarget(1e300,1e-300,1);expect(r.kind).toBe('finite');if(r.kind==='finite')relative(activityDecay(1e300,1,r.seconds).remainingActivityBq,1e-300,2e-10);
  });
  it.each([[0,0,1],[10,11,1],[10,-1,1],[10,1,0],[Infinity,1,1]])('rejects invalid inverse %s,%s,%s',(a,t,h)=>expect(()=>timeToTarget(a,t,h)).toThrow());
  it.each([-0.1,100.1,NaN,Infinity])('rejects invalid percentage %s',p=>expect(()=>timeToPercentage(p,1)).toThrow());
});
describe('Nuclei and mass dimensions',()=>{
  it.each([1e-50,1,1e100])('activity ↔ nuclei round trip at %s Bq',a=>{const l=decayConstant(800);relative(activityFromNuclei(nucleiFromActivity(a,l),l),a);});
  it('one mole of nuclei has its molar mass in grams',()=>{relative(massFromNuclei(AVOGADRO,131),131);relative(nucleiFromMass(131,131),AVOGADRO);});
  it.each(['g','mg','µg','ng'] as const)('keeps mass conversion dimensions in %s',unit=>{const g=massFromNuclei(AVOGADRO,60);relative(convertMass(convertMass(g,'g',unit),unit,'g'),60);});
  it('activity ↔ mass round trip including isotope mass fraction',()=>{
    for(const f of [1,0.2,1e-12]){const m=massFromActivity(1e6,600,99,f);relative(activityFromMass(m,600,99,f),1e6);}
  });
  it('evaluates complete results at the elapsed time',()=>{
    const r=completeAnalysis(100e6,8*86400,16*86400,131);relative(r.remainingActivityBq,25e6);relative(r.nuclei!,25e6/decayConstant(8*86400));relative(r.isotopeMassG!,r.nuclei!/AVOGADRO*131);
  });
  it('does not require molar mass for the other complete results',()=>{const r=completeAnalysis(100,1,1);expect(r.isotopeMassG).toBeNull();expect(r.nuclei).not.toBeNull();});
  it('reports out-of-range derived quantities while keeping representable activity',()=>{const r=completeAnalysis(1e308,1e300,0,100);expect(r.remainingActivityBq).toBe(1e308);expect(r.nuclei).toBeNull();expect(r.isotopeMassG).toBeNull();expect(r.unavailable.length).toBe(2);});
  it('flags ensemble counts less than one',()=>expect(completeAnalysis(1e-5,1,0).warnings.join(' ')).toMatch(/ensemble/));
  it('uses log products to avoid unnecessary intermediate overflow',()=>expect(Number.isFinite(massFromActivity(1e300,1e15,1))).toBe(true));
  it.each([0,-1,NaN,Infinity])('rejects invalid molar mass %s',m=>expect(()=>massFromNuclei(1,m)).toThrow());
  it.each([0,-0.1,1.1,NaN])('rejects invalid mass fraction %s',f=>expect(()=>activityFromMass(1,1,1,f)).toThrow());
  it('rejects negative nuclei and mass',()=>{expect(()=>activityFromNuclei(-1,1)).toThrow();expect(()=>nucleiFromMass(-1,1)).toThrow();});
});
describe('Unit conversions and input parsing',()=>{
  it('defines all common SI conversions explicitly',()=>{expect(convertTime(1,'d')).toBe(86400);expect(convertTime(1,'y')).toBe(31557600);expect(convertActivity(1,'Ci')).toBe(3.7e10);expect(convertActivity(1,'MBq')).toBe(1e6);relative(convertTime(1,'fs'),1e-15);relative(convertMass(1,'ng'),1e-9);});
  it('is invariant to equivalent input units',()=>{const a=activityDecay(convertActivity(100,'MBq'),convertTime(8,'d'),convertTime(16,'d'));const b=activityDecay(convertActivity(1e8,'Bq'),convertTime(192,'h'),convertTime(384,'h'));expect(a.remainingActivityBq).toBe(b.remainingActivityBq);});
  it('rejects conversion overflow/underflow instead of silently returning infinity/zero',()=>{expect(()=>convertTime(1e308,'y')).toThrow();expect(()=>convertTime(1e-320,'fs')).toThrow();});
  it('supports exponent input and whitespace',()=>{expect(parseNumber(' 1.2e-12 ','input')).toBe(1.2e-12);expect(parseNumber('.25','input')).toBe(0.25);});
  it.each(['','NaN','Infinity','1.2.3','25 MBq','1,000','1e309','1e-999'])('rejects nonnumeric or unrepresentable %s',v=>expect(()=>parseNumber(v,'input')).toThrow());
  it('parses separate time tokens preserving order and duplicates',()=>expect(parseTimes('0, 2; 1\n2 1e2')).toEqual([0,2,1,2,100]));
  it('rejects negative times, no times and oversized lists',()=>{expect(()=>parseTimes('-1')).toThrow();expect(()=>parseTimes(' ')).toThrow();expect(()=>parseTimes(Array(1001).fill('1').join(','))).toThrow();});
});
describe('Multi-time and chart calculations',()=>{
  it('uses exact physical times and remaining fractions',()=>{const points=analyzeTimes(100,10,[0,10,20]);expect(points.map(p=>p.remainingActivityBq)).toEqual([100,50,25]);});
  it('uses the same curve model as the calculator',()=>{const c=sampleCurve(100,3600,5,3600,10);expect(c.length).toBe(11);expect(c[2].time).toBe(1);expect(c[2].remainingActivityBq).toBe(50);expect(c[10].remainingActivityBq).toBe(3.125);});
  it('changes when either A₀, half-life or range changes',()=>{expect(sampleCurve(200,1,2,1,2)[1].remainingActivityBq).toBe(100);expect(sampleCurve(100,2,2,1,2)[2].remainingActivityBq).toBe(50);expect(sampleCurve(100,1,4,1,2)[2].remainingActivityBq).toBe(6.25);});
  it('rejects invalid chart specifications',()=>{expect(()=>sampleCurve(1,1,0,1)).toThrow();expect(()=>sampleCurve(1,1,5,1,1)).toThrow();expect(()=>analyzeTimes(1,1,[])).toThrow();expect(()=>analyzeTimes(1,1,[1],0)).toThrow();});
});
