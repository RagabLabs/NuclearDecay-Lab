import { useMemo, useRef, useState } from 'react';
import { CartesianGrid,XAxis,YAxis,Tooltip,ResponsiveContainer,Line,ComposedChart,ReferenceLine,ReferenceDot,Legend } from 'recharts';
import { Download,ChartNoAxesCombined,ZoomIn,ZoomOut,RotateCcw } from 'lucide-react';
import { activityDecay, analyzeTimes, type TimePoint } from '../science/decay';
import { generateTimes } from '../science/inverse';
import { plotQuantity,plotUnit,PLOT_LABELS,type PlotQuantity } from '../science/chartData';
import { TIME_UNITS,parseNumber,convertTime,type ActivityUnit,type TimeUnit,type MassUnit } from '../science/units';
import { compact,errorMessage,fmt,modelActivityText,modelPercentText,modelText } from '../utils/format';
import {getIsotope} from '../data/isotopes';
import {NumericInput} from './NumericInput';
import { chartToPng } from '../utils/export';
import { Localized,useI18n } from '../i18n';
import { ErrorBox } from './ui';
export interface ChartSeries {id:string;label:string;initialBq:number;halfSeconds:number;color?:string;molarMass?:number;points?:TimePoint[]}
export const CHART_COLORS=['#0b8e80','#5366d3','#d57827','#c64f83','#278caf','#658c39','#9265b5','#9c7940'];
export interface DecayChartProps {series:ChartSeries[];timeUnit:TimeUnit;activityUnit:ActivityUnit;initialEnd:number;initialStart?:number;markerSeconds?:number;title?:string;quantity?:PlotQuantity;massUnit?:MassUnit}
export function DecayChart({series,timeUnit,activityUnit,initialEnd,initialStart=0,markerSeconds,title='Activity over time',quantity='activity',massUnit='g'}:DecayChartProps){
 const {t}=useI18n();
 const [scale,setScale]=useState<'linear'|'log'>('linear');
 const [range,setRange]=useState<{start:string;end:string}|null>(null);
 const [previousUnit,setPreviousUnit]=useState(timeUnit);
 const [inspection,setInspection]=useState<string|null>(null);
 const [hidden,setHidden]=useState<string[]>([]);
 const [showHalf,setShowHalf]=useState(true);const [showInitial,setShowInitial]=useState(false);
 const [exportError,setExportError]=useState<string|null>(null);const [exporting,setExporting]=useState(false);
 const container=useRef<HTMLDivElement>(null);
 if(previousUnit!==timeUnit){const ratio=TIME_UNITS[previousUnit].factor/TIME_UNITS[timeUnit].factor;setPreviousUnit(timeUnit);if(range)setRange({start:String(Number(range.start)*ratio),end:String(Number(range.end)*ratio)});if(inspection!==null)setInspection(String(Number(inspection)*ratio));}
 const unit=plotUnit(quantity,activityUnit,massUnit);
 const computed=useMemo(()=>{
  try{
   const start=parseNumber(range?.start??String(initialStart),'Range start');
   const end=parseNumber(range?.end??String(initialEnd),'Range end');
   const times=generateTimes(start,end,181);
   const curves=series.map(s=>s.points?([...s.points].sort((a,b)=>a.time-b.time)):analyzeTimes(s.initialBq,s.halfSeconds,times,TIME_UNITS[timeUnit].factor));
   const rows=curves[0]?.map((p,index)=>{
    const row:Record<string,number|null>={time:p.time};
    series.forEach((s,j)=>{const q=plotQuantity(curves[j][index],quantity,activityUnit,massUnit,s.molarMass);const value=scale==='log'?q.log10:q.value;row[s.id]=value!==null&&Number.isFinite(value)?value:null;});return row;
   })??[];
   const ys=rows.flatMap(row=>series.filter(s=>!hidden.includes(s.id)).map(s=>row[s.id])).filter((v):v is number=>v!==null&&Number.isFinite(v));
   if(showInitial&&quantity==='activity')series.filter(s=>!hidden.includes(s.id)).forEach(s=>{const q=plotQuantity({...activityDecay(s.initialBq,s.halfSeconds,0),time:0},quantity,activityUnit,massUnit);const value=scale==='log'?q.log10:q.value;if(value!==null&&Number.isFinite(value))ys.push(value);});
   const lo=ys.length?Math.min(...ys):0,hi=ys.length?Math.max(...ys):1;
   const yDomain:[number,number]=scale==='linear'?[0,hi>0?hi:1]:lo===hi?[lo-1,hi+1]:[lo,hi];
   const requested=inspection===null?(markerSeconds===undefined?null:markerSeconds/TIME_UNITS[timeUnit].factor):parseNumber(inspection,'Inspect time');
   if(requested!==null&&requested<0)throw new Error('Inspect time cannot be negative.');
   const inspected=requested===null?[]:series.filter(s=>!hidden.includes(s.id)).map(s=>{const r={...activityDecay(s.initialBq,s.halfSeconds,convertTime(requested,timeUnit)),time:requested};const q=plotQuantity(r,quantity,activityUnit,massUnit,s.molarMass);return {s,r,q};});
   return {rows,start,end,requested,inspected,yDomain,error:null};
  }catch(e){return {rows:[],start:0,end:1,requested:null,inspected:[],yDomain:[0,1] as [number,number],error:errorMessage(e)};}
 },[series,timeUnit,activityUnit,initialEnd,initialStart,range,inspection,quantity,massUnit,scale,hidden,markerSeconds,showInitial]);
 function zoom(factor:number){const span=computed.end-computed.start;const center=computed.start+span/2;const width=span*factor;const next=Math.max(0,center-width/2);if(!Number.isFinite(next+width)){setExportError(t('Chart range exceeds numerical range.'));return;}setExportError(null);setRange({start:String(next),end:String(next+width)});}
 async function exportPng(){try{setExportError(null);setExporting(true);const svg=container.current?.querySelector<SVGSVGElement>('.recharts-surface');if(!svg)throw new Error('Chart has not rendered yet.');await chartToPng(svg,'nuclear-decay-curve.png',`${t(PLOT_LABELS[quantity])} (${unit}) · ${t('Time')} (${timeUnit}) · ${t(scale==='log'?'Log':'Linear')}`);}catch(e){setExportError(errorMessage(e));}finally{setExporting(false);}}
 const visible=series.filter(s=>!hidden.includes(s.id));
 return <Localized><div className="decay-chart"><div className="chart-toolbar"><div className="chart-title"><ChartNoAxesCombined size={17}/><span>{title}</span></div><div className="chart-actions"><div className="segmented" aria-label="Chart scale"><button className={scale==='linear'?'active':''} aria-pressed={scale==='linear'} onClick={()=>setScale('linear')}>Linear</button><button className={scale==='log'?'active':''} aria-pressed={scale==='log'} onClick={()=>setScale('log')}>Log</button></div><button className="icon-button" aria-label="Zoom in" onClick={()=>zoom(.5)}><ZoomIn size={16}/></button><button className="icon-button" aria-label="Zoom out" onClick={()=>zoom(2)}><ZoomOut size={16}/></button><button className="icon-button" aria-label="Reset zoom" onClick={()=>setRange(null)}><RotateCcw size={15}/></button><button className="icon-button" onClick={exportPng} disabled={exporting||!!computed.error} aria-label="Download chart as PNG"><Download size={16}/></button></div></div>
 <div className="chart-axis-caption">{t(PLOT_LABELS[quantity])} ({unit}){scale==='log'&&` · ${t('logarithmic scale')}`}</div><ErrorBox message={computed.error}/><ErrorBox message={exportError}/>
 <div className="chart-canvas" ref={container} data-testid="decay-chart" dir="ltr">{!computed.error&&visible.length>0&&<ResponsiveContainer width="100%" height={340} minWidth={0}><ComposedChart data={computed.rows} margin={{top:25,right:25,left:12,bottom:16}} accessibilityLayer>
 <CartesianGrid stroke="var(--grid)" strokeDasharray="3 5" vertical={false}/><XAxis dataKey="time" type="number" domain={[computed.start,computed.end]} allowDataOverflow tickFormatter={compact} stroke="var(--muted)" tick={{fontSize:11}} tickLine={false} axisLine={false} minTickGap={35}/>
 <YAxis tickFormatter={v=>scale==='log'?`10^${compact(Number(v))}`:compact(Number(v))} domain={computed.yDomain} allowDataOverflow stroke="var(--muted)" tick={{fontSize:11}} tickLine={false} axisLine={false} width={76}/>
 <Tooltip labelFormatter={v=>`${t('Time')}: ${fmt(Number(v))} ${timeUnit}`} formatter={(v,name)=>[scale==='log'?`10^(${fmt(Number(v),10)}) ${unit}`:`${fmt(Number(v),10)} ${unit}`,name]} contentStyle={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:10,color:'var(--text)',fontSize:12,direction:'ltr'}}/>
 {showHalf&&series.map((s,j)=>{const x=s.halfSeconds/TIME_UNITS[timeUnit].factor;return x>=computed.start&&x<=computed.end&&!hidden.includes(s.id)?<ReferenceLine key={s.id} x={x} stroke={s.color??CHART_COLORS[j]} strokeDasharray="4 5" label={{value:series.length>1?`${s.label} T½`:'1T½',position:'insideTopRight',fontSize:9,fill:s.color??CHART_COLORS[j]}}/>:null;})}
 {showHalf&&series.length===1&&Array.from({length:5},(_,i)=>i+2).map(n=>{const x=n*series[0].halfSeconds/TIME_UNITS[timeUnit].factor;return x<=computed.end&&x>=computed.start?<ReferenceLine key={n} x={x} stroke="var(--border-strong)" strokeDasharray="4 5" label={{value:`${n}T½`,position:'insideTopRight',fontSize:9,fill:'var(--muted)'}}/>:null;})}
 {visible.map(s=><Line key={s.id} type="linear" dataKey={s.id} name={s.label} stroke={s.color??CHART_COLORS[series.indexOf(s)]} strokeWidth={2.6} dot={!!s.points&&s.points.length<60?{r:2}:false} activeDot={{r:5,stroke:'var(--surface)',strokeWidth:2}} isAnimationActive={false} connectNulls={false}/>)}
 {computed.inspected.map(({s,q})=>{const value=scale==='log'?q.log10:q.value;return computed.requested!==null&&computed.requested>=computed.start&&computed.requested<=computed.end&&value!==null&&Number.isFinite(value)?<ReferenceDot key={s.id} x={computed.requested} y={value} r={5} fill={s.color??CHART_COLORS[series.indexOf(s)]} stroke="var(--surface)"/>:null;})}
 {showInitial&&quantity==='activity'&&visible.map(s=>{const q=plotQuantity({...activityDecay(s.initialBq,s.halfSeconds,0),time:0},quantity,activityUnit,massUnit);const y=scale==='log'?q.log10:q.value;return y!==null&&Number.isFinite(y)?<ReferenceLine key={'a0'+s.id} y={y} stroke={s.color??CHART_COLORS[series.indexOf(s)]} strokeDasharray="2 5" label={{value:`${s.label} A₀`,fontSize:9}}/>:null;})}
 {series.length>1&&<Legend wrapperStyle={{fontSize:11,paddingTop:10}}/>}

 </ComposedChart></ResponsiveContainer>}</div>
 <div className="chart-range-controls"><label>Range start <NumericInput type="text" inputMode="decimal" value={range?.start??String(initialStart)} onChange={e=>setRange({start:e.target.value,end:range?.end??String(initialEnd)})} aria-label="Range start"/><span>{timeUnit}</span></label><label>Visible range <NumericInput type="text" inputMode="decimal" value={range?.end??String(initialEnd)} onChange={e=>setRange({start:range?.start??String(initialStart),end:e.target.value})} aria-label="Chart range"/><span>{timeUnit}</span></label><label>Inspect time <NumericInput type="text" inputMode="decimal" value={inspection??(markerSeconds===undefined?'':String(markerSeconds/TIME_UNITS[timeUnit].factor))} onChange={e=>setInspection(e.target.value===''?null:e.target.value)} aria-label="Inspect time"/><span>{timeUnit}</span></label></div>
 <div className="chart-toggles"><label><input type="checkbox" checked={showHalf} onChange={e=>setShowHalf(e.target.checked)}/>Show half-life markers</label><label><input type="checkbox" checked={showInitial} onChange={e=>setShowInitial(e.target.checked)}/>Show initial activity</label></div>
 {series.length>1&&<fieldset className="curve-toggle-list"><legend>Visible curves</legend>{series.map((s,i)=><label key={s.id}><input type="checkbox" checked={!hidden.includes(s.id)} onChange={e=>setHidden(e.target.checked?hidden.filter(id=>id!==s.id):[...hidden,s.id])}/><i className="legend-dot" style={{background:s.color??CHART_COLORS[i]}}/>{s.label}</label>)}</fieldset>}
 {computed.requested!==null&&<div className="chart-inspection" aria-live="polite"><strong>{t('Time')}: <span className="numeric">{fmt(computed.requested,10)} {timeUnit}</span></strong>{computed.inspected.map(({s,q,r})=><div key={s.id}><span>{s.label}</span><span className="numeric">{q.value===null?'Unavailable':quantity==='activity'||quantity==='decayed'?modelActivityText(r,activityUnit,getIsotope(s.label),quantity==='decayed'):modelText(q.value,r,getIsotope(s.label),quantity==='remaining'?'remaining':quantity)} {unit}</span><small className="numeric">{modelPercentText(r,getIsotope(s.label))}</small></div>)}</div>}
 <p className="chart-note">Curve coordinates and hover values retain numerical central-value precision; they do not add experimental accuracy. Inspection uses the same display policy as the result table.</p>
 {scale==='log'&&<p className="chart-note">The vertical coordinate is log₁₀ of the selected quantity. Nonpositive values are omitted; logarithmic values can remain visible below ordinary floating-point range.</p>}
 {!visible.length&&<p className="notice">Select at least one visible curve.</p>}
 </div></Localized>;
}
