/** SI is the internal calculation system. A year is exactly one Julian year. */
import {SECONDS_PER_MINUTE,SECONDS_PER_HOUR,SECONDS_PER_DAY,JULIAN_YEAR_SECONDS,BQ_PER_CURIE} from './constants';
export const TIME_UNITS = {
  fs: { label: 'femtoseconds', factor: 1e-15 },
  ps: { label: 'picoseconds', factor: 1e-12 },
  ns: { label: 'nanoseconds', factor: 1e-9 },
  'µs': { label: 'microseconds', factor: 1e-6 },
  ms: { label: 'milliseconds', factor: 1e-3 },
  s: { label: 'seconds', factor: 1 },
  min: { label: 'minutes', factor: SECONDS_PER_MINUTE },
  h: { label: 'hours', factor: SECONDS_PER_HOUR },
  d: { label: 'days', factor: SECONDS_PER_DAY },
  y: { label: 'Julian years', factor: JULIAN_YEAR_SECONDS },
} as const;
export const ACTIVITY_UNITS = {
  'µBq': 1e-6, mBq: 1e-3, Bq: 1, kBq: 1e3, MBq: 1e6, GBq: 1e9, TBq: 1e12,
  nCi: BQ_PER_CURIE*1e-9, 'µCi': BQ_PER_CURIE*1e-6, mCi: BQ_PER_CURIE*1e-3, Ci: BQ_PER_CURIE,
} as const;
export const MASS_UNITS = { kg: 1000, g: 1, mg: 1e-3, 'µg': 1e-6, ng: 1e-9 } as const;
export type TimeUnit = keyof typeof TIME_UNITS;
export type ActivityUnit = keyof typeof ACTIVITY_UNITS;
export type MassUnit = keyof typeof MASS_UNITS;
export class ScientificError extends Error {
  constructor(message: string) { super(message); this.name = 'ScientificError'; }
}
export function finite(value: number, name: string): number {
  if (!Number.isFinite(value)) throw new ScientificError(`${name} must be a finite number.`);
  return value;
}
export function positive(value: number, name: string): number {
  finite(value, name);
  if (value <= 0) throw new ScientificError(`${name} must be greater than zero.`);
  return value;
}
export function nonnegative(value: number, name: string): number {
  finite(value, name);
  if (value < 0) throw new ScientificError(`${name} cannot be negative.`);
  return value;
}
export function parseNumber(raw: string, name: string): number {
  if (!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(raw.trim())) {
    throw new ScientificError(`${name}: enter a number, for example 12.5 or 1.2e6.`);
  }
  const value = finite(Number(raw), name);
  if (value === 0 && /[1-9]/.test(raw.trim().split(/[eE]/)[0])) {
    throw new ScientificError(`${name} is smaller than the browser can represent. Use a different unit or value.`);
  }
  return value;
}
function convert(value: number, fromFactor: number, toFactor: number, name: string): number {
  nonnegative(value, name);
  if (value === 0) return 0;
  // Direct ratios retain common exact conversions. Log fallback avoids intermediate overflow.
  const ratio = fromFactor / toFactor;
  let result = value * ratio;
  if (!Number.isFinite(result) || result === 0) result = Math.exp(Math.log(value) + Math.log(fromFactor) - Math.log(toFactor));
  if (!Number.isFinite(result) || result === 0) throw new ScientificError(`${name} conversion exceeds the floating-point range. Choose a different value or unit.`);
  return result;
}
export function convertTime(value: number, from: TimeUnit, to: TimeUnit = 's'): number {
  if (!Object.hasOwn(TIME_UNITS,from) || !Object.hasOwn(TIME_UNITS,to)) throw new ScientificError('Unknown time unit.');
  return convert(value, TIME_UNITS[from].factor, TIME_UNITS[to].factor, 'Time');
}
export function convertActivity(value: number, from: ActivityUnit, to: ActivityUnit = 'Bq'): number {
  if (!Object.hasOwn(ACTIVITY_UNITS,from) || !Object.hasOwn(ACTIVITY_UNITS,to)) throw new ScientificError('Unknown activity unit.');
  return convert(value, ACTIVITY_UNITS[from], ACTIVITY_UNITS[to], 'Activity');
}
export function convertMass(value: number, from: MassUnit, to: MassUnit = 'g'): number {
  if (!Object.hasOwn(MASS_UNITS,from) || !Object.hasOwn(MASS_UNITS,to)) throw new ScientificError('Unknown mass unit.');
  return convert(value, MASS_UNITS[from], MASS_UNITS[to], 'Mass');
}
export function constantToSI(value: number, denominator: TimeUnit): number {
  if (!Object.hasOwn(TIME_UNITS,denominator)) throw new ScientificError('Unknown time unit.');
  positive(value, 'Decay constant');
  return positive(convert(value, 1, TIME_UNITS[denominator].factor, 'Decay constant'), 'Decay constant');
}
export function constantFromSI(value: number, denominator: TimeUnit): number {
  if (!Object.hasOwn(TIME_UNITS,denominator)) throw new ScientificError('Unknown time unit.');
  positive(value, 'Decay constant');
  return convert(value, TIME_UNITS[denominator].factor, 1, 'Decay constant');
}
export function parseTimes(raw: string): number[] {
  if (!raw.trim()) throw new ScientificError('Enter at least one time.');
  const tokens = raw.trim().split(/[\s,;]+/);
  if (tokens.length > 1000) throw new ScientificError('Use at most 1,000 time points.');
  return tokens.map((token, index) => nonnegative(parseNumber(token, `Time ${index + 1}`), `Time ${index + 1}`));
}
