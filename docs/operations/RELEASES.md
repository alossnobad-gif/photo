# 手动发布、版本记录和回退

核对日期：2026-11-03。生产信息见 [HANDOFF](HANDOFF.md)。这是给后续维护者的操作规范；不要因为命令写在仓库里就认为它已经在 ECS 执行过。

## 源码与线上状态

| 日期 | Git 提交 | 内容 | 开发证据 | ECS 部署／线上验收 |
| --- | --- | --- | --- | --- |
| 2026-10-26 | `7e73c1c` | JPG 工作图、轻量修图与按需原图 | 当轮 98 项测试及电脑／手机验证 | 未记录可靠版本确认 |
| 2026-10-29 | `5c86089` | 记住上次网盘目录 | 当轮 98 项测试及电脑／手机验证 | 已给用户命令，执行与验收待确认 |
| 2026-11-02 | `e4dbea1` | 持久化后台网盘导入和失败重试 | 当轮 103 项测试、构建和电脑／手机验证 | 已给用户命令，执行与验收待确认 |
| 2026-11-03 | 交接资料（用 `git log` 查询本次文档提交） | 当前 README、服务器交接、发布规范及历史归档 | 文档链接／命令语法与保密检查 | 纯文档，无需重启服务器 |

**最后已知运行时代码发布基线为 `e4dbea1`，不是“已确认的线上版本”。** 新提交见 `git log`，每次发布需更新表格。文档不能写入自身尚未生成的提交 hash；文档提交后可直接从 Git 历史查到。

历史用过 codeload 源码包逐文件安装，所以生产 `git rev-parse HEAD` 可能落后于实际文件。`main` 是源码发布目标，不是服务器部署状态。以后成功发布记录 `/opt/photo/.deployed-commit` 和时间；标记是发布证据之一，仍需实际验证页面，不证明无人手动改过文件。

## 每轮固定协作流程

1. 在开发副本检查状态、读维护文档、完成改动；不在生产数据上跑测试。
2. 运行 `npm test`、`npm run build`、`git diff --check`；界面改动验证约 1440／390 宽。纯文档改动核对链接、命令和代码事实即可。
3. 核对 `package.json`、锁文件、RAW 脚本、名录数据和 Nginx／systemd 是否变化，决定具体发布文件和前置步骤。
4. 提交，按现有约定 `git push origin HEAD:main`（先检查远端；非快进需解决差异，禁止强推覆盖）。推送成功后用 `git rev-parse HEAD` 得到确切提交。
5. 给用户 **一段可复制的 Bash 命令**：固定刚刚提交的版本、下载、备份、安装必需文件、构建、重启、健康检查。不能让用户猜仓库地址或占位符；失败立即停止，不打印“成功”。
6. 用户执行后记录部署版本／时间／结果；核实登录、页面以及本次目标流程。没有反馈则保留“待确认”。

服务器曾有 GitHub TLS／fetch 超时；源码下载使用 `https://codeload.github.com/alossnobad-gif/photo/tar.gz/<固定提交>`，带超时且保留 TLS 校验。不要默认 `git pull` 可用，也不要使用 `git reset --hard`、整目录覆盖、`chmod -R 777` 或清空 `.data`。

## 已有依赖不变时的命令样板

下方固定为 `e4dbea1`，用于复现最后已知运行时代码。**维护者下次发布必须将 photo_revision 替换为本轮实际已推送提交，再把完整命令给用户。** 不是每次都重发旧版，也不要把 `main` 当作不可变版本。

适用前提：项目和依赖已经安装、systemd 和 Nginx 已配置；`package.json`／锁文件与服务器一致。如果不一致会停止，维护者需另行准备依赖升级和回退方案；不要不看变更就在小内存生产服务器重复 `npm ci` 或编译 LibRaw。

命令只备份 JSON 索引，不是照片全量备份，也不是跨集合一致性快照。高风险迁移前另做受控完整备份和恢复验证。保留 `.data`、`/etc/nature-photo.env`、Nginx、systemd、安全配置、`vendor` 及其他项目。源码安装只设置单个文件权限，不改变目录所有者或权限。

```bash
(
  set -e
  photo_revision=e4dbea1
  update_dir=$(mktemp -d /tmp/photo-update-XXXXXX)
  trap 'rm -rf "$update_dir"' EXIT

  curl -4 -fL --connect-timeout 15 --max-time 180 \
    "https://codeload.github.com/alossnobad-gif/photo/tar.gz/$photo_revision" \
    -o "$update_dir/source.tar.gz"
  tar -xzf "$update_dir/source.tar.gz" \
    -C "$update_dir" --strip-components=1

  for manifest in package.json package-lock.json; do
    if ! cmp -s "/opt/photo/$manifest" "$update_dir/$manifest"; then
      echo "依赖清单不同，请先准备本次依赖升级方案；尚未覆盖生产源码。"
      exit 1
    fi
  done

  metadata_backup=$(mktemp -d /opt/photo/metadata-backup-XXXXXX)
  for file in /opt/photo/.data/*.json; do
    if [ -f "$file" ]; then
      install -m 600 "$file" "$metadata_backup/"
    fi
  done

  for subdir in src server scripts data docs; do
    if [ -d "$update_dir/$subdir" ]; then
      while IFS= read -r -d '' file; do
        install -D -m 644 "$file" "/opt/photo/${file#"$update_dir/"}"
      done < <(find "$update_dir/$subdir" -type f -print0)
    fi
  done
  for file in README.md AGENTS.md .gitignore index.html vite.config.js; do
    install -m 644 "$update_dir/$file" "/opt/photo/$file"
  done

  cd /opt/photo
  npm run build
  systemctl restart nature-photo
  photo_healthy=0
  for attempt in 1 2 3 4 5 6 7 8 9 10; do
    if systemctl is-active --quiet nature-photo && \
      curl -fsS --max-time 3 http://127.0.0.1:3000/api/status -o /dev/null; then
      photo_healthy=1
      break
    fi
    sleep 1
  done
  if [ "$photo_healthy" -ne 1 ]; then
    echo "健康检查失败，请在服务器本地查看 nature-photo 日志；未记录部署成功。"
    exit 1
  fi
  printf '%s\n' "$photo_revision" > /opt/photo/.deployed-commit
  date -u +%Y-%m-%dT%H:%M:%SZ > /opt/photo/.deployed-at
  echo "应用健康检查通过，请刷新网页并验证本次功能。JSON 备份：$metadata_backup"
)
```

这不是完整安装／文件删除／配置迁移脚本，不会自动删除旧源码文件。如果本轮包含源码删除、目录调整、依赖变化、端口变化或数据迁移，需要维护者提供针对性的命令并验证。它不修改 Nginx、不会自动安装解码器，普通发布不要顺手执行 `setup-private-https.sh` 或 `deploy-photo-library.sh` 去重设配置。

## 健康检查和用户验收

- 应用本地 `/api/status` 返回 200，服务保持 active；检查实际监听为 `127.0.0.1:3000`。
- 浏览器刷新 `https://123.57.60.66`；无登录凭据的请求应返回 401，登录后可看图库和本轮功能。自签证书的指纹和到期检查见 HTTPS 文档，不把忽略证书校验当修复。
- 真正执行本轮流程：例如选两张网盘照片，提交后切目录／关窗口再看进度；不能仅凭首页打开就说后台任务正常。
- 保留测试／源码推送／用户执行／线上验收四类证据；不要把开发隔离数据的通过写成真实照片修复。

## 代码回退与数据恢复

- 先定位故障，保留日志、现有 `.data` 和配置。确认上一次 **用户实际验证过** 的提交；不是直接挑一个旧 hash 就称为可用版本。
- 纯代码、无不兼容数据变更时，可用相同安装方式换为上一已验证提交，核对依赖、重建、重启和健康检查；新代码曾新增的文件不一定自动移除，需按实际差异处理。
- `.deployed-commit` 是本规范引入后的标记，旧服务器可能没有。旧提交不能从历史 Git HEAD 单独推断，需要用户执行记录和文件核对。
- 数据恢复是单独操作：停写入、核对备份时间与期间新增照片、恢复对应索引及文件、保持所有者／权限、校验跨集合引用，再启动验证。**不要用旧 JSON 全覆盖“修复”，也不要恢复索引却遗漏照片。**
- 同盘 metadata-backup 只保留部分索引，可能含密钥，需要受限权限；不能代替原件、工作图、环境和 TLS／账号配置的安全异地备份。当前未建立自动异地灾备／恢复演练。

## 以后每次发布填写

- 开发日期、需求和确切 Git 提交：
- 自动测试／构建／电脑手机验证：
- 文件／依赖／配置／数据是否变动：
- 用户是否已执行、ECS 部署时间（北京时间）：
- `.deployed-commit`（有则记录）、健康检查和实际操作：
- 备份类型／位置、上一已验收版本、回退限制：
- 未验证事项：
