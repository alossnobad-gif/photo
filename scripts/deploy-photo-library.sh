#!/usr/bin/env bash
# Manually invoked updater; never installs an auto-update job or replaces .data.
set -euo pipefail
source_dir=${1:?请提供已解压的代码目录}
photo_root=${2:-/opt/photo}
nginx_site=${PHOTO_NGINX_SITE:-/etc/nginx/sites-available/nature-photo}
if [[ ! -f "$source_dir/server/photo-library.js" || ! -f "$photo_root/package.json" ]]; then
  echo "代码目录或现有项目目录不正确" >&2
  exit 1
fi
# Synchronize tracked runtime code, including earlier feature dependencies.
# The personal storage folder is .data (with a dot) and is never part of this loop.
for directory in server src scripts; do
  install -d -m 755 "$photo_root/$directory"
  for source_file in "$source_dir/$directory"/*; do
    [[ -f "$source_file" ]] || continue
    install -m 644 "$source_file" "$photo_root/$directory/$(basename "$source_file")"
  done
done
install -d -m 755 "$photo_root/data/catalogue"
for source_file in "$source_dir/data/catalogue"/*; do
  [[ -f "$source_file" ]] || continue
  install -m 644 "$source_file" "$photo_root/data/catalogue/$(basename "$source_file")"
done
bash "$photo_root/scripts/install-raw-decoder.sh"
cd "$photo_root"
python3 scripts/decode-raw.py --check
# Validate config before rebuilding/restarting. Keep its original for a failed check.
nginx_backup=$(mktemp /tmp/nature-photo-nginx.XXXXXX)
cp "$nginx_site" "$nginx_backup"
trap 'rm -f "$nginx_backup"' EXIT
sed -i 's/client_max_body_size[^;]*;/client_max_body_size 151m;/' "$nginx_site"
sed -i 's/proxy_read_timeout[^;]*;/proxy_read_timeout 180s;/' "$nginx_site"
if ! nginx -t; then
  cat "$nginx_backup" > "$nginx_site"
  echo "Nginx 校验失败，已恢复原配置；未重启应用" >&2
  exit 1
fi
npm run build
systemctl reload nginx
systemctl restart nature-photo
for attempt in {1..15}; do
  if curl -fsS --max-time 3 http://127.0.0.1:3000/api/library -o /dev/null; then
    echo "图库、JPG / A7R V RAW 修图与选片识别更新完成"
    exit 0
  fi
  sleep 1
done
echo "服务尚未就绪，请运行 journalctl -u nature-photo -n 30 --no-pager 查看原因" >&2
exit 1
