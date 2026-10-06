#!/bin/sh
# v2 comparison of small inland-disk outsides at n=32 (same settings as v2_compare.sh)
cd "$(dirname "$0")"
export V2_POWER=1 V2_BUFFER=0.5 OPENBLAS_NUM_THREADS=1 OMP_NUM_THREADS=1
for o in "Eurasia inland disk:EurasiaDisk" "Africa inland disk:AfricaDisk" "North America inland disk:NorthAmericaDisk" "Antarctica inland disk:AntarcticaDisk" "South America inland disk:SouthAmericaDisk"; do
  name="${o%%:*}"; t="${o##*:}"
  python3 -I v2_run.py 32 "$name" 1 0.01 0.3 3000 "cmp32-$t" > "v2-cmp32-$t.log" 2>&1 &
  sleep 2
  while [ $(pgrep -fc "v2_run.py") -ge 4 ]; do sleep 5; done
done
wait
