import { ScientificError, finite, nonnegative, positive } from './units';

import { AVOGADRO, LN2, MIN_NORMAL } from './constants';
export { AVOGADRO, LN2 } from './constants';
const LOG_MAX = Math.log(Number.MAX_VALUE);

export function represent(logValue: number, quantity: string, allowUnderflow = false): number {
  if (logValue > LOG_MAX || Number.isNaN(logValue)) throw new ScientificError(`${quantity} exceeds the browser's numerical range.`);
  const value = Math.exp(logValue);
  if (!Number.isFinite(value)) throw new ScientificError(`${quantity} exceeds the browser's numerical range.`);
  if (value === 0 && !allowUnderflow) throw new ScientificError(`${quantity} is below the browser's numerical range.`);
  return value;
}
export function decayConstant(halfLifeSeconds: number): number {
  positive(halfLifeSeconds, 'Half-life');
  const value = LN2 / halfLifeSeconds;
  if (!Number.isFinite(value) || value === 0) throw new ScientificError('Decay constant exceeds the floating-point range for this half-life.');
  return value;
}
export function halfLife(lambdaPerSecond: number): number {
  positive(lambdaPerSecond, 'Decay constant');
  const value = LN2 / lambdaPerSecond;
  if (!Number.isFinite(value) || value === 0) throw new ScientificError('Half-life exceeds the floating-point range for this decay constant.');
  return value;
}
export interface DecayResult {
  initialActivityBq: number;
  halfLifeSeconds: number;
  elapsedSeconds: number;
  lambdaPerSecond: number;
  remainingActivityBq: number;
  decayedActivityBq: number;
  remainingFraction: number;
  decayedFraction: number;
  remainingPercent: number;
  decayedPercent: number;
  halfLivesElapsed: number;
  decayExponent: number;
  logRemainingActivity: number | null;
  logDecayedActivity: number | null;
  underflow: boolean;
  warnings: string[];
}
export function activityDecay(initialActivityBq: number, halfLifeSeconds: number, elapsedSeconds: number): DecayResult {
  nonnegative(initialActivityBq, 'Initial activity');
  nonnegative(elapsedSeconds, 'Elapsed time');
  const lambdaPerSecond = decayConstant(halfLifeSeconds);
  const halfLivesElapsed = elapsedSeconds / halfLifeSeconds;
  const exponent = Number.isFinite(halfLivesElapsed) ? halfLivesElapsed * LN2 :
    Math.exp(Math.log(elapsedSeconds) - Math.log(halfLifeSeconds) + Math.log(LN2));
  const remainingFraction = Math.exp(-exponent);
  const decayedFraction = -Math.expm1(-exponent);
  const logLossFraction = elapsedSeconds===0 ? null : exponent < MIN_NORMAL ?
    Math.log(LN2)+Math.log(elapsedSeconds)-Math.log(halfLifeSeconds) : Math.log(decayedFraction);
  // Scaling a quantized/zero subnormal fraction loses information that its logarithm retains.
  const remainingPercent=remainingFraction>=MIN_NORMAL?remainingFraction*100:Math.exp(Math.log(100)-exponent);
  const decayedPercent=logLossFraction===null?0:decayedFraction>=MIN_NORMAL?decayedFraction*100:Math.exp(Math.log(100)+logLossFraction);
  const logRemainingActivity = initialActivityBq === 0 ? null : Math.log(initialActivityBq) - exponent;
  const logDecayedActivity=initialActivityBq===0||logLossFraction===null?null:Math.log(initialActivityBq)+logLossFraction;
  // If the fraction underflows, the product can still be representable for large A₀.
  const remainingActivityBq = elapsedSeconds === 0 ? initialActivityBq :
    initialActivityBq === 0 ? 0 : remainingFraction >= MIN_NORMAL ? initialActivityBq * remainingFraction :
      represent(logRemainingActivity!, 'Remaining activity', true);
  let decayedActivityBq = initialActivityBq * decayedFraction;
  if (elapsedSeconds > 0 && initialActivityBq > 0 && (exponent < MIN_NORMAL || (decayedActivityBq === 0 && exponent < 1e-8))) {
    decayedActivityBq = represent(logDecayedActivity!, 'Decayed activity', true);
  }
  const underflow = initialActivityBq > 0 && remainingActivityBq === 0;
  const warnings: string[] = [];
  if (underflow) warnings.push('Remaining activity is below floating-point range; displayed 0 is a numerical limit, not exact physical zero.');
  if (remainingPercent === 0) warnings.push('Remaining percentage is below floating-point range; displayed 0% is not exact physical zero.');
  if (initialActivityBq > 0 && elapsedSeconds > 0 && decayedActivityBq === 0) warnings.push('Activity lost is below floating-point range; displayed 0 does not imply zero physical decay.');
  if (elapsedSeconds > 0 && remainingFraction === 1) warnings.push('The remaining fraction rounds to 1 at double precision. The loss is calculated separately using a stable formula.');
  if ((remainingFraction > 0 && remainingFraction < MIN_NORMAL) || (decayedFraction > 0 && decayedFraction < MIN_NORMAL)) warnings.push('A fraction is subnormal and has limited relative precision. Activity and percentages are evaluated separately in log space.');
  if ((remainingActivityBq>0&&remainingActivityBq<MIN_NORMAL)||(decayedActivityBq>0&&decayedActivityBq<MIN_NORMAL)) warnings.push('An activity is subnormal; its relative precision is limited by the binary64 spacing.');
  if (!Number.isFinite(halfLivesElapsed)) warnings.push('The number of elapsed half-lives exceeds the representable numerical range.');
  return { initialActivityBq, halfLifeSeconds, elapsedSeconds, lambdaPerSecond, remainingActivityBq, decayedActivityBq,
    remainingFraction, decayedFraction, remainingPercent, decayedPercent, halfLivesElapsed, decayExponent:exponent, logRemainingActivity, logDecayedActivity, underflow, warnings };
}
/** Stable ln(initial/final) without an overflow-prone ratio or cancellation near equality. */
export function logActivityRatio(initial:number,final:number):number {
  positive(initial,'Initial activity');positive(final,'Final activity');
  const loss=(initial-final)/initial;
  return Math.abs(loss)<0.5?-Math.log1p(-loss):Math.log(initial)-Math.log(final);
}
export type TargetResult = { kind: 'finite'; seconds: number } | { kind: 'infinite'; explanation: string };
export function timeToTarget(initialActivityBq: number, targetActivityBq: number, halfLifeSeconds: number): TargetResult {
  positive(initialActivityBq, 'Initial activity');
  nonnegative(targetActivityBq, 'Target activity');
  decayConstant(halfLifeSeconds);
  if (targetActivityBq > initialActivityBq) throw new ScientificError('Target activity must not exceed initial activity in a future-decay model.');
  if (targetActivityBq === 0) return { kind: 'infinite', explanation: 'An exponential decay approaches zero asymptotically. It never reaches exact zero in finite time.' };
  if (targetActivityBq === initialActivityBq) return { kind: 'finite', seconds: 0 };
  const logRatio = logActivityRatio(initialActivityBq,targetActivityBq);
  return { kind: 'finite', seconds: represent(Math.log(logRatio) + Math.log(halfLifeSeconds) - Math.log(LN2), 'Target time') };
}
export function timeToPercentage(percent: number, halfLifeSeconds: number): TargetResult {
  finite(percent, 'Target percentage');
  if (percent < 0 || percent > 100) throw new ScientificError('Target percentage must be between 0 and 100.');
  return timeToTarget(100, percent, halfLifeSeconds);
}
export function nucleiFromActivity(activityBq: number, lambdaPerSecond: number): number {
  nonnegative(activityBq, 'Activity'); positive(lambdaPerSecond, 'Decay constant');
  if (activityBq === 0) return 0;
  const direct = activityBq / lambdaPerSecond;
  return Number.isFinite(direct) && direct > 0 ? direct : represent(Math.log(activityBq) - Math.log(lambdaPerSecond), 'Number of nuclei');
}
export function activityFromNuclei(nuclei: number, lambdaPerSecond: number): number {
  nonnegative(nuclei, 'Number of nuclei'); positive(lambdaPerSecond, 'Decay constant');
  if (nuclei === 0) return 0;
  const direct = nuclei * lambdaPerSecond;
  return Number.isFinite(direct) && direct > 0 ? direct : represent(Math.log(nuclei) + Math.log(lambdaPerSecond), 'Activity');
}
export function massFromNuclei(nuclei: number, molarMassGPerMol: number, isotopeMassFraction=1): number {
  nonnegative(nuclei, 'Number of nuclei'); positive(molarMassGPerMol, 'Molar mass');
  validateMassFraction(isotopeMassFraction);
  if (nuclei === 0) return 0;
  return represent(Math.log(nuclei) - Math.log(AVOGADRO) + Math.log(molarMassGPerMol)-Math.log(isotopeMassFraction), isotopeMassFraction===1?'Radioisotope mass':'Sample mass');
}
export function nucleiFromMass(isotopeMassG: number, molarMassGPerMol: number): number {
  nonnegative(isotopeMassG, 'Isotope mass'); positive(molarMassGPerMol, 'Molar mass');
  if (isotopeMassG === 0) return 0;
  return represent(Math.log(isotopeMassG) + Math.log(AVOGADRO) - Math.log(molarMassGPerMol), 'Number of nuclei');
}
export function validateMassFraction(fraction: number): number {
  positive(fraction, 'Isotope mass fraction');
  if (fraction > 1) throw new ScientificError('Isotope mass fraction must not exceed 100%. It is a mass fraction, not an atom fraction.');
  return fraction;
}
export function massFromActivity(activityBq: number, halfLifeSeconds: number, molarMassGPerMol: number, isotopeMassFraction = 1): number {
  nonnegative(activityBq, 'Activity'); positive(molarMassGPerMol, 'Molar mass'); validateMassFraction(isotopeMassFraction);
  const lambda = decayConstant(halfLifeSeconds);
  if (activityBq === 0) return 0;
  // One log expression avoids overflow in the intermediate nuclei count.
  return represent(Math.log(activityBq) - Math.log(lambda) - Math.log(AVOGADRO) + Math.log(molarMassGPerMol) - Math.log(isotopeMassFraction), 'Sample mass');
}
export function activityFromMass(sampleMassG: number, halfLifeSeconds: number, molarMassGPerMol: number, isotopeMassFraction = 1): number {
  nonnegative(sampleMassG, 'Sample mass'); positive(molarMassGPerMol, 'Molar mass'); validateMassFraction(isotopeMassFraction);
  const lambda = decayConstant(halfLifeSeconds);
  if (sampleMassG === 0) return 0;
  return represent(Math.log(sampleMassG) + Math.log(isotopeMassFraction) + Math.log(AVOGADRO) - Math.log(molarMassGPerMol) + Math.log(lambda), 'Activity');
}
export interface CompleteResult extends DecayResult {
  nuclei: number | null;
  isotopeMassG: number | null;
  molarMassGPerMol: number | null;
  unavailable: string[];
}
export function completeAnalysis(initialActivityBq: number, halfLifeSeconds: number, elapsedSeconds: number, molarMassGPerMol?: number): CompleteResult {
  const result = activityDecay(initialActivityBq, halfLifeSeconds, elapsedSeconds);
  if (molarMassGPerMol !== undefined) positive(molarMassGPerMol, 'Molar mass');
  const unavailable: string[] = [];
  let nuclei: number | null = null;
  let isotopeMassG: number | null = null;
  const logA = result.logRemainingActivity;
  // Derive from logarithms even when A itself underflows.
  try { nuclei = logA === null ? 0 : represent(logA - Math.log(result.lambdaPerSecond), 'Number of nuclei'); }
  catch (error) { unavailable.push((error as Error).message); }
  if (molarMassGPerMol !== undefined) {
    try { isotopeMassG = logA === null ? 0 : represent(logA - Math.log(result.lambdaPerSecond) - Math.log(AVOGADRO) + Math.log(molarMassGPerMol), 'Radioisotope mass'); }
    catch (error) { unavailable.push((error as Error).message); }
  }
  if (nuclei !== null && nuclei > 0 && nuclei < 1) result.warnings.push('N < 1 is an expected ensemble value in the continuum model; an individual sample has an integer, stochastic nucleus count.');
  return { ...result, nuclei, isotopeMassG, molarMassGPerMol: molarMassGPerMol ?? null, unavailable };
}
export interface TimePoint extends DecayResult { time: number }
export function analyzeTimes(initialBq: number, halfSeconds: number, times: number[], secondsPerTimeUnit = 1): TimePoint[] {
  if (!times.length || times.length > 1000) throw new ScientificError('Supply between 1 and 1,000 time points.');
  positive(secondsPerTimeUnit, 'Time-unit factor');
  return times.map(time => {
    nonnegative(time, 'Time');
    const seconds = time * secondsPerTimeUnit;
    finite(seconds, 'Converted time');
    if (time > 0 && seconds === 0) throw new ScientificError('Converted time is below floating-point range.');
    return { ...activityDecay(initialBq, halfSeconds, seconds), time };
  });
}
export function sampleCurve(initialBq: number, halfSeconds: number, endTime: number, secondsPerUnit: number, count = 180): TimePoint[] {
  positive(endTime, 'Chart range');
  if (!Number.isInteger(count) || count < 2 || count > 999) throw new ScientificError('Chart interval count must be between 2 and 999 (at most 1,000 points).');
  return analyzeTimes(initialBq, halfSeconds, Array.from({length: count + 1}, (_, i) => (i / count) * endTime), secondsPerUnit);
}
