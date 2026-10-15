import {AVOGADRO,LN2} from '../science/constants';
import { Localized } from '../i18n';
import { useEffect,useMemo, useState } from 'react';
import { activityFromMass, activityFromNuclei, massFromActivity, massFromNuclei, nucleiFromActivity, decayConstant,activityDecay } from '../science/decay';
import { ACTIVITY_UNITS, MASS_UNITS, convertMass,convertActivity,convertTime,parseNumber, type MassUnit, type ActivityUnit } from '../science/units';
import { DEFAULT_INPUTS, IsotopeInputs } from '../components/IsotopeInputs';
import { PageHeading, Panel, Field, Metric, ErrorBox, Notice, SelectField, Equation } from '../components/ui';
import { fmt, errorMessage, estimateText,modelText,activityText,massText } from '../utils/format';
import { CalculationTools } from '../components/CalculationTools';
import { AnalysisActions } from '../components/AnalysisActions';
import { basicRecord,referencesFor,MODEL_NOTES } from '../science/records';
import { validateDecayInputs,changedUnit } from '../utils/session';
import { getIsotope } from '../data/isotopes';
type Mode = 'activity-mass' | 'mass-activity' | 'activity-nuclei' | 'nuclei-activity' | 'nuclei-mass';
export function NucleiMassCalculator() {
    const [unitError,setUnitError]=useState<string|null>(null);
    const [input, setInput] = useState({ ...DEFAULT_INPUTS });
    const [mode, setMode] = useState<Mode>('activity-mass');
    const [mass, setMass] = useState('1');
    const [massUnit, setMassUnit] = useState<MassUnit>('µg');
    const [nuclei, setNuclei] = useState('1e12');
    const [fraction, setFraction] = useState('100');
    const [outUnit, setOutUnit] = useState<MassUnit>('µg');
    const [activityUnit, setActivityUnit] = useState<ActivityUnit>('MBq');
    const needsMass = mode !== 'activity-nuclei' && mode !== 'nuclei-activity';
    useEffect(()=>setUnitError(null),[input,mode,mass,nuclei,fraction,massUnit]);
    const computed = useMemo(() => {
        try {
            const isotope=getIsotope(input.isotopeId);
            const M=needsMass?(isotope?.molarMass??(input.molar.trim()?parseNumber(input.molar,'Molar mass'):undefined)):undefined;
            if(needsMass&&M===undefined)throw new Error('Supply an isotope molar mass (g/mol) to calculate mass.');
            const f=needsMass?parseNumber(fraction,'Isotope mass percentage')/100:1;
            let A:number|null=null,N:number|null=null,m:number|null=null,lambda:number|null=null;
            const warnings:string[]=[];
            if(mode==='nuclei-mass'){
                N=parseNumber(nuclei,'Number of nuclei');
                m=massFromNuclei(N,M!,f);
            }else{
                const halfSeconds=isotope?.halfLifeSeconds??convertTime(parseNumber(input.half,'Half-life'),input.halfUnit);
                lambda=decayConstant(halfSeconds);
                if(mode==='mass-activity'){
                    m=convertMass(parseNumber(mass,'Sample mass'),massUnit);
                    A=activityFromMass(m,halfSeconds,M!,f);
                    try{N=nucleiFromActivity(A,lambda);}catch(e){warnings.push(errorMessage(e));}
                }else if(mode==='nuclei-activity'){
                    N=parseNumber(nuclei,'Number of nuclei');A=activityFromNuclei(N,lambda);
                }else{
                    A=convertActivity(parseNumber(input.activity,'Initial activity'),input.activityUnit);
                    if(mode==='activity-mass')m=massFromActivity(A,halfSeconds,M!,f);
                    try{N=nucleiFromActivity(A,lambda);}catch(e){if(mode==='activity-nuclei')throw e;warnings.push(errorMessage(e));}
                }
            }
            return { A, N, m, lambda, M, warnings, error: null };
        }
        catch (e) {
            return { A: 0, N: 0, m: null, lambda: 0, M: undefined, warnings: [], error: errorMessage(e) };
        }
    }, [input, mode, needsMass, mass, massUnit, nuclei, fraction]);
    const reference=getIsotope(input.isotopeId);
    const context=!computed.error&&computed.lambda!==null&&computed.A!==null?activityDecay(computed.A,LN2/computed.lambda,0):null;
    function scientificValue(v:number|null,kind:'rate'|'nuclei'|'mass'){return context?modelText(v,context,reference,kind):fmt(v);}
    function sampleActivityText(){if(computed.A===null)return 'Unavailable';try{return mode==='activity-mass'||mode==='activity-nuclei'?activityText(computed.A,activityUnit):estimateText(convertActivity(computed.A,'Bq',activityUnit),reference?convertActivity(computed.A*reference.halfLifeUncertainty/reference.halfLifeValue,'Bq',activityUnit):null);}catch{return 'Outside unit range';}}
    function sampleMassText(){if(computed.m===null)return 'Unavailable';try{return mode==='activity-mass'&&context?estimateText(convertMass(computed.m,'g',outUnit),reference?convertMass(computed.m*reference.halfLifeUncertainty/reference.halfLifeValue,'g',outUnit):null):massText(computed.m,outUnit);}catch{return 'Outside unit range';}}
    const saved={input,mode,mass,massUnit,nuclei,fraction,outUnit,activityUnit};
    const record=computed.error?null:basicRecord('Nuclei & isotope mass',[
      ...(mode==='mass-activity'?[{label:'Sample mass',value:mass,unit:massUnit,si:fmt(convertMass(Number(mass),massUnit),12)+' g'}]:mode==='nuclei-activity'||mode==='nuclei-mass'?[{label:'Radioactive nuclei',value:nuclei}]:[{label:'Initial activity',value:input.activity,unit:input.activityUnit,si:fmt(computed.A,12)+' Bq'}]),
      ...(computed.lambda!==null?[{label:'Half-life',value:reference?fmt(reference.halfLifeValue,12):input.half,unit:reference?.referenceUnit??input.halfUnit,si:fmt(LN2/computed.lambda,12)+' s'}]:[]),...(needsMass?[{label:'Molar mass',value:fmt(computed.M??0,12),unit:'g mol⁻¹'},{label:'Isotope mass percentage',value:fraction,unit:'%'}]:[])],
      [...(computed.A!==null?[{label:'Activity',value:mode==='activity-mass'||mode==='activity-nuclei'?fmt(computed.A):scientificValue(computed.A,'rate'),unit:'Bq',numerical:String(computed.A)}]:[]),{label:'Radioactive nuclei',value:mode==='activity-mass'||mode==='activity-nuclei'?scientificValue(computed.N,'nuclei'):fmt(computed.N),numerical:computed.N===null?'Unavailable':String(computed.N)},...(computed.m!==null?[{label:Number(fraction)===100?'Isotope mass':'Total sample mass',value:mode==='activity-mass'?scientificValue(computed.m,'mass'):fmt(computed.m),unit:'g',numerical:String(computed.m)}]:[])],
      [{label:'Convert to SI',expression:mode==='mass-activity'?`${mass} ${massUnit} = ${fmt(convertMass(Number(mass),massUnit),12)} g`:mode==='nuclei-activity'||mode==='nuclei-mass'?`N = ${nuclei}`:`${input.activity} ${input.activityUnit} = ${fmt(computed.A,12)} Bq`},{label:'Apply the law',expression:mode==='nuclei-mass'?'m_sample = NM/(Nₐ f); no half-life is needed':'λ = ln(2)/T½; A = λN; m_isotope = NM/Nₐ; m_sample = m_isotope/f'},
       {label:'Numerical substitution',expression:mode==='mass-activity'?`A = (${fmt(convertMass(Number(mass),massUnit),12)} × ${fmt(Number(fraction)/100,12)} / ${fmt(computed.M??0,12)}) × ${AVOGADRO.toExponential(8)} × ${fmt(computed.lambda,12)}`:mode==='nuclei-activity'?`A = ${nuclei} × ${fmt(computed.lambda,12)}`:mode==='nuclei-mass'?`m_sample = ${nuclei} × ${fmt(computed.M??0,12)} / (${AVOGADRO.toExponential(8)} × ${fmt(Number(fraction)/100,12)})`:`N = ${fmt(computed.A,12)} / ${fmt(computed.lambda,12)}${mode==='activity-mass'?`\nm_sample = A M / (λ Nₐ f) = ${fmt(computed.A,12)} × ${fmt(computed.M??0,12)} / (${fmt(computed.lambda,12)} × ${AVOGADRO.toExponential(8)} × ${fmt(Number(fraction)/100,12)})`:''}`},
       {label:'Result',expression:`${computed.A===null?'':`A = ${fmt(computed.A,12)} Bq; `}N = ${fmt(computed.N,12)}${computed.m!==null?`; m = ${fmt(computed.m,12)} g`:''}`} ],referencesFor(input.isotopeId),[...MODEL_NOTES,...computed.warnings]);
    return <Localized>{<><PageHeading title="Nuclei & isotope mass" description="Connect activity, the number of radioactive nuclei and physical sample mass."/><AnalysisActions page="nuclei-mass" value={saved} onLoad={v=>{setInput(v.input);setMode(v.mode);setMass(v.mass);setMassUnit(v.massUnit);setNuclei(v.nuclei);setFraction(v.fraction);setOutUnit(v.outUnit);setActivityUnit(v.activityUnit);}} onClear={()=>{setInput({...DEFAULT_INPUTS,isotopeId:'custom',half:'',activity:'',molar:''});setMass('');setNuclei('');}} validate={(x:unknown):x is typeof saved=>{if(!x||typeof x!=='object')return false;const v=x as typeof saved;return validateDecayInputs(v.input)&&['activity-mass','mass-activity','activity-nuclei','nuclei-activity','nuclei-mass'].includes(v.mode)&&typeof v.mass==='string'&&typeof v.nuclei==='string'&&typeof v.fraction==='string'&&Object.hasOwn(MASS_UNITS,v.massUnit)&&Object.hasOwn(MASS_UNITS,v.outUnit)&&Object.hasOwn(ACTIVITY_UNITS,v.activityUnit);}}/><div className="two-column"><Panel title="Define the calculation">
    <SelectField label="Conversion" value={mode} onChange={v => setMode(v as Mode)}><option value="activity-mass">Activity → Mass</option><option value="mass-activity">Mass → Activity</option><option value="activity-nuclei">Activity → Nuclei</option><option value="nuclei-activity">Nuclei → Activity</option><option value="nuclei-mass">Nuclei → Mass</option></SelectField>
    <IsotopeInputs value={input} onChange={setInput} showTime={false} showHalf={mode!=='nuclei-mass'} showMass={needsMass} showActivity={mode === 'activity-mass' || mode === 'activity-nuclei'}/>
    {mode === 'mass-activity' && <Field label="Sample mass" value={mass} onChange={setMass} unit={massUnit} units={Object.keys(MASS_UNITS)} onUnit={v => {try{setMass(changedUnit(mass,massUnit,v,'mass'));setMassUnit(v as MassUnit);setUnitError(null);}catch(e){setUnitError(errorMessage(e));}}}/>}
    {(mode === 'nuclei-activity' || mode === 'nuclei-mass') && <Field label="Number of radioactive nuclei" value={nuclei} onChange={setNuclei} unit="nuclei" hint="The continuum model accepts an expected count; individual samples have integer counts."/>}
    {needsMass && <Field label="Isotope mass percentage" value={fraction} onChange={setFraction} unit="%" hint="100% means pure isotope. This is a mass fraction, not an atom fraction or natural abundance."/>}
    <ErrorBox message={unitError??computed.error}/><Equation>N = A / λ <span>m = (N / Nₐ) M</span></Equation>
  </Panel><Panel title="Calculated quantities"><div className="output-selects"><label>Activity unit <select value={activityUnit} onChange={e => setActivityUnit(e.target.value as ActivityUnit)}>{Object.keys(ACTIVITY_UNITS).map(u => <option key={u}>{u}</option>)}</select></label><label>Mass unit <select value={outUnit} onChange={e => setOutUnit(e.target.value as MassUnit)}>{Object.keys(MASS_UNITS).map(u => <option key={u}>{u}</option>)}</select></label></div>
    {!computed.error && <><div className="metric-grid"><Metric label="Activity" value={sampleActivityText()} unit={activityUnit} accent/><Metric label="Radioactive nuclei" value={mode==='activity-mass'||mode==='activity-nuclei'?scientificValue(computed.N,'nuclei'):fmt(computed.N)}/><Metric label="Decay constant" value={scientificValue(computed.lambda,'rate')} unit="s⁻¹"/>{computed.m !== null && <Metric label={fraction === '100' ? 'Isotope mass' : 'Total sample mass'} value={sampleMassText()} unit={outUnit}/>}</div>{computed.N !== null && computed.N > 0 && computed.N < 1 && <Notice>Fewer than one nucleus is an expected ensemble value, not a literal fractional nucleus.</Notice>}{computed.warnings.map(w => <Notice key={w}>{w}</Notice>)}</>}
    <Notice>At a specified mass fraction f, m_isotope = f × m_sample. Activity belongs only to the selected isotope. The mixture composition and carriers are not inferred.</Notice><p className="muted">Nₐ = 6.02214076 × 10²³ mol⁻¹ (exact). M is the neutral-atom molar mass in g mol⁻¹.</p>
  <CalculationTools record={record}/></Panel></div></>}</Localized>;
}
