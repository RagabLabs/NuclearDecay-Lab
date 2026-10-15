import { Localized } from '../i18n';
import { useEffect,useMemo, useState } from 'react';
import { decayConstant, halfLife } from '../science/decay';
import { TIME_UNITS, constantToSI, convertTime, parseNumber, type TimeUnit } from '../science/units';
import { Field, ErrorBox, Metric, Notice, Panel, PageHeading, Equation } from '../components/ui';
import { errorMessage, fmt, rateText, timeText } from '../utils/format';
import { CalculationTools } from '../components/CalculationTools';
import { AnalysisActions } from '../components/AnalysisActions';
import { halfRecord } from '../science/records';
import { changedUnit } from '../utils/session';
export function HalfLifeCalculator() {
    const [unitError,setUnitError]=useState<string|null>(null);
    const [mode, setMode] = useState<'half' | 'constant'>('half');
    const [value, setValue] = useState('8.0233');
    const [unit, setUnit] = useState<TimeUnit>('d');
    const [outputUnit, setOutputUnit] = useState<TimeUnit>('s');
    useEffect(()=>setUnitError(null),[value,unit,mode]);
    const computed = useMemo(() => { try {
        const n = parseNumber(value, mode === 'half' ? 'Half-life' : 'Decay constant');
        const h = mode === 'half' ? convertTime(n, unit) : halfLife(constantToSI(n, unit));
        return { half: h, lambda: decayConstant(h), error: null };
    }
    catch (e) {
        return { half: 0, lambda: 0, error: errorMessage(e) };
    } }, [mode, value, unit]);
    const saved={mode,value,unit,outputUnit};
    return <Localized>{<><PageHeading title="Half-life & decay constant" description="Convert between T½ and λ with explicit time dimensions."/><AnalysisActions page="half-life" value={saved} onLoad={v=>{setMode(v.mode);setValue(v.value);setUnit(v.unit);setOutputUnit(v.outputUnit);}} onClear={()=>setValue('')} validate={(x:unknown):x is typeof saved=>{if(!x||typeof x!=='object')return false;const v=x as typeof saved;return ['half','constant'].includes(v.mode)&&typeof v.value==='string'&&Object.hasOwn(TIME_UNITS,v.unit)&&Object.hasOwn(TIME_UNITS,v.outputUnit);}}/><div className="two-column"><Panel title="Choose a conversion"><div className="segmented wide"><button className={mode === 'half' ? 'active' : ''} aria-pressed={mode === 'half'} onClick={() => { setMode('half'); setValue('8.0233'); setUnit('d'); }}>Half-life → λ</button><button className={mode === 'constant' ? 'active' : ''} aria-pressed={mode === 'constant'} onClick={() => { setMode('constant'); setValue('0.000001'); setUnit('s'); }}>λ → Half-life</button></div>
    <Field label={mode === 'half' ? 'Half-life' : 'Decay constant'} value={value} onChange={setValue} unit={unit} units={Object.keys(TIME_UNITS)} onUnit={v => {try{setValue(changedUnit(value,unit,v,mode==='half'?'time':'rate'));setUnit(v as TimeUnit);setUnitError(null);}catch(e){setUnitError(errorMessage(e));}}} hint={mode === 'constant' ? `Input λ is in ${unit}⁻¹ (per ${TIME_UNITS[unit].label}).` : 'Half-life must be finite and greater than zero.'}/>
    <ErrorBox message={unitError??computed.error}/><div className="field"><label htmlFor="conversion-output">Output time base</label><select id="conversion-output" value={outputUnit} onChange={e => setOutputUnit(e.target.value as TimeUnit)}>{Object.keys(TIME_UNITS).map(u => <option key={u}>{u}</option>)}</select></div>
    <Equation>λ = ln(2) / T½ <span>T½ = ln(2) / λ</span></Equation>
    <Notice>A value in d⁻¹ is a rate per day. Converting to s⁻¹ divides the numerical value by 86,400.</Notice>
  </Panel><Panel title="Conversion results"><ErrorBox message={unitError??computed.error}/>{!computed.error && <><div className="metric-grid"><Metric label="Decay constant" value={rateText(computed.lambda, outputUnit)} unit={`${outputUnit}⁻¹`} accent/><Metric label="Half-life" value={timeText(computed.half, outputUnit)} unit={outputUnit}/><Metric label="SI decay constant" value={fmt(computed.lambda)} unit="s⁻¹"/><Metric label="SI half-life" value={fmt(computed.half)} unit="s"/></div><p className="muted">Both outputs describe the same exponential decay. ln(2) = 0.6931471805599453.</p></>}<CalculationTools record={computed.error?null:halfRecord(value,unit,computed.half,mode)}/></Panel></div></>}</Localized>;
}
