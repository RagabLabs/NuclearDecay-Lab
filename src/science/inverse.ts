import { activityDecay, nucleiFromActivity, decayConstant, halfLife, timeToTarget, logActivityRatio, represent } from './decay';
import { ScientificError, nonnegative, positive } from './units';
import {LN2} from './constants';

export function initialActivity(finalBq:number,halfSeconds:number,elapsedSeconds:number):number {
  nonnegative(finalBq,'Final activity');nonnegative(elapsedSeconds,'Elapsed time');
  decayConstant(halfSeconds);
  if(finalBq===0)return 0; // With a finite t and finite T½, exact A(t)=0 uniquely implies A₀=0.
  if(elapsedSeconds===0)return finalBq;
  const exponent=LN2*(elapsedSeconds/halfSeconds);
  return represent(Math.log(finalBq)+exponent,'Initial activity');
}
export function rateFromActivityPair(initialBq:number,finalBq:number,elapsedSeconds:number):number {
  positive(initialBq,'Initial activity');positive(finalBq,'Final activity');positive(elapsedSeconds,'Elapsed time');
  if(finalBq>initialBq)throw new ScientificError('A decreasing parent-only model requires final activity below initial activity.');
  if(finalBq===initialBq)throw new ScientificError('Equal positive activities at t > 0 imply λ = 0 (no decay), with no finite half-life in this radioactive model.');
  return positive(represent(Math.log(logActivityRatio(initialBq,finalBq))-Math.log(elapsedSeconds),'Decay constant'),'Decay constant');
}
export function halfLifeFromActivityPair(initialBq:number,finalBq:number,elapsedSeconds:number):number {
  return halfLife(rateFromActivityPair(initialBq,finalBq,elapsedSeconds));
}
export function generateTimes(start:number,end:number,count:number):number[] {
  nonnegative(start,'Start time');nonnegative(end,'End time');
  if(end<=start)throw new ScientificError('End time must be greater than start time.');
  if(!Number.isInteger(count)||count<2||count>1000)throw new ScientificError('Point count must be an integer between 2 and 1,000.');
  const span=end-start;
  const values=Array.from({length:count},(_,i)=>i===count-1?end:start+(i/(count-1))*span);
  if(values.some((v,i)=>i>0&&v<=values[i-1]))throw new ScientificError('Time points cannot be distinguished at double precision. Widen the interval or reduce the point count.');
  return values;
}
export type InverseUnknown='initial'|'final'|'time'|'half'|'lambda'|'nuclei'|'mass';
export function inverseDecay(unknown:Exclude<InverseUnknown,'mass'>,args:{initialBq:number;finalBq:number;elapsedSeconds:number;halfSeconds:number;nuclei?:number}): {value:number|null;unit:string;explanation?:string} {
  switch(unknown){
    case 'initial':return {value:initialActivity(args.finalBq,args.halfSeconds,args.elapsedSeconds),unit:'Bq'};
    case 'final':{const r=activityDecay(args.initialBq,args.halfSeconds,args.elapsedSeconds);return {value:r.underflow?null:r.remainingActivityBq,unit:'Bq',explanation:r.underflow?r.warnings[0]:undefined};}
    case 'time':{const r=timeToTarget(args.initialBq,args.finalBq,args.halfSeconds);return r.kind==='finite'?{value:r.seconds,unit:'s'}:{value:null,unit:'s',explanation:r.explanation};}
    case 'half':return {value:halfLifeFromActivityPair(args.initialBq,args.finalBq,args.elapsedSeconds),unit:'s'};
    case 'lambda':return {value:rateFromActivityPair(args.initialBq,args.finalBq,args.elapsedSeconds),unit:'s⁻¹'};
    case 'nuclei':return {value:nucleiFromActivity(args.finalBq,decayConstant(args.halfSeconds)),unit:'nuclei'};
  }
}
