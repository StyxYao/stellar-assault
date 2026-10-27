# R4 — Content Audit

状态：**审计完成，R5/R6 待实施**

## 5 关

| 关卡 | 现有主题 | 现有差异 | 审计结论 | R5 建议机制 |
|---|---|---|---|---|
| 1 NEBULA | 星云 / 黑hole | 标准 warmup + bridge，基础阵型 | 基准关，机制差异不足 | 星云可见度/彗星预警 |
| 2 STATION | 空间站 | 换背景、波次结构相同 | 仍偏“换皮” | 舱门/轨道炮/结构遮挡 |
| 3 SURFACE | 地表 | 换背景、波次结构相同 | 仍偏“换皮” | 风/沙尘/地表裂隙 |
| 4 SANCTUM | 圣殿 | Aegis Warden / Rail Lancer / Mine Seeder，建筑构图 | 有独立敌机与视觉 | 圣殿轨道/光幕/掩体 |
| 5 TIME'S END | 时间尽头 | 无 warmup、六种独立敌机、Hedron 融合流程 | 独立机制最多 | 时间回溯/几何重构 |

### 关卡结论

- 1–3 共用 `WARMUP + BRIDGE` 和大部分波次模板。
- 4 有独立敌机和圣殿视觉。
- 5 是真正独立的终局关卡。
- **R5 必须给 1–4 各补一个可感知的主机制**，不能只换背景。

## 5 Boss

| Boss | 移动 | 现有攻击 | 审计结论 | R6 建议核心交互 |
|---|---|---|---|---|
| VOID SOVEREIGN | sine | aim / ring / laser / ult | 基础全能型 | 核心暴露窗口/环层破坏 |
| ABYSS DEVOURER | wide | aim / ring / laser / ult | 弹幕型 | 吞噬/反噬/安全区收缩 |
| STAR BEHEMOTH | dash | aim / ring / laser / ult | 冲撞型 | 冲锋轨迹/护甲破口 |
| SERAPHIC WINGS | wide | aim / ring / laser / ult | 大型多段 | 羽翼破坏/光幕相位 |
| CHRONOS ECHO | wide | aim / ring / laser / ult | 终局融合 | 时间回溯/阶段重演 |

### Boss 结论

- 5 个 Boss 的数值、移动、图案组合不同，但大多共享 `patterns[0,1]` 的 aim/ring/laser/ult 框架。
- 还没有“每个 Boss 一个必须改变走位/输出窗口的机制”。
- **R6 需要为每个 Boss 增加一个可读、可躲、可练的核心交互**，而不是只调弹速/血量。

## R5/R6 验收门槛

- 有预警
- 有音效/视觉反馈
- 有安全缺口
- 不产生不可躲弹幕
- 不破坏死亡经济
- 本地单人/双人、LAN 2P 都可完成

## 后续

- R5：关卡机制实现
- R6：Boss 机制实现
- R7：Rank / Medal / Score
