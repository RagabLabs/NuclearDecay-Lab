import { Localized, I18nProvider, useI18n } from './i18n';
import { Component, useEffect, useState, type ReactNode } from 'react';
import { Atom, Activity, ChartNoAxesCombined, Home as HomeIcon, FlaskConical, Timer, Scale, GitCompareArrows, BookOpen, Info, Moon, Sun, Menu, X, ArrowUpRight, ChevronRight,RotateCcw } from 'lucide-react';
import { CompleteAnalysis } from './pages/CompleteAnalysis';
import { ActivityCalculator } from './pages/ActivityCalculator';
import { HalfLifeCalculator } from './pages/HalfLifeCalculator';
import { NucleiMassCalculator } from './pages/NucleiMassCalculator';
import { TimeAnalysis } from './pages/TimeAnalysis';
import { IsotopeComparison } from './pages/IsotopeComparison';
import { Documentation, About } from './pages/Documentation';
import { Home } from './pages/Home';
import { InverseCalculator } from './pages/InverseCalculator';
import { IsotopeLibrary } from './pages/IsotopeLibrary';
import { LearnDecay } from './pages/LearnDecay';
import { clearAnalyses } from './utils/session';
const NAV = [
    { path: 'home', title: 'Home', icon: HomeIcon },
    { path: 'analysis', title: 'Complete Analysis', icon: FlaskConical },
    { path: 'activity', title: 'Activity & Target Time', icon: Activity },
    { path: 'half-life', title: 'Half-life Calculator', icon: Timer },
    { path: 'nuclei-mass', title: 'Nuclei & Mass', icon: Scale },
    { path: 'time-analysis', title: 'Time Analysis', icon: ChartNoAxesCombined },
    { path: 'comparison', title: 'Isotope Comparison', icon: GitCompareArrows },
    { path:'inverse',title:'Inverse Calculator',icon:FlaskConical },
    { path:'library',title:'Isotope Library',icon:Atom },
    { path:'learn',title:'Learn Nuclear Decay',icon:BookOpen },
    { path: 'documentation', title: 'Scientific Documentation', icon: BookOpen },
    { path: 'about', title: 'About', icon: Info },
];
function route() { const r = window.location.hash.split('?')[0].replace(/^#\/?/, ''); return NAV.some(n => n.path === r) ? r : 'analysis'; }
class PageBoundary extends Component<{
    children: ReactNode;
}, {
    error: string | null;
}> {
    state = { error: null as string | null };
    static getDerivedStateFromError(error: Error) { return { error: error.message }; }
    render() { return <Localized>{this.state.error ? <div className="panel"><h1>Calculation cannot be displayed</h1><div className="notice error" role="alert">{this.state.error}</div><p>Check the units and numerical range, or reset this page to its reference example.</p><button className="button primary" onClick={() => this.setState({ error: null })}>Reset page</button></div> : this.props.children}</Localized>; }
}
export default function App(){return <I18nProvider><AppShell/></I18nProvider>;}
function AppShell() {
    const {language,setLanguage,t}=useI18n();
    const [revision,setRevision]=useState(0);
    const [location,setLocation]=useState(window.location.hash);
    const [resetError,setResetError]=useState<string|null>(null);
    const [page, setPage] = useState(route);
    const [mobile, setMobile] = useState(false);
    const [dark, setDark] = useState(() => { try {
        const saved = localStorage.getItem('nucleardecay-theme');
        return saved ? saved === 'dark' : window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
    }
    catch {
        return false;
    } });
    useEffect(() => { const update = () => { setLocation(window.location.hash);const r = route(); if (r !== page) {
        setPage(r);
        setMobile(false);
        window.scrollTo?.({ top: 0 });
    } }; window.addEventListener('hashchange', update); return () => window.removeEventListener('hashchange', update); }, [page]);
    useEffect(() => { document.documentElement.dataset.theme = dark ? 'dark' : 'light'; try {
        localStorage.setItem('nucleardecay-theme', dark ? 'dark' : 'light');
    }
    catch { /* Storage can be disabled; theme still works for this session. */ } }, [dark]);
    useEffect(() => { const close = (e: KeyboardEvent) => { if (e.key === 'Escape')
        setMobile(false); }; window.addEventListener('keydown', close); return () => window.removeEventListener('keydown', close); }, []);
    useEffect(() => { document.title = `${t(NAV.find(n => n.path === page)?.title??'Complete Analysis')} · NuclearDecay Lab`; }, [page,language]);
    const pages: Record<string, ReactNode> = { home: <Home />, analysis: <CompleteAnalysis />, activity: <ActivityCalculator />, 'half-life': <HalfLifeCalculator />, 'nuclei-mass': <NucleiMassCalculator />, 'time-analysis': <TimeAnalysis />, comparison: <IsotopeComparison />, inverse:<InverseCalculator/>,library:<IsotopeLibrary/>,learn:<LearnDecay/>, documentation: <Documentation />, about: <About /> };
    return <Localized>{<div className="app-shell"><a className="skip-link" href="#main-content" onClick={e => { e.preventDefault(); document.getElementById('main-content')?.focus(); }}>Skip to content</a>
    {mobile && <button className="nav-overlay" onClick={() => setMobile(false)} aria-label="Close navigation"/>}
    <aside id="app-navigation" className={`sidebar ${mobile ? 'open' : ''}`}><a className="brand" href="#/home"><span className="brand-mark"><Atom size={26}/></span><span>NuclearDecay<strong>Lab<span className="brand-dot">.</span></strong></span></a>
      <div className="workspace-label">SCIENTIFIC WORKSPACE</div><nav aria-label="Main navigation">{NAV.slice(0, 8).map(({ path, title, icon: Icon }) => <a key={path} href={`#/${path}`} className={`nav-item ${page === path ? 'active' : ''}`} aria-current={page === path ? 'page' : undefined}><Icon size={18}/><span>{title}</span>{page === path && <ChevronRight size={14}/>}</a>)}<div className="nav-separator"/><div className="workspace-label">REFERENCE & RESOURCES</div>{NAV.slice(8).map(({ path, title, icon: Icon }) => <a key={path} href={`#/${path}`} className={`nav-item ${page === path ? 'active' : ''}`} aria-current={page === path ? 'page' : undefined}><Icon size={17}/><span>{title}</span></a>)}</nav>
      <div className="sidebar-bottom"><div className="sidebar-note"><span className="status-dot"/><strong>Physics. In your browser.</strong><p>Fast calculations.<br />Traceable reference data.</p><a href="#/documentation">Understand the model <ArrowUpRight size={14}/></a></div><div className="sidebar-version"><span>OPEN SOURCE · MIT</span><span>v2.1.0</span></div></div>
    </aside><div className="app-main"><div className="topbar"><div className="topbar-left"><button className="icon-button mobile-menu" onClick={() => setMobile(!mobile)} aria-label={mobile ? 'Close menu' : 'Open menu'} aria-expanded={mobile} aria-controls="app-navigation">{mobile ? <X size={20}/> : <Menu size={20}/>}</button><span>Nuclear physics</span><ChevronRight size={13}/><strong>{NAV.find(n => n.path === page)?.title}</strong></div><div className="topbar-right"><label className="language-picker"><span className="sr-only">Language</span><select aria-label="Language" value={language} onChange={e=>setLanguage(e.target.value as typeof language)}><option value="en">English</option><option value="ar">العربية</option></select></label><button className="icon-button" aria-label="Clear all data" title="Clear all data" onClick={()=>{try{clearAnalyses();setLanguage('en');setDark(false);setRevision(v=>v+1);setResetError(null);}catch(e){setResetError((e as Error).message);}}}><RotateCcw size={16}/></button><span className="local-pill"><span className="status-dot"/> Computed locally</span><button className="icon-button theme-toggle" aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'} onClick={() => setDark(!dark)}>{dark ? <Sun size={18}/> : <Moon size={18}/>}</button></div></div>
      <main id="main-content" tabIndex={-1}>{resetError&&<div className="notice error" role="alert">{resetError}</div>}<PageBoundary key={location+revision}>{pages[page]}</PageBoundary></main><footer className="app-footer"><span>© 2026 NuclearDecay Lab · MIT License</span><span>Single-nuclide model <i /> SI-based calculations <i /> No backend</span><a href="#/documentation">Methods & references <ArrowUpRight size={12}/></a></footer>
    </div></div>}</Localized>;
}
