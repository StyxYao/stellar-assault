# R3 Kickoff — Two-Player Co-op

状态：**R3.0 启动**  
日期：2026-10-26  
目标：先做同设备双人垂直切片，再扩 LAN，再扩在线。

## 本轮只做 R3.0

- 同一设备、同一屏幕
- P1 键鼠/手柄，P2 手柄
- 共享敌人/Boss/弹幕
- 各自生命、技能
- 第一关可完成
- 单机模式不回归

## 第一冲刺（2 周量级）

1. `World` 容器：enemies/boss/bullets/items 不再散落全局
2. `PlayerSlot`：P1/P2 的 x/y/HP/lives/bombs/ship
3. 输入帧：`{tick, playerId, moveX, moveY, fire, skill}`
4. 本地 P2 输入：第二手柄 / 键盘分区
5. 双人 HUD：两套生命/技能
6. 敌人目标选择：最近玩家或威胁值
7. 死亡/复活：各自生命，不做队友复活
8. 第一关双人冒烟

## 明确不做

- LAN
- 在线
- 4 人
- PvP
- 队友复活
- 双人专属关卡

## 代码边界

- 不改 R3.0 以外的 Boss 机制
- 不重做死亡经济
- 不在 legacy 协调器里堆第二套 player 逻辑
- 新逻辑优先进入 `src/game/` 模块

## 当前第一切片（本地可玩）

已实现：

- 菜单开始确认内 CO-OP 三态：OFF / 2P KEYBOARD / P1 KB + P2 MOUSE
- P2 可独立选择 VECTOR/AEGIS/PHANTOM 和变体（开始确认内 P2 SHIP / P2 VAR）
- P1/P2 不能使用同一个变体；冲突时 P2 自动跳到下一个可用变体
- 2P KEYBOARD：P2 IJKL；P1 键盘
- P1 KB + P2 MOUSE：鼠标移动 P2，左键 P2 炸弹；P1 键盘
- P2 第二手柄左摇杆/D-Pad + B/X 炸弹
- P2 自动射击
- P2 独立 HP/LIFE HUD（右上）
- P2 独立死亡/短暂无敌/复位
- 敌人瞄准会在 P1/P2 中选最近目标
- 单机模式保持原路径

仍未实现：

- P2 独立机体/变体选择已完成；后续补 P2 选机大图
- 双人第一关完整平衡仍需更多样本
- LAN/在线
- 双人专属平衡

## 验收

- [x] P1/P2 都能移动/射击/技能
- [x] 两个玩家都能死亡/复活（P2 独立生命/复活已测）
- [x] 敌人瞄准会在 P1/P2 中选择最近目标
- [ ] 双人第一关完整无干预清关（目前只过强制 Boss 流程）
- [x] 单机 VECTOR/AEGIS/PHANTOM 不回归（冒烟）
- [x] 触屏/手柄/键鼠不互相破坏（键鼠/鼠标模式已测）

## 后续

本机双人功能已收口；剩余是本机完整关平衡和 `World / PlayerSlot` 重构。

- R3.1 LAN：Host/Join、输入上行、快照
- R3.2 在线：signaling + TURN/relay

详见 `docs/MULTIPLAYER_R3.md`。
