#!/bin/sh
# Fish map v2, end to end (about 45 min on 4 cores). Needs labels.bin (see run_all.sh / label.c).
set -e
cd "$(dirname "$0")"
./v2_compare.sh          # whole-continent outsides, n=32
./v2_compare_disks.sh    # small inland-disk outsides, n=32
./v2_final.sh            # Eurasia outside, n=64, four energy settings
export OPENBLAS_NUM_THREADS=1 OMP_NUM_THREADS=1
python3 -I v2_make.py 64 final-conformal v2 final-balanced final-area final-robust \
  cmp32-Eurasia cmp32-AfroEurasia cmp32-Africa cmp32-NorthAmerica cmp32-Antarctica \
  cmp32-EurasiaDisk cmp32-AfricaDisk cmp32-NorthAmericaDisk cmp32-SouthAmericaDisk cmp32-AntarcticaDisk > v2-make.log
python3 -I v2_make.py 64 final-area v2-area > v2-make-area.log
