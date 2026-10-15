import { Localized } from '../i18n';
import { useEffect,useMemo, useState } from 'react';
import { activityDecay, timeToTarget, timeToPercentage } from '../science/decay';
import { ACTIVITY_UNITS, TIME_UNITS, convertActivity, convertTime, parseNumber, type ActivityUnit } from '../science/units';
import { DEFAULT_INPUTS, IsotopeInputs, resolveInputs } from '../components/IsotopeInputs';
import { ErrorBox, Field, Metric, PageHeading, Panel, Equation, Notice } from '../components/ui';
import { DecayChart } from '../components/DecayChart';
import { errorMessage, fmt, modelText,modelPercentText,modelActivityText,estimateText } from '../utils/format';
import { CalculationTools } from '../components/CalculationTools';
import { AnalysisActions } from '../components/AnalysisActions';
import { validateDecayInputs,changedUnit } from '../utils/session';
import { basicRecord,decayRecord,referencesFor } from '../science/records';
import { getIsotope } from '../data/isotopes';
export function ActivityCalculator() {
    const [unitError,setUnitError]=useState<string|null>(null);
    const [input, setInput] = useState({ ...DEFAULT_INPUTS });
    const [mode, setMode] = useState<'activity' | 'percent'>('percent');
    const [target, setTarget] = useState('25');
    const [targetUnit, setTargetUnit] = useState<ActivityUnit>('MBq');
    useEffect(()=>setUnitError(null),[input,target,targetUnit,mode]);
    const decay = useMemo(() => { try {
        const x = resolveInputs({...input,molar:''});
        return { value: activityDecay(x.initialBq, x.halfSeconds, x.elapsedSeconds), error: null };
    }
    catch (e) {
        return { value: null, error: errorMessage(e) };
    } }, [input]);
    const goal = useMemo(() => { try {
        const x = resolveInputs({...input,elapsed:'0',molar:''});
        if (x.initialBq === 0)
            throw new Error('A zero-activity sample has no unique target-time solution. Enter a positive initial activity.');
        return { sample:x, value: mode === 'percent' ? timeToPercentage(parseNumber(target, 'Target percentage'), x.halfSeconds) : timeToTarget(x.initialBq, convertActivity(parseNumber(target, 'Target activity'), targetUnit), x.halfSeconds), error: null };
    }
    catch (e) {
        return { value: null, error: errorMessage(e) };
    } }, [input, mode, target, targetUnit]);
    const r = decay.value;
    const goalRecord=useMemo(()=>{if(!goal.value||!('sample' in goal))return null;const r=activityDecay(goal.sample.initialBq,goal.sample.halfSeconds,0);const seconds=goal.value.kind==='finite'?goal.value.seconds:null;return basicRecord('Time to target activity',
      [{label:'Initial activity',value:input.activity,unit:input.activityUnit,si:fmt(r.initialActivityBq,12)+' Bq'},{label:'Half-life',value:getIsotope(input.isotopeId)?fmt(getIsotope(input.isotopeId)!.halfLifeValue,12):input.half,unit:getIsotope(input.isotopeId)?.referenceUnit??input.halfUnit,si:fmt(r.halfLifeSeconds,12)+' s'},{label:mode==='percent'?'Target remaining percentage':'Target activity',value:target,unit:mode==='percent'?'%':targetUnit,si:mode==='percent'?String(Number(target)/100)+' fraction':fmt(convertActivity(Number(target),targetUnit),12)+' Bq'}],
      [{label:'Elapsed time',value:seconds===null?'No finite result':estimateText(seconds,getIsotope(input.isotopeId)?seconds*getIsotope(input.isotopeId)!.halfLifeUncertainty/getIsotope(input.isotopeId)!.halfLifeValue:null),unit:'s',numerical:seconds===null?'No finite result':String(seconds),referenceContribution:seconds===null||!getIsotope(input.isotopeId)?undefined:String(seconds*getIsotope(input.isotopeId)!.halfLifeUncertainty/getIsotope(input.isotopeId)!.halfLifeValue)}],
      [{label:'Convert to SI',expression:mode==='percent'?`A_target/A₀ = ${target}/100`:`A_target = ${target} ${targetUnit} = ${fmt(convertActivity(Number(target),targetUnit),12)} Bq`},
       {label:'Apply the law',expression:'t = ln(A₀/A_target) × T½ / ln(2)'},
       {label:'Numerical substitution',expression:mode==='percent'?`t = ln(100/${target}) × ${fmt(r.halfLifeSeconds,12)} / ln(2)`:`t = ln(${fmt(r.initialActivityBq,12)}/${fmt(convertActivity(Number(target),targetUnit),12)}) × ${fmt(r.halfLifeSeconds,12)} / ln(2)`},
       {label:'Result',expression:seconds===null?goal.value.kind==='infinite'?goal.value.explanation:'Unavailable':fmt(seconds,12)+' s'}],referencesFor(input.isotopeId));},[goal,r,input,mode,target,targetUnit]);
    return <Localized>{<><PageHeading title="Activity & target time" description="Calculate the remaining activity, or find when your sample reaches a target."/>
    <AnalysisActions page="activity" value={{input,mode,target,targetUnit}} onLoad={v=>{setInput(v.input);setMode(v.mode);setTarget(v.target);setTargetUnit(v.targetUnit);}} validate={(x:unknown):x is {input:typeof input;mode:typeof mode;target:string;targetUnit:ActivityUnit}=>{if(!x||typeof x!=='object')return false;const s=x as {input:typeof input;mode:typeof mode;target:string;targetUnit:ActivityUnit};return validateDecayInputs(s.input)&&['activity','percent'].includes(s.mode)&&typeof s.target==='string'&&Object.hasOwn(ACTIVITY_UNITS,s.targetUnit);}} onClear={()=>{setInput({...DEFAULT_INPUTS,isotopeId:'custom',half:'',activity:'',elapsed:'',molar:''});setTarget('');}}/>
    <div className="two-column"><Panel title="Activity calculator" subtitle="Results update as you change your sample."><IsotopeInputs value={input} onChange={setInput}/><ErrorBox message={decay.error}/><Equation>A(t) = A₀ e<sup>−λt</sup></Equation>
      {r && <><div className="metric-grid"><Metric label="Remaining activity" value={modelActivityText(r,input.activityUnit,getIsotope(input.isotopeId))} unit={input.activityUnit} accent/><Metric label="Activity lost" value={modelActivityText(r,input.activityUnit,getIsotope(input.isotopeId),true)} unit={input.activityUnit}/><Metric label="Remaining" value={modelPercentText(r,getIsotope(input.isotopeId))}/><Metric label="Decayed" value={modelPercentText(r,getIsotope(input.isotopeId),true)}/><Metric label="Elapsed half-lives" value={modelText(r.halfLivesElapsed,r,getIsotope(input.isotopeId),'halfLives')}/></div>{r.warnings.map(w => <Notice key={w}>{w}</Notice>)}</>}
    <CalculationTools record={r?{...decayRecord({...input,molar:''}),title:'Activity decay'}:null}/></Panel><Panel title="Time to target activity" subtitle="Use the same sample defined on the left."><div className="segmented wide"><button className={mode === 'percent' ? 'active' : ''} onClick={() => { setMode('percent'); setTarget('25'); }} aria-pressed={mode === 'percent'}>Target percentage</button><button className={mode === 'activity' ? 'active' : ''} onClick={() => { setMode('activity'); setTarget('25'); }} aria-pressed={mode === 'activity'}>Target activity</button></div>
      <Field label={mode === 'percent' ? 'Target remaining percentage' : 'Target activity'} value={target} onChange={setTarget} unit={mode === 'percent' ? '%' : targetUnit} units={mode === 'activity' ? Object.keys(ACTIVITY_UNITS) : undefined} onUnit={mode === 'activity' ? v => {try{setTarget(changedUnit(target,targetUnit,v,'activity'));setTargetUnit(v as ActivityUnit);setUnitError(null);}catch(e){setUnitError(errorMessage(e));}} : undefined} hint={mode === 'percent' ? '0–100% of the initial activity.' : 'The target must not exceed the initial activity.'}/>
      <ErrorBox message={unitError??goal.error}/><Equation>t = ln(A₀ / A<sub>target</sub>) / λ</Equation>
      {goal.value?.kind === 'infinite' && <Notice>{goal.value.explanation}</Notice>}
      {goal.value?.kind === 'finite' && <div className="metric-grid">{(['min', 'h', 'd', 'y'] as const).map(u => {let value='Outside unit range';try{const v=convertTime(goal.value!.kind === 'finite'?goal.value!.seconds:0,'s',u),i=getIsotope(input.isotopeId);value=estimateText(v,i?v*i.halfLifeUncertainty/i.halfLifeValue:null);}catch{/* Keep the SI result available. */}return <Metric key={u} label={`Time in ${TIME_UNITS[u].label}`} value={value} unit={u} accent={u === 'd'}/>;})}</div>}
      <p className="muted">At 100%, no time has elapsed. At 0%, an exponential decay has no finite solution. A zero-activity sample has no unique activity-target solution.</p>
    <CalculationTools record={goalRecord}/></Panel></div>
    {r && <Panel className="chart-panel"><DecayChart series={[{ id: 'activity', label: input.isotopeId === 'custom' ? 'Custom sample' : input.isotopeId, initialBq: r.initialActivityBq, halfSeconds: r.halfLifeSeconds }]} timeUnit={input.timeUnit} activityUnit={input.activityUnit} initialEnd={Math.max(Number(input.elapsed), r.halfLifeSeconds / TIME_UNITS[input.timeUnit].factor * 5)} markerSeconds={r.elapsedSeconds}/></Panel>}
  </>}</Localized>;
}
