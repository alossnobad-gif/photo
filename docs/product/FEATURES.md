# 功能清单

更新：2026-10-14，代码基线 a4c2a92。已实现表示仓库有实现，不表示已确认当前服务器版本或真实数据全部正确。

| ID | 模块 / 能力 | 状态 | 代码 / 检查依据 |
| --- | --- | --- | --- |
| LIB-01 | 单张/多张导入，中文名，150 MB | 已实现 | server/photo-library.js；photo-library、photo-filename 测试 |
| LIB-02 | RAW / JPG 独立导入，索尼 A7R V | 有限支持 | LibRaw 需安装，docs/photo-library.md；实际相机格式已做过开发验证 |
| LIB-03 | 搜索、类型、提交状态、上传排序 | 已实现 | PhotoLibrary.jsx、library-recognition.js、library-sort.js；相关测试 |
| LIB-04 | 双类型状态，默认未提交，切页缓存 | 已实现，需持续回归 | PhotoLibrary.jsx；library-status 测试；切页浏览器检查 |
| META-01 | EXIF 机身/镜头/光圈/快门/ISO/焦距，缩略图信息水印 | 已实现，取决于原件是否有 EXIF | local-photo.js、camera-equipment.js、photo-equipment.js、CameraWatermark.jsx；camera-equipment 测试及 scripts/check-camera-ui.mjs |
| LIB-05 | 覆盖编辑、原件下载、删除/改名 | 已实现 | server/photo-library.js；photo-library 测试 |
| EDIT-01 | 可移动裁切框，原图比例，旋转翻转 | 已实现 | PhotoCropper.jsx、PhotoLibrary.jsx；浏览器操作检查 |
| EDIT-02 | 基础参数、滤镜、强度、对比重置 | 已实现 | photo-adjustments.js、photo-presets.js；像素测试 |
| EDIT-03 | 电脑宽窗口/手机编辑、竖图预览 | 已实现，需持续回归 | CSS / 浏览器 1440 与 390 宽验证 |
| QUE-01 | 明确物种/风光提交，任务回执 | 已实现 | recognition-queue.js；queue-entry 测试 |
| QUE-02 | 持久化，串行，重试，自动/手动入库 | 已实现 | recognition-queue.js；recognition-queue 测试 |
| QUE-03 | 单任务/全部停止，删除/批量删除 | 已实现 | recognition-queue.js、RecognitionQueue.jsx；相关测试 |
| QUE-04 | 已完成结果跳转 | 已实现但有已知问题 | 切导航后详情可能被重置，见 CHANGELOG.md |
| QUE-05 | 队列缓存缩略图及错误回退 | 已实现 | queue-thumbnail.test.js 使用真实 .data 结构 |
| AI-01 | 千问平台/百炼配置及专用提示词 | 已实现 | settings.js、recognition-options.js、recognition-result.js、landscapes.js |
| AI-02 | 图片压缩、关闭支持模型的深度思考 | 已实现 | recognition-image、recognition-options 测试 |
| AI-03 | 文件名辅助，不猜日期，地标依据 | 已实现，准确性依赖模型 | recognition-filename、photo-dates、landscapes 测试 |
| COL-01 | 物种去重、替换、人工编辑 | 已实现 | store.js；store、edit-species 测试 |
| COL-02 | 稀有度 / 保护等级，离线名录匹配 | 已实现，名录需版本维护 | protection-catalogue.js、catalogue 测试；data/catalogue/README.md |
| COL-03 | 分类搜索、拍摄/入库/稀有度/保护排序 | 已实现 | collection-sort.js；collection-sort 测试 |
| COL-04 | 统计、目标、探索记录、分享海报 | 已实现 | Statistics.jsx、collection-stats.js、share-poster.js |
| SHARE-01 | 生成前筛选/排序、物种勾选、自定义封面与标题 | 已实现 | ShareDialog.jsx、share-selection.js、share-image.js；筛选/图片加载测试；scripts/check-share-ui.mjs（原图不可用场景） |
| LAN-01 | 风光识别，标题文案，日期，地点编辑 | 已实现，准确性依赖模型 | Landscapes.jsx、landscapes.js；landscapes 测试 |
| LAN-02 | 城市补省份、题材、筛选、解锁统计 | 已实现 | city-provinces.js、landscape-progress.js；对应测试 |
| LAN-03 | 删除记录，详情底部入口 | 已实现 | Landscapes.jsx、landscapes.js；浏览器检查 |
| LAN-04 | 改为物种修复 / 卡片批量删除入口 | 已撤下 | 后端兼容已有修复任务，不恢复前端入口 |
| PERF-01 | 列表缓存缩略图、JSON 压缩 | 已实现 | photo-preview.js、json-compression.js；photo-preview 测试 |
| PERF-02 | 空闲约 15 秒同步，后台暂停轮询 | 已实现 | main.jsx、PhotoLibrary.jsx、Landscapes.jsx；人工切页检查 |
| SEC-01 | 单账户密码、IP 自签 HTTPS | 已实现，证书有信任限制 | docs/private-https.md；https-proxy 测试 |
| OPS-01 | 手动发布，保留 .data，RAW 安装脚本 | 已实现 | scripts/、docs/photo-library.md |
| ADM-01 | 独立最高权限后台、管理员角色 | 未实现 / 未确认实施范围 | 当前只有个人账户；此前提出方案尚未开发 |
| OPS-02 | 自动异地备份与恢复演练 | 未实现 | 有备份建议，尚无已验证自动任务 |
| OPS-03 | 定时自动代码更新 | 用户取消 | 保持手动更新 |
| PRO-01 | 专业 RAW、图层/蒙版/镜头校正 | 未实现 | 当前基本修图，不作为既有能力宣传 |
| BIZ-01 | 多租户、付费、商业化服务 | 不在当前范围 | 当前先长期本人使用 |

| CLOUD-01 | 百度网盘 OAuth / 目录分页 / 选片导入 | 用户确认可列目录；预览/实际导入待线上核对 | baidu-drive.js、BaiduDrive.jsx；模拟接口测试及 check-baidu-ui.mjs；目录手动读取、缓存缩略图、宽窗口平铺/列表、独立大图与键盘切换、可拖拽分栏、点击缩放/自定义比例与拖动平移；非后台实时同步 |

## 长期需要保留的检查点

两种类型提交绝不能串线；同一照片状态独立；.85 边界；人工核实信息；首次发现时间；中文名；EXIF；编辑稳定引用；删除不误删；列表缩略图；隐藏目录权限；手机/电脑；切页恢复；服务器数据备份与权限。
