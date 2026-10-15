import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
afterEach(()=>cleanup());
Object.defineProperty(window,'matchMedia',{writable:true,value:vi.fn().mockImplementation(query=>({matches:false,media:query,onchange:null,addListener:vi.fn(),removeListener:vi.fn(),addEventListener:vi.fn(),removeEventListener:vi.fn(),dispatchEvent:vi.fn()}))});
window.scrollTo=vi.fn();
class ResizeObserverMock {
  callback:ResizeObserverCallback;
  constructor(callback:ResizeObserverCallback){this.callback=callback;}
  observe(target:Element){this.callback([{target,contentRect:{width:800,height:320}} as ResizeObserverEntry],this as unknown as ResizeObserver);}
  unobserve(){} disconnect(){}
}
vi.stubGlobal('ResizeObserver',ResizeObserverMock);
Element.prototype.getBoundingClientRect=function(){
  // A legend's measured height must not consume the entire simulated chart.
  const height=this.classList.contains('recharts-legend-wrapper')?24:this.tagName==='SPAN'?12:320;
  return {width:800,height,x:0,y:0,left:0,top:0,right:800,bottom:height,toJSON:()=>({})};
};
URL.createObjectURL=vi.fn(()=>'blob:test-download');
URL.revokeObjectURL=vi.fn();
