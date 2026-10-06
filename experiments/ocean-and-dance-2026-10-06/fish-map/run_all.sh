#!/bin/sh
# End-to-end reproduction of the fish map (about 45 min on 4 cores).
set -e
cd "$(dirname "$0")"
gcc -O2 -o label label.c
./label ../mask.bin labels.bin 4320 2160          # 4-connected water components
python3 -I verify_snyder.py 32                     # equal-area checks -> verify_snyder_n32.json
for s in 1 2 3; do python3 -I search.py 24 1200 $s > search$s.log & done; wait   # globe rotation search
python3 -I make_map.py 32 > make32.log             # comparison resolution
python3 -I make_map.py 64 > make64.log             # final resolution
for f in fish-map fish-map-clean fish-diagnostic fish-distortion; do cp ${f}_n64.png $f.png; done
