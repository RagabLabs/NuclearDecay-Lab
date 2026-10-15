import type { TimePoint } from './decay';
import { AVOGADRO, represent } from './decay';
import { ACTIVITY_UNITS, MASS_UNITS, convertActivity, type ActivityUnit, type MassUnit } from './units';
import {MIN_NORMAL} from './constants';
export type PlotQuantity='activity'|'decayed'|'remaining'|'nuclei'|'mass';
export function plotQuantity(point:TimePoint,quantity:PlotQuantity,activityUnit:ActivityUnit,massUnit:MassUnit,molarMass?:number):{value:number|null;log10:number|null} {
  if(quantity==='remaining')return {value:point.remainingPercent,log10:-point.decayExponent/Math.LN10+2};
  if(quantity==='decayed'){
    const log=point.logDecayedActivity===null?null:point.logDecayedActivity-Math.log(ACTIVITY_UNITS[activityUnit]);
    let value:number|null;try{value=log===null?0:point.decayedActivityBq>=MIN_NORMAL?convertActivity(point.decayedActivityBq,'Bq',activityUnit):represent(log,'Chart value',true);}catch{value=null;}
    return {value,log10:log===null?null:log/Math.LN10};
  }
  if(quantity==='mass'&&(molarMass===undefined||molarMass<=0))return {value:null,log10:null};
  let logValue=point.logRemainingActivity;
  if(logValue!==null){
    if(quantity==='activity')logValue-=Math.log(ACTIVITY_UNITS[activityUnit]);
    if(quantity==='nuclei'||quantity==='mass')logValue-=Math.log(point.lambdaPerSecond);
    if(quantity==='mass')logValue+=Math.log(molarMass!)-Math.log(AVOGADRO)-Math.log(MASS_UNITS[massUnit]);
  }
  let value:number|null;
  try{value=logValue===null?0:quantity==='activity'&&point.remainingActivityBq>=MIN_NORMAL?convertActivity(point.remainingActivityBq,'Bq',activityUnit):represent(logValue,'Chart value',true);}catch{value=null;}
  return {value,log10:logValue===null?null:logValue/Math.LN10};
}
export function plotUnit(quantity:PlotQuantity,activityUnit:ActivityUnit,massUnit:MassUnit):string{return quantity==='remaining'?'%':quantity==='nuclei'?'nuclei':quantity==='mass'?massUnit:activityUnit;}
export const PLOT_LABELS:Record<PlotQuantity,string>={activity:'Remaining activity',decayed:'Activity lost',remaining:'Remaining',nuclei:'Radioactive nuclei',mass:'Isotope mass'};
