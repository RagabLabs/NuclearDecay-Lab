import type { TimePoint } from '../science/decay';
import { convertActivity, type ActivityUnit, type TimeUnit } from '../science/units';
import {displayActivityValue} from './format';
import type {Isotope} from '../data/isotopes';

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link=document.createElement('a');link.href=url;link.download=filename;
  document.body.appendChild(link);link.click();link.remove();
  // Delay revocation so browsers can finish scheduling the download.
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export function csvCell(value: string | number): string {
  const raw=typeof value==='number'&&!Number.isFinite(value)?'outside_numeric_range':String(value);
  // Neutralize spreadsheet formulas in text; keep signed numeric values numeric.
  const safe=typeof value==='string' && /^[=+\-@]/.test(raw) ? `'${raw}` : raw;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g,'""')}"` : safe;
}
export function makeCsv(headers: (string|number)[], rows: (string|number)[][]): string {
  return '\uFEFF'+[headers,...rows].map(row=>row.map(csvCell).join(',')).join('\r\n')+'\r\n';
}
export function timeAnalysisCsv(rows:TimePoint[],timeUnit:TimeUnit,activityUnit:ActivityUnit,reference?:Isotope):string {
  return makeCsv([`time_${timeUnit}`,`remaining_activity_${activityUnit}`,`decayed_activity_${activityUnit}`,'remaining_fraction','decayed_fraction','half_lives_elapsed','activity_underflow','ln_remaining_activity_Bq','remaining_activity_Bq','decayed_activity_Bq','remaining_percentage','decayed_percentage','ln_decayed_activity_Bq','initial_activity_Bq','half_life_seconds','decay_constant_per_second',...(reference?['isotope','reference_half_life','reference_half_life_uncertainty','reference_half_life_unit','evaluation_date','half_life_source']:[])],
    rows.map(r=>[r.time,decayActivityCsvValue(r,activityUnit),decayActivityCsvValue(r,activityUnit,true),r.remainingFraction,r.decayedFraction,
      Number.isFinite(r.halfLivesElapsed)?r.halfLivesElapsed:'exceeds_numeric_range',String(r.underflow),r.logRemainingActivity===null?'undefined_A0_zero':Number.isFinite(r.logRemainingActivity)?r.logRemainingActivity:'below_log_range',r.remainingActivityBq,r.decayedActivityBq,r.remainingPercent,r.decayedPercent,r.logDecayedActivity??'undefined_zero_loss',r.initialActivityBq,r.halfLifeSeconds,r.lambdaPerSecond,...(reference?[reference.id,reference.halfLifeValue,reference.halfLifeUncertainty,reference.referenceUnit,reference.evaluationDate,reference.halfLifeSource]:[])]));
}
export function decayActivityCsvValue(r:TimePoint|import('../science/decay').DecayResult,unit:ActivityUnit,lost=false):number|string {
  try{return displayActivityValue(r,unit,lost)??'below_display_unit_range';}catch{return 'outside_display_unit_range';}
}
export function downloadCsv(csv:string,filename='nuclear-decay-analysis.csv'):void { downloadBlob(new Blob([csv],{type:'text/csv;charset=utf-8'}),filename); }
export function activityCsvValue(bq:number,unit:ActivityUnit):number|string {
  try{return convertActivity(bq,'Bq',unit);}catch{return 'outside_display_unit_range';}
}

export function serializeChart(svg:SVGSVGElement):string {
  const clone=svg.cloneNode(true) as SVGSVGElement;
  const originals=[svg,...svg.querySelectorAll('*')];
  const copies=[clone,...clone.querySelectorAll('*')];
  // Export colors resolved from the active theme, with no external styles or fonts.
  originals.forEach((el,i)=>{
    const style=getComputedStyle(el);
    ['fill','stroke','color','font-family','font-size','font-weight','opacity'].forEach(property=>{
      const v=style.getPropertyValue(property);if(v)(copies[i] as SVGElement).style.setProperty(property,v);
    });
  });
  clone.setAttribute('xmlns','http://www.w3.org/2000/svg');
  return new XMLSerializer().serializeToString(clone);
}
export async function chartToPng(svg:SVGSVGElement,filename:string,title:string):Promise<void> {
  const width=svg.viewBox?.baseVal.width||svg.getBoundingClientRect().width||900;
  const height=svg.viewBox?.baseVal.height||svg.getBoundingClientRect().height||320;
  const url=URL.createObjectURL(new Blob([serializeChart(svg)],{type:'image/svg+xml;charset=utf-8'}));
  try {
    const img=new Image();img.src=url;
    await new Promise<void>((resolve,reject)=>{img.onload=()=>resolve();img.onerror=()=>reject(new Error('Chart image could not be rendered.'));});
    const scale=2;const canvas=document.createElement('canvas');canvas.width=width*scale;canvas.height=(height+84)*scale;
    const ctx=canvas.getContext('2d');if(!ctx)throw new Error('PNG export requires Canvas support in this browser.');
    ctx.scale(scale,scale);
    ctx.fillStyle=getComputedStyle(document.documentElement).getPropertyValue('--surface').trim()||'#ffffff';ctx.fillRect(0,0,width,height+84);
    ctx.fillStyle=getComputedStyle(document.documentElement).getPropertyValue('--text').trim()||'#132535';ctx.font='600 17px sans-serif';ctx.fillText(title,24,30);
    ctx.font='11px sans-serif';ctx.fillText('NuclearDecay Lab · single-nuclide exponential decay',24,height+72);
    ctx.drawImage(img,0,44,width,height);
    const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('PNG export failed.')),'image/png'));
    downloadBlob(blob,filename);
  } finally {URL.revokeObjectURL(url);}
}
