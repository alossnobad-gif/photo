#!/usr/bin/env bash
set -euo pipefail
photo_root=$(cd "$(dirname "$0")/.." && pwd)
if python3 "$photo_root/scripts/decode-raw.py" --check >/dev/null 2>&1; then
  echo "RAW 解码器已就绪，无需重复安装"
  exit 0
fi
apt-get update
apt-get install -y python3 build-essential pkg-config libjpeg-dev zlib1g-dev
raw_build=$(mktemp -d /tmp/nature-photo-libraw.XXXXXX)
trap 'rm -rf "$raw_build"' EXIT
curl -4 -fL --connect-timeout 15 --max-time 180 \
  https://www.libraw.org/data/LibRaw-0.21.4.tar.gz -o "$raw_build/source.tar.gz"
(cd "$raw_build" && echo '6be43f19397e43214ff56aab056bf3ff4925ca14012ce5a1538a172406a09e63  source.tar.gz' | sha256sum -c -)
tar -xzf "$raw_build/source.tar.gz" -C "$raw_build"
cd "$raw_build/LibRaw-0.21.4"
./configure --prefix="$photo_root/vendor" --disable-openmp --disable-examples
make -j2
make install
python3 "$photo_root/scripts/decode-raw.py" --check
echo "LibRaw 0.21.4 已安装，可尝试索尼 A7R V 的 ARW"
