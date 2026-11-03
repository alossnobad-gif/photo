# 自然图鉴：长期交接手册

核对日期：2026-11-03（北京时间）。目的：即使聊天记录丢失，新会话读取仓库也能继续开发和指导用户部署。本文是非敏感交接资料，不是线上配置导出；不包含任何登录凭据。

## 新维护者先做这几件事

1. 读根目录 [AGENTS.md](../../AGENTS.md)、[PRD](../product/PRD.md)、[功能清单](../product/FEATURES.md)、[变更台账](../product/CHANGELOG.md) 和 [迭代规范](../product/ITERATION.md)。用户最新指令优先。
2. 检查当前分支、`git status --short` 和 `git log -5 --oneline`，不覆盖他人修改。仓库旧的 `/tmp` 截图／脚本可能已丢失，不依赖其存在；验证方法以已提交测试和脚本为基础。
3. 如需判断服务器状态，让用户在阿里云 Workbench 执行下方只读检查。不要把开发环境当成 ECS，不因能推送 Git 就假定能登录服务器。
4. 实施已授权的工作，保护真实数据，完成相关测试并更新产品文档／交接资料，再提交与推送。
5. 按 [发布手册](RELEASES.md) 给出一段完整、固定版本的 Bash 更新命令。用户喜欢一次复制执行，不要只说“拉代码重启”，也不应要求其重新解释已经记录的信息。
6. 没有用户执行结果，不标记部署成功；执行成功后还要验证实际界面／流程。新增服务器信息、发布状态或故障结论及时回写仓库。

## 用户与协作习惯

- 中文沟通，主要电脑使用，偶尔手机；Sony A7R V，同时拍摄 RAW＋JPG，两种文件可以独立导入。
- 先本人长期使用半年至一年；没有已授权的多租户商业化、付费、独立超级管理员系统。
- 用户通过 Workbench 登录终端，复制开发者给的一段命令手动部署；自动更新已明确取消。
- 不要求用户把密码、密钥或令牌发到聊天里。需要时让用户在服务器终端或已有设置页安全输入。
- 例行可逆开发直接推进；不要每步重复确认。数据迁移／恢复先备份、预览和核对范围，不能凭标题猜测要删的真实记录。

## 已知生产服务器

下表来自此前用户截图、反馈和仓库部署脚本。它不是 2026-11-03 实时探测结果。

| 项目 | 已知值／确定程度 |
| --- | --- |
| 云服务商／地区 | 阿里云 ECS，华北 2（北京），`cn-beijing`（历史控制台信息） |
| 公网 IPv4 | `123.57.60.66`；无域名；当前已知入口 `https://123.57.60.66` |
| 私网 IPv4 | `172.30.248.96`（历史截图；迁移或更换实例后核实） |
| 操作系统 | Ubuntu；具体版本和当前补丁以 `cat /etc/os-release` 为准 |
| 磁盘 | 40 GiB 系统盘；历史根分区 `/dev/vda3`，不是另有 40 GiB 照片盘 |
| 公网带宽 | 历史为 3 Mbps，慢下载／开原图需考虑传输耗时 |
| CPU／内存／实例规格 | 未保存可靠的精确规格；不要猜，用下面命令核实。历史已确认资源较紧张 |
| Swap | 历史有 `/swapfile`，4 GiB；不是照片，不能直接删作图库清理 |
| 项目目录／业务数据 | `/opt/photo`、`/opt/photo/.data` |
| systemd 服务 | `nature-photo`（完整名 `nature-photo.service`） |
| 应用入口 | `server/index.js`，Node.js 22+；生产仅监听 `127.0.0.1:3000`（默认），Nginx 转发 |
| 服务用户／工作目录 | 文档曾使用 `naturephoto`；实际 `User`／`Group`／`WorkingDirectory` 以 systemd 只读检查为准，不可随意 chown |
| Nginx 站点 | 部署脚本目标 `/etc/nginx/sites-available/nature-photo`，启用链接应保留；当前启用位置需要现场核实 |
| HTTP／HTTPS | 80 跳转 HTTPS；443 提供全站 Basic Auth 和自签 IP 证书；3000 不应向公网开放 |
| 访问账号 | 单账户 Nginx 浏览器登录框，非应用注册页；账号和密码不在 Git |
| 其他项目 | 用户另有项目，是否已共用本服务器、端口和目录未知；不得覆盖其他 Nginx 站点／服务或占用已有端口 |

ECS 实例 ID、vCPU 数、准确内存、当前软件版本、最新磁盘余量、其他应用清单尚未可靠记录。可以在阿里云控制台按上述公网 IP 定位实例，无需猜造实例 ID。

## 连接、资源与服务只读检查

用户在 **ECS Workbench 的这台服务器终端**执行。以下不读取 API 密钥、密码哈希或私钥内容；日志只在本地查看，若需转发先检查并遮蔽个人文件名／令牌等敏感信息。

```bash
hostname
cat /etc/os-release
nproc
free -h
swapon --show
df -h /
du -h --max-depth=1 /opt/photo/.data
node --version
npm --version
systemctl show nature-photo --no-pager \
  -p User -p Group -p WorkingDirectory -p FragmentPath -p DropInPaths -p EnvironmentFiles
systemctl is-active nature-photo
ss -lntp
curl -fsS --max-time 10 http://127.0.0.1:3000/api/status
```

`/api/status` 返回模型／平台和是否配置，不返回密钥。公网 HTTPS 未登录应被 Nginx 拒绝，不能仅测本地 200 就声称全站鉴权完成。完整诊断另参照 [HTTPS 验证](../private-https.md)。不要让用户直接粘贴 `printenv`、环境文件、整个 `.data` 或未脱敏 `systemctl cat`／`nginx -T` 输出。

## 配置和数据保存在哪里

| 路径 | 内容与处理规则 |
| --- | --- |
| `/etc/nature-photo.env` | 历史部署环境文件；是否仍在使用以 EnvironmentFiles 为准。可能含 `DASHSCOPE_API_KEY`、`QWEN_MODEL`，绝不提交／打印 |
| `.data/recognition-settings.json` | 当前网页识别设置（含密钥）。网页设置优先于环境变量；网页展示平台和模型，密钥留空保留原值 |
| `.data/baidu-drive.json` | 百度 AppKey／SecretKey、OAuth 令牌、连接标记；只在服务器保存，不回显凭据 |
| `/etc/nature-photo-security/passwords` | Basic Auth 密码哈希；不能恢复原密码，需要时重设 |
| `/etc/nature-photo-security/server.key`、`server.crt` | TLS 私钥／公有证书；私钥留服务器，证书当前是自签，浏览器不信任提示属预期 |
| `/etc/systemd/system/nature-photo.service.d/` | 可能有 `private-network.conf` 等覆盖配置；保持现有服务配置，不整套重写 |
| `.data/library.json`、`collection.json`、`landscapes.json` | 图库／物种收藏／风光索引；三个集合不同，不可混淆 |
| `.data/recognition-queue.json` | 双类型识别队列和历史；`completed` 不代表可随意清理照片 |
| `.data/baidu-import-queue.json` | 独立后台网盘导入队列；新版本新增，关闭页面／重启服务后恢复，不是识别队列 |
| `.data/photos/`、`library-originals/` | 工作照片与未编辑原件；都有真实资产，不直接清空目录 |
| `.data/library-deleted-photos.json`、`photo-equipment.json` 等 | 删除标记和设备元数据，随 `.data` 保留 |
| `.data/photo-previews/`、`queue-thumbnails/`、`baidu-previews/`、`editor-previews/` | 可重建缓存；需要定位引用和活动任务，不能误删工作照片当作缓存 |
| `/opt/photo/vendor/` | 本机安装的 LibRaw 库（如已装）；不能因不在 Git 就当作垃圾删除 |
| `/opt/photo/metadata-backup-*`、安全配置备份目录 | 历次手动备份，可能含凭据，保留受限权限；不是异地灾备 |

百度回调当前约定：`https://123.57.60.66/api/baidu/callback`。用户已创建个人“照片管理器”应用并确认可看到网盘文件；不需要从分享链接重新开始，也不要索要聊天中的 Secret。API 授权仍可能过期，以网页状态为准。

模型支持千问 AI 平台 `qianwenai` 与阿里云百炼 `dashscope`，地址不同不能混用密钥。历史用户使用 `qianwenai / qwen3.8-max`；当前选择以 `/api/status` 为准。只有支持的模型关闭深度思考；勿用最短文本请求速度替代真实图片识别速度。

## 当前实现与关键规则

- `.data` 为 JSON 文件＋照片，不是 SQL 数据库；各模块串行写和原子重命名，不代表跨集合完整事务。
- 图库明确两个按钮：识别物种／识别风光。每张两种状态独立，图库默认未提交，识别队列默认处理中与待确认。
- 自动识别严格 `confidence > 0.85` 才自动保存；重复物种一定进入确认对比，不能自动覆盖；手动 JSON 不调用模型、不因高分自动保存。
- 拍摄日期优先真实 EXIF，首次发现／入库／上传时间不同。中文名、人工核实资料和跨集合照片引用要保留。
- 新导入最多 4096／Q90 工作 JPG；修图先开 2048 预览，保存映射工作图。按需原图只读；编辑覆盖后按引用清理原件，不保证服务器永久保留原始 RAW。
- 网盘后台导入队列持久化、一次处理一张、可重试／重启恢复。导入成功只进图库，不自动决定识别类型；文件名辅助识别但不是可信事实。
- RAW 使用独立 Python＋LibRaw；适配索尼 A7R V 需要兼容版本（安装脚本固定 LibRaw 0.21.4）。`python3 scripts/decode-raw.py --check` 可本地检查。不要每次普通更新都重新编译解码器。
- 列表用缩略图；不为全部卡片同时请求全尺寸文件。电脑宽编辑器和手机都要验证。
- 当前无独立最高权限后台、自动部署、自动异地灾备／已验证恢复演练、专业图层／蒙版或多租户。详情删除和图库批删是已有能力，不能恢复已撤销的卡片外删除或临时“修复物种”。

完整规则见 PRD；发布前按 ITERATION 检查，不仅凭构建通过就宣布数据修复成功。

## 故障排查起点

| 现象 | 先检查 |
| --- | --- |
| 502、页面全打不开 | `systemctl is-active nature-photo`、本地 3000 `/api/status`、本机 `journalctl -u nature-photo -n 60 --no-pager` |
| `200/CHDIR`、WorkingDirectory permission denied | 工作目录及父目录遍历权限、systemd User；历史曾因复制临时目录权限导致，禁止 chmod 777 或整目录覆盖 |
| 更新拉取失败／超时 | 用户 ECS 到 GitHub 曾 TLS 失败／fetch 超时；优先用发布手册 codeload 固定提交，不重复强行 git pull、不关闭 TLS 验证 |
| git 提交与网页不一致 | 曾用源码包逐文件更新，所以服务器 git HEAD 可能陈旧；查看发布标记、更新时间、构建及日志，不做 `git reset --hard` 覆盖数据 |
| 图库为空／一直加载 | 看接口状态和错误、当前筛选（默认未提交）；不能当作“数据没了”重新初始化 |
| 识别慢／错投类型 | 查队列 kind、具体入口、图片调用日志／模型设置、思考开关；已经有队列串类型历史，不默认归罪千问或网络 |
| 网盘切目录／页后缩略图堵塞 | 现有取消旧请求＋受限并发＋缓存；回归快速换目录和翻页，保留已修复逻辑 |
| 空间占用高 | `df` 与 `du` 分开看；系统、Swap、依赖和照片共同占用，不直接删原件／Swap／JSON |

## 持续维护交接资料

每次发布更新 [RELEASES.md](RELEASES.md)，每次改服务器／路径／端口／配置位置／依赖更新本文；需求变更同步 PRD／FEATURES／CHANGELOG。未知项获得证据后补齐日期和来源，不能改写成早已确认。

对新会话可以直接说：

> 请接手 https://github.com/alossnobad-gif/photo ，先读根目录 AGENTS.md、docs/operations/HANDOFF.md、docs/operations/RELEASES.md 和产品文档。按仓库交接信息继续维护，保护阿里云 /opt/photo/.data；开发测试并推送后给我一条固定提交的 Bash 更新命令，我在 Workbench 手动执行。不要让我重复提供已记录的服务器信息，也不要索要密钥。
