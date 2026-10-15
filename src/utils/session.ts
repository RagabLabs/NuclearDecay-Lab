import { ACTIVITY_UNITS, TIME_UNITS, ScientificError, convertActivity, convertMass, convertTime, type ActivityUnit, type MassUnit, type TimeUnit } from '../science/units';
import { getIsotope } from '../data/isotopes';
import type { DecayInputs } from '../components/IsotopeInputs';

const PREFIX='nucleardecay-analysis:';
export function validateDecayInputs(value:unknown):value is DecayInputs {
  if(!value||typeof value!=='object'||Array.isArray(value))return false;
  const x=value as Record<string,unknown>;
  return ['isotopeId','half','halfUnit','activity','activityUnit','elapsed','timeUnit','molar'].every(k=>typeof x[k]==='string'&&(x[k] as string).length<=120)&&
    (x.customName===undefined||(typeof x.customName==='string'&&x.customName.length<=120))&&(x.isotopeId==='custom'||!!getIsotope(x.isotopeId as string))&&Object.hasOwn(TIME_UNITS,x.halfUnit as string)&&Object.hasOwn(TIME_UNITS,x.timeUnit as string)&&Object.hasOwn(ACTIVITY_UNITS,x.activityUnit as string);
}
function safeObject(value:unknown,depth=0,seen=new WeakSet<object>()):boolean {
  if(depth>16)return false;
  if(value===null||typeof value!=='object')return typeof value==='string'?value.length<=12000:typeof value==='number'?Number.isFinite(value):typeof value==='boolean'||value===null;
  if(seen.has(value))return false;
  seen.add(value);
  const valid=Array.isArray(value)?value.length<=1000&&value.every(v=>safeObject(v,depth+1,seen)):
    Object.entries(value).every(([key,v])=>!['__proto__','prototype','constructor'].includes(key)&&key.length<80&&safeObject(v,depth+1,seen));
  seen.delete(value);
  return valid;
}
export function encodeAnalysis(value:unknown):string {
  if(!safeObject(value))throw new ScientificError('Analysis contains unsupported or oversized data.');
  const raw=JSON.stringify({version:2,data:value});
  const bytes=new TextEncoder().encode(raw);
  if(bytes.length>18000)throw new ScientificError('Analysis is too large for a share link. Use a CSV export.');
  return btoa(String.fromCharCode(...bytes)).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
}
export function decodeAnalysis(encoded:string):unknown {
  if(encoded.length>24000||!/^[A-Za-z0-9_-]+$/.test(encoded))throw new ScientificError('Invalid or oversized analysis link.');
  try{
    const bytes=Uint8Array.from(atob(encoded.replaceAll('-','+').replaceAll('_','/')),c=>c.charCodeAt(0));
    const payload=JSON.parse(new TextDecoder().decode(bytes)) as {version?:unknown;data?:unknown};
    if(payload.version!==2||!safeObject(payload.data))throw new Error('Unsupported payload');
    return payload.data;
  }catch{throw new ScientificError('This analysis link is invalid or uses an unsupported version.');}
}
export function sharedData():unknown {
  const query=window.location.hash.split('?')[1];const value=new URLSearchParams(query??'').get('data');
  return value?decodeAnalysis(value):undefined;
}
export function saveAnalysis(page:string,data:unknown):void {
  localStorage.setItem(PREFIX+page,JSON.stringify({savedAt:new Date().toISOString(),payload:encodeAnalysis(data)}));
}
export function loadAnalysis(page:string):unknown {
  const raw=localStorage.getItem(PREFIX+page);if(!raw)return undefined;
  return decodeAnalysis((JSON.parse(raw) as {payload:string}).payload);
}
export function clearAnalyses():void {
  const keys=Array.from({length:localStorage.length},(_,i)=>localStorage.key(i)).filter((k):k is string=>!!k&&(k.startsWith(PREFIX)||k==='nucleardecay-theme'||k==='nucleardecay-language'));
  keys.forEach(k=>localStorage.removeItem(k));
}
export function shareUrl(page:string,data:unknown):string {
  const origin=window.location.href.split('#')[0];return `${origin}#/${page}?data=${encodeAnalysis(data)}`;
}
export async function copyText(text:string):Promise<void> {
  if(navigator.clipboard?.writeText){try{await navigator.clipboard.writeText(text);return;}catch{/* file:// can require the older clipboard path. */}}
  const area=document.createElement('textarea');area.value=text;area.style.position='fixed';area.style.opacity='0';document.body.appendChild(area);area.select();
  try{if(!document.execCommand?.('copy'))throw new Error('Copy is unavailable. Select the text and copy it manually.');}finally{area.remove();}
}
export function changedUnit(raw:string,from:string,to:string,kind:'time'|'activity'|'mass'|'rate'):string {
  if(raw.trim()==='')return raw;
  const n=Number(raw);if(!Number.isFinite(n)||n<0)return raw;
  const converted=kind==='activity'?convertActivity(n,from as ActivityUnit,to as ActivityUnit):
    kind==='mass'?convertMass(n,from as MassUnit,to as MassUnit):
    kind==='rate'?convertTime(n,to as TimeUnit,from as TimeUnit):convertTime(n,from as TimeUnit,to as TimeUnit);
  return String(converted);
}
