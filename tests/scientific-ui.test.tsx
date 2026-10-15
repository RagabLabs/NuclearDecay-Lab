import {beforeEach,it,expect,vi,describe} from 'vitest';
import {act,fireEvent,render,screen,within} from '@testing-library/react';
import App from '../src/App';
import {encodeAnalysis} from '../src/utils/session';
import {DEFAULT_INPUTS} from '../src/components/IsotopeInputs';
function navigate(route:string){act(()=>{window.location.hash='#/'+route;window.dispatchEvent(new HashChangeEvent('hashchange'));});}
function enter(label:string|RegExp,value:string){const input=screen.getByLabelText(label);fireEvent.focus(input);fireEvent.change(input,{target:{value}});fireEvent.blur(input);}
beforeEach(()=>{localStorage.clear();window.location.hash='#/analysis';Object.defineProperty(navigator,'clipboard',{value:{writeText:vi.fn().mockResolvedValue(undefined)},configurable:true});});
describe('Scientific data and display consistency in the UI',()=>{
 it('separates C-14 reference precision, stored conversion and the exact half-life normalization',()=>{
  render(<App/>);enter('Radioisotope','C-14');
  const elapsed=screen.getByLabelText('Elapsed time');
  expect(elapsed).toHaveValue('5700');expect(elapsed).toHaveAttribute('data-numerical-value','5699.878260704236');
  expect(document.querySelector('.primary-metrics')).toHaveTextContent('50%');
  expect(document.querySelector('.isotope-strip')).toHaveTextContent('5,700 ± 30 a');
  fireEvent.focus(elapsed);expect(elapsed).toHaveValue('5699.878260704236');fireEvent.blur(elapsed);expect(elapsed).toHaveValue('5700');
  expect(document.querySelector('.primary-metrics')).toHaveTextContent('50%');
 });
 it('distinguishes an entered 5700 Julian years from exactly one sourced half-life',()=>{
  render(<App/>);enter('Radioisotope','C-14');enter('Elapsed time','5700');
  const el=screen.getByLabelText('Elapsed time');expect(el).toHaveAttribute('data-numerical-value','5700');
  fireEvent.click(screen.getByRole('button',{name:'Print / PDF'}));const html=document.querySelector<HTMLIFrameElement>('.report-print-frame')!.srcdoc;
  expect(html).toContain('49999259.785');document.querySelector('.report-print-frame')!.remove();
 });
 it('uses one C-14 calculation for the screen, arbitrary-time inspection, table and scientific report',()=>{
  render(<App/>);enter('Radioisotope','C-14');enter('Elapsed time','5730');enter('Inspect time','5730');
  expect(document.querySelector('.primary-metrics')).toHaveTextContent('49.82');expect(document.querySelector('.chart-inspection')).toHaveTextContent('49.82 MBq');
  const table=screen.getByRole('table');expect(within(table).getAllByText('49.82%').length).toBeGreaterThan(0);
  fireEvent.click(screen.getByRole('button',{name:'Print / PDF'}));const frame=document.querySelector<HTMLIFrameElement>('.report-print-frame')!;
  expect(frame.srcdoc).toContain('4.982e7');expect(frame.srcdoc).toContain('49817183.766');expect(frame.srcdoc).toContain('Reference half-life uncertainty');expect(frame.srcdoc).toContain('Half-life contribution only');frame.remove();
 });
 it('keeps C-14 and I-131 calculations distinct when changing the nuclide',()=>{
  render(<App/>);enter('Radioisotope','C-14');enter('Elapsed time','5730');enter('Radioisotope','I-131');
  expect(screen.getByLabelText('Elapsed time unit')).toHaveValue('d');expect(document.querySelector('.isotope-strip')).toHaveTextContent('8.0233 ± 0.0019 d');
  expect(document.querySelector('.primary-metrics')).toHaveTextContent('50%');expect(document.querySelector('.secondary-metrics')).not.toHaveTextContent('5,700');
 });
 it('does not use rounded range fields as new numerical chart inputs',()=>{
  render(<App/>);enter('Radioisotope','C-14');const range=screen.getByLabelText('Chart range');
  const raw=range.getAttribute('data-numerical-value')!;expect(raw.length).toBeGreaterThan(14);expect((range as HTMLInputElement).value.length).toBeLessThan(raw.length);
  fireEvent.focus(range);expect(range).toHaveValue(raw);fireEvent.blur(range);expect(range).toHaveAttribute('data-numerical-value',raw);
 });
 it('calculates nuclei-to-mass without an irrelevant half-life or initial activity',()=>{
  render(<App/>);navigate('nuclei-mass');enter('Conversion','nuclei-mass');fireEvent.click(screen.getByRole('button',{name:'Clear inputs'}));
  fireEvent.click(screen.getByRole('button',{name:/Add molar mass/}));enter(/Isotope molar mass/,'131');enter('Number of radioactive nuclei','6.02214076e23');
  expect(screen.queryByLabelText('Half-life')).not.toBeInTheDocument();expect(screen.queryByRole('alert')).not.toBeInTheDocument();expect(document.querySelector('.metric-grid')).toHaveTextContent('1.31e8');
 });
 it('marks an unrepresentable nuclei count unavailable while keeping a valid mass-input activity',()=>{
  render(<App/>);navigate('nuclei-mass');enter('Conversion','mass-activity');enter('Radioisotope','custom');enter('Half-life unit','s');enter('Half-life','1e-300');
  fireEvent.click(screen.getByRole('button',{name:/Add molar mass/}));enter(/Isotope molar mass/,'1');enter('Sample mass unit','g');enter('Sample mass','1e-300');enter('Isotope mass percentage','1e-98');
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();expect(document.querySelector('.metric-grid')).toHaveTextContent('Unavailable');expect(document.querySelector('.metric.accent')).not.toHaveTextContent('0MBq');
 });
 it('ignores a hidden unused molar-mass field in an activity-only workflow',()=>{
  window.location.hash='#/activity?data='+encodeAnalysis({input:{...DEFAULT_INPUTS,isotopeId:'custom',half:'8',molar:'not-a-number',elapsed:'16'},mode:'percent',target:'25',targetUnit:'MBq'});
  render(<App/>);expect(screen.queryByRole('alert')).not.toBeInTheDocument();expect(document.querySelector('.metric.accent')).toHaveTextContent('25');
 });
 it('calculates target time independently of an invalid elapsed-time input in the separate forward calculation',()=>{
  render(<App/>);navigate('activity');enter('Elapsed time','-1');
  expect(screen.getAllByRole('alert').some(a=>a.textContent?.includes('negative'))).toBe(true);
  expect(screen.getAllByRole('button',{name:'Show Calculation Steps'})).toHaveLength(1);
  expect(screen.getByText('16.0466')).toBeInTheDocument();
 });
 it('retains translated precision disclosures and LTR numerical inputs',()=>{
  render(<App/>);enter('Radioisotope','C-14');enter('Language','ar');
  expect(document.documentElement.dir).toBe('rtl');expect(screen.getByText('التفاصيل العددية للقيم المركزية')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button',{name:'طباعة / PDF'}));const frame=document.querySelector<HTMLIFrameElement>('.report-print-frame')!;
  expect(frame.srcdoc).toContain('ليست عدم يقين');expect(frame.srcdoc).toContain('dir="ltr"');frame.remove();
 });
});
