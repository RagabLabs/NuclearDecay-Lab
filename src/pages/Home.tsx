import { Localized } from '../i18n';
import { ArrowRight, Activity, Atom, Timer, Scale, ChartNoAxesCombined, GitCompareArrows, ShieldCheck, Lock, BookOpen } from 'lucide-react';
import { activityDecay } from '../science/decay';
import { getIsotope } from '../data/isotopes';
import { fmt } from '../utils/format';
const tools = [
    { icon: Activity, title: 'Activity decay', text: 'Remaining activity, decay fraction and elapsed half-lives.', path: 'activity', number: '01' },
    { icon: Timer, title: 'Time to a target', text: 'Find the time to a chosen activity or remaining percentage.', path: 'activity', number: '02' },
    { icon: Timer, title: 'Half-life & constant', text: 'Convert between half-life and the decay constant.', path: 'half-life', number: '03' },
    { icon: Atom, title: 'Radioactive nuclei', text: 'Translate activity into the expected parent-nucleus count.', path: 'nuclei-mass', number: '04' },
    { icon: Scale, title: 'Isotope mass', text: 'Move between activity, atoms and mass with explicit composition.', path: 'nuclei-mass', number: '05' },
    { icon: ChartNoAxesCombined, title: 'Multi-time analysis', text: 'Calculate a time series and export full-precision CSV data.', path: 'time-analysis', number: '06' },
    { icon: ChartNoAxesCombined, title: 'Interactive curves', text: 'Explore true decay curves on linear and logarithmic axes.', path: 'time-analysis', number: '07' },
    { icon: GitCompareArrows, title: 'Isotope comparison', text: 'Compare reference nuclides on one physical timeline.', path: 'comparison', number: '08' },
];
export function Home() {
    const iodine = getIsotope('I-131')!;
    const points = Array.from({ length: 90 }, (_, i) => { const r = activityDecay(100, iodine.halfLifeSeconds, i / 89 * iodine.halfLifeSeconds * 5); return `${40 + i / 89 * 420},${180 - r.remainingFraction * 140}`; }).join(' ');
    return <Localized>{<><section className="hero"><div className="hero-copy"><span className="hero-tag"><span className="status-dot"/> A BROWSER-LOCAL SCIENTIFIC TOOLKIT</span><h1>Understand<br />what <em>remains.</em></h1><p>Radioactive decay, made clear. Go from one sample to a complete scientific analysis—with transparent equations and traceable data.</p><a className="button primary" href="#/analysis">Analyze a sample <ArrowRight size={17}/></a><a className="hero-docs" href="#/documentation">Explore the science <ArrowRight size={14}/></a><div className="hero-trust"><span><ShieldCheck size={15}/> Evaluated references</span><span><Lock size={14}/> No data leaves your browser</span></div></div>
    <div className="hero-science"><div className="hero-science-top"><span>LIVE MODEL PREVIEW</span><span className="badge">¹³¹I</span></div><div className="hero-equation">A(t) = A₀ e<sup>−λt</sup></div><svg viewBox="0 0 500 230" role="img" aria-label="Iodine-131 activity decreases exponentially from 100 to 3.125 across five half-lives"><defs><linearGradient id="hero-line" x1="0" x2="1"><stop stopColor="#66d8c3"/><stop offset="1" stopColor="#299e97"/></linearGradient></defs>{[40, 75, 110, 145, 180].map(y => <line key={y} x1="40" x2="460" y1={y} y2={y} stroke="#ffffff15"/>)}{[1, 2, 3, 4, 5].map(n => <g key={n}><line x1={40 + n * 84} x2={40 + n * 84} y1="32" y2="180" stroke="#ffffff20" strokeDasharray="3 5"/><text x={40 + n * 84} y="205" fill="#9fb7bd" fontSize="11" textAnchor="middle">{n}T½</text></g>)}<polyline points={points} stroke="url(#hero-line)" strokeWidth="3" fill="none"/><circle cx="124" cy="110" r="5" fill="#66d8c3"/><text x="40" y="25" fill="#9fb7bd" fontSize="11">Activity / arbitrary units</text></svg><div className="hero-example"><div><small>REFERENCE HALF-LIFE</small><strong>{fmt(iodine.halfLifeValue)} <span>days</span></strong></div><div><small>AFTER ONE HALF-LIFE</small><strong>50<span>% remains</span></strong></div></div></div></section>
    <div className="section-label"><div><span className="eyebrow">EIGHT CONNECTED TOOLS</span><h2>A smaller path to the answer.</h2></div><a className="text-link" href="#/analysis">Run a complete analysis <ArrowRight size={14}/></a></div>
    <div className="tools-grid">{tools.map(({ icon: Icon, title, text, path, number }) => <a key={number} href={`#/${path}`} className="tool-card"><div className="tool-card-top"><Icon size={22}/><span>{number}</span></div><h3>{title}</h3><p>{text}</p><ArrowRight className="tool-arrow" size={17}/></a>)}</div>
    <div className="home-foot"><BookOpen size={22}/><div><h3>Transparent by design.</h3><p>See every equation, reference value and physical assumption. No accounts, APIs or opaque predictions.</p></div><a className="button secondary" href="#/documentation">Scientific documentation <ArrowRight size={15}/></a></div>
  </>}</Localized>;
}
