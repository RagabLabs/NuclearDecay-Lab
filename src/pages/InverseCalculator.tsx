import {halfLifeContribution,type ModelQuantity} from '../science/precision';
import {AVOGADRO} from '../science/constants';
import { useEffect,useMemo,useState } from 'react';
import { Localized,useI18n } from '../i18n';
import { inverseDecay, type InverseUnknown } from '../science/inverse';
import { massFromActivity,activityDecay } from '../science/decay';
import { TIME_UNITS,MASS_UNITS,ACTIVITY_UNITS,parseNumber,convertTime,convertActivity,convertMass,constantFromSI,type TimeUnit,type MassUnit } from '../science/units';
import { DEFAULT_INPUTS,IsotopeInputs,type DecayInputs } from '../components/IsotopeInputs';
import { getIsotope } from '../data/isotopes';
import { PageHeading,Panel,Field,SelectField,Metric,ErrorBox,Notice } from '../components/ui';
import { CalculationTools } from '../components/CalculationTools';
import { AnalysisActions } from '../components/AnalysisActions';
import { basicRecord,referencesFor,type Quantity,type CalculationRecord } from '../science/records';
import { fmt,errorMessage,estimateText } from '../utils/format';
import { validateDecayInputs,changedUnit } from '../utils/session';
interface State {input:DecayInputs;unknown:InverseUnknown;final:string;outputTime:TimeUnit;outputMass:MassUnit}
const DEFAULT:State={input:{...DEFAULT_INPUTS,elapsed:'16.0466'},unknown:'initial',final:'25',outputTime:'d',outputMass:'µg'};
function valid(x:unknown):x is State {if(!x||typeof x!=='object')return false;const s=x as State;return validateDecayInputs(s.input)&&['initial','final','time','half','lambda','nuclei','mass'].includes(s.unknown)&&typeof s.final==='string'&&s.final.length<120&&Object.hasOwn(TIME_UNITS,s.outputTime)&&Object.hasOwn(MASS_UNITS,s.outputMass);}
export function InverseCalculator(){
 const {language}=useI18n();const [unitError,setUnitError]=useState<string|null>(null);const [state,setState]=useState<State>(DEFAULT);const {input,unknown}=state;
 const setInput=(v:DecayInputs)=>setState({...state,input:v});
 const needsHalf=!['half','lambda'].includes(unknown);const needsTime=['initial','final','half','lambda'].includes(unknown);
 const needsInitial=['final','time','half','lambda'].includes(unknown);const needsFinal=unknown!=='final';
    useEffect(()=>setUnitError(null),[state]);
 const result=useMemo(()=>{try{
  const isotope=getIsotope(input.isotopeId);
  const h=needsHalf?(isotope?.halfLifeSeconds??convertTime(parseNumber(input.half,'Half-life'),input.halfUnit)):1;
  const a0=needsInitial?convertActivity(parseNumber(input.activity,'Initial activity'),input.activityUnit):0;
  const final=needsFinal?convertActivity(parseNumber(state.final,'Final activity'),input.activityUnit):0;
  const elapsed=needsTime?convertTime(parseNumber(input.elapsed,'Elapsed time'),input.timeUnit):0;
  const M=unknown==='mass'?(isotope?.molarMass??parseNumber(input.molar,'Molar mass')):undefined;
  const answer:{value:number|null;unit:string;explanation?:string}=unknown==='mass'?{value:massFromActivity(final,h,M!),unit:'g'}:inverseDecay(unknown,{initialBq:a0,finalBq:final,halfSeconds:h,elapsedSeconds:elapsed});
  const sensitivityContext=answer.value!==null&&needsHalf?activityDecay(unknown==='initial'?answer.value:unknown==='nuclei'||unknown==='mass'?final:a0,h,unknown==='time'?answer.value:elapsed):null;
  const sensitivityKind:ModelQuantity=unknown==='final'?'activity':unknown==='initial'?'initial':unknown==='lambda'?'rate':unknown==='half'?'half':unknown;
  const uncertainty=answer.value===null||!sensitivityContext?null:halfLifeContribution(answer.value,sensitivityContext,isotope,sensitivityKind);
  const inputs:Quantity[]=[];
  if(needsInitial)inputs.push({label:'Initial activity',value:input.activity,unit:input.activityUnit,si:`${fmt(a0,12)} Bq`});
  if(needsFinal)inputs.push({label:'Final activity',value:state.final,unit:input.activityUnit,si:`${fmt(final,12)} Bq`});
  if(needsTime)inputs.push({label:'Elapsed time',value:input.elapsed,unit:input.timeUnit,si:`${fmt(elapsed,12)} s`});
  if(needsHalf)inputs.push({label:'Half-life',value:isotope?fmt(isotope.halfLifeValue,12):input.half,unit:isotope?.referenceUnit??input.halfUnit,si:`${fmt(h,12)} s`});
  if(M!==undefined)inputs.push({label:'Molar mass',value:fmt(M,12),unit:'g mol⁻¹'});
  const formulas:Record<InverseUnknown,string>={initial:'A₀ = A(t) exp[ln(2) t/T½]',final:'A(t) = A₀ exp[−ln(2) t/T½]',time:'t = ln[A₀/A(t)] T½ / ln(2)',half:'T½ = t ln(2) / ln[A₀/A(t)]',lambda:'λ = ln[A₀/A(t)] / t',nuclei:'N = A/λ = A T½ / ln(2)',mass:'m = A T½ M / [ln(2) Nₐ]'};
  const substitutions:Record<InverseUnknown,string>={initial:`${fmt(final,12)} × exp[ln(2) × ${fmt(elapsed,12)}/${fmt(h,12)}]`,final:`${fmt(a0,12)} × exp[−ln(2) × ${fmt(elapsed,12)}/${fmt(h,12)}]`,time:`ln[${fmt(a0,12)}/${fmt(final,12)}] × ${fmt(h,12)}/ln(2)`,half:`${fmt(elapsed,12)} × ln(2)/ln[${fmt(a0,12)}/${fmt(final,12)}]`,lambda:`ln[${fmt(a0,12)}/${fmt(final,12)}]/${fmt(elapsed,12)}`,nuclei:`${fmt(final,12)} × ${fmt(h,12)}/ln(2)`,mass:`${fmt(final,12)} × ${fmt(h,12)} × ${fmt(M??0,12)} / [ln(2) × ${AVOGADRO.toExponential(8)}]`};
  const record:CalculationRecord=basicRecord('Inverse decay calculator',inputs,[{label:'Result',value:answer.value===null?(unknown==='final'?'Below numerical range':'No finite result'):estimateText(answer.value,uncertainty),unit:answer.unit,numerical:answer.value===null?undefined:String(answer.value)}],
   [{label:'Convert to SI',expression:inputs.map(q=>`${q.value} ${q.unit??''}${q.si?` = ${q.si}`:''}`).join('\n')},{label:'Apply the law',expression:formulas[unknown]},{label:'Numerical substitution',expression:substitutions[unknown]},{label:'Result',expression:answer.value===null?answer.explanation??'Unavailable':`${fmt(answer.value,12)} ${answer.unit}`}],needsHalf?referencesFor(input.isotopeId):[]);
  return {answer,record,uncertainty,error:null};
 }catch(e){return {answer:null,record:null,uncertainty:null,error:errorMessage(e)};}},[state,needsHalf,needsTime,needsInitial,needsFinal,input,unknown]);
 const names:Record<InverseUnknown,string>={initial:'Initial activity',final:'Final activity',time:'Elapsed time',half:'Half-life',lambda:'Decay constant',nuclei:'Radioactive nuclei',mass:'Isotope mass'};
 const a=result.answer;
 let display='';
 if(a?.value===null)display=unknown==='final'?'Below numerical range':'No finite result';
 else if(a){try{
  const convert=(v:number)=>['initial','final'].includes(unknown)?convertActivity(v,'Bq',input.activityUnit):['time','half'].includes(unknown)?convertTime(v,'s',state.outputTime):unknown==='lambda'?constantFromSI(v,state.outputTime):unknown==='mass'?convertMass(v,'g',state.outputMass):v;
  display=estimateText(convert(a.value!),result.uncertainty===null?null:convert(result.uncertainty));
 }catch{display='Outside unit range';}}

 const outputUnit=['initial','final'].includes(unknown)?input.activityUnit:['time','half'].includes(unknown)?state.outputTime:unknown==='lambda'?`${state.outputTime}⁻¹`:unknown==='mass'?state.outputMass:'nuclei';
 return <Localized><PageHeading title="Inverse decay calculator" description={language==='ar'?'اختر المتغير المجهول. تُطلب فقط المعطيات اللازمة لحل محدد رياضيًا.':'Choose the unknown. Only the inputs required for a mathematically defined solution are shown.'}/>
 <AnalysisActions page="inverse" value={state} onLoad={setState} validate={valid} onClear={()=>setState({...DEFAULT,input:{...DEFAULT.input,isotopeId:'custom',half:'',activity:'',elapsed:'',molar:''},final:''})}/>
 <div className="two-column"><Panel title="Given inputs"><SelectField label="Solve for" value={unknown} onChange={v=>setState({...state,unknown:v as InverseUnknown})}>{Object.entries(names).map(([key,label])=><option key={key} value={key}>{label}</option>)}</SelectField>
 {needsHalf&&<IsotopeInputs value={input} onChange={setInput} showTime={false} showActivity={false} showMass={unknown==='mass'}/>}
 {needsInitial&&<Field label="Initial activity" value={input.activity} onChange={v=>setInput({...input,activity:v})} unit={input.activityUnit} units={Object.keys(ACTIVITY_UNITS)} onUnit={v=>{try{setState({...state,final:changedUnit(state.final,input.activityUnit,v,'activity'),input:{...input,activity:changedUnit(input.activity,input.activityUnit,v,'activity'),activityUnit:v as typeof input.activityUnit}});setUnitError(null);}catch(e){setUnitError(errorMessage(e));}}}/>}
 {needsFinal&&<Field label="Final activity" value={state.final} onChange={v=>setState({...state,final:v})} unit={input.activityUnit} units={Object.keys(ACTIVITY_UNITS)} onUnit={v=>{try{setState({...state,final:changedUnit(state.final,input.activityUnit,v,'activity'),input:{...input,activity:changedUnit(input.activity,input.activityUnit,v,'activity'),activityUnit:v as typeof input.activityUnit}});setUnitError(null);}catch(e){setUnitError(errorMessage(e));}}}/>}
 {needsTime&&<Field label="Elapsed time" value={input.elapsed} onChange={v=>setInput({...input,elapsed:v})} unit={input.timeUnit} units={Object.keys(TIME_UNITS)} onUnit={v=>{try{setInput({...input,elapsed:changedUnit(input.elapsed,input.timeUnit,v,'time'),timeUnit:v as TimeUnit});setUnitError(null);}catch(e){setUnitError(errorMessage(e));}}}/>}
 <ErrorBox message={unitError??result.error}/><button className="button secondary" onClick={()=>setState({...DEFAULT,input:{...DEFAULT.input}})}>Load example</button></Panel>
 <Panel title="Result"><ErrorBox message={unitError??result.error}/>{a&&<Metric label={names[unknown]} value={display} unit={a.value===null?undefined:outputUnit} accent/>}{a?.explanation&&<Notice>{a.explanation}</Notice>}
 {['time','half','lambda'].includes(unknown)&&<div className="field"><label htmlFor="inverse-output-unit">Output time base</label><select id="inverse-output-unit" value={state.outputTime} onChange={e=>setState({...state,outputTime:e.target.value as TimeUnit})}>{Object.keys(TIME_UNITS).map(u=><option key={u}>{u}</option>)}</select></div>}
 {unknown==='mass'&&<div className="field"><label htmlFor="inverse-mass-unit">Mass unit</label><select id="inverse-mass-unit" value={state.outputMass} onChange={e=>setState({...state,outputMass:e.target.value as MassUnit})}>{Object.keys(MASS_UNITS).map(u=><option key={u}>{u}</option>)}</select></div>}
 <CalculationTools record={result.record}/><h3>Solution conditions</h3><p className="muted">{language==='ar'?'حل نصف العمر أو ثابت التحلل يتطلب زمنًا موجبًا ونشاطًا نهائيًا موجبًا أقل من الابتدائي. تساوي النشاطين لا يحدد نصف عمر محدودًا. الهدف الصفري لا يُبلغ في زمن محدود.':'A finite positive half-life or decay constant inferred from two activities requires t > 0 and 0 < A(t) < A₀. Equal positive activities do not identify a finite half-life. Exact-zero target activity is reached only asymptotically.'}</p>
 </Panel></div></Localized>;
}
