#!/bin/sh
# v2 final runs at n=64 (about 1.1 degree triangles), outside region = Eurasia.
# Four energy settings; each starts from the azimuthal-equidistant map.
cd "$(dirname "$0")"
export V2_BUFFER=0.5 OPENBLAS_NUM_THREADS=1 OMP_NUM_THREADS=1
run() { V2_POWER=$3 python3 -I v2_run.py 64 Eurasia 1 0.01 $2 15000 "final-$1" > "v2-final-$1.log" 2>&1; }
run conformal 0.1 1 &
run balanced 0.3 1 &
run area 1.0 1 &
run robust 0.3 1.5 &
wait
