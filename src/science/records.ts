import { completeAnalysis, decayConstant, type CompleteResult } from './decay';
import type { DecayInputs } from '../components/IsotopeInputs';
import { convertTime, convertActivity } from './units';
import { getIsotope,ISOTOPES, AME_URL, CODATA_URL, NUBASE_URL } from '../data/isotopes';
import {AVOGADRO,LN2,AME_PAPER_URL} from './constants';
import {halfLifeContribution,type ModelQuantity} from './precision';
import { fmt,modelText,modelPercentText,numericalText,referenceHalfText } from '../utils/format';
export interface Quantity {label:string;value:string;unit?:string;si?:string;numerical?:string;referenceContribution?:string}
export interface CalculationStep {label:string;expression:string;explanation?:string}
export interface CalculationRecord {title:string;inputs:Quantity[];results:Quantity[];steps:CalculationStep[];notes:string[];references:{label:string;url:string}[];table?:{headers:string[];rows:(string|number)[][];displayRows?:(string|number)[][]}}
export const MODEL_NOTES=[
  'Single parent nuclide or isomer; closed sample and constant half-life.',
  'No daughter ingrowth, full decay chain, dose, shielding or transport calculation.',
  'No combined output uncertainty is inferred. Reference-aware display rounding uses only first-order half-life sensitivity with user inputs held fixed; it does not include their unknown uncertainties or combine molar-mass uncertainty.',
  'Numerical details, substitutions and CSV retain central-value precision for reproducibility, not extra measurement precision.',
  'UI years are Julian (31,557,600 s); DDEP source years are tropical (31,556,926 s).',
  'Avogadro constant: 6.02214076 × 10²³ mol⁻¹, exact. Activity is in Bq and λ is in s⁻¹.',
];
export function referencesFor(id:string){const i=getIsotope(id);return i?[{label:'DDEP half-life',url:i.halfLifeSource},{label:'AME2020 mass',url:AME_URL},{label:'CODATA constants',url:CODATA_URL},...(i.massNote?[{label:'NUBASE excitation',url:NUBASE_URL},{label:'AME2020 energy conversion',url:AME_PAPER_URL}]:[])]:[{label:'CODATA constants',url:CODATA_URL}];}
export function decayRecord(input:DecayInputs,r?:CompleteResult):CalculationRecord {
  const i=getIsotope(input.isotopeId);
  const h=i?.halfLifeSeconds??convertTime(Number(input.half),input.halfUnit);
  const a=convertActivity(Number(input.activity),input.activityUnit);
  const t=convertTime(Number(input.elapsed),input.timeUnit);
  const result=r??completeAnalysis(a,h,t,i?.molarMass??(input.molar?Number(input.molar):undefined));
  const quantities:Quantity[]=[{label:'Radioisotope',value:i?.name??input.customName??'Custom isotope'},{label:'Initial activity',value:input.activity,unit:input.activityUnit,si:`${fmt(a,12)} Bq`},
    {label:'Half-life',value:i?fmt(i.halfLifeValue,12):input.half,unit:i?.referenceUnit??input.halfUnit,si:`${fmt(h,12)} s`},{label:'Elapsed time',value:input.elapsed,unit:input.timeUnit,si:`${fmt(t,12)} s`}];
  if(result.molarMassGPerMol!==null)quantities.push({label:'Molar mass',value:fmt(result.molarMassGPerMol,12),unit:'g mol⁻¹'});
  const results:Quantity[]=[{label:'Remaining activity',value:result.underflow?'Below numerical range':modelText(result.remainingActivityBq,result,i,'activity'),unit:'Bq',numerical:numericalText(result.remainingActivityBq)},{label:'Activity lost',value:modelText(result.decayedActivityBq,result,i,'lost'),unit:'Bq',numerical:numericalText(result.decayedActivityBq)},
    {label:'Decay constant',value:modelText(result.lambdaPerSecond,result,i,'rate'),unit:'s⁻¹',numerical:numericalText(result.lambdaPerSecond)},{label:'Remaining',value:modelPercentText(result,i).replace('%',''),unit:'%',numerical:numericalText(result.remainingPercent)},{label:'Decayed',value:modelPercentText(result,i,true).replace('%',''),unit:'%',numerical:numericalText(result.decayedPercent)},
    {label:'Radioactive nuclei',value:modelText(result.nuclei,result,i,'nuclei'),numerical:numericalText(result.nuclei)},{label:'Isotope mass',value:modelText(result.isotopeMassG,result,i,'mass'),unit:'g',numerical:numericalText(result.isotopeMassG)},
    {label:'Half-life',value:i?referenceHalfText(i,'s'):fmt(result.halfLifeSeconds),unit:'s',numerical:numericalText(result.halfLifeSeconds)},{label:'Elapsed half-lives',value:modelText(result.halfLivesElapsed,result,i,'halfLives'),numerical:numericalText(result.halfLivesElapsed)}];
  const steps:CalculationStep[]=[{label:'Convert to SI',expression:quantities.filter(q=>q.si).map(q=>`${q.value} ${q.unit} = ${q.si}`).join('\n')},
    {label:'Calculate the decay constant',expression:`λ = ln(2) / T½ = ${fmt(LN2,12)} / ${fmt(h,12)} = ${fmt(result.lambdaPerSecond,12)} s⁻¹`},
    {label:'Evaluate the exponential',expression:`A(t) = A₀ exp[−ln(2) t/T½]\n= ${fmt(a,12)} × exp(−ln(2) × ${fmt(t,12)} / ${fmt(h,12)})\n= ${result.underflow?'below numerical range':fmt(result.remainingActivityBq,12)} Bq`},
    {label:'Evaluate the stable loss',expression:`ΔA = A₀ [−expm1(−λt)] = ${fmt(result.decayedActivityBq,12)} Bq`,explanation:'The loss is evaluated independently to avoid subtracting nearly equal activities.'},
    {label:'Convert activity to nuclei',expression:`N(t) = A(t) / λ = ${fmt(result.nuclei,12)}`,explanation:'The number of nuclei is an expected ensemble count.'}];
  if(result.molarMassGPerMol!==null)steps.push({label:'Convert nuclei to mass',expression:result.nuclei===null?
    `m(t) = exp[ln(A(t)) − ln(λ) + ln(M) − ln(Nₐ)]\n= ${fmt(result.isotopeMassG,12)} g`:
    `m(t) = N(t) M / Nₐ\n= ${fmt(result.nuclei,12)} × ${fmt(result.molarMassGPerMol,12)} / ${AVOGADRO.toExponential(8)}\n= ${fmt(result.isotopeMassG,12)} g`,explanation:result.nuclei===null?'Mass is evaluated in log space even when the intermediate nucleus count is outside numerical range.':undefined});
  steps.push({label:'Interpret the result',expression:`${fmt(result.halfLivesElapsed,12)} T½ → ${fmt(result.remainingPercent,12)}%`,explanation:'These results all refer to the selected parent at the same elapsed time.'});
  if(i)quantities.push({label:'DDEP evaluation',value:i.evaluationDate},{label:'Reference half-life uncertainty (k = 1)',value:fmt(i.halfLifeUncertainty,12),unit:i.referenceUnit},{label:'Atomic mass',value:fmt(i.atomicMassU,12),unit:'u'},{label:'Atomic mass uncertainty (k = 1)',value:fmt(i.atomicMassUncertaintyU,12),unit:'u'});
  const kinds:ModelQuantity[]=['activity','lost','rate','remaining','decayed','nuclei','mass','half','halfLives'];
  const values=[result.remainingActivityBq,result.decayedActivityBq,result.lambdaPerSecond,result.remainingPercent,result.decayedPercent,result.nuclei,result.isotopeMassG,result.halfLifeSeconds,result.halfLivesElapsed];
  results.forEach((q,index)=>{const u=values[index]===null?null:halfLifeContribution(values[index]!,result,i,kinds[index]);if(u!==null)q.referenceContribution=fmt(u,2);});
  return {title:'Complete Decay Analysis',inputs:quantities,results,steps,notes:[...MODEL_NOTES,...result.warnings,...result.unavailable,...(i?[i.decayNote,...(i.massNote?[i.massNote]:[])]:[])],references:referencesFor(input.isotopeId)};
}
export function basicRecord(title:string,inputs:Quantity[],results:Quantity[],steps:CalculationStep[],references:CalculationRecord['references']=[{label:'CODATA constants',url:CODATA_URL}],notes:string[]=MODEL_NOTES):CalculationRecord {
  const used=ISOTOPES.filter(i=>references.some(r=>r.url===i.halfLifeSource));
  const metadata:Quantity[]=used.flatMap(i=>[{label:i.id+' reference T½',value:`${fmt(i.halfLifeValue)} ± ${fmt(i.halfLifeUncertainty)}`,unit:i.referenceUnit},{label:i.id+' DDEP evaluation',value:i.evaluationDate},{label:i.id+' atomic mass',value:`${fmt(i.atomicMassU,12)} ± ${fmt(i.atomicMassUncertaintyU)}`,unit:'u'}]);
  return {title,inputs:[...inputs,...metadata],results,steps,notes,references:[...new Map(references.map(r=>[r.url,r])).values()]};
}
export function halfRecord(value:string,unit:string,halfSeconds:number,mode:'half'|'constant'):CalculationRecord {
  const lambda=decayConstant(halfSeconds);
  return basicRecord('Half-life & decay constant',[{label:mode==='half'?'Half-life':'Decay constant',value,unit:mode==='half'?unit:`${unit}⁻¹`}],[{label:'Half-life',value:fmt(halfSeconds),unit:'s',numerical:String(halfSeconds)},{label:'Decay constant',value:fmt(lambda),unit:'s⁻¹',numerical:String(lambda)}],
    [{label:'Convert to SI',expression:mode==='half'?`${value} ${unit} = ${fmt(halfSeconds,12)} s`:`${value} ${unit}⁻¹ = ${fmt(lambda,12)} s⁻¹`},
     {label:'Apply the law',expression:mode==='half'?`λ = ln(2)/T½ = ${fmt(LN2,12)}/${fmt(halfSeconds,12)} = ${fmt(lambda,12)} s⁻¹`:`T½ = ln(2)/λ = ${fmt(LN2,12)}/${fmt(lambda,12)} = ${fmt(halfSeconds,12)} s`}]);
}
