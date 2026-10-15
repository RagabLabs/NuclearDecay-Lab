import { Localized, useI18n } from '../i18n';
import { useMemo, useRef, useState } from 'react';
import { ArrowRight, Download, RotateCcw, CheckCircle2, FlaskConical } from 'lucide-react';
import { completeAnalysis, analyzeTimes } from '../science/decay';
import { TIME_UNITS, type MassUnit, MASS_UNITS } from '../science/units';
import { DEFAULT_INPUTS, IsotopeInputs, resolveInputs, type DecayInputs } from '../components/IsotopeInputs';
import { DecayChart } from '../components/DecayChart';
import { TimeTable } from '../components/TimeTable';
import { ErrorBox, Metric, Notice, PageHeading, Panel, Equation } from '../components/ui';
import { errorMessage, fmt, modelText,modelActivityText,modelMassText,modelPercentText,referenceHalfText,timeText } from '../utils/format';
import { downloadBlob, serializeChart } from '../utils/export';
import { CalculationTools, calculationReport } from '../components/CalculationTools';
import { AnalysisActions } from '../components/AnalysisActions';
import { decayRecord } from '../science/records';
import { validateDecayInputs } from '../utils/session';
import { getIsotope } from '../data/isotopes';
export function CompleteAnalysis() {
    const {language}=useI18n();
    const [input, setInput] = useState<DecayInputs>(()=>{const id=new URLSearchParams(window.location.hash.split('?')[1]??'').get('isotope');const i=id?getIsotope(id):undefined;return i?{...DEFAULT_INPUTS,isotopeId:i.id,timeUnit:i.preferredTimeUnit,elapsed:String(i.halfLifeSeconds/TIME_UNITS[i.preferredTimeUnit].factor)}:{...DEFAULT_INPUTS};});
    const [massUnit, setMassUnit] = useState<MassUnit>('µg');
    const [confirmed, setConfirmed] = useState(false);
    const [downloadError, setDownloadError] = useState<string | null>(null);
    const resultsRef = useRef<HTMLDivElement>(null);
    const computed = useMemo(() => {
        try {
            const resolved = resolveInputs(input);
            const result = completeAnalysis(resolved.initialBq, resolved.halfSeconds, resolved.elapsedSeconds, resolved.molarMass);
            const factor = TIME_UNITS[input.timeUnit].factor;
            const half = resolved.halfSeconds / factor;
            const elapsed = resolved.elapsedSeconds / factor;
            const times = [...new Set([0, half / 2, half, half * 2, half * 3, half * 4, half * 5, elapsed].filter(t => Number.isFinite(t) && Number.isFinite(t * factor)))].sort((a, b) => a - b);
            const rows = analyzeTimes(resolved.initialBq, resolved.halfSeconds, times, factor);
            const end = times[times.length - 1] || half;
            const remaining = modelActivityText(result,input.activityUnit,resolved.isotope);
            const decayed = modelActivityText(result,input.activityUnit,resolved.isotope,true);
            return { result, rows, end, resolved, remaining, decayed, error: null };
        }
        catch (e) {
            return { error: errorMessage(e), result: null, rows: [], end: 0, resolved: null, remaining: '0', decayed: '0' };
        }
    }, [input]);
    const result = computed.result;
    const record=result?{...decayRecord(input,result),table:{headers:['Time ('+input.timeUnit+')','Activity (Bq)','Remaining (%)'],rows:computed.rows.map(p=>[p.time,p.underflow?'below_numerical_range':p.remainingActivityBq,p.remainingPercent]),displayRows:computed.rows.map(p=>[fmt(p.time),p.underflow?'Below numerical range':modelText(p.remainingActivityBq,p,computed.resolved!.isotope,'activity'),modelPercentText(p,computed.resolved!.isotope)])}}:null;
    async function exportReport() {
        try {
            setDownloadError(null);
            if (!result || !computed.resolved)
                return;
            const svg = resultsRef.current?.querySelector<SVGSVGElement>('.recharts-surface');
            const report = calculationReport(record!,language,svg?serializeChart(svg):'');
            downloadBlob(new Blob([report], { type: 'text/html;charset=utf-8' }), 'nuclear-decay-scientific-report.html');
        }
        catch (e) {
            setDownloadError(errorMessage(e));
        }
    }
    function change(v: DecayInputs) { setInput(v); setConfirmed(false); }
    return <Localized>{<>
    <PageHeading eyebrow="A COMPLETE PICTURE, FROM ONE INPUT" title="Complete Decay Analysis" description="From activity to atoms. Analyze your sample with one connected calculation." action={<button className="button secondary" disabled={!result} onClick={exportReport}><Download size={16}/> Scientific report</button>}/>
    <AnalysisActions page="analysis" value={input} onLoad={change} validate={validateDecayInputs} onClear={()=>change({...DEFAULT_INPUTS,isotopeId:'custom',customName:'',half:'',activity:'',elapsed:'',molar:''})}/>
    <div className="example-switch"><label htmlFor="analysis-example">Examples</label><select id="analysis-example" defaultValue="" onChange={e=>{if(e.target.value==='two')change({...DEFAULT_INPUTS,elapsed:'16.0466'});else if(e.target.value==='tracer'){const i=getIsotope('F-18')!;change({...DEFAULT_INPUTS,isotopeId:i.id,timeUnit:'h',elapsed:String(i.halfLifeValue*2)});}else change({...DEFAULT_INPUTS});}}><option value="" disabled>Load example</option><option value="reference">Reference example</option><option value="two">Two half-lives</option><option value="tracer">Medical tracer example</option></select></div>
    <div className="analysis-layout"><Panel title="Define your sample" subtitle="Choose a reference isotope or enter a custom half-life." className="sample-panel">
      <form onSubmit={e => { e.preventDefault(); if (result) {
        setConfirmed(true);
        resultsRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
    } }}>
        <IsotopeInputs value={input} onChange={change} showMass/>
        <ErrorBox message={computed.error}/>
        <button className="button primary full" type="submit"><FlaskConical size={17}/> Analyze Now <ArrowRight size={17}/></button>
        <button className="text-button reset" type="button" onClick={() => { setInput({ ...DEFAULT_INPUTS }); setConfirmed(false); }}><RotateCcw size={13}/> Reset sample</button>
      </form><div className="form-footnote"><span className="status-dot"/> Calculated locally. Your inputs stay here.</div>
    </Panel><div className="analysis-results" ref={resultsRef} tabIndex={-1} id="analysis-results">
      {result ? <><div className="result-caption"><div><span className="status-dot"/>{confirmed ? 'Analysis complete' : 'Live analysis'}<span className="divider-dot">·</span>{computed.resolved!.isotope?.name ?? 'Custom sample'}</div><span className="badge soft">Single nuclide</span></div>
        <div className="primary-metrics"><Metric label="Remaining activity" value={computed.remaining} unit={input.activityUnit} detail={`after ${fmt(Number(input.elapsed))} ${input.timeUnit}`} accent/><Metric label="Remaining fraction" value={modelPercentText(result,computed.resolved!.isotope)} detail={`${modelText(result.halfLivesElapsed,result,computed.resolved!.isotope,'halfLives')} half-lives elapsed`}/></div>
        <Panel className="chart-panel"><DecayChart series={[{ id: 'activity', label: computed.resolved!.isotope?.id ?? 'Custom sample', initialBq: result.initialActivityBq, halfSeconds: result.halfLifeSeconds }]} timeUnit={input.timeUnit} activityUnit={input.activityUnit} initialEnd={computed.end} markerSeconds={result.elapsedSeconds}/></Panel>
        <div className="secondary-metrics"><Metric label="Decay constant · λ" value={modelText(result.lambdaPerSecond,result,computed.resolved!.isotope,'rate')} unit="s⁻¹"/><Metric label="Half-life · T½" value={computed.resolved!.isotope?referenceHalfText(computed.resolved!.isotope,input.timeUnit):timeText(result.halfLifeSeconds,input.timeUnit)} unit={input.timeUnit}/><Metric label="Activity lost by decay" value={computed.decayed} unit={input.activityUnit}/><Metric label="Decayed fraction" value={modelPercentText(result,computed.resolved!.isotope,true)}/><Metric label="Remaining nuclei · N(t)" value={modelText(result.nuclei,result,computed.resolved!.isotope,'nuclei')} detail="Expected parent-nucleus count"/>
        <div className="mass-metric"><Metric label="Remaining isotope mass" value={result.isotopeMassG === null ? 'Unavailable' : modelMassText(result,massUnit,computed.resolved!.isotope)} unit={result.isotopeMassG === null ? undefined : massUnit} detail={result.molarMassGPerMol === null ? 'Add a molar mass for this result.' : 'Pure selected isotope; carriers excluded.'}/><select value={massUnit} onChange={e => setMassUnit(e.target.value as MassUnit)} aria-label="Result mass unit">{Object.keys(MASS_UNITS).map(u => <option key={u}>{u}</option>)}</select></div></div>
        {confirmed && <div className="sr-only" role="status">Analysis complete. Remaining activity {computed.remaining} {input.activityUnit}.</div>}
        {[...result.warnings, ...result.unavailable].map(w => <Notice key={w}>{w}</Notice>)}
        <div className="interpretation"><CheckCircle2 size={18}/><p>After <strong>{modelText(result.halfLivesElapsed,result,computed.resolved!.isotope,'halfLives')} half-lives</strong>, <strong>{modelPercentText(result,computed.resolved!.isotope)}</strong> of the initial parent activity remains. The nuclei and mass results refer to this same elapsed time.</p></div>
      </> : <Panel className="empty-state"><FlaskConical size={32}/><h2>Check your sample inputs</h2><p>Valid values unlock the complete analysis.</p></Panel>}
    </div></div>
    <ErrorBox message={downloadError}/><CalculationTools record={record}/>
    {result && <TimeTable rows={computed.rows} timeUnit={input.timeUnit} activityUnit={input.activityUnit} isotope={computed.resolved!.isotope}/>}
    <div className="two-column bottom-panels"><Panel title="The model behind the results"><Equation>A(t) = A₀ e<sup>−λt</sup> <span>where λ = ln(2) / T½</span></Equation><p className="muted">A closed sample with a constant decay rate. All calculations use SI internally; display units are converted explicitly.</p></Panel><Panel title="Know what is being calculated"><p className="muted">This is a single-nuclide model. It excludes radioactive daughters, external production, biological clearance, dose and decay-chain equilibrium. No combined uncertainty is inferred; numerical details distinguish central values from reference precision.</p><a className="text-link" href="#/documentation">Read the scientific documentation <ArrowRight size={14}/></a></Panel></div>
  </>}</Localized>;
}
