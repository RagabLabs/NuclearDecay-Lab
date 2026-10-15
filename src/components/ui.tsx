import { Localized } from '../i18n';
import { useId, type ReactNode } from 'react';
import { AlertCircle, ArrowUpRight, Info } from 'lucide-react';
import { fmt } from '../utils/format';
import {NumericInput} from './NumericInput';
export function Field({ label, value, onChange, unit, units, onUnit, hint, optional = false, displayValue }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    unit?: string;
    units?: string[];
    onUnit?: (unit: string) => void;
    hint?: string;
    optional?: boolean;
    displayValue?: string;
}) {
    const id = useId();
    return <Localized>{<div className="field"><label htmlFor={id}>{label}{optional && <span className="optional">optional</span>}</label>
    <div className="input-group"><NumericInput id={id} type="text" inputMode="decimal" autoComplete="off" spellCheck={false} value={value} displayValue={displayValue} onChange={e => onChange(e.target.value)} aria-describedby={hint ? `${id}-hint` : undefined}/>
      {units && onUnit ? <select value={unit} onChange={e => onUnit(e.target.value)} aria-label={`${label} unit`}>{units.map(u => <option key={u} value={u}>{u==='y'?'y · Julian year':u}</option>)}</select> : unit && <span className="unit-label">{unit}</span>}
    </div>{hint && <small id={`${id}-hint`}>{hint}</small>}</div>}</Localized>;
}
export function SelectField({ label, value, onChange, children }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    children: ReactNode;
}) {
    const id = useId();
    return <Localized>{<div className="field"><label htmlFor={id}>{label}</label><select id={id} value={value} onChange={e => onChange(e.target.value)}>{children}</select></div>}</Localized>;
}
export function ErrorBox({ message }: {
    message: string | null | undefined;
}) {
    return <Localized>{message ? <div className="notice error" role="alert"><AlertCircle size={18}/><span>{message}</span></div> : null}</Localized>;
}
export function Notice({ children }: {
    children: ReactNode;
}) { return <Localized>{<div className="notice"><Info size={17}/><div>{children}</div></div>}</Localized>; }
export function Panel({ title, subtitle, children, actions, className = '' }: {
    title?: string;
    subtitle?: string;
    children: ReactNode;
    actions?: ReactNode;
    className?: string;
}) {
    return <Localized>{<section className={`panel ${className}`}>{title && <div className="panel-heading"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{actions}</div>}{children}</section>}</Localized>;
}
export function PageHeading({ eyebrow = 'THE DECAY TOOLKIT', title, description, action }: {
    eyebrow?: string;
    title: string;
    description: string;
    action?: ReactNode;
}) {
    return <Localized>{<header className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{action}</header>}</Localized>;
}
export function Metric({ label, value, unit, detail, accent = false }: {
    label: string;
    value: string;
    unit?: string;
    detail?: string;
    accent?: boolean;
}) {
    return <Localized>{<div className={`metric ${accent ? 'accent' : ''}`}><div className="metric-label">{label}</div><div className="metric-value"><span>{value}</span>{unit && <span className="metric-unit">{unit}</span>}</div>{detail && <p>{detail}</p>}</div>}</Localized>;
}
export function Equation({ children }: {
    children: ReactNode;
}) { return <Localized>{<div className="equation">{children}</div>}</Localized>; }
export function SourceLink({ href, children }: {
    href: string;
    children: ReactNode;
}) { return <Localized>{<a className="source-link" href={href} target="_blank" rel="noreferrer">{children}<ArrowUpRight size={14}/></a>}</Localized>; }
export function Numeric({ value, unit }: {
    value: number | null;
    unit?: string;
}) { return <Localized>{<span className="numeric">{fmt(value)}{unit && ` ${unit}`}</span>}</Localized>; }
