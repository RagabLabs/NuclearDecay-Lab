import { Localized } from '../i18n';
import { useEffect,useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { ISOTOPES } from '../data/isotopes';
import { activityDecay } from '../science/decay';
import { TIME_UNITS, ACTIVITY_UNITS, parseNumber, convertActivity, convertTime, type TimeUnit, type ActivityUnit } from '../science/units';
import { DecayChart, CHART_COLORS } from '../components/DecayChart';
import { IsotopeReference } from '../components/IsotopeInputs';
import { Panel, PageHeading, ErrorBox, Field, Notice } from '../components/ui';
import { fmt, modelText,modelPercentText,modelActivityText,referenceHalfText,errorMessage,activityText } from '../utils/format';
import { makeCsv, downloadCsv,activityCsvValue,decayActivityCsvValue } from '../utils/export';
import { CalculationTools } from '../components/CalculationTools';
import { AnalysisActions } from '../components/AnalysisActions';
import { basicRecord,referencesFor } from '../science/records';
import { changedUnit } from '../utils/session';
import { generateTimes } from '../science/inverse';
export function IsotopeComparison() {
    const [unitError,setUnitError]=useState<string|null>(null);
    const [selected, setSelected] = useState(['I-131', 'Tc-99m', 'F-18']);
    const [equal, setEqual] = useState(true);
    const [common, setCommon] = useState('100');
    const [initials, setInitials] = useState<Record<string, string>>(Object.fromEntries(ISOTOPES.map(i => [i.id, '100'])));
    const [unit, setUnit] = useState<ActivityUnit>('MBq');
    const [time, setTime] = useState('24');
    const [timeUnit, setTimeUnit] = useState<TimeUnit>('h');
    useEffect(()=>setUnitError(null),[selected,equal,common,initials,unit,time,timeUnit]);
    const result = useMemo(() => {
        try {
            if (selected.length < 2)
                throw new Error('Select at least two isotopes to compare.');
            const t = convertTime(parseNumber(time, 'Comparison time'), timeUnit);
            const rows = ISOTOPES.filter(i => selected.includes(i.id)).map((isotope, index) => {
                const A = convertActivity(parseNumber(equal ? common : initials[isotope.id], `${isotope.id} initial activity`), unit);
                const decay = activityDecay(A, isotope.halfLifeSeconds, t);
                return { isotope, decay, color: CHART_COLORS[index] };
            });
            const doubled=Number(time)*2;
            return { rows, end: Math.max(Number.isFinite(doubled)?doubled:Number(time),1), error: null };
        }
        catch (e) {
            return { rows: [], end: 1, error: errorMessage(e) };
        }
    }, [selected, equal, common, initials, unit, time, timeUnit]);
    function exportComparison() { downloadCsv(makeCsv(['isotope', 'reference_half_life', 'reference_half_life_unit', 'half_life_seconds', `time_${timeUnit}`, `initial_${unit}`, `remaining_${unit}`, 'remaining_fraction', 'half_life_source', 'mass_source', 'underflow', 'remaining_activity_Bq'], result.rows.map(({ isotope: i, decay: r }) => [i.id, i.halfLifeValue, i.referenceUnit, i.halfLifeSeconds, Number(time), activityCsvValue(r.initialActivityBq, unit), decayActivityCsvValue(r,unit), r.remainingFraction, i.halfLifeSource, i.massSource, String(r.underflow), r.remainingActivityBq])), 'nuclear-isotope-comparison.csv'); }
    const saved={selected,equal,common,initials,unit,time,timeUnit};
    const record=result.rows.length?{...basicRecord('Radioisotope comparison',
      [{label:'Elapsed time',value:time,unit:timeUnit,si:fmt(result.rows[0].decay.elapsedSeconds,12)+' s'},...result.rows.flatMap(({isotope:i,decay:r})=>[{label:i.id+' A₀',value:equal?common:initials[i.id],unit,si:fmt(r.initialActivityBq,12)+' Bq'},{label:i.id+' T½',value:fmt(i.halfLifeValue,12),unit:i.referenceUnit,si:fmt(i.halfLifeSeconds,12)+' s'}])],
      result.rows.map(({isotope:i,decay:r})=>({label:i.id,value:r.underflow?'Below numerical range':modelText(r.remainingActivityBq,r,i,'activity'),numerical:String(r.remainingActivityBq),unit:'Bq'})),
      [{label:'Apply the law',expression:'Aᵢ(t) = Aᵢ₀ exp[−ln(2) t/T½ᵢ]'},...result.rows.map(({isotope:i,decay:r})=>({label:i.id,expression:`${fmt(r.initialActivityBq,12)} × exp[−ln(2) × ${fmt(r.elapsedSeconds,12)} / ${fmt(i.halfLifeSeconds,12)}] = ${r.underflow?'below numerical range':fmt(r.remainingActivityBq,12)} Bq`}))],result.rows.flatMap(({isotope})=>referencesFor(isotope.id))),table:{headers:['Isotope','Half-life (s)','Initial (Bq)','Remaining (Bq)','Remaining (%)'],rows:result.rows.map(({isotope:i,decay:r})=>[i.id,i.halfLifeSeconds,r.initialActivityBq,r.underflow?'below_numerical_range':r.remainingActivityBq,r.remainingPercent]),displayRows:result.rows.map(({isotope:i,decay:r})=>[i.id,referenceHalfText(i,'s'),fmt(r.initialActivityBq),r.underflow?'Below numerical range':modelText(r.remainingActivityBq,r,i,'activity'),modelPercentText(r,i)])}}:null;
    function exportCurves(){try{const times=generateTimes(0,result.end,181);const rows=times.map(t=>[t,...result.rows.map(({isotope:i,decay:r})=>decayActivityCsvValue(activityDecay(r.initialActivityBq,i.halfLifeSeconds,t*TIME_UNITS[timeUnit].factor),unit))]);downloadCsv(makeCsv(['time_'+timeUnit,...result.rows.map(({isotope:i})=>i.id+'_'+unit)],rows),'nuclear-comparison-curves.csv');setUnitError(null);}catch(e){setUnitError(errorMessage(e));}}
    return <Localized>{<><PageHeading title="Radioisotope comparison" description="Compare independent decay curves on the same physical timeline."/>
    <AnalysisActions page="comparison" value={saved} onLoad={v=>{setSelected(v.selected);setEqual(v.equal);setCommon(v.common);setInitials(v.initials);setUnit(v.unit);setTime(v.time);setTimeUnit(v.timeUnit);}} onClear={()=>{setCommon('');setInitials(Object.fromEntries(ISOTOPES.map(i=>[i.id,''])));setTime('');}} validate={(x:unknown):x is typeof saved=>{if(!x||typeof x!=='object')return false;const v=x as typeof saved;return Array.isArray(v.selected)&&v.selected.length<=8&&new Set(v.selected).size===v.selected.length&&v.selected.every(id=>ISOTOPES.some(i=>i.id===id))&&typeof v.equal==='boolean'&&typeof v.common==='string'&&typeof v.time==='string'&&Object.hasOwn(ACTIVITY_UNITS,v.unit)&&Object.hasOwn(TIME_UNITS,v.timeUnit)&&!!v.initials&&ISOTOPES.every(i=>typeof v.initials[i.id]==='string');}}/>
    <div className="comparison-layout"><Panel title="Select isotopes" subtitle="Choose two or more reference nuclides."><div className="isotope-choices">{ISOTOPES.map(i => <label key={i.id} className={`isotope-choice ${selected.includes(i.id) ? 'selected' : ''}`}><input type="checkbox" checked={selected.includes(i.id)} onChange={e => setSelected(e.target.checked ? [...selected, i.id] : selected.filter(id => id !== i.id))}/><span className="choice-symbol">{i.symbol}</span><span><strong>{i.name}</strong><small>{fmt(i.halfLifeValue)} {i.referenceUnit === 'a' ? 'reference yr' : i.referenceUnit}</small></span></label>)}</div>
      <label className="check-row"><input type="checkbox" checked={equal} onChange={e => setEqual(e.target.checked)}/><span>Use the same initial activity</span></label>
      <div className="field"><label htmlFor="comparison-unit">Activity unit for all inputs</label><select id="comparison-unit" value={unit} onChange={e => {try{const next=e.target.value as ActivityUnit;setCommon(changedUnit(common,unit,next,'activity'));setInitials(Object.fromEntries(Object.entries(initials).map(([id,v])=>[id,changedUnit(v,unit,next,'activity')])));setUnit(next);setUnitError(null);}catch(e){setUnitError(errorMessage(e));}}}>{Object.keys(ACTIVITY_UNITS).map(u => <option key={u}>{u}</option>)}</select></div>
      {equal ? <Field label="Common initial activity" value={common} onChange={setCommon} unit={unit}/> : selected.map(id => <Field key={id} label={`${id} initial activity`} value={initials[id]} onChange={v => setInitials({ ...initials, [id]: v })} unit={unit}/>)}
      <Field label="Compare after" value={time} onChange={setTime} unit={timeUnit} units={Object.keys(TIME_UNITS)} onUnit={v => {try{setTime(changedUnit(time,timeUnit,v,'time'));setTimeUnit(v as TimeUnit);setUnitError(null);}catch(e){setUnitError(errorMessage(e));}}}/><ErrorBox message={unitError??result.error}/>
    </Panel><div className="comparison-main">{result.rows.length > 0 && <Panel className="chart-panel"><DecayChart series={result.rows.map(({ isotope: i, decay: r, color }) => ({ id: i.id, label: i.id, initialBq: r.initialActivityBq, halfSeconds: i.halfLifeSeconds, color }))} timeUnit={timeUnit} activityUnit={unit} initialEnd={result.end}/></Panel>}
      <Notice>{equal ? 'Equal initial activities isolate the effect of half-life.' : 'Different initial activities are compared as entered.'} Every curve represents an independent parent nuclide. These curves do not form a decay chain.</Notice>
      {!!result.rows.length && <Panel title={`After ${fmt(Number(time))} ${timeUnit}`} actions={<button className="button secondary small" onClick={exportComparison}><Download size={14}/> CSV</button>}><div className="table-scroll"><table><thead><tr><th>Isotope</th><th>Half-life ({timeUnit})</th><th>Initial ({unit})</th><th>Remaining ({unit})</th><th>Remaining %</th></tr></thead><tbody>{result.rows.map(({ isotope: i, decay: r, color }) => <tr key={i.id}><td><span className="legend-dot" style={{ background: color }}/>{i.id}</td><td className="numeric">{referenceHalfText(i,timeUnit)}</td><td className="numeric">{activityText(r.initialActivityBq, unit)}</td><td className="numeric">{modelActivityText(r,unit,i)}</td><td className="numeric">{modelPercentText(r,i)}</td></tr>)}</tbody></table></div></Panel>}
    <button className="button secondary small" onClick={exportCurves} disabled={!result.rows.length}><Download size={14}/>Export curves CSV</button><CalculationTools record={record}/></div></div><Panel title="Sources for the selected isotopes" subtitle="Published values, their uncertainties and the scope of each parent-only model.">{selected.map(id => <IsotopeReference key={id} id={id}/>)}</Panel>
  </>}</Localized>;
}
