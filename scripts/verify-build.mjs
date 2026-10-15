import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import { JSDOM, VirtualConsole } from 'jsdom';

// Production JavaScript execution in a DOM emulator, not a real visual browser.
const hostedHtml=await readFile('dist/index.html','utf8');
const hostedUrl='https://ragablabs.github.io/NuclearDecay-Lab/';
const hostedMarkup=new JSDOM(hostedHtml,{url:hostedUrl});
for(const node of hostedMarkup.window.document.querySelectorAll('script[src],link[href]')){
  const href=node.getAttribute('src')??node.getAttribute('href');
  if(href.startsWith('data:'))continue;
  const url=new URL(href,hostedUrl);
  assert.ok(url.href.startsWith(hostedUrl),'Every deployed asset must resolve inside /NuclearDecay-Lab/.');
  await readFile(resolve('dist',url.pathname.slice('/NuclearDecay-Lab/'.length)));
}
const hostedScript=hostedMarkup.window.document.querySelector('script[src]').getAttribute('src');
const hostedJs=await readFile(resolve('dist',new URL(hostedScript,hostedUrl).pathname.slice('/NuclearDecay-Lab/'.length)),'utf8');
hostedMarkup.window.close();
const html=await readFile('dist/nuclear-decay-lab.html','utf8');
const console=new VirtualConsole();
const errors=[];console.on('jsdomError',e=>errors.push(e.message));
const dom=new JSDOM(html,{url:'file:///offline/nuclear-decay-lab.html#/analysis',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:console});
const w=dom.window;
w.ResizeObserver=class {
  constructor(callback){this.callback=callback;}
  observe(target){this.callback([{target,contentRect:{width:900,height:320}}]);}
  unobserve(){}disconnect(){}
};
w.Element.prototype.getBoundingClientRect=function(){const height=this.classList.contains('recharts-legend-wrapper')?24:320;return {width:900,height,x:0,y:0,left:0,top:0,right:900,bottom:height};};
w.scrollTo=()=>{};
w.TextEncoder=TextEncoder;w.TextDecoder=TextDecoder;
assert.equal(w.document.querySelectorAll('script[src]').length,0,'Portable file must not require external JavaScript.');
assert.equal(w.document.querySelectorAll('link[rel=stylesheet]').length,0,'Portable file must not require external CSS.');
const entry=w.document.querySelector('script[type=module]');assert.ok(entry);
w.eval(entry.textContent);
async function until(check){for(let n=0;n<200;n++){if(check())return;await new Promise(r=>setTimeout(r,10));}throw new Error('Timed out waiting for production app to render.');}
async function route(path,title){w.location.hash=`#/${path}`;await until(()=>w.document.querySelector('h1')?.textContent===title);}
function button(text){return [...w.document.querySelectorAll('button')].find(b=>b.textContent.trim()===text);}
function field(label){const direct=[...w.document.querySelectorAll('[aria-label]')].find(e=>e.getAttribute('aria-label')===label);if(direct)return direct;const l=[...w.document.querySelectorAll('label')].find(l=>l.textContent.trim()===label);assert.ok(l,`Missing field: ${label}`);return w.document.getElementById(l.htmlFor);}
async function enter(label,value){const input=field(label);input.focus();await new Promise(r=>setTimeout(r,0));Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype,'value').set.call(input,value);input.dispatchEvent(new w.Event('input',{bubbles:true}));input.dispatchEvent(new w.Event('change',{bubbles:true}));input.blur();await new Promise(r=>setTimeout(r,0));}
await until(()=>w.document.querySelector('h1')?.textContent==='Complete Decay Analysis');
await until(()=>w.document.querySelector('.recharts-line-curve'));
assert.ok(w.document.body.textContent.includes('50%'));
assert.equal(w.document.querySelectorAll('table tbody tr').length,7);
button('Show Calculation Steps').click();
await until(()=>w.document.querySelector('.solution-steps'));
assert.ok(w.document.querySelector('.solution-steps').textContent.includes('5e7 Bq'));
button('Print / PDF').click();
const report=w.document.querySelector('.report-print-frame');
assert.ok(report.srcdoc.includes('recharts-line-curve'),'Print report must contain the actual plot.');
assert.ok(report.srcdoc.includes('Calculation steps'));
report.remove();
const isotope=field('Radioisotope');isotope.value='C-14';isotope.dispatchEvent(new w.Event('change',{bubbles:true}));
await until(()=>field('Elapsed time').getAttribute('data-numerical-value')==='5699.878260704236');
assert.equal(field('Elapsed time').value,'5700','A rounded field must retain its full numerical conversion.');
await enter('Elapsed time','5730');await enter('Inspect time','5730');
await until(()=>w.document.querySelector('.primary-metrics').textContent.includes('49.82'));
assert.ok(w.document.querySelector('.chart-inspection').textContent.includes('49.82 MBq'));
assert.ok(w.document.querySelector('table').textContent.includes('49.82%'));
button('Print / PDF').click();
const carbonReport=w.document.querySelector('.report-print-frame');
assert.ok(carbonReport.srcdoc.includes('49817183.766'));
assert.ok(carbonReport.srcdoc.includes('Half-life contribution only'));
assert.ok(carbonReport.srcdoc.includes('Reference half-life uncertainty'));
carbonReport.remove();
await route('comparison','Radioisotope comparison');
await until(()=>w.document.querySelectorAll('.recharts-line-curve').length===3);
assert.equal(w.document.querySelectorAll('table tbody tr').length,3);
await route('inverse','Inverse decay calculator');
assert.ok(w.document.querySelector('.metric.accent').textContent.includes('100'));
const unknownLabel=[...w.document.querySelectorAll('label')].find(l=>l.textContent==='Solve for');
const unknown=w.document.getElementById(unknownLabel.htmlFor);unknown.value='half';unknown.dispatchEvent(new w.Event('change',{bubbles:true}));
await until(()=>w.document.querySelector('.metric.accent')?.textContent.includes('8.0233'));
await route('time-analysis','Time analysis');button('Interval').click();
await until(()=>w.document.querySelectorAll('table tbody tr').length===9);
await route('library','Isotope library');assert.equal(w.document.querySelectorAll('.isotope-library-card').length,8);
await route('learn','Learn Nuclear Decay');assert.ok(w.document.querySelector('input[type=range]'));
await route('activity','Activity & target time');
await route('half-life','Half-life & decay constant');
await route('nuclei-mass','Nuclei & isotope mass');
await route('about','About NuclearDecay Lab');
await route('home','Understandwhat remains.');
await route('documentation','Scientific documentation');
assert.ok(w.document.body.textContent.includes('31,556,926'));
const language=w.document.querySelector('[aria-label=Language]');language.value='ar';language.dispatchEvent(new w.Event('change',{bubbles:true}));
await until(()=>w.document.documentElement.lang==='ar');
assert.equal(w.document.documentElement.dir,'rtl');
assert.ok(w.document.body.textContent.includes('البيانات المرجعية للنظائر'));
await route('analysis','التحليل الشامل للتحلل الإشعاعي');
assert.ok(w.document.querySelector('.primary-metrics').textContent.includes('50%'));
assert.deepEqual(errors,[]);
dom.window.close();
// Execute the actual hosted entry too, at the existing repository URL and a deep hash route.
const hostedErrors=[];const hostedConsole=new VirtualConsole();hostedConsole.on('jsdomError',e=>hostedErrors.push(e.message));
const hostedDom=new JSDOM(hostedHtml,{url:hostedUrl+'#/half-life',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:hostedConsole});
hostedDom.window.scrollTo=()=>{};
hostedDom.window.eval(hostedJs);
await until(()=>hostedDom.window.document.querySelector('h1')?.textContent==='Half-life & decay constant');
assert.ok(hostedDom.window.document.querySelector('.metric-grid').textContent.includes('9.99905e-7'));
assert.deepEqual(hostedErrors,[]);hostedDom.window.close();
process.stdout.write('Production DOM checks passed: all 12 routes, half-life normalization, C-14 screen/table/inspection/report consistency, comparison curves, inverse solver, interval table, SVG reports, Arabic RTL, hosted deep hash route and assets under /NuclearDecay-Lab/. No runtime errors. Real-browser visual, PNG rasterization and print-dialog checks are not claimed.\n');
