#!/usr/bin/env bash
# Read-only checks. No account credentials, file list or photo download.
set -u
probe() {
  local label="$1" url="$2" code result
  code=$(curl --silent --output /dev/null --location \
    --connect-timeout 8 --max-time 15 --write-out '%{http_code}' "$url")
  result=$?
  if [ "$result" -eq 0 ]; then
    printf '%s：HTTP %s（只证明收到响应，不代表授权成功）\n' "$label" "$code"
  else
    printf '%s：连接失败，curl=%s，HTTP=%s\n' "$label" "$result" "$code"
  fi
}
printf '百度网盘只读连通性检查；不读取账号或照片。\n'
probe '百度授权服务' 'https://openapi.baidu.com/oauth/2.0/authorize' &
probe '网盘开放平台' 'https://pan.baidu.com/union/doc/' &
probe '网盘文件接口（未授权探测）' 'https://pan.baidu.com/rest/2.0/xpan/file?method=list&dir=%2F' &
wait
printf '后续仍需开放平台应用和账号授权；非成功响应不等于 API 不支持个人账号。\n'
