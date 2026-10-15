import { describe,expect,it,vi,afterEach } from 'vitest';
import { analyzeTimes,completeAnalysis } from '../src/science/decay';
import { getIsotope } from '../src/data/isotopes';
import { csvCell, makeCsv, timeAnalysisCsv, downloadBlob, chartToPng, activityCsvValue } from '../src/utils/export';
import { calculationReport } from '../src/utils/reports';
import { decayRecord } from '../src/science/records';
import {DEFAULT_INPUTS} from '../src/components/IsotopeInputs';
import { fmt,escapeHtml,activityText,timeText,massText,rateText } from '../src/utils/format';
afterEach(()=>vi.restoreAllMocks());
describe('CSV exports',()=>{
  it('exports full precision with explicit units and correct values',()=>{
    const csv=timeAnalysisCsv(analyzeTimes(100e6,10,[0,10,20]),'s','MBq');
    expect(csv).toContain('time_s,remaining_activity_MBq');expect(csv).toContain('10,50,50,0.5,0.5,1,false');expect(csv).toContain('20,25,75,0.25,0.75,2,false');expect(csv.charCodeAt(0)).toBe(0xfeff);expect(csv.endsWith('\r\n')).toBe(true);
  });
  it('retains numerical underflow context',()=>{const csv=timeAnalysisCsv(analyzeTimes(1,1,[2000]),'s','Bq');expect(csv).toContain('true');expect(csv).toContain(String(-2000*Math.LN2));});
  it('retains SI values if a display-unit conversion is below range',()=>{const csv=timeAnalysisCsv(analyzeTimes(1e-320,1,[0]),'s','TBq');expect(csv).toContain('below_display_unit_range');expect(csv).toContain('1e-320');});
  it('escapes CSV quoting and neutralizes text formula injection',()=>{expect(csvCell('a,"b"')).toBe('"a,""b"""');expect(csvCell('=1+1')).toBe("'=1+1");expect(csvCell(-1)).toBe('-1');expect(makeCsv(['isotope'],[['C-14']])).toContain('C-14');});
  it('indicates impossible display-unit conversions',()=>expect(activityCsvValue(1e308,'µBq')).toBe('outside_display_unit_range'));
});
describe('Scientific reports',()=>{
  it('contains inputs, correct results, equations, assumptions and sources',()=>{
    const i=getIsotope('I-131')!;
    const result=completeAnalysis(100e6,i.halfLifeSeconds,i.halfLifeSeconds,i.molarMass);
    const html=calculationReport(decayRecord(DEFAULT_INPUTS,result));
    expect(html).toContain('Iodine-131');expect(html).toContain('5e7 Bq');expect(html).toContain('50%');expect(html).toContain('expm1');expect(html).toContain('daughter ingrowth');expect(html).toContain(i.halfLifeSource);expect(html).toContain('window.print()');expect(html).toContain('31,556,926');
  });
  it('does not attribute custom user inputs to a reference database',()=>{const r=completeAnalysis(100,10,10);const html=calculationReport(decayRecord({...DEFAULT_INPUTS,isotopeId:'custom',half:'10',halfUnit:'s',activity:'100',activityUnit:'Bq',elapsed:'10',timeUnit:'s',molar:''},r));expect(html).toContain('Custom isotope');expect(html).not.toContain('I-131_tables.pdf');expect(html).toContain('Unavailable');});
  it('embeds the supplied chart without a remote asset dependency',()=>{const html=calculationReport(decayRecord({...DEFAULT_INPUTS,isotopeId:'custom',half:'1',halfUnit:'s',activity:'1',activityUnit:'Bq',elapsed:'1',timeUnit:'s',molar:''}),'en','<svg id="analysis-curve"></svg>');expect(html).toContain('<svg id="analysis-curve"></svg>');});
  it('documents numerical range exceptions',()=>{const html=calculationReport(decayRecord({...DEFAULT_INPUTS,isotopeId:'custom',half:'1',halfUnit:'s',activity:'1',activityUnit:'Bq',elapsed:'2000',timeUnit:'s',molar:''}));expect(html).toContain('not exact physical zero');expect(html).toContain('Scientific assumptions');});
});
describe('Download orchestration',()=>{
  it('creates a download with the requested filename and a local Blob',()=>{
    const click=vi.spyOn(HTMLAnchorElement.prototype,'click').mockImplementation(()=>{});
    const append=vi.spyOn(document.body,'appendChild');
    const b=new Blob(['example'],{type:'text/csv'});downloadBlob(b,'results.csv');
    expect(URL.createObjectURL).toHaveBeenCalledWith(b);expect(click).toHaveBeenCalledOnce();
    const anchor=append.mock.calls[0][0] as HTMLAnchorElement;expect(anchor.download).toBe('results.csv');expect(anchor.href).toBe('blob:test-download');expect(document.body.contains(anchor)).toBe(false);
  });
  it('executes the PNG path with a mocked Canvas (real rasterization needs a browser)',async()=>{
    class TestImage {onload:(()=>void)|null=null;onerror:(()=>void)|null=null;set src(_v:string){queueMicrotask(()=>this.onload?.());}}
    vi.stubGlobal('Image',TestImage);
    const context={scale:vi.fn(),fillRect:vi.fn(),fillText:vi.fn(),drawImage:vi.fn(),fillStyle:'',font:''};
    vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue(context as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype,'toBlob').mockImplementation(callback=>callback(new Blob(['mockpng'],{type:'image/png'})));
    vi.spyOn(HTMLAnchorElement.prototype,'click').mockImplementation(()=>{});
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
    Object.defineProperty(svg,'viewBox',{value:{baseVal:{width:800,height:320}}});
    await chartToPng(svg,'curve.png','Activity');expect(context.drawImage).toHaveBeenCalledOnce();expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test-download');
    vi.unstubAllGlobals();
  });
  it('surfaces unavailable Canvas support',async()=>{
    class TestImage {onload:(()=>void)|null=null;onerror:(()=>void)|null=null;set src(_v:string){queueMicrotask(()=>this.onload?.());}}
    vi.stubGlobal('Image',TestImage);vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue(null);
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');Object.defineProperty(svg,'viewBox',{value:{baseVal:{width:800,height:320}}});
    await expect(chartToPng(svg,'curve.png','Activity')).rejects.toThrow(/Canvas support/);vi.unstubAllGlobals();
  });
});
describe('Readable and safe formatting',()=>{
  it('uses scientific notation without changing the value',()=>{expect(fmt(1.23456e-10)).toBe('1.23456e-10');expect(fmt(null)).toBe('Unavailable');expect(fmt(Infinity)).toBe('Beyond numeric range');});
  it('escapes arbitrary text in reports',()=>expect(escapeHtml('<script>&"\'')).toBe('&lt;script&gt;&amp;&quot;&#39;'));
  it('reports output-unit range problems without crashing the UI',()=>{expect(activityText(1e308,'µBq')).toBe('Outside unit range');expect(timeText(1e-320,'y')).toBe('Outside unit range');expect(massText(1e308,'ng')).toBe('Outside unit range');expect(rateText(1e308,'y')).toBe('Outside unit range');});
});
