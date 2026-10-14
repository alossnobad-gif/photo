#!/usr/bin/env python3
"""Read-only share-password verification. No login, CAPTCHA solving or downloads."""
import http.cookiejar
import json
import re
import sys
import urllib.error
import urllib.parse
import urllib.request


def check(link, opener=None):
    parsed = urllib.parse.urlparse(link)
    match = re.fullmatch(r'/s/1([A-Za-z0-9_-]+)', parsed.path)
    code = urllib.parse.parse_qs(parsed.query).get('pwd', [''])[0]
    if parsed.scheme != 'https' or parsed.netloc != 'pan.baidu.com' or not match or not re.fullmatch(r'[A-Za-z0-9]{4}', code):
        raise ValueError('请提供带 pwd=四位提取码的 HTTPS 百度分享链接')
    if opener is None:
        opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
    headers = {'User-Agent': 'Mozilla/5.0', 'Referer': link}
    def read(request):
        with opener.open(request, timeout=25) as response:
            return response.read(2 * 1024 * 1024).decode('utf-8', errors='replace')
    read(urllib.request.Request(link, headers=headers))
    url = 'https://pan.baidu.com/share/verify?' + urllib.parse.urlencode({'surl': match.group(1)})
    body = urllib.parse.urlencode({'pwd': code, 'vcode': '', 'vcode_str': ''}).encode()
    raw = read(urllib.request.Request(url, data=body, headers={**headers, 'Content-Type': 'application/x-www-form-urlencoded'}))
    try:
        result = json.loads(raw)
    except (ValueError, TypeError):
        return {'验证结果': '没有返回 JSON，可能需要浏览器或安全验证；未继续'}
    errno = result.get('errno')
    if errno != 0:
        return {'验证结果': '未通过，未尝试绕过验证', '百度错误码': errno}
    # Cookie jar keeps verification in memory. Never print or persist tokens.
    page = read(urllib.request.Request(link, headers=headers))
    title = re.search(r'<title[^>]*>(.*?)</title>', page, re.S)
    return {'验证结果': '提取码提交成功', '页面标题': title.group(1).strip() if title else '未找到',
            '文件列表线索': any(word in page for word in ['server_filename', 'fs_id', 'file_list']),
            '说明': '尚未下载照片；网页有无列表线索不等于可下载'}


if __name__ == '__main__':
    try:
        if len(sys.argv) != 2:
            raise ValueError('用法：python3 check-baidu-share.py 分享链接')
        print(json.dumps(check(sys.argv[1]), ensure_ascii=False, indent=2))
    except urllib.error.HTTPError as error:
        print('连接返回 HTTP', error.code)
        sys.exit(1)
    except urllib.error.URLError:
        print('连接失败或超时；未读取文件列表')
        sys.exit(1)
    except ValueError as error:
        print(str(error))
        sys.exit(2)
