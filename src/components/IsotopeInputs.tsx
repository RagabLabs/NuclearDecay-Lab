import { Localized } from '../i18n';
import { useEffect,useState } from 'react';
import { ChevronDown, ShieldCheck } from 'lucide-react';
import { ISOTOPES, getIsotope, NUBASE_URL, CODATA_URL } from '../data/isotopes';
import { TIME_UNITS, ACTIVITY_UNITS, convertTime, convertActivity, parseNumber, type TimeUnit, type ActivityUnit } from '../science/units';
import { Field, SelectField, SourceLink } from './ui';
import { fmt,referenceHalfText,measurementText,compactInput,referenceDigits } from '../utils/format';
import { halfLifeUncertaintySeconds } from '../science/precision';
import { changedUnit } from '../utils/session';
import { ErrorBox } from './ui';
export interface DecayInputs {
    isotopeId: string;
    half: string;
    halfUnit: TimeUnit;
    activity: string;
    activityUnit: ActivityUnit;
    elapsed: string;
    timeUnit: TimeUnit;
    molar: string;
    customName?: string;
}
export const DEFAULT_INPUTS: DecayInputs = { isotopeId: 'I-131', half: '8.0233', halfUnit: 'd', activity: '100', activityUnit: 'MBq', elapsed: '8.0233', timeUnit: 'd', molar: String(getIsotope('I-131')!.molarMass) };
export function resolveInputs(input: DecayInputs) {
    const isotope = getIsotope(input.isotopeId);
    return { isotope, halfSeconds: isotope?.halfLifeSeconds ?? convertTime(parseNumber(input.half, 'Half-life'), input.halfUnit),
        initialBq: convertActivity(parseNumber(input.activity, 'Initial activity'), input.activityUnit),
        elapsedSeconds: convertTime(parseNumber(input.elapsed, 'Elapsed time'), input.timeUnit),
        molarMass: isotope?.molarMass ?? (input.molar.trim() ? parseNumber(input.molar, 'Molar mass') : undefined) };
}
export function IsotopeReference({ id, unit }: {
    id: string;
    unit?: TimeUnit;
}) {
    const isotope = getIsotope(id);
    if (!isotope)
        return null;
    return <Localized>{<details className="reference"><summary><ShieldCheck size={15}/> Evaluated reference data <ChevronDown size={14}/></summary><div className="reference-body">
    <p><strong>{isotope.name}</strong> · DDEP evaluation {isotope.evaluationDate}</p>
    <p>Half-life: <span className="numeric">{measurementText(isotope.halfLifeValue,isotope.halfLifeUncertainty)} {isotope.referenceUnit}</span> {isotope.referenceUnit === 'a' && '(reference tropical years)'}</p>
    <p>Equivalent half-life: <span className="numeric">{referenceHalfText(isotope,unit??isotope.preferredTimeUnit)} {unit??isotope.preferredTimeUnit}</span></p>
    <p>Neutral-atom mass: <span className="numeric">{measurementText(isotope.atomicMassU,isotope.atomicMassUncertaintyU)} u</span></p>
    <p>Molar mass: <span className="numeric">{fmt(isotope.molarMass, 12)} g mol⁻¹</span></p>
    <p>{isotope.decayNote}</p>{isotope.massNote && <p>{isotope.massNote}</p>}
    <p className="precision-note">Converted digits are numerical precision, not additional measurement precision. Reference-aware rounding uses only the half-life contribution with other inputs held fixed; it is not a combined uncertainty budget.</p>
    {isotope.id==='C-14'&&<p>Carbon-14 uses the DDEP 2012 evaluation, 5700 ± 30 a. The historical 5730 ± 40 yr recommendation is a different evaluation, not a unit conversion.</p>}
    <details className="numerical-details"><summary>Numerical details (unit conversion)</summary><p className="numeric">T½ = {String(isotope.halfLifeSeconds)} s; u(T½) = {String(halfLifeUncertaintySeconds(isotope))} s</p><p className="numeric">T½ = {String(convertTime(isotope.halfLifeSeconds,'s',unit??isotope.preferredTimeUnit))} {unit??isotope.preferredTimeUnit}</p><p>y is exactly 365.25 days (Julian); source a is 31,556,926 seconds. Extra digits are retained for reproducibility only.</p></details>
    <div className="source-row"><SourceLink href={isotope.halfLifeSource}>DDEP half-life</SourceLink><SourceLink href={isotope.massSource}>AME2020 mass</SourceLink><SourceLink href={CODATA_URL}>CODATA constants</SourceLink>{isotope.massNote && <SourceLink href={NUBASE_URL}>NUBASE excitation</SourceLink>}</div>
    <p className="muted">Reference uncertainties have k = 1. Display rounding uses the half-life contribution only; no combined uncertainty is inferred. A UI year is 365.25 days; source years are converted to seconds first.</p>
  </div></details>}</Localized>;
}
export function IsotopeInputs({ value, onChange, showTime = true, showMass = false, showActivity = true,showHalf=true }: {
    value: DecayInputs;
    onChange: (v: DecayInputs) => void;
    showTime?: boolean;
    showMass?: boolean;
    showActivity?: boolean;
    showHalf?: boolean;
}) {
    const [advanced, setAdvanced] = useState(false);
    const [unitError,setUnitError]=useState<string|null>(null);
    useEffect(()=>setUnitError(null),[value]);
    function unitChange(key:'halfUnit'|'timeUnit'|'activityUnit',next:string){try{const target=key==='halfUnit'?'half':key==='timeUnit'?'elapsed':'activity';const converted=changedUnit(value[target],value[key],next,key==='activityUnit'?'activity':'time');onChange({...value,[key]:next,[target]:converted});setUnitError(null);}catch(e){setUnitError((e as Error).message);}}
    const set = <K extends keyof DecayInputs>(key: K, v: DecayInputs[K]) => onChange({ ...value, [key]: v });
    const isotope = getIsotope(value.isotopeId);
    function selectIsotope(id: string) {
        const i = getIsotope(id);
        if (i)
            onChange({ ...value, isotopeId: id, half: String(convertTime(i.halfLifeSeconds, 's', i.preferredTimeUnit)), halfUnit: i.preferredTimeUnit, molar: String(i.molarMass), timeUnit: i.preferredTimeUnit, elapsed: String(convertTime(i.halfLifeSeconds, 's', i.preferredTimeUnit)) });
        else
            onChange({ ...value, isotopeId: 'custom', half: isotope ? String(convertTime(isotope.halfLifeSeconds, 's', value.halfUnit)) : value.half, molar: '' });
    }
    return <Localized>{<><SelectField label="Radioisotope" value={value.isotopeId} onChange={selectIsotope}>
    {ISOTOPES.map(i => <option key={i.id} value={i.id}>{i.name} ({i.id})</option>)}<option value="custom">Custom half-life</option>
  </SelectField>
    {!isotope&&<div className="field"><label htmlFor="custom-isotope-name">Isotope name</label><input id="custom-isotope-name" value={value.customName??''} maxLength={120} onChange={e=>set('customName',e.target.value)}/></div>}
    {!isotope && showHalf&&<Field label="Half-life" value={value.half} onChange={v => set('half', v)} unit={value.halfUnit} units={Object.keys(TIME_UNITS)} onUnit={v => unitChange('halfUnit',v)}/>}
    {isotope && <div className="isotope-strip"><div><span className="atom-symbol">{isotope.symbol}</span><div><strong>{isotope.name}</strong><small>T½ = {measurementText(isotope.halfLifeValue,isotope.halfLifeUncertainty)} {isotope.referenceUnit}</small></div></div><span className="badge">DDEP</span></div>}
    {showActivity && <Field label="Initial activity" value={value.activity} onChange={v => set('activity', v)} unit={value.activityUnit} units={Object.keys(ACTIVITY_UNITS)} onUnit={v => unitChange('activityUnit',v)}/>}
    {showTime && <Field label="Elapsed time" value={value.elapsed} displayValue={isotope&&Number(value.elapsed)===convertTime(isotope.halfLifeSeconds,'s',value.timeUnit)?compactInput(value.elapsed,referenceDigits(Number(value.elapsed),convertTime(halfLifeUncertaintySeconds(isotope),'s',value.timeUnit))):undefined} onChange={v => set('elapsed', v)} unit={value.timeUnit} units={Object.keys(TIME_UNITS)} onUnit={v => unitChange('timeUnit',v)} hint="Future decay only: t ≥ 0. Rounded fields retain their numerical value; focus to inspect or edit."/>}
    {showMass && !isotope && <><button type="button" className="text-button" onClick={() => setAdvanced(!advanced)} aria-expanded={advanced}>{advanced ? 'Hide' : 'Add'} molar mass <ChevronDown size={14}/></button>{advanced && <Field label="Isotope molar mass" value={value.molar} onChange={v => set('molar', v)} unit="g/mol" optional hint="Leave blank to calculate everything except mass."/>}</>}
    {isotope&&<p className="precision-note">Reference central values; display rounding does not add measurement precision. Focus a shortened field to inspect its stored numerical value.</p>}<ErrorBox message={unitError}/><IsotopeReference id={value.isotopeId} unit={value.timeUnit}/>
  </>}</Localized>;
}
