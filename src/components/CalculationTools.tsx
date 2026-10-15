import { useEffect,useRef, useState } from 'react';
import { Copy, Download, ListOrdered, Printer } from 'lucide-react';
import { Localized, useI18n, translate } from '../i18n';
import {calculationReport} from '../utils/reports';
export {calculationReport} from '../utils/reports';
import type { CalculationRecord } from '../science/records';
import { downloadBlob, serializeChart } from '../utils/export';
import { errorMessage } from '../utils/format';
import { copyText } from '../utils/session';
import { ErrorBox } from './ui';

export function CalculationTools({record}:{record:CalculationRecord|null}){
  const [open,setOpen]=useState(false);const [error,setError]=useState<string|null>(null);const [copied,setCopied]=useState(false);
  const root=useRef<HTMLDivElement>(null);const {language}=useI18n();
  function report(){
    // Use the chart surface, never a decorative Lucide SVG.
    const scope=root.current?.closest('main');const chart=scope?.querySelector<SVGSVGElement>('.recharts-surface');
    return calculationReport(record!,language,chart?serializeChart(chart):'');
  }
  async function copy(){try{await copyText(record!.results.map(r=>`${translate(r.label,language)}: ${r.value} ${r.unit??''}`).join('\n'));setCopied(true);setError(null);}catch(e){setError(errorMessage(e));}}
  function exportReport(){try{downloadBlob(new Blob([report()],{type:'text/html;charset=utf-8'}),'nuclear-decay-report.html');setError(null);}catch(e){setError(errorMessage(e));}}
  function print(){try{const frame=document.createElement('iframe');frame.className='report-print-frame';frame.title='Scientific report';document.body.appendChild(frame);frame.onload=()=>{frame.contentWindow?.focus();frame.contentWindow?.print();};frame.srcdoc=report();setTimeout(()=>frame.remove(),60000);setError(null);}catch(e){setError(errorMessage(e));}}
  useEffect(()=>{setCopied(false);setError(null);},[record]);
  if(!record)return null;
  return <Localized><div className="calculation-tools" ref={root}><div className="calculation-toolbar"><button type="button" className="button secondary small" onClick={()=>setOpen(!open)} aria-expanded={open}><ListOrdered size={15}/>{open?'Hide Calculation Steps':'Show Calculation Steps'}</button><button type="button" className="button secondary small" onClick={copy}><Copy size={14}/>{copied?'Copied':'Copy result'}</button><button type="button" className="button secondary small" onClick={exportReport}><Download size={14}/>Download report</button><button type="button" className="button secondary small" onClick={print}><Printer size={14}/>Print / PDF</button></div><ErrorBox message={error}/>
    <details className="numerical-details"><summary>Numerical details (central values)</summary><p>Extra digits are for reproducibility, not measurement precision.</p>{record.results.filter(q=>q.numerical).map((q,i)=><p key={i}><strong>{q.label}: </strong><span className="numeric">{q.numerical} {q.unit}</span></p>)}{!record.results.some(q=>q.numerical)&&<p>See the numerical substitutions in Calculation Steps. No input uncertainty is assumed.</p>}</details>
    {record.results.some(q=>q.referenceContribution)&&<details className="numerical-details"><summary>Half-life contribution only</summary><p>First-order reference half-life sensitivity; other inputs are held fixed. This is not a combined uncertainty or a confidence interval.</p>{record.results.filter(q=>q.referenceContribution).map((q,i)=><p key={i}><strong>{q.label}: </strong><span className="numeric">u(T½ contribution) ≈ {q.referenceContribution} {q.unit}</span></p>)}</details>}
    {open&&<div className="steps-content"><h3>Given inputs</h3><div className="step-givens">{record.inputs.map((q,i)=><p key={i}><strong>{q.label}: </strong><span className="numeric">{q.value} {q.unit}</span>{q.si&&<span className="muted numeric"> → {q.si}</span>}</p>)}</div><ol className="solution-steps">{record.steps.map((step,i)=><li key={i}><strong>{step.label}</strong><pre dir="ltr">{step.expression}</pre>{step.explanation&&<p>{step.explanation}</p>}</li>)}</ol><h3>Results</h3>{record.results.map((q,i)=><p key={i}><strong>{q.label}: </strong><span className="numeric">{q.value} {q.unit}</span></p>)}</div>}
  </div></Localized>;
}
