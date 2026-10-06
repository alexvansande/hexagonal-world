#!/bin/sh
# v2 outside-region comparison at n=32 (power 1, area beta 0.3, land eps 0.01, coastal buffer 0.5)
cd "$(dirname "$0")"
export V2_POWER=1 V2_BUFFER=0.5 OPENBLAS_NUM_THREADS=1 OMP_NUM_THREADS=1
python3 -I v2_run.py 32 "Eurasia" 1 0.01 0.3 3000 cmp32-Eurasia > v2-cmp32-Eurasia.log 2>&1 &
python3 -I v2_run.py 32 "Afro-Eurasia" 1 0.01 0.3 3000 cmp32-AfroEurasia > v2-cmp32-AfroEurasia.log 2>&1 &
python3 -I v2_run.py 32 "North America" 1 0.01 0.3 3000 cmp32-NorthAmerica > v2-cmp32-NorthAmerica.log 2>&1 &
python3 -I v2_run.py 32 "Antarctica" 1 0.01 0.3 3000 cmp32-Antarctica > v2-cmp32-Antarctica.log 2>&1 &
wait
python3 -I v2_run.py 32 "Africa" 1 0.01 0.3 3000 cmp32-Africa > v2-cmp32-Africa.log 2>&1
