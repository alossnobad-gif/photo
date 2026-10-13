#!/usr/bin/env bash
# Personal single-account access, TLS terminated by nginx. Run with sudo/bash.
set -euo pipefail
[[ $EUID == 0 ]] || { echo '请以 root 运行'; exit 1; }
photo_ip=${1:-123.57.60.66}
python3 - "$photo_ip" <<'PY'
import ipaddress,sys
assert ipaddress.ip_address(sys.argv[1]).version == 4
PY
command -v nginx >/dev/null
command -v openssl >/dev/null
if ! command -v htpasswd >/dev/null; then apt-get update; apt-get install -y apache2-utils; fi
read -r -p '设置登录账号（英文字母、数字、下划线）：' photo_user
[[ "$photo_user" =~ ^[a-zA-Z0-9_]{1,40}$ ]] || { echo '账号格式不正确'; exit 1; }
read -r -s -p '设置密码（至少12字符）：' photo_password; echo
read -r -s -p '再次输入密码：' photo_repeat; echo
[[ ${#photo_password} -ge 12 && "$photo_password" == "$photo_repeat" ]] || { echo '密码太短或两次不一致'; exit 1; }
umask 077
work=$(mktemp -d /tmp/photo-security.XXXXXX)
trap 'unset photo_password photo_repeat; rm -rf "$work"' EXIT
printf '%s\n' "$photo_password" | htpasswd -iBc "$work/passwords" "$photo_user"
unset photo_password photo_repeat
install -d -m 700 /etc/nature-photo-security
backup=/etc/nature-photo-security/backup-$(date +%Y%m%d-%H%M%S)
mkdir "$backup"
site=/etc/nginx/sites-available/nature-photo
cp -p "$site" "$backup/nginx-site"
for file in passwords server.key server.crt; do
 [[ ! -e /etc/nature-photo-security/$file ]] || cp -p "/etc/nature-photo-security/$file" "$backup/$file"
done
# Reuse certificate on subsequent password changes for the same IP.
if [[ ! -f /etc/nature-photo-security/server.crt ]] || ! openssl x509 -in /etc/nature-photo-security/server.crt -noout -checkip "$photo_ip" >/dev/null; then
 openssl req -x509 -newkey rsa:3072 -sha256 -nodes -days 365 -keyout "$work/server.key" -out "$work/server.crt" -subj "/CN=$photo_ip" -addext "subjectAltName=IP:$photo_ip"
 install -m 600 "$work/server.key" /etc/nature-photo-security/server.key
 install -m 644 "$work/server.crt" /etc/nature-photo-security/server.crt
fi
# nginx workers must read the password hashes, but never the TLS private key.
chown root:www-data /etc/nature-photo-security
chmod 750 /etc/nature-photo-security
install -o root -g www-data -m 640 "$work/passwords" /etc/nature-photo-security/passwords
cat > "$site" <<NGINX
server {
 listen 80;
 server_name $photo_ip;
 return 301 https://$photo_ip\$request_uri;
}
server {
 listen 443 ssl http2;
 server_name $photo_ip;
 ssl_certificate /etc/nature-photo-security/server.crt;
 ssl_certificate_key /etc/nature-photo-security/server.key;
 ssl_protocols TLSv1.2 TLSv1.3;
 auth_basic "Private photo library";
 auth_basic_user_file /etc/nature-photo-security/passwords;
 client_max_body_size 151m;
 location / {
  proxy_pass http://127.0.0.1:3000;
  proxy_set_header Host \$host;
  proxy_set_header X-Forwarded-Proto \$scheme;
  proxy_set_header X-Forwarded-For \$remote_addr;
  proxy_set_header Authorization "";
  proxy_read_timeout 180s;
 }
}
NGINX
if ! nginx -t; then
 cp -p "$backup/nginx-site" "$site"
 echo "配置校验失败，原配置已恢复。备份：$backup"
 exit 1
fi
# Bind directly via systemd so an old HOST environment variable cannot expose port 3000.
install -d -m 755 /etc/systemd/system/nature-photo.service.d
cat > /etc/systemd/system/nature-photo.service.d/private-network.conf <<'UNIT'
[Service]
Environment=HOST=127.0.0.1
UNIT
systemctl daemon-reload
systemctl restart nature-photo
systemctl reload nginx
printf '\n已配置：https://%s\n浏览器会提示自签名证书不受信任；请核对下方证书指纹后信任。\n' "$photo_ip"
openssl x509 -in /etc/nature-photo-security/server.crt -noout -fingerprint -sha256 -enddate
printf '配置备份：%s\n请在安全组开放 HTTPS 443，关闭公网 3000；80 仅用于跳转。\n' "$backup"
