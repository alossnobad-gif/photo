# 保护等级离线候选数据

这是公开整理的候选版，不是完整官方现行名录。未逐项对照官方原件；不存在条目不代表没有保护等级。

| 输入 | 记录数 | 版本依据 | 实际读取的出处 |
| --- | ---: | --- | --- |
| 国保动物表 | 988 | 《国家重点保护野生动物名录》（2021年调整版） | [wildlife-map species_raw.json](https://github.com/RavenWang1103/wildlife-map/blob/a6f615d921cb807602f547e3ed91ae02caa7196b/data/species_raw.json) |
| 北京鸟类表 | 435 | 2021年国保、2023年三有名录 | [Birdle birds.json](https://github.com/Chocoer/birdle/blob/8fb66f58eefb8ba6189cf8483823ba6956d67888/server/src/data/birds.json) |

固定来源提交及原始文件 SHA-256 随来源快照保存，快照仅保留名称、学名、等级、类别和备注；不含上游图片或物种介绍。Birdle 使用 MIT 许可，本目录保存原许可。wildlife-map 无代码许可声明，本项目仅独立整理其公开名录事实，出处如上。

合并后 1,322 条记录，包含 8 条成组分类和 61 条适用种群限定，21 条等级冲突记录。元数据与来源覆盖以 `/api/protection-catalogue` 为准。国保表与地区鸟表不一致时不静默采用模型判断，而是显示未核实；“属所有种”等不能在没有权威分类关系表时自动推广到所有子物种。未知地区的地方保护、国际保护等级和植物名录不推断。

来源目录仍需官方复核；不能把当前整理表或其采集日期声称为已核验截至该日期的最新法规。要更新数据，在开发端执行 `npm run catalogue:update`，检查差异、来源版本及冲突，提交发布后由服务器 `git pull` 获取。统一快照 JSON 格式由 `build-protection-catalogue.js` 校验；最终生成表无需逐条写代码。
