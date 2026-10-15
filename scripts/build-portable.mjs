import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

// No dependencies or external assets: useful for offline teaching and a direct file:// launch.
const dir=resolve('dist');
let html=await readFile(resolve(dir,'index.html'),'utf8');
const script=html.match(/<script[^>]+src="([^"]+)"[^>]*><\/script>/);
const style=html.match(/<link[^>]+href="([^"]+\.css)"[^>]*>/);
if(!script||!style)throw new Error('Expected one Vite entry script and stylesheet.');
const assetPath=href=>{const start=href.indexOf('assets/');if(start<0)throw new Error('Expected an assets/ path');return resolve(dir,href.slice(start));};
const js=await readFile(assetPath(script[1]),'utf8');
const css=await readFile(assetPath(style[1]),'utf8');
// This build has no dynamic imports: fail explicitly if chunk splitting is introduced later.
if(/\bimport\s*\(/.test(js)||/\bimport\s*\{/.test(js))throw new Error('Portable build must not depend on external JS chunks.');
html=html.replace(script[0],()=>`<script type="module">${js.replace(/<\/script/gi,'<\\/script')}</script>`)
  .replace(style[0],()=>`<style>${css}</style>`)
  .replace(/<link rel="icon"[^>]+>/,'<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 48 48%22%3E%3Crect width=%2248%22 height=%2248%22 rx=%2212%22 fill=%22%230d9488%22/%3E%3Ctext x=%2224%22 y=%2232%22 fill=%22white%22 text-anchor=%22middle%22 font-size=%2228%22%3Eλ%3C/text%3E%3C/svg%3E">');
await writeFile(resolve(dir,'nuclear-decay-lab.html'),html);
console.log('Portable offline app: dist/nuclear-decay-lab.html');
