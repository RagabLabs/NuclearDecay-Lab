import type {Isotope} from '../data/isotopes';
import type {DecayResult} from './decay';
export type ModelQuantity='activity'|'lost'|'remaining'|'decayed'|'rate'|'half'|'halfLives'|'nuclei'|'mass'|'time'|'initial';
export function halfLifeUncertaintySeconds(i:Isotope):number{return i.halfLifeSeconds*(i.halfLifeUncertainty/i.halfLifeValue);}
/** First-order half-life contribution ONLY. User inputs are held fixed; no total budget is inferred. */
export function halfLifeContribution(value:number,r:DecayResult,i:Isotope|undefined,quantity:ModelQuantity):number|null {
 if(!i||!Number.isFinite(value)||!Number.isFinite(r.decayExponent))return null;
 const relative=i.halfLifeUncertainty/i.halfLifeValue;
 const x=r.decayExponent;
 const factor=['activity','remaining','initial'].includes(quantity)?x:['nuclei','mass'].includes(quantity)?1+x:1;
 if(factor*relative>0.2)return null; // Avoid suggesting a reliable linearized contribution in a strongly nonlinear tail.
 const base=quantity==='lost'?r.remainingActivityBq:quantity==='decayed'?r.remainingPercent:Math.abs(value);
 const sensitivity=['lost','decayed'].includes(quantity)?x:factor;
 const u=base*(sensitivity*relative);
 return Number.isFinite(u)?u:null;
}
