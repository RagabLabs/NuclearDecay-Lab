import { Localized } from '../i18n';
import { Download } from 'lucide-react';
import type { TimePoint } from '../science/decay';
import { type ActivityUnit, type TimeUnit } from '../science/units';
import { fmt, modelPercentText,modelActivityText,modelText } from '../utils/format';
import { downloadCsv, timeAnalysisCsv } from '../utils/export';
import { Panel } from './ui';
import type {Isotope} from '../data/isotopes';
export function TimeTable({ rows, timeUnit, activityUnit, title = 'Activity at multiple times', isotope }: {
    rows: TimePoint[];
    timeUnit: TimeUnit;
    activityUnit: ActivityUnit;
    title?: string;
    isotope?: Isotope;
}) {
    return <Localized>{<Panel title={title} subtitle={`${rows.length} calculated time points · full precision in CSV`} actions={<button className="button secondary small" onClick={() => downloadCsv(timeAnalysisCsv(rows,timeUnit,activityUnit,isotope))}><Download size={14}/> Export CSV</button>}>
    <div className="table-scroll"><table><thead><tr><th>Elapsed time ({timeUnit})</th><th>Activity ({activityUnit})</th><th>Remaining</th><th>Half-lives</th></tr></thead><tbody>
      {rows.map((r, i) => <tr key={i}><td className="numeric">{fmt(r.time)}</td><td className="numeric">{modelActivityText(r,activityUnit,isotope)}</td><td><div className="table-percent"><span>{modelPercentText(r,isotope)}</span><div className="mini-bar"><i style={{ width: `${r.remainingPercent}%` }}/></div></div></td><td className="numeric">{modelText(r.halfLivesElapsed,r,isotope,'halfLives')}</td></tr>)}
    </tbody></table></div>
  </Panel>}</Localized>;
}
