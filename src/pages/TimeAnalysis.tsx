import { useEffect,useMemo,useState } from 'react';
import { Localized,useI18n } from '../i18n';
import { RefreshCw,Download } from 'lucide-react';
import { analyzeTimes,completeAnalysis } from '../science/decay';
import { generateTimes } from '../science/inverse';
import { plotQuantity,plotUnit,PLOT_LABELS,type PlotQuantity } from '../science/chartData';
import { TIME_UNITS,MASS_UNITS,parseTimes,parseNumber,type TimeUnit,type MassUnit } from '../science/units';
import { DEFAULT_INPUTS,IsotopeInputs,resolveInputs,type DecayInputs } from '../components/IsotopeInputs';
import { DecayChart } from '../components/DecayChart';
import { ErrorBox,Notice,PageHeading,Panel,Field,SelectField } from '../components/ui';
import { CalculationTools } from '../components/CalculationTools';
import { AnalysisActions } from '../components/AnalysisActions';
import { basicRecord,decayRecord,type CalculationRecord } from '../science/records';
import { fmt,errorMessage,modelText,modelPercentText,modelActivityText } from '../utils/format';
import { makeCsv,downloadCsv,timeAnalysisCsv } from '../utils/export';
import { changedUnit,validateDecayInputs } from '../utils/session';
interface State {input:DecayInputs;times:string;start:string;end:string;count:string;mode:'custom'|'interval';quantity:PlotQuantity;massUnit:MassUnit}
const DEFAULT:State={input:{...DEFAULT_INPUTS},times:'0, 2, 4, 8, 16, 24, 32, 40',start:'0',end:'40',count:'9',mode:'custom',quantity:'activity',massUnit:'µg'};
function valid(x:unknown):x is State{if(!x||typeof x!=='object')return false;const s=x as State;return validateDecayInputs(s.input)&&typeof s.times==='string'&&s.times.length<=12000&&['start','end','count'].every(k=>typeof s[k as keyof State]==='string')&&['custom','interval'].includes(s.mode)&&Object.hasOwn(PLOT_LABELS,s.quantity)&&Object.hasOwn(MASS_UNITS,s.massUnit);}
export function TimeAnalysis(){
 const [state,setState]=useState<State>(DEFAULT);const [unitError,setUnitError]=useState<string|null>(null);const {language}=useI18n();const {input}=state;
    useEffect(()=>setUnitError(null),[state]);
 const result=useMemo(()=>{try{
  const x=resolveInputs({...input,molar:state.quantity==='mass'?input.molar:''});const times=state.mode==='custom'?parseTimes(state.times):generateTimes(parseNumber(state.start,'Start time'),parseNumber(state.end,'End time'),parseNumber(state.count,'Point count'));
  if(state.quantity==='mass'&&x.molarMass===undefined)throw new Error('Supply an isotope molar mass (g/mol) to calculate mass.');
  const rows=analyzeTimes(x.initialBq,x.halfSeconds,times,TIME_UNITS[input.timeUnit].factor);
  const values=rows.map(row=>plotQuantity(row,state.quantity,input.activityUnit,state.massUnit,x.molarMass));
  const low=Math.min(...times),high=Math.max(...times);const end=high>low?high:low+x.halfSeconds/TIME_UNITS[input.timeUnit].factor;
  const base=decayRecord({...input,molar:state.quantity==='mass'?input.molar:'',elapsed:String(times[times.length-1])},completeAnalysis(x.initialBq,x.halfSeconds,rows[rows.length-1].elapsedSeconds,x.molarMass));
  const unit=plotUnit(state.quantity,input.activityUnit,state.massUnit);
  const table={headers:[`Time (${input.timeUnit})`,`${PLOT_LABELS[state.quantity]} (${unit})`,'Remaining (%)','ln(activity/Bq)','Activity underflow'],rows:rows.map((r,i)=>[r.time,values[i].value??'outside_numeric_range',r.remainingPercent,r.logRemainingActivity===null?'undefined':Number.isFinite(r.logRemainingActivity)?r.logRemainingActivity:'below_log_range',String(r.underflow)])};
  const givens=[...base.inputs,{label:'Sampling mode',value:state.mode==='custom'?'Custom times':'Interval'},...(state.mode==='interval'?[{label:'Start time',value:state.start,unit:input.timeUnit},{label:'End time',value:state.end,unit:input.timeUnit},{label:'Point count',value:state.count}]:[{label:'Time points',value:state.times,unit:input.timeUnit}])];
  const displayRows=rows.map((r,i)=>[fmt(r.time),values[i].value===null?'Unavailable':state.quantity==='activity'||state.quantity==='decayed'?modelActivityText(r,input.activityUnit,x.isotope,state.quantity==='decayed'):modelText(values[i].value,r,x.isotope,state.quantity==='remaining'?'remaining':state.quantity),modelPercentText(r,x.isotope),r.logRemainingActivity===null?'undefined':Number.isFinite(r.logRemainingActivity)?fmt(r.logRemainingActivity):'below_log_range',String(r.underflow)]);
  const record:CalculationRecord={...basicRecord('Time analysis',givens,[{label:'Point count',value:String(rows.length)},{label:'Displayed variable',value:PLOT_LABELS[state.quantity]}],
   [{label:'Convert to SI',expression:`t_s = t_${input.timeUnit} × ${TIME_UNITS[input.timeUnit].factor}`},{label:'Apply the law',expression:'Aᵢ = A₀ exp[−ln(2) tᵢ/T½]\nNᵢ = Aᵢ/λ; mᵢ = Nᵢ M/Nₐ'},{label:'Evaluate each time',expression:rows.slice(0,12).map((r,i)=>`${fmt(r.time,10)} ${input.timeUnit} → ${values[i].value===null?'unavailable':fmt(values[i].value,10)} ${unit}`).join('\n'),explanation:language==='ar'?'تعرض الخطوات أول 12 نقطة؛ يتضمن الجدول والتصدير جميع النقاط.':'Steps show the first 12 points; the table and export contain every calculated point.'}],base.references,base.notes),table:{...table,displayRows}};
  return {x,rows,values,start:low,end,unit,record,error:null};
 }catch(e){return {x:null,rows:[],values:[],start:0,end:1,unit:'',record:null,error:errorMessage(e)};}},[state,input,language]);
 function changeUnit(next:TimeUnit){try{const times=state.mode==='custom'?parseTimes(state.times).map(t=>changedUnit(String(t),input.timeUnit,next,'time')).join(', '):state.times;setState({...state,input:{...input,timeUnit:next},times,start:changedUnit(state.start,input.timeUnit,next,'time'),end:changedUnit(state.end,input.timeUnit,next,'time')});setUnitError(null);}catch(e){setUnitError(errorMessage(e));}}
 function generateHalf(){try{const x=resolveInputs(input);const h=x.halfSeconds/TIME_UNITS[input.timeUnit].factor;setState({...state,mode:'custom',times:Array.from({length:9},(_,i)=>String(h*i/2)).join(', ')});}catch(e){setUnitError(errorMessage(e));}}
 function csv(){if(!result.record)return;downloadCsv(state.quantity==='activity'?timeAnalysisCsv(result.rows,input.timeUnit,input.activityUnit,result.x?.isotope):makeCsv(result.record.table!.headers,result.record.table!.rows),'nuclear-time-analysis.csv');}
 return <Localized><PageHeading title="Time analysis" description="One sample, many moments. Build an activity table and explore its curve live."/>
 <AnalysisActions page="time-analysis" value={state} onLoad={setState} validate={valid} onClear={()=>setState({...DEFAULT,input:{...DEFAULT.input,isotopeId:'custom',half:'',activity:'',molar:''},times:'',start:'',end:'',count:''})}/>
 <div className="analysis-layout"><Panel title="Sample & time points"><IsotopeInputs value={input} onChange={v=>setState({...state,input:v})} showTime={false} showMass={state.quantity==='mass'}/>
 <div className="segmented wide"><button className={state.mode==='custom'?'active':''} aria-pressed={state.mode==='custom'} onClick={()=>setState({...state,mode:'custom'})}>Custom times</button><button className={state.mode==='interval'?'active':''} aria-pressed={state.mode==='interval'} onClick={()=>setState({...state,mode:'interval'})}>Interval</button></div>
 {state.mode==='custom'?<div className="field"><label htmlFor="times">{language==='ar'?'النقاط الزمنية':'Time points'} ({input.timeUnit})</label><textarea id="times" value={state.times} onChange={e=>setState({...state,times:e.target.value})} rows={4} spellCheck={false} aria-describedby="times-hint"/><small id="times-hint">Separate values with commas, spaces or line breaks. Up to 1,000 points; all must be nonnegative.</small></div>:<><Field label="Start time" value={state.start} onChange={v=>setState({...state,start:v})} unit={input.timeUnit}/><Field label="End time" value={state.end} onChange={v=>setState({...state,end:v})} unit={input.timeUnit}/><Field label="Point count" value={state.count} onChange={v=>setState({...state,count:v})}/></>}
 <SelectField label="Time-point unit" value={input.timeUnit} onChange={v=>changeUnit(v as TimeUnit)}>{Object.keys(TIME_UNITS).map(u=><option key={u}>{u}</option>)}</SelectField><SelectField label="Displayed variable" value={state.quantity} onChange={v=>setState({...state,quantity:v as PlotQuantity})}>{Object.entries(PLOT_LABELS).map(([key,label])=><option key={key} value={key}>{label}</option>)}</SelectField>
 {state.quantity==='mass'&&<SelectField label="Mass unit" value={state.massUnit} onChange={v=>setState({...state,massUnit:v as MassUnit})}>{Object.keys(MASS_UNITS).map(u=><option key={u}>{u}</option>)}</SelectField>}
 <button className="button secondary full" onClick={generateHalf}><RefreshCw size={15}/>Generate half-life points</button><ErrorBox message={unitError??result.error}/></Panel>
 <div>{result.x?<Panel className="chart-panel"><DecayChart series={[{id:'value',label:input.isotopeId,initialBq:result.x.initialBq,halfSeconds:result.x.halfSeconds,molarMass:result.x.molarMass,points:result.rows}]} timeUnit={input.timeUnit} activityUnit={input.activityUnit} initialStart={result.start} initialEnd={result.end} quantity={state.quantity} massUnit={state.massUnit} title="Time-series curve"/></Panel>:<Notice>{language==='ar'?'أدخل عينة وقيمًا زمنية صحيحة لإظهار النتائج.':'Enter a valid sample and time values to generate results.'}</Notice>}<CalculationTools record={result.record}/></div></div>
 {result.x&&<Panel title="Your time-series results" actions={<button className="button secondary small" onClick={csv}><Download size={14}/>Export CSV</button>}><div className="table-scroll"><table><thead><tr><th>Elapsed time ({input.timeUnit})</th><th>{PLOT_LABELS[state.quantity]} ({result.unit})</th><th>Remaining</th><th>Half-lives</th></tr></thead><tbody>{result.rows.map((r,i)=><tr key={i}><td className="numeric">{fmt(r.time)}</td><td className="numeric">{result.values[i].value===null?'Unavailable':state.quantity==='activity'||state.quantity==='decayed'?modelActivityText(r,input.activityUnit,result.x!.isotope,state.quantity==='decayed'):modelText(result.values[i].value,r,result.x!.isotope,state.quantity==='remaining'?'remaining':state.quantity)}</td><td className="numeric">{modelPercentText(r,result.x!.isotope)}</td><td className="numeric">{modelText(r.halfLivesElapsed,r,result.x!.isotope,'halfLives')}</td></tr>)}</tbody></table></div></Panel>}
 </Localized>;
}
