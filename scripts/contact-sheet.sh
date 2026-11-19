#!/usr/bin/env bash
# Render frames of a composition and tile them into one contact sheet.
#   scripts/contact-sheet.sh <out.png> <frame> [frame ...]   (comp = Ep01TheLastSeat unless COMP is set)
set -euo pipefail
OUT=$1; shift
COMP=${COMP:-Ep01TheLastSeat}
TMP=$(mktemp -d)
i=0
for fr in "$@"; do
  npx remotion still "$COMP" "$TMP/$(printf %02d $i).png" --frame="$fr" --log=error
  i=$((i+1))
done
n=$i; cols=3; rows=$(( (n + cols - 1) / cols ))
inputs=""; filt=""; layout=""
for ((k=0;k<n;k++)); do
  inputs+=" -i $TMP/$(printf %02d $k).png"
  filt+="[$k]scale=640:360[s$k];"
  layout+="$(( (k % cols) * 640 ))_$(( (k / cols) * 360 ))|"
done
labels=""; for ((k=0;k<n;k++)); do labels+="[s$k]"; done
if [ "$n" -gt 1 ]; then
  ffmpeg -v error -y $inputs -filter_complex "${filt}${labels}xstack=inputs=$n:layout=${layout%|}:fill=black" "$OUT"
else
  cp "$TMP/00.png" "$OUT"
fi
rm -rf "$TMP"
echo "✓ $OUT"
