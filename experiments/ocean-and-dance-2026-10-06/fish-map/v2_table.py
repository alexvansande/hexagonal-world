"""Print a comparison table of v2 runs. usage: python3 -I v2_table.py TAG..."""
import os, sys, json
HERE = os.path.dirname(os.path.abspath(__file__))
print('| run | outside | outside area (M km²) | ω mean | ω p50/p90/p99 | ω max (≥50% ocean) | area p10/p50/p90 | area p1/p99 | area max/min (≥50% ocean) | mean abs area error | iterations |')
print('|---|---|---|---|---|---|---|---|---|---|---|')
for t in sys.argv[1:]:
    r = json.load(open(os.path.join(HERE, f'v2-run-{t}.json'))); m = r['metrics']
    f = lambda a: '/'.join(f'{x:.2f}' if abs(x) < 10 else f'{x:.0f}' for x in a)
    print(f"| {t} | {r['outside']} | {r['outside_area_Mkm2']:.1f} | {m['omega_ocean_mean']:.2f}° | {f(m['omega_ocean_p50_p90_p99'])} | "
          f"{m['omega_max_mostly_ocean']:.0f}° | {f(m['area_ocean_p10_p50_p90'])} | {f(m['area_ocean_p01_p99'])} | "
          f"{f(m['area_max_min_mostly_ocean'])} | {m['ocean_area_error_total']:.3f} | {r['iterations']} |")
