import { convertActivity, convertTime, convertMass, constantFromSI, type ActivityUnit, type TimeUnit, type MassUnit } from '../science/units';
import type {DecayResult,CompleteResult} from '../science/decay';
import type {Isotope} from '../data/isotopes';
import {halfLifeContribution,halfLifeUncertaintySeconds,type ModelQuantity} from '../science/precision';
import {MIN_NORMAL} from '../science/constants';
import {represent} from '../science/decay';
import {ACTIVITY_UNITS} from '../science/units';

export function fmt(value: number | null, digits = 6): string {
  if (value === null) return 'Unavailable';
  if (!Number.isFinite(value)) return 'Beyond numeric range';
  if (value === 0) return '0';
  const a = Math.abs(value);
  if (a >= 1e6 || a < 1e-3) return value.toExponential(digits - 1).replace(/\.?(0+)(?=e)/, '').replace('e+', 'e');
  return Number(value.toPrecision(digits)).toLocaleString('en-US', {maximumFractionDigits: 12});
}
export function referenceDigits(value:number,uncertainty:number|null):number {
 if(!uncertainty||uncertainty<=0||!Number.isFinite(uncertainty)||value===0)return 6;
 const roundedU=Number(uncertainty.toPrecision(2));
 return Math.max(1,Math.min(15,Math.floor(Math.log10(Math.abs(value)))-Math.floor(Math.log10(roundedU))+2));
}
export function estimateText(value:number|null,uncertainty:number|null):string{return fmt(value,value===null?6:referenceDigits(value,uncertainty));}
export function measurementText(value:number,uncertainty:number):string{return `${estimateText(value,uncertainty)} ± ${fmt(uncertainty,2)}`;}
export function compactInput(raw:string,digits=9):string {
 if(!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(raw.trim()))return raw;
 const n=Number(raw);if(!Number.isFinite(n)||n===0)return raw;
 return String(Number(n.toPrecision(digits)));
}
export function modelText(value:number|null,r:DecayResult,i:Isotope|undefined,quantity:ModelQuantity):string{return estimateText(value,value===null?null:halfLifeContribution(value,r,i,quantity));}
export function modelActivityText(r:DecayResult,unit:ActivityUnit,i?:Isotope,lost=false):string {
 try{const value=displayActivityValue(r,unit,lost);if(value===null)return 'Below numerical range';
  const relative=i?i.halfLifeUncertainty/i.halfLifeValue:null;
  const logU=relative===null||r.decayExponent===0||r.logRemainingActivity===null?null:r.logRemainingActivity+Math.log(r.decayExponent)+Math.log(relative)-Math.log(ACTIVITY_UNITS[unit]);
  const u=relative===null||r.decayExponent*relative>0.2?null:logU===null?0:represent(logU,'Reference contribution',true);
  return estimateText(value,u);
 }catch{return 'Outside unit range';}
}
export function displayActivityValue(r:DecayResult,unit:ActivityUnit,lost=false):number|null {
 const value=lost?r.decayedActivityBq:r.remainingActivityBq;const log=lost?r.logDecayedActivity:r.logRemainingActivity;
 if(log===null)return 0;
 const output=value>=MIN_NORMAL?convertActivity(value,'Bq',unit):represent(log-Math.log(ACTIVITY_UNITS[unit]),'Display activity',true);
 return output===0?null:output;
}
export function modelPercentText(r:DecayResult,i?:Isotope,decayed=false):string{return modelText(decayed?r.decayedPercent:r.remainingPercent,r,i,decayed?'decayed':'remaining')+'%';}
export function referenceHalfText(i:Isotope,unit:TimeUnit):string{return measurementText(convertTime(i.halfLifeSeconds,'s',unit),convertTime(halfLifeUncertaintySeconds(i),'s',unit));}
export function modelMassText(r:CompleteResult,unit:MassUnit,i?:Isotope):string {
 if(r.isotopeMassG===null)return 'Unavailable';try{return estimateText(convertMass(r.isotopeMassG,'g',unit),i?convertMass(halfLifeContribution(r.isotopeMassG,r,i,'mass')??0,'g',unit):null);}catch{return 'Outside unit range';}
}
export function numericalText(value:number|null):string{return value===null?'Unavailable':Number.isFinite(value)?String(value):'Beyond numeric range';}
export function percentageText(value:number):string{return fmt(value)+'%';}
function convertedFormat(convert:()=>number,digits=6):string {
  try{return fmt(convert(),digits);}catch{return 'Outside unit range';}
}
export function activityText(bq:number,unit:ActivityUnit,digits=6):string {return convertedFormat(()=>convertActivity(bq,'Bq',unit),digits);}
export function timeText(seconds:number,unit:TimeUnit,digits=6):string {return convertedFormat(()=>convertTime(seconds,'s',unit),digits);}
export function massText(grams:number,unit:MassUnit,digits=6):string {return convertedFormat(()=>convertMass(grams,'g',unit),digits);}
export function rateText(si:number,unit:TimeUnit,digits=6):string {return convertedFormat(()=>constantFromSI(si,unit),digits);}
export function percent(fraction: number): string { return `${fmt(fraction * 100, 6)}%`; }
export function compact(value: number): string {
  if (value === 0) return '0';
  return Math.abs(value) >= 1e5 || Math.abs(value) < 0.001 ? value.toExponential(1).replace('e+', 'e') : fmt(value, 4);
}
export function errorMessage(error: unknown): string { return error instanceof Error ? error.message : 'Unable to calculate. Check the inputs.'; }
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
}
