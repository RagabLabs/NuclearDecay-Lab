import { beforeEach,describe,expect,it,vi } from 'vitest';
import { act,fireEvent,render,screen,waitFor,within } from '@testing-library/react';
import App from '../src/App';
import { getIsotope } from '../src/data/isotopes';
function navigate(path:string){act(()=>{window.location.hash=`#/${path}`;window.dispatchEvent(new HashChangeEvent('hashchange'));});}
beforeEach(()=>{window.location.hash='#/analysis';localStorage.clear();});
describe('Application workflows in the DOM',()=>{
  it('runs the complete default analysis with actual one-half-life results',()=>{
    render(<App/>);expect(screen.getByRole('heading',{name:'Complete Decay Analysis'})).toBeInTheDocument();
    expect(screen.getAllByText('50%').length).toBeGreaterThan(1);expect(screen.getAllByText('50').length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button',{name:/Analyze Now/}));expect(screen.getByRole('status')).toHaveTextContent('Remaining activity 50 MBq');
    expect(document.querySelectorAll('.recharts-line-curve').length).toBeGreaterThan(0);
  });
  it('updates activity and rendered chart when the user changes the sample',()=>{
    render(<App/>);const curve=document.querySelector('.recharts-line-curve')!.getAttribute('d');
    fireEvent.change(screen.getByLabelText('Initial activity'),{target:{value:'200'}});
    expect(screen.getAllByText('100').length).toBeGreaterThan(0);
    fireEvent.change(screen.getByLabelText('Elapsed time'),{target:{value:String(getIsotope('I-131')!.halfLifeValue*2)}});
    expect(screen.getAllByText('25%').length).toBeGreaterThan(0);
    fireEvent.change(screen.getByLabelText('Chart range'),{target:{value:'80'}});
    expect(document.querySelector('.recharts-line-curve')!.getAttribute('d')).not.toBe(curve);
  });
  it('rejects invalid sample inputs without keeping stale results',()=>{
    render(<App/>);fireEvent.change(screen.getByLabelText('Initial activity'),{target:{value:'-100'}});
    expect(screen.getByRole('alert')).toHaveTextContent('cannot be negative');expect(screen.getByRole('button',{name:/Scientific report/})).toBeDisabled();
    fireEvent.click(screen.getByRole('button',{name:'Reset sample'}));expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
  it('supports a custom half-life without requiring a molar mass',()=>{
    render(<App/>);fireEvent.change(screen.getByLabelText('Radioisotope'),{target:{value:'custom'}});fireEvent.change(screen.getByLabelText('Half-life'),{target:{value:'8'}});fireEvent.change(screen.getByLabelText('Elapsed time'),{target:{value:'16'}});
    expect(screen.getAllByText('25%').length).toBeGreaterThan(0);expect(screen.getByText('Add a molar mass for this result.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button',{name:/Add molar mass/}));fireEvent.change(screen.getByLabelText(/Isotope molar mass/),{target:{value:'131'}});
    expect(screen.queryByText('Add a molar mass for this result.')).not.toBeInTheDocument();
  });
  it('navigates all nine pages without a server-side route',()=>{
    render(<App/>);for(const [path,title] of [['home','Understand'],['activity','Activity & target time'],['half-life','Half-life & decay constant'],['nuclei-mass','Nuclei & isotope mass'],['time-analysis','Time analysis'],['comparison','Radioisotope comparison'],['documentation','Scientific documentation'],['about','About NuclearDecay Lab'],['analysis','Complete Decay Analysis']]){
      navigate(path);expect(screen.getByRole('heading',{level:1})).toHaveTextContent(title);
    }
  });
  it('changes themes and remembers the preference',()=>{
    render(<App/>);fireEvent.click(screen.getByRole('button',{name:'Switch to dark mode'}));expect(document.documentElement.dataset.theme).toBe('dark');expect(localStorage.getItem('nucleardecay-theme')).toBe('dark');fireEvent.click(screen.getByRole('button',{name:'Switch to light mode'}));expect(document.documentElement.dataset.theme).toBe('light');
  });
  it('handles an exact-zero target as asymptotic, and a target above initial as invalid',()=>{
    render(<App/>);navigate('activity');fireEvent.change(screen.getByLabelText('Target remaining percentage'),{target:{value:'0'}});expect(screen.getByText(/approaches zero asymptotically/)).toBeInTheDocument();fireEvent.click(screen.getByRole('button',{name:'Target activity'}));fireEvent.change(screen.getByLabelText('Target activity'),{target:{value:'101'}});expect(screen.getByRole('alert')).toHaveTextContent('must not exceed');
  });
  it('converts half-life to λ and λ to half-life through the actual form',()=>{
    render(<App/>);navigate('half-life');fireEvent.click(screen.getByRole('button',{name:'λ → Half-life'}));expect(screen.getByLabelText('Decay constant')).toHaveValue('0.000001');expect(screen.getAllByText('693,147').length).toBeGreaterThan(0);fireEvent.change(screen.getByLabelText('Decay constant'),{target:{value:'0'}});expect(screen.getAllByRole('alert')[0]).toHaveTextContent('greater than zero');
  });
  it('calculates from mass and from nuclei, including an invalid mass fraction',()=>{
    render(<App/>);navigate('nuclei-mass');fireEvent.change(screen.getByLabelText('Conversion'),{target:{value:'mass-activity'}});expect(screen.getByLabelText('Sample mass')).toHaveValue('1');fireEvent.change(screen.getByLabelText('Isotope mass percentage'),{target:{value:'0'}});expect(screen.getByRole('alert')).toHaveTextContent('greater than zero');fireEvent.change(screen.getByLabelText('Conversion'),{target:{value:'nuclei-activity'}});expect(screen.getByLabelText('Number of radioactive nuclei')).toHaveValue('1e12');expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
  it('creates a multi-time table and validates each entered time',()=>{
    render(<App/>);navigate('time-analysis');fireEvent.change(screen.getByLabelText('Time points (d)'),{target:{value:'0, 8.0233, 16.0466'}});const table=screen.getByRole('table');expect(within(table).getByText('25%')).toBeInTheDocument();expect(within(table).getByText('50%')).toBeInTheDocument();fireEvent.change(screen.getByLabelText('Time points (d)'),{target:{value:'0, -1'}});expect(screen.getByRole('alert')).toHaveTextContent('cannot be negative');expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
  it('compares multiple isotopes, allows per-isotope activity, and requires two',async()=>{
    render(<App/>);navigate('comparison');await waitFor(()=>expect(document.querySelectorAll('.recharts-line-curve')).toHaveLength(3));fireEvent.click(screen.getByLabelText('Use the same initial activity'));fireEvent.change(screen.getByLabelText('Tc-99m initial activity'),{target:{value:'200'}});const table=screen.getByRole('table');expect(within(table).getByText('200')).toBeInTheDocument();fireEvent.click(screen.getByLabelText(/Iodine-131/));fireEvent.click(screen.getByLabelText(/Fluorine-18/));expect(screen.getByRole('alert')).toHaveTextContent('at least two');
  });
  it('switches to logarithmic plotting using the actual calculation',()=>{
    render(<App/>);const before=document.querySelector('.recharts-line-curve')!.getAttribute('d');fireEvent.click(screen.getByRole('button',{name:'Log'}));expect(screen.getByText(/vertical coordinate is log₁₀/)).toBeInTheDocument();expect(document.querySelector('.recharts-line-curve')!.getAttribute('d')).not.toBe(before);
  });
  it('exports a scientific report and the time table through real download buttons',()=>{
    const click=vi.spyOn(HTMLAnchorElement.prototype,'click').mockImplementation(()=>{});render(<App/>);fireEvent.click(screen.getByRole('button',{name:'Scientific report'}));fireEvent.click(screen.getByRole('button',{name:'Export CSV'}));expect(click).toHaveBeenCalledTimes(2);click.mockRestore();
  });
  it('shows a clear PNG error if the browser lacks Canvas support',async()=>{
    const saved=globalThis.Image;
    class TestImage {onload:(()=>void)|null=null;onerror:(()=>void)|null=null;set src(_v:string){queueMicrotask(()=>this.onload?.());}}
    globalThis.Image=TestImage as unknown as typeof Image;
    const mock=vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue(null);
    render(<App/>);fireEvent.click(screen.getByRole('button',{name:'Download chart as PNG'}));await waitFor(()=>expect(screen.getByRole('alert')).toHaveTextContent('Canvas support'));
    globalThis.Image=saved;mock.mockRestore();
  });
  it('documentation jumps stay on the documentation route',()=>{
    render(<App/>);navigate('documentation');fireEvent.click(screen.getByRole('link',{name:'Reference data'}));expect(window.location.hash).toBe('#/documentation');
  });
  it('keeps an available mass result when an extreme nuclei count overflows',()=>{
    render(<App/>);navigate('nuclei-mass');fireEvent.change(screen.getByLabelText('Initial activity'),{target:{value:'1e300'}});
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();expect(screen.getByText('Isotope mass')).toBeInTheDocument();expect(screen.getAllByText('Unavailable').length).toBeGreaterThan(0);expect(screen.getByText(/Number of nuclei exceeds/)).toBeInTheDocument();
  });
});
