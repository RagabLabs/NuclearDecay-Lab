import { useMemo,useState } from 'react';
import { Localized,useI18n } from '../i18n';
import { completeAnalysis } from '../science/decay';
import { PageHeading,Panel,Metric,Field,ErrorBox,Equation } from '../components/ui';
import { DecayChart } from '../components/DecayChart';
import { CalculationTools } from '../components/CalculationTools';
import { decayRecord } from '../science/records';
import { DEFAULT_INPUTS } from '../components/IsotopeInputs';
import { parseNumber } from '../science/units';
import { fmt,errorMessage } from '../utils/format';
export function LearnDecay(){
 const {language}=useI18n();const [half,setHalf]=useState('10');const [activity,setActivity]=useState('100');const [multiples,setMultiples]=useState(2);
 const value=useMemo(()=>{try{const h=parseNumber(half,'Half-life'),a=parseNumber(activity,'Initial activity');return {r:completeAnalysis(a,h,h*multiples),h,a,error:null};}catch(e){return {r:null,h:1,a:1,error:errorMessage(e)};}},[half,activity,multiples]);
 const lessons=[
  ['Activity','النشاط الإشعاعي','Activity counts decays per second. 1 Bq means an expected rate of one decay each second.','النشاط هو معدل التحلل في الثانية؛ 1 Bq تعني معدلًا متوقعًا قدره تحلل واحد في الثانية.'],
  ['Half-life','نصف العمر','The time for the expected parent-nucleus count and activity to fall to half their initial values.','الزمن اللازم لانخفاض العدد المتوقع لأنوية النظير الأب ونشاطه إلى نصف القيمة الابتدائية.'],
  ['Decay constant','ثابت التحلل','λ is the probability rate per nucleus. A larger λ means a shorter half-life. Its SI unit is s⁻¹.','يمثل λ معدل احتمال التحلل لكل نواة؛ كلما زاد قصر نصف العمر. وحدته في SI هي s⁻¹.'],
  ['Activity vs nuclei','النشاط وعدد الأنوية','N is an expected nucleus count. A = λN is a decay rate. Equal activity does not imply equal counts for different isotopes.','N عدد أنوية متوقع، بينما A = λN معدل تحلل. تساوي النشاط لا يعني تساوي عدد الأنوية لنظائر مختلفة.'],
  ['Why exponential?','لماذا التحلل أسي؟','Each nucleus has a constant decay probability per unit time. The expected loss rate is proportional to the number still present.','لكل نواة احتمال تحلل ثابت في وحدة الزمن، لذلك يتناسب معدل الفقد المتوقع مع عدد الأنوية التي ما زالت موجودة.'],
  ['Reading the curve','قراءة المنحنى','The linear plot curves downward. On a logarithmic activity axis, a single exponential is a straight line. Half-life markers divide successive halvings.','المنحنى الخطي يهبط تدريجيًا. وعلى محور نشاط لوغاريتمي يكون التحلل الأسي خطًا مستقيمًا؛ تحدد علامات نصف العمر الانخفاضات المتتالية إلى النصف.'],
 ];
 return <Localized><PageHeading title="Learn Nuclear Decay" description={language==='ar'?'ست أفكار أساسية ومثال حي يربط المعادلة بالنتيجة.':'Six core ideas and a live example connecting the equation to the result.'}/><div className="learn-grid">{lessons.map(([en,ar,e,a],i)=><Panel key={en} title={language==='ar'?ar:en}><span className="lesson-number">0{i+1}</span><p>{language==='ar'?a:e}</p></Panel>)}</div><div className="analysis-layout"><Panel title={language==='ar'?'جرّب بنفسك':'Try it yourself'}><Field label="Half-life" value={half} onChange={setHalf} unit="s"/><Field label="Initial activity" value={activity} onChange={setActivity} unit="Bq"/><label className="learn-slider" htmlFor="learn-multiples">{language==='ar'?'أنصاف الأعمار المنقضية':'Elapsed half-lives'}: <span className="numeric">{multiples}</span><input id="learn-multiples" type="range" min="0" max="8" step=".25" value={multiples} onChange={e=>setMultiples(Number(e.target.value))}/></label><ErrorBox message={value.error}/><Equation>A(t)/A₀ = 2<sup>−t/T½</sup></Equation>{value.r&&<><Metric label="Remaining activity" value={fmt(value.r.remainingActivityBq)} unit="Bq" accent/><Metric label="Radioactive nuclei" value={fmt(value.r.nuclei)} /></>}</Panel><div>{value.r&&<Panel className="chart-panel"><DecayChart series={[{id:'learn',label:'Custom isotope',initialBq:value.a,halfSeconds:value.h}]} timeUnit="s" activityUnit="Bq" initialEnd={value.h*8} markerSeconds={value.h*multiples}/></Panel>}<CalculationTools record={value.r?decayRecord({...DEFAULT_INPUTS,isotopeId:'custom',half,halfUnit:'s',activity,activityUnit:'Bq',elapsed:String(value.h*multiples),timeUnit:'s',molar:''}):null}/></div></div></Localized>;
}
