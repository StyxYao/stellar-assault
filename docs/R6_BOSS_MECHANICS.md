# R6 — Boss Mechanics

状态：**已实现，待完整五关与双人/LAN 实机验收**

## 核心交互

| Boss | 机制 | 预警 | 玩家应对 | 输出窗口 |
|---|---|---|---|---|
| VOID SOVEREIGN | CORE LOCK | 1.45s | 等装甲锁定结束 | 核心暴露 2.8s |
| ABYSS DEVOURER | DEVOUR | 1.45s | 抵抗吸力/拉开距离 | 全程可输出 |
| STAR BEHEMOTH | SIEGE CHARGE | 1.45s | 离开冲锋车道 | 冲锋结束回位 |
| SERAPHIC WINGS | RADIANT CAGE | 1.45s | 跟随移动安全带 | 光门期间仍可输出 |
| CHRONOS ECHO | ECHO LOCK | 1.45s | 离开记录位置 | 1.6s 记录点爆炸 |

## 设计约束

- 都有独立名称与 HUD 提示
- 都有 1.45s 预警
- 核心/装甲阶段会暂停普通弹幕模式
- 不是单纯加血量/弹速
- 不替代 Boss 原 phase/ult

## LAN

`World.snapshotFull()` 包含 `bossMech`，Host/Client 使用同一机制状态。

## 验收

- [x] 5 个 Boss 各一个核心机制
- [x] 预警/视觉/音效
- [x] Stage 1–4 Boss 运行无 page error
- [x] Stage 5 ECHO LOCK warning 正常
- [ ] 完整 Boss 战实机
- [ ] 双人/LAN 实机
