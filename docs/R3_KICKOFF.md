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
- P2 当前镜像 P1 的机体/变体（VECTOR/AEGIS/PHANTOM 都可玩）
- 2P KEYBOARD：P2 IJKL；P1 键盘
- P1 KB + P2 MOUSE：鼠标移动 P2，左键 P2 炸弹；P1 键盘
- P2 第二手柄左摇杆/D-Pad + B/X 炸弹
- P2 自动射击
- P2 独立 HP/LIFE HUD（右上）
- P2 独立死亡/短暂无敌/复位
- 敌人瞄准会在 P1/P2 中选最近目标
- 单机模式保持原路径

仍未实现：

- P2 独立机体/变体选择（当前镜像 P1）
- VECTOR 僚机 P2 视觉/射击
- P2 激光独立命中特效
- LAN/在线
- 双人专属平衡

## 验收

- [ ] P1/P2 都能移动/射击/技能
- [ ] 两个玩家都能死亡/复活
- [ ] 敌人不会只锁 P1
- [ ] 双人第一关可完成
- [ ] 单机 VECTOR/AEGIS/PHANTOM 不回归
- [ ] 触屏/手柄/键鼠不互相破坏

## 后续

- R3.1 LAN：Host/Join、输入上行、快照
- R3.2 在线：signaling + TURN/relay

详见 `docs/MULTIPLAYER_R3.md`。
