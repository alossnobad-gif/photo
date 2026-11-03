# 自然图鉴

个人摄影图库、基础修图、物种图鉴与风光足迹。React + Vite 前端、Express 服务端，真实照片、收藏和任务保存在 `.data/`。

**新会话／新维护者从这里开始：[长期交接手册](docs/operations/HANDOFF.md)。无需找回聊天记录。**

| 需要了解 | 入口 |
| --- | --- |
| 阿里云服务器、目录、端口、配置位置、排障与接手步骤 | [交接手册](docs/operations/HANDOFF.md) |
| 手动更新命令、校验、回退和发布记录 | [发布手册](docs/operations/RELEASES.md) |
| 产品需求和不能破坏的规则 | [PRD](docs/product/PRD.md)、[功能清单](docs/product/FEATURES.md) |
| 每次迭代的测试和数据保护 | [维护要求](AGENTS.md)、[迭代规范](docs/product/ITERATION.md) |
| 历次需求、验证证据和已知问题 | [变更台账](docs/product/CHANGELOG.md) |
| 账号密码／HTTPS、RAW、百度网盘 | [HTTPS](docs/private-https.md)、[图库](docs/photo-library.md)、[网盘](docs/baidu-drive.md) |

已知生产入口为 `https://123.57.60.66`，项目 `/opt/photo`，服务 `nature-photo`。用户通过阿里云 Workbench 手动执行更新命令。Git 已推送、用户已部署、线上已验收是三种不同状态，以发布记录为准。不会自动部署。

## 本地开发

Node.js 22+，在项目根目录运行：

```bash
npm ci
npm run dev
```

开发默认 `0.0.0.0:3000`；生产默认仅 `127.0.0.1:3000`，由 Nginx 提供登录与 HTTPS。`/workspace/photo` 是当前开发环境路径，不是生产路径，也不是新会话必须采用的路径。

```bash
npm test
npm run build
```

真实数据从工作目录的 `.data/` 读取。测试使用临时数据；不要在真实生产目录运行开发服务、破坏性测试或示例初始化。界面改动还需电脑和手机浏览器验证。

仓库记录非敏感配置、规则和操作方法；密码、私钥、API Key、网盘令牌、真实照片和业务数据不进入 Git。配置文件位置见交接手册，Git 不能代替照片和配置的安全备份。

早期逐次追加的 README 已移至 [历史归档](docs/history/README-legacy.md)，不作为当前部署或功能状态依据。
