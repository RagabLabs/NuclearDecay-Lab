import { useEffect, useState } from 'react';
import { Save, Share2, FolderOpen, Eraser } from 'lucide-react';
import { Localized } from '../i18n';
import { saveAnalysis,loadAnalysis,sharedData,shareUrl,copyText } from '../utils/session';
import { errorMessage } from '../utils/format';
import { ErrorBox } from './ui';
export function AnalysisActions<T>({page,value,onLoad,onClear,validate}:{page:string;value:T;onLoad:(v:T)=>void;onClear:()=>void;validate:(v:unknown)=>v is T}){
  const [status,setStatus]=useState('');const [error,setError]=useState<string|null>(null);const [link,setLink]=useState('');
  useEffect(()=>{try{const data=sharedData();if(data!==undefined){if(!validate(data))throw new Error('Invalid analysis data.');onLoad(data);setStatus('Analysis restored');}}catch(e){setError(errorMessage(e));}},[page]); // Restore once when entering this workflow.
  function save(){try{saveAnalysis(page,value);setStatus('Saved locally');setError(null);}catch(e){setError(errorMessage(e));}}
  function restore(){try{const data=loadAnalysis(page);if(data===undefined)throw new Error('No saved analysis yet.');if(!validate(data))throw new Error('Invalid analysis data.');onLoad(data);setStatus('Analysis restored');setError(null);}catch(e){setError(errorMessage(e));}}
  async function share(){try{const url=shareUrl(page,value);setLink(url);await copyText(url);setStatus('Copied');setError(null);}catch(e){setError(errorMessage(e));}}
  return <Localized><div className="analysis-actions"><div className="action-buttons"><button type="button" className="button secondary small" onClick={save}><Save size={14}/>Save analysis</button><button type="button" className="button secondary small" onClick={restore}><FolderOpen size={14}/>Open last analysis</button><button type="button" className="button secondary small" onClick={share}><Share2 size={14}/>Share analysis</button><button type="button" className="button secondary small" onClick={()=>{onClear();setStatus('');setLink('');}}><Eraser size={14}/>Clear inputs</button></div>{status&&<p role="status" className="action-status">{status}</p>}{link&&<div className="field"><label htmlFor={`share-${page}`}>Share analysis</label><input id={`share-${page}`} value={link} readOnly dir="ltr" onFocus={e=>e.target.select()}/></div>}<ErrorBox message={error}/></div></Localized>;
}
