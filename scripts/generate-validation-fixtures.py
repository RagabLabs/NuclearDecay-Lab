"""Independent oracle: Python Decimal at 160 digits, exact binary64 inputs.

No application modules or formula helpers are imported. Test fixtures are committed,
so normal npm testing does not require Python. --check verifies reproducibility.
"""
from decimal import Decimal as D, getcontext
from pathlib import Path
import argparse
import json

getcontext().prec = 160
ln2 = D(2).ln()
na = D('6.02214076e23')
values = [
    ('custom-one-half', 1e8, 691200., 691200., 131.),
    ('carbon-5700y', 1e8, 5700.*31556926., 5700.*31557600., 14.00324198862*1.00000000105),
    ('carbon-5730y', 1e8, 5700.*31556926., 5730.*31557600., 14.00324198862*1.00000000105),
    ('carbon-exact-half', 1e8, 5700.*31556926., 5700.*31556926., 14.00324198862*1.00000000105),
    ('tiny-loss', 1e300, 1e23, 1e-300, 131.),
    ('subnormal-fraction', 1e300, 1., 1074.5, 131.),
    ('percent-rescue', 1e300, 1., 1075., 131.),
    ('subnormal-activity', 1e-300, 1., 70., 131.),
    ('nuclei-overflow-mass-valid', 1e300, 1e23, 0., 1.),
]
for n in [0, 1, 2, 5, 10, 50]:
    values.append((f'analytical-{n}', 100., 8., 8.*n, 131.))
for n, (a, h, t) in enumerate([(1e-200, 1e-200, 2e-200), (1e200, 1e200, 3e200), (1., 1e-300, 1e-310), (1e200, 1e100, 1e-200)]):
    values.append((f'scale-{n}', a, h, t, 131.))
cases = []
for name, a, h, t, m in values:
    aD, hD, tD, mD = map(D.from_float, [a, h, t, m])
    x = ln2*tD/hD
    fraction = (-x).exp()
    activity = aD*fraction
    # The independent Taylor expansion avoids cancellation beyond Decimal precision.
    loss = aD*(1-fraction) if x >= D('1e-100') else aD*(x-x*x/2+x*x*x/6)
    rate = ln2/hD
    nuclei = activity/rate
    mass = nuclei/na*mD
    expected = dict(remaining=str(activity), lost=str(loss), remainingPercent=str(fraction*100),
                    lambda_=str(rate), nuclei=str(nuclei), mass=str(mass), exponent=str(x))
    expected['lambda'] = expected.pop('lambda_')
    # Match the committed key order for byte-reproducible fixtures.
    expected = {key: expected[key] for key in ['remaining', 'lost', 'remainingPercent', 'lambda', 'nuclei', 'mass', 'exponent']}
    cases.append(dict(name=name, input=dict(initial=a, half=h, time=t, molar=m), expected=expected))
inverse_cases = []
for name, a, final, h, t, m in [
    ('inverse-regular', 1e8, 3.125e7, 691200., 1166400., 131.),
    ('inverse-wide-scale', 1e240, 1e200, 1e100, 1e100, 131.),
    ('inverse-near-equal', 1e15, 999999999999999.9, 691200., 1., 131.),
]:
    aD, fD, hD, tD, mD = map(D.from_float, [a, final, h, t, m])
    ratio_log = (aD/fD).ln()
    expected = dict(initial=str(fD*(ln2*tD/hD).exp()), final=str(aD*(-ln2*tD/hD).exp()),
                    time=str(hD*ratio_log/ln2), half=str(tD*ln2/ratio_log),
                    rate=str(ratio_log/tD), nuclei=str(fD*hD/ln2), mass=str(fD*hD/ln2/na*mD))
    inverse_cases.append(dict(name=name, input=dict(initial=a, final=final, half=h, time=t, molar=m), expected=expected))
payload = dict(precision=160, inputInterpretation='Exact binary64 input values; Python Decimal ln/exp; no application engine imports', cases=cases, inverseCases=inverse_cases)
target = Path(__file__).resolve().parents[1] / 'tests/fixtures/independent-decay.json'
text = json.dumps(payload, indent=2)
parser = argparse.ArgumentParser()
parser.add_argument('--check', action='store_true')
args = parser.parse_args()
if args.check:
    if target.read_text() != text:
        raise SystemExit('Independent fixtures differ; inspect changes rather than overwriting expected values.')
    print(f'{len(cases)} decay and {len(inverse_cases)} inverse 160-digit fixtures reproduced exactly.')
else:
    target.write_text(text)
    print(f'Wrote {len(cases)} decay and {len(inverse_cases)} inverse 160-digit fixtures.')
