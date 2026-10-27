# R5 — Stage Mechanics

状态：**已实现，待完整关卡/双人实机验收**

## 机制

| 关卡 | 机制 | 预警 | 效果 | 安全设计 |
|---|---|---|---|---|
| 1 NEBULA | ION STORM | 1.55s 红色虚线柱 | 3 条电浆柱，0.68s | 5 条候选轨道中只选 3 条，保留两条空隙 |
| 2 STATION | RAIL CANNON | 1.55s 橙色横线 | 横向轨道炮，0.55s | 单条横向带，玩家可上下移动 |
| 3 SURFACE | DUST FRONT | 1.35s 沙尘线 | 3.2s 横向风推 | 不造成伤害，只改变走位 |
| 4 SANCTUM | LIGHT GATE | 1.55s 紫色光柱 | 单侧光门，0.68s | 中央始终保留安全区 |

## 接入点

- `startStage()` → `stageMechReset(stage)`
- `step()` → `updateStageMechanic(dt)`
- `drawScene()` → `drawStageMechanic()`
- LAN `World.snapshotFull()` / `restore()` 包含 `mech`，Host/Client 使用同一机制状态

## 验收

- [x] 四关都有独立预警/名称/视觉
- [x] 无不可躲弹幕
- [x] 机制不影响 Boss 战（只在 `state==='play'`）
- [x] LAN 快照包含机制状态
- [ ] 完整四关通关
- [ ] 双人/LAN 实机
